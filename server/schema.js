import { query } from './db.js';

/**
 * Bộ phân giải định danh (bảng / cột).
 *
 * Hai mục đích:
 *  1. An toàn: mọi tên bảng và tên cột đi vào câu SQL đều phải khớp với một
 *     định danh CÓ THẬT trong database. Không có gì do client gửi lên được
 *     nối thẳng vào SQL, nên không thể chèn SQL qua tên bảng/cột.
 *  2. Tương thích: code phía client viết tên cột chữ thường (`maphongban`)
 *     trong khi bảng có thể được tạo với tên viết hoa/thường lẫn lộn
 *     (`DanhMucPhongBan`). Ta so khớp không phân biệt hoa thường rồi trả về
 *     đúng tên gốc để trích dẫn.
 */

const SCHEMA = process.env.PGSCHEMA || 'public';

let cache = null;

const loadSchema = async () => {
  const tablesRes = await query(
    `SELECT c.relname AS table_name
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1
        AND c.relkind IN ('r', 'v', 'm', 'p', 'f')`,
    [SCHEMA]
  );

  const columnsRes = await query(
    `SELECT table_name, column_name
       FROM information_schema.columns
      WHERE table_schema = $1`,
    [SCHEMA]
  );

  const pkRes = await query(
    `SELECT c.relname AS table_name, a.attname AS column_name, x.ordinality
       FROM pg_index i
       JOIN pg_class c ON c.oid = i.indrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS x(attnum, ordinality) ON TRUE
       JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = x.attnum
      WHERE i.indisprimary AND n.nspname = $1
      ORDER BY c.relname, x.ordinality`,
    [SCHEMA]
  );

  const tables = new Map(); // lowercase -> tên thật
  for (const row of tablesRes.rows) tables.set(row.table_name.toLowerCase(), row.table_name);

  const columns = new Map(); // tên bảng thật -> Map(lowercase -> tên cột thật)
  for (const row of columnsRes.rows) {
    if (!columns.has(row.table_name)) columns.set(row.table_name, new Map());
    columns.get(row.table_name).set(row.column_name.toLowerCase(), row.column_name);
  }

  const primaryKeys = new Map(); // tên bảng thật -> [tên cột thật]
  for (const row of pkRes.rows) {
    if (!primaryKeys.has(row.table_name)) primaryKeys.set(row.table_name, []);
    primaryKeys.get(row.table_name).push(row.column_name);
  }

  return { tables, columns, primaryKeys };
};

export const refreshSchema = async () => {
  cache = await loadSchema();
  return cache;
};

export const getSchema = async () => cache || refreshSchema();

/** Trích dẫn một định danh đã được xác thực là có thật trong database. */
export const quoteIdent = (name) => `"${String(name).replace(/"/g, '""')}"`;

export class SchemaError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

export const resolveTable = (schema, name) => {
  const actual = schema.tables.get(String(name || '').toLowerCase());
  if (!actual) {
    throw new SchemaError(
      `Bảng "${name}" không tồn tại trong database "${process.env.PGDATABASE || 'qlns'}" (schema ${SCHEMA}).`,
      '42P01'
    );
  }
  return actual;
};

export const resolveColumn = (schema, table, name) => {
  const map = schema.columns.get(table);
  const actual = map && map.get(String(name || '').trim().toLowerCase());
  if (!actual) {
    throw new SchemaError(`Cột "${name}" không tồn tại trong bảng "${table}".`, '42703');
  }
  return actual;
};

export const getPrimaryKey = (schema, table) => schema.primaryKeys.get(table) || [];
