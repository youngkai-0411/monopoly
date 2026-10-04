import type { CardDefinition } from '../game/data/cards';
import { BOARD } from '../game/data/board';
import { ASSET_BY_ID } from '../game/data/properties';
import { money } from './format';
/** Formats existing card data; it never calculates or applies a game effect. */
export function eventPresentation(card:CardDefinition) {
  const icons:Record<CardDefinition['effectType'],string>={MONEY:card.value!<0?'🧾':'💰',START:'🧳',MOVE:'👣',DESTINATION:'🗺️',NEAREST_RAILROAD:'🚉',NEAREST_UTILITY:'💡',COLLECT_EACH:'🎂',PAY_EACH:'🤝',REPAIRS:'🛠️',GO_TO_JAIL:'🔒',JAIL_CARD:'🎟️'};
  let effect:string;
  switch(card.effectType){
    case 'MONEY': effect=(card.value!>0?'+':'−')+money(Math.abs(card.value!));break;
    case 'MOVE': effect=(card.value!>0?'+':'−')+Math.abs(card.value!)+' ô';break;
    case 'DESTINATION': {const tile=BOARD[card.destination!];effect='Đến '+(tile.propertyId?ASSET_BY_ID.get(tile.propertyId)!.name:tile.name);break;}
    case 'COLLECT_EACH': effect='+'+money(card.value!)+' / người';break;
    case 'PAY_EACH': effect='−'+money(card.value!)+' / người';break;
    case 'REPAIRS': effect=money(card.houseFee!)+' / nhà · '+money(card.hotelFee!)+' / khách sạn';break;
    case 'START': effect='Đến '+BOARD[0].name;break;
    case 'NEAREST_RAILROAD': effect='Đến ga gần nhất';break;
    case 'NEAREST_UTILITY': effect='Đến tiện ích gần nhất';break;
    case 'GO_TO_JAIL': effect='Đi thẳng vào Nhà tù';break;
    case 'JAIL_CARD': effect='Giữ thẻ cho lượt sau';break;
  }
  return {illustration:icons[card.effectType],effect,danger:card.effectType==='MONEY'&&card.value!<0};
}
