import { describe,it,expect } from 'vitest';
import { fitOverview,followAnchor } from '../src/rendering/cameraFraming';
const tiles=[[{x:100,y:20},{x:180,y:100},{x:100,y:180},{x:20,y:100}]];
describe('camera framing around actual UI surfaces',()=>{
 it('keeps the whole projected board in view without unnecessary shrinking',()=>{
  const fit=fitOverview(200,200,tiles,[]);
  expect(fit.clear).toBe(true);expect(fit.zoom).toBeGreaterThanOrEqual(1);
  for(const p of tiles.flat()){expect(fit.anchor.x+(p.x-100)*fit.zoom).toBeGreaterThanOrEqual(10);expect(fit.anchor.y+(p.y-100)*fit.zoom).toBeLessThanOrEqual(190);}
 });
 it('fits away from an action panel and reports when there is no free board area',()=>{
  const panel={left:160,top:80,right:200,bottom:200},fit=fitOverview(200,200,tiles,[panel]);
  expect(fit.clear).toBe(true);
  const right=Math.max(...tiles.flat().map(p=>fit.anchor.x+(p.x-100)*fit.zoom));expect(right).toBeLessThanOrEqual(155);
  expect(fitOverview(200,200,tiles,[{left:0,top:0,right:200,bottom:200}]).clear).toBe(false);
 });
 it('leaves space for the token height and dice away from side controls',()=>{
  const panel={left:350,top:120,right:600,bottom:300},anchor=followAnchor(600,300,[panel]);
  expect(anchor.x+60).toBeLessThanOrEqual(panel.left-5);expect(anchor.y-90).toBeGreaterThanOrEqual(8);
 });
});
