import { BOARD } from '../game/data/board';
import type { GameState } from '../game/types/domain';

/** Presentation only: never samples dice or interprets event rules. */
export function movementDestination(game: GameState): number | null {
  if (game.phase !== 'MOVING' || !game.movement) return null;
  const player = game.players.find(p => p.id === game.currentPlayerId);
  if (!player || player.isBankrupt) return null;
  const index = player.position + game.movement.direction * game.movement.remaining;
  return ((index % BOARD.length) + BOARD.length) % BOARD.length;
}

export function occupants(game: GameState, index: number): string[] {
  return game.players.filter(p => !p.isBankrupt && p.position === index).map(p => p.id);
}

/** Match order stays stable; changing the active player never reshuffles slots. */
export function formationSlot(count: number, slot: number): {x: number; z: number} {
  if (count < 1 || count > 4 || slot < 0 || slot >= count) throw new RangeError('Invalid pawn formation');
  const formations = [
    [{x:0,z:0}],
    [{x:-.21,z:0},{x:.21,z:0}],
    [{x:0,z:-.19},{x:-.21,z:.19},{x:.21,z:.19}],
    [{x:-.21,z:-.19},{x:.21,z:-.19},{x:-.21,z:.19},{x:.21,z:.19}],
  ];
  return formations[count-1][slot];
}
