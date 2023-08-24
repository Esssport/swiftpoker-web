const connectedClients = new Map();
import { Table } from "../data_types.ts";
import { redisClient } from "../utils/getRedis.ts";
const bankMap = new Map();
let tables = new Map();
const previousTables = await redisClient.get("tables");

export const handleJoinTable = async (ctx) => {
  const socket: WebSocket = ctx.upgrade();
  if (previousTables) tables = new Map(JSON.parse(previousTables));

  const username = ctx.request.url.searchParams.get("username");
  const tableID = ctx.params.tableID;
  socket.onopen = (ctx) => {
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
    //TODO: check the username is not taken and is not empty (only on login, not on join table)
    // if (!username || connectedClients.has(username)) {
    //   socket.close(1008, `CONNECTION CLOSED, Username taken or missing`);
    //   console.log("CONNECTION CLOSED, Username taken or missing");
    //   return;
    // }
    connectedClients.set(username, socket);
    console.log(`New player ${username} connected to table ${tableID}`);

    currentTable.players.push(username);
    console.log("previousTables", previousTables);
    tables.set(Number(tableID), currentTable);
    console.log("pushed", currentTable.players);
    const tablesArray = Array.from(tables);
    redisClient.set("tables", JSON.stringify(tablesArray));

    console.log("currentTable", currentTable);
    //TODO: send only the table created to the client
    socket.send(
      JSON.stringify({ event: "update-table", table: Array.from(tables) }),
    );
    socket.send(
      JSON.stringify({
        event: "buy-in",
        buyInRange: currentTable.buyInRange,
      }),
    );
  };
  socket.onmessage = (m) => {
    const data = JSON.parse(m.data);
    switch (data.event) {
      case "buy-in":
        const currentTable = tables.get(Number(tableID));
    }
    //TODO: Set the buy-in amount in redis
    // const tablesArray = Array.from(tables);
    // redisClient.set("tables", JSON.stringify(tablesArray));
    console.log("message", data);
  };
  socket.onclose = () => {
    // TODO: withdraw nano to socket's wallet
    console.log(
      `Client ${username || "is"} disconnected from table ${tableID}`,
    );
    connectedClients.delete(username);
  };
};
