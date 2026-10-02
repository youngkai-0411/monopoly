import { useEffect, useState } from 'react';
import './styles.css';
import { Board } from './components/Board';
import { NewGame } from './components/NewGame';
import { GameOverlay, type Panel } from './components/GameOverlay';
import { PLAYER_TOKENS, money } from './components/format';
import { useGameStore } from './store/gameStore';

export default function App() {
  const {game,error,advance,clearError}=useGameStore();
  const [panel,setPanel]=useState<Panel>(null);
  useEffect(()=> {
    if(!game) {setPanel(null);return;}
    const type=game.phase==='GAME_START'||game.phase==='TURN_START'?'START_TURN':game.phase==='ROLLING'?'COMPLETE_ROLL':game.phase==='MOVING'?'STEP_MOVE':game.phase==='RESOLVING_TILE'?'RESOLVE_TILE':null;
    if(!type)return;
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay=type==='COMPLETE_ROLL'?(reduce?20:400):type==='STEP_MOVE'?(reduce?10:110):60;
    const timer=setTimeout(()=>advance(type),delay);
    return ()=>clearTimeout(timer);
  },[game,advance]);
  return <main className="game-screen">
    {game?<>
      <header className="topbar"><div className="players" style={{gridTemplateColumns:`repeat(${game.players.length},minmax(0,1fr))`}}>{game.players.map((player,index)=><div className={`player-chip ${player.id===game.currentPlayerId?'active':''} ${player.isBankrupt?'bankrupt':''}`} key={player.id}><span className="player-token">{PLAYER_TOKENS[index]}</span><span className="player-copy"><strong>{player.name}{player.heldCards.length?' 🛡️':''}</strong><small>{player.isBankrupt?'Phá sản':money(player.money)}</small></span></div>)}</div><button className="icon-button" aria-label="Thông tin ván chơi" onClick={()=>setPanel({type:'settings'})}>⚙️</button></header>
      <div className="game-stage"><Board game={game} onProperty={id=>setPanel({type:'property',id})} onAssets={()=>setPanel({type:'assets'})} onLog={()=>setPanel({type:'log'})}/></div>
      <GameOverlay game={game} panel={panel} setPanel={setPanel}/>
    </>:<NewGame/>}
    {error&&<button className="error-toast" role="alert" onClick={clearError}>{error} · Đóng</button>}
    <div className="portrait-warning"><div>📱↻</div><strong>Hãy xoay ngang điện thoại</strong><small>Game được tối ưu cho chế độ Landscape.</small></div>
  </main>;
}
