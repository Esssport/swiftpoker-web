//move send and broadcast to utils
import { broadcast, send } from "../api/handleJoinTable.ts";
import { Card, Player, Table } from "../data_types.ts";
const allGameStates = new Map<
  number,
  {
    activePosition: number;
    stage: string;
    hands: { hands: Card[]; flop: Card[]; turn: Card; river: Card };
    gameStarted: boolean;
    newGame: boolean;
    smallBlindPlayed: boolean;
    bigBlindPlayed: boolean;
  }
>();

export const startGame = async (
  username,
  tableID,
  table: Table,
) => {
  const players = table.players;
  if (!tableID || !players || players.length < 2) {
    return;
  }

  if (!allGameStates.has(tableID)) {
    allGameStates.set(tableID, {
      activePosition: 0,
      stage: "preflop",
      hands: null,
      gameStarted: false,
      newGame: true,
      smallBlindPlayed: false,
      bigBlindPlayed: false,
    });
  }
  const player = players.find((p) => p.username === username);

  next(table, username);

  player.socket.onmessage = (m) => {
    const data = JSON.parse(m.data);
    const gameState = allGameStates.get(table.id);
    console.log("onmessage", data);
    switch (data.event) {
      case "bet":
        placeBet(table, player, data.payload, username);
        break;
    }
  };

  // const socket = player.socket;
  // send(socket, eventObj);
};

const next = (table: Table, username?: string) => {
  const gameState = allGameStates.get(table.id);
  const players = table.players;
  let player = players.find((p) => p.position === gameState.activePosition);
  //next round of cards
  if (gameState.activePosition > players.length - 1) {
    const stage = gameState.stage;
    gameState.activePosition = 0;

    //update gameStage
    switch (stage) {
      case "preflop":
        gameState.stage = "flop";
        break;
      case "flop":
        gameState.stage = "turn";
        break;
      case "turn":
        gameState.stage = "river";
        break;
      case "river":
        gameState.stage = "showdown";
        break;
      default:
        gameState.stage = "preflop";
    }
    //show next card

    if (gameState.stage === "showdown") {
      //showdown
      gameState.activePosition = 0; //reset to the person after the big blind
      // gameState.newGame = true;

      //TODO: determine winner
      console.log("THE TRUE WINNER IS YOU!");
      gameState.smallBlindPlayed = false;
      gameState.bigBlindPlayed = false;
      return;
    }

    populateHands(table.id, players, gameState.stage);
    next(table, username);
    return;
  }

  if (!player) {
    gameState.activePosition = 0;
    player = players.find((p) => p.position === gameState.activePosition);
  }
  if (!username) username = player.username;

  if (gameState.newGame = true) {
    gameState.newGame = false;
    populateHands(table.id, players);
    determinePositions(players);
    if (!player) {
      console.log("NEWGAME activePosition", gameState.activePosition);
      player = players.find((p) => p.position === gameState.activePosition);
    }
    if (
      player.position === 0 && gameState.activePosition === 0 &&
      !gameState.smallBlindPlayed
    ) {
      placeBet(table, player, table.blinds.small, username);
      gameState.smallBlindPlayed = true;
      return;
    }
    if (
      player.position === 1 && gameState.activePosition === 1 &&
      !gameState.bigBlindPlayed
    ) {
      placeBet(table, player, table.blinds.big, username);
      gameState.bigBlindPlayed = true;
      return;
    }
  }

  if (
    gameState.activePosition <= players.length && player.username === username
  ) {
    promptBet(table, player.username);
    return;
  }
  return;
};

const promptBet = (table: Table, username: string) => {
  //TODO: set a timer for folding if no bet is placed
  const gameState = allGameStates.get(table.id);
  //handle bets
  const players = table.players;
  const player = players.find((p) => p.position === gameState.activePosition);

  if (!player || player.username !== username) return;
  console.log("prompting", username);
  const betPrompt = {
    event: "bet",
    payload: {
      waitingFor: gameState.activePosition,
      blinds: table.blinds,
      chips: player.chips,
    },
  };
  send(player.socket, betPrompt);
  return;
};

const placeBet = (
  table: Table,
  player: Player,
  bet: number,
  username: string,
) => {
  const gameState = allGameStates.get(table.id);
  //TODO: check if the bet is valid
  player.currentBet = bet;
  player.chips = player.chips - bet;
  table.pot = table.pot + bet;
  console.log(`${bet} BET PLACED for ${player.username}, STATE`, {
    ...allGameStates.get(table.id),
    hands: null,
  });
  gameState.activePosition = gameState.activePosition + 1;
  next(table);
};

//maybe add a parameter to dealNew
const populateHands = (
  tableID: number,
  players: Player[],
  stage: string = null,
) => {
  let gameState = allGameStates.get(tableID);
  let tableHands = gameState.hands;
  // also run if the game has ended, for next round
  if (!tableHands || gameState.newGame) {
    const results = dealCards(tableID, players.length);
    gameState.hands = results;
    gameState.gameStarted = true;
    gameState.newGame = false;
  }
  const currentCards = gameState.hands;
  const handsCopy = [...currentCards.hands];
  return players.forEach((player: Player) => {
    if (!!stage) {
      player[stage] = currentCards[stage];
    }
    if (player.hand && player.hand.length > 0) {
      return player;
    }
    if (handsCopy.length < 2) {
      return player;
    }
    player.hand = [handsCopy[0], handsCopy[1]];
    handsCopy.splice(0, 2);
    return player;
  });
};

const determinePositions = (players: Player[], nextRound = false) => {
  return players.forEach((player, i) => {
    if (nextRound) {
      player.position = player.position + 1;
      if (player.position >= players.length - 1) {
        //TODO : check if this is correct
        player.position = 0;
      }
    }
    if (player.position !== undefined) {
      return player;
    } else {
      player.position = i;
    }
    return player;
  });
};

const stack = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

function shuffle(array: any[]): Card[] {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

const spadeStack = stack.map((
  card,
  i,
) => ["S" + card, { value: i, suit: "Spades" }]);
const heartStack = stack.map((
  card,
  i,
) => ["H" + card, { value: i, suit: "Hearts" }]);
const diamondStack = stack.map((
  card,
  i,
) => ["D" + card, { value: i, suit: "Diamonds" }]);
const clubStack = stack.map((
  card,
  i,
) => ["C" + card, { value: i, suit: "Clubs" }]);

const deck = [...spadeStack].concat([...heartStack]).concat([...diamondStack])
  .concat([
    ...clubStack,
  ]);

export const dealCards = (tableID, players = 2) => {
  console.log("DEALING FOR", tableID, players);
  if (players < 2) {
    throw new Error("You need at least 2 players to play");
  }
  if (players > 10) {
    throw new Error("You can't play with more than 10 players");
  }
  const shuffledDeck: Card[] = shuffle(deck);
  const results = {
    hands: shuffledDeck.slice(0, players * 2),
    //to be deprecated
    communityCards: shuffledDeck.slice(players * 2, players * 2 + 5),
    flop: shuffledDeck.slice(players * 2, players * 2 + 3),
    turn: shuffledDeck[players * 2 + 3],
    river: shuffledDeck[players * 2 + 4],
  };
  return results;
};
