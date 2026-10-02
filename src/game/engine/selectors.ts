import { PROPERTIES } from '../data/properties';
import { GROUPS } from '../data/groups';
import { GAME_RULES } from '../rules/config';
import type { GameState, PropertyId } from '../types/domain';
import { calculateRent } from './economy';

export function ownedProperties(game: GameState, playerId: string) {
  return PROPERTIES.filter(property => game.properties[property.id].ownerId === playerId);
}
export function fullGroup(game: GameState, propertyId: PropertyId) {
  const property = PROPERTIES.find(item => item.id === propertyId)!;
  const owner = game.properties[propertyId].ownerId;
  const group = GROUPS.find(item => item.id === property.groupId)!;
  return owner && group.propertyIds.every(id => game.properties[id].ownerId === owner) ? group : undefined;
}
export function rentFor(game: GameState, propertyId: PropertyId) {
  const property = PROPERTIES.find(item => item.id === propertyId)!;
  return calculateRent(property, game.properties[propertyId].level, fullGroup(game, propertyId));
}
export function liquidationValue(game: GameState, propertyId: PropertyId) {
  const property = PROPERTIES.find(item => item.id === propertyId)!;
  return Math.floor((property.price + property.upgradeCost * game.properties[propertyId].level) * GAME_RULES.liquidationRate);
}

export function canUpgradeProperty(game: GameState, propertyId: PropertyId) {
  const property = PROPERTIES.find(item => item.id === propertyId);
  const runtime = game.properties[propertyId];
  return !!property && !!runtime && game.phase === 'OPTIONAL_ACTIONS' && runtime.ownerId === game.currentPlayerId && runtime.level < 3 && game.players.find(player => player.id === game.currentPlayerId)!.money >= property.upgradeCost;
}
export function canBuyProperty(game: GameState, propertyId: PropertyId) {
  const property = PROPERTIES.find(item => item.id === propertyId);
  return !!property && game.phase === 'PROPERTY_DECISION' && game.properties[propertyId].ownerId === null && game.players.find(player => player.id === game.currentPlayerId)!.money >= property.price;
}
