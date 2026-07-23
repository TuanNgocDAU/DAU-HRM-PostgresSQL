# Hướng dẫn kết nối app với PostgreSQL local (database `qlns`)

## Vì sao cần bước này?
App là **frontend chạy trong trình duyệt**, mà trình duyệt **không thể** mở kết nối
trực tiếp tới PostgreSQL. Vì vậy cần một **lớp API HTTP** đứng giữa. Ta dùng
**PostgREST** — đúng công nghệ Supabase dùng bên trong — nên thư viện
`@supabase/supabase-js` sẵn có trong app **không phải sửa gì**, chỉ đổi endpoint.

```
Trình duyệt ──(HTTP /rest/v1/...)──▶ Vite (cổng 3000, proxy) ──▶ PostgREST (cổng 3001) ──▶ PostgreSQL qlns (cổng 5432)
```

Code đã được chỉnh để **chỉ dùng PostgreSQL local** (database `qlns`). Toàn bộ
kết nối Supabase cloud đã được loại bỏ — app luôn đọc/ghi qua PostgREST ở máy local.

---

## Các bước thực hiện (chỉ làm 1 lần)

### Bước 1 — Tạo role cho PostgREST trong database qlns
Mở PowerShell/CMD và chạy (nhập mật khẩu user `postgres` khi được hỏi):

```
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d qlns -f "db\setup-roles.sql"
```

> Trước khi chạy, mở `db/setup-roles.sql` và đổi `'doi_mat_khau_o_day'` thành một
> mật khẩu tùy ý cho role `authenticator`.

### Bước 2 — Cấu hình PostgREST
Mở `db/postgrest.conf`, sửa chuỗi `db-uri` cho khớp mật khẩu vừa đặt ở Bước 1:
```
db-uri = "postgres://authenticator:MAT_KHAU_VUA_DAT@localhost:5432/qlns"
```

### Bước 3 — Cài PostgREST
1. Tải bản Windows tại: https://github.com/PostgREST/postgrest/releases
   (chọn file `postgrest-vX.X.X-windows-x64.zip`).
2. Giải nén, copy `postgrest.exe` vào thư mục `db/` của dự án này.

### Bước 4 — (Không cần bật/tắt gì thêm)
App đã được cấu hình **chỉ dùng PostgreSQL local**, không còn tùy chọn cloud.
Nếu PostgREST chạy ở cổng khác 3001, đặt `POSTGREST_URL` trong `.env.local`, ví dụ:
```
POSTGREST_URL=http://127.0.0.1:3001
```

---

## Chạy hằng ngày

Mở **2 cửa sổ**, giữ cả hai cùng chạy:

1. **PostgREST** (lớp API tới database):
   - Nháy đúp `db/start-postgrest.bat`
   - Kiểm tra: mở trình duyệt vào http://127.0.0.1:3001/DanhMucTrinhDo
     → thấy JSON dữ liệu là OK.

2. **App**:
   ```
   npm run dev
   ```
   Mở http://localhost:3000

Xong. App giờ đọc/ghi trực tiếp trên database `qlns` ở máy bạn.

---

## Kiểm tra & xử lý sự cố

| Hiện tượng | Nguyên nhân / cách xử lý |
|---|---|
| App không lấy được dữ liệu | Chưa chạy `start-postgrest.bat`, hoặc chưa **khởi động lại** `npm run dev` sau khi sửa `.env.local`. |
| Lỗi 500 / "connection refused" ở `/rest/v1/...` | PostgREST chưa chạy, hoặc sai mật khẩu trong `db-uri`. |
| `password authentication failed` | Mật khẩu trong `postgrest.conf` không khớp mật khẩu role `authenticator` trong `setup-roles.sql`. |
| `permission denied for table ...` | Chưa chạy `setup-roles.sql`, hoặc bảng nằm ở schema khác `public`. |
| `relation "..." does not exist` | Tên bảng trong qlns khác với app (app dùng tên PascalCase: `Users`, `DanhSachNhanVien`, `DanhMucTrinhDo`...). Cần đối chiếu schema. |

> **Lưu ý bảo mật:** cấu hình này cấp full quyền CRUD cho `web_anon` và chỉ nghe
> ở `127.0.0.1`. Phù hợp cho ứng dụng nội bộ chạy trên máy local. **Không** phơi
> PostgREST ra Internet với cấu hình này.
