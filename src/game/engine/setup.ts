import { PROPERTIES } from '../data/properties';
import { GAME_RULES } from '../rules/config';
import type { GameState, PlayerState, PropertyState } from '../types/domain';
import { CHANCE_CARDS, LIFE_CARDS } from '../data/cards';
import { shuffle, type RandomSource } from './random';

export function createInitialGame(playerNames: string[], random: RandomSource = Math.random): GameState {
  if (playerNames.length < GAME_RULES.minPlayers || playerNames.length > GAME_RULES.maxPlayers) {
    throw new Error(`Game requires ${GAME_RULES.minPlayers}-${GAME_RULES.maxPlayers} players.`);
  }
  const names = playerNames.map(name => name.trim());
  if (names.some(name => !name || name.length > 24)) throw new Error('Tên người chơi phải có từ 1 đến 24 ký tự.');
  const players: PlayerState[] = names.map((name, i) => ({ id:`player-${i+1}`, name, money:GAME_RULES.startingMoney, position:0, heldCards:[], isBankrupt:false, jailed:false, jailAttempts:0 }));
  const properties = Object.fromEntries(PROPERTIES.map((property): [string, PropertyState] => [property.id,{ propertyId:property.id, ownerId:null, level:0 }]));
  return { players, currentPlayerId:players[0].id, properties, chanceDeck:{drawPile:shuffle(CHANCE_CARDS.map(card => card.id), random),discardPile:[]}, lifeDeck:{drawPile:shuffle(LIFE_CARDS.map(card => card.id), random),discardPile:[]}, phase:'GAME_START', round:1, dice:null, rentDice:null, consecutiveDoubles:0, extraRoll:false, eventDepth:0, buildingBank:{houses:GAME_RULES.initialHouses,hotels:GAME_RULES.initialHotels}, rentOverride:null, paymentResume:null, movement:null, eventCardId:null, rent:null, payments:[], winnerId:null, log:[], nextLogId:1, bankruptcyNoticeId:null };
}
