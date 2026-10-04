import { BOARD } from '../src/game/data/board';
import { PROPERTIES } from '../src/game/data/properties';
import { CARDS } from '../src/game/data/cards';
import { GROUPS } from '../src/game/data/groups';
import { canUpgradeProperty, canSellBuilding, canSellGroup, canLiquidate, ownedProperties } from '../src/game/engine/selectors';
import type { GameAction, GameState } from '../src/game/types/domain';
export function chooseAction(game:GameState,strategy:'GROUPS'|'GREEDY'='GROUPS'):GameAction {
 const player=game.players.find(p=>p.id===game.currentPlayerId)!,actor={playerId:player.id};
 switch(game.phase) {
  case 'GAME_START':case 'TURN_START':return {...actor,type:'START_TURN'};
  case 'WAITING_FOR_ROLL':return {...actor,type:'ROLL'};
  case 'JAIL_DECISION':return {...actor,type:player.heldCards.length?'USE_JAIL_CARD':player.money>=50?'PAY_JAIL':'ROLL'};
  case 'ROLLING':return {...actor,type:'COMPLETE_ROLL'};
  case 'MOVING':return {...actor,type:'STEP_MOVE'};
  case 'RESOLVING_TILE':return {...actor,type:'RESOLVE_TILE'};
  case 'PROPERTY_DECISION':{
   const asset=PROPERTIES.find(p=>p.id===BOARD[player.position].propertyId)!;
   // With trading excluded, this fixture pursues complete sets instead of
   // blocking a set that another player has already started. Greedy stress
   // results are retained separately and are not claimed to always finish.
   const blocked=strategy==='GROUPS'&&asset.kind==='LAND'&&GROUPS.find(g=>g.id===asset.groupId)!.propertyIds.some(id=>game.properties[id].ownerId!==null&&game.properties[id].ownerId!==player.id);
   return {...actor,type:player.money>=asset.price&&!blocked?'BUY':'SKIP'};
  }
  case 'UTILITY_ROLL':return {...actor,type:'ROLL_UTILITY'};
  case 'RENT':return {...actor,type:'PAY_RENT'};
  case 'EVENT':return {...actor,type:'APPLY_EVENT'};
  case 'BANKRUPTCY':return {...actor,type:'ACK_BANKRUPTCY'};
  case 'LIQUIDATION':{
   const owned=ownedProperties(game,game.payments[0].payerId);
   const building=owned.find(p=>canSellBuilding(game,p.id));if(building)return {...actor,type:'SELL_BUILDING',propertyId:building.id};
   const group=owned.find(p=>canSellGroup(game,p.id));if(group)return {...actor,type:'SELL_GROUP',propertyId:group.id};
   const asset=owned.find(p=>canLiquidate(game,p.id));if(!asset)throw new Error('Debt has no valid resolution');
   return {...actor,type:'LIQUIDATE',propertyId:asset.id};
  }
  case 'OPTIONAL_ACTIONS': {
   const asset=ownedProperties(game,player.id).find(p=>canUpgradeProperty(game,p.id)&&player.money>=p.upgradeCost+200);
   return asset?{...actor,type:'UPGRADE',propertyId:asset.id}:{...actor,type:'END_TURN'};
  }
  default:throw new Error('Unexpected phase '+game.phase);
 }
}
export function auditGame(game:GameState) {
 const demand=(ok:boolean,message:string)=>{if(!ok)throw new Error(message);};
 demand(game.players.every(p=>Number.isInteger(p.money)&&p.money>=0&&p.position>=0&&p.position<40&&(!p.jailed||p.position===10)),'Money/position/jail invariant');
 for(const p of PROPERTIES) {
  const s=game.properties[p.id];
  demand(s.level>=0&&s.level<=5&&(p.kind==='LAND'||s.level===0)&&(!s.level||!!s.ownerId),'Asset level invariant');
  demand(!s.ownerId||game.players.some(player=>player.id===s.ownerId&&!player.isBankrupt),'Invalid owner');
 }
 const states=Object.values(game.properties);
 demand(game.buildingBank.houses+states.reduce((sum,s)=>sum+(s.level<5?s.level:0),0)===32,'House conservation');
 demand(game.buildingBank.hotels+states.filter(s=>s.level===5).length===12,'Hotel conservation');
 demand(game.buildingBank.houses>=0&&game.buildingBank.hotels>=0,'Negative bank stock');
 const ids=[...game.chanceDeck.drawPile,...game.chanceDeck.discardPile,...game.lifeDeck.drawPile,...game.lifeDeck.discardPile,...game.players.flatMap(p=>p.heldCards),...(game.eventCardId?[game.eventCardId]:[])];
 demand(ids.length===32&&new Set(ids).size===32&&ids.every(id=>CARDS.some(c=>c.id===id)),'Physical card conservation');
 if(!['GAME_OVER','BANKRUPTCY'].includes(game.phase))demand(!game.players.find(p=>p.id===game.currentPlayerId)!.isBankrupt,'Bankrupt actor');
}
