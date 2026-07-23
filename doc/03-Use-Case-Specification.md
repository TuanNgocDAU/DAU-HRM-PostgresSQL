# USE CASE SPECIFICATION – ĐẶC TẢ CA SỬ DỤNG
## Hệ thống Quản lý Nhân sự – Trường Đại học Kiến trúc Đà Nẵng

| | |
|---|---|
| **Mã tài liệu** | UC-DAU-HRM-03 |
| **Phiên bản** | 1.0 |
| **Ngày** | 02/07/2026 |

---

## 1. Tác nhân (Actors)

| Mã | Tác nhân | Mô tả |
|----|----------|-------|
| A1 | **Quản trị viên (Admin)** | `manv=1`/`Admin` – toàn quyền hệ thống, quản lý người dùng & phân quyền, danh mục, công cụ. |
| A2 | **Cán bộ quản lý nhân sự** | Người dùng thường có quyền trên các phân hệ nghiệp vụ được cấp (hồ sơ, HĐLĐ, lương, thi đua…). |
| A3 | **Cán bộ Lương/Bảo hiểm** | Người dùng thường được cấp quyền phân hệ lương & bảo hiểm. |
| A4 | **Trưởng đơn vị** | Tra cứu/quản lý nhân sự đơn vị mình theo quyền. |
| A5 | **Nhân viên/Giảng viên** | Tra cứu hồ sơ cá nhân. |
| S1 | **Supabase (hệ thống ngoài)** | Lưu trữ & cung cấp dữ liệu. |
| S2 | **Google Gemini (hệ thống ngoài)** | OCR/dịch thuật tài liệu. |

## 2. Sơ đồ Use Case tổng quát

```
                         HỆ THỐNG DAU HRM
   ┌───────────────────────────────────────────────────────────┐
   │                                                             │
 (A5)──► UC-01 Đăng nhập ◄── «include» ── mọi UC nghiệp vụ       │
   │     UC-02 Đổi mật khẩu                                      │
   │     UC-03 Tra cứu hồ sơ cá nhân                             │
   │                                                             │
 (A2)──► UC-10 Quản lý hồ sơ nhân sự (CRUD)                      │
   │     UC-11 Quản lý QH gia đình / quá trình đào tạo           │
   │     UC-12 Quản lý tổ chức (tổ bộ môn, ngành ĐT)             │
   │     UC-13 Quản lý HĐLĐ  ──► UC-14 Theo dõi HĐLĐ đến hạn     │
   │     UC-17 Quản lý thi đua/khen thưởng/HTNV                  │
   │     UC-18 Quản lý nâng cao trình độ                         │
   │     UC-19 Quản lý công phép                                 │
   │     UC-20 Xem thống kê/báo cáo                              │
   │                                                             │
 (A3)──► UC-15 Quản lý lương & HSL ─► UC-16 Dự kiến nâng lương   │
   │     UC-21 Quản lý bảo hiểm & tổng hợp số liệu               │
   │                                                             │
 (A1)──► UC-30 Quản lý người dùng                               │
   │     UC-31 Gán vai trò                                       │
   │     UC-32 Phân quyền chức năng                              │
   │     UC-33 Quản lý danh mục                                  │
   │     UC-34 Sao lưu/Xuất dữ liệu ──► (S1)                     │
   │     UC-35 Trích xuất PDF/ảnh (OCR) ──► (S2)                 │
   └───────────────────────────────────────────────────────────┘
        mọi UC dữ liệu ──«include»──► giao tiếp (S1) Supabase
```

## 3. Đặc tả chi tiết các Use Case trọng yếu

### UC-01 – Đăng nhập hệ thống

