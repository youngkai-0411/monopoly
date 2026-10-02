import { BOARD } from '../game/data/board';
import { PROPERTIES } from '../game/data/properties';
import { BOARD_ROWS, boardCell } from './boardLayout';
import type { GameState } from '../game/types/domain';
import { motion } from 'framer-motion';
import { PLAYER_COLORS } from './format';
import { TurnControls } from './TurnControls';

const properties = Object.fromEntries(PROPERTIES.map((p) => [p.id, p]));

const groupClass: Record<string, string> = {
  'mien-tay': 'g-mien-tay', 'phuong-nam': 'g-phuong-nam', 'cao-nguyen': 'g-cao-nguyen',
  'duyen-hai': 'g-duyen-hai', 'di-san': 'g-di-san', 'mien-trung-bac': 'g-mien-trung-bac',
  'mien-bac': 'g-mien-bac', 'do-thi': 'g-do-thi',
};

const specials: Record<string, { icon: string; label: string; tone: string }> = {
  START: { icon: '🇻🇳', label: 'Xuất phát', tone: 'start' },
  CHANCE: { icon: '🎴', label: 'Cơ hội', tone: 'chance' },
  LIFE: { icon: '✨', label: 'Cuộc sống', tone: 'life' },
  TAX: { icon: '💸', label: 'Thuế', tone: 'tax' },
  DETENTION: { icon: '🚔', label: 'Tạm giữ', tone: 'detention' },
  REST: { icon: '🏖️', label: 'Nghỉ ngơi', tone: 'rest' },
  TRAVEL: { icon: '✈️', label: 'Du lịch', tone: 'travel' },
  TRAVEL_FUND: { icon: '🎁', label: 'Quỹ du lịch', tone: 'fund' },
};

export function Board({game,onProperty,onAssets,onLog}: {game:GameState;onProperty:(id:string)=>void;onAssets:()=>void;onLog:()=>void}) {
  const tokens = (index: number) => <span className="tile-tokens" aria-label="Người chơi tại ô này">{game.players.map((player,i)=>!player.isBankrupt&&player.position===index ? <motion.span layoutId={`token-${player.id}`} transition={{duration:.1}} className="board-token" style={{backgroundColor:PLAYER_COLORS[i]}} key={player.id} aria-label={player.name}/> : null)}</span>;
  return <section className="board-shell" aria-label="Bàn cờ Tỷ Phú Việt Nam">
    <div className="board-grid">
      {BOARD.map((tile) => {
        const style = boardCell(tile.index);
        const sideClass = style.gridRow !== 1 && style.gridRow !== BOARD_ROWS ? 'side-tile' : '';
        if (tile.type === 'PROPERTY' && tile.propertyId) {
          const p = properties[tile.propertyId];
          const runtime=game.properties[p.id];
          const ownerIndex=game.players.findIndex(player=>player.id===runtime.ownerId);
          return <button key={tile.index} className={`tile property ${sideClass} ${groupClass[p.groupId]}`} style={style} title={`${p.name} — ${p.landmark}`} onClick={()=>onProperty(p.id)} aria-label={`${p.name}, ${p.price} Tr${runtime.ownerId?`, của ${game.players[ownerIndex].name}, cấp ${runtime.level}`:', chưa có chủ'}`}>
            <span className="tile-index">{tile.index + 1}</span>
            <span className="group-band" />
            <span className="tile-name property-name">{p.name}</span>
            <span className="tile-price">{p.price} Tr</span>
            {ownerIndex>=0 && <span className="owner-mark" style={{backgroundColor:PLAYER_COLORS[ownerIndex]}} aria-hidden="true"/>}
            {runtime.level>0 && <span className="tile-level">{runtime.level}★</span>}
            {tokens(tile.index)}
          </button>;
        }
        const meta = specials[tile.type];
        return <div key={tile.index} className={`tile special ${sideClass} ${meta.tone}`} style={style} aria-label={meta.label}>
          <span className="tile-index">{tile.index + 1}</span>
          <span className="special-icon">{meta.icon}</span>
          <span className="tile-name">{meta.label}</span>
          {tile.type === 'TAX' && <span className="tile-price">-{tile.amount}Tr</span>}
          {tokens(tile.index)}
        </div>;
      })}

      <TurnControls game={game} onAssets={onAssets} onLog={onLog}/>
    </div>
  </section>;
}
