import './env.js';
import express from 'express';
import { pool } from './db.js';
import { getSchema, refreshSchema, SchemaError } from './schema.js';
import { buildStatements } from './queryBuilder.js';

const app = express();
app.use(express.json({ limit: process.env.API_BODY_LIMIT || '25mb' }));

const PORT = Number(process.env.API_PORT || 3001);
// Chỉ lắng nghe trên loopback: trình duyệt đi qua proxy /api của Vite,
// nên API không cần lộ ra mạng LAN.
const HOST = process.env.API_HOST || '127.0.0.1';

const toPostgrestError = (err) => ({
  message: err.message || 'Lỗi không xác định',
  code: err.code || null,
  details: err.detail || null,
  hint: err.hint || null,
});

app.get('/api/health', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT current_database() AS db, version() AS version');
    const schema = await getSchema();
    res.json({
      ok: true,
      database: rows[0].db,
      version: rows[0].version,
      tables: schema.tables.size,
    });
  } catch (err) {
    res.status(503).json({ ok: false, error: toPostgrestError(err) });
  }
});

app.post('/api/schema/refresh', async (_req, res) => {
  try {
    const schema = await refreshSchema();
    res.json({ ok: true, tables: [...schema.tables.values()].sort() });
  } catch (err) {
    res.status(500).json({ ok: false, error: toPostgrestError(err) });
  }
});

app.post('/api/query', async (req, res) => {
  const descriptor = req.body || {};

  let statements;
  let schema;
  try {
    schema = await getSchema();
    statements = buildStatements(descriptor, schema);
  } catch (err) {
    if (err instanceof SchemaError) {
      // Bảng/cột có thể vừa được thêm sau khi server khởi động -> nạp lại schema rồi thử lại.
      try {
        schema = await refreshSchema();
        statements = buildStatements(descriptor, schema);
      } catch (retryErr) {
        return res.status(400).json({ data: null, count: null, error: toPostgrestError(retryErr) });
      }
    } else {
      return res.status(400).json({ data: null, count: null, error: toPostgrestError(err) });
    }
  }

  const needsTransaction = statements.length > 1 && descriptor.action && descriptor.action !== 'select';
  const client = await pool.connect().catch((err) => err);
  if (client instanceof Error) {
    return res.status(503).json({ data: null, count: null, error: toPostgrestError(client) });
  }

  try {
    if (needsTransaction) await client.query('BEGIN');

    let rows = [];
    let count = null;

    for (const statement of statements) {
      const result = await client.query(statement.text, statement.values);
      if (statement.role === 'count') {
        count = Number(result.rows[0]?.exact_count ?? 0);
      } else {
        rows = rows.concat(result.rows || []);
      }
    }

    if (needsTransaction) await client.query('COMMIT');

    const wantsData =
      descriptor.action === 'select' ? !descriptor.head : Boolean(descriptor.returning);

    if (!wantsData) {
      return res.json({ data: null, count, error: null });
    }

    if (descriptor.single) {
      if (rows.length > 1) {
        return res.status(406).json({
          data: null,
          count,
          error: {
            message: `Truy vấn trả về ${rows.length} dòng nhưng chỉ mong đợi 1.`,
            code: 'PGRST116',
            details: null,
            hint: null,
          },
        });
      }
      if (rows.length === 0 && descriptor.single === 'one') {
        return res.status(406).json({
          data: null,
          count,
          error: {
            message: 'Truy vấn không trả về dòng nào nhưng mong đợi đúng 1.',
            code: 'PGRST116',
            details: null,
            hint: null,
          },
        });
      }
      return res.json({ data: rows[0] ?? null, count, error: null });
    }

    return res.json({ data: rows, count, error: null });
  } catch (err) {
    if (needsTransaction) await client.query('ROLLBACK').catch(() => {});
    console.error('[api] Truy vấn thất bại:', err.message);
    return res.status(400).json({ data: null, count: null, error: toPostgrestError(err) });
  } finally {
    client.release();
  }
});

const start = async () => {
  try {
    const schema = await refreshSchema();
    console.log(
      `[api] Đã kết nối database "${process.env.PGDATABASE || 'qlns'}" — nạp được ${schema.tables.size} bảng/view.`
    );
  } catch (err) {
    console.error('[api] KHÔNG kết nối được PostgreSQL:', err.message);
    console.error('[api] Kiểm tra lại PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD trong .env.local');
  }

  app.listen(PORT, HOST, () => {
    console.log(`[api] Đang lắng nghe tại http://${HOST}:${PORT}`);
  });
};

start();
