import { Application, Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { handleJoinTable } from "./api/handleJoinTable.ts";
import { handleCreateTable } from "./api/handleCreateTable.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

const app = new Application();
const router = new Router();
const port = 8080;

router.get("/create_table", handleCreateTable);
router.get("/join_table/:tableID", handleJoinTable);

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

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

app.use((ctx) => {
  ctx.response.body = JSON.stringify("ENDPOINT NOT FOUND");
});

console.log("Listening at http://localhost:" + port);
await app.listen({ port });
