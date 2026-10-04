import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {createServer} from 'vite';
const artifactPrefix=process.env.MONOPOLY_ARTIFACT_PREFIX??'task1';
const base=process.env.MONOPOLY_GAME_URL??'http://127.0.0.1:5173';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
const {createInitialGame}=await server.ssrLoadModule('/src/game/engine/setup.ts');
const {reduceGame}=await server.ssrLoadModule('/src/game/engine/actions.ts');
const {GROUPS}=await server.ssrLoadModule('/src/game/data/groups.ts');
const {CARDS}=await server.ssrLoadModule('/src/game/data/cards.ts');
const browser=await chromium.launch({channel:process.env.MONOPOLY_BROWSER??'chrome',headless:true});
const errors=[],checks=[],viewports=[];
const fresh=(count=2)=>{const g=createInitialGame(['Nghĩa','Kai','An','Linh'].slice(0,count));g.phase='OPTIONAL_ACTIONS';return g;};
try{
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const capture=async path=>{await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(320);await page.screenshot({path});};
 await page.goto(base);
 await page.getByRole('button',{name:'4 người',exact:true}).click();
 await page.getByRole('button',{name:'Vào bàn chơi'}).click();
 await page.locator('.three-board-host canvas').waitFor();
 await page.waitForTimeout(250);
 for(const [width,height]of [[568,320],[667,375],[844,390],[852,393],[896,414],[915,412],[932,430],[1024,768],[1440,900]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(950);
  const result=await page.evaluate(()=>{
   const host=document.querySelector('.three-board-host'),canvas=document.querySelector('.play-canvas').getBoundingClientRect();
   const rects=[...document.querySelectorAll('.play-camera,.play-actions,.secondary-actions')].map(el=>el.getBoundingClientRect());
   return {width:innerWidth,height:innerHeight,tiles:host.querySelectorAll('[data-tile]').length,land:host.querySelectorAll('[data-kind=LAND]').length,railroads:host.querySelectorAll('[data-kind=RAILROAD]').length,utilities:host.querySelectorAll('[data-kind=UTILITY]').length,fullBoardFits:host.dataset.overviewFits==='true',canvasCount:document.querySelectorAll('canvas').length,drawCalls:Number(host.dataset.drawCalls),triangles:Number(host.dataset.triangles),pageScroll:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,canvasShare:Number((canvas.width*canvas.height/(document.querySelector('.play-board').clientWidth*document.querySelector('.play-board').clientHeight)).toFixed(2)),overviewClear:host.dataset.overviewClear==='true',tileCentersClear:JSON.parse(host.dataset.tileScreens).every(p=>{const el=document.elementFromPoint(canvas.left+p.x,canvas.top+p.y);return el?.tagName==='CANVAS';}),controlsFit:rects.every(r=>r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1),primaryHeight:document.querySelector('.play-actions .roll-button').getBoundingClientRect().height};
  });
  assert.equal(result.tiles,40);assert.equal(result.land,22);assert.equal(result.railroads,4);assert.equal(result.utilities,2);
  assert.equal(result.fullBoardFits,true);assert.equal(result.pageScroll,false);assert.ok(result.canvasShare>=.85);assert.equal(result.overviewClear,true);assert.equal(result.tileCentersClear,true);assert.equal(await page.locator('.play-location').count(),0);assert.equal(await page.locator('.play-actions .secondary-actions').count(),0);assert.equal(result.controlsFit,true);assert.equal(result.canvasCount,1);assert.ok(result.primaryHeight>=48);
  viewports.push(result);
  if(width===844)await capture(`docs/${artifactPrefix}-gameplay-mobile.png`);
  if(width===568)await capture(`docs/${artifactPrefix}-gameplay-small-mobile.png`);
  if(width===1024)await capture(`docs/${artifactPrefix}-gameplay-tablet.png`);
  if(width===1440)await capture(`docs/${artifactPrefix}-gameplay-desktop.png`);
 }
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(1800);
 const frames=Number(await page.locator('.three-board-host').getAttribute('data-render-count'));await page.waitForTimeout(500);
 assert.equal(Number(await page.locator('.three-board-host').getAttribute('data-render-count')),frames);checks.push('idle zero renders');
 await page.getByRole('button',{name:'ĐỔ XÚC XẮC',exact:true}).click();
 await page.evaluate(()=>document.querySelector('.roll-button')?.click()); // A disabled native second click must do nothing.
 await page.waitForFunction(()=>document.querySelector('.play-board')?.dataset.gamePhase==='MOVING');
 assert.equal(await page.locator('.three-board-host').getAttribute('data-camera-mode'),'follow');
 await capture(`docs/${artifactPrefix}-follow-mobile.png`);checks.push('real roll, double-input protection, camera follows movement');

 const install=async(game)=>{
  await page.evaluate(async()=>{const {useGameStore}=await import(performance.getEntriesByType('resource').find(e=>e.name.includes('/src/store/gameStore.ts')).name);useGameStore.getState().reset();});
  await page.getByRole('button',{name:'Vào bàn chơi'}).waitFor();
  await page.evaluate(async snapshot=>{const {useGameStore}=await import(performance.getEntriesByType('resource').find(e=>e.name.includes('/src/store/gameStore.ts')).name);useGameStore.setState({game:snapshot,error:null,locked:false});},game);
  await page.locator('.three-board-host canvas').waitFor();await page.waitForTimeout(150);
 };
 const snapshot=()=>page.evaluate(async()=>{const {useGameStore}=await import(performance.getEntriesByType('resource').find(e=>e.name.includes('/src/store/gameStore.ts')).name);return useGameStore.getState().game;});
 const select=async(index)=>{const button=page.locator('[data-tile="'+index+'"]');await button.focus();await button.press('Enter');await page.getByRole('button',{name:'Xem chi tiết ↗',exact:true}).click();};
 for(const [index,id]of [[1,'ca-mau'],[5,'ga-sai-gon'],[12,'dien-luc']]){
  const g=fresh();g.players[0].position=index;g.phase='RESOLVING_TILE';await install(g);
  await page.getByRole('button',{name:/^Mua ·/}).click();const state=await snapshot();assert.equal(state.properties[id].ownerId,'player-1');checks.push('UI buy '+id);
 }
 {
  const g=fresh();g.players[0].position=12;g.properties['dien-luc'].ownerId='player-2';g.properties['cap-nuoc'].ownerId='player-2';g.phase='RESOLVING_TILE';await install(g);
  await page.getByRole('button',{name:'Đổ để tính thuê',exact:true}).click();
  let state=await snapshot();assert.equal(state.players[0].position,12);assert.equal(state.rent.amount,state.rentDice.total*10);
  const amount=state.rent.amount;await page.getByRole('button',{name:'Trả tiền thuê',exact:true}).click();state=await snapshot();assert.equal(state.players[0].money,1500-amount);checks.push('UI utility roll and rent transfer');
 }
 {
  const g=fresh();g.players[0].position=10;g.players[0].jailed=true;g.phase='JAIL_DECISION';await install(g);
  await capture(`docs/${artifactPrefix}-jail-mobile.png`);await page.getByRole('button',{name:'Trả 50 Tr',exact:true}).click();
  const state=await snapshot();assert.equal(state.players[0].jailed,false);assert.equal(state.players[0].money,1450);checks.push('UI jail payment');
 }
 {
  const g=fresh();g.players[0].money=10000;for(const id of ['ca-mau','can-tho'])g.properties[id].ownerId='player-1';
  await install(g);
  for(let level=1;level<=5;level++)for(const [index,id]of [[1,'ca-mau'],[3,'can-tho']]){
   await select(index);await page.getByRole('button',{name:/^Xây ·/}).click();assert.equal((await snapshot()).properties[id].level,level);
   if(level===5&&id==='ca-mau')await capture(`docs/${artifactPrefix}-property-mobile.png`);
   await page.getByRole('button',{name:'Đóng',exact:true}).click();
  }
  const state=await snapshot();assert.deepEqual(state.buildingBank,{houses:32,hotels:10});checks.push('UI full set, even building through two hotels');
 }
 {
  const g=fresh();const card=CARDS.find(c=>c.effectType==='NEAREST_RAILROAD');g.players[0].position=7;g.eventCardId=card.id;g.chanceDeck.drawPile=g.chanceDeck.drawPile.filter(id=>id!==card.id);g.phase='EVENT';await install(g);
  await page.getByRole('button',{name:'Khám phá tiếp',exact:false}).click();await page.waitForFunction(()=>document.querySelector('.play-board')?.dataset.gamePhase==='PROPERTY_DECISION');
  assert.equal((await snapshot()).players[0].position,15);checks.push('UI event movement resolves nearest railroad');
 }
 {
  const g=fresh();g.players[0].money=0;for(const id of ['ca-mau','can-tho']){g.properties[id].ownerId='player-1';g.properties[id].level=1;}g.buildingBank.houses=30;g.properties['ha-noi'].ownerId='player-2';g.players[0].position=39;g.phase='RESOLVING_TILE';await install(g);
  await page.getByRole('button',{name:'Trả tiền thuê',exact:true}).click();await page.getByRole('button',{name:'Bán công trình nhóm',exact:true}).first().click();
  assert.equal((await snapshot()).phase,'OPTIONAL_ACTIONS');checks.push('UI debt sells buildings and resumes payment');
 }
 {
  const g=fresh();g.players[0].money=0;g.players[0].position=4;g.phase='RESOLVING_TILE';await install(g);
  await page.getByRole('button',{name:'Tiếp tục',exact:false}).click();await page.getByText('Kai chiến thắng!',{exact:true}).waitFor();await capture(`docs/${artifactPrefix}-winner-mobile.png`);checks.push('UI bankruptcy and last-player-standing');
 }
 await install(fresh());
 await page.getByRole('button',{name:'Thẻ',exact:true}).click();await page.getByText('Bạn chưa giữ thẻ ra tù.',{exact:false}).waitFor();await page.getByRole('button',{name:'Đóng',exact:true}).click();checks.push('held-cards sheet reads existing state');
 {
  const g=fresh();g.phase='WAITING_FOR_ROLL';await install(g);
  const b=page.locator('[data-tile="9"]');await b.focus();await b.press('Enter');
  assert.equal(await page.locator('.property-context').count(),1);assert.equal(await page.getByText('Landmark 81',{exact:true}).count(),0);
  await page.getByRole('button',{name:'Ẩn thông tin tài sản',exact:true}).click();
  await page.getByRole('button',{name:'ĐỔ XÚC XẮC',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.play-board').dataset.gamePhase==='MOVING');
  assert.equal(await page.getByRole('button',{name:'Tài sản',exact:true}).isEnabled(),false);
  assert.equal(await page.locator('.play-actions .roll-button').count(),0);
  await page.evaluate(()=>document.querySelector('[data-tile="9"]').click());assert.equal(await page.locator('.property-context').count(),0);
  checks.push('context uses full names, hides unapproved landmark, busy guards reject secondary/tile interaction');
 }
 {
  const g=fresh();g.phase='MOVING';g.movement={remaining:8,direction:1};g.dice={values:[2,6],total:8};await install(g);
  await page.getByRole('button',{name:'Toàn bàn',exact:true}).click();await page.waitForTimeout(650);
  assert.equal(await page.locator('.three-board-host').getAttribute('data-camera-mode'),'overview');
  assert.equal((await snapshot()).phase,'MOVING');checks.push('manual overview persists while the token keeps moving');
 }
 {
  const g=fresh();g.extraRoll=true;g.consecutiveDoubles=1;g.dice={values:[2,2],total:4};await install(g);
  await page.getByRole('button',{name:'ĐỔ THÊM →',exact:true}).click();const state=await snapshot();assert.equal(state.phase,'WAITING_FOR_ROLL');assert.equal(state.currentPlayerId,'player-1');assert.equal(state.consecutiveDoubles,1);checks.push('extra roll remains the same engine turn');
 }
 {
  const g=fresh();const card=CARDS.find(c=>c.effectType==='JAIL_CARD');g.players[0].heldCards=[card.id];const deck=card.deck==='CHANCE'?g.chanceDeck:g.lifeDeck;deck.drawPile=deck.drawPile.filter(id=>id!==card.id);await install(g);
  await page.getByRole('button',{name:'Thẻ',exact:true}).click();await page.getByRole('heading',{name:card.title,exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Dùng thẻ ra tù',exact:true}).count(),0);await page.getByRole('button',{name:'Đóng',exact:true}).click();
  g.players[0].position=10;g.players[0].jailed=true;g.phase='JAIL_DECISION';await install(g);await page.getByRole('button',{name:'Dùng thẻ ra tù',exact:true}).click();
  const state=await snapshot();assert.equal(state.players[0].jailed,false);assert.equal(state.players[0].heldCards.length,0);assert.equal(state.players[0].money,1500);assert.ok((card.deck==='CHANCE'?state.chanceDeck:state.lifeDeck).discardPile.includes(card.id));checks.push('held jail card is informational outside jail and returns to correct deck when used');
 }
 {
  const g=fresh(3),card=CARDS.find(c=>c.effectType==='COLLECT_EACH');g.eventCardId=card.id;g.phase='EVENT';g.lifeDeck.drawPile=g.lifeDeck.drawPile.filter(id=>id!==card.id);g.players[1].money=0;g.players[2].money=0;g.properties['ga-sai-gon'].ownerId='player-2';g.properties['dien-luc'].ownerId='player-3';await install(g);
  await page.getByRole('button',{name:'Khám phá tiếp',exact:false}).click();await page.getByRole('heading',{name:'Kai cần trả nợ',exact:true}).waitFor();assert.equal(await page.locator('.game-dialog .primary-button').count(),1);
  await page.getByRole('button',{name:/^Thanh lý/}).click();await page.getByRole('heading',{name:'An cần trả nợ',exact:true}).waitFor();await page.getByRole('button',{name:/^Thanh lý/}).click();
  const state=await snapshot();assert.equal(state.phase,'OPTIONAL_ACTIONS');assert.equal(state.currentPlayerId,'player-1');assert.equal(state.players[0].money,1520);assert.equal(state.properties['dien-luc'].ownerId,null);checks.push('multi-debtor payment uses correct debtor with a single primary liquidation CTA');
 }
 {
  const g=fresh();for(const id of ['ca-mau','can-tho','ga-sai-gon','dien-luc'])g.properties[id].ownerId='player-1';await install(g);
  await page.getByRole('button',{name:'Tài sản',exact:true}).click();await page.getByRole('heading',{name:/Miền Tây/}).waitFor();await page.getByRole('heading',{name:'Ga tàu',exact:true}).waitFor();await capture(`docs/${artifactPrefix}-assets-mobile.png`);
  await page.evaluate(async()=>{const {useGameStore}=await import(performance.getEntriesByType('resource').find(e=>e.name.includes('/src/store/gameStore.ts')).name);useGameStore.getState().dispatch({type:'BUY'});});
  await page.locator('.game-dialog .sheet-error').waitFor({state:'visible'});await page.locator('.game-dialog .sheet-error').click();await page.getByRole('button',{name:'Đóng',exact:true}).click();checks.push('grouped property management and engine errors remain visible inside dialog');
 }
 {
  const g=fresh();g.players[0].position=1;g.phase='RESOLVING_TILE';await install(g);await page.getByRole('button',{name:/^Mua ·/}).click();await page.locator('.activity-toast span').waitFor({state:'visible'});await page.waitForTimeout(2700);assert.equal(await page.locator('.activity-toast span').count(),0);
  await page.getByRole('button',{name:'KẾT THÚC LƯỢT →',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.player-chip.active .player-copy strong').textContent==='Kai');assert.equal(await page.locator('.property-context').count(),0);checks.push('purchase toast expires and context clears on next player');
 }
 {
  const g=fresh();g.phase='WAITING_FOR_ROLL';g.players[0].name='Nguyễn Hoàng Phương Anh';g.players[0].money=1234567;await install(g);
  const style=await page.addStyleTag({content:'.game-screen { padding:24px 40px 18px!important; }'});await page.waitForTimeout(1700);
  const safe=await page.evaluate(()=>[...document.querySelectorAll('.play-camera button,.secondary-actions button,.play-actions .roll-button')].every(el=>{const r=el.getBoundingClientRect();return r.left>=40&&r.right<=innerWidth-40&&r.top>=24&&r.bottom<=innerHeight-18&&r.height>=44;}));assert.equal(safe,true);assert.equal(await page.locator('.three-board-host').getAttribute('data-overview-clear'),'true');
  await style.evaluate(el=>el.remove());checks.push('long names, large money and simulated safe-area paddings keep controls usable');
 }
 await install(fresh());
 await page.waitForTimeout(1700);
 {
  const hit=await page.locator('.three-board-host').evaluate(el=>{const point=JSON.parse(el.dataset.tileScreens).find(p=>p.index===19),r=el.getBoundingClientRect();return {x:r.left+point.x,y:r.top+point.y};});
  await page.mouse.click(hit.x,hit.y);await page.locator('.property-context').waitFor({state:'visible'});await capture(`docs/${artifactPrefix}-context-mobile.png`);await page.getByRole('button',{name:'Ẩn thông tin tài sản',exact:true}).click();checks.push('actual canvas raycast opens contextual card');
 }
 await page.getByRole('button',{name:'Nhật ký',exact:true}).click();
 await page.setViewportSize({width:390,height:844});await page.getByText('Hãy xoay ngang điện thoại',{exact:true}).waitFor({state:'visible'});
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(250);await page.getByRole('button',{name:'Đóng',exact:true}).click();assert.equal(await page.locator('canvas').count(),1);checks.push('portrait recovery and repeated scene disposal');
 await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Theo quân',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.three-board-host').dataset.cameraZoom==='3.200');checks.push('reduced motion camera snaps');
 await page.evaluate(()=>{const canvas=document.querySelector('.three-board-host canvas');canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();});
 await page.locator('.board-grid').waitFor();assert.equal(await page.locator('.tile').count(),40);assert.equal(await page.locator('.tile.property').count(),28);await page.getByRole('button',{name:/^Cà Mau, /}).click();await page.locator('.property-context').waitFor();await page.getByRole('button',{name:'Xem chi tiết ↗',exact:true}).click();await page.getByRole('dialog',{name:'Cà Mau',exact:true}).waitFor();await page.getByRole('button',{name:'Đóng',exact:true}).click();checks.push('WebGL loss → playable DOM fallback');
 assert.deepEqual(errors,[]);
 const report={testedAt:new Date().toISOString(),url:base,browser:await browser.version(),environment:'Desktop Chrome, mobile viewport/touch emulation. No physical Android/iPhone measurement.',fixtureNote:'First roll and viewport checks use UI-created game. Rare-state UI checks inject valid engine snapshots through Vite dev modules; no QA hooks are shipped.',viewports,checks,errors};
 await writeFile(`docs/${artifactPrefix}-uiux-checks.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({viewports:viewports.length,checks,errors},null,2));
}finally{await browser.close();await server.close();}
