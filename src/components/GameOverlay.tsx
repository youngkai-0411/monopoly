import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { BOARD } from '../game/data/board';
import { PROPERTIES } from '../game/data/properties';
import { CARDS, INSURANCE_CARD_ID } from '../game/data/cards';
import { GROUPS } from '../game/data/groups';
import { GAME_RULES } from '../game/rules/config';
import type { GameState, PropertyLevel } from '../game/types/domain';
import { currentPlayer } from '../game/engine/turns';
import { canBuyProperty, canUpgradeProperty, fullGroup, liquidationValue, ownedProperties, rentFor } from '../game/engine/selectors';
import { calculateRent } from '../game/engine/economy';
import { useGameStore } from '../store/gameStore';
import { money } from './format';

export type Panel = {type:'property';id:string} | {type:'assets'|'log'|'settings'} | null;

function Sheet({title,children,onClose,center=false,fullScreen=false}: {title:string;children:ReactNode;onClose?:()=>void;center?:boolean;fullScreen?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{ const dialog=ref.current!; dialog.showModal(); return ()=>dialog.close(); },[]);
  return <dialog ref={ref} className={`game-dialog ${center?'center-dialog':''} ${fullScreen?'winner-dialog':''}`} aria-label={title} onCancel={event=>{event.preventDefault();onClose?.();}} onClick={event=>{if(event.target===event.currentTarget)onClose?.();}}>
    <motion.div className="sheet-panel" initial={center?{rotateY:-75,opacity:0}:{y:35,opacity:0}} animate={{y:0,rotateY:0,opacity:1}} transition={{duration:.2}}>
      <header className="sheet-header"><h2>{title}</h2>{onClose&&<button className="close-button" aria-label="Đóng" onClick={onClose}>×</button>}</header>
      {children}
    </motion.div>
  </dialog>;
}

