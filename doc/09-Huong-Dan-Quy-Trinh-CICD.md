# TÀI LIỆU HƯỚNG DẪN QUY TRÌNH CI/CD
# HỆ THỐNG QUẢN LÝ NHÂN SỰ – TRƯỜNG ĐẠI HỌC KIẾN TRÚC ĐÀ NẴNG (DAU HRM)

| Thông tin | Chi tiết |
|-----------|----------|
| **Tên hệ thống** | Hệ thống Quản lý Nhân sự DAU (DAU Human Resource Management) |
| **Đơn vị chủ quản** | Trường Đại học Kiến trúc Đà Nẵng (DAU) |
| **Loại ứng dụng** | Ứng dụng Web SPA (React 19 + TypeScript + Vite) |
| **Kho mã nguồn** | `github.com/TuanNgocDAU/DAU-HRM` |
| **Ngày lập tài liệu** | 10/07/2026 |
| **Người lập** | Bộ phận Kỹ thuật / DevOps |
| **Trạng thái** | Đề xuất & hướng dẫn triển khai (hiện dự án chưa có pipeline) |

---

## 1. Mục đích tài liệu

Tài liệu này mô tả **quy trình CI/CD (Continuous Integration / Continuous Delivery)** được đề xuất cho dự án DAU HRM, nhằm:

- Chuẩn hóa quy trình **tích hợp mã nguồn**, **kiểm tra chất lượng** và **đóng gói** ứng dụng một cách tự động.
- Giảm lỗi thủ công khi build và phát hành; đảm bảo mỗi thay đổi đều được kiểm tra trước khi hợp nhất.
- Cung cấp cấu hình mẫu (GitHub Actions) sẵn sàng áp dụng cho kho `DAU-HRM`.
- Làm tài liệu tham chiếu cho lập trình viên và người vận hành khi phát hành phiên bản mới.

> **Lưu ý hiện trạng:** Tại thời điểm lập tài liệu, kho mã **chưa có** thư mục `.github/workflows`. Tài liệu này vừa là hướng dẫn quy trình, vừa là bộ cấu hình mẫu để khởi tạo CI/CD lần đầu.

## 2. Tổng quan công nghệ liên quan

| Hạng mục | Giá trị |
|----------|---------|
| **Runtime build** | Node.js (khuyến nghị LTS ≥ 20) |
| **Trình quản lý gói** | npm (đã có `package-lock.json`) |
| **Công cụ build** | Vite 6 (`npm run build` → thư mục `dist/`) |
| **Kiểm tra kiểu (type check)** | `npm run lint` = `tsc --noEmit` |
| **Kết quả build** | Ứng dụng web tĩnh trong `dist/` (SPA) |
| **Biến môi trường build** | `GEMINI_API_KEY`, (tùy chọn) `POSTGREST_URL` |
| **Nguồn dữ liệu runtime** | PostgreSQL local `qlns` qua PostgREST (không đóng gói khi build) |

Các script hiện có trong `package.json`:

| Script | Lệnh | Vai trò trong CI/CD |
|--------|------|---------------------|
| `dev` | `vite` | Chạy máy phát triển (không dùng trong CI) |
| `build` | `vite build` | **Bước build chính** – tạo `dist/` |
| `preview` | `vite preview` | Xem thử bản build (kiểm thử thủ công) |
| `lint` | `tsc --noEmit` | **Kiểm tra kiểu TypeScript** – cổng chất lượng |

## 3. Chiến lược nhánh (Branching Strategy)

Áp dụng mô hình **GitHub Flow** đơn giản, phù hợp quy mô dự án:

```
main  ──────●────────────●────────────●───────►  (nhánh phát hành, luôn ổn định)
             \          /  \          /
feature/xxx   ●──●──●──●     ●──●──●──●            (nhánh tính năng, ví dụ feature/100726_CuoiTuan)
```

| Nhánh | Vai trò | Quy tắc |
|-------|---------|---------|
| `main` | Nhánh chính, luôn ở trạng thái phát hành được | Chỉ hợp nhất qua Pull Request đã pass CI |
| `feature/*` | Phát triển tính năng / sửa lỗi | Đặt tên rõ ràng, ví dụ `feature/100726_CuoiTuan` |
| `hotfix/*` | Sửa lỗi khẩn cấp trên production | Merge nhanh vào `main` sau khi CI xanh |

**Nguyên tắc:**
- Không commit trực tiếp lên `main`.
- Mỗi tính năng phát triển trên một nhánh `feature/*` riêng, mở **Pull Request** vào `main`.
- Pull Request chỉ được merge khi **toàn bộ kiểm tra CI thành công**.

