import { describe, expect, it } from 'vitest';
import { BOARD } from '../src/game/data/board';
import { BOARD_COLUMNS, BOARD_ROWS, boardCell } from '../src/components/boardLayout';

describe('M2 board layout', () => {
  const cells = BOARD.map(tile => boardCell(tile.index));

  it('places all 40 tiles in distinct cells on the perimeter', () => {
    expect(new Set(cells.map(cell => `${cell.gridColumn},${cell.gridRow}`)).size).toBe(40);
    for (const { gridColumn: column, gridRow: row } of cells) {
      expect(column).toBeGreaterThanOrEqual(1);
      expect(column).toBeLessThanOrEqual(BOARD_COLUMNS);
      expect(row).toBeGreaterThanOrEqual(1);
      expect(row).toBeLessThanOrEqual(BOARD_ROWS);
      expect(column === 1 || column === BOARD_COLUMNS || row === 1 || row === BOARD_ROWS).toBe(true);
    }
  });

  it('forms a continuous clockwise loop, including the last-to-first step', () => {
    let signedArea = 0;
    cells.forEach((cell, index) => {
      const next = cells[(index + 1) % cells.length];
      expect(Math.abs(cell.gridColumn - next.gridColumn) + Math.abs(cell.gridRow - next.gridRow)).toBe(1);
      signedArea += cell.gridColumn * next.gridRow - next.gridColumn * cell.gridRow;
    });
    // Screen coordinates increase downward, so clockwise has positive area.
    expect(signedArea).toBeGreaterThan(0);
  });
});
