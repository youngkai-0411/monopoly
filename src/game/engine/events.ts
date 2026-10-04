import { BOARD } from '../data/board';
import { CARDS } from '../data/cards';
import { GAME_RULES } from '../rules/config';
import type { DeckType, GameState } from '../types/domain';
import { beginMovement, forwardDistance } from './movement';
import { charge } from './payments';
import { ownedProperties } from './selectors';
import { shuffle, type RandomSource } from './random';
import { addLog, currentPlayer } from './turns';
import { goToJail } from './jail';
export function drawCard(game: GameState, type: DeckType, random: RandomSource) {
  if(++game.eventDepth > GAME_RULES.maxEventDepth) throw new Error('Chuỗi sự kiện vượt giới hạn an toàn.');
  const deck=type==='CHANCE'?game.chanceDeck:game.lifeDeck;
  if(!deck.drawPile.length) {deck.drawPile=shuffle(deck.discardPile,random);deck.discardPile=[];}
  const id=deck.drawPile.shift();if(!id)throw new Error('Bộ thẻ không có thẻ để rút.');
  game.eventCardId=id;game.phase='EVENT';addLog(game,currentPlayer(game).name+' rút '+CARDS.find(c=>c.id===id)!.title+'.');
}
export function applyEvent(game: GameState) {
  const card=CARDS.find(c=>c.id===game.eventCardId);if(!card)throw new Error('Không có thẻ đang chờ xử lý.');
  const player=currentPlayer(game), deck=card.deck==='CHANCE'?game.chanceDeck:game.lifeDeck;
  if(card.effectType==='JAIL_CARD')player.heldCards.push(card.id);else deck.discardPile.push(card.id);
  game.eventCardId=null;game.phase='OPTIONAL_ACTIONS';game.rentOverride=null;
  const money=(amount:number)=>{
    if(amount<0)charge(game,[{payerId:player.id,recipientId:null,amount:-amount,reason:card.title}]);
    else {player.money+=amount;addLog(game,player.name+' nhận '+amount+' Tr: '+card.title+'.');}
  };
  switch(card.effectType) {
    case 'MONEY':money(card.value!);break;
    case 'START': {const distance=forwardDistance(player.position,0);if(distance===0)money(GAME_RULES.passStartReward);beginMovement(game,distance);break;}
    case 'DESTINATION':beginMovement(game,forwardDistance(player.position,card.destination!));break;
    case 'MOVE':beginMovement(game,card.value!);break;
    case 'NEAREST_RAILROAD':case 'NEAREST_UTILITY': {
      const type=card.effectType==='NEAREST_RAILROAD'?'RAILROAD':'UTILITY';
      game.rentOverride={kind:type,multiplier:type==='RAILROAD'?2:10};
      for(let steps=1;steps<=BOARD.length;steps++)if(BOARD[(player.position+steps)%BOARD.length].type===type){beginMovement(game,steps);break;}
      break;
    }
    case 'COLLECT_EACH':case 'PAY_EACH': {
      const collect=card.effectType==='COLLECT_EACH';
      charge(game,game.players.filter(p=>p.id!==player.id&&!p.isBankrupt).map(p=>({payerId:collect?p.id:player.id,recipientId:collect?player.id:p.id,amount:card.value!,reason:card.title})));break;
    }
    case 'REPAIRS': {
      const amount=ownedProperties(game,player.id).reduce((sum,p)=>sum+(game.properties[p.id].level===5?card.hotelFee!:game.properties[p.id].level*card.houseFee!),0);
      money(-amount);break;
    }
    case 'GO_TO_JAIL':goToJail(game);break;
    case 'JAIL_CARD':addLog(game,player.name+' giữ thẻ ra tù của bộ '+(card.deck==='CHANCE'?'Cơ Hội':'Cuộc Sống')+'.');break;
  }
}
