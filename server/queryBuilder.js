import { quoteIdent, resolveTable, resolveColumn, getPrimaryKey, SchemaError } from './schema.js';

/**
 * Dịch "query descriptor" (JSON do client gửi lên) thành câu SQL tham số hoá.
 *
 * Descriptor mô phỏng đúng bộ query builder của Supabase mà dự án đang dùng:
 *   { table, action, columns, values, filters, order, limit, offset, single, count }
 *
 * Mọi GIÁ TRỊ đều đi qua placeholder $n. Mọi ĐỊNH DANH đều được đối chiếu với
 * schema thật rồi mới trích dẫn. Không có chuỗi nào từ client lọt thẳng vào SQL.
 */

const COMPARISON_OPS = {
  eq: '=',
  neq: '<>',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  like: 'LIKE',
  ilike: 'ILIKE',
};

class ParamList {
  constructor() {
    this.values = [];
  }
  add(value) {
    this.values.push(value);
    return `$${this.values.length}`;
  }
}

/** Tách chuỗi theo dấu phẩy ở cấp ngoài cùng, bỏ qua phẩy nằm trong "..." hoặc (...). */
const splitTopLevel = (input) => {
  const parts = [];
  let current = '';
  let depth = 0;
  let inQuote = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuote) {
      if (ch === '\\' && i + 1 < input.length) {
        current += ch + input[++i];
        continue;
      }
      if (ch === '"') inQuote = false;
      current += ch;
      continue;
    }
    if (ch === '"') {
      inQuote = true;
      current += ch;
      continue;
    }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim() !== '') parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
};

const unquote = (value) => {
  const trimmed = String(value).trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  return trimmed;
};

/** Ánh xạ token giá trị của PostgREST sang giá trị JS. */
const coerceToken = (raw) => {
  const trimmed = String(raw).trim();
  if (trimmed.startsWith('"')) return unquote(trimmed); // đã trích dẫn -> luôn là chuỗi
  if (trimmed === 'null') return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  return trimmed;
};

/**
 * Dịch một biểu thức lọc dạng PostgREST: `cot.toantu.giatri`
 * Dùng cho .or('username.eq.abc,email.eq.abc') và .filter('cot','op','val').
 */
const buildPostgrestTerm = (expr, ctx) => {
  const { schema, table, params } = ctx;
  const text = String(expr).trim();

  // Hỗ trợ nhóm lồng nhau: and(...) / or(...)
  const group = text.match(/^(and|or)\((.*)\)$/is);
  if (group) {
    const joiner = group[1].toLowerCase() === 'and' ? ' AND ' : ' OR ';
    const inner = splitTopLevel(group[2]).map((t) => buildPostgrestTerm(t, ctx));
    return inner.length ? `(${inner.join(joiner)})` : 'TRUE';
  }

  const firstDot = text.indexOf('.');
  if (firstDot === -1) throw new SchemaError(`Biểu thức lọc không hợp lệ: "${text}"`, '22023');

  const columnName = text.slice(0, firstDot);
  let rest = text.slice(firstDot + 1);

  let negate = false;
  if (/^not\./i.test(rest)) {
    negate = true;
    rest = rest.slice(4);
  }

  const opDot = rest.indexOf('.');
  if (opDot === -1) throw new SchemaError(`Biểu thức lọc không hợp lệ: "${text}"`, '22023');

  const op = rest.slice(0, opDot).toLowerCase();
  const rawValue = rest.slice(opDot + 1);

  const column = quoteIdent(resolveColumn(schema, table, columnName));
  const sql = buildOperator(column, op, rawValue, params, true);
  return negate ? `NOT (${sql})` : sql;
};

/**
 * Sinh mệnh đề SQL cho một toán tử.
 * `fromText` = true khi giá trị đến từ chuỗi PostgREST và cần được giải mã.
 */
