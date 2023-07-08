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

export function dealCards(players = 2) {
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
}
