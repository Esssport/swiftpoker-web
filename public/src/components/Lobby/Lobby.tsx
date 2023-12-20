import { Component, createEffect, createSignal, For, onMount } from "solid-js";
import { GameState, Player, Table } from "../../../../utils/tableBlueprint.ts";
import { useNavigate } from "@solidjs/router";

let userSocket: WebSocket;
let userID: string;
let currenBet: number;
const [gameState, setGameState] = createSignal<GameState>();
const [prompts, setPrompts] = createSignal([]);
const [table, setTable] = createSignal<Table>();
const [actions, setActions] = createSignal([]);
const [activeUser, setActiveUser] = createSignal("");
const [redirectionData, setRedirectionData] = createSignal<
  { path?: string; tableID?: number; username?: string; buyInAmount?: number }
>({});

const joinSimilarTable = () => {
  const usernameElement = document.getElementById(
    "username",
  ) as HTMLInputElement;
  const username = usernameElement.value;
  const request = new Request(
    `http://localhost:8080/tables/select/`,
    {
      method: "POST",
      body: JSON.stringify({
        buyInRange: { min: 4000, max: 10000 },
        blinds: { small: 50, big: 100 },
        buyInAmount: 5000,
        type: "playmoney",
        maxPlayers: 2,
        username,
        //TODO: add a token
      }),
    },
  );
  fetch(request).then((response) => {
    // console.log("message", response);
    response.json().then((data) => {
      setRedirectionData(data);
    });
  });
};

export const Lobby: Component = () => {
  const navigate = useNavigate();

  onMount(() => {
    createTable();
  });

  createEffect(() => {
    if (redirectionData().tableID) {
      const data = redirectionData();
      setRedirectionData({});
      // console.log("redirectionData", data);
      localStorage.setItem("username", data.username);
      localStorage.setItem("tableID", data.tableID.toString());
      localStorage.setItem("buyInAmount", data.buyInAmount.toString());

      navigate(`${data.path}/${data.tableID}`);
    }
  });
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
      {
        /* <div class="md:w-2/3">
        <input
          class="max-w-sm bg-green-900 appearance-none border-2 border-gray-500 rounded w-full py-2 px-4 text-gray-200 leading-tight focus:outline-none focus:bg-black focus:border-purple-500"
          id="betAmount"
          type="number"
          value="25"
        />
      </div> */
      }
      <button
        class="bg-blue hover:bg-gray-100 text-gray-200 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
        onClick={joinSimilarTable}
      >
        Join Table
      </button>
      <section class="md:container md:mx-auto" style="padding-bottom: 25px;">
        <h1 class="font-bold text-blue-300">
          Community cards
        </h1>
        <For
          each={table()?.gameState.hands.flop}
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
          {
            /* <For each={players()} fallback={<p>Loading players...</p>}>
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
          </For> */
          }
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

// const takeAction = (action: string) => () => {
//   const betAmount = document.getElementById(
//     "betAmount",
//   ) as HTMLInputElement;
//   const finalBetAmount = !!betAmount.value
//     ? +betAmount.value
//     : table().blinds.big;
//   currenBet = finalBetAmount;
//   userSocket.send(
//     //TODO: include userID in payload potentially
//     JSON.stringify({
//       event: "action-taken",
//       payload: { betAmount: currenBet, userID, action },
//     }),
//   );
//   console.log("action taken", action);
// };

const createTable = () => {
  const request = new Request(
    `http://localhost:8080/tables/create`,
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
