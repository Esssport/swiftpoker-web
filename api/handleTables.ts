import { Table } from "../utils/tableBlueprint.ts";

export const handleTables = async (ctx) => {
  const serverTables = ctx.state.tables as Map<number, Table>;
  return ctx.response.body = JSON.stringify(Array.from(serverTables)) || [];
};
