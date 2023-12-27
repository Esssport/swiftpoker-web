import {
  Component,
  createEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
} from "solid-js";
// import { useParams } from "@solidjs/router";
import {
  Player as PlayerType,
  Table as TableType,
} from "../../../../utils/tableBlueprint.ts";
import "./Table.scss";
import { Card } from "../../../../data_types.ts";
import { Slider } from "../Slider/Slider.tsx";
const [table, setTable] = createSignal<TableType>();
const [actions, setActions] = createSignal([]);
const [activeUser, setActiveUser] = createSignal("");
const [hands, setHands] = createSignal<Map<string, Card[]>>(new Map());
const [communityCards, setCommunityCards] = createSignal([]);
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
    console.log(username, e);
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
    console.log("payload", data.payload);
    if (!!data.payload?.hands) {
      const handsMap: Map<string, Card[]> = new Map(data.payload.hands);
      setHands(handsMap);
      // console.log("Hands Set", hands());
    }
    switch (data.event) {
      case "table-updated":
        const cardsArray = [];
        const communityCards = data.payload.communityCards;
        if (communityCards && communityCards.flop?.length === 3) {
          cardsArray.push(...communityCards.flop);
        }
        if (communityCards && communityCards.turn) {
          cardsArray.push(communityCards.turn);
        }
        if (communityCards && communityCards.river) {
          cardsArray.push(communityCards.river);
        }
        setCommunityCards(cardsArray);
        setTable(data.payload.table);
        // setGameState(data.payload.gameState);
        if (data.payload.waitingFor) {
          setActiveUser(data.payload.waitingFor);
        }
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
  // const params = useParams();
  // const tableID = params.tableID;

  onMount(() => {
    // getTableData(tableID);
    //run joinTable if redirected from lobby, otherwise join if user clicks on join button and call watchTable();
    joinTable();
  });

  onCleanup(() => {
    if (userSocket) userSocket.close();
  });

  createEffect(() => {
  });
  return (
    <section class="table">
      <div class="actions-section">
        {actions()?.length > 0
          ? (
            <>
              <Slider />
              <input
                id="betAmount"
                type="number"
                value={table()?.blinds.big}
              />
            </>
          )
          : null}
        <div class="actions">
          <For each={actions()}>
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
      </div>
      <div class="community-cards">
        {table()?.pot > 0
          ? <Chips chips={table()?.pot} orientation="horizontal" />
          : null}
        <For each={communityCards()}>
          {(card) => (
            <img
              class="hand-image"
              src={`/src/assets/cards/${card[0]}.png`}
            >
              {/* //TODO: change this to altText */}
              {`${card[1].name} of ${card[1].suit}`}
            </img>
          )}
        </For>
      </div>
      <section class="players">
        <For each={table()?.players}>
          {(player) => <Player player={player} />}
        </For>

        {
          /* {table()?.players?.length > 0
          ? (
            <>
              <Player player={table()?.players[0]} />
              <Player player={table()?.players[0]} />
              <Player player={table()?.players[0]} />
              <Player player={table()?.players[0]} />
            </>
          )
          : null} */
        }
      </section>
    </section>
  );
};

const Player = ({ player }: { player: PlayerType }) => {
  const playerHands = hands()?.get(String(player.username));
  const playerBets = player.bets[table()?.gameState.stage];
  return (
    <div
      classList={{
        "player": true,
        active: activeUser() === player.username,
      }}
    >
      {true
        ? (
          <div class="player-image-section">
            {player.role
              ? (
                <img
                  src={`/src/assets/chips/${player.role}.png`}
                  class="button-image"
                />
              )
              : null}

            {player.isDealer && (
              <>
                <img src="/src/assets/chips/dealer.png" class="button-image" />
              </>
            )}
            <div class="player-name">{player.username}</div>
            <div classList={{ "player-hand": true, "folded": player.folded }}>
              {playerHands
                ? (
                  <For each={playerHands}>
                    {(card) => (
                      <img
                        class="hand-image"
                        src={`/src/assets/cards/${card[0]}.png`}
                      >
                        {`${card[1].name} of ${card[1].suit}`}
                      </img>
                    )}
                  </For>
                )
                : (
                  <>
                    <img
                      class="hand-image"
                      src={`/src/assets/cards/hand.png`}
                    >
                      hidden cards
                    </img>
                    <img
                      class="hand-image"
                      src={`/src/assets/cards/hand.png`}
                    >
                      hidden cards
                    </img>
                  </>
                )}
            </div>
            <div class="player-chips">
              {/* <img src="/src/assets/chips/chip.png" class="chip-image" /> */}
              {/* <Chips chips={player.chips} /> */}
              {player.chips}
            </div>
            <div class="player-bet">
              {playerBets && playerBets > 0
                ? <Chips chips={playerBets} />
                : null}
            </div>
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

const Chips = (props: { orientation: string; chips: number }) => {
  const chipsDevisibles = [
    1000000,
    100000,
    10000,
    5000,
    2000,
    1000,
    500,
    200,
    100,
    50,
    20,
    10,
    5,
    2,
    1,
  ];

  // console.log("Chips", chips);
  const orientation = props.orientation || "vertical"; // vertical for bets or horizontal for pot

  const chipsToRender = (chips: number): number[] => {
    const chipsArray = [];
    let chipsRemaining = chips;
    for (let i = 0; i < chipsDevisibles.length; i++) {
      if (chipsRemaining >= chipsDevisibles[i]) {
        const quotient = Math.floor(chipsRemaining / chipsDevisibles[i]);
        chipsRemaining = chipsRemaining % chipsDevisibles[i];
        for (let j = 0; j < quotient; j++) {
          chipsArray.push(chipsDevisibles[i]);
        }
      }
    }
    return chipsArray;
  };
  console.log("chipsToRender(props.chips)", chipsToRender(props.chips));
  return (
    <div class={`chips ${orientation}`}>
      <For each={chipsToRender(props.chips)}>
        {(chip) => (
          <img
            src={`/src/assets/chips/${chip}.png`}
            class={`chip-image ${orientation}`}
          />
        )}
      </For>
    </div>
  );
};
