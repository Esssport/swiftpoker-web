import { next } from "./next.ts";
import { GameState, Player, Table } from "./tableBlueprint.ts";
import { askTOBet } from "./askTOBet.ts";

export const placeBet = (
  table: Table,
  player: Player,
  bet: number,
  gameState: GameState,
) => {
  const stage = gameState.stage;
  const deficitAmount = bet - player.bets[stage];
  player.bets[stage] = bet;
  player.chips -= deficitAmount;
  table.pot += deficitAmount;

  if (table.firstBets[stage] === 0 && bet >= table.blinds.big) {
    table.firstBets[stage] = bet;
  }

  gameState.highestBets[stage] = Math.max(bet, gameState.highestBets[stage]);

  console.log(`${bet} chips bet by ${player.username}`);

  gameState.activePosition += 1;
  gameState.promptingFor = null;

  // prompt big blind to check or raise
  if (
    stage === "preflop" && player.position === 0 &&
    gameState.highestBets[stage] === table.blinds.big
  ) {
    const bigBlindPlayer = table.players.find((p) => p.role === "bigBlind");
    askTOBet(table, bigBlindPlayer.username, ["check", "raise"]);
    return;
  }

  next(table);
  return;
};
