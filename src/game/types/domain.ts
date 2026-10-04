export type PlayerId = string;
export type PropertyId = string;
export type GroupId = string;
export type CardId = string;
export type PropertyLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type DeckType = 'CHANCE' | 'LIFE';
export type TileType = 'START' | 'PROPERTY' | 'RAILROAD' | 'UTILITY' | 'CHANCE' | 'LIFE' | 'TAX' | 'JAIL' | 'REST' | 'GO_TO_JAIL';
export type GamePhase = 'GAME_START' | 'TURN_START' | 'WAITING_FOR_ROLL' | 'JAIL_DECISION' | 'ROLLING' | 'MOVING' | 'RESOLVING_TILE' | 'PROPERTY_DECISION' | 'UTILITY_ROLL' | 'RENT' | 'EVENT' | 'LIQUIDATION' | 'BANKRUPTCY' | 'OPTIONAL_ACTIONS' | 'TURN_END' | 'GAME_OVER';
interface AssetBase { id: PropertyId; name: string; shortName: string; landmark: string; price: number; baseRent: number; upgradeCost: number; }
export interface LandDefinition extends AssetBase { kind: 'LAND'; groupId: GroupId; rentByLevel: readonly number[]; }
export interface RailroadDefinition extends AssetBase { kind: 'RAILROAD'; groupId?: never; rentByOwnedCount: readonly number[]; }
export interface UtilityDefinition extends AssetBase { kind: 'UTILITY'; groupId?: never; rentMultiplierByOwnedCount: readonly number[]; }
export type PropertyDefinition = LandDefinition | RailroadDefinition | UtilityDefinition;
export interface PropertyState { propertyId: PropertyId; ownerId: PlayerId | null; level: PropertyLevel; }
export interface GroupDefinition { id: GroupId; name: string; color: string; propertyIds: PropertyId[]; fullGroupRentMultiplier: number; }
export interface BoardTile { index: number; type: TileType; propertyId?: PropertyId; amount?: number; name?: string; }
export interface PlayerState { id: PlayerId; name: string; money: number; position: number; heldCards: CardId[]; isBankrupt: boolean; jailed: boolean; jailAttempts: number; }
export interface DiceState { values: readonly number[]; total: number; }
export interface DeckState { drawPile: CardId[]; discardPile: CardId[]; }
export interface GameState {
  players: PlayerState[]; currentPlayerId: PlayerId; properties: Record<PropertyId, PropertyState>;
  chanceDeck: DeckState; lifeDeck: DeckState; phase: GamePhase; round: number;
  dice: DiceState | null; rentDice: DiceState | null;
  consecutiveDoubles: number; extraRoll: boolean; eventDepth: number;
  buildingBank: { houses: number; hotels: number };
  movement: { remaining: number; direction: 1 | -1 } | null;
  eventCardId: CardId | null;
  rent: { propertyId: PropertyId; ownerId: PlayerId; amount: number } | null;
  rentOverride: { kind: 'RAILROAD' | 'UTILITY'; multiplier: number } | null;
  paymentResume: 'ROLL_AFTER_JAIL' | 'MOVE_AFTER_JAIL' | null;
  payments: Payment[]; winnerId: PlayerId | null; log: GameLogEntry[]; nextLogId: number; bankruptcyNoticeId: PlayerId | null;
}
export interface Payment { payerId: PlayerId; recipientId: PlayerId | null; amount: number; reason: string; }
export interface GameLogEntry { id: number; round: number; message: string; }
export type GameAction = { playerId: PlayerId } & (
  | { type: 'START_TURN' | 'ROLL' | 'COMPLETE_ROLL' | 'STEP_MOVE' | 'RESOLVE_TILE' | 'BUY' | 'SKIP' | 'ROLL_UTILITY' | 'PAY_RENT' | 'PAY_JAIL' | 'USE_JAIL_CARD' | 'APPLY_EVENT' | 'ACK_BANKRUPTCY' | 'END_TURN' }
  | { type: 'UPGRADE' | 'SELL_BUILDING' | 'SELL_GROUP' | 'LIQUIDATE'; propertyId: PropertyId }
);
