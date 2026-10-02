import { describe, expect, it } from 'vitest';
import { reduceGame } from '../src/game/engine/actions';
import { createInitialGame } from '../src/game/engine/setup';
import { CARDS, CHANCE_CARDS, LIFE_CARDS, INSURANCE_CARD_ID } from '../src/game/data/cards';
import { seededRandom } from '../src/game/engine/random';
import { liquidationValue, rentFor } from '../src/game/engine/selectors';
import type { GameAction, GameState } from '../src/game/types/domain';

type Input = GameAction extends infer A ? A extends GameAction ? Omit<A, 'playerId'> : never : never;
function act(game: GameState, action: Input, random = () => 0) { return reduceGame(game, { ...action, playerId:game.currentPlayerId } as GameAction, random); }
function ready() { return act(createInitialGame(['A','B','C'],seededRandom(1)),{type:'START_TURN'}); }
function land(game: GameState, position: number) { const next = structuredClone(game); next.players.find(p=>p.id===next.currentPlayerId)!.position=position; next.phase='RESOLVING_TILE'; return act(next,{type:'RESOLVE_TILE'}); }
function finishMove(game: GameState) { let next=game; while(next.phase==='MOVING') next=act(next,{type:'STEP_MOVE'}); return next; }
function event(game: GameState, id: string) {
  const next=structuredClone(game);
  for(const deck of [next.chanceDeck,next.lifeDeck]) { deck.drawPile=deck.drawPile.filter(card=>card!==id); deck.discardPile=deck.discardPile.filter(card=>card!==id); }
  next.eventCardId=id; next.phase='EVENT'; return act(next,{type:'APPLY_EVENT'});
}

describe('M4 dice, movement and action guards', () => {
  it('rejects wrong player, repeated roll and all user actions during movement without mutating state', () => {
    const game=ready(); const before=structuredClone(game);
    expect(()=>reduceGame(game,{type:'ROLL',playerId:'player-2'})).toThrow();
    const rolling=act(game,{type:'ROLL'});
    expect(()=>act(rolling,{type:'ROLL'})).toThrow();
    const moving=act(rolling,{type:'COMPLETE_ROLL'});
    for(const action of [{type:'ROLL'},{type:'BUY'},{type:'END_TURN'},{type:'UPGRADE',propertyId:'ca-mau'}] as Input[]) expect(()=>act(moving,action)).toThrow();
    expect(game).toEqual(before); expect(moving.dice?.total).toBe(2);
  });
  it('rewards only forward crossings, including exact landing on Start', () => {
    let game=ready(); game.players[0].position=35;
    game=act(act(game,{type:'ROLL'}),{type:'COMPLETE_ROLL'});
    game=finishMove(game); expect(game.players[0].position).toBe(1); expect(game.players[0].money).toBe(2200);
    game=event(game,'chance-12'); game=finishMove(game);
    expect(game.players[0].position).toBe(34); expect(game.players[0].money).toBe(2200);
    game=event(game,'chance-08'); game=finishMove(game); game=act(game,{type:'RESOLVE_TILE'});
    expect(game.players[0].position).toBe(0); expect(game.players[0].money).toBe(2400);
  });
  it('consumes traffic and coffee on the next roll and cancels opposite statuses', () => {
    let game=event(ready(),'life-14'); game.phase='WAITING_FOR_ROLL';
    game=act(act(game,{type:'ROLL'}),{type:'COMPLETE_ROLL'});
    expect(game.dice?.values).toHaveLength(1); expect(game.players[0].statusEffects).toEqual([]);
    game=event(ready(),'life-15'); game.phase='WAITING_FOR_ROLL'; game=act(act(game,{type:'ROLL'}),{type:'COMPLETE_ROLL'});
    expect(game.dice?.total).toBe(4);
    game=event(event(ready(),'life-14'),'life-14'); expect(game.players[0].statusEffects).toEqual(['TRAFFIC']);
    game=event(game,'life-15'); expect(game.players[0].statusEffects).toEqual([]);
  });
});

