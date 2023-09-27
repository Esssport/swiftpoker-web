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
  };

  const winner = results.reduce((prevPlayer: Result, currentPlayer: Result) => {
    if (prevPlayer.score > currentPlayer.score) {
      return prevPlayer;
    }
    if (prevPlayer.score === currentPlayer.score) {
      prevPlayer.cards.forEach((card, i) => {
        const cardObj = card[1];
        const nextCardObj = currentPlayer.cards[i][1];
        if (cardObj.rank > nextCardObj.rank) {
          return prevPlayer;
        }
        if (cardObj.rank < nextCardObj.rank) {
          return currentPlayer;
        }
        if (cardObj.rank === nextCardObj.rank) {
          console.log("I", i);
          if (winners.length === 0) {
            updateWinners(winners, prevPlayer);
          }
          updateWinners(winners, currentPlayer);
        }
      });
    }
    return currentPlayer;
  });
  updateWinners(winners, winner);

  console.log("results", results);
  console.log("WINNER IS:", winners);
  return results;
};
