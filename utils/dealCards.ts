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
export function shuffle(array: any[]): Card[] {
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
export const deck = [...spadeStack].concat([...heartStack]).concat([
  ...diamondStack,
])
  .concat([
    ...clubStack,
  ]);
