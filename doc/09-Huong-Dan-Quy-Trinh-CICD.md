# TÀI LIỆU HƯỚNG DẪN QUY TRÌNH CI/CD
# HỆ THỐNG QUẢN LÝ NHÂN SỰ – TRƯỜNG ĐẠI HỌC KIẾN TRÚC ĐÀ NẴNG (DAU HRM)

| Thông tin | Chi tiết |
|-----------|----------|
| **Mã tài liệu** | CICD-DAU-HRM-09 |
| **Tên hệ thống** | Hệ thống Quản lý Nhân sự DAU (DAU Human Resource Management) |
| **Đơn vị chủ quản** | Trường Đại học Kiến trúc Đà Nẵng (DAU) |
| **Loại ứng dụng** | Ứng dụng Web SPA (React 19 + TypeScript + Vite) |
| **Kho mã nguồn** | https://github.com/TuanNgocDAU/DAU-HRM-PostgresSQL |
| **Cơ sở dữ liệu** | PostgreSQL 18 – database `qlns` tại `C:\Program Files\PostgreSQL\18` |
| **Phiên bản tài liệu** | 2.0 |
| **Ngày lập** | 23/07/2026 |
| **Người lập** | Bộ phận Kỹ thuật / DevOps |
| **Trạng thái** | Đã áp dụng – workflow CI/CD nằm tại `.github/workflows/` |

---

## 1. Mục đích và phạm vi

### 1.1. Mục đích

Tài liệu mô tả **quy trình CI/CD (Continuous Integration / Continuous Delivery)** áp dụng cho hệ thống DAU HRM, nhằm:

- Chuẩn hóa quy trình **tích hợp mã nguồn → kiểm tra chất lượng → đóng gói → phát hành**.
- Tự động hóa các bước lặp lại, giảm lỗi thao tác thủ công khi build và triển khai.
- Bảo đảm mọi thay đổi vào nhánh `main` đều đã qua **type check** và **build thành công**.
- Cung cấp bộ cấu hình mẫu (GitHub Actions + script PowerShell) sẵn sàng áp dụng cho kho `DAU-HRM-PostgresSQL`.
- Chuẩn hóa quy trình **sao lưu / phục hồi database `qlns`** gắn liền với mỗi lần phát hành.

### 1.2. Phạm vi

| Trong phạm vi | Ngoài phạm vi |
|---------------|---------------|
| Build & kiểm tra kiểu ứng dụng web (SPA) | Phát triển tính năng nghiệp vụ mới |
| Đóng gói và triển khai API server Node/Express | Quản trị hạ tầng mạng nội bộ của Trường |
| Vận hành PostgreSQL trong chu trình phát hành (backup/migration) | Thiết kế lại mô hình dữ liệu (xem `04-ERD-So-Do-Du-Lieu.md`) |
| Quản lý bí mật (secrets) và biến môi trường | Chính sách bảo mật tổng thể của DAU |

### 1.3. Hiện trạng tại thời điểm lập tài liệu

Hai tệp workflow đã được tạo trong kho mã:

| Tệp | Vai trò | Trạng thái |
|-----|---------|------------|
| `.github/workflows/ci.yml` | Kiểm tra kiểu + build trên mọi push/PR (mục 6) | ✅ Sẵn sàng chạy trên GitHub-hosted runner |
| `.github/workflows/deploy.yml` | Phát hành lên máy chủ nội bộ (mục 8.1) | ⚠️ Chỉ chạy thủ công (`workflow_dispatch`); cần hoàn tất chuẩn bị máy chủ ở mục 7 trước khi dùng |

> **Điều kiện để `deploy.yml` chạy được:** phải có (1) self-hosted runner gắn nhãn `dau-hrm-prod` — mục 7.2; (2) dịch vụ Windows `DAU-HRM-API` đăng ký qua NSSM — mục 7.3; (3) secret `PGPASSWORD` và environment `production` — mục 9.3 và 12.2. Vì workflow **không** có trigger tự động, khi chưa đủ điều kiện thì nó đơn giản là không bao giờ chạy — không phát sinh lần chạy lỗi nào và không ảnh hưởng tới `ci.yml`.

---

## 2. Tổng quan công nghệ liên quan

### 2.1. Ngăn xếp công nghệ

| Hạng mục | Giá trị |
|----------|---------|
| **Frontend** | React 19 + TypeScript 5.8 + Tailwind CSS 4 |
| **Công cụ build** | Vite 6 (`npm run build` → thư mục `dist/`) |
| **Backend API** | Node.js + Express 5 (`server/index.js`, cổng 3001, chỉ nghe `127.0.0.1`) |
| **Truy cập dữ liệu** | Driver `pg` (connection pool) → PostgreSQL |
| **Cơ sở dữ liệu** | PostgreSQL 18, database `qlns`, schema `public` |
| **Runtime build** | Node.js LTS ≥ 20 |
| **Trình quản lý gói** | npm (đã có `package-lock.json`) |
| **Kiểm tra kiểu** | `npm run lint` = `tsc --noEmit` |
| **Dịch vụ ngoài** | Google Gemini API (chỉ dùng cho chức năng OCR/trích xuất trong nhóm Công cụ) |

### 2.2. Các script trong `package.json`

| Script | Lệnh | Vai trò trong CI/CD |
|--------|------|---------------------|
| `dev` | `concurrently ... npm:server npm:web` | Chạy đồng thời API + web khi phát triển (không dùng trong CI) |
| `server` | `node server/index.js` | **Chạy API server** – dùng ở môi trường triển khai |
| `web` | `vite` | Chỉ chạy dev server web |
| `build` | `vite build` | **Bước build chính** – sinh `dist/` |
| `preview` | `vite preview` | Phục vụ bản build kèm proxy `/api` (kiểm thử / triển khai đơn giản) |
| `lint` | `tsc --noEmit` | **Cổng chất lượng** – kiểm tra kiểu TypeScript |

> Dự án **chưa có** bộ kiểm thử tự động. Bước `npm test` sẽ được bổ sung khi áp dụng Vitest (xem mục 13 – Lộ trình nâng cấp).

### 2.3. Kiến trúc triển khai

Trình duyệt không mở được kết nối TCP tới PostgreSQL, nên hệ thống gồm **3 thành phần chạy song song**:

