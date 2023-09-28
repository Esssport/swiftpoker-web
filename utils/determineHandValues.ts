import { Card, Result, Table } from "../data_types.ts";

export const determineHandValues = (table: Table, state): any[] => {
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
      card: Card,
      results: Result[],
      handName: string,
      i: number, //TODO: change to username
      payload: Result,
    ) => {
      if (results[i].score > payload.score) {
        return;
      }
      if (!payload) {
        return;
      }
      results[i].handName = handName;
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
      firstPair: <Card[]> [],
      secondPair: <Card[]> [],
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

    let cardNumber = 0;
    hand.reduce((previousCard, card) => {
      const previousCardObj = previousCard[1];
      const cardObj = card[1];
      cardNumber += 1;

      // Determine flush streaks
      switch (previousCardObj.suit) {
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

      if (cardNumber === 6) {
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
      }

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
      if (previousCardObj.rank === 13 || cardObj.rank === 13) {
        streaks.hasAce = true;
        streaks.aceSuits.push(cardObj.suit);
      }

      if (streaks.straight === 5 && streaks.straightFlush === 5) {
        let handType = "Straight Flush";
        let score = 9;
        if (cardObj.rank === 9) {
          handType = "Royal Flush";
          score = 10;
        }
        const cards = [...hand].splice(0, 5);
        setHandType(card, results, handType, i, {
          score,
          cards,
        });
      }
      if (
        streaks.straight === 4 && streaks.hasAce &&
        previousCardObj.rank === 2 &&
        streaks.straightFlush === 4 &&
        streaks.aceSuits.indexOf(previousCardObj.suit) > -1
      ) {
        const handType = "Straight Flush";
        const ace = hand.filter((card) => {
          return card[1].rank === 13 && card[1].suit === card[1].suit;
        });
        const cards = [...hand].splice(cardNumber - 4, 4);
        cards.push(ace[0]);

        setHandType(card, results, handType, i, {
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
        const highCards = [...hand].filter((card) => {
          return card[1].rank !== streaks.currentPair[0][1].rank;
        });
        const fourOfAKind = [...hand].filter((card) => {
          return card[1].rank === streaks.currentPair[0][1].rank;
        });
        const cards = [...fourOfAKind, ...highCards];
        setHandType(card, results, "Four of a Kind", i, {
          score: 8,
          cards,
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
        if (streaks.triple.length === 0) {
          streaks.triple = streaks.currentPair;
        }
      }
      if (streaks.ofAKind === 2) {
        if (
          hand[cardNumber + 1] &&
          hand[cardNumber + 1][1].rank === cardObj.rank &&
          streaks.triple.length === 0
        ) {
          return card;
        }
        if (streaks.double.length === 0) {
          streaks.double = streaks.currentPair.splice(0, 2);
        }

        if (streaks.firstPair.length === 0) {
          streaks.firstPair = streaks.currentPair;
        } else {
          streaks.secondPair = streaks.currentPair;
        }
      }
      if (streaks.triple.length > 0 && streaks.double.length > 0) {
        setHandType(card, results, "Full House", i, {
          score: 7,
          triple: streaks.triple,
          double: streaks.double,
          cards: [...streaks.triple, ...streaks.double],
        });
      }

      //Determine straight
      if (streaks.straight === 5) {
        const cards = [...hand].filter((card, i) => {
          return card[1].rank !== cardObj.rank;
        }).splice(cardNumber - 5, 5);
        setHandType(card, results, "Straight", i, {
          score: 5,
          cards,
        });
      }
      if (
        streaks.straight === 4 && streaks.hasAce && previousCardObj.rank === 2
      ) {
        const ace = hand.filter((card) => {
          return card[1].rank === 13;
        });

        const cards = [...hand].filter((card, i) => {
          return card[1].rank !== previousCardObj.rank;
        })
          .splice(cardNumber - 4, 4);
        cards.push(ace[0]);

        setHandType(card, results, "Straight", i, {
          score: 5,
          cards,
        });
        streaks.hasAce = false;
      }

      // Determine three of a kind
      if (streaks.triple.length === 3) {
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

        setHandType(
          card,
          results,
          "Three of a Kind",
          i,
          streaks.tripleSnapShot,
        );
      }

      //Determine two pair
      if (streaks.double.length === 2 && streaks.secondPair.length === 2) {
        const highCards = [...hand].filter((card) => {
          return card[1].rank !== streaks.firstPair[0][1].rank &&
            card[1].rank !== streaks.secondPair[0][1].rank;
        })[0];

        const cards = [
          ...streaks.firstPair,
          ...streaks.secondPair,
          highCards,
        ];

        setHandType(
          card,
          results,
          "Two Pair",
          i,
          {
            score: 3,
            cards,
            firstPair: streaks.firstPair,
            secondPair: streaks.secondPair,
          },
        );
      }

      //Determine flush
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

        setHandType(card, results, "Flush", i, {
          score: 6,
          suit,
          cards,
        });
      }

      if (cardNumber !== 6) {
        return card;
      }

      //Determine pair
      if (streaks.firstPair.length === 2) {
        const highCards = [...hand].filter((card) => {
          return card[1].rank !== streaks.firstPair[0][1].rank;
        }).splice(0, 3);
        const cards = [
          ...streaks.firstPair,
          ...highCards,
        ];
        setHandType(
          card,
          results,
          "Pair",
          i,
          { score: 2, cards, firstPair: streaks.firstPair },
        );
      }

      //Determine high card
      const cards = [...hand].splice(0, 5);
      setHandType(
        card,
        results,
        "High Card",
        i,
        { score: 1, cards },
      );
    });
    return hand;
  });

  console.log("playerCards", playerCards);
  return results;
};
