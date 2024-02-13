import { Table } from "./tableBlueprint.ts";
import { determinePositions } from "./determinePositions.ts";
import { goNextRound, handleWinnings } from "./handleWinnings.ts";
import { populateHands } from "./populateHands.ts";
import { promptBet } from "./promptBet.ts";
import { takeAction } from "./takeAction.ts";

// let nextCounter = 0;
export const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export const next = async (table: Table) => {
  // nextCounter += 1;
  const gameState = table.gameState;
  // console.log("NEXT", nextCounter, "position", gameState.activePosition);
  const players = table.players;
  const stage = gameState.stage;
  let player = players.find((p) => p.position === gameState.activePosition);

  let remainingPlayers = players.filter((p) => !p.folded);
  if (remainingPlayers.length === 1) {
    handleWinnings(table);
    return;
  }
  // console.log(
  //   "NEXT",
  //   nextCounter,
  //   "position",
  //   gameState.activePosition,
  //   "player",
  //   player?.username,
  //   "player.position",
  //   player?.position,
  //   "stage",
  //   stage,
  // );
  //check for bets to be matched
  if (gameState.activePosition > players.length - 1) {
    const unmatchedBets = players.filter((p) => {
      return !p.folded && p.bets[stage] < gameState.highestBets[stage];
    });

    if (unmatchedBets.length > 0) {
      console.log("UNMATCHED BETS", unmatchedBets[0].username);
      gameState.activePosition = unmatchedBets[0].position;
      next(table);
      return;
    }

    //next round of cards
    gameState.activePosition = 0;

    //update gameStage
    switch (stage) {
      case "preflop":
        gameState.stage = "flop";
        break;
      case "flop":
        gameState.stage = "turn";
        break;
      case "turn":
        gameState.stage = "river";
        break;
      case "river":
        gameState.stage = "showdown";
        break;
      default:
        gameState.stage = "preflop";
    }

    if (gameState.stage === "showdown") {
      handleWinnings(table);
      return;
    }
    await delay(2000);
    populateHands(table, gameState.stage);
    next(table);
    return;
  }

  if (
    player?.bets[stage] !== 0 &&
    player?.bets[stage] === gameState.highestBets[stage]
  ) {
    gameState.activePosition += 1;
    next(table);
    return;
  }

  if (gameState.newGame) {
    determinePositions(table);
    populateHands(table);
    players.forEach((p) => {
      p.transmitHand();
    });
  }

  player = players.find((p) => p.position === gameState.activePosition);
  if (!player) {
    console.log("NO PLAYER");
    // set the table ready for the next round
    goNextRound(table);
    // return;
  }
  if (
    player.role === "smallBlind" &&
    !gameState.smallBlindPlayed
  ) {
    gameState.smallBlindPlayed = true;
    takeAction({
      table,
      player,
      betAmount: table.blinds.small,
      stage,
      action: "bet",
    });
    return;
  }
  if (
    player.role === "bigBlind" &&
    !gameState.bigBlindPlayed
  ) {
    gameState.bigBlindPlayed = true;
    takeAction({
      table,
      player,
      action: "bet",
      betAmount: table.blinds.big,
      stage,
    });
    return;
  }

  if (
    //probably needs to be players.length - 1
    gameState.activePosition <= players.length
  ) {
    promptBet(
      table,
      //TODO: change back to player.username
      players.find((p) => p.position === gameState.activePosition).username,
    );
    return;
  }
  return;
};