## 4. Sơ đồ quy trình CI/CD

```
┌──────────────┐   git push /    ┌─────────────────────────────────────┐
│  Lập trình    │   pull request  │            GITHUB ACTIONS            │
│  viên (local) ├────────────────►│                                     │
└──────────────┘                  │  ┌───────────────────────────────┐  │
        ▲                         │  │  CI – Kiểm tra chất lượng      │  │
        │                         │  │  1. Checkout mã nguồn          │  │
        │                         │  │  2. Cài Node + cache npm       │  │
        │  Phản hồi (pass/fail)   │  │  3. npm ci                     │  │
        │◄────────────────────────┤  │  4. npm run lint (tsc)         │  │
                                  │  │  5. npm run build              │  │
                                  │  │  6. Lưu artifact dist/         │  │
                                  │  └───────────────┬───────────────┘  │
                                  │                  │ (khi merge main)  │
                                  │  ┌───────────────▼───────────────┐  │
                                  │  │  CD – Phát hành (tùy chọn)     │  │
                                  │  │  7. Build production           │  │
                                  │  │  8. Deploy (Pages / server)    │  │
                                  │  └───────────────────────────────┘  │
                                  └─────────────────────────────────────┘
```

**Giai đoạn CI (Continuous Integration)** – kích hoạt trên mọi `push` và `pull_request`:
1. Lấy mã nguồn (checkout).
2. Cài đặt Node.js và khôi phục cache npm.
3. Cài phụ thuộc bằng `npm ci` (dùng đúng `package-lock.json`).
4. Kiểm tra kiểu TypeScript: `npm run lint`.
5. Build ứng dụng: `npm run build`.
6. Lưu kết quả `dist/` làm artifact để tra cứu/triển khai.

**Giai đoạn CD (Continuous Delivery)** – chỉ chạy khi hợp nhất vào `main`:
7. Build bản production với biến môi trường thật.
8. Triển khai `dist/` lên môi trường đích (GitHub Pages, máy chủ web tĩnh, hoặc AI Studio).

## 5. Cấu hình CI mẫu (GitHub Actions)

Tạo tệp **`.github/workflows/ci.yml`** với nội dung sau:

```yaml
name: CI - Kiểm tra & Build

# Kích hoạt khi push lên nhánh chính/feature và khi mở Pull Request
on:
  push:
    branches: ['main', 'feature/**']
  pull_request:
    branches: ['main']

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

      - name: Lưu artifact bản build
        uses: actions/upload-artifact@v4
        with:
          name: dist-${{ github.sha }}
          path: dist/
          retention-days: 7
```

**Giải thích các bước quan trọng:**
- `npm ci` — cài đặt **chính xác** theo `package-lock.json`, sạch và nhanh hơn `npm install`, đảm bảo build tái lập được.
- `cache: 'npm'` — cache thư mục `~/.npm` để tăng tốc các lần chạy sau.
- `secrets.GEMINI_API_KEY` — khóa API được lưu an toàn trong **Repository Secrets** (mục 7), không hard-code vào mã.

## 6. Cấu hình CD – Deploy lên VPS

Ứng dụng được triển khai lên **VPS** chạy web server (khuyến nghị **Nginx**). Quy trình: GitHub Actions build ra `dist/`, sau đó dùng **rsync qua SSH** đẩy lên thư mục web của VPS và reload Nginx. Cách này phù hợp với kiến trúc hệ thống vì VPS đồng thời có thể chạy (hoặc kết nối tới) **PostgREST** phục vụ database `qlns`.

Tệp **`.github/workflows/deploy.yml`** (đã được tạo trong dự án):

```yaml
name: CD - Deploy lên VPS

on:
  push:
    branches: ['main']
  workflow_dispatch:          # cho phép chạy thủ công từ tab Actions

concurrency:
  group: 'deploy-vps'
  cancel-in-progress: true

jobs:
  deploy:
    name: Build & Deploy VPS
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}

      - name: Chuẩn bị SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.VPS_SSH_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -p "${{ secrets.VPS_PORT || '22' }}" -H "${{ secrets.VPS_HOST }}" >> ~/.ssh/known_hosts 2>/dev/null

      - name: Đẩy dist/ lên VPS (rsync)
        run: |
          rsync -avz --delete \
            -e "ssh -i ~/.ssh/deploy_key -p ${{ secrets.VPS_PORT || '22' }}" \
            dist/ \
            "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:${{ secrets.VPS_DEPLOY_PATH }}/"

      - name: Reload Nginx
        run: |
          ssh -i ~/.ssh/deploy_key -p "${{ secrets.VPS_PORT || '22' }}" \
            "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}" \
            "sudo systemctl reload nginx || true"

      - name: Dọn dẹp khóa SSH
        if: always()
        run: rm -f ~/.ssh/deploy_key
```

