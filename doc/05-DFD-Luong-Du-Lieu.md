# DFD – SƠ ĐỒ LUỒNG DỮ LIỆU
## Hệ thống Quản lý Nhân sự – Trường Đại học Kiến trúc Đà Nẵng

| | |
|---|---|
| **Mã tài liệu** | DFD-DAU-HRM-05 |
| **Phiên bản** | 1.0 |
| **Ngày** | 02/07/2026 |

---

## 1. DFD Mức 0 – Sơ đồ ngữ cảnh (Context Diagram)

Mô tả hệ thống như một tiến trình duy nhất và các thực thể ngoài.

```mermaid
flowchart LR
    ND["👤 Người dùng<br/>(Admin / Cán bộ NS / Kế toán-BH /<br/>Trưởng đơn vị / Nhân viên)"]
    SB[("☁️ Supabase<br/>PostgreSQL")]
    GM["🤖 Google Gemini API"]
    GD["🖼️ Google Drive<br/>(ảnh nhân sự)"]

    SYS(("Hệ thống<br/>DAU HRM"))

    ND -->|"Thông tin đăng nhập, dữ liệu nhập,<br/>yêu cầu tra cứu/thao tác"| SYS
    SYS -->|"Màn hình, danh sách, báo cáo,<br/>thông báo, file Excel/PDF"| ND
    SYS <-->|"Truy vấn/CRUD dữ liệu (HTTPS)"| SB
    SYS -->|"PDF/ảnh (base64) để OCR/dịch"| GM
    GM -->|"Văn bản trích xuất / bản dịch"| SYS
    GD -->|"URL ảnh thẻ"| SYS
```

## 2. DFD Mức 1 – Phân rã các tiến trình chính

```mermaid
flowchart TB
    ND["👤 Người dùng"]
    SB[("Supabase")]
    GM["Gemini API"]

    P1["1.0 Xác thực &<br/>Phân quyền"]
    P2["2.0 Quản lý<br/>Hồ sơ nhân sự"]
    P3["3.0 Quản lý HĐLĐ /<br/>Lương / Bảo hiểm"]
    P4["4.0 Thi đua / Khen thưởng /<br/>Công phép"]
    P5["5.0 Thống kê &<br/>Báo cáo"]
    P6["6.0 Quản trị hệ thống<br/>(người dùng, danh mục)"]
    P7["7.0 Công cụ<br/>(sao lưu, OCR)"]

    ND -->|"username/mật khẩu"| P1
    P1 <-->|"Users, UserRoles,<br/>RolePermissions, Modules, Permissions"| SB
    P1 -->|"phiên + tập quyền"| ND

    ND -->|"dữ liệu NV"| P2
    P2 <-->|"DanhSachNhanVien,<br/>QuanHeGiaDinh, QuaTrinhDaoTao"| SB

    ND -->|"HĐLĐ, HSL, BH"| P3
    P3 <-->|"DanhSachKyHDLD, DanhSachHSL,<br/>ThongTinBaoHiem*, QuaTrinhDongBaoHiem"| SB

    ND -->|"HTNV, thi đua, khen thưởng, phép"| P4
    P4 <-->|"DanhSachCaNhan/TapThe*,<br/>NghiPhepNam, NgayNghiLe"| SB

    ND -->|"yêu cầu thống kê"| P5
    SB -->|"dữ liệu tổng hợp"| P5
    P5 -->|"biểu đồ, số liệu"| ND

    ND -->|"cấu hình user/quyền/danh mục"| P6
    P6 <-->|"Users, Roles, Modules,<br/>Permissions, DanhMuc*"| SB

    ND -->|"file PDF/ảnh, yêu cầu xuất"| P7
    P7 -->|"OCR/dịch"| GM
    GM -->|"văn bản"| P7
    P7 <-->|"đọc dữ liệu bảng"| SB
    P7 -->|"file Excel/PDF"| ND
```

## 3. DFD Mức 2 – Tiến trình 1.0 Xác thực & Phân quyền (chi tiết)

