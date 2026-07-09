import type { ToolHandler } from "../index.js";
import { getRelationshipMap } from "../schema.js";

export const relationships: ToolHandler = {
  name: "schema_relationships",
  description: "Full relationship map across all tables in a database: primary keys, foreign keys, and references",
  inputSchema: {
    type: "object",
    properties: {
      database: { type: "string", description: "Database name" },
    },
    required: ["database"],
  },
  handler: async (args) => {
    const database = args.database as string;
    const map = await getRelationshipMap(database);
    return { content: [{ type: "text", text: JSON.stringify(map, null, 2) }] };
  },
};
