import { Card, Table } from "../data_types.ts";
import { dealCards } from "../utils/Dealer.ts";
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

  determineWinners(sampleTable, sampleState);
  ctx.response.body = JSON.stringify(Array.from(serverTables));
};

//temporarily setting it up here
const determineWinners = (table, state): any[] => {
  const results = [];
  const playerCards = table.players
    .filter((player) => {
      return !player.folded;
    })
    .map((player) => {
      results.push({ username: player.username });
      return [...player.hand, ...state.hands.communityCards];
    });

  playerCards.forEach((hand: Card[], i: number) => {
    hand
      .sort((a, b) => {
        return b[1].rank - a[1].rank;
      });

    const setHandType = (
      card,
      results,
      handType: string,
      i,
      payload: {} = undefined,
    ) => {
      if (!!results[i].handType) return;
      if (!results[i].handType) {
        results[i].handType = handType;
      }
      if (!payload) {
        return;
      }
      for (const key in payload) {
        results[i][key] = payload[key];
      }
      return card[1];
    };

    const streaks = {
      straight: 1,
      straightFlush: 1,
      ofAKind: 1,
      hasAce: false,
      aceSuits: [],
      hasThreeOfAKind: false,
      hasPair: false,
      triple: [],
      double: [],
      suits: {
        clubs: 0,
        diamonds: 0,
        hearts: 0,
        spades: 0,
      },
    };

    const initialRank = hand[0][1].rank;
    let cardNumber = 0;
    hand.reduce((previousCard, card) => {
      cardNumber += 1;
      //Determine flush for straight flush;
      if (previousCard.suit === card[1].suit) {
        streaks.straightFlush += 1;
      } else {
        streaks.straightFlush = 1;
      }
      //Determine straight for straight flush;
      if (previousCard.rank - card[1].rank === 1) {
        streaks.straight += 1;
      } else if (previousCard.rank - card[1].rank === 0) {
        //do nothing
      } else {
        streaks.straight = 1;
      }
      if (card[1].rank === 13) {
        streaks.hasAce = true;
        streaks.aceSuits.push(card[1].suit);
      }

      if (streaks.straight === 5 && streaks.straightFlush === 5) {
        let handType = "Straight Flush";
        let score = 9;
        if (card[1].name === "Ten") {
          handType = "Royal Flush";
          score = 10;
        }
        const handCopy = [...hand];
        const cards = handCopy.splice(cardNumber - 5, 5);
        setHandType(card, results, handType, i, {
          score,
          cards,
        });
        return card[1];
      }
      if (
        streaks.straight === 4 && streaks.hasAce && previousCard.rank === 2 &&
        streaks.straightFlush === 4 &&
        streaks.aceSuits.indexOf(previousCard.suit) > -1
      ) {
        const handType = "Straight Flush";
        const handCopy = [...hand];
        const ace = hand.filter((card) => {
          return card[1].rank === 13 && card[1].suit === card[1].suit;
        });
        const cards = handCopy.splice(cardNumber - 4, 4);
        cards.push(ace[0]);

        setHandType(card, results, handType, i, {
          score: 9,
          cards,
        });
        streaks.hasAce = false;
      }

      //Determine four of a kind
      if (previousCard.rank === card[1].rank) {
        streaks.ofAKind += 1;
      } else {
        streaks.ofAKind = 1;
      }

      if (streaks.ofAKind === 4) {
        const fourOfAKindHand = [...hand];
        fourOfAKindHand.splice(cardNumber - 4, 4);

        setHandType(card, results, "Four of a Kind", i, {
          score: 8,
          value: card,
          highCard: fourOfAKindHand[0],
        });
      }

      // //Determine full house
      // if (previousCard.rank === card[1].rank) {
      //   streaks.threeOfAKind += 1;
      //   streaks.pair += 1;
      // } else {
      //   streaks.threeOfAKind = 1;
      //   streaks.pair = 1;
      // }
      const fullhouseHand = [...hand];
      if (streaks.ofAKind === 3) {
        if (hand[cardNumber + 1]?.[1].rank === card[1].rank) {
          return card[1];
        }
        streaks.hasThreeOfAKind = true;
        streaks.triple = fullhouseHand.splice(cardNumber - 3, 3);
      }
      if (streaks.ofAKind === 2) {
        if (hand[cardNumber + 1]?.[1].rank === card[1].rank) {
          return card[1];
        }
        streaks.hasPair = true;
        streaks.double = fullhouseHand.splice(cardNumber - 2, 2);
      }
      if (streaks.triple.length > 0 && streaks.double.length > 0) {
        // const highCard = fullHouseImage.filter((card) => {
        //   return card[1].rank !== streaks.triple[0][1].rank &&
        //     card[1].rank !== streaks.double[0][1].rank;
        // });
        setHandType(card, results, "Full House", i, {
          score: 7,
          triple: streaks.triple,
          double: streaks.double,
        });
      }

      //Determine flush

      switch (card[1].suit) {
        case "Clubs":
          streaks.suits.clubs += 1;
          break;
        case "Diamonds":
          streaks.suits.diamonds += 1;
          break;
        case "Hearts":
          streaks.suits.hearts += 1;
          break;
        case "Spades":
          streaks.suits.spades += 1;
          break;
      }
      if (
        streaks.suits.clubs === 5 || streaks.suits.diamonds === 5 ||
        streaks.suits.hearts === 5 || streaks.suits.spades === 5
      ) {
        let suit = streaks.suits.clubs === 5 ? "Clubs" : "";
        suit = streaks.suits.diamonds === 5 ? "Diamonds" : suit;
        suit = streaks.suits.hearts === 5 ? "Hearts" : suit;
        suit = streaks.suits.spades === 5 ? "Spades" : suit;
        const flushHand = hand.filter((card) => {
          return card[1].suit === suit;
        });

        setHandType(card, results, "Flush", i, {
          score: 6,
          suit,
          highCard: flushHand[0],
        });
      }
      //Determine straight
      if (streaks.straight === 5) {
        const straightHand = [...hand];
        const cards = straightHand.splice(cardNumber - 5, 5);
        setHandType(card, results, "Straight", i, {
          score: 5,
          cards,
        });
      }
      if (streaks.straight === 4 && streaks.hasAce && previousCard.rank === 2) {
        const handCopy = [...hand];
        const ace = hand.filter((card) => {
          return card[1].rank === 13;
        });
        const cards = handCopy.splice(cardNumber - 4, 4);
        cards.push(ace[0]);

        setHandType(card, results, "Straight", i, {
          score: 5,
          cards,
        });
        streaks.hasAce = false;
      }

      //Determine three of a kind

      //Determine two pair

      //Determine pair

      //Determine high card

      return card[1];
    }, initialRank);
    return hand;
  });

  console.log("playerCards", playerCards);
  console.log("results", results);
  return results;
};

