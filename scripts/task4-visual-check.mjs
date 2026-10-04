import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {chromium} from 'playwright';
import {createServer} from 'vite';

// Baseline modules are pinned and served in isolation; never resets working files.
const baseline=process.env.TASK4_BASELINE==='1';
const prefix=baseline?'task4-before':'task4';
const baselineRef='2019a796667e7b52fa2df7c1cca350f6c1a5bede';
const originalPaths=['src/App.tsx','src/components/Board.tsx','src/components/GameOverlay.tsx','src/components/ThreeBoard.tsx','src/components/GraphicsPreview.tsx','src/rendering/tabletopScene.ts','src/rendering/tabletopArt.ts','src/visual/tokens.ts'];
const originals=new Map(baseline?originalPaths.map(file=>[path.resolve(file).replaceAll('\\','/'),execFileSync('git',['-c','safe.directory=E:/Projects/Monopoly','show',baselineRef+':'+file],{encoding:'utf8'})]):[]);
const server=await createServer({plugins:baseline?[{name:'task4-baseline',enforce:'pre',load(id){return originals.get(id.split('?')[0].replaceAll('\\','/'));}}]:[],server:{host:'127.0.0.1',port:baseline?5174:5175,strictPort:true}});
await server.listen();
const base=`http://127.0.0.1:${baseline?5174:5175}`;
const {createInitialGame}=await server.ssrLoadModule('/src/game/engine/setup.ts');
const {BOARD}=await server.ssrLoadModule('/src/game/data/board.ts');
const {PROPERTIES}=await server.ssrLoadModule('/src/game/data/properties.ts');
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],checks=[],metrics=[],viewports=[];
const fresh=()=>{const g=createInitialGame(['Nghĩa','Kai','An','Linh']);g.phase='WAITING_FOR_ROLL';g.players.forEach((p,i)=>p.position=i*10);return g;};
try{
  const context=await browser.newContext({viewport:{width:852,height:393},hasTouch:true,isMobile:true,deviceScaleFactor:2,reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(base);await page.getByRole('button',{name:'4 người',exact:true}).click();await page.getByRole('button',{name:'Vào bàn chơi'}).click();
  await page.locator('.three-board-host canvas').waitFor();
  const install=async(g,{remount=true,freeze=true}={})=>{
    await page.evaluate(async({g,remount,freeze})=>{
      const {useGameStore}=await import('/src/store/gameStore.ts');
      const original=window.__task4Advance??useGameStore.getState().advance;window.__task4Advance=original;
      if(remount){useGameStore.getState().reset();await new Promise(r=>setTimeout(r,30));}
      useGameStore.setState({game:g,error:null,locked:false,advance:freeze?()=>{}:original});
    },{g,remount,freeze});
    await page.locator('.three-board-host canvas').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(120);
  };
  const data=()=>page.locator('.three-board-host').evaluate(el=>({...el.dataset}));
  const capture=async(name)=>{await page.screenshot({path:`docs/${prefix}-${name}.png`});const d=await data();metrics.push({name,calls:+d.drawCalls,triangles:+d.triangles,memory:d.resourceMemory?JSON.parse(d.resourceMemory):null});};
  const inspect=async index=>{const b=page.locator(`[data-tile="${index}"]`);await b.focus();await b.press('Enter');await page.waitForTimeout(80);};
  const g=fresh();await install(g);await capture('overview-mobile');
  await page.getByRole('button',{name:'Theo quân',exact:true}).click();await page.waitForTimeout(100);await capture('follow-mobile');
  if(!baseline){
    for(const index of [0,10,20,30]){
      const corner=fresh();corner.players[0].position=index;await install(corner);
      await page.getByRole('button',{name:'Theo quân',exact:true}).click();await page.waitForTimeout(100);
      await capture(`platform-corner-${index}-mobile`);
    }
    checks.push('square platform: follow screenshots at all four board corners');
  }
  const developed=fresh();
  // Valid even-built sets: two houses in brown, hotels in red; bank conservation.
  for(const p of PROPERTIES){developed.properties[p.id].ownerId=`player-${1+(BOARD.find(t=>t.propertyId===p.id).index%4)}`;}
  for(const id of ['ca-mau','can-tho']){developed.properties[id].ownerId='player-1';developed.properties[id].level=2;}
  const red=PROPERTIES.filter(p=>p.kind==='LAND'&&p.groupId===PROPERTIES.find(p=>p.id===BOARD[21].propertyId).groupId);
  for(const p of red){developed.properties[p.id].ownerId='player-2';developed.properties[p.id].level=5;}
  developed.buildingBank={houses:28,hotels:12-red.length};developed.players[0].position=21;
  await install(developed);await capture('owned-developed-mobile');
  await page.getByRole('button',{name:'Theo quân',exact:true}).click();await page.waitForTimeout(100);await capture('hotel-follow-mobile');
  developed.players.forEach(p=>p.position=21);await install(developed);await capture('hotel-four-overview-mobile');
  await page.getByRole('button',{name:'Theo quân',exact:true}).click();await page.waitForTimeout(100);await capture('hotel-four-follow-mobile');
  if(!baseline){const d=await data();assert.equal(JSON.parse(d.ownerFlags).length,28);assert.ok(JSON.parse(d.buildingLevels).some(b=>b.level===5));}
  await install(g);await capture('unowned-mobile');
  await inspect(1);await capture('selected-mobile');
  if(!baseline)assert.equal((await data()).selectedProperty,'ca-mau');
  await page.getByRole('button',{name:'Xem chi tiết ↗',exact:true}).click();await page.waitForTimeout(100);await capture('selected-detail-mobile');
  if(!baseline)assert.equal((await data()).selectedProperty,'ca-mau');
  await page.getByRole('button',{name:'Đóng',exact:true}).click();await page.waitForTimeout(60);
  if(!baseline)assert.equal((await data()).selectedProperty,'');checks.push('world/context/detail shared selection and close');
  const move=fresh();move.players[0].position=38;move.phase='MOVING';move.movement={remaining:5,direction:1};
  await install(move);
  if(!baseline){assert.equal((await data()).destinationTile,'3');move.players[0].position=39;move.movement.remaining=4;await install(move,{remount:false});assert.equal((await data()).destinationTile,'3');}
  move.players[0].position=1;move.movement.remaining=2;await install(move);await capture('destination-mobile');
  await page.getByRole('button',{name:'Toàn bàn',exact:true}).click();await page.waitForTimeout(100);await capture('destination-overview-mobile');
  for(const count of [1,2,3,4]){
    const group=fresh();group.players.slice(0,count).forEach(p=>p.position=21);await install(group);await page.getByRole('button',{name:'Theo quân',exact:true}).click();await page.waitForTimeout(80);
    await capture(`formation-${count}-mobile`);
    if(!baseline){const d=await data(),slots=JSON.parse(d.pawnSlots).filter(p=>group.players.slice(0,count).some(q=>q.id===p.id));assert.equal(new Set(slots.map(p=>p.x+':'+p.z)).size,count);}
  }
  await install(g);await inspect(5);await capture('railroad-mobile');
  await install(g);await inspect(12);await capture('utility-mobile');
  if(!baseline){
    await install(developed);const stableSlots=JSON.parse((await data()).pawnSlots);
    for(let index=0;index<4;index++){
      const active=structuredClone(developed);active.currentPlayerId=active.players[index].id;await install(active);
      await page.getByRole('button',{name:'Theo quân',exact:true}).click();await page.waitForTimeout(80);await capture(`crowded-active-${index+1}-mobile`);
      const slots=JSON.parse((await data()).pawnSlots);assert.deepEqual(slots.map(p=>[p.id,p.x,p.z]),stableSlots.map(p=>[p.id,p.x,p.z]));
    }checks.push('all four active players remain identifiable without reordering formation');
    await install(g);
    const projected=JSON.parse((await data()).tileScreens).find(t=>t.index===1),canvas=await page.locator('.three-board-host canvas').boundingBox();
    await page.mouse.click(canvas.x+projected.x,canvas.y+projected.y);await page.waitForTimeout(80);
    assert.equal((await data()).selectedProperty,'ca-mau');checks.push('real canvas raycast shares selected ID');
    await install(developed);await page.getByRole('button',{name:'Tài sản',exact:true}).click();
    await page.locator('.property-list button').filter({hasText:'Cà Mau'}).click();await page.waitForTimeout(80);
    assert.equal((await data()).selectedProperty,'ca-mau');await page.getByRole('button',{name:'Đóng',exact:true}).click();await page.waitForTimeout(80);
    assert.equal((await data()).selectedProperty,'');checks.push('assets → detail → close selection lifecycle');
    const swapped=structuredClone(developed);swapped.properties['ga-sai-gon'].ownerId='player-4';await install(swapped,{remount:false});
    assert.equal(JSON.parse((await data()).ownerFlags).find(f=>f.id==='ga-sai-gon').color,'#ffd46a');checks.push('owner transfer updates actual instance color');
    const backwards=fresh();backwards.players[0].position=1;backwards.phase='MOVING';backwards.movement={direction:-1,remaining:3};await install(backwards);assert.equal((await data()).destinationTile,'38');
    const jailed=fresh();jailed.players[0].position=10;jailed.players[0].jailed=true;jailed.phase='JAIL_DECISION';await install(jailed,{remount:false});
    assert.equal((await data()).destinationHighlight,'false');checks.push('backward target and jail teleport clear stale destination');
    for(const index of [1,11,21,31,0,10,20,30])for(const count of [1,2,3,4]){
      const group=fresh();group.players.forEach((p,i)=>p.position=i<count?index:(index+4+i*7)%40);await install(group);
      const d=await data(),slots=JSON.parse(d.pawnSlots).filter(p=>group.players.slice(0,count).some(q=>q.id===p.id));assert.equal(new Set(slots.map(p=>p.x+':'+p.z)).size,count);
      assert.ok(slots.every(p=>Number.isFinite(p.screenX)&&Number.isFinite(p.screenY)));
    }checks.push('occupancy 1/2/3/4 across four sides and corners');
    for(const level of [0,1,2,3,4,5]){
      const owned=fresh();for(const id of ['ca-mau','can-tho']){owned.properties[id].ownerId='player-1';owned.properties[id].level=level;}
      owned.buildingBank={houses:32-(level<5?level*2:0),hotels:12-(level===5?2:0)};owned.players[0].position=1;await install(owned);
      await page.getByRole('button',{name:'Theo quân',exact:true}).click();await page.waitForTimeout(80);await capture(`level-${level}-mobile`);
      const d=await data();assert.equal(JSON.parse(d.ownerFlags).length,2);assert.equal(JSON.parse(d.buildingLevels).length,level?2:0);
    }checks.push('levels 0–5 preserve house counts and owner flag');
    await install(developed);const initial=JSON.parse((await data()).resourceMemory);
    for(let i=0;i<12;i++){await install(g,{remount:false});assert.equal(JSON.parse((await data()).ownerFlags).length,0);await install(developed,{remount:false});assert.equal(JSON.parse((await data()).ownerFlags).length,28);}
    const final=JSON.parse((await data()).resourceMemory);assert.deepEqual(final,initial);checks.push('ownership removal/re-add: stable GPU memory after warm-up (12 cycles)');
    for(let i=0;i<10;i++){await install(g);assert.equal(await page.locator('canvas').count(),1);}checks.push('10 remounts: one canvas, no errors');
    await install(g);await page.getByRole('button',{name:'Toàn bàn',exact:true}).click();
    for(const [width,height] of [[568,320],[667,375],[844,390],[852,393],[896,414],[915,412],[932,430],[1024,768],[1440,900]]){
      await page.setViewportSize({width,height});await page.waitForTimeout(150);
      const d=await data();const scroll=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight);
      assert.equal(scroll,false);assert.equal(d.overviewFits,'true');assert.equal(d.overviewClear,'true');
      const frames=d.renderCount;await page.waitForTimeout(100);assert.equal((await data()).renderCount,frames);
      viewports.push({width,height,drawCalls:+d.drawCalls,triangles:+d.triangles,idle:true});
      if([568,852,932].includes(width))await capture(`viewport-${width}`);
    }
    for(const [width,height] of [[844,390],[852,393],[896,414],[915,412],[932,430]]){
      await page.setViewportSize({width,height});await install(developed);
      let d=await data();assert.equal(d.overviewFits,'true');assert.equal(JSON.parse(d.ownerFlags).length,28);
      await page.getByRole('button',{name:'Theo quân',exact:true}).click();await page.waitForTimeout(80);d=await data();
      assert.equal(JSON.parse(d.pawnSlots).length,4);assert.equal(await page.locator('canvas').count(),1);
      await page.getByRole('button',{name:'Toàn bàn',exact:true}).click();await inspect(1);assert.equal((await data()).selectedProperty,'ca-mau');
      await install(move);assert.equal((await data()).destinationHighlight,'true');assert.equal((await data()).destinationTile,'3');
    }checks.push('owned hotels + four players, selection and destination at all five required mobile viewports');
    await page.setViewportSize({width:393,height:852});assert.equal(await page.locator('.portrait-warning').isVisible(),true);checks.push('portrait orientation fallback');
    await page.setViewportSize({width:852,height:393});await page.emulateMedia({reducedMotion:'no-preference'});
    const arrival=fresh();arrival.phase='MOVING';arrival.players[0].position=2;arrival.movement={remaining:1,direction:1};await install(arrival);
    arrival.phase='RESOLVING_TILE';arrival.players[0].position=3;arrival.movement=null;await install(arrival,{remount:false});
    assert.equal((await data()).destinationHighlight,'true');await page.waitForTimeout(900);assert.equal((await data()).destinationHighlight,'false');
    await page.waitForTimeout(1600);const frames=(await data()).renderCount;await page.waitForTimeout(220);assert.equal((await data()).renderCount,frames);checks.push('arrival fades, finite effects return to idle');
  }
  assert.deepEqual(errors,[]);
  await writeFile(`docs/${prefix}-visual-checks.json`,JSON.stringify({baseline,viewport:{width:852,height:393},deviceScaleFactor:2,rendererDprCap:1.5,checks,viewports,metrics,errors},null,2));
  console.log(JSON.stringify({baseline,checks:checks.length,viewports:viewports.length,metrics,errors},null,2));
}finally{await browser.close();await server.close();}
