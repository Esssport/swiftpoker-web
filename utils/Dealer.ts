//move send and broadcast to utils
import { broadcast, send } from "../api/handleJoinTable.ts";
import { Card, Player, Table } from "../data_types.ts";

const allHands = new Map<number, any>();
const allHandsExample = [
  {
    tableID: 1,
    players: [],
    currentGame: {},
  },
  {
    tableID: 2,
    players: [],
    currentGame: {},
  },
];
let gameStarted = false;
let currentPosition = 2; // start at 2 because 0 and 1 are the blinds.
//possibly get user with startGame to start the game only for that user,
//check and see if the table is running, if not, start the game
//if the table is running, then just send the cards to the user
// can be named populateHands or prepare game
export const startGame = async (
  username,
  tableID,
  allPlayers: Player[],
  table: Table,
) => {
  if (!tableID || !allPlayers || allPlayers.length < 2) {
    return;
  }
  let players = allPlayers;
  const playerNumber = players.length;
  let tableHands = allHands.get(tableID);

  // also run if the game has ended, for next round
  if (!tableHands) {
    const results = dealCards(tableID, playerNumber);
    const res = allHands.set(tableID, results);
    gameStarted = true;
  }

  players = populateHands(tableID, players);
  players = determinePositions(players);
  // players = takeBlinds(players);
  players = players.map((player) => {
    if (player.position === 0) {
      console.log("TABLE", table);
      player.currentBet = 10;
    }
    return player;
  });
  console.log("DEBUGGING PLAYERS", players);
  const player = players.find((p) => p.username === username);
  //handle bets
  const initialBetEvent = {
    event: "initial-bet",
    payload: {
      yourTurn: currentPosition === player.position,
      waitingFor: currentPosition,
    },
    prompt: "Seat " + currentPosition + " Waiting for " +
      players[currentPosition].username +
      " to bet",
  };
  player.socket.onmessage = (m) => {
    const data = JSON.parse(m.data);
    console.log("onmessage", data);
    switch (data.event) {
      case "bet":
        console.log("bet", data);
        player.currentBet = data.payload;
        break;
    }
    console.log("players", players);
  };

  send(player.socket, initialBetEvent);

  // players = populateHands(tableID, players, "flop");

  const eventObj = {
    event: "flop-shown",
    payload: {
      hand: player.hand,
      flop: player.flop,
      //TO be removed
      player: username,
    },
  };
  const socket = player.socket;
  send(socket, eventObj);
};

const populateHands = (tableID, players, stage = null) => {
  const currentCards = allHands.get(tableID);
  const handsCopy = [...currentCards.hands];
  console.log("all hands", currentCards);
  return players.map((player: any) => {
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
  return players.map((player, i) => {
    if (nextRound) {
      player.position = player.position + 1;
      if (player.position >= players.length - 1) {
        //TODO : check if this is correct
        player.position = 0;
      }
    }
    console.log(typeof player.position, player.position, i);
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
