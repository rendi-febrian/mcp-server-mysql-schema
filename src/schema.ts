import { query } from "./db.js";

export interface TableInfo {
  TABLE_NAME: string;
  TABLE_SCHEMA: string;
  TABLE_TYPE: string;
  ENGINE: string | null;
  TABLE_ROWS: number | null;
  AUTO_INCREMENT: number | null;
  TABLE_COMMENT: string;
  CREATE_TIME: string | null;
  UPDATE_TIME: string | null;
}

export interface ColumnInfo {
  COLUMN_NAME: string;
  COLUMN_TYPE: string;
  DATA_TYPE: string;
  IS_NULLABLE: string;
  COLUMN_DEFAULT: string | null;
  COLUMN_KEY: string;
  EXTRA: string;
  COLUMN_COMMENT: string;
  CHARACTER_SET_NAME: string | null;
  COLLATION_NAME: string | null;
}

export interface ForeignKeyInfo {
  CONSTRAINT_NAME: string;
  COLUMN_NAME: string;
  REFERENCED_TABLE_SCHEMA: string;
  REFERENCED_TABLE_NAME: string;
  REFERENCED_COLUMN_NAME: string;
  UPDATE_RULE: string;
  DELETE_RULE: string;
}

export interface IndexInfo {
  INDEX_NAME: string;
  COLUMN_NAME: string;
  SEQ_IN_INDEX: number;
  NON_UNIQUE: number;
  INDEX_TYPE: string;
  INDEX_COMMENT: string;
}

export interface DatabaseList {
  SCHEMA_NAME: string;
  DEFAULT_CHARACTER_SET_NAME: string;
  DEFAULT_COLLATION_NAME: string;
}

export async function getDatabases(): Promise<DatabaseList[]> {
  const rows = await query(
    "SELECT SCHEMA_NAME, DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys') ORDER BY SCHEMA_NAME"
  );
  return rows as DatabaseList[];
}

export async function getTables(database: string): Promise<TableInfo[]> {
  const rows = await query(
    "SELECT TABLE_NAME, TABLE_SCHEMA, TABLE_TYPE, ENGINE, TABLE_ROWS, AUTO_INCREMENT, TABLE_COMMENT, CREATE_TIME, UPDATE_TIME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME",
    [database]
  );
  return rows as TableInfo[];
}

export async function getViews(database: string): Promise<TableInfo[]> {
  const rows = await query(
    "SELECT TABLE_NAME, TABLE_SCHEMA, TABLE_TYPE, ENGINE, TABLE_ROWS, AUTO_INCREMENT, TABLE_COMMENT, CREATE_TIME, UPDATE_TIME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'VIEW' ORDER BY TABLE_NAME",
    [database]
  );
  return rows as TableInfo[];
}

export async function getColumns(database: string, table: string): Promise<ColumnInfo[]> {
  const rows = await query(
    "SELECT COLUMN_NAME, COLUMN_TYPE, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA, COLUMN_COMMENT, CHARACTER_SET_NAME, COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
    [database, table]
  );
  return rows as ColumnInfo[];
}

export async function getForeignKeys(
  database: string,
  table?: string
): Promise<ForeignKeyInfo[]> {
  let sql =
    "SELECT k.CONSTRAINT_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_SCHEMA, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME, c.UPDATE_RULE, c.DELETE_RULE " +
    "FROM information_schema.KEY_COLUMN_USAGE k " +
    "JOIN information_schema.REFERENTIAL_CONSTRAINTS c " +
    "ON k.CONSTRAINT_NAME = c.CONSTRAINT_NAME AND k.CONSTRAINT_SCHEMA = c.CONSTRAINT_SCHEMA " +
    "WHERE k.TABLE_SCHEMA = ? AND k.REFERENCED_TABLE_NAME IS NOT NULL";

  const params: unknown[] = [database];
  if (table) {
    sql += " AND (k.TABLE_NAME = ? OR k.REFERENCED_TABLE_NAME = ?)";
    params.push(table, table);
  }
  sql += " ORDER BY k.TABLE_NAME, k.ORDINAL_POSITION";

  const rows = await query(sql, params);
  return rows as ForeignKeyInfo[];
}

