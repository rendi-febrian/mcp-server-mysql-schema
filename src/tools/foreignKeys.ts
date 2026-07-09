import type { ToolHandler } from "../index.js";
import { getForeignKeys, getForeignKeysForTable } from "../schema.js";

export const foreignKeys: ToolHandler = {
  name: "schema_foreign_keys",
  description: "List foreign key relationships for a database or specific table (incoming + outgoing)",
  inputSchema: {
    type: "object",
    properties: {
      database: { type: "string", description: "Database name" },
      table: {
        type: "string",
        description: "Optional: filter by table name",
      },
      direction: {
        type: "string",
        description: "When table is set: 'all' (default), 'incoming', or 'outgoing'",
        enum: ["all", "incoming", "outgoing"],
      },
    },
    required: ["database"],
  },
  handler: async (args) => {
    const { database, table, direction } = args as {
      database: string;
      table?: string;
      direction?: string;
    };

    if (!table) {
      const fks = await getForeignKeys(database);
      return { content: [{ type: "text", text: JSON.stringify(fks, null, 2) }] };
    }

    const fks = await getForeignKeysForTable(database, table);
    if (direction === "incoming") {
      return {
        content: [{ type: "text", text: JSON.stringify(fks.incoming, null, 2) }],
      };
    }
    if (direction === "outgoing") {
      return {
        content: [{ type: "text", text: JSON.stringify(fks.outgoing, null, 2) }],
      };
    }
    return { content: [{ type: "text", text: JSON.stringify(fks, null, 2) }] };
  },
};
