import { connect } from "https://deno.land/x/redis@v0.31.0/mod.ts";
const port = 18610;
let i = 0;
let interval = setInterval(async () => {
  console.log("Connecting to redis " + i);
  i++;
}, 1000);
export const redisClient = await connect({
  socket: {
    host: "redis-18610.c276.us-east-1-2.ec2.cloud.redislabs.com",
    port: port,
  },
}).catch((err) => {
  console.log("redis failed to connect to " + port, err);
  return err;
});
console.log("redis connected on port " + port);
clearInterval(interval);
