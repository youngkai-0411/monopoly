export const GAME_RULES = {
  boardSize: 36,
  minPlayers: 2,
  maxPlayers: 4,
  startingMoney: 2000,
  passStartReward: 200,
  defaultTax: 100,
  detentionFine: 100,
  liquidationRate: 0.5,
  travelFundReward: 100,
  insuranceDuplicateReward: 100,
  levelRentMultipliers: { 0: 1, 1: 3, 2: 5, 3: 8 },
  groupRentMultipliers: { twoProperties: 1.3, threeProperties: 1.5 },
} as const;
