import { Application, Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { handleJoinTable } from "./api/handleJoinTable.ts";
import { handleCreateTable } from "./api/handleCreateTable.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { handleTables } from "./api/handleTables.ts";
import { handleTable } from "./api/handleTable.ts";

export const app = new Application();
const router = new Router();
const port = 8080;
const serverTables = new Map();
// const allUsers = new Map();

router.get("/tables/create", handleCreateTable);
router.get("/tables/join/:tableID", handleJoinTable);
// router.get("/tables", handleCreateTable);
router.get("/tables", handleTables);
router.get("/tables/:tableID", handleTable);
router.get("/test", (ctx) => {
  ctx.response.body = "Hello World TESTING!";
});
//router.get("/users/", handleJoinTable);
//router.get("/users/userID", handleJoinTable);
// handle table info, returns info about table. table info can be stored as a
// separate key in redis

// Logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.headers.get("X-Response-Time");
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

// Timing
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

// table listener, probably authenticator
app.use(async (ctx, next) => {
  ctx.state.tables = serverTables;

  //generate initial tables
  await next();
});

app.use(oakCors());

app.use(router.routes());
app.use(router.allowedMethods());

app.use((ctx) => {
  ctx.response.body = JSON.stringify("ENDPOINT NOT FOUND");
});

console.log("Listening at http://localhost:" + port);
await app.listen({ port });
