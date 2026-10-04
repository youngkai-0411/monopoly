import { lazy,Suspense,useCallback,useEffect,useRef,useState } from 'react';
import { GameIcon } from './GameIcon';
import { ClassicBoard } from './ClassicBoard';
import { BOARD } from '../game/data/board';
import { currentPlayer } from '../game/engine/turns';
import { TurnControls } from './TurnControls';
import { SecondaryActions } from './SecondaryActions';
import { PropertyContextCard } from './PropertyContextCard';
import { ActivityToast } from './ActivityToast';
import { busyPhase,canInspect,decisionPhase } from './gameplayUI';
import type { GameState } from '../game/types/domain';
import type { CameraMode } from '../rendering/squareBoard';
const ThreeBoard=lazy(()=>import('./ThreeBoard'));
export function Board({game,onProperty,onAssets,onCards,onLog,panelOpen}:{game:GameState;onProperty:(id:string)=>void;onAssets:()=>void;onCards:()=>void;onLog:()=>void;panelOpen:boolean}){
 const [unavailable,setUnavailable]=useState(false),[mode,setMode]=useState<CameraMode>('overview'),[context,setContext]=useState<{id:string;actor:string;manual:boolean}|null>(null);
 const contextTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),previous=useRef(game.phase),manualCamera=useRef(false);
 const player=currentPlayer(game),inspect=canInspect(game.phase)&&!panelOpen;
 const onUnavailable=useCallback(()=>setUnavailable(true),[]);
 useEffect(()=>{
  const before=previous.current;previous.current=game.phase;clearTimeout(contextTimer.current);
  if(game.phase==='ROLLING'||game.phase==='TURN_START'){manualCamera.current=false;setContext(null);setMode(game.phase==='ROLLING'?'follow':'overview');}
  if((game.phase==='MOVING'||game.phase==='RESOLVING_TILE')&&!manualCamera.current)setMode('follow');
  if(game.phase==='OPTIONAL_ACTIONS'&&before!=='OPTIONAL_ACTIONS'){
   const id=BOARD[player.position].propertyId;
   if(id){setContext({id,actor:player.id,manual:false});contextTimer.current=setTimeout(()=>setContext(null),5000);}
   const timer=setTimeout(()=>{if(!manualCamera.current)setMode('overview');},matchMedia('(prefers-reduced-motion: reduce)').matches?0:1700);return()=>clearTimeout(timer);
  }
 },[game.phase,game.currentPlayerId,player.id]);
 useEffect(()=>()=>clearTimeout(contextTimer.current),[]);
 const select=useCallback((index:number)=>{if(!inspect)return;const id=BOARD[index].propertyId;clearTimeout(contextTimer.current);setContext(id?{id,actor:game.currentPlayerId,manual:true}:null);},[inspect,game.currentPlayerId]);
 const visible=context&&context.actor===player.id&&inspect;
 return <section className="play-board immersive-board" aria-label="Bàn cờ Việt Nam 40 ô" data-game-phase={game.phase} data-busy={busyPhase(game.phase)} data-renderer-fallback={unavailable}>
 <div className="play-canvas">{unavailable?<ClassicBoard game={game} onProperty={id=>{if(inspect)setContext({id,actor:player.id,manual:true});}} onAssets={onAssets} onLog={onLog} controls={null}/>:<Suspense fallback={<div className="three-loading">Đang dựng bàn cờ…</div>}><ThreeBoard game={game} mode={mode} onSelect={select} onUnavailable={onUnavailable} immersive interactionDisabled={!inspect} framingKey={game.phase+':'+Boolean(visible)+':'+panelOpen}/></Suspense>}</div>
 <span className="round-marker">Vòng {game.round}</span>
 {!unavailable&&<div className="play-camera game-occluder"><button aria-label="Theo quân" title="Theo quân" aria-pressed={mode==='follow'} onClick={()=>{manualCamera.current=true;setMode('follow');}}><GameIcon name="follow"/></button><button aria-label="Toàn bàn" title="Toàn bàn" aria-pressed={mode==='overview'} onClick={()=>{manualCamera.current=true;setMode('overview');}}><GameIcon name="overview"/></button></div>}
 {!decisionPhase(game.phase)&&<aside className="play-actions game-occluder"><TurnControls game={game}/></aside>}
 <SecondaryActions disabled={!inspect} onAssets={onAssets} onCards={onCards} onLog={onLog}/>
 {visible&&<PropertyContextCard game={game} id={context.id} focusRequested={context.manual} onClose={()=>setContext(null)} onDetail={()=>{setContext(null);onProperty(context.id);}}/>}
 <ActivityToast game={game}/>
 </section>;
}
