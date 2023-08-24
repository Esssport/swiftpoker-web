import { connect } from "https://deno.land/x/redis/mod.ts";

const port = `6379`;
const username = `alirezaizadjoo`;
let i = 0;
let interval = setInterval(async () => {
  console.log("Connecting to redis " + i);
  i++;
}, 1000);

// export const redisClient = createClient(port);

const redisClient = await connect({
  hostname: "127.0.0.1",
  port: port,
  username: username,
});
console.log(await redisClient.ping());

await redisClient.connect();
// catch((err) => {
//   console.log("redis failed to connect to " + port, err);
//   return err;
// }).then((res) => {
//   console.log("redis connected on port " + port, res);
// });
clearInterval(interval);
export { redisClient };