```
┌──────────────┐      HTTP        ┌───────────────────────────┐
│  Trình duyệt  │ ───────────────► │  Web server phục vụ dist/  │
│  người dùng   │                  │  (Nginx / IIS / vite preview)│
└──────────────┘                  └─────────────┬─────────────┘
                                                 │ proxy /api
                                                 ▼
                                   ┌───────────────────────────┐
                                   │  API server Node/Express   │
                                   │  cổng 3001 – 127.0.0.1     │
                                   └─────────────┬─────────────┘
                                                 │ driver `pg` (cổng 5432)
                                                 ▼
                                   ┌───────────────────────────┐
                                   │  PostgreSQL 18 – DB `qlns` │
                                   │  C:\Program Files\PostgreSQL\18 │
                                   └───────────────────────────┘
```

**Hệ quả đối với CI/CD:**

1. CI chỉ cần **build phần web tĩnh** (`dist/`) và kiểm tra kiểu — không cần kết nối database.
2. CD phải triển khai **hai thứ**: nội dung `dist/` (tĩnh) và **mã nguồn API server** (`server/`, `package.json`, `node_modules` production).
3. Database `qlns` nằm **trên máy chủ nội bộ**, không phơi ra Internet ⇒ GitHub-hosted runner **không thể** kết nối tới. Vì vậy CD dùng **self-hosted runner** hoặc **script phát hành thủ công** (mục 8).

---

## 3. Môi trường triển khai

| Môi trường | Mục đích | Máy chủ | Database | Cách phát hành |
|------------|----------|---------|----------|----------------|
| **Development** | Lập trình viên phát triển hằng ngày | Máy cá nhân | `qlns` bản local của LTV | `npm run dev` |
| **Staging (UAT)** | Nghiệm thu với phòng TCHC trước khi phát hành | Máy chủ nội bộ (hoặc máy dùng chung) | `qlns_uat` (bản sao dữ liệu đã che thông tin nhạy cảm) | CD thủ công / workflow_dispatch |
| **Production** | Vận hành thật | Máy chủ nội bộ DAU (Windows Server) | `qlns` tại `C:\Program Files\PostgreSQL\18` | CD kích hoạt thủ công (`workflow_dispatch`) từ `main`, có phê duyệt |

**Nguyên tắc:**
- Ba môi trường dùng **cùng một mã nguồn**, chỉ khác **biến môi trường** (`.env.local`).
- Không bao giờ trỏ môi trường Development/Staging vào database `qlns` production.
- Dữ liệu đưa xuống Staging phải được **che (mask)** các trường nhạy cảm: CMND/CCCD, số tài khoản, mật khẩu, số điện thoại cá nhân.

---

## 4. Chiến lược nhánh (Branching Strategy)

Áp dụng mô hình **GitHub Flow** đơn giản, phù hợp quy mô đội dự án:

```
main  ──────●────────────●────────────●───────►  (nhánh phát hành, luôn ổn định)
             \          /  \          /
feature/xxx   ●──●──●──●     ●──●──●──●          (nhánh tính năng)
```

| Nhánh | Vai trò | Quy tắc |
|-------|---------|---------|
| `main` | Nhánh chính, luôn ở trạng thái phát hành được | Chỉ hợp nhất qua Pull Request đã pass CI |
| `feature/*` | Phát triển tính năng / sửa lỗi | Đặt tên rõ ràng: `feature/230726_BaoHiem` |
| `hotfix/*` | Sửa lỗi khẩn cấp trên production | Tạo từ `main`, merge lại `main` ngay khi CI xanh |

**Quy ước đặt tên commit** (khuyến nghị Conventional Commits):

```
feat(baoHiem): thêm chức năng tổng hợp số liệu bắt buộc
fix(hdld): sửa sai lệch ngày khi lưu hợp đồng
docs(cicd): cập nhật quy trình phát hành
chore(deps): nâng cấp vite lên 6.2
```

**Nguyên tắc:**
- Không commit trực tiếp lên `main`.
- Mỗi tính năng phát triển trên một nhánh `feature/*` riêng, mở **Pull Request** vào `main`.
- Pull Request chỉ được merge khi **toàn bộ kiểm tra CI thành công**.
- Xóa nhánh `feature/*` sau khi merge để kho mã gọn gàng.

---

## 5. Sơ đồ quy trình CI/CD

```
┌──────────────┐   git push /    ┌──────────────────────────────────────────┐
│  Lập trình    │   pull request  │            GITHUB ACTIONS                 │
│  viên (local) ├────────────────►│                                          │
└──────────────┘                  │  ┌────────────────────────────────────┐  │
        ▲                         │  │  CI – Kiểm tra chất lượng           │  │
        │                         │  │  1. Checkout mã nguồn               │  │
        │                         │  │  2. Cài Node 20 + cache npm         │  │
        │  Phản hồi (pass/fail)   │  │  3. npm ci                          │  │
        │◄────────────────────────┤  │  4. npm run lint  (tsc --noEmit)    │  │
        │                         │  │  5. npm run build (vite → dist/)    │  │
        │                         │  │  6. npm audit (cảnh báo)            │  │
        │                         │  │  7. Lưu artifact dist/              │  │
        │                         │  └──────────────────┬─────────────────┘  │
        │                         │        (chỉ khi merge vào main)          │
        │                         │  ┌──────────────────▼─────────────────┐  │
        │                         │  │  CD – Phát hành (self-hosted runner)│  │
        │                         │  │  8.  Chờ phê duyệt (environment)    │  │
        │                         │  │  9.  Backup database qlns (pg_dump) │  │
        │                         │  │  10. Dừng dịch vụ API               │  │
        │                         │  │  11. Cập nhật dist/ + server/       │  │
        │                         │  │  12. npm ci --omit=dev              │  │
        │                         │  │  13. Chạy migration (nếu có)        │  │
        │                         │  │  14. Khởi động lại dịch vụ API      │  │
        │                         │  │  15. Health check /api/health       │  │
        │                         │  └────────────────────────────────────┘  │
        │                         └──────────────────────────────────────────┘
        │                                            │ thất bại
        └────────────────── Rollback (mục 11) ◄──────┘
```

### 5.1. Giai đoạn CI (Continuous Integration)

Kích hoạt trên **mọi `push`** lên `main`/`feature/**` và **mọi Pull Request** vào `main`:

| Bước | Hành động | Mục tiêu |
|:----:|-----------|----------|
| 1 | `actions/checkout@v4` | Lấy mã nguồn |
| 2 | `actions/setup-node@v4` (Node 20, cache npm) | Chuẩn bị môi trường build |
| 3 | `npm ci` | Cài đặt **chính xác** theo `package-lock.json` |
| 4 | `npm run lint` | Cổng chất lượng – phát hiện lỗi kiểu TypeScript |
| 5 | `npm run build` | Bảo đảm mã build được thành `dist/` |
| 6 | `npm audit --audit-level=high` | Cảnh báo lỗ hổng phụ thuộc (không chặn build) |
| 7 | `actions/upload-artifact@v4` | Lưu `dist/` để tra cứu / triển khai lại |

### 5.2. Giai đoạn CD (Continuous Delivery)

Được **kích hoạt thủ công** qua `workflow_dispatch` (tab **Actions → CD - Phát hành lên máy chủ nội bộ → Run workflow**, chọn nhánh `main`), thực hiện trên **máy chủ nội bộ** vì database `qlns` chỉ truy cập được từ mạng nội bộ.

> **Vì sao chạy thủ công thay vì tự động khi merge?** Mỗi lần phát hành đều **dừng dịch vụ API** và **ghi vào database production**, nên cần chủ động chọn thời điểm ngoài giờ làm việc của phòng TCHC. Khi quy trình đã ổn định và có kiểm thử tự động, có thể bật lại trigger tự động bằng cách thêm vào đầu `deploy.yml`:
>
> ```yaml
> on:
>   push:
>     branches: ['main']
>   workflow_dispatch:
> ```

---

## 6. Cấu hình CI mẫu (GitHub Actions)

Tạo tệp **`.github/workflows/ci.yml`**:

```yaml
name: CI - Kiểm tra & Build

# Kích hoạt khi push lên nhánh chính/feature và khi mở Pull Request
on:
  push:
    branches: ['main', 'feature/**', 'hotfix/**']
  pull_request:
    branches: ['main']

# Hủy các lần chạy cũ trên cùng một nhánh để tiết kiệm tài nguyên
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    name: Lint & Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout mã nguồn
        uses: actions/checkout@v4

      - name: Cài đặt Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Cài đặt phụ thuộc
        run: npm ci

      - name: Kiểm tra kiểu TypeScript
        run: npm run lint

      - name: Build ứng dụng
        run: npm run build
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}

      - name: Kiểm tra lỗ hổng phụ thuộc (chỉ cảnh báo)
        run: npm audit --audit-level=high || true

      - name: Lưu artifact bản build
        uses: actions/upload-artifact@v4
        with:
          name: dist-${{ github.sha }}
          path: dist/
          retention-days: 14
```

**Giải thích các điểm quan trọng:**

- `npm ci` — cài đặt đúng theo `package-lock.json`, sạch và nhanh hơn `npm install`, bảo đảm build **tái lập được**.
- `cache: 'npm'` — cache thư mục `~/.npm`, rút ngắn thời gian các lần chạy sau.
- `secrets.GEMINI_API_KEY` — khóa API lưu trong **Repository Secrets** (mục 9), không hard-code vào mã. Nếu để trống, ứng dụng vẫn build được; chỉ chức năng OCR/trích xuất bị vô hiệu.
- `concurrency` — khi push liên tiếp, lần chạy cũ bị hủy, tránh xếp hàng.
- **CI không kết nối database**: `vite build` chỉ đóng gói frontend, mọi truy vấn dữ liệu diễn ra lúc runtime qua `/api`.

---

## 7. Chuẩn bị máy chủ triển khai (thực hiện một lần)

### 7.1. Yêu cầu trên máy chủ nội bộ (Windows Server)

