import { describe, expect, it, vi, afterEach } from 'vitest';
import { createInitialGame } from '../src/game/engine/setup';
import { reduceGame } from '../src/game/engine/actions';
import { seededRandom } from '../src/game/engine/random';
import { ownedProperties } from '../src/game/engine/selectors';
import { PROPERTIES } from '../src/game/data/properties';
import { BOARD } from '../src/game/data/board';
import { CARDS, INSURANCE_CARD_ID } from '../src/game/data/cards';
import { useGameStore } from '../src/store/gameStore';
import type { GameAction, GameState } from '../src/game/types/domain';

afterEach(()=>{useGameStore.getState().reset();vi.useRealTimers();});
describe('M12 repeated input',()=>{
  it('locks quick user actions and rejects stale automatic phase callbacks',()=>{
    vi.useFakeTimers();
    const store=useGameStore;
    store.getState().startLocalGame(['A','B']); store.getState().advance('START_TURN');
    expect(store.getState().dispatch({type:'ROLL'})).toBe(true);
    expect(store.getState().dispatch({type:'ROLL'})).toBe(false);
    vi.advanceTimersByTime(230);
    expect(store.getState().dispatch({type:'ROLL'})).toBe(false);
    store.getState().advance('COMPLETE_ROLL');
    const snapshot=store.getState().game;
    store.getState().advance('COMPLETE_ROLL'); expect(store.getState().game).toBe(snapshot);
  });
});

function chooseAction(game: GameState): GameAction {
  const player=game.players.find(p=>p.id===game.currentPlayerId)!;
  const actor={playerId:player.id};
  switch(game.phase) {
    case 'GAME_START': case 'TURN_START': return {...actor,type:'START_TURN'};
    case 'WAITING_FOR_ROLL': return {...actor,type:'ROLL'};
    case 'ROLLING': return {...actor,type:'COMPLETE_ROLL'};
    case 'MOVING': return {...actor,type:'STEP_MOVE'};
    case 'RESOLVING_TILE': return {...actor,type:'RESOLVE_TILE'};
    case 'PROPERTY_DECISION': {
      const property=PROPERTIES.find(p=>p.id===BOARD[player.position].propertyId)!;
      return {...actor,type:player.money>=property.price?'BUY':'SKIP'};
    }
    case 'RENT': return {...actor,type:player.heldCards.includes(INSURANCE_CARD_ID)?'USE_INSURANCE':'PAY_RENT'};
    case 'EVENT': return {...actor,type:'APPLY_EVENT'};
    case 'BANKRUPTCY': return {...actor,type:'ACK_BANKRUPTCY'};
    case 'SPECIAL': {
      // Test strategy, not an in-game bot: visit an unowned property if possible.
      const tile=BOARD.find(t=>t.propertyId&&game.properties[t.propertyId].ownerId===null)??BOARD.find(t=>t.propertyId&&game.properties[t.propertyId].ownerId===player.id)??BOARD[1];
      return {...actor,type:'TRAVEL',destination:tile.index};
    }
    case 'LIQUIDATION': return {...actor,type:'LIQUIDATE',propertyId:ownedProperties(game,game.payments[0].payerId)[0].id};
    case 'OPTIONAL_ACTIONS': {
      const property=ownedProperties(game,player.id).find(p=>game.properties[p.id].level<3&&player.money>=p.upgradeCost+200);
      return property?{...actor,type:'UPGRADE',propertyId:property.id}:{...actor,type:'END_TURN'};
    }
    default: throw new Error(`Unexpected phase ${game.phase}`);
  }
}

function assertInvariants(game:GameState) {
  expect(game.players.every(p=>Number.isInteger(p.money)&&p.money>=0&&p.position>=0&&p.position<36)).toBe(true);
  expect(Object.values(game.properties).every(p=>p.level>=0&&p.level<=3&&(!p.ownerId||game.players.some(player=>player.id===p.ownerId&&!player.isBankrupt)))).toBe(true);
  const ids=[...game.chanceDeck.drawPile,...game.chanceDeck.discardPile,...game.lifeDeck.drawPile,...game.lifeDeck.discardPile,...game.players.flatMap(p=>p.heldCards),...(game.eventCardId?[game.eventCardId]:[])];
  expect(ids).toHaveLength(32); expect(new Set(ids).size).toBe(32); expect(new Set(ids)).toEqual(new Set(CARDS.map(c=>c.id)));
  if(game.phase!=='GAME_OVER'&&game.phase!=='BANKRUPTCY') expect(game.players.find(p=>p.id===game.currentPlayerId)?.isBankrupt).toBe(false);
  if(game.phase==='LIQUIDATION') expect(ownedProperties(game,game.payments[0].payerId).length).toBeGreaterThan(0);
}

describe('M13 deterministic full-game playtests',()=>{
  it.each([2,3,4])('runs ten %i-player games without invalid money, cards or owners', count=>{
    const results: {seed:number;rounds:number;turns:number;winner:string|null}[]=[];
    for(let seed=1;seed<=10;seed++) {
      const random=seededRandom(seed*101+count);
      let game=createInitialGame(Array.from({length:count},(_,i)=>`P${i+1}`),random);
      let actions=0,turns=0;
      while(game.phase!=='GAME_OVER'&&actions<20000) {
        const action=chooseAction(game);
        if(action.type==='ROLL')turns++;
        game=reduceGame(game,action,random); actions++;
        if(actions%20===0)assertInvariants(game);
      }
      assertInvariants(game);
      results.push({seed,rounds:game.round,turns,winner:game.winnerId});
      expect(game.phase,`seed ${seed} with ${count} players`).toBe('GAME_OVER');
      expect(game.players.filter(p=>!p.isBankrupt)).toHaveLength(1);
    }
    console.log(`PLAYTEST ${count} players: ${JSON.stringify(results)}`);
  },30000);
});
