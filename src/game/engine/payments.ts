import { CARDS } from '../data/cards';
import type { GameState, Payment } from '../types/domain';
import { ownedProperties } from './selectors';
import { addLog, currentPlayer, nextTurn } from './turns';
import { beginMovement } from './movement';
import { releaseFromJail } from './jail';
function checkWinner(game: GameState) {
  const survivors=game.players.filter(p=>!p.isBankrupt);
  if(survivors.length !== 1) return false;
  game.winnerId=survivors[0].id; game.phase='GAME_OVER'; game.payments=[]; game.rent=null; game.paymentResume=null;
  addLog(game,survivors[0].name + ' là người cuối cùng còn lại và chiến thắng!'); return true;
}
export function settlePayments(game: GameState) {
  while(game.payments.length) {
    const payment=game.payments[0], payer=game.players.find(p=>p.id===payment.payerId)!, recipient=game.players.find(p=>p.id===payment.recipientId);
    if(payer.isBankrupt || recipient?.isBankrupt) {game.payments.shift();continue;}
    if(payer.money < payment.amount) {
      if(ownedProperties(game,payer.id).length) {game.phase='LIQUIDATION';return;}
      if(recipient) recipient.money+=payer.money;
      payer.money=0; payer.isBankrupt=true; payer.jailed=false;
      for(const id of payer.heldCards) {
        const card=CARDS.find(c=>c.id===id)!;
        (card.deck==='CHANCE'?game.chanceDeck:game.lifeDeck).discardPile.push(id);
      }
      payer.heldCards=[]; game.payments.shift(); game.bankruptcyNoticeId=payer.id; game.phase='BANKRUPTCY';
      addLog(game,payer.name+' phá sản: '+payment.reason+'.'); return;
    }
    payer.money-=payment.amount; if(recipient)recipient.money+=payment.amount;
    addLog(game,payer.name+' trả '+payment.amount+' Tr'+(recipient?' cho '+recipient.name:'')+': '+payment.reason+'.');
    game.payments.shift();
  }
  game.rent=null; game.rentOverride=null;
  if(currentPlayer(game).isBankrupt) {game.paymentResume=null; nextTurn(game);return;}
  const resume=game.paymentResume; game.paymentResume=null;
  if(resume) {
    releaseFromJail(game);
    if(resume==='ROLL_AFTER_JAIL') game.phase='WAITING_FOR_ROLL';
    else beginMovement(game,game.dice!.total);
  } else game.phase='OPTIONAL_ACTIONS';
}
export function charge(game: GameState, payments: Payment[], resume: GameState['paymentResume']=null) {
  game.payments=payments; game.paymentResume=resume; settlePayments(game);
}
export function acknowledgeBankruptcy(game: GameState) {game.bankruptcyNoticeId=null;if(!checkWinner(game))settlePayments(game);}