| Thành phần | Yêu cầu |
|------------|---------|
| Node.js | LTS ≥ 20 (`node -v` kiểm tra) |
| PostgreSQL | Bản 18 tại `C:\Program Files\PostgreSQL\18`, dịch vụ đang chạy, đã có database `qlns` |
| Git | Để runner checkout mã nguồn |
| Web server | Nginx for Windows **hoặc** IIS (+ URL Rewrite + ARR) |
| NSSM | Đăng ký API server thành Windows Service (https://nssm.cc) |
| Thư mục ứng dụng | `C:\DAU-HRM\app` (mã nguồn + `dist/`), `C:\DAU-HRM\backup` (bản sao lưu) |

### 7.2. Cài GitHub Actions self-hosted runner

```powershell
# Trên máy chủ nội bộ, tạo thư mục runner
New-Item -ItemType Directory -Force C:\actions-runner
cd C:\actions-runner

# Tải runner (lấy URL & token tại: Repo → Settings → Actions → Runners → New self-hosted runner)
# Sau khi giải nén:
.\config.cmd --url https://github.com/TuanNgocDAU/DAU-HRM-PostgresSQL --token <TOKEN> --labels dau-hrm-prod --runasservice
```

> Gán nhãn (`--labels`) `dau-hrm-prod` để workflow CD chọn đúng máy chủ qua `runs-on: [self-hosted, dau-hrm-prod]`.

### 7.3. Đăng ký API server thành dịch vụ Windows (NSSM)

```powershell
# Cài dịch vụ chạy API server
nssm install DAU-HRM-API "C:\Program Files\nodejs\node.exe" "C:\DAU-HRM\app\server\index.js"
nssm set DAU-HRM-API AppDirectory "C:\DAU-HRM\app"
nssm set DAU-HRM-API AppStdout "C:\DAU-HRM\logs\api-out.log"
nssm set DAU-HRM-API AppStderr "C:\DAU-HRM\logs\api-err.log"
nssm set DAU-HRM-API Start SERVICE_AUTO_START
nssm start DAU-HRM-API

# Kiểm tra
Invoke-RestMethod http://127.0.0.1:3001/api/health
```

Kết quả mong đợi của `/api/health`:

```json
{ "ok": true, "database": "qlns", "version": "PostgreSQL 18...", "tables": 40 }
```

### 7.4. Cấu hình Nginx phục vụ SPA + proxy `/api`

Ứng dụng là **SPA** nên cần fallback về `index.html`, đồng thời **proxy `/api` → API server cổng 3001** (tái hiện cấu hình proxy trong `vite.config.ts`):

```nginx
server {
    listen 80;
    server_name hrm.dau.edu.vn;

    root C:/DAU-HRM/app/dist;
    index index.html;

    # Kích thước tối đa cho tải lên PDF/Excel (khớp API_BODY_LIMIT = 25mb)
    client_max_body_size 25m;

    # SPA: mọi route trả về index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy tới API server Node/Express
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
    }
}
```

> **Bảo mật:** API server chỉ nghe `127.0.0.1` (biến `API_HOST`), nên chỉ Nginx trên cùng máy gọi được — không phơi trực tiếp ra mạng LAN. Sau khi có chứng chỉ, chuyển sang HTTPS cổng 443 và ép chuyển hướng từ cổng 80.

### 7.5. Phương án tối giản (không cần Nginx)

Với quy mô nhỏ, có thể dùng chính Vite preview để phục vụ `dist/` kèm proxy `/api` sẵn có:

```powershell
# Cửa sổ 1 (hoặc dịch vụ NSSM): API server
npm run server

# Cửa sổ 2: web tĩnh + proxy /api, cổng 3000
npm run preview
```

> Cách này phù hợp cho Staging hoặc giai đoạn thử nghiệm. Với Production nên dùng Nginx/IIS để có HTTPS, nén gzip và cache tài nguyên tĩnh.

---

## 8. Cấu hình CD mẫu – Phát hành lên máy chủ nội bộ

### 8.1. Workflow `deploy.yml` (self-hosted runner)

Tệp **`.github/workflows/deploy.yml`**:

```yaml
name: CD - Phát hành lên máy chủ nội bộ

# Chỉ chạy thủ công từ tab Actions (Run workflow).
# Chưa bật trigger `push: main` cho tới khi máy chủ nội bộ sẵn sàng (xem mục 7:
# self-hosted runner, dịch vụ NSSM, secret PGPASSWORD, environment production).
on:
  workflow_dispatch:

concurrency:
  group: 'deploy-prod'
  cancel-in-progress: false   # KHÔNG hủy giữa chừng khi đang deploy

jobs:
  deploy:
    name: Build & Deploy Production
    runs-on: [self-hosted, dau-hrm-prod]   # chạy trên máy chủ nội bộ
    environment: production                # bật cơ chế phê duyệt trước khi chạy
    defaults:
      run:
        shell: pwsh

    env:
      APP_DIR: C:\DAU-HRM\app
      BACKUP_DIR: C:\DAU-HRM\backup
      PG_BIN: C:\Program Files\PostgreSQL\18\bin

    steps:
      - name: Checkout mã nguồn
        uses: actions/checkout@v4

      - name: Cài đặt Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Cài đặt phụ thuộc
        run: npm ci

      - name: Kiểm tra kiểu TypeScript
        run: npm run lint

      - name: Build ứng dụng
        run: npm run build
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}

      - name: Sao lưu database qlns trước khi phát hành
        env:
          PGPASSWORD: ${{ secrets.PGPASSWORD }}
        run: |
          $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
          New-Item -ItemType Directory -Force $env:BACKUP_DIR | Out-Null
          & "$env:PG_BIN\pg_dump.exe" -U postgres -h localhost -p 5432 `
              -F c -d qlns -f "$env:BACKUP_DIR\qlns-$stamp.dump"
          if ($LASTEXITCODE -ne 0) { throw "pg_dump that bai" }
          Write-Host "Da sao luu: qlns-$stamp.dump"

      - name: Dừng dịch vụ API
        run: nssm stop DAU-HRM-API

      - name: Cập nhật mã nguồn và bản build
        run: |
          New-Item -ItemType Directory -Force "$env:APP_DIR" | Out-Null
          # Xóa bản build cũ rồi chép bản mới
          Remove-Item -Recurse -Force "$env:APP_DIR\dist" -ErrorAction SilentlyContinue
          Copy-Item -Recurse -Force dist          "$env:APP_DIR\dist"
          Copy-Item -Recurse -Force server        "$env:APP_DIR\server"
          Copy-Item -Force package.json           "$env:APP_DIR\"
          Copy-Item -Force package-lock.json      "$env:APP_DIR\"

      - name: Cài phụ thuộc runtime cho API server
        run: |
          Push-Location "$env:APP_DIR"
          npm ci --omit=dev
          Pop-Location

      - name: Khởi động lại dịch vụ API
        run: nssm start DAU-HRM-API

      - name: Kiểm tra sức khỏe hệ thống (health check)
        run: |
          $ok = $false
          foreach ($i in 1..10) {
            try {
              $r = Invoke-RestMethod http://127.0.0.1:3001/api/health -TimeoutSec 5
              if ($r.ok -and $r.database -eq 'qlns') { $ok = $true; break }
            } catch { Start-Sleep -Seconds 3 }
          }
          if (-not $ok) { throw "Health check that bai - can rollback (muc 11)" }
          Write-Host "He thong hoat dong binh thuong."

      - name: Nạp lại cấu hình Nginx
        if: success()
        run: nginx -s reload
        continue-on-error: true
```

**Giải thích các bước then chốt:**

| Bước | Lý do |
|------|-------|
| `environment: production` | Bắt buộc có người phê duyệt trước khi workflow chạy (cấu hình tại Repo → Settings → Environments) |
| Sao lưu trước khi phát hành | Mọi lần deploy đều có điểm khôi phục; nếu `pg_dump` lỗi thì **dừng ngay**, không deploy |
| `nssm stop` trước khi chép tệp | Tránh lỗi "file đang được sử dụng" khi ghi đè `server/` |
| `npm ci --omit=dev` | Chỉ cài phụ thuộc runtime (express, pg, dotenv), bỏ qua vite/typescript — nhẹ và nhanh |
| Health check `/api/health` | Xác nhận API kết nối được database `qlns` sau khi khởi động lại |
| `cancel-in-progress: false` | Không bao giờ cắt ngang một lần deploy đang chạy dở |

> **Lưu ý:** Tệp `.env.local` chứa mật khẩu database **nằm sẵn trên máy chủ** và **không** bị workflow ghi đè (không có trong Git do khớp mẫu `*.local` trong `.gitignore`).

### 8.2. Phương án thay thế – Script phát hành thủ công

Khi chưa cài self-hosted runner, dùng script PowerShell chạy trực tiếp trên máy chủ. Lưu thành **`scripts/deploy.ps1`**:

```powershell
# ---------------------------------------------------------------------------
# Phát hành DAU HRM lên máy chủ nội bộ (chạy với quyền Administrator)
# ---------------------------------------------------------------------------
$ErrorActionPreference = 'Stop'

$AppDir    = 'C:\DAU-HRM\app'
$BackupDir = 'C:\DAU-HRM\backup'
$PgBin     = 'C:\Program Files\PostgreSQL\18\bin'
$Stamp     = Get-Date -Format 'yyyyMMdd-HHmmss'

Write-Host "[1/7] Cap nhat ma nguon..."
Set-Location $AppDir
git fetch origin; git checkout main; git pull origin main

Write-Host "[2/7] Cai dat phu thuoc & kiem tra kieu..."
npm ci
npm run lint

Write-Host "[3/7] Build ung dung..."
npm run build

Write-Host "[4/7] Sao luu database qlns..."
New-Item -ItemType Directory -Force $BackupDir | Out-Null
$env:PGPASSWORD = (Get-Content "$AppDir\.env.local" |
    Select-String '^PGPASSWORD=' | ForEach-Object { $_.Line.Split('=')[1] })
& "$PgBin\pg_dump.exe" -U postgres -h localhost -p 5432 -F c -d qlns `
    -f "$BackupDir\qlns-$Stamp.dump"
$env:PGPASSWORD = $null

Write-Host "[5/7] Khoi dong lai dich vu API..."
nssm restart DAU-HRM-API

Write-Host "[6/7] Kiem tra suc khoe..."
Start-Sleep -Seconds 5
$health = Invoke-RestMethod http://127.0.0.1:3001/api/health
if (-not $health.ok) { throw "Health check that bai!" }

Write-Host "[7/7] Nap lai Nginx..."
nginx -s reload

Write-Host "PHAT HANH THANH CONG - database: $($health.database), so bang: $($health.tables)"
```

Chạy:

```powershell
powershell -ExecutionPolicy Bypass -File C:\DAU-HRM\app\scripts\deploy.ps1
```

---

## 9. Quản lý biến môi trường & bí mật (Secrets)

### 9.1. Bảng biến môi trường

| Tên biến | Giá trị mặc định | Loại | Nơi lưu | Ghi chú |
|----------|------------------|------|---------|---------|
| `PGHOST` | `localhost` | Cấu hình | `.env.local` trên máy chủ | Máy chủ PostgreSQL |
| `PGPORT` | `5432` | Cấu hình | `.env.local` | Cổng PostgreSQL |
| `PGDATABASE` | `qlns` | Cấu hình | `.env.local` | Tên database |
| `PGUSER` | `postgres` | Cấu hình | `.env.local` | Tài khoản kết nối |
| `PGPASSWORD` | *(bí mật)* | **Bí mật** | `.env.local` + GitHub Secrets | Mật khẩu PostgreSQL |
| `PGSCHEMA` | `public` | Cấu hình | `.env.local` | Schema chứa bảng |
| `PGPOOL_MAX` | `10` | Cấu hình | `.env.local` | Số kết nối tối đa trong pool |
| `API_PORT` | `3001` | Cấu hình | `.env.local` | Cổng API server |
| `API_HOST` | `127.0.0.1` | Cấu hình | `.env.local` | Địa chỉ API lắng nghe (giữ loopback) |
| `API_BODY_LIMIT` | `25mb` | Cấu hình | `.env.local` | Giới hạn body cho tải PDF/Excel |
| `GEMINI_API_KEY` | *(trống)* | **Bí mật** | `.env.local` + GitHub Secrets | Chức năng OCR/trích xuất AI |

### 9.2. Tệp `.env.local` trên máy chủ

Tạo bằng cách sao chép từ `.env.example` rồi điền giá trị thật:

```ini
# --- PostgreSQL local (C:\Program Files\PostgreSQL\18) ---
PGHOST=localhost
PGPORT=5432
PGDATABASE=qlns
PGUSER=postgres
PGPASSWORD=1102        # <-- mật khẩu database qlns (môi trường local)
PGSCHEMA=public
PGPOOL_MAX=10

# --- API server (Vite proxy /api trỏ tới cổng này) ---
API_PORT=3001
API_HOST=127.0.0.1

# --- Google Gemini (OCR/trích xuất trong nhóm Công cụ) ---
GEMINI_API_KEY=
```

> ⚠️ **Cảnh báo bảo mật quan trọng:** Mật khẩu `1102` là giá trị đang dùng cho **database local phục vụ phát triển**. Trước khi đưa hệ thống vào vận hành thật, **bắt buộc**:
> 1. Đổi mật khẩu tài khoản `postgres` thành chuỗi mạnh (≥ 16 ký tự, ngẫu nhiên).
> 2. Tạo tài khoản riêng cho ứng dụng (ví dụ `hrm_app`) chỉ có quyền `SELECT/INSERT/UPDATE/DELETE` trên schema `public`, **không dùng** tài khoản siêu quản trị `postgres` cho runtime.
> 3. Không ghi mật khẩu thật vào bất kỳ tài liệu hay commit nào.
>
> ```sql
> -- Đổi mật khẩu và tạo tài khoản ứng dụng riêng
> ALTER USER postgres WITH PASSWORD '<mat_khau_moi_manh>';
> CREATE USER hrm_app WITH PASSWORD '<mat_khau_ung_dung>';
> GRANT CONNECT ON DATABASE qlns TO hrm_app;
> GRANT USAGE ON SCHEMA public TO hrm_app;
> GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hrm_app;
> GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hrm_app;
> ```

### 9.3. GitHub Secrets

Thêm tại **Repo → Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Dùng ở đâu | Ý nghĩa |
|--------|------------|---------|
| `GEMINI_API_KEY` | `ci.yml`, `deploy.yml` | Khóa Google Gemini cho chức năng OCR |
| `PGPASSWORD` | `deploy.yml` (bước `pg_dump`) | Mật khẩu PostgreSQL để sao lưu database |

**Nguyên tắc bảo mật:**

- **Tuyệt đối không** commit `.env.local` hay khóa API vào Git — `.gitignore` đã loại trừ mẫu `*.local`.
- Truy cập secret trong workflow qua cú pháp `${{ secrets.TEN_SECRET }}`; GitHub tự động che giá trị trong log.
- **Xoay vòng (rotate)** khóa API và mật khẩu database định kỳ (khuyến nghị 6 tháng/lần); thu hồi ngay khi nghi ngờ lộ.
- Với self-hosted runner: hạn chế quyền truy cập vật lý và tài khoản đăng nhập máy chủ, vì runner có quyền chạy lệnh trên máy đó.
- Không bật self-hosted runner cho kho mã public nếu có nhận Pull Request từ bên ngoài (nguy cơ chạy mã độc hại trên máy chủ nội bộ).

---

## 10. Cơ sở dữ liệu trong quy trình CI/CD

### 10.1. Sao lưu (Backup)

| Loại | Tần suất | Lệnh | Nơi lưu |
|------|----------|------|---------|
| **Trước mỗi lần phát hành** | Mỗi lần deploy | `pg_dump -F c` (tự động trong `deploy.yml`) | `C:\DAU-HRM\backup` |
| **Định kỳ hằng ngày** | 23:00 mỗi ngày | Task Scheduler gọi `pg_dump` | Ổ đĩa sao lưu riêng / NAS |
| **Toàn bộ cụm** | Hằng tuần | `pg_dumpall` | Ổ đĩa sao lưu riêng |

```powershell
# Sao lưu thủ công database qlns (định dạng custom, nén sẵn)
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -h localhost -p 5432 `
    -F c -d qlns -f "C:\DAU-HRM\backup\qlns-$stamp.dump"
```

Thiết lập tác vụ định kỳ:

```powershell
# Chạy sao lưu tự động lúc 23:00 hằng ngày
$action  = New-ScheduledTaskAction -Execute 'powershell.exe' `
           -Argument '-ExecutionPolicy Bypass -File C:\DAU-HRM\scripts\backup.ps1'
$trigger = New-ScheduledTaskTrigger -Daily -At 23:00
Register-ScheduledTask -TaskName 'DAU-HRM-Backup' -Action $action -Trigger $trigger -RunLevel Highest
```

> **Chính sách lưu giữ:** giữ 14 bản sao lưu gần nhất trên máy chủ, 12 bản theo tháng trên thiết bị lưu trữ riêng. Kiểm thử phục hồi ít nhất **1 lần/quý** để bảo đảm bản sao lưu dùng được.

### 10.2. Phục hồi (Restore)

```powershell
# Phục hồi vào database mới để kiểm chứng trước (KHÔNG ghi đè trực tiếp qlns)
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe"  -U postgres qlns_restore
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" -U postgres -d qlns_restore `
    "C:\DAU-HRM\backup\qlns-20260723-090000.dump"

# Khi đã kiểm chứng đạt, mới đổi tên (dừng dịch vụ API trước)
nssm stop DAU-HRM-API
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c `
  "ALTER DATABASE qlns RENAME TO qlns_old; ALTER DATABASE qlns_restore RENAME TO qlns;"
nssm start DAU-HRM-API
```

### 10.3. Quản lý thay đổi cấu trúc (Migration)

Hệ thống hiện **chưa dùng công cụ migration tự động**. Áp dụng quy ước thủ công có kiểm soát:

```
db/
└── migrations/
    ├── 20260723_01_them_cot_ghichu_hdld.sql
    ├── 20260801_01_them_bang_lichsu_luong.sql
    └── README.md          # ghi chú thứ tự áp dụng
```

**Quy tắc bắt buộc:**

| Quy tắc | Lý do |
|---------|-------|
| Mỗi thay đổi schema là **một tệp `.sql` riêng**, đặt tên `YYYYMMDD_NN_mo_ta.sql` | Truy vết được thứ tự và tác giả |
| Script phải **idempotent** (`IF NOT EXISTS`, `IF EXISTS`) | Chạy lại không gây lỗi |
| Áp dụng trên `qlns_uat` trước, nghiệm thu xong mới lên production | Giảm rủi ro hỏng dữ liệu thật |
| Chỉ thêm cột/bảng mới; **tránh** xóa hoặc đổi tên cột đang dùng | Server đối chiếu schema thật (`server/schema.js`) — xóa cột làm hỏng truy vấn đang chạy |
| Luôn sao lưu trước khi chạy migration | Có điểm khôi phục |

```powershell
# Áp dụng migration
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d qlns `
    -v ON_ERROR_STOP=1 -f "db\migrations\20260723_01_them_cot_ghichu_hdld.sql"
```

> Sau khi thay đổi schema, gọi `POST /api/schema/refresh` (hoặc khởi động lại dịch vụ API) để server nạp lại danh sách bảng/cột. Server cũng tự nạp lại schema khi gặp bảng/cột lạ.

---

## 11. Kịch bản khôi phục (Rollback)

Khi health check thất bại hoặc phát hiện lỗi nghiêm trọng sau phát hành:

| Bước | Hành động | Lệnh |
|:----:|-----------|------|
| 1 | Dừng dịch vụ API | `nssm stop DAU-HRM-API` |
| 2 | Quay mã nguồn về commit ổn định trước đó | `git checkout <tag_hoặc_sha_ổn_định>` |
| 3 | Cài lại phụ thuộc & build lại | `npm ci --omit=dev` (hoặc tải artifact `dist-<sha>` từ Actions) |
| 4 | Phục hồi database **nếu migration đã làm hỏng dữ liệu** | `pg_restore` bản dump vừa tạo trước deploy (mục 10.2) |
| 5 | Khởi động lại dịch vụ | `nssm start DAU-HRM-API` |
| 6 | Xác nhận | `Invoke-RestMethod http://127.0.0.1:3001/api/health` |
| 7 | Ghi nhận sự cố | Mở Issue trên GitHub, mô tả nguyên nhân & cách khắc phục |

**Mẹo rút ngắn thời gian rollback:** mỗi lần phát hành thành công hãy gắn tag Git:

```bash
git tag -a v1.3.0 -m "Phát hành 23/07/2026"
git push origin v1.3.0
```

Khi cần lùi, chỉ việc `git checkout v1.2.0` và chạy lại `scripts/deploy.ps1`.

---

## 12. Cổng chất lượng & bảo vệ nhánh

### 12.1. Bảo vệ nhánh `main` (Branch Protection)

Cấu hình tại **Repo → Settings → Branches → Add branch protection rule**, áp cho nhánh `main`:

- [x] **Require a pull request before merging** — bắt buộc merge qua PR.
- [x] **Require status checks to pass before merging** — yêu cầu job `Lint & Build` xanh.
- [x] **Require branches to be up to date before merging** — nhánh phải cập nhật với `main`.
- [x] **Require conversation resolution before merging** — xử lý hết bình luận review.
- [x] (Khuyến nghị) **Require at least 1 approval** — cần ít nhất 1 người phê duyệt.
- [x] **Do not allow bypassing the above settings** — áp dụng cả với quản trị viên.

### 12.2. Phê duyệt phát hành (Environment Protection)

Cấu hình tại **Repo → Settings → Environments → New environment → `production`**:

- [x] **Required reviewers** — chỉ định người chịu trách nhiệm phê duyệt phát hành.
- [x] **Deployment branches: Selected branches → `main`** — chỉ `main` được phát hành.
- [x] Gắn secret `PGPASSWORD` ở phạm vi environment thay vì repository (thu hẹp phạm vi lộ lọt).

### 12.3. Các cổng chất lượng hiện có

| Cổng | Công cụ | Chặn merge? | Trạng thái |
|------|---------|:-----------:|------------|
| Kiểm tra kiểu TypeScript | `tsc --noEmit` | ✅ Có | Đã có |
| Build thành công | `vite build` | ✅ Có | Đã có |
| Quét lỗ hổng phụ thuộc | `npm audit` | ❌ Chỉ cảnh báo | Đã có |
| Kiểm thử đơn vị | Vitest | — | **Chưa có** (mục 13) |
| Lint mã nguồn | ESLint + Prettier | — | **Chưa có** (mục 13) |

---

## 13. Quy trình làm việc của lập trình viên (checklist)

### 13.1. Chu trình một tính năng

```bash
# 1. Đồng bộ nhánh main mới nhất
git checkout main && git pull origin main

# 2. Tạo nhánh tính năng
git checkout -b feature/230726_TenTinhNang

# 3. Phát triển (chạy đồng thời API + web)
npm run dev            # mở http://localhost:3000

# 4. Kiểm tra chất lượng tại local — GIỐNG HỆT bước CI chạy
npm run lint
npm run build
npm run preview        # (tùy chọn) xem thử bản production

# 5. Commit & đẩy lên
git add .
git commit -m "feat(module): mô tả ngắn gọn thay đổi"
git push -u origin feature/230726_TenTinhNang

# 6. Mở Pull Request vào main trên GitHub, chờ CI xanh
```

### 13.2. Checklist trước khi mở Pull Request

- [ ] Đã tạo nhánh `feature/*` từ `main` mới nhất.
- [ ] `npm run lint` không báo lỗi.
- [ ] `npm run build` thành công.
- [ ] Đã kiểm thử chức năng liên quan: đăng nhập, phân quyền, CRUD trên database `qlns`.
- [ ] Không có tệp `.env.local`, khóa API, hay mật khẩu trong danh sách tệp thay đổi.
- [ ] Nếu có thay đổi schema: đã thêm tệp migration vào `db/migrations/` và ghi chú trong PR.
- [ ] Đã cập nhật tài liệu liên quan trong thư mục `doc/` (nếu thay đổi ảnh hưởng nghiệp vụ).

### 13.3. Checklist trước khi phát hành production

- [ ] CI trên `main` xanh.
- [ ] Đã nghiệm thu trên môi trường Staging (nếu thay đổi lớn).
- [ ] Đã sao lưu database `qlns` (bước tự động trong `deploy.yml`, hoặc chạy tay).
- [ ] Đã thông báo thời gian gián đoạn dịch vụ cho phòng TCHC (nếu cần dừng dịch vụ).
- [ ] Có người phê duyệt trên GitHub Environment `production`.
- [ ] Sau phát hành: `/api/health` trả `ok: true`, đăng nhập & thao tác thử thành công.
- [ ] Đã gắn tag phiên bản `vX.Y.Z`.

---

## 14. Giám sát sau phát hành

| Hạng mục | Cách kiểm tra | Tần suất |
|----------|---------------|----------|
| Sức khỏe API + kết nối DB | `GET http://127.0.0.1:3001/api/health` | 5 phút/lần (script giám sát) |
| Nhật ký API server | `C:\DAU-HRM\logs\api-err.log` | Hằng ngày |
| Nhật ký PostgreSQL | `C:\Program Files\PostgreSQL\18\data\log\` | Hằng ngày |
| Dung lượng database | `SELECT pg_size_pretty(pg_database_size('qlns'));` | Hằng tuần |
| Kết quả sao lưu | Kiểm tra tệp mới nhất trong `C:\DAU-HRM\backup` | Hằng ngày |
| Trạng thái dịch vụ | `Get-Service DAU-HRM-API` | Liên tục |

Script giám sát đơn giản (`scripts/healthcheck.ps1`, gắn vào Task Scheduler 5 phút/lần):

```powershell
try {
    $r = Invoke-RestMethod http://127.0.0.1:3001/api/health -TimeoutSec 5
    if (-not $r.ok) { throw "API bao loi" }
} catch {
    # Ghi log và tự khởi động lại dịch vụ một lần
    Add-Content C:\DAU-HRM\logs\health.log "$(Get-Date -f s) LOI: $($_.Exception.Message)"
    nssm restart DAU-HRM-API
}
```

---

## 15. Xử lý sự cố CI/CD thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|-------------|-------------|-----------|
| `npm ci` lỗi *"lock file out of sync"* | `package.json` và `package-lock.json` lệch nhau | Chạy `npm install` tại local rồi commit lại `package-lock.json` |
| `tsc` báo lỗi kiểu trên CI nhưng local không lỗi | Local còn cache cũ / Node khác phiên bản | Xóa `node_modules`, chạy `npm ci && npm run lint` với Node 20 |
| Build lỗi thiếu `GEMINI_API_KEY` | Chưa cấu hình secret | Thêm secret trong Repo Settings (mục 9.3) |
| Tải lại trang (F5) bị lỗi 404 sau deploy | Web server chưa fallback SPA | Thêm `try_files $uri $uri/ /index.html` (mục 7.4) |
| Ứng dụng mở được nhưng không có dữ liệu | Thiếu proxy `/api` hoặc dịch vụ API chưa chạy | Kiểm tra `nssm status DAU-HRM-API` và khối `location /api/` của Nginx |
| `/api/health` trả `503` | Sai `PGPASSWORD`, PostgreSQL chưa chạy, hoặc sai tên database | Kiểm tra `.env.local`; `Get-Service postgresql*`; thử `psql -U postgres -d qlns -c "\dt"` |
| `password authentication failed for user "postgres"` | Mật khẩu trong `.env.local` không khớp mật khẩu thật | Đặt lại: `ALTER USER postgres WITH PASSWORD '...'` rồi cập nhật `.env.local` |
| `relation "..." does not exist` | Bảng chưa tạo hoặc nằm ở schema khác `public` | Kiểm tra `PGSCHEMA`; chạy migration còn thiếu |
| Lỗi *"file đang được sử dụng"* khi chép `server/` | Chưa dừng dịch vụ API trước khi ghi đè | Bảo đảm bước `nssm stop DAU-HRM-API` chạy trước bước sao chép |
| Self-hosted runner *offline* | Dịch vụ runner dừng / máy chủ khởi động lại | `Get-Service actions.runner.*` → `Start-Service`; đặt chế độ tự khởi động |
| Deploy thành công nhưng trình duyệt vẫn hiện bản cũ | Cache trình duyệt/web server | `Ctrl+F5`; cấu hình `Cache-Control: no-cache` cho `index.html` |
| `pg_dump` báo *"version mismatch"* | Dùng `pg_dump` phiên bản khác server | Dùng đúng binary tại `C:\Program Files\PostgreSQL\18\bin` |

---

## 16. Lộ trình nâng cấp quy trình (đề xuất)

| Ưu tiên | Hạng mục | Đề xuất triển khai |
|:-------:|----------|--------------------|
| Cao | **Kiểm thử tự động** | Bổ sung Vitest + React Testing Library; thêm bước `npm test` vào `ci.yml` làm cổng chặn merge |
| Cao | **Tách tài khoản DB cho ứng dụng** | Tạo user `hrm_app` quyền hạn chế thay cho `postgres` (mục 9.2) |
| Cao | **Migration có phiên bản** | Áp dụng công cụ như `node-pg-migrate` để theo dõi migration đã chạy |
| Trung bình | **Lint mã nguồn** | Thêm ESLint + Prettier, kiểm tra định dạng trong CI |
| Trung bình | **Quét bảo mật tự động** | Bật Dependabot alerts + Dependabot version updates |
| Trung bình | **Phiên bản hóa & Release notes** | Gắn tag `vX.Y.Z`, tạo GitHub Release tự động từ commit message |
| Trung bình | **Thông báo kết quả** | Gửi kết quả CI/CD qua email hoặc kênh chat nội bộ của Trường |
| Thấp | **Đóng gói Docker** | `docker-compose` gồm 3 dịch vụ: nginx + node-api + postgres, cho triển khai đồng nhất |
| Thấp | **Kiểm thử E2E** | Playwright kiểm thử luồng đăng nhập → tra cứu → cập nhật hồ sơ |

---

## Phụ lục A – Tóm tắt lệnh nhanh

```bash
# --- Phát triển ---
npm install              # cài đặt lần đầu
npm run dev              # chạy đồng thời API (3001) + web (3000)
npm run server           # chỉ chạy API server
npm run web              # chỉ chạy Vite dev server

# --- Kiểm tra chất lượng (giống hệt bước CI) ---
npm run lint && npm run build

# --- Xem thử bản production ---
npm run preview          # phục vụ dist/ kèm proxy /api, cổng 3000
```

```powershell
# --- Vận hành trên máy chủ ---
nssm status  DAU-HRM-API            # trạng thái dịch vụ API
nssm restart DAU-HRM-API            # khởi động lại dịch vụ
Invoke-RestMethod http://127.0.0.1:3001/api/health   # kiểm tra sức khỏe

# --- Cơ sở dữ liệu (PostgreSQL 18) ---
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d qlns -c "\dt"
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -F c -d qlns -f qlns.dump
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" -U postgres -d qlns_restore qlns.dump
```

## Phụ lục B – Cấu trúc tệp CI/CD đề xuất

```
DAU-HRM-PostgresSQL/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Kiểm tra & build mọi push/PR (mục 6)
│       └── deploy.yml          # Build & phát hành thủ công (workflow_dispatch, mục 8.1)
├── scripts/
│   ├── deploy.ps1              # Script phát hành thủ công (mục 8.2)
│   ├── backup.ps1              # Sao lưu database định kỳ (mục 10.1)
│   └── healthcheck.ps1         # Giám sát sức khỏe (mục 14)
├── db/
│   └── migrations/             # Script thay đổi cấu trúc CSDL (mục 10.3)
├── server/                     # API server Node/Express (triển khai cùng dist/)
├── dist/                       # Kết quả build (KHÔNG commit — đã có trong .gitignore)
├── .env.example                # Mẫu biến môi trường (commit được)
├── .env.local                  # Giá trị thật, chứa mật khẩu (KHÔNG commit)
├── package.json                # Chứa script build/lint/server
└── vite.config.ts              # Cấu hình build & proxy /api
```

## Phụ lục C – Ma trận trách nhiệm (RACI)

| Hoạt động | Lập trình viên | Trưởng nhóm KT | Quản trị hệ thống | Phòng TCHC |
|-----------|:--------------:|:--------------:|:-----------------:|:----------:|
| Phát triển tính năng | **R** | C | I | C |
| Review Pull Request | C | **R** | I | – |
| Phê duyệt phát hành | I | **A** | C | C |
| Thực hiện phát hành | C | I | **R** | I |
| Sao lưu / phục hồi CSDL | I | C | **R** | I |
| Nghiệm thu chức năng | C | C | I | **R** |
| Xử lý sự cố vận hành | C | C | **R** | I |

> **R** = Thực hiện (Responsible), **A** = Chịu trách nhiệm cuối (Accountable), **C** = Tham vấn (Consulted), **I** = Được thông báo (Informed).

---

*Tài liệu thuộc bộ hồ sơ kỹ thuật DAU HRM (xem tổng quan tại `00-Tong-Quan-Phan-Tich.md`). Cập nhật khi quy trình phát hành hoặc kiến trúc triển khai thay đổi.*