describe('M5–M7 buy, rent and upgrades', () => {
  it('buys or skips without auction, charges once, and prevents unaffordable purchases', () => {
    const decision=land(ready(),1); const bought=act(decision,{type:'BUY'});
    expect(bought.properties['ca-mau'].ownerId).toBe('player-1'); expect(bought.players[0].money).toBe(1840);
    expect(()=>act(bought,{type:'BUY'})).toThrow();
    const skipped=act(decision,{type:'SKIP'}); expect(skipped.properties['ca-mau'].ownerId).toBeNull();
    decision.players[0].money=0; expect(()=>act(decision,{type:'BUY'})).toThrow(); expect(decision.players[0].money).toBe(0);
  });
  it('upgrades without a full group; limits levels and applies group bonus afterward', () => {
    let game=act(land(ready(),17),{type:'BUY'});
    game=act(game,{type:'UPGRADE',propertyId:'quang-ngai'});
    game=act(game,{type:'UPGRADE',propertyId:'quang-ngai'});
    expect(rentFor(game,'quang-ngai')).toBe(190);
    game.properties['nha-trang'].ownerId='player-1'; game.properties['quy-nhon'].ownerId='player-1';
    expect(rentFor(game,'quang-ngai')).toBe(285);
    game=act(game,{type:'UPGRADE',propertyId:'quang-ngai'});
    expect(()=>act(game,{type:'UPGRADE',propertyId:'quang-ngai'})).toThrow();
    expect(()=>act(game,{type:'UPGRADE',propertyId:'ha-noi'})).toThrow();
    game.properties['hai-phong'].ownerId='player-2'; game.properties['ha-noi'].ownerId='player-2';
    expect(rentFor(game,'ha-noi')).toBe(Math.round(45*1.3));
  });
  it('skips self-rent and transfers opponent rent exactly once', () => {
    let game=ready(); game.properties['ca-mau'].ownerId='player-1'; expect(land(game,1).phase).toBe('OPTIONAL_ACTIONS');
    game.properties['ca-mau'].ownerId='player-2'; game=land(game,1); expect(game.rent?.amount).toBe(20);
    game=act(game,{type:'PAY_RENT'}); expect(game.players[0].money).toBe(1980); expect(game.players[1].money).toBe(2020);
    expect(()=>act(game,{type:'PAY_RENT'})).toThrow();
  });
});

describe('M8 events and decks', () => {
  it('defines 32 unique cards and draws every card once before reshuffling', () => {
    expect(CHANCE_CARDS).toHaveLength(16); expect(LIFE_CARDS).toHaveLength(16); expect(new Set(CARDS.map(card=>card.id)).size).toBe(32);
    let game=ready(); const drawn:string[]=[];
    for(let i=0;i<16;i++) {
      game=land(game,4); drawn.push(game.eventCardId!);
      // Accept every card through the engine. Its effects are independent of
      // this deck-cycle assertion; reset turn location/resources between draws.
      game=act(game,{type:'APPLY_EVENT'});
      game.players.forEach(player=>{player.money=2000;player.isBankrupt=false;}); game.payments=[];
    }
    expect(new Set(drawn).size).toBe(16);
    expect(game.players[0].heldCards).toEqual([INSURANCE_CARD_ID]);
    expect(game.chanceDeck.discardPile).not.toContain(INSURANCE_CARD_ID);
    game=land(game,4); expect(game.eventCardId).not.toBe(INSURANCE_CARD_ID);
    expect(game.chanceDeck.drawPile).toHaveLength(14);
  });
  it('uses rent insurance only by explicit choice and then discards it', () => {
    let game=event(ready(),INSURANCE_CARD_ID); game.properties['ca-mau'].ownerId='player-2'; game=land(game,1);
    expect(game.phase).toBe('RENT'); expect(game.players[0].heldCards).toHaveLength(1);
    game=act(game,{type:'USE_INSURANCE'}); expect(game.players[0].money).toBe(2000);
    expect(game.players[0].heldCards).toEqual([]); expect(game.chanceDeck.discardPile).toContain(INSURANCE_CARD_ID);
    game=event(event(ready(),INSURANCE_CARD_ID),INSURANCE_CARD_ID);
    expect(game.players[0].money).toBe(2100); expect(game.players[0].heldCards).toHaveLength(1);
  });
  it('resolves destinations after event moves and handles no available unowned property', () => {
    let game=event(ready(),'chance-10'); game=finishMove(game); game=act(game,{type:'RESOLVE_TILE'});
    expect(game.phase).toBe('PROPERTY_DECISION'); expect(game.players[0].position).toBe(1);
    game=ready(); Object.values(game.properties).forEach(p=>p.ownerId='player-2');
    expect(event(game,'chance-10').phase).toBe('OPTIONAL_ACTIONS');
    game=event(ready(),'chance-09'); game=finishMove(game); game=act(game,{type:'RESOLVE_TILE'});
    expect(game.players[0].money).toBe(1900); // destination index 6 is Tax
  });
  it('caps property effects and transfers between every surviving player', () => {
    let game=ready(); Object.values(game.properties).forEach(p=>p.ownerId='player-1');
    expect(event(game,'chance-04').players[0].money).toBe(2200);
    expect(event(game,'chance-07').players[0].money).toBe(1800);
    game=event(ready(),'chance-13'); expect(game.players.map(p=>p.money)).toEqual([2100,1950,1950]);
    game=event(ready(),'life-10'); expect(game.players.map(p=>p.money)).toEqual([1950,2025,2025]);
  });
  it('moves to the nearest forward property and rest, awarding forward Start crossings', () => {
    let game=ready(); game.players[0].position=33;
    game=finishMove(event(game,'chance-11')); game=act(game,{type:'RESOLVE_TILE'});
    expect(game.players[0].position).toBe(1); expect(game.players[0].money).toBe(2200); expect(game.phase).toBe('PROPERTY_DECISION');
    game=ready(); game.players[0].position=30;
    game=finishMove(event(game,'life-12')); game=act(game,{type:'RESOLVE_TILE'});
    expect(game.players[0].position).toBe(9); expect(game.players[0].money).toBe(2200); expect(game.phase).toBe('OPTIONAL_ACTIONS');
  });
  it.each(CARDS.filter(card=>['MONEY','NONE','STATUS'].includes(card.effectType)))('applies $id without a placeholder', card=>{
    const game=event(ready(),card.id);
    expect(game.players[0].money).toBe(2000+(card.effectType==='MONEY'?card.value!:0));
    expect(game.eventCardId).toBeNull();
    expect(game.phase).toBe('OPTIONAL_ACTIONS');
  });
});

