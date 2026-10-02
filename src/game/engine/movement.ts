import { GAME_RULES } from '../rules/config';
import type { GameState } from '../types/domain';
import { addLog, currentPlayer } from './turns';

export function beginMovement(game: GameState, steps: number) {
  game.movement = { remaining: Math.abs(steps), direction: steps < 0 ? -1 : 1 };
  game.phase = steps === 0 ? 'RESOLVING_TILE' : 'MOVING';
}

export function stepMovement(game: GameState) {
  const movement = game.movement;
  if (!movement || movement.remaining <= 0) throw new Error('Không có bước di chuyển.');
  const player = currentPlayer(game);
  player.position = (player.position + movement.direction + GAME_RULES.boardSize) % GAME_RULES.boardSize;
  if (movement.direction === 1 && player.position === 0) {
    player.money += GAME_RULES.passStartReward;
    addLog(game, `${player.name} qua Xuất Phát, nhận ${GAME_RULES.passStartReward} Tr.`);
  }
  movement.remaining--;
  if (movement.remaining === 0) { game.movement = null; game.phase = 'RESOLVING_TILE'; }
}

export function forwardDistance(from: number, to: number) {
  return (to - from + GAME_RULES.boardSize) % GAME_RULES.boardSize;
}
