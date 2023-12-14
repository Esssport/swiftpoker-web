import { send } from "../api/broadcast.ts";
import { Table } from "../data_types.ts";

export const askTOBet = (
  table: Table,
  username: string,
  optionalActions?: string[],
) => {
  const players = table.players;
  const player = players.find((p) => p.username === username);
  const gameState = table.GameState;
  const stage = gameState.stage;
  let actions = [];
  if (table.firstBets[stage] === 0) {
    actions = ["check", "bet"];
  } else if (
    player.chips + player.bets[stage] >= gameState.highestBets[stage]
  ) {
    actions = ["fold", "call", "raise"];
  } else {
    actions = ["fold", "call"];
  }
  //overriding big blind in preflop since they can only check or raise
  if (optionalActions) actions = optionalActions;

  // Actions for user that is being prompted
  //[fold, call, raise] next user to play, if there is a bet [fold, call] when everybody else is all in
  //in showdown when lost [you lost don't show/muck, show]
  //in showdown when won [you won don't show, show]
  // TODO: when somebody all ins, anything that surpluses need to be returned to the user
  const payload = {
    waitingFor: username,
    table,
    //TODO: make a copy of gameState and remove sensitive info
    gameState,
    chips: player.chips,
    prompt: username + " Place your bet",
  };

  const betPrompt = {
    event: "table-updated",
    payload,
    actions,
  };
  send(player.socket, betPrompt);

  //set secondaryActions for everyone except the player
  const otherUsers = players.filter((p) => p.username !== username);
  otherUsers.forEach((p) => {
    // Actions for user that is not being prompted, sent as secondaryActions
    //[check/fold, check] before anybody bets
    //[fold, call] whens somebody bets (and user's bet is less than highest bet)
    //[call] current bet is equal to highest bet
    let secondaryActions = [];
    if (table.firstBets[gameState.stage] === 0) {
      secondaryActions = ["check/fold", "check"];
    } else if (
      gameState.highestBets[gameState.stage] > p.bets[gameState.stage]
    ) {
      secondaryActions = ["fold", "call"];
    } else {
      secondaryActions = ["call"];
    }

    const actionsPrompt = {
      event: "table-updated",
      payload,
      secondaryActions,
    };
    send(p.socket, actionsPrompt);
  });
};