```mermaid
flowchart TB
    ND["👤 Người dùng"]
    SB[("Supabase")]

    P11["1.1 Tìm tài khoản<br/>(username/email/manv)"]
    P12["1.2 Băm & so khớp<br/>mật khẩu (SHA-256)"]
    P13["1.3 Kiểm tra hiệu lực<br/>(enable)"]
    P14["1.4 Kiểm tra vai trò<br/>(UserRoles)"]
    P15["1.5 Nạp & chuẩn hóa<br/>quyền (normalizePermissions)"]
    P16["1.6 Tạo phiên<br/>(UserSession)"]

    ND -->|"loginInput + password"| P11
    P11 -->|"tra cứu Users"| SB
    SB -->|"bản ghi user"| P11
    P11 --> P12
    P12 -->|"khớp"| P13
    P13 -->|"hợp lệ"| P14
    P14 -->|"đọc UserRoles"| SB
    P14 --> P15
    P15 -->|"RolePermissions +<br/>Modules + Permissions"| SB
    P15 --> P16
    P16 -->|"session + permissions + isAdmin"| ND
    P12 -.->|"sai → thông báo lỗi"| ND
    P13 -.->|"vô hiệu hóa → lỗi"| ND
    P14 -.->|"chưa phân quyền → lỗi"| ND
```

## 4. DFD Mức 2 – Tiến trình 3.x Tính bảo hiểm hằng tháng (minh họa)

```mermaid
flowchart LR
    ND["👤 Cán bộ BH"]
    SB[("Supabase")]

    P31["3.1 Lấy tổng hệ số<br/>từ DanhSachHSL"]
    P32["3.2 Lấy tỉ lệ đóng<br/>(ThongTinBaoHiemHangThang)"]
    P33["3.3 Tính tiền BHXH/BHYT/<br/>BHTN/BHTNLĐ"]
    P34["3.4 Ghi QuaTrinhDongBaoHiem"]

    ND -->|"chọn tháng/năm, đơn vị"| P31
    SB -->|"tongheso, hschucvu"| P31
    P31 --> P33
    SB -->|"tỉ lệ % theo thangnam"| P32
    P32 --> P33
    P33 -->|"số tiền từng loại"| P34
    P34 -->|"lưu bản ghi"| SB
    P34 -->|"kết quả/tổng hợp"| ND
```

## 5. Kho dữ liệu (Data Stores) chính

| Mã kho | Bảng | Tiến trình sử dụng |
|--------|------|--------------------|
| D1 | Users, Roles, UserRoles, Modules, Permissions, RolePermissions | 1.0, 6.0 |
| D2 | DanhSachNhanVien, DanhSachQuanHeGiaDinh, DanhSachQuaTrinhDaoTao | 2.0, 5.0 |
| D3 | DanhSachKyHDLD, DanhMucHDLD | 3.0, 5.0 |
| D4 | DanhSachHSL, DanhMucHSL, DanhSachNghiKhongLuong | 3.0, 5.0 |
| D5 | ThongTinBaoHiemHangThang, ThongTinBaoHiemCaNhan, QuaTrinhDongBaoHiem, DanhMucBenhVien | 3.0 |
| D6 | DanhSachCaNhan/TapThe HTNV/DHTD/KhenThuong | 4.0, 5.0 |
| D7 | DanhSachNghiPhepNam, DanhSachNgayNghiLe | 4.0 |
| D8 | DanhMuc* (trình độ, chức danh, chức vụ, phòng ban, năm học, tổ bộ môn, ngành ĐT) | mọi tiến trình (nhãn/nghiệp vụ) |

## 6. Nhận xét luồng dữ liệu

- Mọi luồng dữ liệu đi **trực tiếp** giữa client và Supabase (không qua backend trung gian). Điều này đơn giản hóa kiến trúc nhưng đặt gánh nặng bảo mật lên cấu hình Supabase (RLS).
- Luồng OCR (7.0 → Gemini) là luồng ra bên ngoài duy nhất mang nội dung tài liệu; cần kiểm soát dữ liệu nhạy cảm gửi đi.
- Dữ liệu danh mục (D8) được đọc lặp lại ở nhiều tiến trình để dựng nhãn – ứng viên tốt cho caching.

---
*Xem tiếp: BPMN/Flowchart (`06-BPMN-Flowchart-Quy-Trinh.md`).*
