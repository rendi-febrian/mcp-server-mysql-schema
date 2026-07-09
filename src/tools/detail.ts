import type { ToolHandler } from "../index.js";
import { getColumns } from "../schema.js";

export const tableDetail: ToolHandler = {
  name: "schema_table_detail",
  description: "Show columns, types, defaults, nullable, keys, and comments for a table",
  inputSchema: {
    type: "object",
    properties: {
      database: { type: "string", description: "Database name" },
      table: { type: "string", description: "Table name" },
    },
    required: ["database", "table"],
  },
  handler: async (args) => {
    const { database, table } = args as { database: string; table: string };
    const columns = await getColumns(database, table);
    return { content: [{ type: "text", text: JSON.stringify(columns, null, 2) }] };
  },
};
