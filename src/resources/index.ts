import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  getTables,
  getColumns,
  getForeignKeysForTable,
  getIndexes,
  getDatabases,
  getRelationshipMap,
} from "../schema.js";

const DB = process.env.MYSQL_DEFAULT_DB || "";

function dbUri(path: string) {
  const db = DB;
  return `schema://${db}/${path}`;
}

export function registerResources(server: Server): void {
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources: { uri: string; name: string; description: string; mimeType: string }[] = [];

    if (DB) {
      resources.push(
        {
          uri: dbUri("tables"),
          name: `${DB} — All Tables`,
          description: `List of all tables in ${DB}`,
          mimeType: "application/json",
        },
        {
          uri: dbUri("relationships"),
          name: `${DB} — Full Relationship Map`,
          description: `Foreign key relationships across all tables in ${DB}`,
          mimeType: "application/json",
        }
      );
    }

    return { resources };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const parsed = uri.match(/^schema:\/\/([^/]+)\/(.+)$/);
    if (!parsed) throw new Error(`Invalid schema URI: ${uri}`);

    const [, database, path] = parsed;

    if (path === "tables") {
      const tables = await getTables(database);
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(tables, null, 2) }],
      };
    }

    if (path === "relationships") {
      const map = await getRelationshipMap(database);
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(map, null, 2) }],
      };
    }

    const tableMatch = path.match(/^([^/]+)\/(columns|indexes|foreign-keys)$/);
    if (tableMatch) {
      const [, table, subpath] = tableMatch;
      if (subpath === "columns") {
        const cols = await getColumns(database, table);
        return {
          contents: [{ uri, mimeType: "application/json", text: JSON.stringify(cols, null, 2) }],
        };
      }
      if (subpath === "indexes") {
        const idx = await getIndexes(database, table);
        return {
          contents: [{ uri, mimeType: "application/json", text: JSON.stringify(idx, null, 2) }],
        };
      }
      if (subpath === "foreign-keys") {
        const fks = await getForeignKeysForTable(database, table);
        return {
          contents: [{ uri, mimeType: "application/json", text: JSON.stringify(fks, null, 2) }],
        };
      }
    }

    throw new Error(`Unknown resource path: ${path}`);
  });
}
