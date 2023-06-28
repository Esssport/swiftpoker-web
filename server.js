import { Application, Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { dealer } from "./utils/dealer.ts";

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

// router.get("/deal", async (ctx) => {
//   const socket = await ctx.upgrade();
//   socket.onopen = () => {
//     console.log("DEALER", dealer());
//   };
// });

router.get("/start_web_socket", async (ctx) => {
  const socket = await ctx.upgrade();
  console.log("SOCKET info", socket);
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
    socket.send(JSON.stringify(dealer()));
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
    console.log("DATA", data);
  };
});

app.use(router.routes());
app.use(router.allowedMethods());
// TODO: index.html acts like a 404 page (probably)
app.use(async (context) => {
  await context.send({
    root: `${Deno.cwd()}/`,
    index: "./index.html",
  });
});

console.log("Listening at http://localhost:" + port);
await app.listen({ port });
