import design from '../../../docs/classic-vietnam-v2.json';
export const GAME_RULES = {
  boardSize: design.board.length, minPlayers: 2, maxPlayers: 4,
  startingMoney: design.economy.startingMoney, passStartReward: design.economy.passStartReward,
  jailFine: design.economy.jailFine, jailMaxAttempts: design.economy.jailMaxAttempts,
  maxConsecutiveDoubles: design.economy.maxConsecutiveDoubles,
  jailIndex: design.geometry.cornerIndices[1], liquidationRate: .5,
  initialHouses: design.economy.buildingBank.houses, initialHotels: design.economy.buildingBank.hotels,
  sellBuildingRate: design.economy.sellBuildingRate, maxEventDepth: 8,
} as const;
