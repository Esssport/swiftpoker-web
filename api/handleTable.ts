import { Table } from "../data_types.ts";

export const handleTable = async (ctx) => {
  const id = ctx.params.id || 1;
  const serverTables = ctx.state.tables as Map<number, Table>;
  return ctx.response.body = JSON.stringify(Array.from(serverTables)) || {};
};
