import design from '../../../docs/classic-vietnam-v2.json';
import type { GroupDefinition } from '../types/domain';
export const GROUPS: GroupDefinition[] = design.groups.map(group => ({ id: group.id, name: group.name, color: group.color, propertyIds: group.assetIds, fullGroupRentMultiplier: design.economy.undevelopedSetRentMultiplier }));
