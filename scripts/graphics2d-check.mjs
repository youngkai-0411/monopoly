import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.env.MONOPOLY_GRAPHICS_URL??'http://127.0.0.1:5173';
const browser=await chromium.launch({channel:process.env.MONOPOLY_BROWSER??'chrome',headless:true});
const errors=[],viewports=[];
try{
 const page=await browser.newPage({viewport:{width:844,height:390}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/?graphics=2');await page.locator('.pixi-board-host canvas').waitFor();
 for(const [width,height]of [[568,320],[844,390],[1024,768]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(200);
  const tiles=await page.locator('.scene-tile').count();assert.equal(tiles,40);
  assert.equal(await page.locator('.scene-tile.property').count(),28);
  const scroll=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight);assert.equal(scroll,false);
  viewports.push({width,height,tiles,scroll});
 }
 await page.setViewportSize({width:844,height:390});await page.getByRole('button',{name:'THỬ XÚC XẮC',exact:true}).click();await page.waitForTimeout(2500);
 assert.equal(await page.locator('.roll-button:disabled').count(),0);
 await page.evaluate(()=>document.querySelector('.pixi-board-host canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
 await page.locator('.board-grid').waitFor();assert.equal(await page.locator('.tile').count(),40);
 assert.deepEqual(errors,[]);
 await writeFile('docs/graphics2d-v2-checks.json',JSON.stringify({testedAt:new Date().toISOString(),url:base+'/?graphics=2',note:'Historical art study only; real gameplay is covered by game:check.',viewports,diceMovement:true,contextFallback:true,errors},null,2)+'\n');
 console.log('Legacy 2D study: 40 tiles, animation and DOM fallback passed.');
}finally{await browser.close();}