### 6.1. Secrets cần cấu hình cho deploy VPS

Thêm tại **Repo → Settings → Secrets and variables → Actions**:

| Secret | Ví dụ | Ý nghĩa |
|--------|-------|---------|
| `VPS_HOST` | `123.45.67.89` hoặc `hrm.dau.edu.vn` | Địa chỉ IP/tên miền VPS |
| `VPS_USER` | `deploy` | Tài khoản SSH trên VPS |
| `VPS_PORT` | `22` | Cổng SSH (bỏ trống mặc định 22) |
| `VPS_SSH_KEY` | *(nội dung khóa riêng)* | **Private key** SSH (không đặt passphrase) |
| `VPS_DEPLOY_PATH` | `/var/www/dau-hrm` | Thư mục web gốc trên VPS |
| `GEMINI_API_KEY` | *(khóa API)* | Khóa cho tính năng AI (dùng khi build) |

### 6.2. Chuẩn bị VPS (một lần)

```bash
# 1. Tạo user deploy và thư mục web
sudo adduser --disabled-password deploy
sudo mkdir -p /var/www/dau-hrm
sudo chown -R deploy:deploy /var/www/dau-hrm

# 2. Thêm PUBLIC key (cặp với VPS_SSH_KEY) vào authorized_keys
sudo -u deploy mkdir -p /home/deploy/.ssh
echo "<public_key>" | sudo -u deploy tee -a /home/deploy/.ssh/authorized_keys
sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys

# 3. Cho phép reload nginx không cần mật khẩu (sudoers)
echo 'deploy ALL=(root) NOPASSWD: /bin/systemctl reload nginx' | sudo tee /etc/sudoers.d/deploy-nginx
```

> **Tạo cặp khóa SSH:** `ssh-keygen -t ed25519 -f deploy_key -N ""` → nội dung `deploy_key` đưa vào secret `VPS_SSH_KEY`, còn `deploy_key.pub` đưa vào `authorized_keys` của VPS.

### 6.3. Cấu hình Nginx trên VPS

Ứng dụng là **SPA** nên cần fallback về `index.html`, đồng thời **proxy `/rest/v1` → PostgREST** (tái hiện logic proxy trong `vite.config.ts`):

```nginx
server {
    listen 80;
    server_name hrm.dau.edu.vn;

    root /var/www/dau-hrm;
    index index.html;

    # SPA: mọi route trả về index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy tới PostgREST (bỏ tiền tố /rest/v1), loại header auth để chạy web_anon
    location /rest/v1/ {
        rewrite ^/rest/v1/(.*)$ /$1 break;
        proxy_set_header Authorization "";
        proxy_set_header apikey "";
        proxy_pass http://127.0.0.1:3001/;
    }
}
```

> Sau khi cấu hình HTTPS bằng Let's Encrypt (`certbot --nginx`), chuyển sang cổng 443. PostgREST nên chạy như một service (systemd) và chỉ lắng nghe `127.0.0.1` để không lộ ra Internet.

## 7. Quản lý biến môi trường & bí mật (Secrets)

| Tên | Loại | Nơi lưu | Ghi chú |
|-----|------|---------|---------|
| `GEMINI_API_KEY` | Bí mật | GitHub → Settings → **Secrets and variables → Actions** | Dùng cho tính năng trích xuất AI |
| `POSTGREST_URL` | Cấu hình | `.env.local` (local) / biến môi trường server | Mặc định `http://127.0.0.1:3001` |
| `VPS_HOST`, `VPS_USER`, `VPS_PORT` | Cấu hình | GitHub Secrets | Thông tin kết nối SSH tới VPS (mục 6.1) |
| `VPS_SSH_KEY` | Bí mật | GitHub Secrets | Khóa riêng SSH để deploy |
| `VPS_DEPLOY_PATH` | Cấu hình | GitHub Secrets | Thư mục web đích trên VPS |

**Nguyên tắc bảo mật:**
- **Tuyệt đối không** commit `.env.local` hay khóa API vào Git (`.gitignore` đã loại trừ `*.local`).
- Trên GitHub, thêm secret tại: **Repo → Settings → Secrets and variables → Actions → New repository secret**.
- Truy cập trong workflow qua cú pháp `${{ secrets.TEN_SECRET }}`.
- Xoay vòng (rotate) khóa API định kỳ; thu hồi ngay nếu nghi ngờ lộ.

