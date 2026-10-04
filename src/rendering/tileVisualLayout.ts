import type { SquareTile } from './squareBoard';

/** Local +z faces outwards. The atlas, flags and models share this frame. */
export function tileRotation(point: SquareTile): number {
  return {bottom:0,left:-Math.PI/2,top:Math.PI,right:Math.PI/2}[point.side];
}
export function tileOffset(point: SquareTile, x: number, z: number) {
  const angle = tileRotation(point), c = Math.cos(angle), s = Math.sin(angle);
  return {x:point.x+x*c+z*s,z:point.z-x*s+z*c};
}
export const TILE_VISUAL_LAYOUT = {
  flag:{x:-.39,z:-1.03},
  building:{x:.12,z:-1.10},
  pawnOutward:.66,
  crowdedPawnOutward:.50,
  cornerPawnOutward:.24,
} as const;
