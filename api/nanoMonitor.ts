// View other options of Public Nano Nodes: https://publicnodes.somenano.com
const WSS_SERVER = "wss://nanoslo.0x.no/websocket";

// Setup WebSocket
export const monitorAddress = (address) => {
  const socket = new WebSocket(WSS_SERVER);
  // Called when WebSocket is opened successfully
  socket.onopen = function () {
    console.log("WebSocket is now open");
    subscribeAddresses([
      address,
    ]);
  };
  // Called when WebSocket fails to open
  socket.onerror = function (e) {
    console.error("Unable to set up WebSocket");
    console.error(e);
  };
  // Called with each new inbound WebSocket message
  socket.onmessage = function (response) {
    let data = JSON.parse(response.data);

    console.log("dataaa", data);
  };
  // Action to subscribe to a particular address
  const subscribeAddresses = function (addresses) {
    let input = {
      action: "subscribe",
      topic: "confirmation",
      ack: true,
      options: {
        accounts: addresses,
      },
    };

    return socket.send(JSON.stringify(input));
  };
  // Action to send ping
  const ping = function () {
    let input = {
      action: "ping",
    };

    return socket.send(JSON.stringify(input));
  };
};
