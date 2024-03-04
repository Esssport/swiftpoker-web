import {
  Component,
  createEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
} from "solid-js";
// import { useParams } from "@solidjs/router";
import { Table as TableType } from "../../../../utils/tableBlueprint.ts";
import "./Table.scss";
import { Card } from "../../../../data_types.ts";
import { SliderComponent } from "../Slider/Slider.tsx";
import { Chips } from "./Chips.tsx";
import { Player } from "./Player.tsx";
import { TextComponent } from "../TextField/TextField.tsx";
const [table, setTable] = createSignal<TableType>();
const [actions, setActions] = createSignal([]);
const [activeUser, setActiveUser] = createSignal("");
const [hands, setHands] = createSignal<Map<string, Card[]>>(new Map());
const [communityCards, setCommunityCards] = createSignal([]);
const [maxBetAllowed, setMaxBetAllowed] = createSignal(0);
const [betValue, setBetValue] = createSignal(0);
const [callAmount, setCallAmount] = createSignal(0);
const [raiseAmount, setRaiseAmount] = createSignal(0);
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
  const bet = action === "raise" || action === "bet"
    ? Math.max(raiseAmount(), betValue())
    : callAmount();
  userSocket.send(
    JSON.stringify({
      event: "action-taken",
      payload: { userID, betAmount: bet, action },
    }),
  );
  console.log("action taken", action, bet);
};

//TODO: Add cards and other information into localStorage if necessary to continue showing them if browser is refreshed

const joinTable = () => {
  const username = localStorage.getItem("username");
  const tableID = localStorage.getItem("tableID");
  const buyInAmount = localStorage.getItem("buyInAmount");

  userID = username;
  // localStorage.removeItem("username");
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
    // console.log("payload", data.payload);
    if (!!data.payload?.hands) {
      const handsMap: Map<string, Card[]> = new Map(data.payload.hands);
      setHands(handsMap);
      // console.log("Hands Set", hands());
    }
    switch (data.event) {
      case "cards-updated":
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
        break;
      case "table-updated":
        if (data.payload.allHands) {
          const allHandsMap: Map<string, Card[]> = new Map(
            data.payload.allHands,
          );
          setHands(allHandsMap);
        }
        setTable(data.payload.table);
        setBetValue(data.payload.table.blinds.big);

        if (data.payload?.actionOptions) {
          setMaxBetAllowed(data.payload.actionOptions.maxBetAllowed);
          setCallAmount(data.payload.actionOptions.callAmount);
          setRaiseAmount(data.payload.actionOptions.raiseAmount);
        }
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
      case "clear-prompt":
        setActions([]);
        break;
      case "bet-placed":
        setTable(data.payload.table);
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

  return (
    <section class="table">
      <div class="actions-section">
        {actions()?.length > 0
          ? (
            <>
              <SliderComponent
                minValue={Math.max(table()?.blinds.big, callAmount())}
                maxValue={maxBetAllowed()}
                setBetValue={setBetValue}
                bigBlind={table()?.blinds.big}
                value={betValue}
              />
              <TextComponent
                // Label="Bet Amount"
                value={Math.max(betValue(), callAmount())}
                onChange={setBetValue}
                maxValue={maxBetAllowed()}
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
                // todo: Add "bet" action too
              >
                {action}
                <br />
                {`
                ${action === "call" ? callAmount() : ""}
                ${
                  action === "raise" || action === "bet"
                    ? Math.max(raiseAmount(), betValue())
                    : ""
                }
                `}
              </button>
            )}
          </For>
        </div>
      </div>
      <div class="community-cards">
        {table()?._potSum > 0
          ? <Chips chips={table()?._potSum} orientation="horizontal" />
          : null}
        <div class="community-cards-group">
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
      </div>
      <section class="players">
        <For each={table()?.players}>
          {(player) => (
            <Player
              hands={hands}
              player={player}
              table={table}
              activeUser={activeUser}
            />
          )}
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
