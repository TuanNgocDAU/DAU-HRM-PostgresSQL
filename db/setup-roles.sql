-- ============================================================================
-- Tạo role cho PostgREST truy cập database "qlns"
-- ----------------------------------------------------------------------------
-- Chạy 1 lần bằng psql (kết nối vào database qlns bằng user postgres):
--
--   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d qlns -f setup-roles.sql
--
-- Nếu psql hỏi mật khẩu: nhập mật khẩu của user postgres.
-- ============================================================================

-- 1) Role "web_anon": role mà mọi request đi qua. App tự kiểm soát đăng nhập/
--    phân quyền ở tầng ứng dụng, nên ở DB ta cấp đủ quyền CRUD trên schema public.
--    (Phù hợp cho ứng dụng chạy nội bộ trên máy local.)
DROP ROLE IF EXISTS web_anon;
CREATE ROLE web_anon NOLOGIN;

GRANT USAGE ON SCHEMA public TO web_anon;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public TO web_anon;

GRANT USAGE, SELECT
  ON ALL SEQUENCES IN SCHEMA public TO web_anon;

-- Áp dụng cho cả các bảng/sequence tạo mới sau này.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO web_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO web_anon;

-- 2) Role "authenticator": role đăng nhập mà PostgREST dùng để kết nối, sau đó
--    tự chuyển sang web_anon. ĐỔI mật khẩu bên dưới cho khớp với postgrest.conf.
DROP ROLE IF EXISTS authenticator;
CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD '1102';
GRANT web_anon TO authenticator;

-- Kiểm tra nhanh:
--   \du   -- xem danh sách role, phải thấy web_anon và authenticator
