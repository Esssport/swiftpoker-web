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

export const dealCards = (players = 2) => {
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

const allHands = [];
let currentTableID = 0;
//possibly get user with startGame to start the game only for that user,
//check and see if the table is running, if not, start the game
//if the table is running, then just send the cards to the user
// can be named populateHands or prepare game
export const startGame = async (username, tableID, players) => {
  console.log("players", players);
  if (tableID !== currentTableID) {
    //do something
  }
  const playerNumber = players.length;
  const results = dealCards(playerNumber);
  console.log("results", results);
  let i = 0;

  // todo: update the players, then send the cards to each player
  for (let i = 0; i < playerNumber; i++) {
    const socket = players[i].socket;
    const username = players[i].username;
    const allHands = results.hands;
    const userHand = [allHands[0], allHands[1]];
    allHands.splice(0, 2);
    console.log("username", username, userHand);
    const eventObj = {
      event: "game-started-private",
      payload: {
        hand: userHand,
        // communitycards: results.communityCards,
        player: username,
      },
    };

    send(socket, eventObj);
  }
  broadcast({
    event: "game-started",
    payload: {
      // communityCards: results.communityCards,
    },
  }, tableID);
};
