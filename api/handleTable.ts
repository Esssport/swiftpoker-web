import { Table } from "../utils/tableBlueprint.ts";

export const handleTable = async (ctx) => {
  const id = +ctx.params.tableID as number;
  const serverTables = ctx.state.tables as Map<number, Table>;

  if (!serverTables.has(id)) {
    ctx.response.status = 404;
    return ctx.response.body = {};
  } else {
    const table = serverTables.get(id);
    console.log("TABLE FOUND", table.id, table.players.length, table.players);
    return ctx.response.body = JSON.stringify(table);
  }
};
