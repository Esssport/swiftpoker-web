import { Table } from "../data_types.ts";
import { determineHandValues } from "../utils/determineHandValues.ts";
import { determineWinners } from "../utils/determineWinners.ts";
let tableNumber = 0;
export const handleCreateTable = async (
  ctx,
) => {
  const serverTables = ctx.state.tables as Map<
    number,
    Table
  >;

  const limit = Number(ctx.request.url.searchParams.get("limit"));
  const limitValue = limit <= 10 && limit >= 2 ? limit : 10;

  do {
    tableNumber += 1;
  } while (serverTables.has(tableNumber));

  const tableObj: Table = {
    id: tableNumber,
    players: [],
    blinds: { small: 10, big: 25 },
    buyInRange: { min: 100, max: 500 },
    maxPlayers: limitValue,
    pot: 0,
    type: "cash",
  };

  serverTables.set(tableNumber, tableObj);
  console.log("Table created", serverTables);

  const results = determineHandValues(sampleTable, sampleState);
  // console.log("results", results);
  const winners = determineWinners(results);
  ctx.response.body = JSON.stringify(Array.from(serverTables));
};

const sampleState = {
  activePosition: 3,
  stage: "river",
  hands: {
    communityCards: [
      ["H7", { rank: 11, name: "Seven", suit: "Hearts" }],
      ["H2", { rank: 12, name: "Duce", suit: "Hearts" }],
      ["S7", { rank: 13, name: "Seven", suit: "Hearts" }],
      ["C3", { rank: 2, name: "Three", suit: "Clubs" }],
      ["D5", { rank: 4, name: "Five", suit: "Clubs" }],
    ],
  },
  gameStarted: true,
  newGame: false,
  smallBlindPlayed: true,
  bigBlindPlayed: true,
  promptingFor: "d",
};

const sampleTable = {
  id: 1,
  players: [
    // {
    //   username: "a",
    //   chips: 0,
    //   buyIn: 100,
    //   hand: [["C4", { rank: 3, name: "Four", suit: "Hearts" }], ["DA", {
    //     rank: 13,
    //     name: "Ace",
    //     suit: "Clubs",
    //   }]],
    //   position: 3,
    //   currentBet: 25,
    //   flop: [["S9", { rank: 8, name: "Nine", suit: "Spades" }], ["H2", {
    //     rank: 1,
    //     name: "Duce",
    //     suit: "Hearts",
    //   }], ["S7", { rank: 6, name: "Seven", suit: "Spades" }]],
    //   turn: ["C3", { rank: 2, name: "Three", suit: "Clubs" }],
    //   river: ["D5", { rank: 4, name: "Five", suit: "Diamonds" }],
    // },
    // {
    //   username: "b",
    //   chips: 0,
    //   buyIn: 100,
    //   hand: [["D6", { rank: 5, name: "Six", suit: "Clubs" }], ["DJ", {
    //     rank: 10,
    //     name: "Jack",
    //     suit: "Clubs",
    //   }]],
    //   position: 1,
    //   currentBet: 25,
    //   flop: [["S9", { rank: 8, name: "Nine", suit: "Spades" }], ["H2", {
    //     rank: 1,
    //     name: "Duce",
    //     suit: "Hearts",
    //   }], ["S7", { rank: 6, name: "Seven", suit: "Spades" }]],
    //   turn: ["C3", { rank: 2, name: "Three", suit: "Clubs" }],
    //   river: ["D5", { rank: 4, name: "Five", suit: "Diamonds" }],
    // },
    // {
    //   username: "c",
    //   chips: 0,
    //   buyIn: 100,
    //   hand: [["S3", { rank: 9, name: "Three", suit: "Hearts" }], ["D7", {
    //     rank: 10,
    //     name: "Seven",
    //     suit: "Hearts",
    //   }]],
    //   position: 2,
    //   currentBet: 25,
    //   flop: [["S9", { rank: 8, name: "Nine", suit: "Spades" }], ["H2", {
    //     rank: 1,
    //     name: "Duce",
    //     suit: "Hearts",
    //   }], ["S7", { rank: 6, name: "Seven", suit: "Spades" }]],
    //   turn: ["C3", { rank: 2, name: "Three", suit: "Clubs" }],
    //   river: ["D5", { rank: 4, name: "Five", suit: "Diamonds" }],
    // },
    {
      username: "d",
      chips: 15,
      // folded: true,
      buyIn: 100,
      hand: [
        ["H7", { rank: 10, name: "Seven", suit: "Hearts" }],
        ["H7", { rank: 13, name: "Seven", suit: "Hearts" }],
      ],
      position: 0,
      currentBet: 25,
      flop: [
        ["S9", { rank: 8, name: "Nine", suit: "Spades" }],
        ["H2", { rank: 1, name: "Duce", suit: "Hearts" }],
        ["S7", { rank: 6, name: "Seven", suit: "Spades" }],
      ],
      turn: ["C3", { rank: 2, name: "Three", suit: "Clubs" }],
      river: ["D5", { rank: 4, name: "Five", suit: "Diamonds" }],
    },
  ],
  blinds: { small: 10, big: 25 },
  buyInRange: { min: 100, max: 500 },
  maxPlayers: 10,
  pot: 385,
  type: "cash",
};