export function GameOverlay({game,panel,setPanel}: {game:GameState;panel:Panel;setPanel:(panel:Panel)=>void}) {
  const dispatch=useGameStore(state=>state.dispatch);
  const locked=useGameStore(state=>state.locked);
  const reset=useGameStore(state=>state.reset);
  const player=currentPlayer(game);
  const close=()=>setPanel(null);
  const decision=game.phase==='PROPERTY_DECISION';
  const propertyId=decision ? BOARD[player.position].propertyId : panel?.type==='property'?panel.id:undefined;
  if(game.phase==='BANKRUPTCY') {
    const bankrupt=game.players.find(p=>p.id===game.bankruptcyNoticeId)!;
    return <Sheet key="bankruptcy" center title={`${bankrupt.name} phá sản`}><p className="sheet-copy">Đã hết tài sản và vẫn không đủ tiền trả nợ. {bankrupt.name} rời khỏi thứ tự lượt chơi. Những người còn lại tiếp tục ván.</p><button className="primary-button" disabled={locked} onClick={()=>dispatch({type:'ACK_BANKRUPTCY'})}>Tiếp tục →</button></Sheet>;
  }
  if(game.phase==='GAME_OVER') {
    const winner=game.players.find(p=>p.id===game.winnerId)!;
    return <Sheet key="winner" center fullScreen title="Ván chơi kết thúc"><div className="winner-copy"><motion.span initial={{scale:.5}} animate={{scale:1}} transition={{type:'spring'}}>🏆</motion.span><h3>{winner.name} chiến thắng!</h3><p>Người cuối cùng còn lại · {game.round} vòng</p><strong>{money(winner.money)}</strong></div><button className="primary-button" onClick={reset}>Chơi ván mới</button></Sheet>;
  }
  if(game.phase==='LIQUIDATION') {
    const debt=game.payments[0];
    const debtor=game.players.find(p=>p.id===debt.payerId)!;
    return <Sheet key="liquidation" center title={`${debtor.name} cần thanh lý`}><p className="sheet-copy">Cần trả {money(debt.amount)} · {debt.reason}. Tiền mặt: {money(debtor.money)}. Chọn tài sản để thanh lý; nếu bán hết vẫn thiếu tiền, người chơi sẽ phá sản.</p><div className="property-list">{ownedProperties(game,debtor.id).map(p=><button key={p.id} disabled={locked} onClick={()=>dispatch({type:'LIQUIDATE',propertyId:p.id})}><strong>{p.name} · Lv.{game.properties[p.id].level}</strong><span>Thanh lý +{money(liquidationValue(game,p.id))}</span></button>)}</div></Sheet>;
  }
  if(game.phase==='EVENT') {
    const card=CARDS.find(c=>c.id===game.eventCardId)!;
    return <Sheet key={card.id} center title={card.deck==='CHANCE'?'🎴 Cơ Hội':'✨ Cuộc Sống'}><div className="event-copy"><span className="section-kicker">{player.name}</span><h3>{card.title}</h3><p>{card.description}</p></div><button className="primary-button" disabled={locked} onClick={()=>dispatch({type:'APPLY_EVENT'})}>Áp dụng thẻ →</button></Sheet>;
  }
  if(game.phase==='RENT'&&game.rent) {
    const rent=game.rent;
    const owner=game.players.find(p=>p.id===rent.ownerId)!;
    return <Sheet key="rent" title="Thanh toán tiền thuê"><p className="sheet-copy">{player.name} đến {PROPERTIES.find(p=>p.id===rent.propertyId)!.name}, tài sản của {owner.name}.</p><div className="amount-display">{money(rent.amount)}</div><div className="sheet-actions"><button className="primary-button" disabled={locked} onClick={()=>dispatch({type:'PAY_RENT'})}>Trả tiền thuê</button>{player.heldCards.includes(INSURANCE_CARD_ID)&&<button className="secondary-button" disabled={locked} onClick={()=>dispatch({type:'USE_INSURANCE'})}>Dùng bảo hiểm · miễn thuê</button>}</div></Sheet>;
  }
  if(game.phase==='SPECIAL') return <Sheet key="travel" title="✈️ Chọn điểm đến Du Lịch"><p className="sheet-copy">Đi đến một tài sản theo chiều kim đồng hồ. Qua Xuất Phát nhận {money(GAME_RULES.passStartReward)}; ô đến được xử lý như bình thường.</p><div className="property-list travel-list">{BOARD.filter(tile=>tile.propertyId).map(tile=><button key={tile.index} disabled={locked} onClick={()=>dispatch({type:'TRAVEL',destination:tile.index})}>{PROPERTIES.find(p=>p.id===tile.propertyId)!.name}</button>)}</div></Sheet>;
  if(propertyId) {
    const property=PROPERTIES.find(p=>p.id===propertyId)!;
    const runtime=game.properties[propertyId];
    const owner=game.players.find(p=>p.id===runtime.ownerId);
    const group=GROUPS.find(g=>g.id===property.groupId)!;
    const canUpgrade=canUpgradeProperty(game,propertyId);
    return <Sheet key={propertyId} title={property.name} onClose={decision?undefined:close}>
      <div className="property-detail"><div><span className="section-kicker">{group.name}</span><h3>{property.landmark}</h3><p>{owner?`Chủ: ${owner.name} · Lv.${runtime.level}`:'Chưa có chủ'}{fullGroup(game,propertyId)?' · Đủ nhóm':''}</p></div><dl><div><dt>Giá mua</dt><dd>{money(property.price)}</dd></div><div><dt>Thuê hiện tại</dt><dd>{money(rentFor(game,propertyId))}</dd></div><div><dt>Nâng một cấp</dt><dd>{money(property.upgradeCost)}</dd></div></dl></div>
      <div className="rent-levels">{([0,1,2,3] as PropertyLevel[]).map(level=><span key={level}>Lv.{level}<b>{money(calculateRent(property,level,fullGroup(game,propertyId)))}</b></span>)}</div>
      <div className="sheet-actions">{decision?<><button className="primary-button" disabled={locked||!canBuyProperty(game,propertyId)} onClick={()=>dispatch({type:'BUY'})}>Mua · {money(property.price)}</button><button className="secondary-button" disabled={locked} onClick={()=>dispatch({type:'SKIP'})}>Bỏ qua</button></>:runtime.ownerId===player.id&&<button className="primary-button" disabled={locked||!canUpgrade} onClick={()=>dispatch({type:'UPGRADE',propertyId})}>{runtime.level===3?'Đã đạt Lv.3':`Nâng cấp · ${money(property.upgradeCost)}`}</button>}</div>
      {decision&&player.money<property.price&&<p className="sheet-copy">Chưa đủ tiền để mua. Bạn có thể bỏ qua.</p>}
    </Sheet>;
  }
  if(panel?.type==='assets') return <Sheet key="assets" title={`Tài sản của ${player.name}`} onClose={close}><p className="sheet-copy">{money(player.money)} tiền mặt · {player.heldCards.length?'🛡️ Có Bảo Hiểm Đầu Tư':'Chưa có bảo hiểm'}{player.statusEffects.length?` · ${player.statusEffects.map(s=>s==='TRAFFIC'?'Kẹt Xe':'Cà Phê Sáng').join(', ')}`:''}</p><div className="property-list">{ownedProperties(game,player.id).map(p=><button key={p.id} onClick={()=>setPanel({type:'property',id:p.id})}><strong>{p.name} · Lv.{game.properties[p.id].level}</strong><span>Thuê {money(rentFor(game,p.id))}{fullGroup(game,p.id)?' · Đủ nhóm':''}</span></button>)}</div>{!ownedProperties(game,player.id).length&&<p className="sheet-copy">Chưa sở hữu tài sản. Đổ xúc xắc để bắt đầu khám phá.</p>}</Sheet>;
  if(panel?.type==='log') return <Sheet key="log" title="Nhật ký ván chơi" onClose={close}><ol className="game-log">{[...game.log].reverse().map(entry=><li key={entry.id}><span>Vòng {entry.round}</span>{entry.message}</li>)}</ol></Sheet>;
  if(panel?.type==='settings') return <Sheet key="settings" title="Thông tin ván chơi" onClose={close}><p className="sheet-copy">Người cuối cùng còn lại chiến thắng. Hai xúc xắc mỗi lượt, không có lượt thêm khi đổ đôi. Nâng tài sản Lv.0–3 không cần đủ nhóm; đủ nhóm tăng tiền thuê. Thiếu tiền phải thanh lý trước khi phá sản.</p><p className="sheet-copy">Tạm Giữ: trả {money(GAME_RULES.detentionFine)}. Nghỉ Ngơi: không mất phí. Quỹ Du Lịch: nhận {money(GAME_RULES.travelFundReward)}. Game local trên thiết bị này; tải lại trang sẽ bắt đầu lại.</p><button className="secondary-button danger" onClick={reset}>Kết thúc ván này và tạo ván mới</button></Sheet>;
  return null;
}
