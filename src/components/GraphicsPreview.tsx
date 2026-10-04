import { lazy, Suspense, useEffect, useState } from 'react';
import { Dice } from './Dice';
import { PlayerIndicator } from './PlayerIndicator';
import { createInitialGame } from '../game/engine/setup';
import { BOARD } from '../game/data/board';
import { PROPERTIES } from '../game/data/properties';
import type { GameState } from '../game/types/domain';
import { DEMO_TIMING, type CameraMode, type DemoPhase } from '../rendering/squareBoard';
import { TILE_LABELS } from '../game/data/tileLabels';

const ThreeBoard = lazy(() => import('./ThreeBoard'));
interface Demo { game: GameState; phase: DemoPhase; remaining: number; turn: number }

// Presentation fixture only. No store actions, purchases or economy changes.
function initialDemo(): Demo {
  const game = createInitialGame(['Nón lá', 'Mũ xanh', 'Tóc búi', 'Mũ vàng']);
  game.phase = 'WAITING_FOR_ROLL'; game.dice = { values: [3, 2], total: 5 };
  game.players.forEach((player, i) => { player.position = [0, 10, 20, 30][i]; });
  for (const [i, id] of ['ca-mau', 'da-nang', 'ha-noi'].entries()) {
    game.properties[id].ownerId = game.players[i].id; game.properties[id].level = (i + 1) as 1 | 2 | 3;
  }
  return { game, phase: 'OVERVIEW', remaining: 0, turn: 0 };
}

function advanceDemo(demo: Demo): Demo {
  const { game, phase } = demo;
  if (phase === 'FOCUS') return { ...demo, phase: 'ROLLING', game: { ...game, phase: 'ROLLING' } };
  if (phase === 'ROLLING') return { ...demo, phase: 'MOVING', remaining: game.dice!.total, game: { ...game, phase: 'MOVING' } };
  if (phase === 'MOVING') {
    const remaining = demo.remaining - 1;
    return { ...demo, remaining, phase: remaining ? 'MOVING' : 'LANDING', game: { ...game,
      phase: remaining ? 'MOVING' : 'OPTIONAL_ACTIONS',
      players: game.players.map(player => player.id === game.currentPlayerId ? { ...player, position: (player.position + 1) % BOARD.length } : player) } };
  }
  if (phase === 'LANDING') return { ...demo, phase: 'RETURNING' };
  if (phase === 'RETURNING') {
    const turn = (demo.turn + 1) % game.players.length;
    return { ...demo, phase: 'OVERVIEW', turn, game: { ...game, phase: 'WAITING_FOR_ROLL', currentPlayerId: game.players[turn].id } };
  }
  return demo;
}
const phaseCopy: Record<DemoPhase, string> = {
  OVERVIEW: 'Toàn cảnh bàn cờ', FOCUS: 'Tiến gần nhân vật', ROLLING: 'Đổ xúc xắc',
  MOVING: 'Camera theo di chuyển', LANDING: 'Dừng tại ô đến', RETURNING: 'Lùi ra toàn cảnh',
};

export default function GraphicsPreview() {
  const [demo, setDemo] = useState(initialDemo);
  const [manualMode, setManualMode] = useState<CameraMode | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const busy = demo.phase !== 'OVERVIEW';
  const mode = manualMode ?? (demo.phase === 'OVERVIEW' || demo.phase === 'RETURNING' ? 'overview' : 'follow');
  const active = demo.game.players[demo.turn];
  const tile = BOARD[selected ?? active.position];
  const property = PROPERTIES.find(p => p.id === tile.propertyId);
  const label = property?.name ?? TILE_LABELS[tile.type];
  useEffect(() => {
    if (demo.phase === 'OVERVIEW') return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setDemo(advanceDemo), reduced ? 30 : DEMO_TIMING[demo.phase]);
    return () => clearTimeout(timer);
  }, [demo]);
  return <main className="game-screen graphics-preview three-preview" data-demo-phase={demo.phase} data-selected-tile={selected ?? ''}>
    <header className="topbar"><div className="players" style={{ gridTemplateColumns: 'repeat(4,minmax(0,1fr))' }}>
      {demo.game.players.map((player, i) => <div className={`player-chip ${i === demo.turn ? 'active' : ''}`} key={player.id}>
        <PlayerIndicator index={i}/><span className="player-copy"><strong>{player.name}</strong><small>{i === demo.turn ? 'Đến lượt' : 'Quân cờ mẫu'}</small></span>
      </div>)}
    </div><a className="icon-button preview-exit" href="/" aria-label="Trở về màn hình chơi">↩</a></header>
    <div className="game-stage three-stage">
      <Suspense fallback={<div className="three-loading">Đang dựng bàn cờ…</div>}><ThreeBoard game={demo.game} mode={mode} onSelect={setSelected}/></Suspense>
      <aside className="three-status" aria-live="polite"><span className="three-kicker">VIỆT NAM · 40 Ô</span>
        <strong>{demo.phase === 'OVERVIEW' && mode === 'follow' ? 'Cận cảnh nhân vật' : phaseCopy[demo.phase]}</strong><p>{label}</p><small>{property?.landmark ?? '40 ô · Bốn góc đặc biệt'}</small>
      </aside>
      <div className="three-camera-buttons"><button className={mode === 'overview' ? 'selected' : ''} disabled={busy} onClick={() => setManualMode('overview')}>Toàn bàn</button>
        <button className={mode === 'follow' ? 'selected' : ''} disabled={busy} onClick={() => setManualMode('follow')}>Theo nhân vật</button></div>
      <div className="three-toolbar"><span><PlayerIndicator index={demo.turn}/> {active.name}</span>
        <Dice values={demo.game.dice?.values} total={demo.game.dice?.total} rolling={demo.phase === 'ROLLING'}/>
        <button className="roll-button" disabled={busy} onClick={() => { setSelected(null); setManualMode(null); setDemo(previous => ({ ...previous, phase: 'FOCUS' })); }}>
          {busy ? 'ĐANG DIỄN…' : 'THỬ MỘT LƯỢT →'}
        </button><small>{busy ? phaseCopy[demo.phase] : 'Tiến gần → theo bước → lùi ra'}</small>
      </div>
    </div>
    <div className="portrait-warning"><div>📱↻</div><strong>Hãy xoay ngang điện thoại</strong><small>Bàn cờ được tối ưu cho chế độ Landscape.</small></div>
  </main>;
}
