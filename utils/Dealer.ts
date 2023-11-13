//move send and broadcast to utils
import { send } from "../api/handleJoinTable.ts";
import { Card, GameState, Player, Table } from "../data_types.ts";
import { determineHandValues } from "./determineHandValues.ts";
import { determineWinners } from "./determineWinners.ts";
const allGameStates = new Map<
  number,
  GameState
>();

export const startGame = async (
  username,
  tableID,
  table: Table,
) => {
  const players = table.players;
  if (!tableID || !players || players.length < 2) {
    return;
  }
  if (username !== players[0].username) {
    return;
  }

  if (!allGameStates.has(tableID)) {
    allGameStates.set(tableID, {
      activePosition: 0,
      stage: "preflop",
      hands: null,
      newGame: true,
      smallBlindPlayed: false,
      bigBlindPlayed: false,
      promptingFor: null,
      highestBets: { preflop: 0, flop: 0, turn: 0, river: 0 },
    });
  }
  const player = players.find((p) => p.username === username);

  next(table);
  if (!player) {
    console.log("NO PLAYER");
    return;
  }
  players.forEach((player) => {
    player.socket.onmessage = (m) => {
      const data = JSON.parse(m.data);
      const gameState = allGameStates.get(table.id);
      console.log("msg in server: ", data);
      switch (data.event) {
        case "action-taken":
          const payload = data.payload;
          takeAction({
            table,
            player,
            action: payload.action,
            betAmount: payload.betAmount,
            stage: gameState.stage,
          });
          break;
      }
    };
  });
};

const handleWinnings = (table: Table, state: GameState) => {
  const players = table.players;
  //TODO: call this determineHandValues after every stage to let users know their hand value
  const results = determineHandValues(table, state);
  let winners = determineWinners(results);

  //handle cases where everybody folds
  let remainingPlayers = players.filter((p) => !p.folded);
  if (remainingPlayers.length === 1) {
    winners = [winners.find((result) => {
      return result.username === remainingPlayers[0].username;
    })];
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

  console.log(
    "WINNER",
    winners[0].username,
    "won",
    table.pot,
    "chips",
    "with",
    winners[0].handName,
  );

  table.winners = winners;
  console.log("WINNERS", table.winners);
  table.pot = 0;
  state.smallBlindPlayed = false;
  state.bigBlindPlayed = false;
  state.newGame = true;
  state.activePosition = 0;
  state.promptingFor = null;
  state.highestBets = { preflop: 0, flop: 0, turn: 0, river: 0 };
  state.hands = null;
  state.stage = "preflop";
  state.nextRound = true;

  table.communityCards = [];
  table.firstBets = { preflop: 0, flop: 0, turn: 0, river: 0 };

  players.forEach((p) => {
    p.bets = { preflop: 0, flop: 0, turn: 0, river: 0 };
    p.folded = false;
    p.allIn = false;
    p.hasChecked = false;
    p.hand = [];
  });
  next(table);
};

//TODO: deal hands after the blinds have been placed.
let nextCounter = 0;
const next = (table: Table) => {
  nextCounter += 1;
  const gameState = allGameStates.get(table.id);
  // console.log("NEXT", nextCounter, "position", gameState.activePosition);
  const players = table.players;
  const stage = gameState.stage;
  let player = players.find((p) => p.position === gameState.activePosition);

  let remainingPlayers = players.filter((p) => !p.folded);
  if (remainingPlayers.length === 1) {
    handleWinnings(table, gameState);
  }
  console.log(
    "NEXT",
    nextCounter,
    "position",
    gameState.activePosition,
    "player",
    player?.username,
    "player.position",
    player?.position,
    "stage",
    stage,
  );
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
        table.communityCards = gameState.hands.flop;
        break;
      case "flop":
        gameState.stage = "turn";
        table.communityCards.push(gameState.hands.turn);
        break;
      case "turn":
        gameState.stage = "river";
        table.communityCards.push(gameState.hands.river);
        break;
      case "river":
        gameState.stage = "showdown";
        break;
      default:
        gameState.stage = "preflop";
    }

    if (gameState.stage === "showdown") {
      handleWinnings(table, gameState);
      return;
    }

    populateHands(table.id, players, gameState.stage);
    next(table);
    return;
  }

  if (
    player?.bets[stage] !== 0 &&
    player?.bets[stage] === gameState.highestBets[stage]
  ) {
    gameState.activePosition += 1;
    //maybe remove username here to see what happens. preferably after automating the tests
    next(table);
    return;
  }

  //probably remove it since there's a semi duplicate below
  if (!player) {
    gameState.activePosition = 0;
    player = players.find((p) => p.position === gameState.activePosition);
  }
  if (gameState.newGame) {
    determinePositions(players, gameState);
    populateHands(table.id, players);

    // players.forEach((p) => {
    //   console.log("PLAYER", p.username, "position", p.position);
    // });
  }
  if (!player) {
    player = players.find((p) => p.position === gameState.activePosition);
  }
  if (
    player.role === "smallBlind" && gameState.activePosition === 0 &&
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
    player.role === "bigBlind" && gameState.activePosition === 1 &&
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
    promptBet(table, player.username);
    return;
  }
  return;
};

