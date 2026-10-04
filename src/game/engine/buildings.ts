import { ASSET_BY_ID } from '../data/properties';
import { GROUPS } from '../data/groups';
import { GAME_RULES } from '../rules/config';
import type { GameState, PropertyLevel } from '../types/domain';
import { canUpgradeProperty, canSellBuilding, canSellGroup, buildingActor } from './selectors';
import { addLog } from './turns';
export function build(game: GameState, id: string) {
  if (!canUpgradeProperty(game,id)) throw new Error('Cần đủ nhóm màu, xây đều, đủ tiền và còn công trình trong ngân hàng.');
  const p = ASSET_BY_ID.get(id)!, state = game.properties[id];
  game.players.find(player => player.id === state.ownerId)!.money -= p.upgradeCost;
  if (state.level === 4) { game.buildingBank.houses += 4; game.buildingBank.hotels--; }
  else game.buildingBank.houses--;
  state.level = (state.level + 1) as PropertyLevel;
  addLog(game, 'Xây tại ' + p.name + ': ' + (state.level === 5 ? 'khách sạn' : state.level + ' nhà') + '.');
}
export function sellBuilding(game: GameState, id: string, wholeGroup: boolean) {
  if (wholeGroup ? !canSellGroup(game,id) : !canSellBuilding(game,id)) throw new Error('Phải bán đều; nếu thiếu nhà để hạ khách sạn, hãy bán công trình cả nhóm.');
  const p = ASSET_BY_ID.get(id)!;
  if (p.kind !== 'LAND') throw new Error('Chỉ đất có công trình.');
  const owner = game.players.find(player => player.id === buildingActor(game))!;
  const ids = wholeGroup ? GROUPS.find(g => g.id === p.groupId)!.propertyIds : [id];
  for (const key of ids) {
    const state = game.properties[key], asset = ASSET_BY_ID.get(key)!;
    if (state.ownerId !== owner.id || state.level === 0) continue;
    if (wholeGroup) {
      if (state.level === 5) game.buildingBank.hotels++; else game.buildingBank.houses += state.level;
      owner.money += Math.floor(asset.upgradeCost * state.level * GAME_RULES.sellBuildingRate); state.level = 0;
    } else {
      if (state.level === 5) { game.buildingBank.hotels++; game.buildingBank.houses -= 4; } else game.buildingBank.houses++;
      owner.money += Math.floor(asset.upgradeCost * GAME_RULES.sellBuildingRate);
      state.level = (state.level - 1) as PropertyLevel;
    }
  }
  addLog(game, owner.name + (wholeGroup ? ' bán công trình nhóm ' + p.groupId : ' bán một công trình tại ' + p.name) + '.');
}
