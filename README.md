# mcp-server-schema

MySQL database schema introspection MCP server for [opencode](https://opencode.ai). Explore tables, columns, foreign keys, indexes, and relationships across all your databases — no manual `SHOW` queries needed.

## Features

| Tool | Description |
|---|---|
| `schema_databases` | List all non-system databases with charset |
| `schema_tables` | All tables in a database with engine, row count, comments |
| `schema_views` | All views in a database |
| `schema_table_detail` | Columns, types, defaults, nullable, keys, comments for a table |
| `schema_foreign_keys` | FK relationships: all, per-table, incoming/outgoing |
| `schema_indexes` | All indexes for a table with uniqueness and type |
| `schema_relationships` | Full PK/FK relationship map across all tables |
| `schema_search` | Search across table and column names |

Also exposes `schema://{db}/tables`, `schema://{db}/relationships`, and `schema://{db}/{table}/columns` as MCP resources.

## Requirements

- Node.js >= 18
- MySQL server with `information_schema` access

## Install

```bash
git clone git@github.com:rendi-febrian/mcp-server-schema.git
cd mcp-server-schema
npm install
npm run build
```

## Configure (opencode)

Add to `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "mysql-schema": {
      "type": "local",
      "command": ["node", "/path/to/mcp-server-schema/dist/index.js"],
      "environment": {
        "MYSQL_HOST": "100.123.57.62",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "abxrds",
        "MYSQL_PASS": "your-password"
      },
      "enabled": true
    }
  }
}
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MYSQL_HOST` | Yes | `127.0.0.1` | MySQL host |
| `MYSQL_PORT` | No | `3306` | MySQL port |
| `MYSQL_USER` | Yes | `root` | MySQL user |
| `MYSQL_PASS` | No | `""` | MySQL password |
| `MYSQL_DEFAULT_DB` | No | — | Default database for resource URIs |

## Security

**Read-only** — all queries hit `information_schema` only. No `SELECT` on user tables. No `INSERT`, `UPDATE`, `DELETE`, or `DDL` operations. The server cannot modify data.

## How It's Different from MySQL MCP

| | MySQL MCP | Schema MCP |
|---|---|---|
| Purpose | Run arbitrary SQL | Understand database structure |
| Query target | Any table | `information_schema` only |
| Write access | Optional | Never |
| Use case | CRUD, data exploration | Schema documentation, ERD, migrations |

## Troubleshooting

**"Access denied"** — Ensure the MySQL user has `SELECT` permission on `information_schema`. This is usually granted by default.

**Timeout on `schema_relationships`** — Large databases (100+ tables) may take a few seconds as it queries FK info per table. Wait for the full response.

## License

MIT
