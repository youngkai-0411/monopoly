import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try {
  const {createInitialGame}=await server.ssrLoadModule('/src/game/engine/setup.ts');
  const {reduceGame}=await server.ssrLoadModule('/src/game/engine/actions.ts');
  const {seededRandom}=await server.ssrLoadModule('/src/game/engine/random.ts');
  const {ownedProperties}=await server.ssrLoadModule('/src/game/engine/selectors.ts');
  const {PROPERTIES}=await server.ssrLoadModule('/src/game/data/properties.ts');
  const {BOARD}=await server.ssrLoadModule('/src/game/data/board.ts');
  const {INSURANCE_CARD_ID}=await server.ssrLoadModule('/src/game/data/cards.ts');
  const results=[];
  for(const count of [2,3,4]) for(let seed=1;seed<=10;seed++) {
    const rng=seededRandom(seed*101+count);
    let game=createInitialGame(Array.from({length:count},(_,i)=>`P${i+1}`),rng);
    let actions=0,turns=0;
    while(game.phase!=='GAME_OVER'&&actions<20000) {
      const player=game.players.find(p=>p.id===game.currentPlayerId);
      let action;
      switch(game.phase) {
        case 'GAME_START':case 'TURN_START':action={type:'START_TURN'};break;
        case 'WAITING_FOR_ROLL':action={type:'ROLL'};turns++;break;
        case 'ROLLING':action={type:'COMPLETE_ROLL'};break;
        case 'MOVING':action={type:'STEP_MOVE'};break;
        case 'RESOLVING_TILE':action={type:'RESOLVE_TILE'};break;
        case 'PROPERTY_DECISION':action={type:player.money>=PROPERTIES.find(p=>p.id===BOARD[player.position].propertyId).price?'BUY':'SKIP'};break;
        case 'RENT':action={type:player.heldCards.includes(INSURANCE_CARD_ID)?'USE_INSURANCE':'PAY_RENT'};break;
        case 'EVENT':action={type:'APPLY_EVENT'};break;
        case 'BANKRUPTCY':action={type:'ACK_BANKRUPTCY'};break;
        case 'SPECIAL':{
          const tile=BOARD.find(t=>t.propertyId&&game.properties[t.propertyId].ownerId===null)??BOARD.find(t=>t.propertyId&&game.properties[t.propertyId].ownerId===player.id)??BOARD[1];
          action={type:'TRAVEL',destination:tile.index};break;
        }
        case 'LIQUIDATION':action={type:'LIQUIDATE',propertyId:ownedProperties(game,game.payments[0].payerId)[0].id};break;
        case 'OPTIONAL_ACTIONS':{
          const p=ownedProperties(game,player.id).find(p=>game.properties[p.id].level<3&&player.money>=p.upgradeCost+200);
          action=p?{type:'UPGRADE',propertyId:p.id}:{type:'END_TURN'};break;
        }
        default:throw new Error('Unexpected phase '+game.phase);
      }
      game=reduceGame(game,{...action,playerId:game.currentPlayerId},rng);actions++;
    }
    results.push({players:count,seed,rounds:game.round,turns,actions,winner:game.winnerId});
  }
  const summaries=[2,3,4].map(count=>{
    const games=results.filter(r=>r.players===count),turns=games.map(g=>g.turns).sort((a,b)=>a-b);
    return {players:count,completed:games.filter(g=>g.winner).length,total:games.length,minTurns:turns[0],medianTurns:(turns[4]+turns[5])/2,maxTurns:turns.at(-1)};
  });
  const report={strategy:'Test fixture only: buy when affordable, upgrade while keeping 200 Tr reserve; travel to unowned/own assets; use insurance; liquidate first available property.',summaries,games:results};
  await writeFile('docs/playtest-results.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(summaries,null,2));
} finally {await server.close();}