const buildOperator = (column, op, rawValue, params, fromText) => {
  const operator = String(op).toLowerCase();

  if (operator === 'is') {
    const value = fromText ? coerceToken(rawValue) : rawValue;
    if (value === null) return `${column} IS NULL`;
    if (value === true) return `${column} IS TRUE`;
    if (value === false) return `${column} IS FALSE`;
    return `${column} IS NOT DISTINCT FROM ${params.add(value)}`;
  }

  if (operator === 'in') {
    let list;
    if (fromText) {
      const inner = String(rawValue).trim().replace(/^\(/, '').replace(/\)$/, '');
      list = splitTopLevel(inner).map(coerceToken);
    } else {
      list = Array.isArray(rawValue) ? rawValue : [rawValue];
    }
    // Danh sách rỗng: `IN ()` là lỗi cú pháp, và PostgREST coi như không khớp gì.
    if (list.length === 0) return 'FALSE';
    return `${column} IN (${list.map((v) => params.add(v)).join(', ')})`;
  }

  const comparison = COMPARISON_OPS[operator];
  if (!comparison) throw new SchemaError(`Toán tử lọc không được hỗ trợ: "${op}"`, '22023');

  const value = fromText ? coerceToken(rawValue) : rawValue;

  if (value === null) {
    // Supabase/PostgREST: `eq.null` hành xử như IS NULL
    if (comparison === '=') return `${column} IS NULL`;
    if (comparison === '<>') return `${column} IS NOT NULL`;
  }

  // So sánh chuỗi trên cột không phải text (vd. manv là smallint) vẫn hoạt động
  // vì tham số gửi đi ở dạng "unknown" và PostgreSQL tự suy kiểu theo cột.
  return `${column} ${comparison} ${params.add(value)}`;
};

const buildWhere = (filters, ctx) => {
  if (!Array.isArray(filters) || filters.length === 0) return '';

  const clauses = filters.map((filter) => {
    const { type } = filter;

    if (type === 'or') {
      const terms = splitTopLevel(String(filter.expression || ''));
      if (terms.length === 0) return 'TRUE';
      return `(${terms.map((t) => buildPostgrestTerm(t, ctx)).join(' OR ')})`;
    }

    if (type === 'match') {
      const entries = Object.entries(filter.value || {});
      if (entries.length === 0) return 'TRUE';
      return `(${entries
        .map(([col, val]) => {
          const column = quoteIdent(resolveColumn(ctx.schema, ctx.table, col));
          return buildOperator(column, 'eq', val, ctx.params, false);
        })
        .join(' AND ')})`;
    }

    if (type === 'filter') {
      // .filter(col, op, value) -> value theo cú pháp PostgREST dạng chuỗi
      const column = quoteIdent(resolveColumn(ctx.schema, ctx.table, filter.column));
      return buildOperator(column, filter.operator, filter.value, ctx.params, true);
    }

    const column = quoteIdent(resolveColumn(ctx.schema, ctx.table, filter.column));
    return buildOperator(column, type, filter.value, ctx.params, false);
  });

  return ` WHERE ${clauses.join(' AND ')}`;
};

const buildOrderBy = (order, ctx) => {
  if (!Array.isArray(order) || order.length === 0) return '';
  const parts = order.map((entry) => {
    const column = quoteIdent(resolveColumn(ctx.schema, ctx.table, entry.column));
    const direction = entry.ascending === false ? 'DESC' : 'ASC';
    // Mặc định của PostgREST: NULLS LAST khi ASC, NULLS FIRST khi DESC.
    const nullsFirst =
      entry.nullsFirst === undefined ? entry.ascending === false : Boolean(entry.nullsFirst);
    return `${column} ${direction} NULLS ${nullsFirst ? 'FIRST' : 'LAST'}`;
  });
  return ` ORDER BY ${parts.join(', ')}`;
};

const buildSelectList = (columns, ctx) => {
  const raw = String(columns == null ? '*' : columns).trim();
  if (raw === '' || raw === '*') return '*';
  const names = raw.split(',').map((c) => c.trim()).filter(Boolean);
  if (names.some((n) => n === '*')) return '*';
  return names.map((n) => quoteIdent(resolveColumn(ctx.schema, ctx.table, n))).join(', ');
};

/** Nhóm các bản ghi insert theo tập cột giống nhau để giữ đúng giá trị DEFAULT. */
const groupRowsByShape = (rows) => {
  const groups = new Map();
  for (const row of rows) {
    const keys = Object.keys(row).filter((k) => row[k] !== undefined);
    const signature = keys.slice().sort().join('\u0000');
    if (!groups.has(signature)) groups.set(signature, { keys, rows: [] });
    groups.get(signature).rows.push(row);
  }
  return [...groups.values()];
};

/**
 * Trả về một mảng câu lệnh { text, values } cần chạy, kèm cờ mô tả cách gộp kết quả.
 */
