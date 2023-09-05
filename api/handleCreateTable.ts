import { Table } from "../data_types.ts";
let tableNumber = 0;
export const handleCreateTable = async (
  ctx,
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
    buyInRange: { min: 100, max: 500 },
    maxPlayers: limitValue,
    pot: 0,
    type: "cash",
  };

  serverTables.set(tableNumber, tableObj);
  console.log("Table created", serverTables);
  ctx.response.body = JSON.stringify(Array.from(serverTables));
};
