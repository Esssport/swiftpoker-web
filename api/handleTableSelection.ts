import { Player, Table, TableConfig } from "../utils/tableBlueprint.ts";

export const handleTableSelection = async (ctx) => {
  const serverTables = ctx.state.tables as Map<number, Table>;
  const requestParams = JSON.parse(
    await (ctx.request.body()).value,
  ) as TableConfig;
  //validate all values from requestParams

  const tablesArray = [...serverTables];
  const lastSimilarTable = tablesArray.findLast((tableArray) => {
    const table = tableArray[1];
    return (
      table.blinds.small === requestParams.blinds.small &&
      table.blinds.big === requestParams.blinds.big &&
      table.buyInRange.min === requestParams.buyInRange.min &&
      table.buyInRange.max === requestParams.buyInRange.max &&
      table.type === requestParams.type &&
      table.maxPlayers === requestParams.maxPlayers
    );
  });

  if (!lastSimilarTable) {
    ctx.response.status = 400;
    ctx.response.body = JSON.stringify({ error: "No table found" });
    console.error("No table found");
    return;
  }
  //TODO: fix error in case there is no table. maybe return a proper error message
  const potentialTable = serverTables.get(lastSimilarTable[0]);
  let finalTable: Table;
  //potentially move table generation logic to the class as a method
  if (potentialTable.players?.length >= potentialTable.maxPlayers) {
    const newTable = new Table(potentialTable);
    finalTable = newTable;
  } else {
    finalTable = potentialTable;
  }
  serverTables.set(finalTable.id, finalTable);
  ctx.response.body = JSON.stringify({
    path: "/tables",
    tableID: finalTable.id,
    username: requestParams.username,
    buyInAmount: requestParams.buyInAmount,
  });
};
