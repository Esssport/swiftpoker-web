import { Component, createSignal, For, onCleanup, onMount } from "solid-js";
import { useParams } from "@solidjs/router";
import {
  Player as PlayerType,
  Table as TableType,
} from "../../../../utils/tableBlueprint.ts";
import "./Table.scss";

const [table, setTable] = createSignal<TableType>();
const [actions, setActions] = createSignal([]);
const [activeUser, setActiveUser] = createSignal("");
const [hands, setHands] = createSignal([]);
let userSocket: WebSocket;
let userID: string;
// const getTableData = (tableID) => {
//   const request = new Request(
//     `http://localhost:8080/tables/${tableID}`,
//     {
//       method: "GET",
//     },
//   );
//   fetchTableData(request);
//   interval = setInterval(() => {
//     fetchTableData(request);
//   }, 5000);
// };

const takeAction = (action: string) => () => {
  const betAmount = document.getElementById(
    "betAmount",
  ) as HTMLInputElement;
  const finalBetAmount = !!betAmount.value
    ? +betAmount.value
    : table().blinds.big;
  userSocket.send(
    JSON.stringify({
      event: "action-taken",
      payload: { betAmount: finalBetAmount, action },
    }),
  );
  console.log("action taken", action);
};

//TODO: Add cards and other information into localStorage if necessary to continue showing them if browser is refreshed

const joinTable = () => {
  const username = localStorage.getItem("username");
  const tableID = localStorage.getItem("tableID");
  const buyInAmount = localStorage.getItem("buyInAmount");

  userID = username;
  // // localStorage.removeItem("username");
  // localStorage.removeItem("tableID");
  // localStorage.removeItem("buyInAmount");

  //TODO: Add Try catch block
  const serverSocket = new WebSocket(
    `ws://localhost:8080/tables/join/${tableID}?username=${username}&buyInAmount=${buyInAmount}`,
  );
  userSocket = serverSocket;
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
      case "table-updated":
        setTable(data.payload.table);
        // setGameState(data.payload.gameState);
        setActiveUser(data.payload.waitingFor);
        // //TODO: interact with input field for bet amount, set limitations and default to big blind
        if (activeUser() !== userID) setActions([]);

        // //setSecondaryActions([]);
        if (data.actions) {
          setActions(data.actions);
          // const betAmount = Number(prompt(
          //   `bet between ${table.blinds.big} and ${data.payload.chips}`,
          // ));
        }

        if (data.secondaryAction) {
          //TODO
        }
        break;
      case "hands-updated":
        setHands(data.payload.hands);
        break;
    }
  };
};

// const fetchTableData = async (request) => {
//   fetch(request).then((response) => {
//     if (response.status !== 200) {
//       console.log("Table not found");
//       clearInterval(interval);
//       return;
//     }
//     response.json().then((data) => {
//       console.log("message", data);
//       setTable(data);
//     }).catch((err) => console.log(err));
//   })
//     .catch((err) => console.log(err));
// };

//TODO: get table info
//TODO: add a For element and loop over all the players and pass them to <Player /> component
export const Table: Component = () => {
  const params = useParams();
  // const tableID = params.tableID;

  onMount(() => {
    // getTableData(tableID);
    //run joinTable if redirected from lobby, otherwise join if user clicks on join button
    joinTable();
  });

  onCleanup(() => {
    if (userSocket) userSocket.close();
  });
  return (
    <section class="table">
      {JSON.stringify(hands())}
      <div class="md:w-2/3">
        <h1></h1>
        <div class="md:w-2/3">
          <input
            class="max-w-sm bg-green-900 appearance-none border-2 border-gray-500 rounded w-full py-2 px-4 text-gray-200 leading-tight focus:outline-none focus:bg-black focus:border-purple-500"
            id="betAmount"
            type="number"
            value="25"
          />
        </div>
        <For each={actions()} fallback={<div>Loading actions...</div>}>
          {/* TODO: Add attributes for bet amount */}
          {(action) => (
            <button
              class="bg-blue hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
              onClick={takeAction(action)}
            >
              {action}
            </button>
          )}
        </For>
      </div>
      <For each={table()?.players}>
        {(player) => <Player player={player} />}
      </For>

      {}
      <div>Table ID: {table()?.id}</div>
    </section>
  );
};

const Player = ({ player }: { player: PlayerType }) => {
  return (
    <div class="player">
      {true
        ? (
          <div
            classList={{
              "player-image-section": true,
              active: activeUser() === player.username,
            }}
          >
            <br /> role: {player.role}
            {player.isDealer && (
              <>
                <br />dealer
              </>
            )}
            <div class="player-name">{player.username}</div>
            <div class="player-hand">
              {player.hand && player.hand[0][0]}
              <br />
              {player.hand && player.hand[1][0]}
            </div>
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
