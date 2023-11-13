import { Table } from "../data_types.ts";
import { allGameStates } from "./Dealer.ts";
import { askTOBet } from "./askTOBet.ts";

export const promptBet = (table: Table, username: string) => {
  //TODO: set a timer for folding if no bet is placed
  const gameState = allGameStates.get(table.id);
  // if (gameState.promptingFor === username) return;
  //TODO: Prompt any user who has not folded or isn't equal to the highest bet
  const players = table.players;
  // const player = players.find((p) => p.position === gameState.activePosition);
  const player = players.find((p) => p.username === username);

  gameState.promptingFor = username;
  console.log("prompting", username);
  askTOBet(table, username);
  return;
};
