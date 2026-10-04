import { BOARD } from '../data/board';
import { ASSET_BY_ID } from '../data/properties';
import { CARDS } from '../data/cards';
import { GAME_RULES } from '../rules/config';
import type { GameAction, GamePhase, GameState } from '../types/domain';
import { applyEvent, drawCard } from './events';
import { beginMovement, stepMovement } from './movement';
import { acknowledgeBankruptcy, charge, settlePayments } from './payments';
import { randomInt, type RandomSource } from './random';
import { canBuyProperty, canLiquidate, liquidationValue, rentFor } from './selectors';
import { addLog, currentPlayer, nextTurn, startTurn } from './turns';
import { goToJail, releaseFromJail } from './jail';
import { build, sellBuilding } from './buildings';
const ALLOWED: Record<GameAction['type'],readonly GamePhase[]> = {
 START_TURN:['GAME_START','TURN_START'],ROLL:['WAITING_FOR_ROLL','JAIL_DECISION'],COMPLETE_ROLL:['ROLLING'],
 STEP_MOVE:['MOVING'],RESOLVE_TILE:['RESOLVING_TILE'],BUY:['PROPERTY_DECISION'],SKIP:['PROPERTY_DECISION'],
 ROLL_UTILITY:['UTILITY_ROLL'],PAY_RENT:['RENT'],PAY_JAIL:['JAIL_DECISION'],USE_JAIL_CARD:['JAIL_DECISION'],
 APPLY_EVENT:['EVENT'],END_TURN:['OPTIONAL_ACTIONS'],UPGRADE:['OPTIONAL_ACTIONS'],
 SELL_BUILDING:['OPTIONAL_ACTIONS','LIQUIDATION'],SELL_GROUP:['OPTIONAL_ACTIONS','LIQUIDATION'],LIQUIDATE:['LIQUIDATION'],ACK_BANKRUPTCY:['BANKRUPTCY'],
};
export function canAct(game:GameState,type:GameAction['type']) {return ALLOWED[type]?.includes(game.phase)??false;}
const dice=(random:RandomSource)=>{const values=[randomInt(6,random)+1,randomInt(6,random)+1];return {values,total:values[0]+values[1]};};
export function reduceGame(source:GameState,action:GameAction,random:RandomSource=Math.random):GameState {
 if(action.playerId!==source.currentPlayerId)throw new Error('Không phải lượt của người chơi này.');
 if(!canAct(source,action.type))throw new Error('Thao tác không hợp lệ ở thời điểm này.');
 const game=structuredClone(source), player=currentPlayer(game);
 switch(action.type) {
  case 'START_TURN':startTurn(game);break;
  case 'ROLL':game.phase='ROLLING';break;
  case 'COMPLETE_ROLL': {
   const result=dice(random);game.dice=result;game.rentDice=null;game.eventDepth=0;game.rentOverride=null;
   const doubles=result.values[0]===result.values[1];addLog(game,player.name+' đổ '+result.values.join(' + ')+' = '+result.total+(doubles?' · Đôi':'')+'.');
   if(player.jailed) {
    game.extraRoll=false;game.consecutiveDoubles=0;
    if(doubles){releaseFromJail(game);beginMovement(game,result.total);}
    else if(++player.jailAttempts>=GAME_RULES.jailMaxAttempts)charge(game,[{payerId:player.id,recipientId:null,amount:GAME_RULES.jailFine,reason:'Phí ra tù sau ba lượt thử'}],'MOVE_AFTER_JAIL');
    else {game.phase='OPTIONAL_ACTIONS';addLog(game,'Chưa ra tù: đã thử '+player.jailAttempts+'/3 lượt.');}
   } else {
    game.extraRoll=doubles;game.consecutiveDoubles=doubles?game.consecutiveDoubles+1:0;
    if(game.consecutiveDoubles>=GAME_RULES.maxConsecutiveDoubles)goToJail(game);else beginMovement(game,result.total);
   }
   break;
  }
  case 'STEP_MOVE':stepMovement(game);break;
  case 'RESOLVE_TILE': {
   const tile=BOARD[player.position];if(!tile)throw new Error('Vị trí không hợp lệ.');
   if(tile.propertyId) {
    const p=ASSET_BY_ID.get(tile.propertyId)!, state=game.properties[p.id];addLog(game,player.name+' đến '+p.name+'.');
    if(!state.ownerId){game.phase='PROPERTY_DECISION';game.rentOverride=null;}
    else if(state.ownerId===player.id){game.phase='OPTIONAL_ACTIONS';game.rentOverride=null;}
    else {
     const override=game.rentOverride;
     const amount=p.kind==='RAILROAD'?rentFor(game,p.id)*(override?.kind==='RAILROAD'?override.multiplier:1):p.kind==='LAND'?rentFor(game,p.id):0;
     game.rent={propertyId:p.id,ownerId:state.ownerId,amount};game.phase=p.kind==='UTILITY'?'UTILITY_ROLL':'RENT';
     if(p.kind!=='UTILITY')game.rentOverride=null;
    }
   } else if(tile.type==='CHANCE'||tile.type==='LIFE')drawCard(game,tile.type,random);
   else if(tile.type==='GO_TO_JAIL')goToJail(game);
   else if(tile.type==='TAX')charge(game,[{payerId:player.id,recipientId:null,amount:tile.amount!,reason:tile.name??'Thuế'}]);
   else {game.phase='OPTIONAL_ACTIONS';game.rentOverride=null;addLog(game,tile.type==='JAIL'?'Chỉ thăm tù.':tile.type==='REST'?'Nghỉ ngơi, không có thưởng/phạt.':'Bắt đầu một hành trình mới.');}
   break;
  }
  case 'BUY': {
   const id=BOARD[player.position].propertyId;if(!id||!canBuyProperty(game,id))throw new Error('Tài sản không thể mua hoặc chưa đủ tiền.');
   const p=ASSET_BY_ID.get(id)!;player.money-=p.price;game.properties[id].ownerId=player.id;game.phase='OPTIONAL_ACTIONS';addLog(game,player.name+' mua '+p.name+' với '+p.price+' Tr.');break;
  }
  case 'SKIP':game.phase='OPTIONAL_ACTIONS';addLog(game,player.name+' bỏ qua mua. Không mở đấu giá trong phiên bản này.');break;
  case 'ROLL_UTILITY': {
   if(!game.rent)throw new Error('Không có tiện ích cần tính thuê.');
   game.rentDice=dice(random);
   const multiplier=game.rentOverride?.kind==='UTILITY'?game.rentOverride.multiplier:null;
   game.rent.amount=multiplier?game.rentDice.total*multiplier:rentFor(game,game.rent.propertyId,game.rentDice.total);
   game.rentOverride=null;game.phase='RENT';addLog(game,'Xúc xắc tính thuê: '+game.rentDice.values.join(' + ')+' → '+game.rent.amount+' Tr. Không di chuyển quân.');break;
  }
  case 'PAY_RENT':
   if(!game.rent)throw new Error('Không có tiền thuê cần trả.');
   charge(game,[{payerId:player.id,recipientId:game.rent.ownerId,amount:game.rent.amount,reason:'Thuê '+ASSET_BY_ID.get(game.rent.propertyId)!.name}]);break;
  case 'PAY_JAIL':charge(game,[{payerId:player.id,recipientId:null,amount:GAME_RULES.jailFine,reason:'Phí ra tù'}],'ROLL_AFTER_JAIL');break;
  case 'USE_JAIL_CARD': {
   const id=player.heldCards.find(id=>CARDS.find(c=>c.id===id)?.effectType==='JAIL_CARD');if(!id)throw new Error('Bạn chưa có thẻ ra tù.');
   const card=CARDS.find(c=>c.id===id)!;player.heldCards=player.heldCards.filter(key=>key!==id);
   (card.deck==='CHANCE'?game.chanceDeck:game.lifeDeck).discardPile.push(id);releaseFromJail(game);game.phase='WAITING_FOR_ROLL';addLog(game,player.name+' dùng thẻ ra tù.');break;
  }
  case 'UPGRADE':build(game,action.propertyId);break;
  case 'SELL_BUILDING':case 'SELL_GROUP': {
   const debt=game.phase==='LIQUIDATION';sellBuilding(game,action.propertyId,action.type==='SELL_GROUP');if(debt)settlePayments(game);break;
  }
  case 'LIQUIDATE': {
   const debt=game.payments[0], state=game.properties[action.propertyId];
   if(!debt||!state||state.ownerId!==debt.payerId||!canLiquidate(game,action.propertyId))throw new Error('Chỉ thanh lý tài sản của người nợ sau khi bán hết công trình trong nhóm.');
   const debtor=game.players.find(p=>p.id===debt.payerId)!, value=liquidationValue(game,action.propertyId);
   debtor.money+=value;state.ownerId=null;state.level=0;addLog(game,debtor.name+' thanh lý '+ASSET_BY_ID.get(action.propertyId)!.name+', nhận '+value+' Tr.');settlePayments(game);break;
  }
  case 'APPLY_EVENT':applyEvent(game);break;
  case 'ACK_BANKRUPTCY':acknowledgeBankruptcy(game);break;
  case 'END_TURN':
   if(game.extraRoll&&!player.jailed){game.phase='WAITING_FOR_ROLL';game.extraRoll=false;game.dice=null;game.rentDice=null;addLog(game,player.name+' được đổ thêm vì đổ đôi.');}
   else {game.phase='TURN_END';nextTurn(game);}break;
 }
 return game;
}
