# SRS – ĐẶC TẢ YÊU CẦU HỆ THỐNG
## Hệ thống Quản lý Nhân sự – Trường Đại học Kiến trúc Đà Nẵng

| | |
|---|---|
| **Mã tài liệu** | SRS-DAU-HRM-02 |
| **Phiên bản** | 1.0 |
| **Ngày** | 02/07/2026 |

---

## 1. Giới thiệu

### 1.1. Mục đích
Tài liệu đặc tả chi tiết các yêu cầu chức năng và phi chức năng của hệ thống DAU HRM, làm cơ sở cho phát triển, kiểm thử và bảo trì.

### 1.2. Phạm vi hệ thống
Ứng dụng web SPA quản lý nhân sự cho cơ sở giáo dục đại học, dữ liệu lưu trên PostgreSQL (Supabase), tích hợp AI của Google cho trích xuất tài liệu.

## 2. Mô tả tổng thể

### 2.1. Kiến trúc tổng thể

```
┌──────────────────────────────────────────────────────────┐
│                    TRÌNH DUYỆT (CLIENT)                    │
│  React 19 SPA (Vite build)  ──  TailwindCSS UI            │
│  ├─ App.tsx (điều phối phiên đăng nhập)                   │
│  ├─ LoginForm  → xác thực                                 │
│  ├─ AdminDashboard → sidebar 12 phân hệ + router nội bộ   │
│  └─ EmployeeCard  → thẻ nhân viên                          │
│  services/ : supabase.ts, permissionService.ts,           │
│              geminiService.ts                             │
└───────────────┬───────────────────────────┬──────────────┘
                │ HTTPS (REST/PostgREST)     │ HTTPS
                ▼                            ▼
     ┌────────────────────┐      ┌────────────────────────┐
     │  SUPABASE (Cloud)  │      │  GOOGLE GEMINI API     │
     │  PostgreSQL + Auth │      │  (gemini-3-flash)      │
     │  ~40 bảng dữ liệu  │      │  OCR + dịch thuật      │
     └────────────────────┘      └────────────────────────┘
```

- **Kiến trúc**: Client-side SPA gọi trực tiếp Supabase qua khóa `anon`. **Không có tầng backend trung gian riêng**; logic nghiệp vụ nằm ở client.
- **Phiên làm việc**: Lưu trong bộ nhớ React state (`UserSession`), không persist – tải lại trang sẽ đăng xuất.

### 2.2. Loại người dùng
`UserType = 'admin' | 'employee' | null` (trong `types.ts`). Thực tế mọi tài khoản đăng nhập vào `AdminDashboard`; cờ `isAdmin` quyết định phạm vi quyền.

## 3. Yêu cầu chức năng (Functional Requirements)

Ký hiệu: **FR-[Phân hệ]-[STT]**. Mỗi phân hệ CRUD tuân theo mẫu chung: tải danh sách → tìm kiếm/lọc → thêm → sửa → xóa → xuất Excel, có kiểm tra quyền trước mỗi thao tác ghi.

### 3.1. Xác thực & phiên (AUTH)
| Mã | Yêu cầu |
|----|---------|
| FR-AUTH-01 | Đăng nhập bằng Username/Email/Mã NV + mật khẩu; băm SHA-256 và so khớp `passwordhash`. |
| FR-AUTH-02 | Chặn tài khoản `enable=false`; chặn tài khoản chưa có vai trò. |
| FR-AUTH-03 | Nạp danh sách quyền (RolePermissions → Modules/Permissions) khi đăng nhập và chuẩn hóa sang mã module/permission. |
| FR-AUTH-04 | Đổi mật khẩu (kiểm tra mật khẩu cũ, xác nhận mật khẩu mới). |
| FR-AUTH-05 | Làm mới quyền hạn theo yêu cầu (nút "Làm mới quyền") cho người dùng thường. |
| FR-AUTH-06 | Đăng xuất (xóa phiên). |
| FR-AUTH-07 | Modal hỗ trợ/quên mật khẩu hiển thị thông tin liên hệ Admin. |

