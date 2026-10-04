import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Application } from 'pixi.js';
import { BOARD } from '../game/data/board';
import { PROPERTIES } from '../game/data/properties';
import type { GameState } from '../game/types/domain';
import { createBoardGeometry, type BoardGeometry } from '../rendering/boardGeometry';
import { BoardScene } from '../rendering/boardScene';
import { TurnControls } from './TurnControls';

const properties = new Map(PROPERTIES.map(p => [p.id, p]));
const specialLabels: Record<string, { label: string; symbol: string }> = {
  START: { label: 'Xuất phát', symbol: '↗' }, CHANCE: { label: 'Cơ hội', symbol: '?' },
  LIFE: { label: 'Cuộc sống', symbol: '♥' }, TAX: { label: 'Thuế', symbol: '−' },
  JAIL: { label: 'Nhà tù', symbol: '▥' }, GO_TO_JAIL: {label:'Đi tù',symbol:'➜'}, REST: { label: 'Nghỉ ngơi', symbol: '☀' },
  TRAVEL: { label: 'Du lịch', symbol: '✈' }, TRAVEL_FUND: { label: 'Quỹ du lịch', symbol: '◆' },
};
export interface BoardProps {
  game: GameState;
  onProperty: (id: string) => void;
  onAssets: () => void;
  onLog: () => void;
  controls?: ReactNode;
}

export default function PixiBoard({ game, onProperty, onAssets, onLog, controls, onUnavailable }: BoardProps & { onUnavailable: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<BoardScene | null>(null);
  const latest = useRef(game);
  const [geometry, setGeometry] = useState<BoardGeometry | null>(null);
  useLayoutEffect(() => { latest.current = game; scene.current?.setGame(game); }, [game]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    let initialized = false;
    let destroyed = false;
    let observer: ResizeObserver | undefined;
    const app = new Application();
    const release = () => {
      if (!initialized || destroyed) return;
      destroyed = true;
      app.destroy(true, { children: true });
    };
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const visibility = () => scene.current?.setVisible(!document.hidden);
    const motion = () => scene.current?.setReducedMotion(media.matches);
    const lost = (event: Event) => { event.preventDefault(); if (!disposed) onUnavailable(); };
    const resize = () => {
      if (disposed || element.clientWidth < 1 || element.clientHeight < 1) return;
      const next = createBoardGeometry(element.clientWidth, element.clientHeight);
      setGeometry(next);
      scene.current?.resize(next, latest.current);
    };
    async function initialize() {
      if (!element) return;
      try {
        await app.init({ width: 1, height: 1, preference: 'webgl', autoStart: false, sharedTicker: false,
          backgroundAlpha: 0, antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 1.5), autoDensity: true });
        initialized = true;
        if (disposed) { release(); return; }
        app.canvas.setAttribute('aria-hidden', 'true');
        app.canvas.addEventListener('webglcontextlost', lost);
        element.prepend(app.canvas);
        scene.current = new BoardScene(app);
        motion();
        resize();
        observer = new ResizeObserver(resize);
        observer.observe(element);
        document.addEventListener('visibilitychange', visibility);
        media.addEventListener('change', motion);
      } catch (error) {
        release();
        if (!disposed) { console.warn('Board renderer unavailable; using the accessible DOM board.', error); onUnavailable(); }
      }
    }
    void initialize();
    return () => {
      disposed = true;
      observer?.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      media.removeEventListener('change', motion);
      scene.current?.destroy();
      scene.current = null;
      if (initialized && !destroyed) {
        app.canvas.removeEventListener('webglcontextlost', lost);
        release();
      }
    };
  }, [onUnavailable]);

  return <section className="board-shell graphic-board" aria-label="Bàn cờ Tỷ Phú Việt Nam">
    <div className="pixi-board-host" ref={host} data-renderer="pixi-webgl">
      {geometry && <>
        {BOARD.map(tile => {
          const box = geometry.tiles[tile.index];
          const style = { left: box.x, top: box.y, width: box.width, height: box.height };
          const definition = tile.propertyId ? properties.get(tile.propertyId) : null;
          const occupants = game.players.filter(p => !p.isBankrupt && p.position === tile.index).map(p => p.name);
          if (definition) {
            const state = game.properties[definition.id];
            const owner = game.players.find(p => p.id === state.ownerId);
            return <button key={tile.index} className={`scene-tile property ${box.side ? 'scene-side' : ''}`}
              style={style} data-tile={tile.index} title={`${definition.name} — ${definition.landmark}`}
              onClick={() => onProperty(definition.id)}
              aria-label={`${definition.name}, ${definition.price} Tr, ${owner ? `của ${owner.name}, cấp ${state.level}` : 'chưa có chủ'}${occupants.length ? `, ${occupants.join(', ')} tại đây` : ''}`}>
              <span className="scene-tile-name">{definition.name}</span><span className="scene-price">{definition.price} Tr</span>
            </button>;
          }
          const special = specialLabels[tile.type];
          return <div key={tile.index} className={`scene-tile scene-special ${box.side ? 'scene-side' : ''}`} style={style}
            data-tile={tile.index} aria-label={`${special.label}${occupants.length ? `, ${occupants.join(', ')} tại đây` : ''}`}>
            <span className="scene-symbol" aria-hidden="true">{special.symbol}</span><span className="scene-tile-name">{special.label}</span>
          </div>;
        })}
        <div className="scene-center" style={{ left: geometry.center.x, top: geometry.center.y, width: geometry.center.width, height: geometry.center.height }}>
          {controls ?? <TurnControls game={game} onAssets={onAssets} onLog={onLog}/>}
        </div>
      </>}
    </div>
  </section>;
}
