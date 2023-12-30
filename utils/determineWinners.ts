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

  for (let i = 0; i < results.length; i++) {
    const prevPlayer = results[i];
    const currentPlayer = results[i + 1];
    if (!currentPlayer) {
      continue;
    }
    if (prevPlayer.score > currentPlayer.score) {
      console.log("prevPlayer score is higher");
      updateWinners(winners, prevPlayer);
      break;
    }

    if (prevPlayer.score === currentPlayer.score) {
      for (let i = 0; i < prevPlayer.cards?.length; i++) {
        const card = prevPlayer.cards[i];

        const cardObj = card[1];
        if (!currentPlayer.cards[i]) {
          console.log("no current player card");
          continue;
        }
        const nextCardObj = currentPlayer.cards[i][1];

        if (cardObj.rank > nextCardObj.rank) {
          console.log("prevPlayer won");
          updateWinners(winners, prevPlayer);
          break;
        }
        if (cardObj.rank < nextCardObj.rank) {
          console.log("currentPlayer won");
          updateWinners(winners, currentPlayer);
          break;
        }
        if (cardObj.rank === nextCardObj.rank) {
          if (i === 4) {
            if (winners.length === 0) {
              console.log("Both won");
              updateWinners(winners, prevPlayer);
            }
            updateWinners(winners, currentPlayer);
            console.log("i === 4");
            break;
          }
        }
      }
    }
    if (prevPlayer.score < currentPlayer.score) {
      updateWinners(winners, currentPlayer);
      console.log("currentPlayer score is higher");
      break;
    }
  }
  return winners;
};
