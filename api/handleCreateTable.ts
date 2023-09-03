import { Table } from "../data_types.ts";
import { redisClient } from "../utils/getRedis.ts";

let tables = new Map();
let tableNumber = 0;
const previousTables = await redisClient.hget("tables", "cash");
if (!!previousTables) tables = new Map(JSON.parse(previousTables));

export const handleCreateTable = async (ctx) => {
  const limit = Number(ctx.request.url.searchParams.get("limit"));
  const limitValue = limit <= 10 && limit >= 2 ? limit : 10;

  // TODO: Remove reliance on tables map
  do {
    tableNumber += 1;
  } while (tables.has(tableNumber));

  tables.set(tableNumber, {
    players: [],
    blinds: [10, 25],
    buyInRange: [100, 500],
    maxPlayers: limitValue,
  });

  const tableObj: Table = {
    id: tableNumber,
    players: [],
    blinds: { small: 10, big: 25 },
    buyInRange: { min: 100, max: 500 },
    maxPlayers: limitValue,
    type: "cash",
  };
  redisClient.hset("tables", tableNumber, JSON.stringify(tableObj));
  const tablesArray = Array.from(tables);

  ctx.response.body = tablesArray;
  redisClient.hset("tables", "cash", JSON.stringify(tablesArray));
};
