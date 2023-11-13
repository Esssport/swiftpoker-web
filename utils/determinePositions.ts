import { GameState, Player } from "../data_types.ts";

export const determinePositions = (players: Player[], state: GameState) => {
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
