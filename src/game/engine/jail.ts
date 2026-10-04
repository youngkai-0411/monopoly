import { GAME_RULES } from '../rules/config';
import type { GameState } from '../types/domain';
import { currentPlayer, addLog } from './turns';
export function goToJail(game: GameState) {
  const player = currentPlayer(game);
  player.position = GAME_RULES.jailIndex; player.jailed = true; player.jailAttempts = 0;
  game.extraRoll = false; game.consecutiveDoubles = 0; game.movement = null; game.rentOverride = null; game.phase = 'OPTIONAL_ACTIONS';
  addLog(game, player.name + ' vào tù. Không nhận tiền Bắt đầu; lượt này kết thúc.');
}
export function releaseFromJail(game: GameState) {
  const player = currentPlayer(game); player.jailed = false; player.jailAttempts = 0;
}
