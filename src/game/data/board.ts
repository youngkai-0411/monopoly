import design from '../../../docs/classic-vietnam-v2.json';
import type { BoardTile, TileType } from '../types/domain';
export const BOARD: BoardTile[] = design.board.map(tile => ({ index: tile.index, type: (tile.kind === 'LAND' ? 'PROPERTY' : tile.kind) as TileType, propertyId: tile.assetId, name: tile.name, amount: tile.amount }));
