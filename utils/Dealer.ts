//move send and broadcast to utils
import { GameState, Table } from "../data_types.ts";
import { next } from "./next.ts";
import { takeAction } from "./takeAction.ts";

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

  const player = players.find((p) => p.username === username);

  next(table);
  if (!player) {
    console.log("NO PLAYER");
    return;
  }
  players.forEach((player) => {
    player.socket.onmessage = (m) => {
      const data = JSON.parse(m.data);
      const gameState = table.GameState;
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
