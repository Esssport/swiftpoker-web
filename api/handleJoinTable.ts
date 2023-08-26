const connectedClients = new Map();
import { Table } from "../data_types.ts";
import { redisClient } from "../utils/getRedis.ts";

export const handleJoinTable = async (ctx) => {
  let interval;
  const tables = new Map(JSON.parse(await redisClient.hget("tables", "cash")));
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
    clients.set(username, socket);
    //FIXME: this is not working, not storing socket info, only the usrnames are stored
    redisClient.hset("clients", "atTable", JSON.stringify(Array.from(clients)));
    console.log(`${username} connected to table ${tableID}`);

    //update tables
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
    interval = setInterval(() => {
      socket.send(JSON.stringify({ event: "ping", payload: i }));
      i++;
    }, 1000);

    socket.send(
      JSON.stringify({
        event: "table-updated",
        payload: {
          tables: Array.from(tables),
          table: updatedTable,
        },
        prompt: username + " joined the table!",
      }),
    );

    if (hasReconnected) {
      socket.send(
        JSON.stringify({
          event: "table-updated",
          payload: {
            tables: Array.from(tables),
            table: updatedTable,
          },
          prompt: username + " user returned!",
        }),
      );
      return;
    }

    socket.send(
      JSON.stringify({
        event: "table-joined",
        buyInRange: currentTable.buyInRange,
      }),
    );
  };

  socket.onmessage = async (m) => {
    const data = JSON.parse(m.data);
    switch (data.event) {
      case "buy-in":
        const table = JSON.parse(await redisClient.hget("tables", tableID));
        table.players.push({ username, buyIn: data.payload });
        redisClient.hset("tables", tableID, JSON.stringify(table));
        socket.send(
          JSON.stringify({
            event: "table-updated",
            payload: {
              tables: Array.from(tables),
              table: table,
            },
            prompt: username + " bought in!",
          }),
        );
        break;
    }

    //TODO: check the username is not taken and is not empty (only on login, not on join table)

    console.log("message", data);
  };
  socket.onclose = async () => {
    // TODO: withdraw nano to socket's wallet
    console.log(
      `Client ${username || "is"} disconnected from table ${tableID}`,
    );
    connectedClients.delete(username);
    clearInterval(interval);

    //remove from tables
    const tables = new Map(
      JSON.parse(await redisClient.hget("tables", "cash")),
    );
    const currentTable = tables.get(Number(tableID)) as Table;
    currentTable.players = currentTable.players.filter((p) => p !== username);
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

//Bell customer service 18006670123
