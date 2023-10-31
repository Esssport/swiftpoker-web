//move send and broadcast to utils
import { broadcast, send } from "../api/handleJoinTable.ts";
import { Card, Player, Table } from "../data_types.ts";
const allGameStates = new Map<
  number,
  {
    activePosition: number;
    stage: string;
    hands: { hands: Card[]; flop: Card[]; turn: Card; river: Card };
    gameStarted: boolean;
    newGame: boolean;
    smallBlindPlayed: boolean;
    bigBlindPlayed: boolean;
    promptingFor: string;
    highestBets: { preflop: number; flop: number; turn: number; river: number };
  }
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

  next(table, username);
  if (!player) {
    console.log("NO PLAYER");
    return;
  }
  player.socket.onmessage = (m) => {
    const data = JSON.parse(m.data);
    const gameState = allGameStates.get(table.id);
    console.log("msg in server: ", data);
    switch (data.event) {
      case "action-taken":
        if (data.username !== username) {
          console.log("NOT YOUR TURN", data.username, username);
          return;
        }
        takeAction({
          table,
          player,
          role: data.role,
          action: data.payload.action,
          betAmount: data.payload.betAmount,
          stage: gameState.stage,
        });
        break;
    }
  };
};

const next = (table: Table, username?: string) => {
  const gameState = allGameStates.get(table.id);
  const players = table.players;
  const stage = gameState.stage;
  let player = players.find((p) => p.position === gameState.activePosition);

  let remainingPlayers = players.filter((p) => !p.folded);
  if (remainingPlayers.length === 1) {
    console.log("THE WINNER IS ", remainingPlayers[0].username);
    gameState.smallBlindPlayed = false;
    gameState.bigBlindPlayed = false;
    return;
  }

  if (
    player?.bets[stage] !== 0 &&
    player?.bets[stage] === gameState.highestBets[stage]
  ) {
    gameState.activePosition = gameState.activePosition + 1;
    //maybe remove username here to see what happens. preferably after automating the tests
    next(table, username);
    return;
  }

  //check for bets to be matched
  if (gameState.activePosition > players.length - 1) {
    console.log("STAGE", stage);
    const unmatchedBets = players.filter((p) => {
      return p.bets[stage] < gameState.highestBets[stage];
    });

    if (unmatchedBets.length > 0) {
      gameState.activePosition = unmatchedBets[0].position;
      next(table, username);
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
    next(table, username);
    return;
  }

  if (!player) {
    gameState.activePosition = 0;
    player = players.find((p) => p.position === gameState.activePosition);
  }
  if (!username) username = player.username;

  if (gameState.newGame = true) {
    gameState.newGame = false;
    populateHands(table.id, players);
    determinePositions(players);
    if (!player) {
      console.log("NEWGAME activePosition", gameState.activePosition);
      player = players.find((p) => p.position === gameState.activePosition);
    }
    if (
      player.position === 0 && gameState.activePosition === 0 &&
      !gameState.smallBlindPlayed
    ) {
      takeAction({
        table,
        player,
        role: "blind",
        betAmount: table.blinds.small,
        stage,
      });
      gameState.smallBlindPlayed = true;
      return;
    }
    if (
      player.position === 1 && gameState.activePosition === 1 &&
      !gameState.bigBlindPlayed
    ) {
      console.log("BIG BLIND WAS SET");
      takeAction({
        table,
        player,
        role: "blind",
        action: "bet",
        betAmount: table.blinds.big,
        stage,
      });
      gameState.bigBlindPlayed = true;
      return;
    }
  }

  if (
    gameState.activePosition <= players.length && player.username === username
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
  //

  //in showdown when lost [you lost don't show/muck, show]
  //in showdown when won [you won don't show, show]

  // TODO: when somebody all ins, anything that surpluses need to be returned to the user

  const betPrompt = {
    event: "action-prompt",
    payload: {
      waitingFor: gameState.activePosition,
      blinds: table.blinds,
      chips: player.chips,
      actions,
      prompt: username + " Place your bet",
    },
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
      payload: {
        waitingFor: gameState.activePosition,
        currentBet: p.currentBet > 0 ? p.currentBet : null,
        blinds: table.blinds,
        chips: p.chips,
        secondaryActions,
        table,
        highestBet: gameState.highestBets[gameState.stage],
        prompt: "Waiting for " + username,
      },
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
  role?: string;
  betAmount: number;
  stage: string;
}

const takeAction = (input: BetInput) => {
  const { table, player, action, betAmount, stage, role } = input;

  const isAllIn = betAmount >= player.chips;
  const bet = isAllIn ? player.chips : betAmount;

  const gameState = allGameStates.get(table.id);
  const isBlind = role === "blind";
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
  }

  if (action === "fold") {
    player.folded = true;
    gameState.activePosition += 1;
    gameState.promptingFor = null;
    next(table);
    return;
  }

  if (action === "check") {
    if (table.firstBets[stage] === 0) {
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

  console.log("Stage is", stage);
  player.currentBet = bet;
  player.bets[stage] = bet;
  player.chips -= bet;
  table.pot += bet;
  player.currentBet = player.currentBet + bet;

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
