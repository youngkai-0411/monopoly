import { PlayerIndicator } from './components/PlayerIndicator';
import { GameIcon } from './components/GameIcon';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { BOARD } from './game/data/board';
import './styles.css';
import { Board } from './components/Board';
import { NewGame } from './components/NewGame';
import { GameOverlay, type Panel } from './components/GameOverlay';
import { busyPhase,canInspect,decisionPhase } from './components/gameplayUI';
import { money } from './components/format';
import { useGameStore } from './store/gameStore';

const GraphicsPreview = lazy(() => import('./components/GraphicsPreview'));
const PixiPreview = lazy(() => import('./components/PixiPreview'));

export default function App() {
  const {game,error,advance,clearError}=useGameStore();
  const [panel,setPanel]=useState<Panel>(null);
  const [selectedPropertyId,setSelectedPropertyId]=useState<string|null>(null);
  const selectProperty=useCallback((id:string|null)=>setSelectedPropertyId(id),[]);
  const changePanel=(next:Panel)=>{setPanel(next);if(next?.type!=='property')setSelectedPropertyId(null);};
  useEffect(()=> {
    if(!game) {setPanel(null);setSelectedPropertyId(null);return;}
    const type=game.phase==='GAME_START'||game.phase==='TURN_START'?'START_TURN':game.phase==='ROLLING'?'COMPLETE_ROLL':game.phase==='MOVING'?'STEP_MOVE':game.phase==='RESOLVING_TILE'?'RESOLVE_TILE':null;
    if(!type)return;
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay=type==='COMPLETE_ROLL'?(reduce?20:1500):type==='STEP_MOVE'?(reduce?10:480):type==='RESOLVE_TILE'?(reduce?20:650):100;
    const timer=setTimeout(()=>advance(type),delay);
    return ()=>clearTimeout(timer);
  },[game,advance]);
  useEffect(()=>{if(game&&(busyPhase(game.phase)||decisionPhase(game.phase))){setPanel(null);setSelectedPropertyId(null);}},[game?.phase,game?.currentPlayerId]);
  useEffect(()=>setSelectedPropertyId(null),[game?.currentPlayerId]);
  const openPanel=(next:Panel)=>{if(game&&canInspect(game.phase))changePanel(next);};
  const openProperty=(id:string)=>{if(game&&canInspect(game.phase)){selectProperty(id);setPanel({type:'property'});}};
  const resolvedId=game&&['RESOLVING_TILE','PROPERTY_DECISION','RENT','UTILITY_ROLL'].includes(game.phase)?BOARD[game.players.find(p=>p.id===game.currentPlayerId)!.position].propertyId:null;
  const focusPropertyId=resolvedId??selectedPropertyId;
  if (new URLSearchParams(window.location.search).get('graphics') === '1') {
    return <Suspense fallback={<main className="setup-screen">Đang mở bàn cờ…</main>}><GraphicsPreview/></Suspense>;
  }
  if (new URLSearchParams(window.location.search).get('graphics') === '2') {
    return <Suspense fallback={<main className="setup-screen">Đang mở bàn cờ…</main>}><PixiPreview/></Suspense>;
  }
  return <main className="game-screen v2-game">
    {game?<>
      <header className="topbar"><div className="players" style={{gridTemplateColumns:`repeat(${game.players.length},minmax(0,1fr))`}}>{game.players.map((player,index)=><div className={`player-chip ${player.id===game.currentPlayerId?'active':''} ${player.isBankrupt?'bankrupt':''}`} key={player.id}><PlayerIndicator index={index}/><span className="player-copy"><strong><span className="player-name" title={player.name}>{player.name}</span>{player.jailed?<GameIcon name="lock"/>:player.heldCards.length?<GameIcon name="ticket"/>:null}</strong>{player.id===game.currentPlayerId&&<span className="turn-indicator" aria-label="Đang tới lượt">◆</span>}<small>{player.isBankrupt?'Phá sản':money(player.money)}</small></span></div>)}</div><button className="icon-button" aria-label="Thông tin ván chơi" disabled={Boolean(game&&!canInspect(game.phase))} onClick={()=>openPanel({type:'settings'})}><GameIcon name="settings"/></button></header>
      <div className="game-stage"><Board game={game} selectedPropertyId={focusPropertyId} onSelectProperty={selectProperty} panelOpen={panel!==null} onProperty={openProperty} onAssets={()=>openPanel({type:'assets'})} onCards={()=>openPanel({type:'cards'})} onLog={()=>openPanel({type:'log'})}/></div>
      <GameOverlay game={game} panel={panel} selectedPropertyId={focusPropertyId} onProperty={openProperty} setPanel={changePanel}/>
    </>:<NewGame/>}
    {error&&<button className="error-toast" role="alert" onClick={clearError}>{error} · Đóng</button>}
    <div className="portrait-warning"><GameIcon name="phone"/><strong>Hãy xoay ngang điện thoại</strong><small>Game được tối ưu cho chế độ Landscape.</small></div>
  </main>;
}
