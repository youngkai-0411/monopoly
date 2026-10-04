import type { GroupDefinition, PropertyDefinition, PropertyLevel } from '../types/domain';
export function calculateRent(property: PropertyDefinition, level: PropertyLevel, fullGroup?: GroupDefinition): number {
  if (property.kind !== 'LAND') return 0;
  return property.rentByLevel[level] * (level === 0 && fullGroup ? fullGroup.fullGroupRentMultiplier : 1);
}
