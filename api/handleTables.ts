import { redisClient } from "../utils/getRedis.ts";

let tables = new Map();

export const handleTables = async (ctx) => {
  const previousTables = await redisClient.hget("tables", "cash");
  return ctx.response.body = previousTables || [];
};
