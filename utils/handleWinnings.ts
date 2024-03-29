import { broadcast } from "../api/broadcast.ts";
import { GameState, Table } from "../utils/tableBlueprint.ts";
import { determineHandValues } from "./determineHandValues.ts";
import { determineWinners } from "./determineWinners.ts";
import { delay, next } from "./next.ts";

export const handleWinnings = async (table: Table) => {
  const state = table.gameState;
  const players = table.players;
  //TODO: call this determineHandValues after every stage to let users know their hand value
  const results = determineHandValues(table);
  let winners = determineWinners(results);

  //handle cases where everybody folds
  let remainingPlayers = players.filter((p) => !p.folded);
  if (remainingPlayers.length === 1) {
    //TODO: keep handValue in context as the game goes on
    winners = remainingPlayers;
    const player = players.find((p) => p.username === winners[0].username);
    player.chips += table.pot;
  } else {
    if (winners.length === 1) {
      players.find((p) => p.username === winners[0].username).chips +=
        table.pot;
    } else {
      const splitPot = Math.floor(table.pot / winners.length);
      console.log("splitPot", splitPot);
      winners.forEach((winner) => {
        players.find((p) => p.username === winner.username).chips += splitPot;
      });
    }
  }
  state.winners = winners;
  let winnerPrompt = "";
  //TODO: handle case where there is a tie or somebody folds
  let allHands = [];
  if (remainingPlayers.length > 1) {
    allHands = table.allHands;
    winnerPrompt = `${winners[0].username} won ${table.pot} chips with ${
      winners[0].handName
    }`;
  } else {
    winnerPrompt = `${
      winners[0].username
    } won ${table.pot} chips since everyone else folded`;
  }
  console.log("WINNERS", winnerPrompt);
  broadcast({
    event: "table-updated",
    payload: {
      communityCards: table.gameState.hands,
      table,
      allHands,
      prompt: "Hand over! " + winnerPrompt,
    },
  }, table.id);

  //IF goNextRound is true, then go to next round
  await delay(3000);

  if (!table.isLastRound) {
    goNextRound(table);
  } else {
    console.log("Handled winnings, but not going to next round.");
    console.log("GAME OVER");
    state.stage = "waiting";
    table.isLastRound = false;
  }
};

export const goNextRound = (table: Table) => {
  const state = table.gameState;
  const players = table.players;
  table.pot = 0;
  state.smallBlindPlayed = false;
  state.bigBlindPlayed = false;
  state.newGame = true;
  state.activePosition = 0;
  state.promptingFor = null;
  state.highestBets = { preflop: 0, flop: 0, turn: 0, river: 0 };
  state.stage = "preflop";
  state.nextRound = true;
  state.hands = null;
  table.firstBets = { preflop: 0, flop: 0, turn: 0, river: 0 };

  players.forEach((p) => {
    p.bets = { preflop: 0, flop: 0, turn: 0, river: 0 };
    p.folded = false;
    p.isAllIn = false;
    p.hasChecked = false;
    p.hand = [];
  });
  if (table.players.length < table.minPlayers) {
    state.stage = "waiting";
    console.log("NOT ENOUGH PLAYERS");
  } else {
    next(table);
  }
  return;
};
