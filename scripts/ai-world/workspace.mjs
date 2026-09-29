import path from 'node:path';
import { mkdir, lstat, readdir, readFile, writeFile, realpath, rename } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const allowedExtensions = new Set(['.js','.mjs','.cjs','.ts','.tsx','.jsx','.json','.html','.css','.md','.txt','.py','.toml','.yml','.yaml','.csv']);
export function validRelative(name) {
  if (typeof name !== 'string' || name.length > 200 || !name || name.includes('\\') || name.includes(':') || path.isAbsolute(name) || name.split('/').some(p => !p || p === '..' || p.startsWith('.') || /[<>"|?*\x00-\x1f]/.test(p) || /[ .]$/.test(p) || /^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i.test(p))) throw new Error('Use a relative project path without hidden files or traversal.');
  if (!allowedExtensions.has(path.extname(name).toLowerCase())) throw new Error('Unsupported source file type.');
  return name;
}
export class Workspace {
  constructor(base) { this.base = path.resolve(base); }
  async root(id) {
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) throw new Error('Invalid project ID.');
    await mkdir(this.base, { recursive: true });
    if ((await lstat(this.base)).isSymbolicLink()) throw new Error('Workspace base cannot be a link.');
    const root = path.join(this.base, id); await mkdir(root, { recursive: true });
    if ((await lstat(root)).isSymbolicLink()) throw new Error('Workspace cannot be a link.');
    return await realpath(root);
  }
  async resolve(id, name) {
    validRelative(name);
    const root = await this.root(id);
    let current = root;
    for (const part of name.split('/')) {
      current = path.join(current, part);
      try { const stat = await lstat(current); if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile()) || (stat.isFile() && stat.nlink > 1)) throw new Error('Links and special files are not allowed.'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    return current;
  }
  async files(id) {
    const root = await this.root(id), result = [];
    async function walk(dir, prefix = '') {
      for (const item of await readdir(dir, { withFileTypes: true })) {
        if (item.name.startsWith('.') || ['node_modules','__pycache__'].includes(item.name) || item.isSymbolicLink()) continue;
        if (result.length >= 200) throw new Error('Project exceeds 200 files.');
        const name = prefix + item.name;
        if (item.isDirectory()) { if (name.split('/').length > 8) throw new Error('Project tree is too deep.'); await walk(path.join(dir,item.name), name + '/'); }
        else if (item.isFile() && allowedExtensions.has(path.extname(name))) result.push(name);
      }
    }
    await walk(root); return result.sort();
  }
  async read(id, name) { const file = await this.resolve(id,name); const stat = await lstat(file); if (stat.size > 64000) throw new Error('File exceeds 64 KB.'); return await readFile(file,'utf8'); }
  async write(id, name, content) {
    if (typeof content !== 'string' || Buffer.byteLength(content) > 32000) throw new Error('Write at most 32 KB per file.');
    const file = await this.resolve(id,name); const files = await this.files(id);
    if (!files.includes(name) && files.length >= 200) throw new Error('Project file limit reached.');
    let total = 0; for (const entry of files) total += (await lstat(await this.resolve(id,entry))).size;
    if (total + Buffer.byteLength(content) > 4000000) throw new Error('Project exceeds 4 MB.');
    const previous = await readFile(file,'utf8').catch(e => { if (e.code !== 'ENOENT') throw e; return null; });
    if (previous !== null) {
      const history = path.resolve(this.base, '..', 'code-history', id); await mkdir(history, {recursive:true});
      await writeFile(path.join(history, randomUUID()+'.json'), JSON.stringify({path:name,content:previous,at:new Date().toISOString()}));
    }
    await mkdir(path.dirname(file), {recursive:true});
    // Resolve again after directory creation; never follow links created by a prior container.
    await this.resolve(id,name);
    const temp = path.join(path.dirname(file), `nomi-${randomUUID()}.tmp`);
    await writeFile(temp, content, {flag:'wx'}); await rename(temp,file);
    return { path:name, bytes:Buffer.byteLength(content), replaced:previous !== null };
  }
  async import(id, source) {
    if (typeof source !== 'string' || !path.isAbsolute(source)) throw new Error('Choose an absolute source-folder path.');
    const src = await realpath(source), root = await this.root(id);
    if (root.startsWith(src + path.sep) || src === root) throw new Error('Cannot import a parent of the workspace.');
    if ((await this.files(id)).length) throw new Error('Import into a new, empty project.');
    const staged = []; let bytes = 0;
    async function walk(dir,prefix='') {
      for (const item of await readdir(dir,{withFileTypes:true})) {
        if (item.name.startsWith('.') || ['node_modules','dist','build','coverage','__pycache__','venv'].includes(item.name) || item.isSymbolicLink()) continue;
        const name=prefix+item.name;
        if (item.isDirectory()) { if (name.split('/').length < 8) await walk(path.join(dir,item.name),name+'/'); }
        else if (item.isFile()) {
          try { validRelative(name); } catch { continue; }
          if (/secret|credential|token|private.?key/i.test(item.name)) continue;
          const stat=await lstat(path.join(dir,item.name)); if(stat.nlink>1 || stat.size>32000) continue;
          if(staged.length>=200 || (bytes+=stat.size)>4000000) throw new Error('Import exceeds 200 files or 4 MB. Choose a smaller source folder.');
          staged.push([name,await readFile(path.join(dir,item.name),'utf8')]);
        }
      }
    }
    await walk(src); for(const [name,content] of staged) await this.write(id,name,content);
    return { imported:staged.length, skipped:'Hidden files, dependency folders, large files, links and credential-named files are excluded.' };
  }
}
export function processResult(program,args,{signal,timeout=90000,maxOutput=16000}={}) {
  return new Promise((resolve,reject)=>{
    if(signal?.aborted) return reject(new Error('Stopped.'));
    const child=spawn(program,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});
    let output='',timedOut=false,overflow=false;
    const consume=chunk=>{ const text=chunk.toString(); if(output.length+text.length>maxOutput){overflow=true;child.kill();} output=(output+text).slice(0,maxOutput); };
    child.stdout.on('data',consume);child.stderr.on('data',consume);
    const abort=()=>child.kill(); signal?.addEventListener('abort',abort,{once:true});
    const timer=setTimeout(()=>{timedOut=true;child.kill();},timeout);
    const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);};
    child.on('error',e=>{cleanup();reject(e);}); child.on('close',code=>{cleanup();resolve({exitCode:code,output,timedOut,overflow,aborted:Boolean(signal?.aborted)});});
  });
}
export async function runTests(workspace,id,runtime,signal) {
  const files=await workspace.files(id);
  if(!files.some(f=>runtime==='python'?/(^|\/)test[^/]*\.py$/.test(f):/\.(test|spec)\.[cm]?js$/.test(f))) throw new Error('Write a test file before running tests.');
  const root=await workspace.root(id), name='nomi-code-'+randomUUID();
  const image=runtime==='python'?'python:3.12-alpine':'node:22-alpine';
  const command=runtime==='python'?['python','-m','unittest','discover','-v']:['node','--test'];
  // Read-only mount: generated tests cannot mutate host project files or introduce links.
  const args=['run','--rm','--pull=never','--name',name,'--network=none','--read-only','--cap-drop=ALL','--security-opt=no-new-privileges','--pids-limit=128','--memory=512m','--cpus=1','--user=1000:1000','--tmpfs','/tmp:rw,noexec,nosuid,size=64m','--mount',`type=bind,source=${root},target=/workspace,readonly`,'--workdir','/workspace',image,...command];
  try { const result=await processResult('docker',args,{signal}); return {...result,command:command.join(' '),image,passed:result.exitCode===0&&!result.timedOut&&!result.overflow&&!result.aborted}; }
  finally { await processResult('docker',['rm','-f',name],{timeout:10000}).catch(()=>{}); }
}