### 3.2. Hồ sơ nhân sự (HS)
| Mã | Yêu cầu |
|----|---------|
| FR-HS-01 | Xem danh sách nhân sự với tìm kiếm, lọc theo đơn vị. |
| FR-HS-02 | Thêm/sửa/xóa hồ sơ nhân sự (thông tin cá nhân, công tác, liên hệ). |
| FR-HS-03 | Quản lý quan hệ gia đình của nhân sự (`DanhSachQuanHeGiaDinh`). |
| FR-HS-04 | Quản lý quá trình đào tạo của nhân sự (`DanhSachQuaTrinhDaoTao`). |
| FR-HS-05 | Xem hồ sơ chi tiết dạng modal (ảnh thẻ + 3 nhóm thông tin). |
| FR-HS-06 | Tra cứu hồ sơ cá nhân (người dùng tự xem hồ sơ của mình). |
| FR-HS-07 | Xem danh sách nhân sự theo Khoa/Phòng; danh sách nghỉ việc. |
| FR-HS-08 | Quản lý hình ảnh nhân sự. |

### 3.3. Tổ chức (ORG)
| Mã | Yêu cầu |
|----|---------|
| FR-ORG-01 | CRUD danh mục Tổ bộ môn (trực thuộc Khoa/Phòng, thứ tự sắp xếp). |
| FR-ORG-02 | Quản lý giảng viên theo tổ bộ môn; thống kê tổ bộ môn. |
| FR-ORG-03 | CRUD danh mục ngành đào tạo; danh sách GV theo ngành; thống kê theo ngành. |

### 3.4. Hợp đồng lao động (HDLD)
| Mã | Yêu cầu |
|----|---------|
| FR-HDLD-01 | CRUD danh mục loại HĐLĐ (mã, tên, thời hạn). |
| FR-HDLD-02 | CRUD danh sách ký HĐLĐ (số HĐ, loại, lần ký, từ–đến ngày). |
| FR-HDLD-03 | Hiển thị danh sách HĐLĐ đến hạn ký. |
| FR-HDLD-04 | Hiển thị/xử lý danh sách kết thúc HĐLĐ – nghỉ việc. |
| FR-HDLD-05 | Tổng quan/thống kê HĐLĐ. |

### 3.5. Lương & HSL (SAL)
| Mã | Yêu cầu |
|----|---------|
| FR-SAL-01 | CRUD danh mục HSL (ngạch/bậc, số năm nâng bậc, số bậc, mức nâng, hệ số tối đa). |
| FR-SAL-02 | CRUD danh sách HSL của nhân sự (HSL, hệ số chức vụ, tổng hệ số, diện xét, mốc bắt đầu). |
| FR-SAL-03 | CRUD danh sách nghỉ không lương (từ–đến ngày, số tháng nghỉ). |
| FR-SAL-04 | Lập danh sách dự kiến nâng lương (tính theo quy tắc HSL). |

### 3.6. Bảo hiểm (INS)
| Mã | Yêu cầu |
|----|---------|
| FR-INS-01 | CRUD danh mục bệnh viện (nơi KCB). |
| FR-INS-02 | CRUD tỉ lệ đóng bảo hiểm theo tháng/năm (BHXH/BHYT/BHTN/BHTNLĐ, phần đơn vị & người LĐ). |
| FR-INS-03 | Quản lý danh sách GVNV tham gia BH (số sổ, nơi KCB, thai sản, hết tham gia). |
| FR-INS-04 | Quản lý quá trình đóng bảo hiểm hằng tháng (tính tiền theo hệ số & tỉ lệ). |
| FR-INS-05 | Tổng hợp số liệu BH bắt buộc. |

### 3.7. Công tác – Thi đua – Khen thưởng (MERIT)
| Mã | Yêu cầu |
|----|---------|
| FR-MERIT-01 | CRUD mức độ HTNV cá nhân & tập thể theo năm học. |
| FR-MERIT-02 | CRUD danh hiệu thi đua cá nhân & tập thể theo năm học. |
| FR-MERIT-03 | CRUD khen thưởng cá nhân & tập thể theo năm học. |
| FR-MERIT-04 | CRUD nâng cao trình độ (học tập nâng cao). |
| FR-MERIT-05 | Tổng quan quá trình công tác & tổng quan thi đua. |

