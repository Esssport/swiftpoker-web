import { redisClient } from "../utils/getRedis.ts";

let table = new Map();

export const handleTable = async (ctx) => {
  const id = ctx.params.id || 1;
  const previousTable = await redisClient.hget("tables", id);
  console.log("previousTable", previousTable);
  return ctx.response.body = previousTable || {};
};
