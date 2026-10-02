export type PlayerId = string;
export type PropertyId = string;
export type GroupId = string;
export type CardId = string;

export type PropertyLevel = 0 | 1 | 2 | 3;
export type DeckType = 'CHANCE' | 'LIFE';
export type TileType = 'START' | 'PROPERTY' | 'CHANCE' | 'LIFE' | 'TAX' | 'DETENTION' | 'REST' | 'TRAVEL' | 'TRAVEL_FUND';

export type GamePhase =
  | 'GAME_START'
  | 'TURN_START'
  | 'WAITING_FOR_ROLL'
  | 'ROLLING'
  | 'MOVING'
  | 'RESOLVING_TILE'
  | 'PROPERTY_DECISION'
  | 'RENT'
  | 'EVENT'
  | 'SPECIAL'
  | 'LIQUIDATION'
  | 'BANKRUPTCY'
  | 'OPTIONAL_ACTIONS'
  | 'TURN_END'
  | 'GAME_OVER';

export type StatusEffect = 'TRAFFIC' | 'COFFEE';

export interface PropertyDefinition {
  id: PropertyId;
  name: string;
  shortName: string;
  landmark: string;
  groupId: GroupId;
  price: number;
  baseRent: number;
  upgradeCost: number;
}

export interface PropertyState {
  propertyId: PropertyId;
  ownerId: PlayerId | null;
  level: PropertyLevel;
}

export interface GroupDefinition {
  id: GroupId;
  name: string;
  propertyIds: PropertyId[];
  fullGroupRentMultiplier: number;
}

export interface BoardTile {
  index: number;
  type: TileType;
  propertyId?: PropertyId;
  amount?: number;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  money: number;
  position: number;
  statusEffects: StatusEffect[];
  heldCards: CardId[];
  isBankrupt: boolean;
}

export interface DiceState {
  values: readonly number[];
  total: number;
}

export interface DeckState {
  drawPile: CardId[];
  discardPile: CardId[];
}

export interface GameState {
  players: PlayerState[];
  currentPlayerId: PlayerId;
  properties: Record<PropertyId, PropertyState>;
  chanceDeck: DeckState;
  lifeDeck: DeckState;
  phase: GamePhase;
  round: number;
  dice: DiceState | null;
  movement: { remaining: number; direction: 1 | -1 } | null;
  eventCardId: CardId | null;
  rent: { propertyId: PropertyId; ownerId: PlayerId; amount: number } | null;
  payments: Payment[];
  winnerId: PlayerId | null;
  log: GameLogEntry[];
  nextLogId: number;
  bankruptcyNoticeId: PlayerId | null;
}

export interface Payment { payerId: PlayerId; recipientId: PlayerId | null; amount: number; reason: string; }
export interface GameLogEntry { id: number; round: number; message: string; }
export type GameAction = { playerId: PlayerId } & (
  | { type: 'START_TURN' | 'ROLL' | 'COMPLETE_ROLL' | 'STEP_MOVE' | 'RESOLVE_TILE' | 'BUY' | 'SKIP' | 'PAY_RENT' | 'USE_INSURANCE' | 'APPLY_EVENT' | 'ACK_BANKRUPTCY' | 'END_TURN' }
  | { type: 'UPGRADE' | 'LIQUIDATE'; propertyId: PropertyId }
  | { type: 'TRAVEL'; destination: number }
);
