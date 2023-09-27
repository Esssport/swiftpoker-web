import { Result } from "../data_types.ts";

export const determineWinners = (results: Result[]): Result[] => {
  const winners = [];
  results.sort((a, b) => {
    return b.score - a.score;
  });

  const updateWinners = (winners: Result[], currentPlayer: Result) => {
    if (winners.indexOf(currentPlayer) === -1) {
      winners.push(currentPlayer);
    }
    return;
  };

  results.reduce((prevPlayer: Result, currentPlayer: Result) => {
    if (prevPlayer.score > currentPlayer.score) {
      return prevPlayer;
    }
    if (prevPlayer.score === currentPlayer.score) {
      prevPlayer.cards.forEach((card, i) => {
        const cardObj = card[1];
        console.log("currentPlayer.cards", currentPlayer.cards);
        const nextCardObj = currentPlayer.cards[i][1];

        if (cardObj.rank > nextCardObj.rank) {
          console.log("prevPlayer won");
          updateWinners(winners, prevPlayer);
          return;
        }
        if (cardObj.rank < nextCardObj.rank) {
          console.log("currentPlayer won");
          updateWinners(winners, currentPlayer);
          return;
        }
        if (cardObj.rank === nextCardObj.rank) {
          if (i === 4) {
            if (winners.length === 0) {
              updateWinners(winners, prevPlayer);
            }
            updateWinners(winners, currentPlayer);
            console.log("Both won");
          }
        }
      });
    }
    return currentPlayer;
  });

  console.log("results", results);
  console.log("WINNER IS:", winners);
  return results;
};
