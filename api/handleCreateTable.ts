import { Table } from "../data_types.ts";
import { redisClient } from "../utils/getRedis.ts";

let tables = new Map();
let tableNumber = 0;
const previousTables = await redisClient.hget("tables", "cash");
if (!!previousTables) tables = new Map(JSON.parse(previousTables));

export const handleCreateTable = async (ctx) => {
  const limit = Number(ctx.request.url.searchParams.get("limit"));
  const limitValue = limit <= 10 && limit >= 2 ? limit : 10;

  do {
    tableNumber += 1;
  } while (tables.has(tableNumber));

  // for (tableNumber; tables.has(tableNumber); tableNumber++) {

  // }
  tables.set(tableNumber, {
    players: [],
    blinds: [10, 25],
    buyInRange: [100, 500],
    maxPlayers: limitValue,
  });

  const tableObj: Table = {
    id: tableNumber,
    players: [],
    blinds: [10, 25],
    buyInRange: [100, 500],
    maxPlayers: limitValue,
  };
  redisClient.hset("tables", tableNumber, JSON.stringify(tableObj));
  const tablesArray = Array.from(tables);

  ctx.response.body = tablesArray;
  redisClient.hset("tables", "cash", JSON.stringify(tablesArray));
};
