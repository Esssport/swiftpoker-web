import { broadcast } from "../api/handleJoinTable.ts";
import { GameState, Table } from "../data_types.ts";
import { determineHandValues } from "./determineHandValues.ts";
import { determineWinners } from "./determineWinners.ts";
import { next } from "./next.ts";

export const handleWinnings = (table: Table, state: GameState) => {
  const players = table.players;
  //TODO: call this determineHandValues after every stage to let users know their hand value
  const results = determineHandValues(table, state);
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
  table.winners = winners;
  //TODO: handle case where there is a tie or somebody folds
  const winnerPrompt = `${winners[0].username} won ${table.pot} chips with ${
    winners[0].handName
  }`;

  console.log("WINNERS", winnerPrompt);

  broadcast({
    event: "table-updated",
    payload: {
      table,
      prompt: "Hand over! " + winnerPrompt,
    },
  }, table.id);

  //IF goNextRound is true, then go to next round

  // table.pot = 0;
  // state.smallBlindPlayed = false;
  // state.bigBlindPlayed = false;
  // state.newGame = true;
  // state.activePosition = 0;
  // state.promptingFor = null;
  // state.highestBets = { preflop: 0, flop: 0, turn: 0, river: 0 };
  // state.stage = "preflop";
  // state.nextRound = true;
  // state.hands = null;
  // table.communityCards = [];
  // table.firstBets = { preflop: 0, flop: 0, turn: 0, river: 0 };

  // players.forEach((p) => {
  //   p.bets = { preflop: 0, flop: 0, turn: 0, river: 0 };
  //   p.folded = false;
  //   p.allIn = false;
  //   p.hasChecked = false;
  //   p.hand = [];
  // });
  // next(table);
  return;
};
