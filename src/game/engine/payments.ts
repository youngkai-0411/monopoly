import { INSURANCE_CARD_ID } from '../data/cards';
import type { GameState, Payment } from '../types/domain';
import { ownedProperties } from './selectors';
import { addLog, currentPlayer, nextTurn } from './turns';

function checkWinner(game: GameState) {
  const survivors = game.players.filter(player => !player.isBankrupt);
  if (survivors.length === 1) {
    game.winnerId = survivors[0].id;
    game.phase = 'GAME_OVER';
    game.payments = [];
    game.rent = null;
    addLog(game, `${survivors[0].name} là người cuối cùng còn lại và chiến thắng!`);
    return true;
  }
  return false;
}

export function settlePayments(game: GameState) {
  while (game.payments.length) {
    const payment = game.payments[0];
    const payer = game.players.find(player => player.id === payment.payerId)!;
    const recipient = game.players.find(player => player.id === payment.recipientId);
    if (payer.isBankrupt || recipient?.isBankrupt) { game.payments.shift(); continue; }
    if (payer.money < payment.amount) {
      if (ownedProperties(game, payer.id).length) { game.phase = 'LIQUIDATION'; return; }
      // Pay available cash; unpaid debt is written off. All owned properties have
      // already been liquidated voluntarily before this path is reached.
      if (recipient) recipient.money += payer.money;
      payer.money = 0;
      payer.isBankrupt = true;
      if (payer.heldCards.includes(INSURANCE_CARD_ID)) game.chanceDeck.discardPile.push(INSURANCE_CARD_ID);
      payer.heldCards = [];
      payer.statusEffects = [];
      addLog(game, `${payer.name} phá sản vì không thể trả ${payment.amount} Tr (${payment.reason}).`);
      game.payments.shift();
      game.bankruptcyNoticeId = payer.id;
      game.phase = 'BANKRUPTCY';
      return;
    }
    payer.money -= payment.amount;
    if (recipient) recipient.money += payment.amount;
    addLog(game, `${payer.name} trả ${payment.amount} Tr${recipient ? ` cho ${recipient.name}` : ''}: ${payment.reason}.`);
    game.payments.shift();
  }
  game.rent = null;
  if (currentPlayer(game).isBankrupt) nextTurn(game);
  else game.phase = 'OPTIONAL_ACTIONS';
}

export function charge(game: GameState, payments: Payment[]) {
  game.payments = payments;
  settlePayments(game);
}

export function acknowledgeBankruptcy(game: GameState) {
  game.bankruptcyNoticeId = null;
  if (!checkWinner(game)) settlePayments(game);
}
