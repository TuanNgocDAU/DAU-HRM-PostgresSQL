# BPMN / FLOWCHART – SƠ ĐỒ QUY TRÌNH NGHIỆP VỤ
## Hệ thống Quản lý Nhân sự – Trường Đại học Kiến trúc Đà Nẵng

| | |
|---|---|
| **Mã tài liệu** | BPMN-DAU-HRM-06 |
| **Phiên bản** | 1.0 |
| **Ngày** | 02/07/2026 |

---

## 1. Quy trình Đăng nhập & Kiểm soát truy cập (Flowchart)

```mermaid
flowchart TD
    A([Bắt đầu]) --> B[Nhập Username/Email/Mã NV + Mật khẩu]
    B --> C{Tài khoản tồn tại?}
    C -- Không --> E1[Thông báo: Tài khoản không tồn tại] --> Z([Kết thúc])
    C -- Có --> D{Mật khẩu khớp<br/>passwordhash?}
    D -- Không --> E2[Thông báo: Sai mật khẩu] --> Z
    D -- Có --> F{enable = true?<br/>hoặc là Admin id=1}
    F -- Không --> E3[Thông báo: Tài khoản bị vô hiệu hóa] --> Z
    F -- Có --> G{Là Admin?}
    G -- Có --> K[Cấp toàn quyền ALL]
    G -- Không --> H{Có bản ghi<br/>UserRoles?}
    H -- Không --> E4[Thông báo: Chưa được phân quyền] --> Z
    H -- Có --> I[Nạp RolePermissions + Modules + Permissions]
    I --> J[Chuẩn hóa quyền<br/>normalizePermissions]
    J --> K
    K --> L[Tạo phiên & dựng menu theo quyền]
    L --> M([Vào Dashboard])
```

## 2. Quy trình CRUD chuẩn có kiểm soát quyền (áp dụng cho mọi phân hệ)

```mermaid
flowchart TD
    A([Mở phân hệ]) --> B[Tải dữ liệu + danh mục<br/>Promise.all]
    B --> C[Hiển thị danh sách + tìm kiếm/lọc]
    C --> D{Người dùng chọn thao tác}
    D -- Xem --> V[Xem chi tiết / hồ sơ]
    D -- Thêm --> C1{Có quyền CREATE?}
    D -- Sửa --> U1{Có quyền UPDATE?}
    D -- Xóa --> X1{Có quyền DELETE?}
    C1 -- Không --> N[Nút bị vô hiệu hóa] --> C
    U1 -- Không --> N
    X1 -- Không --> N
    C1 -- Có --> F1[Mở form nhập liệu]
    U1 -- Có --> F1
    F1 --> V1{Hợp lệ dữ liệu?}
    V1 -- Không --> E[Thông báo lỗi] --> F1
    V1 -- Có --> S[Ghi Supabase insert/update]
    X1 -- Có --> XC{Xác nhận xóa?}
    XC -- Không --> C
    XC -- Có --> S
    S --> R{Thành công?}
    R -- Không --> E
    R -- Có --> T[Thông báo thành công + tải lại danh sách] --> C
```

## 3. Quy trình Quản lý Hợp đồng lao động & cảnh báo đến hạn (BPMN dạng lane)

```mermaid
flowchart TD
    subgraph CB["Cán bộ Nhân sự"]
      A([Nhân sự mới / tái ký]) --> B[Tạo bản ghi ký HĐLĐ<br/>số HĐ, loại, từ–đến ngày]
      B --> C[Lưu DanhSachKyHDLD]
    end
    subgraph HT["Hệ thống"]
      C --> D[Đối chiếu denngay với ngày hiện tại]
      D --> E{Sắp đến hạn?}
      E -- Có --> F[Đưa vào danh sách<br/>Đến hạn ký HĐLĐ]
      E -- Không --> G[Giữ trong danh sách hiệu lực]
      F --> H{Xử lý?}
    end
    subgraph CB2["Cán bộ Nhân sự"]
      H -- Tái ký --> B
      H -- Kết thúc --> I[Cập nhật danghiviec = true<br/>+ thời gian nghỉ việc]
      I --> J([Chuyển sang DS nghỉ việc])
    end
```

