import { Table as TableType } from "../data_types.ts";
import { Table, TableConfig } from "../utils/tableBlueprint.ts";

export const handleJoinSimilarTable = async (ctx) => {
  const serverTables = ctx.state.tables as Map<number, TableType>;
  const requestParams = JSON.parse(
    await (ctx.request.body()).value,
  ) as TableConfig;
  //validate all values from requestParams
  console.log("requestParams", requestParams);
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

  const potentialTable = serverTables.get(lastSimilarTable[0]);
  const newTable = new Table(potentialTable);

  // const socket = await ctx.upgrade();
  newTable.addPlayer({
    username: requestParams.username,
    socket: undefined, // attemp to add socket when the game starts
    chips: requestParams.buyInAmount,
    //maybe redirect players to table number and send WS request as soon as
    //they join
    bets: { preflop: 0, flop: 0, turn: 0, river: 0 },
  });

  //call class method and add the user to the table if all is good
  //potentially move table generation ligic to the class to as a method

  if (potentialTable.players?.length >= potentialTable.maxPlayers) {
    // buyInAmount: requestParams.buyInAmount,
    //TODO: make new table and add the user to the new table
  } else {
    //TODO: add the user to the potential table
  }

  console.log("newTable", newTable);
  serverTables.set(newTable.id, newTable);

  // console.log("potentialTable", potentialTable);

  // console.log("lastSimilarTable", lastSimilarTable);
  ctx.response.body = Array.from(serverTables);
};
