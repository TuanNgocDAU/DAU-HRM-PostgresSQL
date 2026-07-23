# Hệ thống Quản lý Nhân sự — DAU (bản chạy với PostgreSQL local)

Ứng dụng chạy hoàn toàn trên máy local: dữ liệu nằm trong database PostgreSQL
`qlns`, không còn phụ thuộc Supabase hay bất kỳ dịch vụ đám mây nào.

## Kiến trúc

Trình duyệt không mở được kết nối TCP tới PostgreSQL, nên hệ thống gồm 2 tiến trình:

```
Trình duyệt ──> Vite dev server (cổng 3000)
                    │  proxy /api
                    ▼
                API server Node/Express (cổng 3001, chỉ nghe 127.0.0.1)
                    │  driver `pg`
                    ▼
                PostgreSQL 18 — database "qlns"
```

- `services/database.ts` — client phía trình duyệt. Giữ nguyên cú pháp builder cũ
  (`.from().select().eq().order().range().maybeSingle()`…) nên các component
  không phải sửa logic truy vấn. Mỗi truy vấn được đóng gói thành JSON gửi tới `/api/query`.
- `server/queryBuilder.js` — dịch JSON đó thành SQL **tham số hoá**.
- `server/schema.js` — đối chiếu mọi tên bảng/cột với schema thật trước khi đưa vào SQL
  (vừa chống SQL injection, vừa cho phép code viết tên cột chữ thường).
- `server/db.js` — connection pool `pg`.

## Yêu cầu

- Node.js
- PostgreSQL 18 đã cài tại `C:\Program Files\PostgreSQL\18`, đang chạy, có database `qlns`.

## Cài đặt

1. Cài thư viện:

   ```bash
   npm install
   ```

2. Tạo file cấu hình từ mẫu rồi điền giá trị thật:

   ```bash
   cp .env.example .env.local
   ```

   Các biến trong `.env.local`:

   | Biến           | Mặc định    | Ý nghĩa                                  |
   | -------------- | ----------- | ---------------------------------------- |
   | `PGHOST`       | `localhost` | Máy chủ PostgreSQL                       |
   | `PGPORT`       | `5432`      | Cổng PostgreSQL                          |
   | `PGDATABASE`   | `qlns`      | Tên database                             |
   | `PGUSER`       | `postgres`  | Tài khoản đăng nhập PostgreSQL           |
   | `PGPASSWORD`   | *(trống)*   | Mật khẩu PostgreSQL                      |
   | `PGSCHEMA`     | `public`    | Schema chứa các bảng                     |
   | `PGPOOL_MAX`   | `10`        | Số kết nối tối đa trong pool             |
   | `API_PORT`     | `3001`      | Cổng API server (Vite proxy trỏ tới đây) |
   | `API_HOST`     | `127.0.0.1` | Địa chỉ API server lắng nghe             |
   | `GEMINI_API_KEY` | *(trống)* | Chỉ dùng cho chức năng OCR/dịch trong Công cụ |

   > `.env.local` khớp mẫu `*.local` trong `.gitignore` nên mật khẩu không bị commit.

3. Chạy ứng dụng (khởi động đồng thời API server và web):

   ```bash
   npm run dev
   ```

   Mở http://localhost:3000

## Các lệnh khác

| Lệnh              | Tác dụng                                       |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Chạy đồng thời API server + web (dùng hằng ngày) |
| `npm run server`  | Chỉ chạy API server                            |
| `npm run web`     | Chỉ chạy Vite                                  |
| `npm run build`   | Đóng gói bản production vào `dist/`            |
| `npm run lint`    | Kiểm tra kiểu TypeScript (`tsc --noEmit`)      |

## Kiểm tra kết nối

```bash
curl http://localhost:3000/api/health
```

Trả về tên database và số bảng đọc được, ví dụ:

```json
{ "ok": true, "database": "qlns", "tables": 43 }
```

## Xử lý sự cố

- **"Không kết nối được máy chủ dữ liệu local"** — API server chưa chạy. Dùng
  `npm run dev` (hoặc `npm run server`).
- **API báo không kết nối được PostgreSQL** — kiểm tra dịch vụ PostgreSQL đã bật
  và các biến `PGHOST` / `PGPORT` / `PGDATABASE` / `PGUSER` / `PGPASSWORD`.
- **Báo bảng hoặc cột không tồn tại** — schema được cache lúc khởi động và tự nạp
  lại khi gặp tên lạ; nếu cần ép làm mới:
  `curl -X POST http://localhost:3000/api/schema/refresh`
- **Cổng 3000 đang bị chiếm** — Vite sẽ báo lỗi và dừng (`strictPort`) thay vì
  âm thầm nhảy sang cổng khác rồi đụng cổng API. Hãy giải phóng cổng 3000
  hoặc đổi cổng trong `vite.config.ts`.
