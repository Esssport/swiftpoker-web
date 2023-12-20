import { Card } from "../data_types.ts";

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
const names = [
  "Duce",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Jack",
  "Queen",
  "King",
  "Ace",
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
) => ["S" + card, { rank: i + 1, name: names[i], suit: "Spades" }]);
const heartStack = stack.map((
  card,
  i,
) => ["H" + card, { rank: i + 1, name: names[i], suit: "Hearts" }]);
const diamondStack = stack.map((
  card,
  i,
) => ["D" + card, { rank: i + 1, name: names[i], suit: "Diamonds" }]);
const clubStack = stack.map((
  card,
  i,
) => ["C" + card, { rank: i + 1, name: names[i], suit: "Clubs" }]);
const deck = [...spadeStack].concat([...heartStack]).concat([...diamondStack])
  .concat([
    ...clubStack,
  ]);

export const dealCards = (tableID, playerCount = 2) => {
  console.log("DEALING FOR", tableID, playerCount);
  if (playerCount < 2) {
    throw new Error("You need at least 2 players to play");
  }
  if (playerCount > 10) {
    throw new Error("You can't play with more than 10 players");
  }
  const shuffledDeck: Card[] = shuffle(deck);
  const results = {
    hands: shuffledDeck.slice(0, playerCount * 2),
    flop: shuffledDeck.slice(playerCount * 2, playerCount * 2 + 3),
    turn: shuffledDeck[playerCount * 2 + 3],
    river: shuffledDeck[playerCount * 2 + 4],
  };
  return results;
};
