import { Table as TableType } from "../data_types.ts";
import { monitorAddress } from "./nanoMonitor.ts";
import { nanoBalance, nanoHash } from "./nanoHandler.ts";
import { Table } from "../utils/tableBlueprint.ts";
// @ts-ignore
import { load } from "https://deno.land/std@0.209.0/dotenv/mod.ts";
const env = await load();
const nanoAddress = env["NANO_ADDRESS"];
// monitorAddress(nanoAddress);
// const response = nanoHash(
//   "FA0B8F8F25DA9CB2D1A2B031038C952ABC9CED49FA6D5059C80D30B2EE321F57",
// );
// response.then((response) => {
//   response.json().then((data) => {
//     console.log("resp", data);
//   });
// });
// const response = nanoBalance(nanoAddress);
// response.then((resp) => {
//   console.log(resp);
// });

// TODO: pay in nano
// TODO: ask for payment in nano
let tableCount = 1;
export const handleCreateTables = async (
  ctx: {
    state: { tables: Map<number, TableType> };
    request: { url: { searchParams: { get: (arg0: string) => any } } };
    response: { body: string };
  },
) => {
  const serverTables = ctx.state.tables as Map<
    number,
    TableType
  >;

  const playmoneyTableSettings = [
    { min: 4000, max: 10000, small: 50, big: 100 },
    { min: 8000, max: 20000 },
    { min: 20000, max: 50000 },
    { min: 80000, max: 200000 },
    { min: 400000, max: 1000000 },
    { min: 2000000, max: 5000000 },
    { min: 8000000, max: 20000000 }, // 20 million Ӿ2
    { min: 50000000, max: 50000000 },
    { min: 100000000, max: 100000000 }, // 100 million Ӿ10
    { min: 200000000, max: 200000000 },
    { min: 500000000, max: 500000000 },
    { min: 1000000000, max: 1000000000 }, // 1 billion Ӿ100
    { min: 2000000000, max: 2000000000 },
    { min: 5000000000, max: 5000000000 }, // 5 billion Ӿ500 xnox
  ];

  const playMoneyToNano = (playmoney: number) => {
    return playmoney / 10000000;
  };

  console.log(playMoneyToNano(100000000));

  const newTable = new Table({
    blinds: { small: 50, big: 100 },
    buyInRange: { min: 4000, max: 10000 },
    maxPlayers: 9,
    // minPlayers: 2,
    type: "playmoney",
    id: tableCount,
  });

  do {
    tableCount += 1;
  } while (serverTables.has(tableCount));

  serverTables.set(newTable.id, newTable);
  console.log("Table created", serverTables);

  ctx.response.body = JSON.stringify(Array.from(serverTables));
};