const sampleState = {
  activePosition: 3,
  stage: "river",
  hands: {
    hands: [
      ["DK", { rank: 12, name: "King", suit: "Diamonds" }],
      ["H7", { rank: 6, name: "Seven", suit: "Hearts" }],
      ["D6", { rank: 5, name: "Six", suit: "Diamonds" }],
      ["DJ", { rank: 10, name: "Jack", suit: "Diamonds" }],
      ["S3", { rank: 2, name: "Three", suit: "Spades" }],
      ["D7", { rank: 6, name: "Seven", suit: "Diamonds" }],
      ["C4", { rank: 3, name: "Four", suit: "Clubs" }],
      ["DA", { rank: 13, name: "Ace", suit: "Diamonds" }],
    ],
    communityCards: [
      ["H7", { rank: 6, name: "Seven", suit: "Hearts" }],
      ["H2", { rank: 1, name: "Duce", suit: "Clubs" }],
      ["S7", { rank: 6, name: "Seven", suit: "Spades" }],
      ["C3", { rank: 2, name: "Three", suit: "Clubs" }],
      ["D5", { rank: 4, name: "Five", suit: "Clubs" }],
    ],
    flop: [
      ["S9", { rank: 8, name: "Nine", suit: "Spades" }],
      ["H2", { rank: 1, name: "Duce", suit: "Clubs" }],
      ["S7", { rank: 6, name: "Seven", suit: "Spades" }],
    ],
    turn: ["C3", { rank: 2, name: "Three", suit: "Clubs" }],
    river: ["D5", { rank: 4, name: "Five", suit: "Clubs" }],
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
    {
      username: "anonymous",
      chips: 15,
      // folded: true,
      buyIn: 100,
      hand: [
        ["H7", { rank: 6, name: "Seven", suit: "Hearts" }],
        ["H7", { rank: 6, name: "Seven", suit: "Hearts" }],
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
    {
      username: "b",
      chips: 0,
      buyIn: 100,
      hand: [["D6", { rank: 5, name: "Six", suit: "Clubs" }], ["DJ", {
        rank: 10,
        name: "Jack",
        suit: "Clubs",
      }]],
      position: 1,
      currentBet: 25,
      flop: [["S9", { rank: 8, name: "Nine", suit: "Spades" }], ["H2", {
        rank: 1,
        name: "Duce",
        suit: "Hearts",
      }], ["S7", { rank: 6, name: "Seven", suit: "Spades" }]],
      turn: ["C3", { rank: 2, name: "Three", suit: "Clubs" }],
      river: ["D5", { rank: 4, name: "Five", suit: "Diamonds" }],
    },
    {
      username: "c",
      chips: 0,
      buyIn: 100,
      hand: [["S3", { rank: 2, name: "Three", suit: "Spades" }], ["D7", {
        rank: 6,
        name: "Seven",
        suit: "Diamonds",
      }]],
      position: 2,
      currentBet: 25,
      flop: [["S9", { rank: 8, name: "Nine", suit: "Spades" }], ["H2", {
        rank: 1,
        name: "Duce",
        suit: "Hearts",
      }], ["S7", { rank: 6, name: "Seven", suit: "Spades" }]],
      turn: ["C3", { rank: 2, name: "Three", suit: "Clubs" }],
      river: ["D5", { rank: 4, name: "Five", suit: "Diamonds" }],
    },
    {
      username: "d",
      chips: 0,
      buyIn: 100,
      hand: [["C4", { rank: 3, name: "Four", suit: "Hearts" }], ["DA", {
        rank: 13,
        name: "Ace",
        suit: "Clubs",
      }]],
      position: 3,
      currentBet: 25,
      flop: [["S9", { rank: 8, name: "Nine", suit: "Spades" }], ["H2", {
        rank: 1,
        name: "Duce",
        suit: "Hearts",
      }], ["S7", { rank: 6, name: "Seven", suit: "Spades" }]],
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