| Mục | Nội dung |
|-----|----------|
| **Mã** | UC-01 |
| **Tác nhân** | A1–A5 |
| **Mục tiêu** | Xác thực người dùng và nạp quyền truy cập. |
| **Tiền điều kiện** | Có tài khoản trong bảng `Users`. |
| **Kích hoạt** | Người dùng mở ứng dụng và nhấn "Đăng nhập". |
| **Luồng chính** | 1. Nhập Username/Email/Mã NV + mật khẩu. 2. Hệ thống tìm tài khoản (`.or(username/email/manv)`). 3. Băm SHA-256 mật khẩu và so khớp `passwordhash`. 4. Kiểm tra `enable`. 5. Nếu không phải Admin: kiểm tra có bản ghi `UserRoles`; nạp `RolePermissions`, `Modules`, `Permissions` và chuẩn hóa quyền. 6. Tạo `UserSession` và chuyển vào Dashboard. |
| **Luồng phụ / ngoại lệ** | E1: Tài khoản không tồn tại → thông báo lỗi. E2: Sai mật khẩu → lỗi. E3: `enable=false` (không phải Admin id=1) → "Tài khoản bị vô hiệu hóa". E4: Chưa gán vai trò → "Chưa được phân quyền sử dụng". |
| **Hậu điều kiện** | Phiên đăng nhập tạo trong bộ nhớ; menu hiển thị theo quyền. |
| **Quy tắc** | RULE-01, RULE-02, RULE-03. |

### UC-02 – Đổi mật khẩu

| Mục | Nội dung |
|-----|----------|
| **Tác nhân** | A1–A5 |
| **Luồng chính** | 1. Mở modal "Đổi Password". 2. Nhập mật khẩu cũ, mới, xác nhận. 3. Hệ thống băm & so khớp mật khẩu cũ với `passwordhash`. 4. Kiểm tra mật khẩu mới khớp xác nhận. 5. Cập nhật `Users.passwordhash`. |
| **Ngoại lệ** | Mật khẩu cũ sai hoặc mật khẩu mới không hợp lệ → thông báo lỗi chung. |

### UC-10 – Quản lý hồ sơ nhân sự (mẫu chuẩn CRUD)

| Mục | Nội dung |
|-----|----------|
| **Tác nhân** | A2 (và A1) |
| **Tiền điều kiện** | Đã đăng nhập; có quyng `READ` module `hoSoNhanSu`. |
| **Luồng chính** | 1. Chọn "Danh sách Nhân sự". 2. Hệ thống tải song song NV + danh mục (trình độ, phòng ban, chức vụ, chức danh, HĐLĐ). 3. Người dùng tìm kiếm/lọc. 4. **Thêm**: mở form, nhập, lưu vào `DanhSachNhanVien` (yêu cầu `CREATE`). 5. **Sửa**: chọn bản ghi, cập nhật (yêu cầu `UPDATE`). 6. **Xóa**: xác nhận, xóa (yêu cầu `DELETE`). 7. Quản lý tab QH gia đình & quá trình đào tạo. |
| **Ngoại lệ** | Thiếu quyền → nút thao tác vô hiệu hóa (RULE-04). Lỗi mạng/DB → modal thông báo lỗi. |
| **Hậu điều kiện** | Dữ liệu nhân sự được cập nhật; danh sách tải lại. |

> **Ghi chú**: Các UC quản lý danh mục và danh sách khác (chức vụ, trình độ, phòng ban, HĐLĐ, HSL, thi đua, khen thưởng, HTNV, ngành đào tạo, tổ bộ môn, nghỉ phép, bệnh viện…) tuân theo **cùng khuôn mẫu CRUD** như UC-10, khác nhau ở bảng dữ liệu và mã module kiểm quyền.

### UC-13 – Quản lý Hợp đồng lao động & UC-14 Theo dõi đến hạn

| Mục | Nội dung |
|-----|----------|
| **Tác nhân** | A2 |
| **Luồng chính** | 1. CRUD danh sách ký HĐLĐ (`DanhSachKyHDLD`): số HĐ, loại HĐ, lần ký, từ–đến ngày. 2. Hệ thống đối chiếu `denngay` với ngày hiện tại để lập danh sách **đến hạn ký**. 3. Nhân sự kết thúc HĐLĐ chuyển sang danh sách nghỉ việc (cập nhật `danghiviec`). |
| **Quy tắc** | RULE-08. |

### UC-15 – Quản lý lương & HSL / UC-16 Dự kiến nâng lương

