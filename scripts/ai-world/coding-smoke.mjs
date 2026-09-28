import assert from 'node:assert/strict';
import path from 'node:path';
import {Workspace,runTests} from './workspace.mjs';
import {searchWeb,readWeb,askExpert} from './research.mjs';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.env.NOMI_ENV_ROOT||process.cwd());
const w=new Workspace(path.resolve('.ai-world/smoke-workspaces'));
await w.write('node-smoke','sum.mjs','export const sum=(a,b)=>a+b;');
await w.write('node-smoke','sum.test.mjs',"import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {sum} from './sum.mjs';test('sum handles signs',()=>{assert.equal(sum(2,3),5);assert.equal(sum(-1,1),0)});test('sandbox has no host keys or write access',()=>{assert.equal(process.env.OPENAI_API_KEY,undefined);assert.throws(()=>fs.writeFileSync('/workspace/escape.txt','bad'));assert.throws(()=>fs.writeFileSync('/root/escape.txt','bad'));});");
const nodeResult=await runTests(w,'node-smoke','node');assert.equal(nodeResult.passed,true,JSON.stringify(nodeResult));
await w.write('python-smoke','test_math.py','import unittest\nclass Checks(unittest.TestCase):\n def test_math(self):\n  self.assertEqual(sum([1, 2, 3]), 6)\n');
const pyResult=await runTests(w,'python-smoke','python');assert.equal(pyResult.passed,true,JSON.stringify(pyResult));
const search=await searchWeb('node assert test');assert.ok(search.sources.length>0,JSON.stringify(search));
const page=await readWeb('https://nodejs.org/api/test.html');assert.ok(page.text.length>100);
console.log(JSON.stringify({nodeTests:nodeResult.passed,pythonTests:pyResult.passed,searchResults:search.sources.length,documentationCharacters:page.text.length}));
if(process.argv.includes('--expert')){const advice=await askExpert('A JavaScript add(a,b) function returns a-b. The assertion add(2,3) === 5 fails. Suggest a fix in one sentence.','A synthetic smoke test; no private source.',AbortSignal.timeout(60000));assert.ok(advice.advice.length>0);console.log(JSON.stringify({expert:'responded',model:advice.model,usage:advice.usage}));}
