import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BOARD } from '../game/data/board';
import { PROPERTIES } from '../game/data/properties';
import type { GameState } from '../game/types/domain';
import { TabletopScene } from '../rendering/tabletopScene';
import { TILE_LABELS } from '../game/data/tileLabels';
import { SQUARE_TILES, type CameraMode } from '../rendering/squareBoard';

export default function ThreeBoard({ game, mode, onSelect, onUnavailable, immersive=false, interactionDisabled=false, framingKey='' }: { game: GameState; mode: CameraMode; onSelect: (index: number) => void; onUnavailable?: () => void; immersive?:boolean; interactionDisabled?:boolean; framingKey?:string }) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<TabletopScene | null>(null);
  const latest = useRef({ game, mode, onSelect, onUnavailable, interactionDisabled });
  const [error, setError] = useState(false);
  useLayoutEffect(() => { latest.current = { game, mode, onSelect, onUnavailable, interactionDisabled }; scene.current?.setGame(game); scene.current?.setMode(mode); }, [game, mode, onSelect, onUnavailable, interactionDisabled]);
  const frame=()=>{const element=host.current,board=element?.closest('.play-board');if(!element||!board||!immersive)return;const origin=element.getBoundingClientRect();scene.current?.setFraming([...board.querySelectorAll<HTMLElement>('.game-occluder')].filter(el=>getComputedStyle(el).visibility!=='hidden'&&el.offsetWidth>0).map(el=>{const r=el.getBoundingClientRect();return {left:r.left-origin.left,top:r.top-origin.top,right:r.right-origin.left,bottom:r.bottom-origin.top};}));};
  useLayoutEffect(()=>{const id=requestAnimationFrame(frame);return()=>cancelAnimationFrame(id);},[framingKey]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let observer: ResizeObserver | undefined;
    const resize = () => {
      const visible = !document.hidden && element.clientWidth > 0 && element.clientHeight > 0;
      scene.current?.setVisible(visible);
      if (visible) {scene.current?.resize(element.clientWidth, element.clientHeight);frame();}
    };
    const motion = () => scene.current?.setReducedMotion(media.matches);
    const visibility = resize;
    const select = (event: PointerEvent) => {
      if(latest.current.interactionDisabled)return;
      const index = scene.current?.pick(event.clientX, event.clientY);
      if (index != null) latest.current.onSelect(index);
    };
    const lost = (event: Event) => { event.preventDefault(); setError(true); scene.current?.setVisible(false); latest.current.onUnavailable?.(); };
    try {
      scene.current = new TabletopScene(element, latest.current.game, immersive);
      scene.current.setMode(latest.current.mode); motion();
      scene.current.renderer.domElement.addEventListener('pointerup', select);
      scene.current.renderer.domElement.addEventListener('webglcontextlost', lost);
      observer = new ResizeObserver(resize); observer.observe(element);if(immersive)element.closest('.play-board')?.querySelectorAll('.game-occluder').forEach(el=>observer!.observe(el));
      document.addEventListener('visibilitychange', visibility); media.addEventListener('change', motion);
    } catch (cause) { console.warn('3D renderer unavailable; using DOM fallback', cause); setError(true); latest.current.onUnavailable?.(); }
    return () => {
      observer?.disconnect(); document.removeEventListener('visibilitychange', visibility); media.removeEventListener('change', motion);
      scene.current?.renderer.domElement.removeEventListener('pointerup', select);
      scene.current?.renderer.domElement.removeEventListener('webglcontextlost', lost);
      scene.current?.destroy(); scene.current = null;
    };
  }, []);
  return <div className="three-board-host" ref={host} data-renderer="three-webgl" data-camera-mode={mode}>
    {error && <div className="three-error" role="alert">Không mở được cảnh 3D trên trình duyệt này.<br/><a href="/">Trở về ván chơi</a></div>}
    <div className="three-accessibility" aria-label="Các ô trên bàn cờ">
      {BOARD.map(tile => {
        const definition = PROPERTIES.find(p => p.id === tile.propertyId);
        const label = definition?.name ?? tile.name ?? TILE_LABELS[tile.type], point = SQUARE_TILES[tile.index];
        return <button key={tile.index} data-tile={tile.index} data-world-x={point.x} data-world-z={point.z} data-size={point.size} data-width={point.width} data-depth={point.depth}
          data-kind={definition?.kind ?? tile.type} disabled={interactionDisabled} className={definition ? 'three-property' : 'three-special'} onClick={() => onSelect(tile.index)} aria-label={`Ô ${tile.index + 1}: ${label}`}>{label}</button>;
      })}
    </div>
  </div>;
}
