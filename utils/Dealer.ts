import { replacer, reviver } from "./tools.ts";

const suits = ["♠", "♥", "♦", "♣"];
const suitNames = { s: "Spades", h: "Hearts", d: "Diamonds", c: "Clubs" };
const suitInitials = ["s", "h", "d", "c"];
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
// how to suffle a map in javascript
// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array

let cardsIndex: number[] = [];
for (let i = 0; i < 52; i++) cardsIndex.push(i);
let unshuffled = ["hello", "a", "t", "q", 1, 2, 3, { cats: true }];

function shuffle(array: any[]) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

const spadeStack = new Map(
  stack.map((card, i) => ["S" + card, { value: i, suit: "Spades" }]),
);
const heartStack = new Map(
  stack.map((card, i) => ["H" + card, { value: i, suit: "Hearts" }]),
);
const diamondStack = new Map(
  stack.map((card, i) => ["D" + card, { value: i, suit: "Diamonds" }]),
);
const clubStack = new Map(
  stack.map((card, i) => ["C" + card, { value: i, suit: "Clubs" }]),
);

const deck = new Map(
  [...spadeStack].concat([...heartStack]).concat([...diamondStack]).concat([
    ...clubStack,
  ]),
);

const deckArray = [...deck];

console.log("deckArray", shuffle(deckArray));

// console.log(deck);
export function dealer(players = 2) {
  console.log("SHUFFLINGGGG", shuffle(unshuffled));
  return JSON.stringify(deck, replacer);
}
