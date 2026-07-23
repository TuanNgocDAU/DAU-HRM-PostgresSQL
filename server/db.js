import pg from 'pg';

const { Pool, types } = pg;

/**
 * PostgREST (Supabase) trả các kiểu ngày/giờ về dưới dạng CHUỖI trong JSON.
 * Driver `pg` mặc định lại parse chúng thành đối tượng Date của JS, khiến
 * JSON.stringify đổi múi giờ và làm sai lệch dữ liệu so với trước đây.
 * Vì vậy ta ép các kiểu này giữ nguyên dạng chuỗi giống PostgREST.
 */
const OID_DATE = 1082;
const OID_TIME = 1083;
const OID_TIMESTAMP = 1114;
const OID_TIMESTAMPTZ = 1184;
const OID_INT8 = 20;
const OID_NUMERIC = 1700;

const asIsoString = (value) => {
  if (value === null) return null;
  // PostgreSQL xuất: "2024-01-31 08:30:00+07" -> PostgREST: "2024-01-31T08:30:00+07:00"
  let out = String(value).replace(' ', 'T');
  const tz = out.match(/([+-])(\d{2})$/);
  if (tz) out = `${out}:00`;
  return out;
};

types.setTypeParser(OID_DATE, (v) => v);
types.setTypeParser(OID_TIME, (v) => v);
types.setTypeParser(OID_TIMESTAMP, asIsoString);
types.setTypeParser(OID_TIMESTAMPTZ, asIsoString);
// bigint / numeric -> number, giống JSON mà PostgREST sinh ra
types.setTypeParser(OID_INT8, (v) => (v === null ? null : Number(v)));
types.setTypeParser(OID_NUMERIC, (v) => (v === null ? null : Number(v)));

export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'qlns',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  max: Number(process.env.PGPOOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  console.error('[db] Lỗi client nhàn rỗi trong pool:', err.message);
});

export const query = (text, params) => pool.query(text, params);
