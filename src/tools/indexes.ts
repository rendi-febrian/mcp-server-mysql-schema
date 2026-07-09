import type { ToolHandler } from "../index.js";
import { getIndexes } from "../schema.js";

export const indexes: ToolHandler = {
  name: "schema_indexes",
  description: "List all indexes for a table with columns, uniqueness, and type",
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
    const idx = await getIndexes(database, table);
    return { content: [{ type: "text", text: JSON.stringify(idx, null, 2) }] };
  },
};
