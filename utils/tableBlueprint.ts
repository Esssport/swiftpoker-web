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

interface playerInterface {
  username: string;
  socket?: WebSocket;
  chips: number;
}
export class Player {
  username: string;
  socket: WebSocket;
  chips: number;
  bets: { preflop: number; flop: number; turn: number; river: number };

  constructor(player: playerInterface) {
    this.username = player.username;
    this.socket = player.socket;
    this.chips = player.chips;
    this.bets = { preflop: 0, flop: 0, turn: 0, river: 0 };
  }
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
  waitingList = [];
  sitOutPlayers = [];
  variantID: number;
  firstBets = { preflop: 0, flop: 0, turn: 0, river: 0 };
  pot = 0;
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
    // this.GameState = {};
    Table.allTables.set(this.id, this);
    this.variantID = config.variantID;
    this.players = [];
    this.waitingList = [];
    this.sitOutPlayers = [];
    this.firstBets = { preflop: 0, flop: 0, turn: 0, river: 0 };
    this.pot = 0;
  }
  public addPlayer(player: Player) {
    this.players.push(player);
  }

  public addToWaitingList(player: Player) {
    this.waitingList.push(player);
  }

  public startGame() {
  }

  public endGame() {
  }

  public static generate(tables: Map<number, Table>) {
  }
}
