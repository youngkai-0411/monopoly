import {describe,it,expect} from 'vitest';
import {BOARD_PLATFORM,SQUARE_TILES,squareTile} from '../src/rendering/squareBoard';
describe('40-tile conventional square geometry',()=>{
 it('has 36 uniform rectangles and four larger square corners',()=>{
  expect(new Set(SQUARE_TILES.map(t=>t.x+':'+t.z)).size).toBe(40);
  expect(SQUARE_TILES.filter(t=>t.corner).map(t=>t.index)).toEqual([0,10,20,30]);
  for(const t of SQUARE_TILES){expect(Math.abs(t.x)===5.3||Math.abs(t.z)===5.3).toBe(true);expect(t.width*t.depth).toBeCloseTo(t.corner?2.56:1.6);}
 });
 it('neighbors meet edge-to-edge and form a closed loop',()=>{
  SQUARE_TILES.forEach((t,i)=>{const next=SQUARE_TILES[(i+1)%40];if(t.x!==next.x)expect(Math.abs(t.x-next.x)).toBeCloseTo((t.width+next.width)/2);else expect(Math.abs(t.z-next.z)).toBeCloseTo((t.depth+next.depth)/2);});
 });
 it('rejects invalid indices',()=>{for(const i of [-1,40,.5,NaN])expect(()=>squareTile(i)).toThrow(RangeError);});
 it('supports the full board footprint on both axes with nested square platform layers',()=>{
  for(const tile of SQUARE_TILES){
   expect(Math.abs(tile.x)+tile.width/2).toBeLessThan(BOARD_PLATFORM.rimSize/2);
   expect(Math.abs(tile.z)+tile.depth/2).toBeLessThan(BOARD_PLATFORM.rimSize/2);
  }
  expect(BOARD_PLATFORM.rimSize).toBeLessThan(BOARD_PLATFORM.plinthSize);
  expect(BOARD_PLATFORM.plinthSize).toBeLessThan(BOARD_PLATFORM.islandSize);
  expect(BOARD_PLATFORM.islandSize).toBeLessThan(BOARD_PLATFORM.islandRimSize);
  for(const tile of SQUARE_TILES.filter(t=>!t.corner)){
   const innerEdge=tile.side==='bottom'||tile.side==='top'?Math.abs(tile.z)-tile.depth/2:Math.abs(tile.x)-tile.width/2;
   expect(BOARD_PLATFORM.courtyardSize/2).toBeLessThan(innerEdge);
   expect(innerEdge-BOARD_PLATFORM.courtyardSize/2).toBeCloseTo(.025);
  }
 });
});
