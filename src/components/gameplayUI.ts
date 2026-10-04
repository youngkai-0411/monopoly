import type { GamePhase, GameState, PropertyDefinition } from '../game/types/domain';
import { ownedProperties, rentFor } from '../game/engine/selectors';
export const busyPhase=(p:GamePhase)=>['GAME_START','TURN_START','TURN_END','ROLLING','MOVING','RESOLVING_TILE'].includes(p);
export const decisionPhase=(p:GamePhase)=>['PROPERTY_DECISION','JAIL_DECISION','UTILITY_ROLL','RENT','EVENT','LIQUIDATION','BANKRUPTCY','GAME_OVER'].includes(p);
export const canInspect=(p:GamePhase)=>p==='WAITING_FOR_ROLL'||p==='OPTIONAL_ACTIONS';
export function displayLandmark(p:PropertyDefinition){const name=p.landmark.trim();return name&&name!=='Landmark 81'&&!/^[a-z0-9]+(?:[-_][a-z0-9]+)+$/i.test(name)?name:null;}
export function rentLabel(game:GameState,p:PropertyDefinition){
 if(p.kind!=='UTILITY')return rentFor(game,p.id)+' Tr';
 const owner=game.properties[p.id].ownerId,count=owner?ownedProperties(game,owner).filter(a=>a.kind==='UTILITY').length:0;
 return (count?p.rentMultiplierByOwnedCount[count-1]:p.rentMultiplierByOwnedCount.join(' / '))+' × tổng xúc xắc';
}
