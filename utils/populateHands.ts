import { Player, Table } from "./tableBlueprint.ts";
import { dealCards } from "./dealCards.ts";

export const populateHands = (
  table: Table,
  stage: string = null,
) => {
  const players = table.players;
  let gameState = table.gameState;
  let tableHands = gameState.hands;
  // also run if the game has ended, for next round
  if (!tableHands || gameState.newGame) {
    const results = dealCards(table.id, players.length);
    gameState.hands = results;
  }
  const currentCards = gameState.hands;
  const handsCopy = [
    ...currentCards.flop,
    currentCards.turn,
    currentCards.river,
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
