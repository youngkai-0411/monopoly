import { describe, expect, it } from 'vitest';
import { createInitialGame } from '../src/game/engine/setup';
import { nextTurn, startTurn } from '../src/game/engine/turns';
describe('M3 players and turns', () => {
  it('validates player counts and names', () => {
    expect(() => createInitialGame(['A'])).toThrow();
    expect(() => createInitialGame(['A', ' '])).toThrow();
    expect(createInitialGame([' A ', 'B']).players[0].name).toBe('A');
  });
  it('skips bankrupt players and increments rounds only on wrap', () => {
    const game = createInitialGame(['A', 'B', 'C']);
    startTurn(game); expect(game.phase).toBe('WAITING_FOR_ROLL');
    game.players[1].isBankrupt = true;
    nextTurn(game); expect(game.currentPlayerId).toBe('player-3'); expect(game.round).toBe(1);
    nextTurn(game); expect(game.currentPlayerId).toBe('player-1'); expect(game.round).toBe(2);
  });
});
