import { PLAYER_COLORS } from '../visual/tokens';
export function PlayerIndicator({index}:{index:number}) {
  return <span className="player-indicator" style={{backgroundColor:PLAYER_COLORS[index]}} aria-hidden="true"/>;
}
