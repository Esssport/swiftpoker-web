import { placeBet } from "./placeBet.ts";
import { next } from "./next.ts";
import { askTOBet } from "./askTOBet.ts";
import { BetInput } from "../data_types.ts";

export const takeAction = (input: BetInput) => {
  const { table, player, action, betAmount, stage } = input;

  const isAllIn = betAmount >= player.chips;
  const bet = isAllIn ? player.chips : betAmount;

  const gameState = table.gameState;
  const isBlind = player.role === "smallBlind" || player.role === "bigBlind";
  const isFirstBet = table.firstBets[stage] === 0;
  const isValidRaise = !isFirstBet && bet >= table.firstBets[stage] * 2;
  const isValidBet = bet >= table.blinds.big;

  if (isAllIn) {
    player.allIn = true;
  }

  if (!isAllIn && !isBlind && !isValidBet && !isValidRaise) {
    console.log(`Invalid bet of ${bet} chips from ${player.username}`);

    askTOBet(table, player.username);
    console.log("TRY AGAIN");
    return;
  }

  if (action === "call") {
    const betAmount = gameState.highestBets[stage];
    placeBet(table, player, betAmount, gameState);
    return;
  }

  // available actions ["check", "bet", "fold", "call", "raise"];
  //TODO: possibly pass raise amount and raise range with actions, like raiseRange: [minimumRaise, player.chips]
  //FIXME: fix cases where player raises and raises again
  if (action === "raise") {
    const minimumRaise = table.firstBets[stage] * 2;
    const isValidRaise = bet >= minimumRaise;
    let raiseAmount = isValidRaise ? bet : minimumRaise;
    // const deficitAmount = raiseAmount - player.bets[stage];
    placeBet(table, player, raiseAmount, gameState);
    return;
  }

  if (action === "bet") {
    if (!isValidBet && !isFirstBet && !isAllIn) {
    }
    placeBet(table, player, bet, gameState);
    return;
  }

  if (action === "fold") {
    player.folded = true;
    gameState.activePosition += 1;
    gameState.promptingFor = null;
    next(table);
    return;
  }
  console.log("action", action);
  if (action === "check") {
    if (
      table.firstBets[stage] === 0 ||
      (gameState.stage === "preflop" && player.role === "bigBlind")
    ) {
      player.hasChecked = true;
      gameState.activePosition += 1;
      gameState.promptingFor = null;
      next(table);
      return;
    } else {
      console.log("You can't check");
      askTOBet(table, player.username);
      return;
    }
  }

  // placeBet(table, player, bet, gameState);
};