| Mục | Nội dung |
|-----|----------|
| **Tác nhân** | A3 |
| **Luồng chính** | 1. Cấu hình danh mục HSL (số năm nâng bậc, mức nâng). 2. Ghi danh sách HSL nhân sự (mốc `thoigianbatdau`). 3. Hệ thống tính **dự kiến nâng lương** theo số năm nâng bậc, loại trừ thời gian nghỉ không lương (`DanhSachNghiKhongLuong`). |
| **Quy tắc** | RULE-05. |

### UC-21 – Quản lý bảo hiểm & tổng hợp số liệu

| Mục | Nội dung |
|-----|----------|
| **Tác nhân** | A3 |
| **Luồng chính** | 1. Cấu hình tỉ lệ đóng theo tháng/năm (`ThongTinBaoHiemHangThang`). 2. Ghi thông tin BH cá nhân (`ThongTinBaoHiemCaNhan`: số sổ, nơi KCB, thai sản). 3. Sinh/ghi quá trình đóng BH hằng tháng (`QuaTrinhDongBaoHiem`) – tính tiền theo tổng hệ số × tỉ lệ. 4. Tổng hợp số liệu BH bắt buộc theo đơn vị. |
| **Quy tắc** | RULE-06. |

### UC-30/31/32 – Quản lý người dùng, vai trò, phân quyền

| Mục | Nội dung |
|-----|----------|
| **Tác nhân** | A1 (Admin) |
| **Luồng chính (UC-30)** | Tạo tài khoản gắn `manv`, băm mật khẩu, bật/tắt `enable`. |
| **Luồng chính (UC-31)** | Gán `roleid` cho `userid` trong `UserRoles`. |
| **Luồng chính (UC-32)** | Với mỗi người dùng, cấp cặp (Module × Permission) trong `RolePermissions`. |
| **Hậu điều kiện** | Người dùng đăng nhập lại/"Làm mới quyền" sẽ áp dụng quyền mới. |

### UC-35 – Trích xuất dữ liệu từ PDF/ảnh (OCR bằng AI)

| Mục | Nội dung |
|-----|----------|
| **Tác nhân** | A2, hệ thống ngoài S2 (Gemini) |
| **Luồng chính** | 1. Tải lên PDF/ảnh (base64). 2. Gọi `geminiService.extractText` → Gemini OCR trả về văn bản thô. 3. Tùy chọn dịch thuật (`translateText`). 4. Người dùng rà soát và sử dụng dữ liệu. |
| **Ngoại lệ** | Thiếu `GEMINI_API_KEY` → báo lỗi. Kết quả OCR cần người dùng kiểm tra (RISK-B05). |

## 4. Ma trận Tác nhân × Use Case (rút gọn)

| Use Case | A1 | A2 | A3 | A4 | A5 |
|----------|:--:|:--:|:--:|:--:|:--:|
| UC-01 Đăng nhập | ✓ | ✓ | ✓ | ✓ | ✓ |
| UC-02 Đổi mật khẩu | ✓ | ✓ | ✓ | ✓ | ✓ |
| UC-03 Tra cứu hồ sơ cá nhân | ✓ | ✓ | ✓ | ✓ | ✓ |
| UC-10 Hồ sơ nhân sự | ✓ | ✓ | | ○ | |
| UC-13/14 HĐLĐ | ✓ | ✓ | | ○ | |
| UC-15/16 Lương & HSL | ✓ | | ✓ | ○ | |
| UC-21 Bảo hiểm | ✓ | | ✓ | | |
| UC-17 Thi đua/Khen thưởng | ✓ | ✓ | | ○ | |
| UC-20 Thống kê | ✓ | ✓ | ✓ | ○ | |
| UC-30/31/32 Quản trị & phân quyền | ✓ | | | | |
| UC-34 Sao lưu/Xuất | ✓ | ○ | ○ | | |
| UC-35 OCR trích xuất | ✓ | ○ | | | |

*Chú thích: ✓ = quyền mặc định/điển hình; ○ = tùy cấu hình phân quyền của Admin.*

---
*Xem tiếp: ERD (`04-ERD-So-Do-Du-Lieu.md`).*
