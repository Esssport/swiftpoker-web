export type Player = {
  hand: Card[];
  yourTurn: boolean;
  id?: number;
  socket?: WebSocket;
  buyIn: number;
  chips: number;
  folded: boolean;
  allIn: boolean;
  disconnected: boolean;
  totalBet: number;
  currentBet: number;
  played: boolean;
  flop?: Card[];

  turn?: Card;
  river?: Card;
  username?: string;
  wallet?: string;
  position?: number;
  currentHand?: number;
  tablesRegistered?: number[];
  isDealer?: boolean;
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
  type?: "cash" | "tournament";
  id?: number;
  name?: string;
  startedAt?: string;
  maxPlayers?: number;
  players?: Player[]; // Map of User to their current bet
  dealer?: number;
  currentBet?: number;
  speed?: "Normal" | "Fast" | "Hyper";
  deck?: number[];
  communityCards?: number[];
  currentRound?: number;
  handHistory?: Card[];
  winner?: number;
  winnerHand?: number[];
  winnerHandType?: string;
  winnerHandRank?: number;
  lateRegistration?: true;
  running?: false;
  pot?: number;
  blinds?: { small: number; big: number };
  buyInRange?: { min: number; max: number };
};

export type Card = Map<string, {
  suit: string;
  value: number;
  name?: string;
  image?: string;
}>;
