import type { GroupDefinition, PropertyDefinition, PropertyLevel } from '../types/domain';
import { GAME_RULES } from '../rules/config';

export function calculateRent(property: PropertyDefinition, level: PropertyLevel, fullGroup?: GroupDefinition): number {
  const levelMultiplier = GAME_RULES.levelRentMultipliers[level];
  const groupMultiplier = fullGroup?.fullGroupRentMultiplier ?? 1;
  return Math.round(property.baseRent * levelMultiplier * groupMultiplier);
}