## 4. Quy trình Nghiệp vụ Lương – Dự kiến nâng lương

```mermaid
flowchart TD
    A([Bắt đầu kỳ xét nâng lương]) --> B[Đọc DanhSachHSL của nhân sự<br/>lấy mốc thoigianbatdau]
    B --> C[Đọc DanhMucHSL<br/>lấy sonamnangbac, sobac, mucnang]
    C --> D[Đọc DanhSachNghiKhongLuong]
    D --> E[Tính thời gian giữ bậc<br/>= hiện tại − mốc − nghỉ không lương]
    E --> F{Đủ số năm nâng bậc?}
    F -- Chưa --> G[Không đưa vào DS dự kiến]
    F -- Đủ --> H{Còn trong giới hạn sobac /<br/>hệ số tối đa?}
    H -- Không --> I[Đánh dấu hết diện xét]
    H -- Có --> J[Đưa vào Danh sách dự kiến nâng lương]
    J --> K([Kết thúc])
    G --> K
    I --> K
```

## 5. Quy trình tính & tổng hợp Bảo hiểm hằng tháng

```mermaid
flowchart TD
    A([Chọn tháng/năm]) --> B{Đã có tỉ lệ đóng<br/>ThongTinBaoHiemHangThang?}
    B -- Chưa --> C[Khai báo tỉ lệ đóng BHXH/BHYT/BHTN/BHTNLĐ] --> D
    B -- Rồi --> D[Lấy tổng hệ số từng nhân sự<br/>DanhSachHSL]
    D --> E[Tính tiền lương + phụ cấp]
    E --> F[Tính tiền từng loại BH<br/>= lương × tỉ lệ %]
    F --> G[Ghi QuaTrinhDongBaoHiem]
    G --> H[Tổng hợp số liệu BH bắt buộc theo đơn vị]
    H --> I([Xuất/đối soát với cơ quan BHXH])
```

## 6. Quy trình Trích xuất dữ liệu bằng AI (OCR)

```mermaid
flowchart TD
    A([Tải lên PDF/ảnh]) --> B[Chuyển base64 + xác định mimeType]
    B --> C{Có GEMINI_API_KEY?}
    C -- Không --> E1[Báo lỗi: thiếu API Key] --> Z([Kết thúc])
    C -- Có --> D[Gọi Gemini extractText]
    D --> E[Nhận văn bản thô]
    E --> F{Cần dịch?}
    F -- Có --> G[Gọi translateText] --> H
    F -- Không --> H[Hiển thị kết quả cho người dùng]
    H --> I[Người dùng rà soát & chỉnh sửa]
    I --> J([Sử dụng/nhập vào hệ thống])
```

## 7. Quy trình Phân quyền người dùng mới (Admin)

```mermaid
flowchart TD
    A([Admin bắt đầu]) --> B[Tạo tài khoản Users<br/>gắn manv, băm mật khẩu]
    B --> C[Bật enable = true]
    C --> D[Gán vai trò trong UserRoles]
    D --> E[Cấp quyền chi tiết trong RolePermissions<br/>Module × Permission]
    E --> F([Người dùng đăng nhập/Làm mới quyền])
    F --> G{Menu hiển thị đúng quyền?}
    G -- Có --> H([Hoàn tất])
    G -- Không --> E
```

## 8. Nhận xét về quy trình

- **Điểm kiểm soát quyền** xuất hiện đồng nhất ở mọi phân hệ (mục 2) — đây là điểm mạnh về tính nhất quán trải nghiệm; tuy nhiên kiểm soát nằm ở client (khuyến nghị bổ sung ở tầng DB, xem RISK-T03).
- Các quy trình đến-hạn (HĐLĐ, nâng lương) hiện dựa trên **so sánh chuỗi ngày** — nên chuẩn hóa kiểu ngày để tính toán chính xác.
- Quy trình có "điểm dừng con người" (rà soát OCR, xác nhận xóa, xử lý đến hạn) giúp giảm rủi ro sai sót tự động.

---
*Xem tiếp: Wireframe/Prototype (`07-Wireframe-Prototype.md`).*
