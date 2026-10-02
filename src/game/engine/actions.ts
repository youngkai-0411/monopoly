import { BOARD } from '../data/board';
import { PROPERTIES } from '../data/properties';
import { INSURANCE_CARD_ID } from '../data/cards';
import { GAME_RULES } from '../rules/config';
import type { GameAction, GamePhase, GameState, PropertyLevel } from '../types/domain';
import { applyEvent, drawCard } from './events';
import { beginMovement, forwardDistance, stepMovement } from './movement';
import { acknowledgeBankruptcy, charge, settlePayments } from './payments';
import { randomInt, type RandomSource } from './random';
import { canBuyProperty, canUpgradeProperty, liquidationValue, rentFor } from './selectors';
import { addLog, currentPlayer, nextTurn, startTurn } from './turns';

const ALLOWED: Record<GameAction['type'], readonly GamePhase[]> = {
  START_TURN:['GAME_START','TURN_START'], ROLL:['WAITING_FOR_ROLL'], COMPLETE_ROLL:['ROLLING'],
  STEP_MOVE:['MOVING'], RESOLVE_TILE:['RESOLVING_TILE'], BUY:['PROPERTY_DECISION'], SKIP:['PROPERTY_DECISION'],
  PAY_RENT:['RENT'], USE_INSURANCE:['RENT'], APPLY_EVENT:['EVENT'], END_TURN:['OPTIONAL_ACTIONS'],
  UPGRADE:['OPTIONAL_ACTIONS'], LIQUIDATE:['LIQUIDATION'], TRAVEL:['SPECIAL'],
  ACK_BANKRUPTCY:['BANKRUPTCY'],
};

export function canAct(game: GameState, type: GameAction['type']) { return ALLOWED[type].includes(game.phase); }

