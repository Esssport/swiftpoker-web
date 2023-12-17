import { Player } from "../data_types.ts";
export interface TableConfig {
  blinds: { small: number; big: number };
  buyInRange: { min: number; max: number };
  type: string;
  maxPlayers: number;
  minPlayers?: number;
  variantID?: number;
  username?: string;
  buyInAmount?: number;
}

export class Table {
  static count = 1;
  static allTables: Map<number, Table> = new Map();
  blinds: { small: number; big: number };
  buyInRange: { min: number; max: number };
  maxPlayers: number;
  minPlayers: number;
  type: string;
  id: number;
  players = [];
  waitingList: [];
  sitOutPlayers: [];
  variantID: number;
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
    this.id = Table.count++;
    this.variantID = config.variantID;
    this.players = [];
  }
  public addPlayer(player: Player) {
    this.players.push(player);
  }

  public startGame() {
  }

  public endGame() {
  }

  public static generate(tables: Map<number, Table>) {
  }
}
