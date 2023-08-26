import { redisClient } from "../utils/getRedis.ts";

let tables = new Map();
//FIXME: tableNumber could start from 1 to avoid all the + 1 in the way. .
let tableNumber = 0;
const previousTables = await redisClient.hget("tables", "cash");
if (!!previousTables) tables = new Map(JSON.parse(previousTables));

export const handleCreateTable = async (ctx) => {
  const limit = Number(ctx.request.url.searchParams.get("limit"));
  const limitValue = limit <= 10 && limit >= 2 ? limit : 10;

  let increased = false;
  while (tables.has(tableNumber + 1)) {
    tableNumber += 1;
  }
  console.log("tableNumber", tableNumber);
  tables.set(tableNumber + 1, {
    players: [],
    blinds: [10, 25],
    buyInRange: [100, 500],
    maxPlayers: limitValue,
  });

  const tableObj = {};
  redisClient.hset("tables", tableNumber + 1, JSON.stringify(tableObj));
  const tablesArray = Array.from(tables);

  ctx.response.body = tablesArray;
  redisClient.hset("tables", "cash", JSON.stringify(tablesArray));
};