export function reduceGame(source: GameState, action: GameAction, random: RandomSource = Math.random): GameState {
  if (action.playerId !== source.currentPlayerId) throw new Error('Không phải lượt của người chơi này.');
  if (!canAct(source, action.type)) throw new Error('Thao tác không hợp lệ ở thời điểm này.');
  const game = structuredClone(source);
  const player = currentPlayer(game);
  switch (action.type) {
    case 'START_TURN': startTurn(game); break;
    case 'ROLL': game.phase = 'ROLLING'; break;
    case 'COMPLETE_ROLL': {
      const traffic = player.statusEffects.includes('TRAFFIC');
      const coffee = player.statusEffects.includes('COFFEE');
      const count = traffic && !coffee ? 1 : 2;
      const values = Array.from({ length:count }, () => randomInt(6,random) + 1);
      const total = values.reduce((sum, value) => sum + value, 0) + (coffee && !traffic ? 2 : 0);
      player.statusEffects = [];
      game.dice = { values, total };
      addLog(game, `${player.name} đổ ${values.join(' + ')}${coffee && !traffic ? ' + 2 (Cà Phê)' : ''} = ${total}.`);
      beginMovement(game,total); break;
    }
    case 'STEP_MOVE': stepMovement(game); break;
    case 'RESOLVE_TILE': {
      const tile = BOARD[player.position];
      if (tile.propertyId) {
        const property = PROPERTIES.find(item => item.id === tile.propertyId)!;
        const runtime = game.properties[property.id];
        addLog(game, `${player.name} đến ${property.name}.`);
        if (runtime.ownerId === null) game.phase = 'PROPERTY_DECISION';
        else if (runtime.ownerId === player.id) game.phase = 'OPTIONAL_ACTIONS';
        else { game.rent = { propertyId:property.id, ownerId:runtime.ownerId, amount:rentFor(game,property.id) }; game.phase = 'RENT'; }
      } else if (tile.type === 'CHANCE' || tile.type === 'LIFE') drawCard(game,tile.type,random);
      else if (tile.type === 'TAX' || tile.type === 'DETENTION') {
        charge(game,[{ payerId:player.id, recipientId:null, amount:tile.type === 'TAX' ? (tile.amount ?? GAME_RULES.defaultTax) : GAME_RULES.detentionFine, reason:tile.type === 'TAX' ? 'Thuế' : 'Phí Tạm Giữ' }]);
      } else if (tile.type === 'TRAVEL') { game.phase = 'SPECIAL'; addLog(game, 'Du Lịch: chọn một tài sản để đến.'); }
      else {
        if (tile.type === 'TRAVEL_FUND') { player.money += GAME_RULES.travelFundReward; addLog(game, `${player.name} nhận ${GAME_RULES.travelFundReward} Tr từ Quỹ Du Lịch.`); }
        if (tile.type === 'REST') addLog(game, `${player.name} Nghỉ Ngơi, không mất phí.`);
        game.phase = 'OPTIONAL_ACTIONS';
      }
      break;
    }
    case 'BUY': {
      const property = PROPERTIES.find(item => item.id === BOARD[player.position].propertyId);
      if (!property || game.properties[property.id].ownerId !== null) throw new Error('Tài sản không thể mua.');
      if (!canBuyProperty(game,property.id)) throw new Error('Không đủ tiền mua tài sản.');
      player.money -= property.price;
      game.properties[property.id].ownerId = player.id;
      addLog(game, `${player.name} mua ${property.name} với ${property.price} Tr.`);
      game.phase = 'OPTIONAL_ACTIONS'; break;
    }
    case 'SKIP': game.phase = 'OPTIONAL_ACTIONS'; addLog(game, `${player.name} bỏ qua mua tài sản.`); break;
    case 'PAY_RENT': {
      if (!game.rent) throw new Error('Không có tiền thuê cần trả.');
      charge(game,[{ payerId:player.id, recipientId:game.rent.ownerId, amount:game.rent.amount, reason:`Thuê ${PROPERTIES.find(item => item.id === game.rent!.propertyId)!.name}` }]);
      break;
    }
    case 'USE_INSURANCE':
      if (!player.heldCards.includes(INSURANCE_CARD_ID) || !game.rent) throw new Error('Không có bảo hiểm để dùng.');
      player.heldCards = player.heldCards.filter(id => id !== INSURANCE_CARD_ID);
      game.chanceDeck.discardPile.push(INSURANCE_CARD_ID);
      addLog(game, `${player.name} dùng bảo hiểm, được miễn ${game.rent.amount} Tr tiền thuê.`);
      game.rent = null; game.phase = 'OPTIONAL_ACTIONS'; break;
    case 'UPGRADE': {
      const property = PROPERTIES.find(item => item.id === action.propertyId);
      const runtime = game.properties[action.propertyId];
      if (!property || !runtime || runtime.ownerId !== player.id) throw new Error('Bạn không sở hữu tài sản này.');
      if (!canUpgradeProperty(game,property.id)) throw new Error('Không thể nâng cấp: đã Lv.3 hoặc không đủ tiền.');
      player.money -= property.upgradeCost;
      runtime.level = (runtime.level + 1) as PropertyLevel;
      addLog(game, `${player.name} nâng ${property.name} lên Lv.${runtime.level}, trả ${property.upgradeCost} Tr.`);
      break;
    }
    case 'LIQUIDATE': {
      const debt = game.payments[0];
      const runtime = game.properties[action.propertyId];
      if (!debt || !runtime || runtime.ownerId !== debt.payerId) throw new Error('Chỉ được thanh lý tài sản của người đang thiếu tiền.');
      const debtor = game.players.find(item => item.id === debt.payerId)!;
      const value = liquidationValue(game,action.propertyId);
      debtor.money += value;
      runtime.ownerId = null; runtime.level = 0;
      addLog(game, `${debtor.name} thanh lý ${PROPERTIES.find(item => item.id === action.propertyId)!.name}, nhận ${value} Tr.`);
      settlePayments(game); break;
    }
    case 'APPLY_EVENT': applyEvent(game); break;
    case 'ACK_BANKRUPTCY': acknowledgeBankruptcy(game); break;
    case 'TRAVEL': {
      if (!Number.isInteger(action.destination) || !BOARD[action.destination]?.propertyId) throw new Error('Điểm đến Du Lịch phải là tài sản trên bàn cờ.');
      beginMovement(game,forwardDistance(player.position,action.destination)); break;
    }
    case 'END_TURN': game.phase = 'TURN_END'; nextTurn(game); break;
  }
  return game;
}
