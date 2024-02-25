import { send } from "../api/broadcast.ts";
import { ActionOptions, Table } from "../utils/tableBlueprint.ts";

export const askTOBet = (
  table: Table,
  username: string,
  optionalActions?: string[],
) => {
  const players = table.players;
  const player = players.find((p) => p.username === username);
  const gameState = table.gameState;
  const stage = gameState.stage;
  let actions = [];
  let actionOptions = new ActionOptions(
    "raise",
    0,
    player.chips + player.bets[stage],
  );

  // handle cases where player is all in
  if (player.chips === 0) {
    player.isAllIn = true;
  }

  if (table.firstBets[stage] === 0) {
    actions = ["check", "bet"];
  } else if (
    player.chips + player.bets[stage] >= gameState.highestBets[stage]
  ) {
    actions = ["fold", "call", "raise"];
    actionOptions.callAmount = gameState.highestBets[stage];
    const minRaise = Math.max(
      gameState.highestBets[stage] + table.blinds.big,
      table.firstBets[stage] * 2,
    );
    actionOptions.raiseAmount = Math.min(minRaise, actionOptions.maxBetAllowed);
    // if (minRaise > player.chips + player.bets[stage]) {
    //   actionOptions.raiseAmount = player.chips + player.bets[stage];
    // }
  } else {
    actions = ["fold", "call"];
  }
  // if (player.isAllIn) {
  //   actionOptions.amount = 0;
  //   actionOptions.maxBetAllowed = 0;
  //   actionOptions.raiseAmount = 0;
  //   actionOptions.callAmount = 0;
  //   actionOptions.isAllIn = true;
  // }
  //overriding big blind in preflop since they can only check or raise
  if (optionalActions) actions = optionalActions;

  // Actions for user that is being prompted
  //[fold, call, raise] next user to play, if there is a bet [fold, call] when everybody else is all in
  //in showdown when lost [you lost don't show/muck, show]
  //in showdown when won [you won don't show, show]
  // TODO: when somebody all ins, anything that surpluses need to be returned to the user
  table.potSum = table.potSum;
  const payload = {
    waitingFor: username,
    table,
    actionOptions,
    communityCards: table.gameState.hands,
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
