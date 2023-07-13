import { Application, Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { dealCards } from "./utils/dealer.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

const connectedClients = new Map();
const app = new Application();
const router = new Router();
const tables = new Map();
const port = 8080;
let i = 0;

router.get("/create_table", async (ctx) => {
  const limit = Number(ctx.request.url.searchParams.get("limit"));
  const limitValue = limit <= 10 && limit >= 2 ? limit : 10;
  tables.set(i += 1, {
    players: [],
    blinds: [10, 25],
    maxPlayers: limitValue,
  });
  ctx.response.body = Array.from(tables);
});

router.get("/join_table/:tableID", async (ctx) => {
  const socket = await ctx.upgrade();
  const username = ctx.request.url.searchParams.get("username");
  const tableID = ctx.params.tableID;
  socket.onopen = () => {
    if (!tableID || !tables.has(Number(tableID))) {
      socket.close(
        1008,
        `CONNECTION CLOSED for invalid tableID `,
      );
      console.log("CONNECTION CLOSED for invalid tableID");
      return;
    }
    //TODO: check the username is not taken and is not empty (only on login, not on join table)
    // if (!username || connectedClients.has(username)) {
    //   socket.close(1008, `CONNECTION CLOSED, Username taken or missing`);
    //   console.log("CONNECTION CLOSED, Username taken or missing");
    //   return;
    // }
    socket.username = username;
    connectedClients.set(username, socket);
    const currentTable = tables.get(Number(tableID));
    console.log(`New client connected: ${username}`);
    //TODO: check the table limit and whether the user is already in the table
    if (currentTable.players.includes(username)) {
      socket.close(1008, `CONNECTION CLOSED, Username already in table`);
      console.log("CONNECTION CLOSED, Username already in table");
      return;
    }
    if (currentTable.players.length >= currentTable.maxPlayers) {
      socket.close(1008, `CONNECTION CLOSED, Table is full`);
      console.log("CONNECTION CLOSED, Table is full");
      return;
    }

    currentTable.players.push(username);

    socket.send(JSON.stringify(Array.from(tables)));
  };
  socket.onclose = () => {
    // TODO: withdraw nano to socket's wallet
    console.log(`Client ${username || "is"} disconnected`);
    connectedClients.delete(username);
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

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

app.use((ctx) => {
  ctx.response.body = JSON.stringify("ENDPOINT NOT FOUND");
});

console.log("Listening at http://localhost:" + port);
await app.listen({ port });

//   socket.onopen = () => {
//     socket.send(JSON.stringify(dealCards(2)));

//   // broadcast new message if someone sent one
//   // socket.onmessage = (m) => {
//   //   const data = JSON.parse(m.data);
//   //   switch (data.event) {
//   //     case "send-message":
//   //       broadcast(
//   //         JSON.stringify({
//   //           event: "send-message",
//   //           username: socket.username,
//   //           message: data.message,
//   //         }),
//   //       );
//   //       break;
//   //   }
//   // };

// // TODO: index.html acts like a 404 page (probably)
// app.use(async (context) => {
//   await context.send({
//     root: `${Deno.cwd()}/`,
//     index: "./index.html",
//   });
// });

// Hello World!

// // send updated users list to all connected clients
// function broadcastUsernames() {
//   const usernames = [...connectedClients.keys()];
//   console.log(
//     "Sending updateddd username list to all clients: " +
//       JSON.stringify(usernames),
//   );
//   broadcast(
//     JSON.stringify({
//       event: "update-users",
//       usernames,
//     }),
//   );
// }
