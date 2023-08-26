const connectedClients = new Map();
import { Table } from "../data_types.ts";
import { redisClient } from "../utils/getRedis.ts";

export const handleJoinTable = async (ctx) => {
  const tables = new Map(JSON.parse(await redisClient.hget("tables", "cash")));
  const socket: WebSocket = ctx.upgrade();

  const username = ctx.request.url.searchParams.get("username");
  const tableID = ctx.params.tableID;

  socket.onopen = async (ctx) => {
    if (!tableID || !tables?.has(Number(tableID))) {
      socket.close(
        1008,
        `CONNECTION CLOSED for invalid tableID `,
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
      JSON.parse(await redisClient.hget("clients", "online")),
    ) || connectedClients;
    //TODO: remove duplicate code
    connectedClients.set(username, socket);
    clients.set(username, socket);
    //FIXME: this is not working, not storing socket info, only the usrnames are stored
    redisClient.hset("clients", "online", JSON.stringify(Array.from(clients)));
    console.log("clients", clients);
    console.log(`New player ${username} connected to table ${tableID}`);

    //update tables
    currentTable.players.push(username);
    tables.set(Number(tableID), currentTable);
    const tablesArray = Array.from(tables);
    redisClient.hset("tables", "cash", JSON.stringify(tablesArray));

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
        table[username] = { buyIn: data.payload };
        redisClient.hset("tables", tableID, JSON.stringify(table));

        socket.send(
          JSON.stringify({
            event: "table-updated",
            payload: {
              tables: Array.from(tables),
              table: table,
              prompt: { action: "to do what?" },
            },
          }),
        );
        break;
    }

    //TODO: check the username is not taken and is not empty (only on login, not on join table)
    // if (!username || connectedClients.has(username)) {
    //   socket.close(1008, `CONNECTION CLOSED, Username taken or missing`);
    //   console.log("CONNECTION CLOSED, Username taken or missing");
    //   return;
    // }

    console.log("message", data);
  };
  socket.onclose = async () => {
    // TODO: withdraw nano to socket's wallet
    console.log(
      `Client ${username || "is"} disconnected from table ${tableID}`,
    );
    connectedClients.delete(username);
    const clients = new Map(
      JSON.parse(await redisClient.hget("clients", "online")),
    );
    clients.delete(username);
    redisClient.hset("clients", "online", JSON.stringify(Array.from(clients)));
  };
};
