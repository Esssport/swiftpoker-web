import { Component, createSignal, onCleanup, onMount } from "solid-js";
import { useParams } from "@solidjs/router";
import { Table as TableType } from "../../../../data_types.ts";
import "./Table.scss";

const [table, setTable] = createSignal<TableType>();
let interval = null;
const getTableData = (tableID) => {
  const request = new Request(
    `http://localhost:8080/tables/${tableID}`,
    {
      method: "GET",
    },
  );
  fetchTableData(request);
  // interval = setInterval(() => {
  //   fetchTableData(request);
  // }, 5000);
};

const joinTable = () => {
  const username = localStorage.getItem("username");
  const tableID = localStorage.getItem("tableID");
  const buyInAmount = localStorage.getItem("buyInAmount");

  // localStorage.removeItem("username");
  localStorage.removeItem("tableID");
  localStorage.removeItem("buyInAmount");

  //TODO: Add Try catch block
  const serverSocket = new WebSocket(
    `ws://localhost:8080/tables/join/${tableID}?username=${username}&buyInAmount=${buyInAmount}`,
  );
  // userSocket = serverSocket;
  serverSocket.onerror = (e) => {
    console.log("ERROR", e);
  };
  serverSocket.onclose = (e) => {
    console.log(username, e.reason);
  };
  serverSocket.onopen = (ws) => {
    serverSocket.send(JSON.stringify("connected to table " + tableID));
  };
  // getTableData();
  serverSocket.onmessage = (m) => {
    const data = JSON.parse(m.data);
    if (!!data?.payload?.prompt) {
      // setPrompts(data.payload.prompt);
    }
    // if (data.payload?.table) setPlayers(data.payload.table.players);
    console.log("data", data);
    switch (data.event) {
      // case "table-joined":
      //   const buyInRange = data.buyInRange;
      //   //Prompt user to buy in within the range of the table
      //   const amount = Number(prompt(
      //     `Buy in between ${buyInRange.min} and ${buyInRange.max}`,
      //   ));
      //   const finalAmount = amount <= buyInRange.max && amount >= buyInRange.min
      //     ? amount
      //     : buyInRange.min;

      //   //TODO: pass in action
      //   serverSocket.send(
      //     JSON.stringify({ event: "buy-in", payload: finalAmount }),
      //   );
      //   break;
      case "table-updated":
        // setPlayers(data.payload.table.players);
        // setTable(data.payload.table);
        // setGameState(data.payload.gameState);
        // setActiveUser(data.payload.waitingFor);
        // //TODO: interact with input field for bet amount, set limitations and default to big blind
        // if (activeUser() !== userID) setActions([]);
        // //setSecondaryActions([]);
        // if (data.actions) {
        //   setActions(data.actions);
        //   // const betAmount = Number(prompt(
        //   //   `bet between ${table.blinds.big} and ${data.payload.chips}`,
        //   // ));
        // }

        if (data.secondaryAction) {
          //TODO
        }
        break;
    }
  };
};

const fetchTableData = async (request) => {
  fetch(request).then((response) => {
    if (response.status !== 200) {
      console.log("Table not found");
      clearInterval(interval);
      return;
    }
    response.json().then((data) => {
      console.log("message", data);
      setTable(data);
    }).catch((err) => console.log(err));
  })
    .catch((err) => console.log(err));
};

//TODO: get table info
//TODO: add a For element and loop over all the players and pass them to <Player /> component
export const Table: Component = () => {
  const params = useParams();
  const tableID = params.tableID;

  onMount(() => {
    getTableData(tableID);
    //run joinTable if redirected from lobby, otherwise join if user clicks on join button
    joinTable();
  });

  onCleanup(() => {
    clearInterval(interval);
  });
  return (
    <section class="table">
      <Player />

      <Player />
      <Player />
      <Player />
      <Player />
      <Player />

      <div>Table ID: {table()?.id}</div>
    </section>
  );
};

const Player = () => {
  return (
    <div class="player">
      {true
        ? (
          <button class="player-image-section">
            sit here
          </button>
        )
        : (
          <div>
            <div class="player__name"></div>
            <div class="player__hand"></div>
            <div class="player__chips"></div>
          </div>
        )}
    </div>
  );
};
