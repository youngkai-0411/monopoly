import { BOARD } from '../data/board';
import { CARDS, INSURANCE_CARD_ID } from '../data/cards';
import { GAME_RULES } from '../rules/config';
import type { DeckType, GameState, StatusEffect } from '../types/domain';
import { beginMovement, forwardDistance } from './movement';
import { charge } from './payments';
import { ownedProperties } from './selectors';
import { shuffle, type RandomSource } from './random';
import { addLog, currentPlayer } from './turns';

export function drawCard(game: GameState, type: DeckType, random: RandomSource) {
  const deck = type === 'CHANCE' ? game.chanceDeck : game.lifeDeck;
  if (!deck.drawPile.length) {
    deck.drawPile = shuffle(deck.discardPile, random);
    deck.discardPile = [];
  }
  const id = deck.drawPile.shift();
  if (!id) throw new Error('Bộ thẻ không có thẻ để rút.');
  game.eventCardId = id;
  game.phase = 'EVENT';
  addLog(game, `${currentPlayer(game).name} rút ${CARDS.find(card => card.id === id)!.title}.`);
}

export function addStatus(game: GameState, status: StatusEffect) {
  const player = currentPlayer(game);
  const opposite = status === 'TRAFFIC' ? 'COFFEE' : 'TRAFFIC';
  if (player.statusEffects.includes(opposite)) {
    player.statusEffects = player.statusEffects.filter(effect => effect !== opposite);
    addLog(game, 'Kẹt Xe và Cà Phê Sáng triệt tiêu nhau.');
  } else if (!player.statusEffects.includes(status)) player.statusEffects.push(status);
}

export function applyEvent(game: GameState) {
  const card = CARDS.find(item => item.id === game.eventCardId);
  if (!card) throw new Error('Không có thẻ đang chờ xử lý.');
  const player = currentPlayer(game);
  const deck = card.deck === 'CHANCE' ? game.chanceDeck : game.lifeDeck;
  const keepInsurance = card.effectType === 'INSURANCE' && !player.heldCards.includes(INSURANCE_CARD_ID);
  if (!keepInsurance) deck.discardPile.push(card.id);
  game.eventCardId = null;
  game.phase = 'OPTIONAL_ACTIONS';
  const moneyEffect = (amount: number) => {
    if (amount < 0) charge(game, [{ payerId:player.id, recipientId:null, amount:-amount, reason:card.title }]);
    else { player.money += amount; addLog(game, `${player.name} nhận ${amount} Tr: ${card.title}.`); }
  };
  const moveNearest = (unowned: boolean) => {
    for (let steps = 1; steps <= GAME_RULES.boardSize; steps++) {
      const tile = BOARD[(player.position + steps) % GAME_RULES.boardSize];
      if (tile.propertyId && (!unowned || game.properties[tile.propertyId].ownerId === null)) {
        beginMovement(game, steps); return;
      }
    }
    addLog(game, 'Không còn tài sản chưa có chủ; thẻ không di chuyển.');
  };
  switch (card.effectType) {
    case 'MONEY': moneyEffect(card.value!); break;
    case 'PER_PROPERTY': {
      const value = card.value!;
      moneyEffect(Math.sign(value) * Math.min(Math.abs(value) * ownedProperties(game, player.id).length, card.cap!));
      break;
    }
    case 'START': {
      const distance = forwardDistance(player.position, 0);
      if (distance === 0) moneyEffect(GAME_RULES.passStartReward);
      beginMovement(game, distance); break;
    }
    case 'MOVE': beginMovement(game, card.value!); break;
    case 'REST': beginMovement(game, forwardDistance(player.position, BOARD.find(tile => tile.type === 'REST')!.index)); break;
    case 'NEAREST_UNOWNED': moveNearest(true); break;
    case 'NEAREST_PROPERTY': moveNearest(false); break;
    case 'COLLECT_EACH':
    case 'PAY_EACH': {
      const collect = card.effectType === 'COLLECT_EACH';
      charge(game, game.players.filter(other => other.id !== player.id && !other.isBankrupt).map(other => ({
        payerId: collect ? other.id : player.id,
        recipientId: collect ? player.id : other.id,
        amount:card.value!, reason:card.title,
      })));
      break;
    }
    case 'INSURANCE':
      if (keepInsurance) { player.heldCards.push(card.id); addLog(game, `${player.name} giữ Bảo Hiểm Đầu Tư.`); }
      else moneyEffect(GAME_RULES.insuranceDuplicateReward);
      break;
    case 'STATUS': addStatus(game, card.status!); break;
    case 'NONE': addLog(game, 'Ngày Đẹp Trời: không có hiệu ứng.'); break;
  }
}
