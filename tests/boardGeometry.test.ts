import { describe, expect, it } from 'vitest';
import { createBoardGeometry } from '../src/rendering/boardGeometry';

describe('2.5D board geometry shared by canvas and touch targets', () => {
  for (const [width, height] of [[552, 276], [651, 327], [828, 342], [916, 382], [1184, 808]]) {
    it(`keeps 40 distinct tiles and their markers inside ${width}×${height}`, () => {
      const board = createBoardGeometry(width, height);
      expect(board.tiles).toHaveLength(40);
      expect(new Set(board.tiles.map(t => `${t.x}:${t.y}`)).size).toBe(40);
      for (const tile of board.tiles) {
        expect(tile.width).toBeGreaterThan(24);
        expect(tile.height).toBeGreaterThan(14);
        for (let i = 0; i < tile.polygon.length; i += 2) {
          expect(tile.polygon[i]).toBeGreaterThanOrEqual(0);
          expect(tile.polygon[i]).toBeLessThanOrEqual(width);
          expect(tile.polygon[i + 1]).toBeGreaterThanOrEqual(0);
          expect(tile.polygon[i + 1] + board.depth).toBeLessThanOrEqual(height);
        }
        expect(tile.marker.x).toBeGreaterThanOrEqual(tile.x);
        expect(tile.marker.x).toBeLessThanOrEqual(tile.x + tile.width);
        expect(tile.marker.y).toBeGreaterThanOrEqual(tile.y);
        expect(tile.marker.y).toBeLessThanOrEqual(tile.y + tile.height);
      }
      expect(board.center.width).toBeGreaterThan(250);
      expect(board.center.height).toBeGreaterThan(100);
    });
  }
});
