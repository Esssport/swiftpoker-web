import { Application, Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { dealCardsTo } from "./utils/dealer.ts";

const connectedClients = new Map();

const app = new Application();
const port = 8080;
const router = new Router();

// send a message to all connected clients
function broadcast(message) {
  for (const client of connectedClients.values()) {
    client.send(message);
  }
}

// send updated users list to all connected clients
function broadcastUsernames() {
  const usernames = [...connectedClients.keys()];
  console.log(
    "Sending updateddd username list to all clients: " +
      JSON.stringify(usernames),
  );
  broadcast(
    JSON.stringify({
      event: "update-users",
      usernames,
    }),
  );
}

router.get("/create_table", async (ctx) => {
  const socket = await ctx.upgrade();
  const username = ctx.request.url.searchParams.get("table_id");
});

router.get("/start_web_socket", async (ctx) => {
  ctx.mat;
  const socket = await ctx.upgrade();
  const username = ctx.request.url.searchParams.get("username");
  if (connectedClients.has(username)) {
    socket.close(1008, `Username ${username} is already taken`);
    return;
  }
  socket.username = username;

  connectedClients.set(username, socket);
  console.log(`New client connected: ${username}`);

  // broadcast the active users list when a new user logs in
  socket.onopen = () => {
    socket.send(JSON.stringify(dealCardsTo(2)));
    // broadcastUsernames();
  };

  // when a client disconnects, remove them from the connected clients list
  // and broadcast the active users list
  socket.onclose = () => {
    // TODO: withdraw nano to socket's wallet
    console.log(`Client ${socket.username} disconnected`);
    connectedClients.delete(socket.username);
    // broadcastUsernames();
  };

  // broadcast new message if someone sent one
  // socket.onmessage = (m) => {
  //   const data = JSON.parse(m.data);
  //   switch (data.event) {
  //     case "send-message":
  //       broadcast(
  //         JSON.stringify({
  //           event: "send-message",
  //           username: socket.username,
  //           message: data.message,
  //         }),
  //       );
  //       break;
  //   }
  // };
  socket.onmessage = (m) => {
    const data = JSON.parse(m.data);
    console.log("AAAAAAA", data);
  };
});
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

app.use(router.routes());
app.use(router.allowedMethods());
// // TODO: index.html acts like a 404 page (probably)
// app.use(async (context) => {
//   await context.send({
//     root: `${Deno.cwd()}/`,
//     index: "./index.html",
//   });
// });

// Hello World!
app.use((ctx) => {
  ctx.response.body = "Hello World!";
});

console.log("Listening at http://localhost:" + port);
await app.listen({ port });
