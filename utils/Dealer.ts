import { broadcast, send } from "../api/handleJoinTable.ts";
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

function shuffle(array: any[]) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

type Card = [string, { value: number; suit: string }];

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
  ]) as Card[];

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
    communityCards: shuffledDeck.slice(players * 2, players * 2 + 5),
  };
  return results;
};

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
const currentGame = {};
let gameStarted = false;
let cardsDealt = {};
//possibly get user with startGame to start the game only for that user,
//check and see if the table is running, if not, start the game
//if the table is running, then just send the cards to the user
// can be named populateHands or prepare game
export const startGame = async (username, tableID, allPlayers: any[]) => {
  // console.log("players", players);
  if (!tableID || !allPlayers || allPlayers.length < 2) {
    return;
    //do something
  }
  let players = allPlayers;
  const playerNumber = players.length;
  let tableHands = allHands.get(tableID);

  if (!tableHands) {
    const results = dealCards(tableID, playerNumber);
    const res = allHands.set(tableID, results);
    gameStarted = true;
  }
  console.log("allHands", username, allHands);
  let i = 0;

  // todo: update the players, then send the cards to each player

  const currentHands = allHands.get(tableID);
  const handsCopy = [...currentHands.hands];
  console.log("all hands", currentHands);
  players = players.map((player: any) => {
    if (player.hand && player.hand.length > 0) {
      return player;
    }
    if (handsCopy.length < 2) {
      return player;
    }
    player.hand = [handsCopy[0], handsCopy[1]];
    player.communityCards = currentHands.communityCards;
    handsCopy.splice(0, 2);
    return player;
  });
  console.log("players", players);
  const player = players.find((p) => p.username === username);

  const eventObj = {
    event: "game-started-private",
    payload: {
      hand: player.hand,
      communitycards: player.communityCards,
      player: username,
    },
  };
  const socket = player.socket;
  send(socket, eventObj);

  send(socket, {
    event: "game-started",
    payload: {
      // communityCards: results.communityCards,
    },
  });
};
