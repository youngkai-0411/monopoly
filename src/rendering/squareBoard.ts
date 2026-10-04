import design from '../../docs/classic-vietnam-v2.json';
export interface SquareTile { index: number; x: number; z: number; size: number; width: number; depth: number; side: 'bottom'|'left'|'top'|'right'; corner: boolean }
export function squareTile(index: number): SquareTile {
  if(!Number.isInteger(index)||index<0||index>=40)throw new RangeError('Tile index must be 0–39.');
  const side = (['bottom','left','top','right'] as const)[Math.floor(index/10)], offset=index%10;
  const corner=offset===0, edge=design.geometry.boardOuterSize/2-design.geometry.cornerSize/2;
  const along=corner?edge:5-offset;
  const x=side==='bottom'?along:side==='left'?-edge:side==='top'?-along:edge;
  const z=side==='bottom'?edge:side==='left'?along:side==='top'?-edge:-along;
  const width=corner||side==='left'||side==='right'?design.geometry.cornerSize:design.geometry.normalTileWidth;
  const depth=corner||side==='bottom'||side==='top'?design.geometry.cornerSize:design.geometry.normalTileWidth;
  return {index,x,z,size:corner?design.geometry.cornerSize:1,width,depth,side,corner};
}
export const SQUARE_TILES=Array.from({length:40},(_,i)=>squareTile(i));
// Every platform layer shares the square board's centre and dimensions.
// Derive both axes from the board instead of retaining an older rectangular base.
export const BOARD_PLATFORM = {
  rimSize: design.geometry.boardOuterSize + .2,
  plinthSize: design.geometry.boardOuterSize + .35,
  islandSize: design.geometry.boardOuterSize + 3.1,
  islandRimSize: design.geometry.boardOuterSize + 3.3,
  courtyardSize: design.geometry.boardOuterSize - 2 * design.geometry.cornerSize - .05,
};
export type CameraMode='overview'|'follow';
export type DemoPhase='OVERVIEW'|'FOCUS'|'ROLLING'|'MOVING'|'LANDING'|'RETURNING';
export const DEMO_TIMING:Record<Exclude<DemoPhase,'OVERVIEW'>,number>={FOCUS:1100,ROLLING:850,MOVING:480,LANDING:1500,RETURNING:1100};
