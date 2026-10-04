import { describe, expect, it } from 'vitest';
import { BOARD } from '../src/game/data/board';
import { GROUPS } from '../src/game/data/groups';
import { PROPERTIES } from '../src/game/data/properties';
import { calculateRent } from '../src/game/engine/economy';
import { createInitialGame } from '../src/game/engine/setup';
describe('V2 board and economy contracts',()=>{
 it('has 40 tiles, 28 ownable assets and 22/4/2 asset kinds',()=>{
  expect(BOARD).toHaveLength(40);expect(PROPERTIES).toHaveLength(28);
  expect(['LAND','RAILROAD','UTILITY'].map(k=>PROPERTIES.filter(p=>p.kind===k).length)).toEqual([22,4,2]);
  expect(BOARD.map(t=>t.index)).toEqual(Array.from({length:40},(_,i)=>i));
  expect([0,10,20,30].map(i=>BOARD[i].type)).toEqual(['START','JAIL','REST','GO_TO_JAIL']);
 });
 it('places each asset once and six events, two taxes',()=>{
  const ids=BOARD.filter(t=>t.propertyId).map(t=>t.propertyId);expect(new Set(ids)).toEqual(new Set(PROPERTIES.map(p=>p.id)));expect(ids).toHaveLength(28);
  expect(BOARD.filter(t=>t.type==='CHANCE')).toHaveLength(3);expect(BOARD.filter(t=>t.type==='LIFE')).toHaveLength(3);
  expect(BOARD.filter(t=>t.type==='TAX').map(t=>t.amount)).toEqual([200,100]);
 });
 it('uses eight land-only groups in the original count distribution',()=>{
  expect(GROUPS.map(g=>g.propertyIds.length)).toEqual([2,3,3,3,3,3,3,2]);
  expect(new Set(GROUPS.flatMap(g=>g.propertyIds))).toEqual(new Set(PROPERTIES.filter(p=>p.kind==='LAND').map(p=>p.id)));
 });
 it('initializes stock, jail and distinct dice contexts',()=>{
  const g=createInitialGame(['A','B']);expect(g.players[0].money).toBe(1500);expect(g.buildingBank).toEqual({houses:32,hotels:12});
  expect(g.players.every(p=>!p.jailed)).toBe(true);expect(g.rentDice).toBeNull();
 });
 it('applies set bonus only to undeveloped land, not houses',()=>{
  const p=PROPERTIES.find(p=>p.id==='hue')!,group=GROUPS.find(g=>g.id==='di-san')!;
  expect(calculateRent(p,0,group)).toBe(40);expect(calculateRent(p,2,group)).toBe(300);expect(calculateRent(p,5,group)).toBe(1100);
 });
});
