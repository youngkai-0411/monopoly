import { describe, expect, it } from 'vitest';
import { BOARD } from '../src/game/data/board';
import { GROUPS } from '../src/game/data/groups';
import { PROPERTIES } from '../src/game/data/properties';
import { calculateRent } from '../src/game/engine/economy';
import { createInitialGame } from '../src/game/engine/setup';

describe('M1 foundation invariants', () => {
  it('defines exactly 36 board tiles and 23 properties', () => { expect(BOARD).toHaveLength(36); expect(PROPERTIES).toHaveLength(23); });
  it('keeps the board indices and 13 special tiles in the agreed composition', () => {
    expect(BOARD.map(tile => tile.index)).toEqual(Array.from({ length: 36 }, (_, index) => index));
    const counts = BOARD.filter(tile => tile.type !== 'PROPERTY').reduce<Record<string, number>>((result, tile) => {
      result[tile.type] = (result[tile.type] ?? 0) + 1;
      return result;
    }, {});
    expect(counts).toEqual({ START: 1, CHANCE: 3, LIFE: 3, TAX: 2, DETENTION: 1, REST: 1, TRAVEL: 1, TRAVEL_FUND: 1 });
  });
  it('uses every property exactly once on board', () => {
    const ids = BOARD.filter(t => t.type === 'PROPERTY').map(t => t.propertyId);
    expect(ids).toHaveLength(23); expect(new Set(ids).size).toBe(23); expect(new Set(ids)).toEqual(new Set(PROPERTIES.map(p => p.id)));
  });
  it('defines 8 groups covering all properties', () => {
    expect(GROUPS).toHaveLength(8); expect(new Set(GROUPS.flatMap(g => g.propertyIds))).toEqual(new Set(PROPERTIES.map(p => p.id)));
  });
  it('creates a valid local game', () => { const state=createInitialGame(['Nghĩa','Kai']); expect(state.players).toHaveLength(2); expect(state.players[0].money).toBe(2000); });
  it('calculates level and full-group rent', () => {
    const qn=PROPERTIES.find(p=>p.id==='quang-ngai')!; const group=GROUPS.find(g=>g.id==='duyen-hai')!;
    expect(calculateRent(qn,2)).toBe(190); expect(calculateRent(qn,2,group)).toBe(285);
  });
});
