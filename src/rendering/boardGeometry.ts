import { boardCell } from '../components/boardLayout';

export interface Point { x: number; y: number }
export interface Rect extends Point { width: number; height: number }
export interface TileGeometry extends Rect {
  index: number;
  side: boolean;
  polygon: number[];
  marker: Point;
}
export interface BoardGeometry {
  width: number;
  height: number;
  depth: number;
  outline: number[];
  center: Rect;
  tiles: TileGeometry[];
}

// Shallow oblique projection keeps upright labels readable on short screens.
// Canvas, DOM hit areas and token destinations share this single mapping.
export function createBoardGeometry(width: number, height: number): BoardGeometry {
  const depth = Math.min(12, height * .035);
  const margin = width < 700 ? 5 : 10;
  const shear = Math.min(26, width * .027);
  const w = width - margin * 2 - shear;
  const h = height - margin * 2 - depth;
  const edge = Math.min(114, Math.max(70, w * .12));
  const row = Math.min(90, h * .22);
  const xs = [0, edge, ...Array.from({ length: 9 }, (_, i) => edge + (i + 1) * (w - edge * 2) / 9), w];
  const ys = [0, row, ...Array.from({ length: 9 }, (_, i) => row + (i + 1) * (h - row * 2) / 9), h];
  const project = (x: number, y: number): Point => ({ x: margin + x + shear * (1 - y / h), y: margin + y });
  const polygon = (x: number, y: number, cw: number, ch: number) =>
    [[x, y], [x + cw, y], [x + cw, y + ch], [x, y + ch]].flatMap(([px, py]) => {
      const point = project(px, py);
      return [point.x, point.y];
    });
  const tiles = Array.from({ length: 40 }, (_, index): TileGeometry => {
    const cell = boardCell(index);
    const x = xs[cell.gridColumn - 1], y = ys[cell.gridRow - 1];
    const cw = xs[cell.gridColumn] - x, ch = ys[cell.gridRow] - y;
    const side = cell.gridRow !== 1 && cell.gridRow !== 11;
    const origin = project(x, y + ch / 2);
    const marker = project(x + (side ? 17 : cw / 2), y + (side ? ch * .67 : Math.min(21, ch * .32)));
    return { index, side, x: origin.x, y: margin + y, width: cw, height: ch, polygon: polygon(x + 1, y + 1, cw - 2, ch - 2), marker };
  });
  const centerOrigin = project(edge, h / 2);
  return {
    width, height, depth, tiles,
    outline: polygon(0, 0, w, h),
    center: { x: centerOrigin.x + 12, y: margin + row + 5, width: w - edge * 2 - 24, height: h - row * 2 - 10 },
  };
}
