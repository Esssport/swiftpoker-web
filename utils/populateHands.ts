import { Player, Table } from "./tableBlueprint.ts";

export const populateHands = (
  table: Table,
  stage: string = null,
) => {
  const players = table.players;
  let gameState = table.gameState;
  let tableHands = gameState.hands;
  console.log("TableHands", tableHands);
  console.log("gameState.newGame", gameState.newGame);
  // also run if the game has ended, for next round
  if (tableHands.flop?.length === 0 || gameState.newGame) {
    const results = table.dealCards(players.length);
    gameState.hands = results;
  }
  const currentCards = gameState.hands;
  console.log("currentCards", currentCards);
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
