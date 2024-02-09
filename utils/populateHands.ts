import { Player, Table } from "./tableBlueprint.ts";

export const populateHands = (
  table: Table,
  stage: string = null,
) => {
  console.log("populating hands for", stage);
  const players = table.players;
  let gameState = table.gameState;
  let tableHands = gameState.hands;
  // also run if the game has ended, for next round
  if (!tableHands.flop || tableHands.flop?.length === 0 || gameState.newGame) {
    const results = table.dealCards(players.length);
    gameState.hands = results;
  }
  const currentCards = gameState.hands;
  const handsCopy = [
    ...gameState.playerCards,
  ];
  return players.forEach((player: Player) => {
    if (!!stage) {
      player[stage] = currentCards[stage];
    }
    if (player.hand && player.hand.length > 0) {
      return player;
    }
    if (handsCopy.length < 2) {
      return player;
    }
    player.hand = [handsCopy[0], handsCopy[1]];
    handsCopy.splice(0, 2);

    return player;
  });
};
