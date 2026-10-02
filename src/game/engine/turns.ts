import type { GameState } from '../types/domain';

export function addLog(game: GameState, message: string) {
  game.log.push({ id: game.nextLogId++, round: game.round, message });
  game.log = game.log.slice(-200);
}

export function currentPlayer(game: GameState) {
  return game.players.find(player => player.id === game.currentPlayerId)!;
}

export function startTurn(game: GameState) {
  game.phase = 'WAITING_FOR_ROLL';
  game.dice = null;
  game.movement = null;
  game.rent = null;
  game.eventCardId = null;
  addLog(game, `Lượt của ${currentPlayer(game).name}.`);
}

export function nextTurn(game: GameState) {
  const index = game.players.findIndex(player => player.id === game.currentPlayerId);
  for (let offset = 1; offset <= game.players.length; offset++) {
    const nextIndex = (index + offset) % game.players.length;
    if (!game.players[nextIndex].isBankrupt) {
      if (nextIndex <= index) game.round++;
      game.currentPlayerId = game.players[nextIndex].id;
      game.phase = 'TURN_START';
      game.rent = null;
      game.movement = null;
      return;
    }
  }
}
