import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const artifactPrefix=process.env.MONOPOLY_ARTIFACT_PREFIX??'task1';
const url=process.env.MONOPOLY_PRODUCTION_URL??'http://127.0.0.1:4173';
const browser=await chromium.launch({channel:process.env.MONOPOLY_BROWSER??'chrome',headless:true});
const errors=[],phases=new Set();
try {
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2});
 // Seeded browser randomness (also used by rendering); no store/snapshot injection.
 await context.addInitScript(()=>{let seed=1042026;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(url);
 await page.getByRole('button',{name:'4 người',exact:true}).click();
 await page.getByRole('button',{name:'Vào bàn chơi'}).click();
 await page.locator('.three-board-host canvas').waitFor();
 assert.equal(await page.locator('[data-tile]').count(),40);
 await page.getByRole('button',{name:'ĐỔ XÚC XẮC',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.play-board')?.dataset.gamePhase==='MOVING');
 assert.equal(await page.locator('.three-board-host').getAttribute('data-camera-mode'),'follow');
 await page.emulateMedia({reducedMotion:'reduce'});
 let rolls=1,extraRolls=0,ends=0,buys=0,events=0,rents=0;
 // UI rendering also uses randomness for geometry IDs. Continue the real game
 // until the required rent/event paths occur, rather than assuming one seed
 // reaches them within exactly 24 turns after every presentation refactor.
 for(let step=0;step<6000&&ends<64&&(ends<24||events===0||rents===0);step++){
  const phase=await page.locator('.play-board').getAttribute('data-game-phase');phases.add(phase);
  if(phase==='WAITING_FOR_ROLL'){await page.getByRole('button',{name:'ĐỔ XÚC XẮC',exact:true}).click();rolls++;}
  else if(phase==='PROPERTY_DECISION'){
   const buy=page.getByRole('button',{name:/^Mua ·/});
   if(await buy.isEnabled()){await buy.click();buys++;}else await page.getByRole('button',{name:'Bỏ qua',exact:true}).click();
  }
  else if(phase==='OPTIONAL_ACTIONS'){
   const end=page.getByRole('button',{name:'KẾT THÚC LƯỢT →',exact:true});
   if(await end.count()){
    const previous=await page.locator('.player-chip.active .player-copy strong').innerText();
    await end.click();
    await page.waitForFunction(name=>document.querySelector('.player-chip.active .player-copy strong')?.textContent!==name,previous);
    ends++;
   }else{await page.getByRole('button',{name:'ĐỔ THÊM →',exact:true}).click();extraRolls++;}
  }
  else if(phase==='EVENT'){await page.getByRole('button',{name:'Khám phá tiếp',exact:false}).click();events++;}
  else if(phase==='RENT'){await page.getByRole('button',{name:'Trả tiền thuê',exact:true}).click();rents++;}
  else if(phase==='UTILITY_ROLL')await page.getByRole('button',{name:'Đổ để tính thuê',exact:true}).click();
  else if(phase==='JAIL_DECISION')await page.getByRole('button',{name:/^Trả 50 Tr$/}).click();
  else if(phase==='LIQUIDATION'){
   const sell=page.getByRole('button',{name:'Bán công trình nhóm',exact:true}).first();
   if(await sell.count())await sell.click();else await page.getByRole('button',{name:/^Thanh lý/}).filter({visible:true}).first().click();
  }
  else if(phase==='BANKRUPTCY')await page.getByRole('button',{name:'Tiếp tục',exact:false}).click();
  else if(phase==='GAME_OVER')break;
  else await page.waitForTimeout(20);
 }
 assert.ok(ends>=24);assert.ok(buys>0);assert.ok(events>0);assert.ok(rents>0);
 console.log(JSON.stringify({checkpoint:'after gameplay loop',ends,rolls,buys,events,rents,phase:await page.locator('.play-board').getAttribute('data-game-phase')}));
 // Paying the last required rent can stop this loop in OPTIONAL_ACTIONS.
 // That phase already permits inspection; it needs a user action to end the turn.
 await page.waitForFunction(()=>['WAITING_FOR_ROLL','OPTIONAL_ACTIONS','JAIL_DECISION'].includes(document.querySelector('.play-board')?.dataset.gamePhase));
 // Navigation is intentionally unavailable during a mandatory jail decision.
 // Finish that real UI action before inspecting the log at the end of the run.
 if(await page.locator('.play-board').getAttribute('data-game-phase')==='JAIL_DECISION'){
  await page.getByRole('button',{name:'Trả 50 Tr',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.play-board')?.dataset.gamePhase==='WAITING_FOR_ROLL');
 }
 await page.getByRole('button',{name:'Nhật ký',exact:true}).click();
 assert.ok(await page.locator('.game-log li').count()>24);
 // Rotate while a native dialog is open and recover the same actionable panel.
 await page.setViewportSize({width:390,height:844});
 await page.getByText('Hãy xoay ngang điện thoại',{exact:true}).waitFor({state:'visible'});
 await page.setViewportSize({width:844,height:390});
 await page.getByRole('button',{name:'Đóng',exact:true}).click();
 await page.waitForTimeout(200);
 assert.equal(await page.locator('canvas').count(),1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight),false);
 await page.screenshot({path:`docs/${artifactPrefix}-production-mobile.png`});
 assert.deepEqual(errors,[]);
 const report={testedAt:new Date().toISOString(),url,browser:await browser.version(),environment:'Built production bundle on desktop Chrome with mobile viewport/touch emulation. No physical phone measurement.',method:'All actions through UI, seeded browser Math.random, no store imports or snapshot injection. Each ended turn waits for a changed current-player name.',completedTurns:ends,rolls,extraRolls,buys,events,rents,phases:[...phases],checks:['40-tile WebGL board','actual roll and camera follow','24 observed UI turn transitions with purchases/events/rent','log dialog and portrait rotation recovery','no page scroll','no console errors'],errors};
 await writeFile(`docs/${artifactPrefix}-production-checks.json`,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
