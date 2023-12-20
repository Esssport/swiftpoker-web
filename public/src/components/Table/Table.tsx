import { Component, createSignal, For, onCleanup, onMount } from "solid-js";
import { useParams } from "@solidjs/router";
import {
  Player as PlayerType,
  Table as TableType,
} from "../../../../data_types.ts";
import "./Table.scss";

const [table, setTable] = createSignal<TableType>();
const [players, setPlayers] = createSignal<PlayerType[]>([]);
let interval = null;
const getTableData = (tableID) => {
  const request = new Request(
    `http://localhost:8080/tables/${tableID}`,
    {
      method: "GET",
    },
  );
  fetchTableData(request);
  interval = setInterval(() => {
    fetchTableData(request);
  }, 5000);
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
    switch (data.event) {
      case "table-updated":
        setTable(data.payload.table);
        console.log("data", data);
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
      {JSON.stringify(table()?.players)}
      <For each={table()?.players}>
        {(player) => <Player player={player} />}
      </For>

      {}
      <div>Table ID: {table()?.id}</div>
    </section>
  );
};

const Player = ({ player }) => {
  return (
    <div class="player">
      {true
        ? (
          <div class="player-image-section">
            <div class="player-name">{player.username}</div>
            <div class="player-hand">{player.hand}</div>
            <div class="player-chips">{player.chips}</div>
          </div>
        )
        : (
          <div class="player-image-section">
            <div class="player__name"></div>
            <div class="player__hand"></div>
            <div class="player__chips"></div>
          </div>
        )}
    </div>
  );
};
