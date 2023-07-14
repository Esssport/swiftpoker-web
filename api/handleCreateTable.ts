import { redisClient } from "../utils/getRedis.ts";

let tables = new Map();
let i = 0;
const previousTables = await redisClient.get("tables");
if (previousTables) tables = new Map(JSON.parse(previousTables));

export const handleCreateTable = async (ctx) => {
  const limit = Number(ctx.request.url.searchParams.get("limit"));
  const limitValue = limit <= 10 && limit >= 2 ? limit : 10;

  let increased = false;
  while (tables.has(i)) {
    i += 1;
    increased = true;
  }
  tables.set(increased ? i : i += 1, {
    players: [],
    blinds: [10, 25],
    buyInRange: [100, 500],
    maxPlayers: limitValue,
  });
  const tablesArray = Array.from(tables);

  ctx.response.body = tablesArray;
  redisClient.set("tables", JSON.stringify(tablesArray));
};
