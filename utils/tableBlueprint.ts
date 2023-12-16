// let tableNumber = 0;
import { GameState, Player } from "../data_types.ts";
interface TableConfig {
  blinds: { small: number; big: number };
  buyInRange: { min: number; max: number };
  maxPlayers: number;
  minPlayers?: number;
  type: string;
  id: number;
}

export class Table {
  blinds: { small: number; big: number };
  buyInRange: { min: number; max: number };
  maxPlayers: number;
  minPlayers: number;
  type: string;
  id: number;
  players: [];
  waitingList: [];
  sitOutPlayers: [];
  firstBets: { preflop: 0; flop: 0; turn: 0; river: 0 };
  pot: 0;
  GameState: {
    activePosition: 0;
    stage: "preflop";
    hands: undefined;
    newGame: true;
    smallBlindPlayed: undefined;
    bigBlindPlayed: undefined;
    promptingFor: undefined;
    highestBets: { preflop: 0; flop: 0; turn: 0; river: 0 };
  };

  constructor(config: TableConfig) {
    this.blinds = config.blinds;
    this.buyInRange = config.buyInRange;
    this.maxPlayers = config.maxPlayers || 2;
    this.minPlayers = config.minPlayers || 2;
    this.type = config.type || "playmoney";
    this.id = config.id || 0;
  }
  public static generate(tables: Map<number, Table>) {
  }
}
