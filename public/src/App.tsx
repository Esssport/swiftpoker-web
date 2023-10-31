import {
  type Component,
  createEffect,
  createSignal,
  For,
  onMount,
} from "solid-js";
// TODO: Add the ability to reconnect to a table after getting disconnected store in local storage or a cookie
let userSocket: WebSocket;
let userID: string;
let currenBet: number;
import type { Table } from "../../data_types.ts";
function joinTable() {
  const usernameElement = document.getElementById(
    "username",
  ) as HTMLInputElement;
  const tableID = document.getElementById("tableID") as HTMLInputElement;

  const username = usernameElement.value;
  userID = username;
  //TODO: Add Try catch block
  const serverSocket = new WebSocket(
    `ws://localhost:8080/tables/join/${tableID.value}?username=${username}`,
  );
  serverSocket.onerror = (e) => {
    console.log("ERROR", e);
  };
  serverSocket.onclose = (e) => {
    console.log(username, e.reason);
  };
  serverSocket.onopen = (ws) => {
    serverSocket.send(JSON.stringify("Hello from the client!"));
  };
  getTableData();
  serverSocket.onmessage = (m) => {
    const data = JSON.parse(m.data);
    if (!!data?.prompt) {
      setPrompts(data.prompt);
    }
    if (data.payload?.table) setTableData(data.payload.table);
    console.log("data", data);
    switch (data.event) {
      case "table-updated":
        setTableData(data.payload.table);
        setPlayers(data.payload.table.players);
        break;
      case "table-joined":
        const buyInRange = data.buyInRange;
        //Prompt user to buy in within the range of the table
        const amount = Number(prompt(
          `Buy in between ${buyInRange.min} and ${buyInRange.max}`,
        ));
        const finalAmount = amount <= buyInRange.max && amount >= buyInRange.min
          ? amount
          : buyInRange.min;

        //TODO: pass in action
        serverSocket.send(
          JSON.stringify({ event: "buy-in", payload: finalAmount }),
        );
        break;
      case "action-prompt":
        // if (!data.payload.yourTurn) {
        //   break;
        // }
        const payload = data.payload;
        //TODO: interact with input field for bet amount, set limitations and default to big blind
        //TODO: Add a button for each action
        const actions = payload.actions;
        console.log("payload", payload);
        console.log("actions", payload.actions);
        setActions(actions);
        const betAmount = Number(prompt(
          `bet between ${payload.blinds.big} and ${payload.chips}`,
        ));
        const finalBetAmount = !!betAmount ? betAmount : payload.blinds.big;
        currenBet = finalBetAmount;
        serverSocket.send(
          //TODO: include userID in payload potentially
          //console.log
          JSON.stringify({ event: "call", payload: finalBetAmount, username }),
        );
        setHandData(data.payload.hand);
        setFlop(data.payload.flop);
        break;
    }
  };
}

const takeAction = (action: string) => () => {
  userSocket.send(
    JSON.stringify({
      event: "action-taken",
      payload: { betAmount: currenBet, userID, action },
    }),
  );
};

function getTableData(tableID = 1) {
  fetch(`http://localhost:8080/tables/${tableID}`)
    .then((response) => {
      response.json().then((data) => {
        setTableData(data);
      });
    })
    .catch((err) => console.log(err));
}

function createTable() {
  const tableLimit = prompt("How many people can join this table?") || 10;
  const request = new Request(
    `http://localhost:8080/tables/create?limit=${tableLimit}`,
    {
      method: "GET",
    },
  );
  fetch(request).then((response) => {
    console.log("message", response);
    response.json().then((data) => {
      setTableData(data);
    });
  })
    .catch((err) => console.log(err));
}

const [tableData, setTableData] = createSignal({});
const [players, setPlayers] = createSignal([]);
const [prompts, setPrompts] = createSignal([]);
const [handData, setHandData] = createSignal([]);
const [flop, setFlop] = createSignal([]);
const [actions, setActions] = createSignal([]);

createEffect(() => {
  getTableData();
});

const Main: Component = () => {
  return (
    <>
      <div class="md:w-2/3">
        <input
          class="max-w-sm bg-gray-900 appearance-none border-2 border-gray-500 rounded w-full py-2 px-4 text-gray-200 leading-tight focus:outline-none focus:bg-black focus:border-purple-500"
          id="username"
          type="text"
          value="anonymous"
        />
      </div>
      <div class="md:w-2/3">
        <input
          class="max-w-sm bg-green-900 appearance-none border-2 border-gray-500 rounded w-full py-2 px-4 text-gray-200 leading-tight focus:outline-none focus:bg-black focus:border-purple-500"
          id="tableID"
          type="text"
          value="1"
        />
      </div>
      <div class="md:w-2/3">
        <input
          class="max-w-sm bg-green-900 appearance-none border-2 border-gray-500 rounded w-full py-2 px-4 text-gray-200 leading-tight focus:outline-none focus:bg-black focus:border-purple-500"
          id="betAmount"
          type="number"
          value="0"
        />
      </div>
      <div class="md:w-2/3">
        <h1></h1>
        <For each={actions()} fallback={<div>Loading actions...</div>}>
          {/* TODO: Add attributes for bet amount */}
          {(action) => (
            <button
              class="bg-blue hover:bg-gray-100 text-gray-200 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
              onClick={takeAction(action)}
            >
              {action}
            </button>
          )}
        </For>
      </div>
      <button
        class="bg-blue hover:bg-gray-100 text-gray-200 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        onClick={createTable}
      >
        Create Table
      </button>
      <button
        class="bg-blue hover:bg-gray-100 text-gray-200 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        onClick={joinTable}
      >
        Join Table
      </button>
      <section class="md:container md:mx-auto" style="padding-bottom: 25px;">
        <h1 class="font-bold text-blue-300">
          Community cards
        </h1>
        <p>{JSON.stringify(flop())}</p>
      </section>
      <section class="md:container md:mx-auto" style="padding-bottom: 25px;">
        <h1 class="font-bold text-blue-300">
          Players
        </h1>
        <For each={players()} fallback={<p>Loading players...</p>}>
          {(player) => (
            <div>
              <p>
                {JSON.stringify(player.username)}
                <br /> {JSON.stringify(player.chips)}
              </p>
            </div>
          )}
        </For>
        <h1 class="font-bold text-blue-300">
          Table Data
        </h1>
        <p>{JSON.stringify(tableData())}</p>
      </section>
      <section class="md:container md:mx-auto" style="padding-bottom: 25px;">
      </section>
      <section class="md:container md:mx-auto">
        <h1 class="font-bold text-blue-300">Prompts</h1>
        {JSON.stringify(prompts())}
      </section>
    </>
  );
};

const App: Component = () => {
  return <Main />;
};

export default App;

// // on page load
// window.onload = () => {
// }