## 8. Quy tắc chất lượng & bảo vệ nhánh (Branch Protection)

Cấu hình tại **Repo → Settings → Branches → Add branch protection rule** cho nhánh `main`:

- [x] **Require a pull request before merging** – bắt buộc merge qua PR.
- [x] **Require status checks to pass before merging** – yêu cầu job `Lint & Build` xanh.
- [x] **Require branches to be up to date before merging** – nhánh phải cập nhật với `main`.
- [x] (Khuyến nghị) **Require at least 1 approval** – cần ít nhất 1 người review.

Nhờ đó, mọi thay đổi vào `main` đều đã qua **type check + build thành công**, giảm rủi ro hỏng nhánh chính.

## 9. Quy trình làm việc của lập trình viên (checklist)

Trước khi mở Pull Request, chạy kiểm tra tại máy local để bắt lỗi sớm:

```bash
npm ci            # cài đặt sạch theo lock file
npm run lint      # kiểm tra kiểu TypeScript (tsc --noEmit)
npm run build     # đảm bảo build thành công
npm run preview   # (tùy chọn) xem thử bản build
```

**Checklist trước khi merge:**
- [ ] Đã tạo nhánh `feature/*` từ `main` mới nhất.
- [ ] `npm run lint` không báo lỗi.
- [ ] `npm run build` thành công.
- [ ] Đã kiểm thử chức năng liên quan (kết nối PostgREST, đăng nhập, CRUD).
- [ ] Mở Pull Request vào `main`, chờ CI xanh.
- [ ] Có ít nhất 1 review chấp thuận (nếu bật branch protection).

## 10. Nâng cấp quy trình trong tương lai (đề xuất)

| Hạng mục | Đề xuất |
|----------|---------|
| **Kiểm thử tự động** | Bổ sung Vitest + React Testing Library, thêm bước `npm test` vào CI |
| **Lint mã nguồn** | Thêm ESLint + Prettier, kiểm tra định dạng trong CI |
| **Quét bảo mật** | Bật Dependabot / `npm audit` để phát hiện lỗ hổng phụ thuộc |
| **Phiên bản hóa** | Gắn tag `vX.Y.Z` khi phát hành, tạo GitHub Release tự động |
| **Thông báo** | Tích hợp thông báo kết quả CI qua email hoặc chat nội bộ |
| **Đóng gói Docker** | Đóng gói `dist/` + Nginx + PostgREST thành Docker Compose cho triển khai đồng nhất |

## 11. Xử lý sự cố CI thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|-------------|-------------|-----------|
| `npm ci` lỗi "lock file out of sync" | `package.json` và `package-lock.json` lệch nhau | Chạy `npm install` local rồi commit lại lock file |
| Build lỗi thiếu `GEMINI_API_KEY` | Chưa cấu hình secret | Thêm secret trong Repo Settings (mục 7) |
| `tsc` báo lỗi kiểu | Lỗi TypeScript trong mã | Sửa lỗi kiểu, chạy `npm run lint` tại local trước khi push |
| Deploy lỗi `Permission denied (publickey)` | Sai khóa SSH / chưa thêm public key vào VPS | Kiểm tra `VPS_SSH_KEY` và `authorized_keys` (mục 6.2) |
| Reload nginx báo `sudo: a password is required` | Chưa cấu hình sudoers NOPASSWD | Thêm dòng sudoers cho user deploy (mục 6.2) |
| Tải lại trang (F5) bị lỗi 404 | Nginx chưa fallback SPA | Thêm `try_files ... /index.html` (mục 6.3) |
| Không gọi được dữ liệu sau deploy | Thiếu proxy tới PostgREST | Cấu hình `location /rest/v1/` trên Nginx (mục 6.3) |

---

## Phụ lục A – Tóm tắt lệnh nhanh

```bash
# Phát triển
npm run dev

# Kiểm tra chất lượng (giống CI)
npm run lint && npm run build

# Xem thử bản production
npm run preview
```

## Phụ lục B – Cấu trúc tệp CI/CD đề xuất

```
DAU-HRM/
├── .github/
│   └── workflows/
│       ├── ci.yml          # Kiểm tra & build mọi push/PR (mục 5)
│       └── deploy.yml      # Build & deploy lên VPS khi merge main (mục 6)
├── package.json            # Chứa script build/lint
├── vite.config.ts          # Cấu hình build & proxy PostgREST
└── dist/                   # Kết quả build (không commit)
```

---

*Tài liệu thuộc bộ hồ sơ kỹ thuật DAU HRM. Cập nhật khi quy trình phát hành thay đổi.*