export async function getForeignKeysForTable(
  database: string,
  table: string
): Promise<{
  incoming: ForeignKeyInfo[];
  outgoing: ForeignKeyInfo[];
}> {
  const outgoing = await query(
    "SELECT k.CONSTRAINT_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_SCHEMA, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME, c.UPDATE_RULE, c.DELETE_RULE " +
      "FROM information_schema.KEY_COLUMN_USAGE k " +
      "JOIN information_schema.REFERENTIAL_CONSTRAINTS c " +
      "ON k.CONSTRAINT_NAME = c.CONSTRAINT_NAME AND k.CONSTRAINT_SCHEMA = c.CONSTRAINT_SCHEMA " +
      "WHERE k.TABLE_SCHEMA = ? AND k.TABLE_NAME = ? AND k.REFERENCED_TABLE_NAME IS NOT NULL " +
      "ORDER BY k.ORDINAL_POSITION",
    [database, table]
  );

  const incoming = await query(
    "SELECT k.CONSTRAINT_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_SCHEMA, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME, c.UPDATE_RULE, c.DELETE_RULE " +
      "FROM information_schema.KEY_COLUMN_USAGE k " +
      "JOIN information_schema.REFERENTIAL_CONSTRAINTS c " +
      "ON k.CONSTRAINT_NAME = c.CONSTRAINT_NAME AND k.CONSTRAINT_SCHEMA = c.CONSTRAINT_SCHEMA " +
      "WHERE k.TABLE_SCHEMA = ? AND k.REFERENCED_TABLE_NAME = ? " +
      "ORDER BY k.TABLE_NAME, k.ORDINAL_POSITION",
    [database, table]
  );

  return {
    outgoing: outgoing as ForeignKeyInfo[],
    incoming: incoming as ForeignKeyInfo[],
  };
}

export async function getIndexes(
  database: string,
  table: string
): Promise<IndexInfo[]> {
  const rows = await query(
    "SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, NON_UNIQUE, INDEX_TYPE, INDEX_COMMENT FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY INDEX_NAME, SEQ_IN_INDEX",
    [database, table]
  );
  return rows as IndexInfo[];
}

export async function searchSchema(
  database: string,
  keyword: string
): Promise<{
  tables: string[];
  columns: { TABLE_NAME: string; COLUMN_NAME: string; COLUMN_TYPE: string }[];
}> {
  const like = `%${keyword}%`;

  const tables = await query(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME",
    [database, like]
  );

  const columns = await query(
    "SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND COLUMN_NAME LIKE ? ORDER BY TABLE_NAME, ORDINAL_POSITION",
    [database, like]
  );

  return {
    tables: (tables as { TABLE_NAME: string }[]).map((t) => t.TABLE_NAME),
    columns: columns as { TABLE_NAME: string; COLUMN_NAME: string; COLUMN_TYPE: string }[],
  };
}

export async function getRelationshipMap(
  database: string
): Promise<
  {
    table: string;
    pk: string[];
    fks: {
      column: string;
      refTable: string;
      refColumn: string;
    }[];
  }[]
> {
  const tables = await getTables(database);
  const result: {
    table: string;
    pk: string[];
    fks: { column: string; refTable: string; refColumn: string }[];
  }[] = [];

  for (const t of tables) {
    const pkRows = (await query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_KEY = 'PRI' ORDER BY ORDINAL_POSITION",
      [database, t.TABLE_NAME]
    )) as { COLUMN_NAME: string }[];

    const fkRows = (await query(
      "SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY ORDINAL_POSITION",
      [database, t.TABLE_NAME]
    )) as { COLUMN_NAME: string; REFERENCED_TABLE_NAME: string; REFERENCED_COLUMN_NAME: string }[];

    result.push({
      table: t.TABLE_NAME,
      pk: pkRows.map((r) => r.COLUMN_NAME),
      fks: fkRows.map((r) => ({
        column: r.COLUMN_NAME,
        refTable: r.REFERENCED_TABLE_NAME,
        refColumn: r.REFERENCED_COLUMN_NAME,
      })),
    });
  }

  return result;
}
