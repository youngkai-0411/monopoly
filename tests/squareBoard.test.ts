import {describe,it,expect} from 'vitest';
import {SQUARE_TILES,squareTile} from '../src/rendering/squareBoard';
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
});
