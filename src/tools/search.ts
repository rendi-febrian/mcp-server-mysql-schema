import type { ToolHandler } from "../index.js";
import { searchSchema } from "../schema.js";

export const search: ToolHandler = {
  name: "schema_search",
  description: "Search across table and column names in a database",
  inputSchema: {
    type: "object",
    properties: {
      database: { type: "string", description: "Database name" },
      keyword: { type: "string", description: "Search keyword" },
    },
    required: ["database", "keyword"],
  },
  handler: async (args) => {
    const { database, keyword } = args as { database: string; keyword: string };
    const results = await searchSchema(database, keyword);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  },
};
