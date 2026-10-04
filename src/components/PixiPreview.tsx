import { useCallback, useEffect, useState } from 'react';
import PixiBoard, { type BoardProps } from './PixiBoard';
import { ClassicBoard } from './ClassicBoard';
import { Dice } from './Dice';
import { PlayerIndicator } from './PlayerIndicator';
import { createInitialGame } from '../game/engine/setup';
import { BOARD } from '../game/data/board';
import { PROPERTIES } from '../game/data/properties';
import type { GameState } from '../game/types/domain';

// Isolated art fixture. These houses/positions never enter the playable store.
function Board(props:BoardProps) {
  const [unavailable,setUnavailable]=useState(false);
  const onUnavailable=useCallback(()=>setUnavailable(true),[]);
  return unavailable?<ClassicBoard {...props}/>:<PixiBoard {...props} onUnavailable={onUnavailable}/>;
}
function createPreview(): GameState {
  const game = createInitialGame(['Nón lá', 'Mũ xanh', 'Tóc búi', 'Mũ vàng']);
  game.phase = 'WAITING_FOR_ROLL';
  game.dice = { values: [2, 4], total: 6 };
  game.players.forEach((player, i) => { player.position = [0, 10, 20, 30][i]; });
  for (const [i, id] of ['ca-mau', 'da-nang', 'ha-noi'].entries()) {
    game.properties[id].ownerId = game.players[i].id;
    game.properties[id].level = (i + 1) as 1 | 2 | 3;
  }
  return game;
}
const rolls = [[3, 5], [6, 2], [4, 1], [2, 3]] as const;

export default function PixiPreview() {
  const [game, setGame] = useState(createPreview);
  const [rollIndex, setRollIndex] = useState(0);
  const [detail, setDetail] = useState('Nhà mẫu cấp 1 · 2 · 3 trên bàn cờ');
  const rolling = game.phase === 'ROLLING';
  const busy = rolling || game.phase === 'MOVING';
  useEffect(() => {
    if (!busy) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setGame(previous => {
      if (previous.phase === 'ROLLING') {
        const values = rolls[rollIndex % rolls.length];
        return { ...previous, dice: { values, total: values[0] + values[1] },
          movement: { remaining: values[0] + values[1], direction: 1 }, phase: 'MOVING' };
      }
      const remaining = (previous.movement?.remaining ?? 1) - 1;
      return { ...previous, players: previous.players.map((player, i) => i ? player : { ...player, position: (player.position + 1) % BOARD.length }),
        movement: remaining ? { remaining, direction: 1 } : null, phase: remaining ? 'MOVING' : 'WAITING_FOR_ROLL' };
    }), reduced ? 10 : rolling ? 700 : 130);
    return () => clearTimeout(timer);
  }, [busy, rolling, rollIndex, game]);

  const controls = <div className="board-center"><div className="turn-console preview-console">
    <div className="turn-pill">BẢN THỬ ĐỒ HỌA 2.5D</div>
    <div className="phase-label">{rolling ? 'Thử chuyển động xúc xắc…' : game.phase === 'MOVING' ? 'Quân cờ đang di chuyển…' : 'Góc nhìn cố định · Chạm ô để xem tên'}</div>
    <div className="dice-action-row"><Dice values={game.dice?.values} total={game.dice?.total} rolling={rolling}/>
      <button className="roll-button" disabled={busy} onClick={() => { setRollIndex(i => i + 1); setGame(previous => ({ ...previous, phase: 'ROLLING' })); }}>THỬ XÚC XẮC</button>
    </div>
    <p className="preview-detail" aria-live="polite">{detail}</p>
  </div></div>;

  return <main className="game-screen graphics-preview">
    <header className="topbar"><div className="players" style={{ gridTemplateColumns: 'repeat(4,minmax(0,1fr))' }}>
      {game.players.map((player, i) => <div className={`player-chip ${i === 0 ? 'active' : ''}`} key={player.id}>
        <PlayerIndicator index={i}/><span className="player-copy"><strong>{player.name}</strong><small>Quân cờ {i + 1}</small></span>
      </div>)}
    </div><a className="icon-button preview-exit" href="/" aria-label="Trở về màn hình chơi">↩</a></header>
    <div className="game-stage"><Board game={game} controls={controls} onProperty={id => {
      const p = PROPERTIES.find(property => property.id === id);
      if (p) setDetail(`${p.name} · ${p.landmark}`);
    }} onAssets={() => {}} onLog={() => {}}/></div>
    <div className="portrait-warning"><div>📱↻</div><strong>Hãy xoay ngang điện thoại</strong><small>Bản thử được tối ưu cho chế độ Landscape.</small></div>
  </main>;
}