describe('M9 special tiles', () => {
  it('charges tax/detention, leaves rest free and pays the travel fund', () => {
    expect(land(ready(),6).players[0].money).toBe(1900);
    expect(land(ready(),18).players[0].money).toBe(1900);
    expect(land(ready(),9).players[0].money).toBe(2000);
    expect(land(ready(),34).players[0].money).toBe(2100);
  });
  it('travels forward only to a property and resolves it including Start rewards', () => {
    let game=land(ready(),35); expect(()=>act(game,{type:'TRAVEL',destination:4})).toThrow();
    game=act(game,{type:'TRAVEL',destination:1}); game=finishMove(game); game=act(game,{type:'RESOLVE_TILE'});
    expect(game.players[0].money).toBe(2200); expect(game.phase).toBe('PROPERTY_DECISION');
  });
});

describe('M10–M11 liquidation, bankruptcy and winner', () => {
  it('requires liquidation first, includes upgrade investment and resumes a rent payment', () => {
    let game=ready(); game.players[0].money=10;
    game.properties['ca-mau']={propertyId:'ca-mau',ownerId:'player-1',level:2};
    game.properties['ha-noi'].ownerId='player-2';
    expect(liquidationValue(game,'ca-mau')).toBe(180);
    game=act(land(game,33),{type:'PAY_RENT'}); expect(game.phase).toBe('LIQUIDATION');
    expect(()=>act(game,{type:'LIQUIDATE',propertyId:'ha-noi'})).toThrow();
    game=act(game,{type:'LIQUIDATE',propertyId:'ca-mau'});
    expect(game.players[0].money).toBe(145); expect(game.players[1].money).toBe(2045);
    expect(game.properties['ca-mau'].ownerId).toBeNull(); expect(game.properties['ca-mau'].level).toBe(0);
  });
  it('eliminates a debtor only after assets run out and advances their turn', () => {
    let game=ready(); game.players[0].money=0;
    game=land(game,6); expect(game.phase).toBe('BANKRUPTCY'); expect(game.players[0].isBankrupt).toBe(true);
    expect(()=>act(game,{type:'END_TURN'})).toThrow();
    game=act(game,{type:'ACK_BANKRUPTCY'}); expect(game.currentPlayerId).toBe('player-2'); expect(game.phase).toBe('TURN_START');
  });
  it('handles another player liquidation while collecting and resumes the original turn', () => {
    let game=ready(); game.players[1].money=0; game.properties['ca-mau'].ownerId='player-2';
    game=event(game,'chance-13'); expect(game.phase).toBe('LIQUIDATION'); expect(game.payments[0].payerId).toBe('player-2');
    game=act(game,{type:'LIQUIDATE',propertyId:'ca-mau'}); expect(game.players.map(p=>p.money)).toEqual([2100,30,1950]); expect(game.currentPlayerId).toBe('player-1');
  });
  it('resumes outstanding multi-player payments after a different payer goes bankrupt', () => {
    let game=ready(); game.players[1].money=20;
    game=event(game,'chance-13'); expect(game.phase).toBe('BANKRUPTCY'); expect(game.bankruptcyNoticeId).toBe('player-2');
    game=act(game,{type:'ACK_BANKRUPTCY'});
    expect(game.players.map(p=>p.money)).toEqual([2070,0,1950]); expect(game.phase).toBe('OPTIONAL_ACTIONS'); expect(game.currentPlayerId).toBe('player-1');
  });
  it('liquidates the final asset before declaring bankruptcy and returns held insurance to discard', () => {
    let game=event(ready(),INSURANCE_CARD_ID); game.players[0].money=0;
    game.properties['ca-mau'].ownerId='player-1'; game.properties['ha-noi'].ownerId='player-2'; game.properties['ha-noi'].level=3;
    game=act(land(game,33),{type:'PAY_RENT'}); expect(game.phase).toBe('LIQUIDATION');
    game=act(game,{type:'LIQUIDATE',propertyId:'ca-mau'}); expect(game.phase).toBe('BANKRUPTCY');
    expect(game.players[1].money).toBe(2080); expect(game.chanceDeck.discardPile).toContain(INSURANCE_CARD_ID); expect(game.players[0].heldCards).toEqual([]);
  });
  it('declares the last survivor and rejects further actions', () => {
    let game=createInitialGame(['A','B']); game=act(game,{type:'START_TURN'}); game.players[0].money=0;
    game=land(game,6); game=act(game,{type:'ACK_BANKRUPTCY'}); expect(game.phase).toBe('GAME_OVER'); expect(game.winnerId).toBe('player-2');
    expect(()=>act(game,{type:'ROLL'})).toThrow();
  });
});
