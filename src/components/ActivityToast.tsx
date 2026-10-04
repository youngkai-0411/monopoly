import { useEffect,useRef,useState } from 'react';
import type { GameState } from '../game/types/domain';
import { busyPhase,decisionPhase } from './gameplayUI';
export function ActivityToast({game}:{game:GameState}){
 const latest=game.log.at(-1),seen=useRef(latest?.id),actor=useRef(game.currentPlayerId),[message,setMessage]=useState<string|null>(null);
 useEffect(()=>{
  if(actor.current!==game.currentPlayerId){actor.current=game.currentPlayerId;setMessage(null);}
  if(!latest||seen.current===latest.id)return;seen.current=latest.id;setMessage(null);
  if(!/mua|trả|nhận|xây|bán|thanh lý|dùng thẻ/i.test(latest.message))return;
  setMessage(latest.message);const timer=setTimeout(()=>setMessage(null),2500);return()=>clearTimeout(timer);
 },[latest?.id,latest?.message,game.currentPlayerId]);
 const visible=message&&!busyPhase(game.phase)&&!decisionPhase(game.phase);
 return <div className="activity-toast" role="status" aria-live="polite">{visible&&<span>✓ {message}</span>}</div>;
}
