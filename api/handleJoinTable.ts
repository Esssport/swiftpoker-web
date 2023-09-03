const connectedClients = new Map();
const sockets = new Map();
const tableIDs = new Map();

//TODO: use const table = new Map() and pass that around.
//TODO: refactor to use Table instead of tables

//have something like {username: tableID}
import { Table } from "../data_types.ts";
import { redisClient } from "../utils/getRedis.ts";
import { startGame } from "../utils/Dealer.ts";
//TODO: add proper types

const tablePlayers = new Map();

export const handleJoinTable = async (ctx) => {
  let interval;
  const tables = new Map(JSON.parse(await redisClient.hget("tables", "cash")));
  //FIXME: only create socket if the game has started. otherwise just add them to the table list
  const socket: WebSocket = await ctx.upgrade();

  const username = ctx.request.url.searchParams.get("username");
  const tableID = ctx.params.tableID;

  socket.onopen = async (ctx) => {
    if (!tableID || !tables?.has(Number(tableID))) {
      socket.close(
        1008,
        `CONNECTION CLOSED for invalid tableID ` + tableID,
      );
      console.log("CONNECTION CLOSED for invalid tableID");
      return;
    }
    const currentTable = tables.get(Number(tableID)) as Table;
    if (currentTable.players.includes(username)) {
      socket.close(1008, `CONNECTION CLOSED, Username already in table`);
      console.log("CONNECTION CLOSED, Username already in table");
      return;
    }
    if (currentTable.players.length >= currentTable.maxPlayers) {
      socket.close(1008, `CONNECTION CLOSED, Table is full`);
      console.log("CONNECTION CLOSED, Table is full");
      return;
    }
    const clients = new Map(
      JSON.parse(await redisClient.hget("clients", "atTable")),
    ) || connectedClients;

    //TODO: remove duplicate code
    connectedClients.set(username, socket);
    sockets.set(username, socket);
    tableIDs.set(username, tableID);
    if (!tablePlayers.has(tableID)) {
      tablePlayers.set(tableID, [{ username, socket }]);
    } else {
      const recentTable = tablePlayers.get(tableID);
      recentTable?.push({ username, socket });
      tablePlayers.set(tableID, recentTable);
    }
    // console.log("tablePlayerssssssss", tablePlayers);

    //call all sockets to update their tables

    clients.set(username, socket);

    broadcast(
      {
        event: "broadcast",
        prompt: { length: sockets.size, username, tableID },
      },
      tableID,
    );
    //FIXME: this is not working, not storing socket info, only the usrnames are stored
    redisClient.hset("clients", "atTable", JSON.stringify(Array.from(clients)));
    // console.log(`${username} connected to table ${tableID}`);

    //update tables TO BE REMOVED.
    currentTable.players.push(username);
    tables.set(Number(tableID), currentTable);
    const tablesArray = Array.from(tables);
    redisClient.hset("tables", "cash", JSON.stringify(tablesArray));

    //update table
    let hasReconnected = false;
    const table = JSON.parse(await redisClient.hget("tables", tableID));
    const updatedPlayers = table?.players?.map((p) => {
      if (p.disconnected === true && p.username === username) {
        const { disconnected, ...rest } = p;
        hasReconnected = true;
        return rest;
      }
      return p;
    });
    const updatedTable = { ...table, players: updatedPlayers };
    redisClient.hset("tables", tableID, JSON.stringify(updatedTable));
    let i = 0;

    broadcast({
      event: "table-updated",
      payload: {
        tables: Array.from(tables),
        table: updatedTable,
      },
      prompt: username + " joined table " + tableID,
    }, tableID);

    if (hasReconnected) {
      broadcast({
        event: "table-updated",
        payload: {
          tables: Array.from(tables),
          table: updatedTable,
        },
        prompt: username + " user returned to table " + tableID,
      }, tableID);
      return;
    }

    send(socket, {
      event: "table-joined",
      buyInRange: currentTable.buyInRange,
    });

    const interval = setInterval(() => {
      // TODO: maybe account for disconnected players.
      const allPlayers = tablePlayers.get(tableID);
      const table = tables.get(Number(tableID));
      console.log("In the interval", allPlayers);
      if (allPlayers.length >= 3) {
        clearInterval(interval);
        console.log("cleared interval");
        startGame(username, tableID, allPlayers, table);
      }
    }, 5000);
  };

  socket.onmessage = async (m) => {
    const data = JSON.parse(m.data);
    switch (data.event) {
      case "buy-in":
        const table = JSON.parse(await redisClient.hget("tables", tableID));
        table.players.push({ username, buyIn: data.payload });
        redisClient.hset("tables", tableID, JSON.stringify(table));
        broadcast({
          event: "table-updated",
          payload: {
            tables: Array.from(tables),
            table: table,
          },
          prompt: username + " bought in!",
        }, tableID);
        // console.log("table", table);
        break;
    }

    // 6475056596 pool cover

    //TODO: check the username is not taken and is not empty (only on login, not on join table)
    console.log("client message:", data);
  };

  socket.onclose = async () => {
    // TODO: withdraw nano to socket's wallet
    console.log(
      `Client ${username || "is"} disconnected from table ${tableID}`,
    );
    connectedClients.delete(username);
    sockets.delete(username);
    clearInterval(interval);

    //remove from tables
    const tables = new Map(
      JSON.parse(await redisClient.hget("tables", "cash")),
    );
    const currentTable = tables?.get(Number(tableID)) as Table;
    if (!currentTable) return;
    currentTable.players = currentTable?.players.filter((p) => p !== username);
    tables.set(Number(tableID), currentTable);
    const tablesArray = Array.from(tables);
    redisClient.hset("tables", "cash", JSON.stringify(tablesArray));

    // mark as disconnected on the table
    const table = JSON.parse(await redisClient.hget("tables", tableID));
    const updatedPlayers = table?.players?.map((p) => {
      if (p.username === username) {
        p.disconnected = true;
      }
      return p;
    }) || [];

    const updatedTable = { ...table, players: updatedPlayers };
    redisClient.hset("tables", tableID, JSON.stringify(updatedTable));

    // disabled because it accidentally removes from online list if user attempts to join the same table
    // const clients = new Map(
    //   JSON.parse(await redisClient.hget("clients", "online")),
    // );
    // clients.delete(username);
    // redisClient.hset("clients", "online", JSON.stringify(Array.from(clients)));
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
