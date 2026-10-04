import {createServer} from 'vite';
import {writeFile} from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try {
 const {createInitialGame}=await server.ssrLoadModule('/src/game/engine/setup.ts');
 const {reduceGame}=await server.ssrLoadModule('/src/game/engine/actions.ts');
 const {seededRandom}=await server.ssrLoadModule('/src/game/engine/random.ts');
 const {chooseAction,auditGame}=await server.ssrLoadModule('/tests/policy.ts');
 const strategy=process.env.MONOPOLY_POLICY==='GREEDY'?'GREEDY':'GROUPS';
 const results=[];
 for(const count of [2,3,4])for(let seed=1;seed<=10;seed++){
  const rng=seededRandom(seed*101+count);let game=createInitialGame(Array.from({length:count},(_,i)=>'P'+(i+1)),rng),actions=0,turns=0;
  while(game.phase!=='GAME_OVER'&&actions<100000){
   const action=chooseAction(game,strategy);if(action.type==='ROLL')turns++;
   game=reduceGame(game,action,rng);if(++actions%30===0)auditGame(game);
  }
  auditGame(game);results.push({players:count,seed,rounds:game.round,turns,actions,winner:game.winnerId,completed:game.phase==='GAME_OVER'});
 }
 const summaries=[2,3,4].map(count=>{const games=results.filter(r=>r.players===count),turns=games.map(g=>g.turns).sort((a,b)=>a-b);return {players:count,completed:games.filter(g=>g.completed).length,total:games.length,minTurns:turns[0],medianTurns:(turns[4]+turns[5])/2,maxTurns:turns.at(-1)};});
 const report={version:'V2',checkedAt:new Date().toISOString(),policy:strategy,strategy:'Test fixture only: pursue complete color sets (skip land in opponents sets) or greedy buy-all stress; build evenly with 200 Tr reserve; use jail card or pay; sell buildings then liquidate. No trading, auctions or forced winner.',summaries,games:results};
 await writeFile('docs/playtest-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(summaries,null,2));
 if(results.some(r=>!r.completed))process.exitCode=1;
}finally{await server.close();}
