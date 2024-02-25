import { Player, Table } from "./utils/tableBlueprint.ts";
// export interface Player {
//   isDealer?: boolean;
//   hasChecked?: boolean;
//   hand?: Card[];
//   yourTurn?: boolean;
//   id?: number;
//   role?: string;
//   socket?: WebSocket;
//   buyIn?: number;
//   chips?: number;
//   folded?: boolean;
//   allIn?: boolean;
//   disconnected?: boolean;
//   bets?: { preflop?: number; flop?: number; turn?: number; river?: number };
//   username?: string;
//   wallet?: string;
//   position?: number;
//   tablesRegistered?: number[];
//   handHistory?: Card[];
//   totalWinnings?: number;
//   totalHandsWon?: number;
//   balance?: number;
// }

// export interface GameState {
//   nextRound?: boolean;
//   activePosition: number;
//   activePlayer?: Player;
//   stage: string;
//   hands: { hands: Card[]; flop: Card[]; turn: Card; river: Card };
//   newGame: boolean;
//   smallBlindPlayed: boolean;
//   bigBlindPlayed: boolean;
//   promptingFor: string;
//   highestBets: { preflop: number; flop: number; turn: number; river: number };
// }

export interface Tournament {
  id?: number;
  blinds: number[];
  GuaranteedAmount: number;
  prizeStructure: number[]; // e.g. [55, 25, 10, 5, 3, 2]
  name?: string;
  startedAt: string;
  maxPlayers: number;
  currentPlayers: number;
  speed?: "Normal" | "Fast" | "Hyper";
}

// export interface Table {
//   winners?: Result[];
//   type: string;
//   id?: number;
//   name?: string;
//   startedAt?: string;
//   maxPlayers: number;
//   minPlayers?: number;
//   waitingList?: Player[];
//   sitOutPlayers?: Player[];
//   players?: Player[];
//   communityCards?: Card[];
//   currentRound?: number;
//   handHistory?: Card[];
//   lateRegistration?: true;
//   running?: false;
//   pot?: number;
//   blinds: { small: number; big: number };
//   firstBets?: { preflop: number; flop: number; turn: number; river: number };
//   buyInRange: { min: number; max: number };
//   GameState?: GameState;
// }

export interface Result {
  username?: string;
  handName?: string;
  score?: number;
  cards?: Card[];
  triple?: Card[];
  double?: Card[];
  firstPair?: Card[];
  secondPair?: Card[];
  suit?: string;
  highCards?: Card[];
}
export type Card = [string, {
  suit: string;
  value: number;
  rank?: number;
  name?: string;
  image?: string;
}];
export interface BetInput {
  table: Table;
  player: Player;
  action?: string;
  betAmount?: number;
  stage: string;
}
