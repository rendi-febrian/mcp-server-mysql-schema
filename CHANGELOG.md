# Changelog

## [1.0.0] — 2025-07-09

Initial release.

### Tools

- `schema_databases` — List all non-system databases
- `schema_tables` — All tables with engine, row count, comments
- `schema_views` — All views in a database
- `schema_table_detail` — Columns, types, defaults, nullable, keys
- `schema_foreign_keys` — FK relationships (all, per-table, incoming/outgoing)
- `schema_indexes` — Indexes with uniqueness and type
- `schema_relationships` — Full PK/FK map across all tables
- `schema_search` — Search table and column names

### Resources

- `schema://{db}/tables` — Table listing
- `schema://{db}/relationships` — Relationship map
- `schema://{db}/{table}/columns` — Column details
- `schema://{db}/{table}/indexes` — Index details
- `schema://{db}/{table}/foreign-keys` — FK details
