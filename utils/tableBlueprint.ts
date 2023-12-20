import { takeAction } from "./takeAction.ts";
import { next } from "./next.ts";
import { Card, Result } from "../data_types.ts";
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

export interface PlayerInterface {
  username: string;
  socket?: WebSocket;
  chips: number;
}
export class Player {
  username: string;
  socket: WebSocket;
  chips: number;
  isDealer: boolean;
  position: number;
  role: "smallBlind" | "bigBlind";
  bets: { preflop: number; flop: number; turn: number; river: number };
  hand: Card[];
  folded: boolean;
  allIn: boolean;
  hasChecked: boolean;

  constructor(player: PlayerInterface) {
    this.username = player.username;
    this.socket = player.socket;
    this.chips = player.chips;
    this.bets = { preflop: 0, flop: 0, turn: 0, river: 0 };
  }
}

export class GameState {
  nextRound: boolean;
  winners: Result[];
  results: Result[];
  activePosition: number;
  stage: "preflop" | "flop" | "turn" | "river" | "showdown" = "preflop";
  hands: { flop: Card[]; turn: Card; river: Card };
  newGame: boolean;
  smallBlindPlayed: boolean;
  bigBlindPlayed: boolean;
  promptingFor: string;
  highestBets: { preflop: 0; flop: 0; turn: 0; river: 0 };

  constructor() {
    this.nextRound = false;
    this.winners = [];
    this.results = [];
    this.activePosition = 0;
    this.stage = "preflop";
    this.hands = { flop: [], turn: null, river: null };
    this.newGame = true;
    this.smallBlindPlayed = false;
    this.bigBlindPlayed = false;
    this.promptingFor = null;
    this.highestBets = { preflop: 0, flop: 0, turn: 0, river: 0 };
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
  gameState: GameState;

  constructor(config: TableConfig) {
    this.gameState = new GameState();
    this.blinds = config.blinds;
    this.buyInRange = config.buyInRange;
    this.maxPlayers = config.maxPlayers || 2;
    this.minPlayers = config.minPlayers || 2;
    this.type = config.type || "playmoney";
    this.id = Table.count++;
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

  public next() {
  }

  public startGame() {
    const players = this.players;
    next(this);
    players.forEach((player) => {
      player.socket.onmessage = (m) => {
        const data = JSON.parse(m.data);
        const gameState = this.gameState;
        console.log("msg in server: ", data);
        switch (data.event) {
          case "action-taken":
            const payload = data.payload;
            takeAction({
              table: this,
              player,
              action: payload.action,
              betAmount: payload.betAmount,
              stage: gameState.stage,
            });
            break;
        }
      };
    });
  }

  public endGame() {
  }

  public static generate(tables: Map<number, Table>) {
  }
}
