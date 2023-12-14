import { Component, createSignal, For } from "solid-js";
import { GameState, Player, Table } from "../../../../data_types.ts";
let userSocket: WebSocket;
let userID: string;
let currenBet: number;

const [players, setPlayers] = createSignal<Player[]>([]);
const [gameState, setGameState] = createSignal<GameState>();
const [prompts, setPrompts] = createSignal([]);
const [table, setTable] = createSignal<Table>();
const [actions, setActions] = createSignal([]);
const [activeUser, setActiveUser] = createSignal("");

const joinTable = () => {
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
  userSocket = serverSocket;
  serverSocket.onerror = (e) => {
    console.log("ERROR", e);
  };
  serverSocket.onclose = (e) => {
    console.log(username, e.reason);
  };
  serverSocket.onopen = (ws) => {
    serverSocket.send(JSON.stringify("connected to table " + tableID.value));
  };
  // getTableData();
  serverSocket.onmessage = (m) => {
    const data = JSON.parse(m.data);
    if (!!data?.payload?.prompt) {
      setPrompts(data.payload.prompt);
    }
    if (data.payload?.table) setPlayers(data.payload.table.players);
    console.log("data", data);
    switch (data.event) {
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
      case "table-updated":
        setPlayers(data.payload.table.players);
        setTable(data.payload.table);
        setGameState(data.payload.gameState);
        setActiveUser(data.payload.waitingFor);
        //TODO: interact with input field for bet amount, set limitations and default to big blind
        if (activeUser() !== userID) setActions([]);
        //setSecondaryActions([]);
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
    }
  };
};

// createEffect(() => {
//   getTableData();
// });
export const Lobby: Component = () => {
  return (
    <>
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
          class="max-w-sm bg-gray-900 appearance-none border-2 border-gray-500 rounded w-full py-2 px-4 text-gray-200 leading-tight focus:outline-none focus:bg-black focus:border-purple-500"
          id="username"
          type="text"
          value="a"
        />
      </div>
      <div class="md:w-2/3">
        <input
          class="max-w-sm bg-green-900 appearance-none border-2 border-gray-500 rounded w-full py-2 px-4 text-gray-200 leading-tight focus:outline-none focus:bg-black focus:border-purple-500"
          id="betAmount"
          type="number"
          value="25"
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
        <For
          each={table()?.communityCards}
          fallback={<p>cards are not dealt yet</p>}
        >
          {(card) => <p>{JSON.stringify(card)}</p>}
        </For>
      </section>
      <section class="md:container md:mx-auto" style="padding-bottom: 25px;">
        <h1 class="font-bold text-blue-300">
          Players
        </h1>
        <ul class="player-list">
          <For each={players()} fallback={<p>Loading players...</p>}>
            {(player) => (
              <li
                classList={{
                  player: true,
                  active: activeUser() === player.username,
                }}
              >
                Username: {player.username}
                <br /> Chips: {player.chips}
                <br /> Bet: {player.bets[gameState()?.stage]}
                <br /> role: {player.role}
                {player.isDealer && (
                  <>
                    <br />dealer
                  </>
                )}
                <br /> cards: {JSON.stringify(player.hand)}
              </li>
            )}
          </For>
        </ul>
      </section>
      <section class="md:container md:mx-auto" style="padding-bottom: 25px;">
        <h1 class="font-bold text-blue-300">
          Pot
        </h1>
        <p>{table()?.pot}</p>
      </section>
      <section class="md:container md:mx-auto">
        <h1 class="font-bold text-blue-300">Prompts</h1>
        {JSON.stringify(prompts())}
      </section>
    </>
  );
};

const takeAction = (action: string) => () => {
  const betAmount = document.getElementById(
    "betAmount",
  ) as HTMLInputElement;
  const finalBetAmount = !!betAmount.value
    ? +betAmount.value
    : table().blinds.big;
  currenBet = finalBetAmount;
  userSocket.send(
    //TODO: include userID in payload potentially
    JSON.stringify({
      event: "action-taken",
      payload: { betAmount: currenBet, userID, action },
    }),
  );
  console.log("action taken", action);
};
// function getTableData(tableID = 1) {
//   fetch(`http://localhost:8080/tables/${tableID}`)
//     .then((response) => {
//       response.json().then((data) => {
//         // setTableData(data);
//       });
//     })
//     .catch((err) => console.log(err));
// }
const createTable = () => {
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
      // setTableData(data);
    });
  })
    .catch((err) => console.log(err));
};
