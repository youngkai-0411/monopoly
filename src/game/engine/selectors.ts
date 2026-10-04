import { PROPERTIES, ASSET_BY_ID } from '../data/properties';
import { GROUPS } from '../data/groups';
import { GAME_RULES } from '../rules/config';
import type { GameState, PropertyId } from '../types/domain';
import { calculateRent } from './economy';
export function ownedProperties(game: GameState, playerId: string) { return PROPERTIES.filter(p => game.properties[p.id].ownerId === playerId); }
export function fullGroup(game: GameState, id: PropertyId) {
  const p = ASSET_BY_ID.get(id), owner = game.properties[id]?.ownerId;
  if (p?.kind !== 'LAND' || !owner) return undefined;
  const group = GROUPS.find(g => g.id === p.groupId);
  return group?.propertyIds.every(key => game.properties[key].ownerId === owner) ? group : undefined;
}
export function rentFor(game: GameState, id: PropertyId, diceTotal = game.rentDice?.total ?? 0) {
  const p = ASSET_BY_ID.get(id);
  if (!p) throw new Error('Tài sản không tồn tại.');
  const state = game.properties[id];
  if (p.kind === 'LAND') return calculateRent(p, state.level, fullGroup(game,id));
  const count = ownedProperties(game,state.ownerId ?? '').filter(a => a.kind === p.kind).length;
  if (p.kind === 'RAILROAD') return p.rentByOwnedCount[Math.max(0,count - 1)];
  return diceTotal * p.rentMultiplierByOwnedCount[Math.max(0,count - 1)];
}
export function liquidationValue(_game: GameState, id: PropertyId) { return Math.floor((ASSET_BY_ID.get(id)?.price ?? 0) * GAME_RULES.liquidationRate); }
export function canLiquidate(game: GameState, id: PropertyId) {
  const p = ASSET_BY_ID.get(id);
  return !!p && (p.kind !== 'LAND' || GROUPS.find(g => g.id === p.groupId)!.propertyIds.every(key => game.properties[key].level === 0));
}
export function canUpgradeProperty(game: GameState, id: PropertyId) {
  const p = ASSET_BY_ID.get(id), state = game.properties[id], group = fullGroup(game,id);
  if (p?.kind !== 'LAND' || !state || !group || game.phase !== 'OPTIONAL_ACTIONS' || state.ownerId !== game.currentPlayerId || state.level >= 5) return false;
  const minimum = Math.min(...group.propertyIds.map(key => game.properties[key].level));
  return state.level === minimum && game.players.find(player => player.id === state.ownerId)!.money >= p.upgradeCost &&
    (state.level === 4 ? game.buildingBank.hotels > 0 : game.buildingBank.houses > 0);
}
export function buildingActor(game: GameState) { return game.phase === 'LIQUIDATION' ? game.payments[0]?.payerId : game.currentPlayerId; }
export function canSellBuilding(game: GameState, id: PropertyId) {
  const p = ASSET_BY_ID.get(id), state = game.properties[id];
  if (p?.kind !== 'LAND' || !state || state.level === 0 || state.ownerId !== buildingActor(game) || !['LIQUIDATION','OPTIONAL_ACTIONS'].includes(game.phase)) return false;
  const group = GROUPS.find(g => g.id === p.groupId)!;
  return state.level === Math.max(...group.propertyIds.map(key => game.properties[key].level)) && (state.level !== 5 || game.buildingBank.houses >= 4);
}
export function canSellGroup(game: GameState, id: PropertyId) {
  const p = ASSET_BY_ID.get(id), actor = buildingActor(game);
  if (p?.kind !== 'LAND' || !['LIQUIDATION','OPTIONAL_ACTIONS'].includes(game.phase)) return false;
  return GROUPS.find(g => g.id === p.groupId)!.propertyIds.some(key => game.properties[key].ownerId === actor && game.properties[key].level > 0);
}
export function canBuyProperty(game: GameState, id: PropertyId) {
  const p=ASSET_BY_ID.get(id);
  return !!p && game.phase === 'PROPERTY_DECISION' && game.properties[id].ownerId === null && game.players.find(player => player.id === game.currentPlayerId)!.money >= p.price;
}
export function buildingLabel(level: number) { return level === 5 ? 'Khách sạn' : level ? level + ' nhà' : 'Đất trống'; }
