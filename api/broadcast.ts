import { sockets, tableIDs } from "./handleJoinTable.ts";

// send a message to all connected clients

export const broadcast = (message, tableID = null) => {
  sockets.forEach(
    (socket, username) => {
      if (!tableID) {
        socket.send(
          JSON.stringify(message),
        );
      }
      if (tableID && tableIDs.get(username) === tableID) {
        socket.send(
          JSON.stringify(message),
        );
      }
    },
  );
};
export const send = (socket, message) => {
  console.log("SENDING event", message.event);
  socket.send(
    JSON.stringify(message),
  );
};
