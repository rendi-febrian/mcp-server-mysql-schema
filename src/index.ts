#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { listDatabases, listTables, listViews } from "./tools/tables.js";
import { tableDetail } from "./tools/detail.js";
import { foreignKeys } from "./tools/foreignKeys.js";
import { indexes } from "./tools/indexes.js";
import { relationships } from "./tools/relationships.js";
import { search } from "./tools/search.js";
import { registerResources } from "./resources/index.js";

export interface ToolHandler {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<{
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
  }>;
}

const ALL_TOOLS: ToolHandler[] = [
  listDatabases,
  listTables,
  listViews,
  tableDetail,
  foreignKeys,
  indexes,
  relationships,
  search,
];

const toolDescription = ALL_TOOLS.map((t) => t.name).join(", ");

async function main(): Promise<void> {
  const MYSQL_HOST = process.env.MYSQL_HOST || "127.0.0.1";
  const MYSQL_PORT = process.env.MYSQL_PORT || "3306";
  const MYSQL_USER = process.env.MYSQL_USER || "root";
  const MYSQL_DEFAULT_DB = process.env.MYSQL_DEFAULT_DB || "(all)";

  const mcpServer = new Server(
    { name: "mysql-schema", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {} } }
  );

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = ALL_TOOLS.find((t) => t.name === request.params.name);
    if (!tool) throw new Error(`Unknown tool: ${request.params.name}`);

    try {
      return await tool.handler((request.params.arguments as Record<string, unknown>) || {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { isError: true, content: [{ type: "text", text: `Tool error: ${msg}` }] };
    }
  });

  registerResources(mcpServer);

  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);

  process.stderr.write(
    `MySQL Schema MCP started | ${MYSQL_USER}@${MYSQL_HOST}:${MYSQL_PORT} | db: ${MYSQL_DEFAULT_DB} | tools: ${toolDescription}\n`
  );
}

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
process.on("uncaughtException", (err) => {
  process.stderr.write(`Uncaught exception: ${err.message}\n`);
  process.exit(1);
});

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(1);
});
