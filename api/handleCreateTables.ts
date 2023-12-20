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
//TODO: maybe create tables when server starts, not when a user visits lobby
export const handleCreateTables = async (
  ctx,
) => {
  const serverTables = ctx.state.tables as Map<
    number,
    Table
  >;

  const playMoneyToNano = (playmoney: number) => {
    return playmoney / 10000000; // 10 million playmoney = 1 nano
  };

  console.log(playMoneyToNano(20000));
  // do nothing if there are empty tables available, otherwise create new tables

  if (serverTables.size > 0) {
    //condition above should be if players are equal to max players
    return ctx.response.body = JSON.stringify(Array.from(serverTables));
  }

  const playmoneyTableSettings = [
    { min: 4000, max: 10000, small: 50, big: 100 }, // 10k Ӿ0.001
    { min: 8000, max: 20000, small: 100, big: 200 }, // 20k Ӿ0.002
    // { min: 20000, max: 50000, small: 250, big: 500 }, // 50k Ӿ0.005
    // { min: 80000, max: 200000, small: 1000, big: 2000 }, // 200k Ӿ0.02
    // { min: 400000, max: 1000000, small: 5000, big: 10000 }, // 1 million Ӿ0.1
    // { min: 2000000, max: 5000000, small: 25000, big: 50000 }, // 5 million Ӿ0.5
    // { min: 8000000, max: 20000000, small: 100000, big: 200000 }, // 20 million Ӿ2
    // { min: 50000000, max: 50000000, small: 250000, big: 500000 }, // 50 million Ӿ5
    // { min: 100000000, max: 100000000, small: 500000, big: 1000000 }, // 100 million Ӿ10
    // { min: 200000000, max: 200000000, small: 1000000, big: 2000000 }, // 200 million Ӿ20
    // { min: 500000000, max: 500000000, small: 2500000, big: 5000000 }, // 500 million Ӿ50
    // { min: 1000000000, max: 1000000000, small: 5000000, big: 10000000 }, // 1 billion Ӿ100
    // { min: 2000000000, max: 2000000000, small: 10000000, big: 20000000 }, // 2 billion Ӿ200
    // { min: 5000000000, max: 5000000000, small: 25000000, big: 50000000 }, // 5 billion Ӿ500
  ];

  const playerNumbers = [2, 6, 9];
  let tableUniqueID = 1;
  for (const tableSettings of playmoneyTableSettings) {
    for (const playerCount of playerNumbers) {
      const newTable = new Table({
        blinds: { small: tableSettings.small, big: tableSettings.big },
        buyInRange: { min: tableSettings.min, max: tableSettings.max },
        maxPlayers: playerCount,
        type: "playmoney",
        variantID: tableUniqueID++,
      });

      serverTables.set(newTable.id, newTable);
    }
  }
  console.log("Table created", serverTables);

  ctx.response.body = JSON.stringify(Array.from(serverTables));
};
