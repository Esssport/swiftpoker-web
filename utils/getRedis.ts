import { connect, RedisClient } from "https://deno.land/x/redis/mod.ts";

const port = `6379`;
const username = `alirezaizadjoo`;
let i = 0;
let interval = setInterval(async () => {
  console.log("Connecting to redis " + i);
  i++;
}, 1000);

const redisClient: RedisClient = await connect({
  hostname: "127.0.0.1",
  port: port,
  username: username,
})
  .catch((err) => {
    console.log("redis failed to connect to " + port, err);
    Deno.exit(1);
  });
console.log(
  await redisClient.ping() === "PONG"
    ? "redis connected on port " + port
    : "Something went wrong with redis",
);

clearInterval(interval);
export { redisClient };
