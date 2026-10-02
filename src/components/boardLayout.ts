// A 12 × 8 perimeter has exactly 36 cells. Start at bottom-right,
// then follow the bottom, left, top and right edges clockwise.
export const BOARD_COLUMNS = 12;
export const BOARD_ROWS = 8;

export function boardCell(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= 36) {
    throw new RangeError('Board index must be an integer from 0 to 35.');
  }
  if (index < 12) return { gridColumn: 12 - index, gridRow: 8 };
  if (index < 18) return { gridColumn: 1, gridRow: 19 - index };
  if (index < 30) return { gridColumn: index - 17, gridRow: 1 };
  return { gridColumn: 12, gridRow: index - 28 };
}