export const buildStatements = (descriptor, schema) => {
  const table = resolveTable(schema, descriptor.table);
  const action = String(descriptor.action || 'select').toLowerCase();
  const quotedTable = quoteIdent(table);

  if (action === 'select') {
    const params = new ParamList();
    const ctx = { schema, table, params };

    const where = buildWhere(descriptor.filters, ctx);
    let orderBy = buildOrderBy(descriptor.order, ctx);

    const hasPaging = descriptor.limit != null || descriptor.offset != null;
    if (!orderBy && hasPaging) {
      // Phân trang mà không ORDER BY thì thứ tự không xác định giữa các lần gọi,
      // có thể bỏ sót hoặc lặp bản ghi. Sắp theo khoá chính để kết quả ổn định.
      const pk = getPrimaryKey(schema, table);
      if (pk.length) orderBy = ` ORDER BY ${pk.map(quoteIdent).join(', ')}`;
    }

    const statements = [];

    if (descriptor.count) {
      const countParams = new ParamList();
      const countWhere = buildWhere(descriptor.filters, { schema, table, params: countParams });
      statements.push({
        role: 'count',
        text: `SELECT count(*)::bigint AS exact_count FROM ${quotedTable}${countWhere}`,
        values: countParams.values,
      });
    }

    if (!descriptor.head) {
      let text = `SELECT ${buildSelectList(descriptor.columns, ctx)} FROM ${quotedTable}${where}${orderBy}`;
      if (descriptor.limit != null) text += ` LIMIT ${params.add(descriptor.limit)}`;
      if (descriptor.offset != null) text += ` OFFSET ${params.add(descriptor.offset)}`;
      statements.push({ role: 'rows', text, values: params.values });
    }

    return statements;
  }

  if (action === 'insert') {
    const input = Array.isArray(descriptor.values) ? descriptor.values : [descriptor.values];
    const rows = input.filter((r) => r && typeof r === 'object');
    if (rows.length === 0) throw new SchemaError('INSERT không có dữ liệu.', '22023');

    const returning = descriptor.returning
      ? ` RETURNING ${buildSelectList(descriptor.columns, { schema, table })}`
      : '';

    return groupRowsByShape(rows).map(({ keys, rows: group }) => {
      const params = new ParamList();
      const columns = keys.map((k) => quoteIdent(resolveColumn(schema, table, k)));
      if (columns.length === 0) {
        return { role: 'rows', text: `INSERT INTO ${quotedTable} DEFAULT VALUES${returning}`, values: [] };
      }
      const tuples = group
        .map((row) => `(${keys.map((k) => params.add(row[k])).join(', ')})`)
        .join(', ');
      return {
        role: 'rows',
        text: `INSERT INTO ${quotedTable} (${columns.join(', ')}) VALUES ${tuples}${returning}`,
        values: params.values,
      };
    });
  }

  if (action === 'update') {
    const values = descriptor.values || {};
    const keys = Object.keys(values).filter((k) => values[k] !== undefined);
    if (keys.length === 0) throw new SchemaError('UPDATE không có cột nào để cập nhật.', '22023');
    if (!Array.isArray(descriptor.filters) || descriptor.filters.length === 0) {
      throw new SchemaError('UPDATE bắt buộc phải có điều kiện lọc (tránh cập nhật toàn bảng).', '21000');
    }

    const params = new ParamList();
    const ctx = { schema, table, params };
    const assignments = keys
      .map((k) => `${quoteIdent(resolveColumn(schema, table, k))} = ${params.add(values[k])}`)
      .join(', ');
    const where = buildWhere(descriptor.filters, ctx);
    const returning = descriptor.returning ? ` RETURNING ${buildSelectList(descriptor.columns, ctx)}` : '';

    return [{ role: 'rows', text: `UPDATE ${quotedTable} SET ${assignments}${where}${returning}`, values: params.values }];
  }

  if (action === 'delete') {
    if (!Array.isArray(descriptor.filters) || descriptor.filters.length === 0) {
      throw new SchemaError('DELETE bắt buộc phải có điều kiện lọc (tránh xoá toàn bảng).', '21000');
    }
    const params = new ParamList();
    const ctx = { schema, table, params };
    const where = buildWhere(descriptor.filters, ctx);
    const returning = descriptor.returning ? ` RETURNING ${buildSelectList(descriptor.columns, ctx)}` : '';

    return [{ role: 'rows', text: `DELETE FROM ${quotedTable}${where}${returning}`, values: params.values }];
  }

  throw new SchemaError(`Hành động không được hỗ trợ: "${descriptor.action}"`, '22023');
};
