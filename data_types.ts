export type Player = {
  id?: number;
  username?: string;
  wallet?: string;
  position?: number;
  currentHand?: number;
  activeTables?: number[];
  handHistory?: number[];
  totalWinnings?: number;
  totalHandsWon?: number;
  balance?: number;
};

export type Tournament = {
  id?: number;
  blinds: number[];
  GuaranteedAmount: number;
  prizeStructure: number[]; // e.g. [55, 25, 10, 5, 3, 2]
  name?: string;
  startedAt: string;
  maxPlayers: number;
  signedUpPlayers: number;
  currentPlayers: number;
  speed?: "Normal" | "Fast" | "Hyper";
};

export type Table = {
  id?: number;
  name?: string;
  startedAt?: string;
  maxPlayers?: number;
  buyInRange?: number[];
  players?: Player[]; // Map of User to their current bet
  pot?: number;
  dealer?: number;
  blinds?: number[];
  currentBet?: number;
  speed?: "Normal" | "Fast" | "Hyper";
  deck?: number[];
  communityCards?: number[];
  currentRound?: number;
  handHistory?: Hand[];
  winner?: number;
  winnerHand?: number[];
  winnerHandType?: string;
  winnerHandRank?: number;
};

export type Hand = {
  cards?: number[];
  handType?: string;
  handRank?: number;
  handValue?: number;
  handName?: string;
};

export type Card = {
  suit: string;
  value: number;
  name?: string;
  image?: string;
};
