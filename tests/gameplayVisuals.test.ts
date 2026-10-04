import {describe,it,expect} from 'vitest';
import {ready,act} from './helpers';
import {movementDestination,formationSlot,occupants} from '../src/rendering/gameplayVisuals';
import {SQUARE_TILES} from '../src/rendering/squareBoard';
import {tileOffset,TILE_VISUAL_LAYOUT} from '../src/rendering/tileVisualLayout';

describe('visual cues derived from authoritative state',()=>{
  it.each([[38,5,1,3],[1,3,-1,38],[9,84,1,13],[2,83,-1,39]] as const)('keeps target stable throughout movement from %i', (position,remaining,direction,destination)=>{
    let game=ready();game.phase='MOVING';game.players[0].position=position;game.movement={remaining,direction};
    while(game.phase==='MOVING'){expect(movementDestination(game)).toBe(destination);game=act(game,{type:'STEP_MOVE'});}
    expect(game.players[0].position).toBe(destination);expect(movementDestination(game)).toBeNull();
  });
  it('does not turn old dice, jail decisions or rent dice into destinations',()=>{
    const game=ready();game.dice={values:[2,3],total:5};
    for(const phase of ['ROLLING','JAIL_DECISION','UTILITY_ROLL','RENT','EVENT','OPTIONAL_ACTIONS'] as const){game.phase=phase;expect(movementDestination(game)).toBeNull();}
  });
  it('occupancy ignores bankrupt players and remains in match order across turns',()=>{
    const game=ready(['A','B','C','D']);game.players[1].position=3;game.players[2].isBankrupt=true;
    expect(occupants(game,0)).toEqual(['player-1','player-4']);game.currentPlayerId='player-4';
    expect(occupants(game,0)).toEqual(['player-1','player-4']);
  });
  it('uses separated, bounded slots for one to four occupants',()=>{
    expect(formationSlot(1,0)).toEqual({x:0,z:0});
    for(let count=1;count<=4;count++){
      const slots=Array.from({length:count},(_,i)=>formationSlot(count,i));
      for(const [i,a] of slots.entries()){
        expect(Math.abs(a.x)).toBeLessThan(.25);expect(Math.abs(a.z)).toBeLessThan(.25);
        for(const b of slots.slice(i+1))expect(Math.hypot(a.x-b.x,a.z-b.z)).toBeGreaterThan(.35);
      }
    }
    expect(()=>formationSlot(5,0)).toThrow();expect(()=>formationSlot(2,2)).toThrow();
  });
  it('keeps model and flag on the inward side for every board edge',()=>{
    for(const point of SQUARE_TILES){
      for(const zone of [TILE_VISUAL_LAYOUT.flag,TILE_VISUAL_LAYOUT.building]){
        const p=tileOffset(point,zone.x,zone.z);
        const axis=point.side==='left'||point.side==='right'?'x':'z';
        expect(Math.abs(p[axis])).toBeLessThan(Math.abs(point[axis]));
      }
      const p=tileOffset(point,0,TILE_VISUAL_LAYOUT.pawnOutward);
      const axis=point.side==='left'||point.side==='right'?'x':'z';
      expect(Math.abs(p[axis])).toBeGreaterThan(Math.abs(point[axis]));
    }
  });
  it('keeps pawn feet on the tile surface for every formation and side',()=>{
    for(const point of SQUARE_TILES)for(let count=1;count<=4;count++)for(let i=0;i<count;i++){
      const slot=formationSlot(count,i);
      const outward=point.corner?TILE_VISUAL_LAYOUT.cornerPawnOutward:count>2?TILE_VISUAL_LAYOUT.crowdedPawnOutward:TILE_VISUAL_LAYOUT.pawnOutward;
      // Local tile dimensions: side rectangles are 1 wide × 1.6 deep.
      expect(Math.abs(slot.x)+.11).toBeLessThanOrEqual(point.corner?.8:.5);
      expect(Math.abs(slot.z+outward)+.11).toBeLessThanOrEqual(.800001);
    }
  });
});
