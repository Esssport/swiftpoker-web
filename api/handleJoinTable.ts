export const sockets = new Map<string, WebSocket>();
export const tableIDs = new Map();
import { Player, PlayerInterface, Table } from "../utils/tableBlueprint.ts";
import { broadcast } from "./broadcast.ts";

export const handleJoinTable = async (ctx) => {
  //FIXME: only create socket if the game has started. otherwise just add them to the table list
  const serverTables = ctx.state.tables as Map<
    number,
    Table
  >;
  const tableID = Number(ctx.params.tableID) as number;
  const username = ctx.request.url.searchParams.get("username") as string;
  const buyInAmount = Number(ctx.request.url.searchParams.get(
    "buyInAmount",
  )) as number;

  const socket: WebSocket = await ctx.upgrade();

  // const username = ctx.request.url.searchParams.get("username") as string;
  // const tableID = Number(ctx.params.tableID) as number;

  //TODO: Refactor the error handling and input params to happen before socket is opened
  const currentTable = serverTables.get(tableID);
  socket.onopen = async (ctx) => {
    if (!tableID || !currentTable) {
      socket.close(
        1008,
        `CONNECTION CLOSED for invalid tableID ` + tableID,
      );
      console.log("CONNECTION CLOSED for invalid tableID");
      return;
    }

    if (currentTable.players.find((player) => player.username === username)) {
      socket.close(1008, `CONNECTION CLOSED, Username already in table`);
      console.log("CONNECTION CLOSED, Username already in table");
      return;
    }
    if (currentTable.players.length >= currentTable.maxPlayers) {
      socket.close(1008, `CONNECTION CLOSED, Table is full`);
      console.log("CONNECTION CLOSED, Table is full");
      return;
    }

    sockets.set(username, socket);
    tableIDs.set(username, tableID);
    const currentPlayers = currentTable.players;

    const playerObj: PlayerInterface = {
      username,
      socket,
      chips: buyInAmount,
    };
    const newPlayer = new Player(playerObj);

    if (!currentPlayers.find((player) => player.username === username)) {
      currentTable.addPlayer(newPlayer);
    }

    broadcast({
      event: "table-updated",
      payload: {
        //mask gameState sensitive values, or make them private attributes
        table: currentTable,
      },
      prompt: username + " joined table " + tableID,
    }, tableID);
    //   TODO: consider disconnected players.
    if (currentPlayers.length >= currentTable.minPlayers) {
      currentTable.startGame();
    }
  };

  socket.onclose = async () => {
    // mark as disconnected on the table
    console.log(
      `Client ${username || "is"} disconnected from table ${tableID}`,
    );
    sockets.delete(username);
    tableIDs.delete(username);

    if (!currentTable) return;
    currentTable.players = currentTable?.players.filter((p) =>
      p.username !== username
    );
  };
};
