import type { GameState } from '../game/types/domain';
import { currentPlayer } from '../game/engine/turns';
import { useGameStore } from '../store/gameStore';
import { PLAYER_TOKENS } from './format';

const phaseLabel: Record<GameState['phase'],string> = {
  GAME_START:'Chuẩn bị ván chơi', TURN_START:'Chuyển lượt', WAITING_FOR_ROLL:'Đến lượt bạn đổ xúc xắc', ROLLING:'Đang đổ xúc xắc…',
  MOVING:'Đang di chuyển…', RESOLVING_TILE:'Xử lý ô đến…', PROPERTY_DECISION:'Mua tài sản hay bỏ qua?', RENT:'Thanh toán tiền thuê',
  EVENT:'Bạn vừa rút thẻ', SPECIAL:'Chọn điểm đến Du Lịch', LIQUIDATION:'Cần thanh lý để trả nợ', BANKRUPTCY:'Người chơi vừa phá sản', OPTIONAL_ACTIONS:'Quản lý tài sản hoặc kết thúc lượt', TURN_END:'Kết thúc lượt', GAME_OVER:'Ván chơi kết thúc',
};
export function TurnControls({ game, onAssets, onLog }: { game: GameState; onAssets:()=>void; onLog:()=>void }) {
  const dispatch=useGameStore(state=>state.dispatch);
  const locked=useGameStore(state=>state.locked);
  const player=currentPlayer(game);
  const index=game.players.findIndex(p=>p.id===player.id);
  const rolling=game.phase==='ROLLING';
  const canRoll=game.phase==='WAITING_FOR_ROLL';
  const canEnd=game.phase==='OPTIONAL_ACTIONS';
  return <div className="board-center">
    <div className="turn-pill">{PLAYER_TOKENS[index]} LƯỢT CỦA {player.name.toLocaleUpperCase('vi-VN')}</div>
    <div className="phase-label" aria-live="polite">{phaseLabel[game.phase]}{game.phase==='MOVING'?` · ${game.movement?.remaining} bước`:''}</div>
    <div className="dice-action-row">
      <div className={`dice-row ${rolling?'rolling':''}`} aria-label={`Xúc xắc: ${game.dice?.values.join(', ') ?? 'chưa đổ'}`}>
        {(game.dice?.values ?? [0,0]).map((value,i)=><div className="die" key={i}>{value ? ['','⚀','⚁','⚂','⚃','⚄','⚅'][value] : '?'}</div>)}
        <div className="dice-total"><small>TỔNG</small><strong>{game.dice?.total ?? '—'}</strong></div>
      </div>
      <button className="roll-button" disabled={locked || (!canRoll&&!canEnd)} onClick={()=>dispatch({type:canEnd?'END_TURN':'ROLL'})}>{canEnd?'KẾT THÚC LƯỢT →':rolling?'ĐANG ĐỔ…':'🎲 ĐỔ XÚC XẮC'}</button>
    </div>
    <div className="center-tools"><button onClick={onAssets}>Tài sản</button><span>Vòng {game.round}</span><button onClick={onLog}>Nhật ký</button></div>
    <p className="last-log">{game.log.at(-1)?.message}</p>
  </div>;
}
