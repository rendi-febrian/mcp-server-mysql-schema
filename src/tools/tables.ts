import type { ToolHandler } from "../index.js";
import { getTables, getViews, getDatabases } from "../schema.js";

export const listDatabases: ToolHandler = {
  name: "schema_databases",
  description: "List all non-system MySQL databases with charset and collation",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const dbs = await getDatabases();
    return { content: [{ type: "text", text: JSON.stringify(dbs, null, 2) }] };
  },
};

export const listTables: ToolHandler = {
  name: "schema_tables",
  description: "List all tables in a database with engine, row count, size estimates, and comments",
  inputSchema: {
    type: "object",
    properties: {
      database: { type: "string", description: "Database name" },
    },
    required: ["database"],
  },
  handler: async (args) => {
    const tables = await getTables(args.database as string);
    return { content: [{ type: "text", text: JSON.stringify(tables, null, 2) }] };
  },
};

export const listViews: ToolHandler = {
  name: "schema_views",
  description: "List all views in a database",
  inputSchema: {
    type: "object",
    properties: {
      database: { type: "string", description: "Database name" },
    },
    required: ["database"],
  },
  handler: async (args) => {
    const views = await getViews(args.database as string);
    return { content: [{ type: "text", text: JSON.stringify(views, null, 2) }] };
  },
};
