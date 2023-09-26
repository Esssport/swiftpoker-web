import { Card, Table } from "../data_types.ts";
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

type Result = {
  username?: string;
  handName?: string;
  score?: number;
  cards?: Card[];
  triple?: Card[];
  double?: Card[];
  highCards?: Card[];
};

//temporarily setting it up here
const determineWinners = (table, state): any[] => {
  const results: Result[] = [];
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
      cardNumber: number,
      card: Card,
      results: Result[],
      handName: string,
      i: number,
      payload: {} = undefined,
    ) => {
      console.log("Card number", cardNumber);
      if (cardNumber !== 6) return;
      if (!!results[i].handName) return;
      if (!results[i].handName) {
        results[i].handName = handName;
      }
      if (!payload) {
        return;
      }
      for (const key in payload) {
        results[i][key] = payload[key];
      }
      return card;
    };

    const streaks = {
      straight: 1,
      straightFlush: 1,
      ofAKind: 1,
      hasAce: false,
      tripleSnapShot: <Result> {},
      firstPair: <Result> {},
      secondPair: <Result> {},
      aceSuits: [],
      triple: [],
      double: [],
      currentPair: [],
      suits: {
        clubs: 0,
        diamonds: 0,
        hearts: 0,
        spades: 0,
      },
    };

    // const initialRank = hand[0][1];
    let cardNumber = 0;
    hand.reduce((previousCard, card) => {
      const previousCardObj = previousCard[1];
      const cardObj = card[1];
      cardNumber += 1;
      //Determine flush for straight flush;
      if (previousCardObj.suit === cardObj.suit) {
        streaks.straightFlush += 1;
      } else {
        streaks.straightFlush = 1;
      }
      //Determine straight for straight flush;
      if (previousCardObj.rank - cardObj.rank === 1) {
        streaks.straight += 1;
      } else if (previousCardObj.rank - cardObj.rank === 0) {
        //do nothing
      } else {
        streaks.straight = 1;
      }
      if (cardObj.rank === 13) {
        streaks.hasAce = true;
        streaks.aceSuits.push(cardObj.suit);
      }

      if (streaks.straight === 5 && streaks.straightFlush === 5) {
        let handType = "Straight Flush";
        let score = 9;
        if (cardObj.name === "Ten") {
          handType = "Royal Flush";
          score = 10;
        }
        const handCopy = [...hand];
        const cards = handCopy.splice(cardNumber - 5, 5);
        setHandType(cardNumber, card, results, handType, i, {
          score,
          cards,
        });
        // return card;
      }
      if (
        streaks.straight === 4 && streaks.hasAce &&
        previousCardObj.rank === 2 &&
        streaks.straightFlush === 4 &&
        streaks.aceSuits.indexOf(previousCardObj.suit) > -1
      ) {
        const handType = "Straight Flush";
        const handCopy = [...hand];
        const ace = hand.filter((card) => {
          return card[1].rank === 13 && card[1].suit === card[1].suit;
        });
        const cards = handCopy.splice(cardNumber - 4, 4);
        cards.push(ace[0]);

        setHandType(cardNumber, card, results, handType, i, {
          score: 9,
          cards,
        });
        streaks.hasAce = false;
      }

      //Determine four of a kind
      if (previousCardObj.rank === cardObj.rank) {
        streaks.ofAKind += 1;
        if (streaks.currentPair.length === 0) {
          streaks.currentPair.push(previousCard);
        }
        streaks.currentPair.push(card);
      } else {
        streaks.currentPair = [];
        streaks.ofAKind = 1;
      }

      if (streaks.ofAKind === 4) {
        const highCard = [...hand].filter((card) => {
          return card[1].rank !== streaks.currentPair[0][1].rank;
        })[0];
        const fourOfAKind = [...hand].filter((card) => {
          return card[1].rank === streaks.currentPair[0][1].rank;
        });
        const cards = [...fourOfAKind, highCard];
        setHandType(cardNumber, card, results, "Four of a Kind", i, {
          score: 8,
          cards,
          highCard,
        });
      }

      //Determine full house
      if (streaks.ofAKind === 3) {
        if (
          hand[cardNumber + 1] && hand[cardNumber + 1][1].rank === cardObj.rank
        ) {
          //It's a four of a kind
          return card;
        }
        streaks.triple = streaks.currentPair;
      }
      if (streaks.ofAKind === 2) {
        if (
          hand[cardNumber + 1] && hand[cardNumber + 1][1].rank === cardObj.rank
        ) {
          return card;
        }
        streaks.double = streaks.currentPair;
      }
      if (streaks.triple.length > 0 && streaks.double.length > 0) {
        setHandType(cardNumber, card, results, "Full House", i, {
          score: 7,
          triple: streaks.triple,
          double: streaks.double,
          cards: [...streaks.triple, ...streaks.double],
        });
      }

      //Determine flush

      switch (cardObj.suit) {
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
        const cards = hand.filter((card) => {
          return card[1].suit === suit;
        });

        setHandType(cardNumber, card, results, "Flush", i, {
          score: 6,
          suit,
          cards,
        });
      }
      //Determine straight
      if (streaks.straight === 5) {
        const straightHand = [...hand];
        const cards = straightHand.splice(cardNumber - 5, 5);
        setHandType(cardNumber, card, results, "Straight", i, {
          score: 5,
          cards,
        });
      }
      if (
        streaks.straight === 4 && streaks.hasAce && previousCardObj.rank === 2
      ) {
        const handCopy = [...hand];
        const ace = hand.filter((card) => {
          return card[1].rank === 13;
        });
        const cards = handCopy.splice(cardNumber - 4, 4);
        cards.push(ace[0]);

        setHandType(cardNumber, card, results, "Straight", i, {
          score: 5,
          cards,
        });
        streaks.hasAce = false;
      }

      // Determine three of a kind
      if (streaks.triple.length === 3) {
        //don't do unless you're sure
        const highCards = [...hand].filter((card) => {
          return card[1].rank !== streaks.triple[0][1].rank;
        }).splice(0, 2);
        const cards = [
          ...streaks.triple,
          ...highCards,
        ];

        streaks.tripleSnapShot = {
          score: 4,
          triple: streaks.triple,
          cards,
        };
        if (cardNumber === 6) {
          setHandType(
            cardNumber,
            card,
            results,
            "Three of a Kind",
            i,
            streaks.tripleSnapShot,
          );
        }
      }

      //Determine two pair
      if (streaks.double.length === 2) {
        const highCards = [...hand].filter((card) => {
          return card[1].rank !== streaks.double[0][1].rank;
        }).splice(0, 2);

        //determine 1 pair or two pair

        const cards = [
          ...streaks.double,
          ...highCards,
        ];

        // streaks.firstPair = {
        //   score: 4,
        //   triple: streaks.triple,
        //   cards,
        // };

        streaks;
        if (cardNumber === 6) {
          setHandType(
            cardNumber,
            card,
            results,
            "Three of a Kind",
            i,
            streaks.tripleSnapShot,
          );
        }
      }

      //Determine pair

      //Determine high card

      return card;
    });
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
    communityCards: [
      ["H7", { rank: 6, name: "Seven", suit: "Hearts" }],
      ["H2", { rank: 1, name: "Duce", suit: "Clubs" }],
      ["S7", { rank: 2, name: "Seven", suit: "Spades" }],
      ["C3", { rank: 2, name: "Three", suit: "Clubs" }],
      ["D5", { rank: 444, name: "Five", suit: "Clubs" }],
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
    //   username: "anonymous",
    //   chips: 15,
    //   // folded: true,
    //   buyIn: 100,
    //   hand: [
    //     ["H7", { rank: 6, name: "Seven", suit: "mashti" }],
    //     ["H7", { rank: 6, name: "Seven", suit: "Hearts" }],
    //   ],
    //   position: 0,
    //   currentBet: 25,
    //   flop: [
    //     ["S9", { rank: 8, name: "Nine", suit: "Spades" }],
    //     ["H2", { rank: 1, name: "Duce", suit: "Hearts" }],
    //     ["S7", { rank: 6, name: "Seven", suit: "Spades" }],
    //   ],
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
    {
      username: "c",
      chips: 0,
      buyIn: 100,
      hand: [["S3", { rank: 6, name: "Three", suit: "Spades" }], ["D7", {
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
    // {
    //   username: "d",
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
  ],
  blinds: { small: 10, big: 25 },
  buyInRange: { min: 100, max: 500 },
  maxPlayers: 10,
  pot: 385,
  type: "cash",
};
