import { describe, expect, it } from 'vitest';
import { reduceGame } from '../src/game/engine/actions';
import { CARDS, CHANCE_CARDS, LIFE_CARDS } from '../src/game/data/cards';
import { rentFor, canUpgradeProperty } from '../src/game/engine/selectors';
import { GROUPS } from '../src/game/data/groups';
import type { GameAction, GameState } from '../src/game/types/domain';
import { act, ready, land, walk, event, roll, card } from './helpers';
function ownGroup(g:GameState,id='mien-tay',owner='player-1',level=0) {
 for(const key of GROUPS.find(x=>x.id===id)!.propertyIds){g.properties[key].ownerId=owner;g.properties[key].level=level as 0|1|2|3|4|5;}
 const values=Object.values(g.properties);g.buildingBank.houses=32-values.reduce((sum,s)=>sum+(s.level<5?s.level:0),0);g.buildingBank.hotels=12-values.filter(s=>s.level===5).length;
}
describe('phase guards and 40-tile movement',()=>{
 it('rejects wrong actor, unknown V1 actions, repeated roll and actions during movement without mutating input',()=>{
  const g=ready(),before=structuredClone(g);
  expect(()=>reduceGame(g,{type:'ROLL',playerId:'player-2'})).toThrow();
  expect(()=>reduceGame(g,{type:'TRAVEL',playerId:g.currentPlayerId} as unknown as GameAction)).toThrow();
  const moving=roll(g,2,3);for(const action of [{type:'ROLL'},{type:'BUY'},{type:'END_TURN'},{type:'UPGRADE',propertyId:'ca-mau'}] as const)expect(()=>act(moving,action)).toThrow();
  expect(g).toEqual(before);
 });
 it('wraps 39→0, rewards exactly once and never rewards backwards',()=>{
  let g=ready();g.players[0].position=39;g=walk(roll(g,1,2));expect(g.players[0].position).toBe(2);expect(g.players[0].money).toBe(1700);
  g=walk(event(g,card('MOVE')));expect(g.players[0].position).toBe(39);expect(g.players[0].money).toBe(1700);
  g=walk(event(g,card('START')));expect(g.players[0].position).toBe(0);expect(g.players[0].money).toBe(1900);g=act(g,{type:'RESOLVE_TILE'});expect(g.players[0].money).toBe(1900);
 });
 it('buys, skips and rejects a stale or unaffordable purchase',()=>{
  const decision=land(ready(),1),bought=act(decision,{type:'BUY'});expect(bought.players[0].money).toBe(1440);expect(bought.properties['ca-mau'].ownerId).toBe('player-1');
  expect(()=>act(bought,{type:'BUY'})).toThrow();expect(act(decision,{type:'SKIP'}).properties['ca-mau'].ownerId).toBeNull();
  decision.players[0].money=0;expect(()=>act(decision,{type:'BUY'})).toThrow();
 });
 it('does not charge self rent and transfers land rent once',()=>{
  let g=ready();g.properties['ca-mau'].ownerId='player-1';expect(land(g,1).phase).toBe('OPTIONAL_ACTIONS');
  g.properties['ca-mau'].ownerId='player-2';g=act(land(g,1),{type:'PAY_RENT'});expect(g.players.map(p=>p.money)).toEqual([1498,1502,1500]);expect(()=>act(g,{type:'PAY_RENT'})).toThrow();
 });
});
describe('railroads and utilities',()=>{
 it.each([1,2,3,4])('charges rent for %i railroads owned by the same player',count=>{
  const g=ready(),ids=['ga-sai-gon','ga-nha-trang','ga-da-nang','ga-ha-noi'];ids.slice(0,count).forEach(id=>g.properties[id].ownerId='player-2');
  expect(land(g,5).rent?.amount).toBe([25,50,100,200][count-1]);expect(canUpgradeProperty(g,'ga-sai-gon')).toBe(false);
 });
 it.each([1,2])('uses a separate rent roll for %i utilities without moving or extra doubles',count=>{
  let g=ready();g.properties['dien-luc'].ownerId='player-2';if(count===2)g.properties['cap-nuoc'].ownerId='player-2';
  g.dice={values:[2,3],total:5};g=land(g,12);expect(g.phase).toBe('UTILITY_ROLL');g=act(g,{type:'ROLL_UTILITY'},()=>.5);
  expect(g.rentDice?.total).toBe(8);expect(g.rent?.amount).toBe(8*(count===1?4:10));expect(g.dice?.total).toBe(5);expect(g.players[0].position).toBe(12);expect(g.extraRoll).toBe(false);
  expect(()=>act(g,{type:'ROLL_UTILITY'})).toThrow();
 });
 it('applies event overrides once; buying/self landing clears them',()=>{
  let g=ready();g.players[0].position=7;g.properties['ga-nha-trang'].ownerId='player-2';
  g=act(walk(event(g,card('NEAREST_RAILROAD'))),{type:'RESOLVE_TILE'});expect(g.players[0].position).toBe(15);expect(g.rent?.amount).toBe(50);expect(g.rentOverride).toBeNull();
  g=act(g,{type:'PAY_RENT'});expect(land(g,15).rent?.amount).toBe(25);
  g=ready();g.players[0].position=7;g.properties['dien-luc'].ownerId='player-2';g=act(walk(event(g,card('NEAREST_UTILITY'))),{type:'RESOLVE_TILE'});g=act(g,{type:'ROLL_UTILITY'},()=>0);
  expect(g.rent?.amount).toBe(20);expect(g.rentOverride).toBeNull();
 });
});
describe('doubles and jail',()=>{
 it('keeps the same player for doubles and sends the third consecutive double directly to jail',()=>{
  let g=ready();for(let i=0;i<2;i++){g=roll(g,1,1);g=walk(g);g=land(g,20);g=act(g,{type:'END_TURN'});expect(g.phase).toBe('WAITING_FOR_ROLL');expect(g.currentPlayerId).toBe('player-1');}
  const money=g.players[0].money;g=roll(g,6,6);expect(g.players[0].position).toBe(10);expect(g.players[0].jailed).toBe(true);expect(g.players[0].money).toBe(money);expect(g.extraRoll).toBe(false);
  g=act(g,{type:'END_TURN'});expect(g.currentPlayerId).toBe('player-2');
 });
 it('visiting jail is free, go-to-jail ends extra-roll rights and gives no Start reward',()=>{
  expect(land(ready(),10).players[0].jailed).toBe(false);
  let g=ready();g.extraRoll=true;g=land(g,30);expect(g.players[0].position).toBe(10);expect(g.players[0].money).toBe(1500);expect(g.extraRoll).toBe(false);
 });
 it('escaping by doubles moves normally but does not grant another roll',()=>{
  let g=ready();g.players[0].jailed=true;g.players[0].position=10;g.phase='JAIL_DECISION';g=roll(g,2,2);
  expect(g.players[0].jailed).toBe(false);expect(g.extraRoll).toBe(false);expect(walk(g).players[0].position).toBe(14);
 });
 it('tries at most three jail turns and pays before the third movement',()=>{
  let g=ready();g.players[0].jailed=true;g.players[0].position=10;
  for(let i=0;i<2;i++){g.phase='JAIL_DECISION';g=roll(g,1,2);expect(g.phase).toBe('OPTIONAL_ACTIONS');expect(g.players[0].position).toBe(10);}
  g.phase='JAIL_DECISION';g=roll(g,1,2);expect(g.players[0].jailed).toBe(false);expect(g.players[0].money).toBe(1450);expect(walk(g).players[0].position).toBe(13);
 });
 it.each(['ROLL_AFTER_JAIL','MOVE_AFTER_JAIL'])('resumes %s only after jail debt settlement',resume=>{
  let g=ready();g.players[0].jailed=true;g.players[0].position=10;g.players[0].money=0;g.properties['ga-sai-gon'].ownerId='player-1';g.phase='JAIL_DECISION';
  if(resume==='ROLL_AFTER_JAIL')g=act(g,{type:'PAY_JAIL'});else{g.players[0].jailAttempts=2;g=roll(g,1,2);}
  expect(g.phase).toBe('LIQUIDATION');expect(g.players[0].jailed).toBe(true);
  g=act(g,{type:'LIQUIDATE',propertyId:'ga-sai-gon'});expect(g.players[0].money).toBe(50);expect(g.players[0].jailed).toBe(false);expect(g.phase).toBe(resume==='ROLL_AFTER_JAIL'?'WAITING_FOR_ROLL':'MOVING');
 });
 it('holds each deck’s jail card until explicit use, then returns it to the right deck',()=>{
  for(const deck of ['CHANCE','LIFE']){
   let g=event(ready(),card('JAIL_CARD',deck));const id=card('JAIL_CARD',deck);expect(g.players[0].heldCards).toContain(id);
   expect((deck==='CHANCE'?g.chanceDeck:g.lifeDeck).discardPile).not.toContain(id);
   g.players[0].jailed=true;g.phase='JAIL_DECISION';g=act(g,{type:'USE_JAIL_CARD'});expect(g.phase).toBe('WAITING_FOR_ROLL');expect(g.players[0].heldCards).not.toContain(id);expect((deck==='CHANCE'?g.chanceDeck:g.lifeDeck).discardPile).toContain(id);
  }
 });
});
describe('even building and finite bank stock',()=>{
 it('requires a complete set and rejects building twice on one street ahead of the group',()=>{
  let g=ready();g.phase='OPTIONAL_ACTIONS';g.properties['ca-mau'].ownerId='player-1';expect(()=>act(g,{type:'UPGRADE',propertyId:'ca-mau'})).toThrow();
  ownGroup(g);g=act(g,{type:'UPGRADE',propertyId:'ca-mau'});expect(g.properties['ca-mau'].level).toBe(1);expect(g.buildingBank.houses).toBe(31);
  expect(()=>act(g,{type:'UPGRADE',propertyId:'ca-mau'})).toThrow();g=act(g,{type:'UPGRADE',propertyId:'can-tho'});expect(g.buildingBank.houses).toBe(30);
  expect(()=>act(g,{type:'UPGRADE',propertyId:'ga-sai-gon'})).toThrow();
 });
 it('exchanges four houses for a hotel and preserves bank stock on sell',()=>{
  let g=ready();g.phase='OPTIONAL_ACTIONS';g.players[0].money=10000;ownGroup(g,'mien-tay','player-1',4);
  g=act(g,{type:'UPGRADE',propertyId:'ca-mau'});expect(g.properties['ca-mau'].level).toBe(5);expect(g.buildingBank).toEqual({houses:28,hotels:11});expect(rentFor(g,'ca-mau')).toBe(250);
  g=act(g,{type:'SELL_BUILDING',propertyId:'ca-mau'});expect(g.properties['ca-mau'].level).toBe(4);expect(g.buildingBank).toEqual({houses:24,hotels:12});
 });
 it('rejects missing bank houses/hotels, max-level and uneven selling',()=>{
  let g=ready();g.phase='OPTIONAL_ACTIONS';ownGroup(g);g.buildingBank.houses=0;expect(()=>act(g,{type:'UPGRADE',propertyId:'ca-mau'})).toThrow();
  ownGroup(g,'mien-tay','player-1',4);g.buildingBank.hotels=0;expect(()=>act(g,{type:'UPGRADE',propertyId:'ca-mau'})).toThrow();
  ownGroup(g,'mien-tay','player-1',5);expect(()=>act(g,{type:'UPGRADE',propertyId:'ca-mau'})).toThrow();
  g.properties['ca-mau'].level=3;g.properties['can-tho'].level=4;expect(()=>act(g,{type:'SELL_BUILDING',propertyId:'ca-mau'})).toThrow();
 });
 it('sells the entire group when a hotel cannot be downgraded due to stock shortage',()=>{
  let g=ready();g.phase='OPTIONAL_ACTIONS';ownGroup(g,'mien-tay','player-1',5);g.buildingBank.houses=0;
  expect(()=>act(g,{type:'SELL_BUILDING',propertyId:'ca-mau'})).toThrow();g=act(g,{type:'SELL_GROUP',propertyId:'ca-mau'});expect(g.properties['ca-mau'].level).toBe(0);expect(g.properties['can-tho'].level).toBe(0);expect(g.buildingBank.hotels).toBe(12);expect(g.players[0].money).toBe(1750);
 });
});
describe('V2 event catalog and obligations',()=>{
 it('defines exactly two decks of 16 unique V2 cards',()=>{expect(CHANCE_CARDS).toHaveLength(16);expect(LIFE_CARDS).toHaveLength(16);expect(new Set(CARDS.map(c=>c.id)).size).toBe(32);expect(CARDS.every(c=>c.id.startsWith('v2-'))).toBe(true);});
 it.each(CARDS)('resolves $id without losing the card',c=>{
  let g=ready();g.players.forEach(p=>p.money=20000);g=event(g,c.id);
  const ids=[...g.chanceDeck.drawPile,...g.chanceDeck.discardPile,...g.lifeDeck.drawPile,...g.lifeDeck.discardPile,...g.players.flatMap(p=>p.heldCards),...(g.eventCardId?[g.eventCardId]:[])];
  expect(ids).toHaveLength(32);expect(new Set(ids).size).toBe(32);expect(g.eventCardId).toBeNull();
  if(c.effectType==='MONEY')expect(g.players[0].money).toBe(20000+c.value!);
  if(c.effectType==='GO_TO_JAIL')expect(g.players[0].jailed).toBe(true);
  if(g.phase==='MOVING'){g=walk(g);g=act(g,{type:'RESOLVE_TILE'});expect(g.phase).not.toBe('RESOLVING_TILE');}
 });
 it('counts hotels as hotels rather than five houses for repairs',()=>{
  const g=ready();ownGroup(g,'mien-tay','player-1',1);g.properties['ca-mau'].level=5;
  const c=CARDS.find(c=>c.effectType==='REPAIRS')!;expect(event(g,c.id).players[0].money).toBe(1375);
 });
 it('resolves backwards movement into a second deck at index 33',()=>{
  let g=ready();g.players[0].position=36;g=walk(event(g,card('MOVE')));expect(g.players[0].position).toBe(33);g=act(g,{type:'RESOLVE_TILE'});expect(g.phase).toBe('EVENT');expect(g.eventCardId).toMatch(/life/);
 });
 it('reshuffles only discarded cards; held jail cards stay outside',()=>{
  let g=event(ready(),card('JAIL_CARD'));const ids=g.chanceDeck.drawPile.slice();g.chanceDeck.discardPile.push(...ids);g.chanceDeck.drawPile=[];g=land(g,7);
  expect(g.eventCardId).not.toBe(card('JAIL_CARD'));expect(g.chanceDeck.drawPile).toHaveLength(14);
 });
 it('liquidates only after buildings are sold, then resumes the exact pending rent',()=>{
  let g=ready();g.players[0].money=0;ownGroup(g,'mien-tay','player-1',1);g.properties['ha-noi'].ownerId='player-2';
  g=act(land(g,39),{type:'PAY_RENT'});expect(g.phase).toBe('LIQUIDATION');expect(()=>act(g,{type:'LIQUIDATE',propertyId:'ca-mau'})).toThrow();
  g=act(g,{type:'SELL_GROUP',propertyId:'ca-mau'});expect(g.phase).toBe('OPTIONAL_ACTIONS');expect(g.buildingBank.houses).toBe(32);expect(g.players[1].money).toBe(1550);
 });
 it('settles another debtor’s assets and preserves original turn while collecting',()=>{
  let g=ready();g.players[1].money=0;g.properties['ga-sai-gon'].ownerId='player-2';
  g=event(g,card('COLLECT_EACH','LIFE'));expect(g.phase).toBe('LIQUIDATION');expect(()=>act(g,{type:'LIQUIDATE',propertyId:'ha-noi'})).toThrow();
  g=act(g,{type:'LIQUIDATE',propertyId:'ga-sai-gon'});expect(g.players.map(p=>p.money)).toEqual([1520,90,1490]);expect(g.currentPlayerId).toBe('player-1');
 });
 it('continues multi-player obligations after a different payer is bankrupt',()=>{
  let g=ready();g.players[1].money=5;g=event(g,card('COLLECT_EACH','LIFE'));expect(g.phase).toBe('BANKRUPTCY');g=act(g,{type:'ACK_BANKRUPTCY'});expect(g.players.map(p=>p.money)).toEqual([1515,0,1490]);expect(g.phase).toBe('OPTIONAL_ACTIONS');
 });
 it('returns held cards on bankruptcy, declares last survivor and rejects post-game actions',()=>{
  let g=event(ready(['A','B']),card('JAIL_CARD'));g.players[0].money=0;g=land(g,4);expect(g.phase).toBe('BANKRUPTCY');expect(g.chanceDeck.discardPile).toContain(card('JAIL_CARD'));
  g=act(g,{type:'ACK_BANKRUPTCY'});expect(g.phase).toBe('GAME_OVER');expect(g.winnerId).toBe('player-2');expect(()=>act(g,{type:'ROLL'})).toThrow();
 });
});
