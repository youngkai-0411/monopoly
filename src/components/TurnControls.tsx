import type { GameState } from '../game/types/domain';
import { currentPlayer } from '../game/engine/turns';
import { useGameStore } from '../store/gameStore';
import { Dice } from './Dice';
import { decisionPhase } from './gameplayUI';
export const phaseLabel:Record<GameState['phase'],string>={
 GAME_START:'Chuẩn bị ván',TURN_START:'Chuyển lượt',WAITING_FOR_ROLL:'Sẵn sàng khám phá',JAIL_DECISION:'Chọn cách ra tù',ROLLING:'Đang tung xúc xắc…',MOVING:'Đang di chuyển…',RESOLVING_TILE:'Đã đến nơi',PROPERTY_DECISION:'Một cơ hội đầu tư',UTILITY_ROLL:'Đổ riêng để tính thuê',RENT:'Thanh toán tiền thuê',EVENT:'Một bất ngờ mới',LIQUIDATION:'Cần tiền trả nợ',BANKRUPTCY:'Người chơi phá sản',OPTIONAL_ACTIONS:'Quản lý hoặc tiếp tục',TURN_END:'Kết thúc lượt',GAME_OVER:'Đã có người chiến thắng',
};
export function TurnControls({game}:{game:GameState;onAssets?:()=>void;onLog?:()=>void}){
 const dispatch=useGameStore(s=>s.dispatch),locked=useGameStore(s=>s.locked),player=currentPlayer(game);
 const roll=game.phase==='WAITING_FOR_ROLL',end=game.phase==='OPTIONAL_ACTIONS',moving=['ROLLING','MOVING','RESOLVING_TILE'].includes(game.phase);
 if(decisionPhase(game.phase))return null;
 return <div className="board-center"><div className="turn-console" data-compact={moving}><div className="turn-heading"><span className="section-kicker">Lượt của</span><strong className="turn-name">{player.name}</strong></div>{(roll||end||moving)&&<Dice values={game.dice?.values} total={game.dice?.total} rolling={game.phase==='ROLLING'}/>}
 {(roll||end)?<button className="roll-button" disabled={locked} onClick={()=>dispatch({type:end?'END_TURN':'ROLL'})}>{end?(game.extraRoll&&!player.jailed?'ĐỔ THÊM →':'KẾT THÚC LƯỢT →'):'ĐỔ XÚC XẮC'}</button>:<p className="phase-label" role="status">{phaseLabel[game.phase]}</p>}</div></div>;
}
