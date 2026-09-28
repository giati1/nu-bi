import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
// Uses the developer's installed Playwright. Browser tooling is optional for the runner.
const require=createRequire(import.meta.url);
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:8010');
  await page.getByRole('button',{name:/^NOMI text toolkit/}).click();
  await page.getByRole('heading',{name:'Coding studio',exact:true}).waitFor();
  await page.getByRole('button',{name:'Refresh files',exact:true}).click();
  await page.getByRole('button',{name:'slug.mjs',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('file-preview').textContent.includes('slug'));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}`);
 }
 assert.deepEqual(errors,[]);await page.screenshot({path:'.ai-world/coding-studio.png',fullPage:true});
 console.log('Coding controls, project selection, file viewing, desktop/mobile layout and browser scripts passed.');
}finally{await browser.close();}