### 3.8. Công phép (LEAVE)
| Mã | Yêu cầu |
|----|---------|
| FR-LEAVE-01 | Thiết lập ngày nghỉ lễ trong năm. |
| FR-LEAVE-02 | Quản lý danh sách nghỉ phép năm (theo nhân sự, trừ ngày lễ). |
| FR-LEAVE-03 | Thống kê số liệu nghỉ phép. |

### 3.9. Thống kê (STAT)
| Mã | Yêu cầu |
|----|---------|
| FR-STAT-01 | Dashboard tổng quan: tổng NV, giới tính, trình độ, chức danh GS/PGS, tỉ lệ giảng viên, số đơn vị, NV mới nhất. |
| FR-STAT-02 | Thống kê theo chức danh & trình độ. |
| FR-STAT-03 | Thống kê theo chuẩn CSGD. |

### 3.10. Quản trị & Danh mục (ADMIN)
| Mã | Yêu cầu |
|----|---------|
| FR-ADMIN-01 | CRUD người dùng (tạo tài khoản gắn với mã NV, băm mật khẩu, bật/tắt hiệu lực). |
| FR-ADMIN-02 | Gán vai trò cho người dùng (UserRoles ↔ Roles). |
| FR-ADMIN-03 | CRUD danh mục chức năng (Modules). |
| FR-ADMIN-04 | Phân quyền chức năng (RolePermissions: module × permission theo người dùng). |
| FR-ADMIN-05 | CRUD các danh mục dùng chung: trình độ, chức danh, chức vụ, khoa/phòng, năm học, mức độ HTNV, danh hiệu thi đua, hình thức khen thưởng. |

### 3.11. Công cụ (TOOL)
| Mã | Yêu cầu |
|----|---------|
| FR-TOOL-01 | Sao lưu/xuất dữ liệu bảng ra Excel (`xlsx`). |
| FR-TOOL-02 | Trích xuất dữ liệu từ CSDL. |
| FR-TOOL-03 | Trích xuất dữ liệu từ PDF/ảnh bằng OCR (Gemini) + dịch thuật. |
| FR-TOOL-04 | Tách file PDF (`pdf-lib`, `pdfjs-dist`). |

## 4. Yêu cầu phi chức năng & hạ tầng kỹ thuật (Non-Functional)

### 4.1. Công nghệ & môi trường
| Hạng mục | Chi tiết |
|----------|----------|
| Ngôn ngữ | TypeScript 5.8, JSX/React 19 |
| Build tool | Vite 6 (dev server cổng 3000, host 0.0.0.0) |
| UI | TailwindCSS 4 (+ plugin Vite), lucide-react (icon), motion (animation) |
| CSDL | PostgreSQL trên Supabase; truy cập qua `@supabase/supabase-js` v2 |
| AI | `@google/genai` v1.36, model `gemini-3-flash-preview` |
| Tài liệu | `xlsx`, `pdf-lib`, `pdfjs-dist`, `qrcode.react` |
| Node | Node.js (chạy `npm run dev` / `npm run build`) |

### 4.2. Hiệu năng
- **NFR-PERF-01**: Truy vấn danh sách dùng `Promise.all` tải song song danh mục + dữ liệu chính để giảm thời gian chờ.
- **NFR-PERF-02**: Dữ liệu join (nhãn trình độ/phòng ban/chức vụ) được map phía client, phù hợp quy mô nhân sự một trường (hàng trăm bản ghi).

### 4.3. Khả dụng & tương thích
- **NFR-USAB-01**: Giao diện tiếng Việt, responsive (hỗ trợ lg breakpoint), có dark-mode ở màn đăng nhập.
- **NFR-USAB-02**: Chuẩn hóa key dữ liệu về chữ thường (`normalizeKeys`) để đồng nhất giữa DB và UI.

### 4.4. Bảo trì
- **NFR-MAINT-01**: Mỗi phân hệ là một component độc lập trong `components/`, dùng chung `services/`.
- **NFR-MAINT-02**: Router nội bộ dạng điều kiện theo `activeMenuItem` trong `AdminDashboard.tsx`.

