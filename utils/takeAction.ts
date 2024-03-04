import { placeBet } from "./placeBet.ts";
import { next } from "./next.ts";
import { askTOBet } from "./askTOBet.ts";
import { BetInput } from "../data_types.ts";
import { send } from "../api/broadcast.ts";

export const takeAction = (input: BetInput) => {
  //send an empty message to player to clear the prompt
  const { table, player, action, betAmount, stage } = input;
  console.log("BETAMOUNT", betAmount);
  const message = { event: "clear-prompt", payload: "" };
  // const actionsPrompt = {
  //   event: "table-updated",
  //   payload,
  //   secondaryActions,
  // };
  send(player.socket, message);

  const isAllIn = betAmount >= player.chips;
  // console.log(
  //   "isAllIn",
  //   isAllIn,
  //   "player.chips",
  //   player.chips,
  //   "player.bets[stage]",
  //   player.bets[stage],
  // );
  const bet = isAllIn ? player.chips + player.bets[stage] : betAmount;

  const gameState = table.gameState;
  const isBlind = player.role === "smallBlind" || player.role === "bigBlind";
  const isFirstBet = table.firstBets[stage] === 0;
  const isValidRaise = !isFirstBet && bet >= table.firstBets[stage] * 2;
  const isValidBet = bet >= table.blinds.big;

  if (isAllIn) {
    player.isAllIn = true;
  }

  if (!isAllIn && !isBlind && !isValidBet && !isValidRaise) {
    console.log(`Invalid bet of ${bet} chips from ${player.username}`);

    askTOBet(table, player.username);
    console.log("TRY AGAIN");
    return;
  }

  //TODO: potentially add a new action called "all-in"
  // if (player.isAllIn) {
  //   action = "check";
  // }

  if (action === "call") {
    const bet = gameState.highestBets[stage];
    placeBet(table, player, bet, gameState);
    return;
  }

  // available actions ["check", "bet", "fold", "call", "raise"];
  //TODO: handle all-in cases
  if (action === "raise") {
    const minRaise = Math.max(
      gameState.highestBets[stage] + table.blinds.big,
      table.firstBets[stage] * 2,
    );
    const isValidRaise = bet >= minRaise;
    let raiseAmount = minRaise;

    if (isValidRaise) {
      raiseAmount = bet;
    }
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
