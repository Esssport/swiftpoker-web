const sockets = new Map<string, WebSocket>();
const tableIDs = new Map();
import { Player, Table } from "../data_types.ts";
import { startGame } from "../utils/Dealer.ts";

export const handleJoinTable = async (ctx) => {
  let interval;
  //FIXME: only create socket if the game has started. otherwise just add them to the table list
  const serverTables = ctx.state.tables as Map<
    number,
    Table
  >;
  const socket: WebSocket = await ctx.upgrade();

  const username = ctx.request.url.searchParams.get("username") as string;
  const tableID = Number(ctx.params.tableID) as number;

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
    const currentPlayers = serverTables.get(tableID).players;

    const playerObj: Player = {
      username,
      socket,
    };

    if (!currentPlayers.find((player) => player.username === username)) {
      currentPlayers.push(playerObj);
    }

    broadcast({
      event: "table-updated",
      payload: {
        tables: Array.from(serverTables),
        table: currentTable,
      },
      prompt: username + " joined table " + tableID,
    }, tableID);

    send(socket, {
      event: "table-joined",
      buyInRange: currentTable.buyInRange,
    });

    const interval = setInterval(() => {
      // TODO: maybe consider disconnected players.
      const table = serverTables.get(tableID);
      if (currentPlayers.length >= 3) {
        clearInterval(interval);
        console.log("cleared interval");
        startGame(username, tableID, currentTable);
      }
    }, 5000);
  };

  socket.onmessage = async (m) => {
    const data = JSON.parse(m.data);
    const currentPlayers = serverTables.get(tableID).players;
    const currentPlayer = currentPlayers.find((p) => p.username === username);
    switch (data.event) {
      case "buy-in":
        currentPlayer.chips = data.payload;
        currentPlayer.buyIn = data.payload;

        broadcast({
          event: "table-updated",
          payload: {
            table: currentTable,
          },
          prompt: username + " bought in!",
        }, tableID);
        break;
    }

    // 6475056596 pool cover

    //TODO: check the username is not taken and is not empty (only on login, not on join table)
    console.log("client message:", data);
  };

  socket.onclose = async () => {
    // TODO: withdraw nano to socket's wallet
    // mark as disconnected on the table
    console.log(
      `Client ${username || "is"} disconnected from table ${tableID}`,
    );
    sockets.delete(username);
    tableIDs.delete(username);
    clearInterval(interval);

    if (!currentTable) return;
    currentTable.players = currentTable?.players.filter((p) =>
      p.username !== username
    );
  };
};

// send a message to all connected clients
export const broadcast = (message, tableID = null) => {
  sockets.forEach(
    (socket, username) => {
      if (!tableID) {
        socket.send(
          JSON.stringify(message),
        );
      }
      if (tableID && tableIDs.get(username) === tableID) {
        socket.send(
          JSON.stringify(message),
        );
      }
    },
  );
};

export const send = (socket, message) => {
  // console.log("IN SEND", message);
  socket.send(
    JSON.stringify(message),
  );
};

//Bell customer service 18006670123