### 4.5. Bảo mật (hiện trạng)
- Băm mật khẩu bằng **SHA-256** (đóng gói theo định dạng chuỗi Argon2, **không phải Argon2 thực**).
- Kiểm soát truy cập phía client theo RBAC.

## 5. Phân tích tích hợp hệ thống (System Integration)

| # | Tích hợp | Giao thức | Mục đích | Ghi chú |
|---|----------|-----------|----------|---------|
| INT-01 | Supabase PostgreSQL | HTTPS / PostgREST | Lưu trữ & truy vấn toàn bộ dữ liệu (CRUD ~40 bảng) | Dùng khóa `anon` cố định trong `services/supabase.ts` |
| INT-02 | Google Gemini API | HTTPS / SDK | OCR trích xuất văn bản từ PDF/ảnh, dịch thuật | Khóa qua biến môi trường `GEMINI_API_KEY` |
| INT-03 | Google Drive (ảnh) | HTTPS (URL) | Hiển thị ảnh thẻ nhân sự lưu trên Drive | Chuyển link Drive → `lh3.googleusercontent.com/d/{id}` |
| INT-04 | Xuất Excel | Client-side | Kết xuất báo cáo/sao lưu | Thư viện `xlsx` |
| INT-05 | Xử lý PDF | Client-side | Đọc/tách/tạo PDF | `pdf-lib`, `pdfjs-dist` |

**Điểm tích hợp dữ liệu nội bộ**: bảng `DanhSachNhanVien` là trục trung tâm, liên kết tới mọi phân hệ qua `manv`; các bảng danh mục cung cấp nhãn hiển thị.

## 6. Ràng buộc hạ tầng & triển khai

- **CO-INF-01**: Yêu cầu kết nối Internet liên tục (SaaS Supabase + Gemini).
- **CO-INF-02**: Build tĩnh (thư mục `dist/`) có thể host trên bất kỳ static host nào; cấu hình khóa Gemini được nhúng lúc build (`vite.config.ts define`).
- **CO-INF-03**: Không có CI/CD hay hạ tầng server riêng được mô tả trong mã nguồn.

## 7. Phân tích rủi ro & ràng buộc kỹ thuật

| Mã | Rủi ro kỹ thuật | Mức độ | Khuyến nghị |
|----|------------------|:------:|-------------|
| RISK-T01 | Khóa `anon` Supabase & khóa Gemini lộ trong bundle client | **Nghiêm trọng** | Bật Row Level Security (RLS), chuyển gọi AI qua backend/edge function, rotate khóa |
| RISK-T02 | Băm mật khẩu SHA-256 không muối (unsalted) – yếu trước tấn công từ điển/rainbow table | **Cao** | Dùng Argon2/bcrypt thực có muối, xử lý phía server |
| RISK-T03 | Toàn bộ kiểm soát quyền ở client → có thể bị vượt qua nếu gọi API trực tiếp | **Cao** | Thực thi phân quyền tại tầng DB (RLS/policies) |
| RISK-T04 | Phiên không persist, không có refresh token/hết hạn | Trung bình | Bổ sung quản lý phiên chuẩn (JWT/Supabase Auth) |
| RISK-T05 | Logic nghiệp vụ (tính BH, nâng lương) nằm ở client, khó kiểm soát nhất quán | Trung bình | Chuyển tính toán trọng yếu về server/stored procedure |
| RISK-T06 | Không thấy kiểm thử tự động trong mã nguồn | Trung bình | Bổ sung unit/integration test |
| RISK-T07 | Phụ thuộc mô hình AI preview (`gemini-3-flash-preview`) có thể thay đổi | Thấp | Cố định phiên bản model ổn định |
| RISK-T08 | `lint` chỉ chạy `tsc --noEmit`, không có ESLint | Thấp | Thêm ESLint + format chuẩn |

## 8. Tiêu chí chấp nhận (Acceptance Criteria)
- Tất cả FR ở mục 3 hoạt động đúng với dữ liệu thực.
- Kiểm tra quyền chặn đúng thao tác không được cấp.
- Số liệu thống kê khớp dữ liệu nguồn.

---
*Xem tiếp: Use Case Specification (`03-Use-Case-Specification.md`).*
