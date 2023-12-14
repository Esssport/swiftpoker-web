import { Table } from "../data_types.ts";
import { monitorAddress } from "./nanoMonitor.ts";
import { nanoBalance, nanoHash } from "./nanoHandler.ts";
import { load } from "https://deno.land/std@0.209.0/dotenv/mod.ts";
const env = await load();
const nanoAddress = env["NANO_ADDRESS"];
monitorAddress(nanoAddress);
// const response = nanoHash(
//   "FA0B8F8F25DA9CB2D1A2B031038C952ABC9CED49FA6D5059C80D30B2EE321F57",
// );
// response.then((response) => {
//   response.json().then((data) => {
//     console.log("resp", data);
//   });
// });
const response = nanoBalance(nanoAddress);
response.then((resp) => {
  console.log(resp);
});

// TODO: pay in nano
// TODO: ask for payment in nano

let tableNumber = 0;
export const handleCreateTable = async (
  ctx: {
    state: { tables: Map<number, Table> };
    request: { url: { searchParams: { get: (arg0: string) => any } } };
    response: { body: string };
  },
) => {
  const serverTables = ctx.state.tables as Map<
    number,
    Table
  >;

  const limit = Number(ctx.request.url.searchParams.get("limit"));
  const limitValue = limit <= 10 && limit >= 2 ? limit : 10;

  do {
    tableNumber += 1;
  } while (serverTables.has(tableNumber));

  const tableObj: Table = {
    id: tableNumber,
    players: [],
    blinds: { small: 10, big: 25 },
    buyInRange: { min: 500, max: 1000 },
    maxPlayers: limitValue,
    firstBets: { preflop: 0, flop: 0, turn: 0, river: 0 },
    pot: 0,
    type: "cash",
    GameState: {
      activePosition: 0,
      stage: "preflop",
      hands: undefined,
      newGame: true,
      smallBlindPlayed: undefined,
      bigBlindPlayed: undefined,
      promptingFor: undefined,
      highestBets: { preflop: 0, flop: 0, turn: 0, river: 0 },
    },
  };

  serverTables.set(tableNumber, tableObj);
  console.log("Table created", serverTables);

  ctx.response.body = JSON.stringify(Array.from(serverTables));
};
