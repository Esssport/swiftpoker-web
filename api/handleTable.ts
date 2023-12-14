import { Table } from "../data_types.ts";

export const handleTable = async (ctx) => {
  const id = +ctx.params.tableID as number;
  const serverTables = ctx.state.tables as Map<number, Table>;

  if (!serverTables.has(id)) {
    ctx.response.status = 404;
    return ctx.response.body = {};
  } else {
    const table = serverTables.get(id);
    return ctx.response.body = JSON.stringify(table);
  }
};
