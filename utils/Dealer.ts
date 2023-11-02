//move send and broadcast to utils
import { broadcast, send } from "../api/handleJoinTable.ts";
import { Card, GameState, Player, Table } from "../data_types.ts";
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
      gameStarted: false,
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

//TODO: deal hands after the blinds have been placed.
let nextCounter = 0;
const next = (table: Table) => {
  nextCounter += 1;
  const gameState = allGameStates.get(table.id);
  console.log("NEXT", nextCounter, "position", gameState.activePosition);
  const players = table.players;
  const stage = gameState.stage;
  let player = players.find((p) => p.position === gameState.activePosition) ||
    players[0];

  let remainingPlayers = players.filter((p) => !p.folded);
  if (remainingPlayers.length === 1) {
    console.log("THE WINNER IS ", remainingPlayers[0].username);
    gameState.smallBlindPlayed = false;
    gameState.bigBlindPlayed = false;
    return;
  }

  //check for bets to be matched
  if (gameState.activePosition > players.length - 1) {
    console.log("STAGE", stage);
    const unmatchedBets = players.filter((p) => {
      return p.bets[stage] < gameState.highestBets[stage];
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
    //show next card

    if (gameState.stage === "showdown") {
      //showdown
      gameState.activePosition = 0; //reset to the person after the big blind
      // gameState.newGame = true;

      //TODO: determine winner
      console.log("THE WINNER IS ", player.username);
      gameState.smallBlindPlayed = false;
      gameState.bigBlindPlayed = false;
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

  if (!player) {
    gameState.activePosition = 0;
    player = players.find((p) => p.position === gameState.activePosition);
  }

  if (gameState.newGame === true) {
    gameState.newGame = false;
    populateHands(table.id, players);
    determinePositions(players);
  }
  if (!player) {
    console.log("NEWGAME activePosition", gameState.activePosition);
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
  let actions = [];
  if (table.firstBets[gameState.stage] === 0) {
    actions = ["check", "bet"];
  } else if (
    player.chips + player.currentBet >= gameState.highestBets[gameState.stage]
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
  if (gameState.promptingFor === username) return;
  //handle bets
  //TODO: Prompt any user who has not folded or isn't equal to the highest bet
  const players = table.players;
  const player = players.find((p) => p.position === gameState.activePosition);

  if (!player || player.username !== username) return;
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
    const deficitAmount = gameState.highestBets[stage] - player.bets[stage];
    placeBet(table, player, deficitAmount, gameState);
    return;
  }

  // available actions ["check", "bet", "fold", "call", "raise"];

  if (action === "bet") {
    if (!isValidBet && !isFirstBet && !isAllIn) {
    }
    // if (bet !== gameState.highestBets[stage]) {
    //   console.log("You can't call");
    //   askTOBet(table, player.username);
    //   return;
    // } else {
    //   player.hasCalled = true;
    //   gameState.activePosition += 1;
    //   gameState.promptingFor = null;
    //   next(table);
    //   return;
    // }
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
  player.currentBet = bet + player.bets[stage];
  player.bets[stage] = player.currentBet;
  player.chips -= bet;
  table.pot += bet;

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
    const bigBlindPlayer = table.players.find((p) => p.position === 1);
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
    gameState.gameStarted = true;
    gameState.newGame = false;
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

const determinePositions = (players: Player[], nextRound = false) => {
  return players.forEach((player, i) => {
    if (nextRound) {
      player.position = player.position + 1;
      if (player.position >= players.length - 1) {
        //TODO : check if this is correct
        player.position = 0;
      }
    }
    if (player.position !== undefined) {
      return player;
    } else {
      player.position = i;
    }
    switch (player.position) {
      case 0:
        player.role = "smallBlind";
        break;
      case 1:
        player.role = "bigBlind";
        break;
      default:
    }
    if (player.position === players.length - 1) {
      player.isDealer = true;
    }
    return player;
  });
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
