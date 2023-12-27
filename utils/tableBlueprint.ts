import { takeAction } from "./takeAction.ts";
import { next } from "./next.ts";
import { Card, Result } from "../data_types.ts";
import { deck, shuffle } from "./dealCards.ts";
import { send } from "../api/broadcast.ts";
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
  private _hand: Card[];
  folded: boolean = true;
  allIn: boolean;
  hasChecked: boolean;

  public set hand(cards: Card[]) {
    this._hand = cards;
  }

  public get hand() {
    return this._hand;
  }

  public transmitHand() {
    //TODO: Return a map of usernames and their hands
    const hands = new Map();
    hands.set(this.username, this.hand);
    send(this.socket, {
      event: "hands-updated",
      payload: {
        hands: Array.from(hands),
      },
    });
    console.log("hand sent to ", this.username);
  }

  constructor(player: PlayerInterface) {
    this.username = player.username;
    this.socket = player.socket;
    this.chips = player.chips;
    this.folded = true;
    this.bets = { preflop: 0, flop: 0, turn: 0, river: 0 };
  }
}

export class GameState {
  nextRound: boolean;
  winners: Result[];
  results: Result[] = [];
  activePosition: number;
  stage: "waiting" | "preflop" | "flop" | "turn" | "river" | "showdown";
  private _hands: {
    playerHands?: Card[];
    flop?: Card[];
    turn?: Card;
    river?: Card;
  };
  newGame: boolean = true;
  smallBlindPlayed: boolean;
  bigBlindPlayed: boolean;
  promptingFor: string;
  highestBets: { preflop: 0; flop: 0; turn: 0; river: 0 };

  constructor() {
    this.nextRound = false;
    this.winners = [];
    this.results = [];
    this.activePosition = 0;
    this.stage = "waiting";
    this._hands = { playerHands: [], flop: [], turn: null, river: null };
    this.newGame = true;
    this.smallBlindPlayed = false;
    this.bigBlindPlayed = false;
    this.promptingFor = null;
    this.highestBets = { preflop: 0, flop: 0, turn: 0, river: 0 };
  }

  public get hands() {
    let availableHands = {};
    switch (this.stage) {
      case "flop":
        availableHands = { flop: this._hands.flop };
        break;
      case "turn":
        availableHands = { flop: this._hands.flop, turn: this._hands.turn };
        break;
      case "river":
      case "showdown":
        availableHands = {
          flop: this._hands.flop,
          turn: this._hands.turn,
          river: this._hands.river,
        };
        break;
      default:
        availableHands = {};
    }
    return availableHands;
  }

  public set hands(cards: {
    playerHands?: Card[];
    flop?: Card[];
    turn?: Card;
    river?: Card;
  }) {
    this._hands = cards;
  }

  public get playerCards() {
    return this._hands.playerHands;
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
  players: Player[] = [];
  waitingList = [];
  sitOutPlayers = [];
  variantID: number;
  firstBets = { preflop: 0, flop: 0, turn: 0, river: 0 };
  pot = 0;
  gameState: GameState;
  _potSum = 0;

  get potSum() {
    const stage = this.gameState?.stage;
    let sum = 0;
    switch (stage) {
      case "flop":
        this.players.forEach((player) => {
          sum += player.bets.preflop;
        });
        break;
      case "turn":
        this.players.forEach((player) => {
          sum += player.bets.preflop + player.bets.flop;
        });
        break;
      case "river":
        this.players.forEach((player) => {
          sum += player.bets.preflop + player.bets.flop + player.bets.turn;
        });
        break;
      default:
        sum = 0;
    }
    return sum;
  }

  set potSum(value) {
    this._potSum = value;
  }

  dealCards(playerCount: number) {
    console.log("DEALING FOR ", playerCount);
    this.players.forEach((player) => {
      player.folded = false;
    });
    const shuffledDeck: Card[] = shuffle(deck);
    const results = {
      playerHands: shuffledDeck.slice(0, playerCount * 2),
      flop: shuffledDeck.slice(playerCount * 2, playerCount * 2 + 3),
      turn: shuffledDeck[playerCount * 2 + 3],
      river: shuffledDeck[playerCount * 2 + 4],
    };
    console.log("current cards", results);
    return results;
  }

  public get allHands() {
    const hands = new Map();
    this.players.forEach((player) => {
      //TODO: filter out people who chose not to show their hands
      hands.set(player.username, player.hand);
    });
    return Array.from(hands);
  }

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

  public startGame() {
    //handle case where a user joins a table that is already in progress
    //handle case where a user leaves a table that is in progress
    //handle case where a user leaves and re-joins a table that is in progress
    next(this);
    this.players.forEach((player) => {
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
