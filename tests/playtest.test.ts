import { describe,it,expect,vi,afterEach } from 'vitest';
import { createInitialGame } from '../src/game/engine/setup';
import { reduceGame } from '../src/game/engine/actions';
import { seededRandom } from '../src/game/engine/random';
import { useGameStore } from '../src/store/gameStore';
import { chooseAction,auditGame } from './policy';
afterEach(()=>{useGameStore.getState().reset();vi.useRealTimers();});
it('locks double taps and discards stale automatic callbacks',()=>{
 vi.useFakeTimers();const store=useGameStore;store.getState().startLocalGame(['A','B']);store.getState().advance('START_TURN');
 expect(store.getState().dispatch({type:'ROLL'})).toBe(true);expect(store.getState().dispatch({type:'ROLL'})).toBe(false);
 vi.advanceTimersByTime(230);expect(store.getState().dispatch({type:'ROLL'})).toBe(false);
 store.getState().advance('COMPLETE_ROLL');const state=store.getState().game;store.getState().advance('COMPLETE_ROLL');expect(store.getState().game).toBe(state);
});
describe('seeded V2 full-game regressions',()=>{
 it.each([2,3,4])('runs ten %i-player games with conserved assets, stock and cards',count=>{
  const results=[];
  for(let seed=1;seed<=10;seed++){
   const rng=seededRandom(seed*101+count);let game=createInitialGame(Array.from({length:count},(_,i)=>'P'+(i+1)),rng),actions=0;
   while(game.phase!=='GAME_OVER'&&actions<100000){game=reduceGame(game,chooseAction(game),rng);if(++actions%30===0)auditGame(game);}
   auditGame(game);results.push({seed,actions,winner:game.winnerId});
   expect(game.phase,'seed '+seed+', '+count+' players, '+actions+' actions').toBe('GAME_OVER');
  }
  console.log('V2 PLAYTEST '+count+': '+JSON.stringify(results));
 },120000);
});
