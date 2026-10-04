import { createInitialGame } from '../src/game/engine/setup';
import { reduceGame } from '../src/game/engine/actions';
import type { ActionInput } from '../src/store/gameStore';
import type { GameAction, GameState } from '../src/game/types/domain';
import { CARDS } from '../src/game/data/cards';
export function act(game:GameState, action:ActionInput, random=()=>.2) {return reduceGame(game,{...action,playerId:game.currentPlayerId} as GameAction,random);}
export function ready(names=['A','B','C']) {return act(createInitialGame(names),{type:'START_TURN'});}
export function land(game:GameState,index:number) {const copy=structuredClone(game);copy.players.find(p=>p.id===copy.currentPlayerId)!.position=index;copy.phase='RESOLVING_TILE';return act(copy,{type:'RESOLVE_TILE'});}
export function walk(game:GameState) {while(game.phase==='MOVING')game=act(game,{type:'STEP_MOVE'});return game;}
export function event(game:GameState,id:string) {
 const copy=structuredClone(game);
 for(const deck of [copy.chanceDeck,copy.lifeDeck]){deck.drawPile=deck.drawPile.filter(c=>c!==id);deck.discardPile=deck.discardPile.filter(c=>c!==id);}
 copy.eventCardId=id;copy.phase='EVENT';return act(copy,{type:'APPLY_EVENT'});
}
export function roll(game:GameState,a:number,b:number) {
 let i=0;return act(act(game,{type:'ROLL'}),{type:'COMPLETE_ROLL'},()=>((i++%2?a:b)-.5)/6);
}
export function card(effect:string,deck='CHANCE') {return CARDS.find(c=>c.deck===deck&&c.effectType===effect)!.id;}
