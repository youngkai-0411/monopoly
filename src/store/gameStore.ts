import { create } from 'zustand';
import type { GameAction, GameState } from '../game/types/domain';
import { createInitialGame } from '../game/engine/setup';
import { canAct, reduceGame } from '../game/engine/actions';

export type ActionInput = GameAction extends infer A ? A extends GameAction ? Omit<A,'playerId'> : never : never;
interface GameStore {
  game: GameState | null;
  error: string | null;
  locked: boolean;
  startLocalGame: (names: string[]) => void;
  dispatch: (action: ActionInput) => boolean;
  advance: (type: 'START_TURN' | 'COMPLETE_ROLL' | 'STEP_MOVE' | 'RESOLVE_TILE') => void;
  clearError: () => void;
  reset: () => void;
}
let unlockTimer: ReturnType<typeof setTimeout> | undefined;
export const useGameStore = create<GameStore>((set,get) => ({
  game: null,
  error: null,
  locked: false,
  startLocalGame: (names) => {
    try { clearTimeout(unlockTimer); set({ game:createInitialGame(names), error:null, locked:false }); }
    catch(error) { set({error:error instanceof Error ? error.message : 'Không thể bắt đầu game.'}); }
  },
  dispatch: (input) => {
    const {game,locked}=get();
    if (!game || locked) return false;
    try {
      const next=reduceGame(game,{...input,playerId:game.currentPlayerId} as GameAction);
      set({game:next,error:null,locked:true});
      clearTimeout(unlockTimer);
      unlockTimer=setTimeout(()=>set({locked:false}),220);
      return true;
    } catch(error) { set({error:error instanceof Error ? error.message : 'Thao tác không hợp lệ.'}); return false; }
  },
  advance: (type) => {
    const game=get().game;
    if (!game || !canAct(game,type)) return;
    try { set({game:reduceGame(game,{type,playerId:game.currentPlayerId}),error:null}); }
    catch(error) { set({error:error instanceof Error ? error.message : 'Không thể xử lý lượt.'}); }
  },
  clearError:()=>set({error:null}),
  reset: () => { clearTimeout(unlockTimer); set({game:null,error:null,locked:false}); },
}));