const askTOBet = (
  table: Table,
  username: string,
  optionalActions?: string[],
) => {
  const players = table.players;
  const player = players.find((p) => p.username === username);
  const gameState = allGameStates.get(table.id);
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

const promptBet = (table: Table, username: string) => {
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

interface BetInput {
  table: Table;
  player: Player;
  action?: string;
  betAmount: number;
  stage: string;
}

const takeAction = (input: BetInput) => {
  const { table, player, action, betAmount, stage } = input;

  const isAllIn = betAmount >= player.chips;
  const bet = isAllIn ? player.chips : betAmount;

  const gameState = allGameStates.get(table.id);
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

const placeBet = (
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

//maybe add a parameter to dealNew
const populateHands = (
  tableID: number,
  players: Player[],
  stage: string = null,
) => {
  let gameState = allGameStates.get(tableID);
  let tableHands = gameState.hands;
  // also run if the game has ended, for next round
  if (!tableHands || gameState.newGame) {
    const results = dealCards(tableID, players.length);
    gameState.hands = results;
  }
  const currentCards = gameState.hands;
  const handsCopy = [...currentCards.hands];
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

const determinePositions = (players: Player[], state: GameState) => {
  players.forEach((player, i) => {
    //maybe add seat attribute to player
    if (player.position !== undefined) {
      // return player;
    } else {
      player.position = i;
    }
    if (state.nextRound === true) {
      console.log("NEXT ROUND");
      player.position += 1;
      if (player.position >= players.length) {
        player.position = 0;
      }
    }

    if (player.position === players.length - 1) {
      player.isDealer = true;
    } else {
      player.isDealer = undefined;
    }
    switch (player.position) {
      case 0:
        player.role = "smallBlind";
        break;
      case 1:
        player.role = "bigBlind";
        break;
      default:
        player.role = undefined;
        break;
    }
    console.log(
      "player",
      player.username,
      "position",
      player.position,
      "role",
      player.role,
      "isDealer",
      player.isDealer,
    );
    return player;
  });
  state.newGame = false;
  state.nextRound = false;
  return players;
};

const stack = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

const names = [
  "Duce",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Jack",
  "Queen",
  "King",
  "Ace",
];

function shuffle(array: any[]): Card[] {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

const spadeStack = stack.map((
  card,
  i,
  //POTENTIALLY set rank as i + 2
) => ["S" + card, { rank: i + 1, name: names[i], suit: "Spades" }]);
const heartStack = stack.map((
  card,
  i,
) => ["H" + card, { rank: i + 1, name: names[i], suit: "Hearts" }]);
const diamondStack = stack.map((
  card,
  i,
) => ["D" + card, { rank: i + 1, name: names[i], suit: "Diamonds" }]);
const clubStack = stack.map((
  card,
  i,
) => ["C" + card, { rank: i + 1, name: names[i], suit: "Clubs" }]);

const deck = [...spadeStack].concat([...heartStack]).concat([...diamondStack])
  .concat([
    ...clubStack,
  ]);

export const dealCards = (tableID, players = 2) => {
  console.log("DEALING FOR", tableID, players);
  if (players < 2) {
    throw new Error("You need at least 2 players to play");
  }
  if (players > 10) {
    throw new Error("You can't play with more than 10 players");
  }
  const shuffledDeck: Card[] = shuffle(deck);
  const results = {
    hands: shuffledDeck.slice(0, players * 2),
    //to be deprecated
    communityCards: shuffledDeck.slice(players * 2, players * 2 + 5),
    flop: shuffledDeck.slice(players * 2, players * 2 + 3),
    turn: shuffledDeck[players * 2 + 3],
    river: shuffledDeck[players * 2 + 4],
  };
  return results;
};
