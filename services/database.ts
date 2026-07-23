/**
 * Client truy xuất dữ liệu cho database PostgreSQL local "qlns".
 *
 * Trình duyệt không thể mở kết nối TCP tới PostgreSQL, nên mọi truy vấn được
 * đóng gói thành một "query descriptor" JSON và gửi tới API server Node
 * (thư mục `server/`), nơi nó được dịch thành SQL tham số hoá và thực thi
 * bằng driver `pg`.
 *
 * Giao diện của builder giữ nguyên như bộ query builder mà dự án vốn dùng
 * (.from().select().eq().order().range().maybeSingle()...) để toàn bộ
 * component hiện có chạy không cần sửa logic truy vấn.
 */

const API_BASE: string =
  (import.meta as any)?.env?.VITE_API_BASE_URL || '/api';

export interface DbError {
  message: string;
  code: string | null;
  details: string | null;
  hint: string | null;
}

export interface DbResponse<T = any> {
  data: T;
  error: DbError | null;
  count: number | null;
}

type FilterType =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'is'
  | 'in'
  | 'or'
  | 'match'
  | 'filter';

interface Filter {
  type: FilterType;
  column?: string;
  value?: any;
  operator?: string;
  expression?: string;
}

interface OrderSpec {
  column: string;
  ascending: boolean;
  nullsFirst?: boolean;
}

interface Descriptor {
  table: string;
  action: 'select' | 'insert' | 'update' | 'delete';
  columns?: string;
  values?: any;
  filters: Filter[];
  order: OrderSpec[];
  limit?: number;
  offset?: number;
  single?: 'one' | 'maybe';
  returning?: boolean;
  count?: 'exact' | null;
  head?: boolean;
}

const toError = (message: string, code: string | null = null): DbError => ({
  message,
  code,
  details: null,
  hint: null,
});

class QueryBuilder<T = any> implements PromiseLike<DbResponse<T>> {
  private descriptor: Descriptor;
  private pending: Promise<DbResponse<T>> | null = null;

  constructor(table: string) {
    this.descriptor = { table, action: 'select', filters: [], order: [] };
  }

  // ---- Chọn hành động -------------------------------------------------

  select(columns = '*', options?: { count?: 'exact'; head?: boolean }): this {
    this.descriptor.columns = columns;
    if (this.descriptor.action === 'select') {
      this.descriptor.count = options?.count ?? null;
      this.descriptor.head = options?.head ?? false;
    } else {
      // .insert(...).select() / .update(...).select() -> yêu cầu RETURNING
      this.descriptor.returning = true;
    }
    return this;
  }

  insert(values: any): this {
    this.descriptor.action = 'insert';
    this.descriptor.values = values;
    return this;
  }

  update(values: any): this {
    this.descriptor.action = 'update';
    this.descriptor.values = values;
    return this;
  }

  delete(): this {
    this.descriptor.action = 'delete';
    return this;
  }

  // ---- Bộ lọc ---------------------------------------------------------

  private addFilter(filter: Filter): this {
    this.descriptor.filters.push(filter);
    return this;
  }

  eq(column: string, value: any) { return this.addFilter({ type: 'eq', column, value }); }
  neq(column: string, value: any) { return this.addFilter({ type: 'neq', column, value }); }
  gt(column: string, value: any) { return this.addFilter({ type: 'gt', column, value }); }
  gte(column: string, value: any) { return this.addFilter({ type: 'gte', column, value }); }
  lt(column: string, value: any) { return this.addFilter({ type: 'lt', column, value }); }
  lte(column: string, value: any) { return this.addFilter({ type: 'lte', column, value }); }
  like(column: string, pattern: string) { return this.addFilter({ type: 'like', column, value: pattern }); }
  ilike(column: string, pattern: string) { return this.addFilter({ type: 'ilike', column, value: pattern }); }
  is(column: string, value: any) { return this.addFilter({ type: 'is', column, value }); }
  in(column: string, values: any[]) { return this.addFilter({ type: 'in', column, value: values }); }
  match(criteria: Record<string, any>) { return this.addFilter({ type: 'match', value: criteria }); }

  /** Cú pháp PostgREST: `cot.toantu.giatri,cot2.toantu.giatri` */
  or(expression: string) { return this.addFilter({ type: 'or', expression }); }

  /** Cú pháp PostgREST: .filter('cot', 'eq', 'giatri') */
  filter(column: string, operator: string, value: any) {
    return this.addFilter({ type: 'filter', column, operator, value });
  }

  not(column: string, operator: string, value: any) {
    return this.addFilter({ type: 'or', expression: `${column}.not.${operator}.${value}` });
  }

  // ---- Sắp xếp / phân trang -------------------------------------------

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): this {
    this.descriptor.order.push({
      column,
      ascending: options?.ascending !== false,
      nullsFirst: options?.nullsFirst,
    });
    return this;
  }

  limit(count: number): this {
    this.descriptor.limit = count;
    return this;
  }

  /** range(from, to) — bao gồm cả hai đầu, giống Supabase. */
  range(from: number, to: number): this {
    this.descriptor.offset = from;
    this.descriptor.limit = Math.max(0, to - from + 1);
    return this;
  }

  single(): this {
    this.descriptor.single = 'one';
    return this;
  }

  maybeSingle(): this {
    this.descriptor.single = 'maybe';
    return this;
  }

  // ---- Thực thi -------------------------------------------------------

  private async execute(): Promise<DbResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.descriptor),
      });

      const payload = await response.json().catch(() => null);

      if (!payload) {
        return {
          data: null as T,
          error: toError(`Máy chủ dữ liệu trả về phản hồi không hợp lệ (HTTP ${response.status}).`),
          count: null,
        };
      }

      return {
        data: (payload.data ?? null) as T,
        error: payload.error ?? null,
        count: payload.count ?? null,
      };
    } catch (err: any) {
      return {
        data: null as T,
        error: toError(
          `Không kết nối được máy chủ dữ liệu local. Hãy chắc chắn đã chạy "npm run server". (${err?.message || err})`,
          'ECONNREFUSED'
        ),
        count: null,
      };
    }
  }

  then<TResult1 = DbResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: DbResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    if (!this.pending) this.pending = this.execute();
    return this.pending.then(onfulfilled, onrejected);
  }
}

class DatabaseClient {
  from<T = any>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(table);
  }

  /** Kiểm tra nhanh tình trạng kết nối tới PostgreSQL local. */
  async health(): Promise<{ ok: boolean; database?: string; tables?: number; error?: DbError }> {
    try {
      const response = await fetch(`${API_BASE}/health`);
      return await response.json();
    } catch (err: any) {
      return { ok: false, error: toError(err?.message || String(err)) };
    }
  }
}

export const db = new DatabaseClient();

/** Đưa mọi key của object về chữ thường. */
export const normalizeKeys = (obj: any) => {
  if (!obj || typeof obj !== 'object') return obj;
  const newObj: any = {};
  Object.keys(obj).forEach((key) => {
    newObj[key.toLowerCase()] = obj[key];
  });
  return newObj;
};
