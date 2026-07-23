# BRD – TÀI LIỆU YÊU CẦU NGHIỆP VỤ
## Hệ thống Quản lý Nhân sự – Trường Đại học Kiến trúc Đà Nẵng

| | |
|---|---|
| **Mã tài liệu** | BRD-DAU-HRM-01 |
| **Phiên bản** | 1.0 |
| **Ngày** | 02/07/2026 |

---

## 1. Bối cảnh & lý do triển khai

Trường Đại học Kiến trúc Đà Nẵng là cơ sở giáo dục đại học với đội ngũ cán bộ, giảng viên, nhân viên được tổ chức theo các Khoa, Phòng, Tổ bộ môn. Công tác quản lý nhân sự trước đây phụ thuộc nhiều vào hồ sơ giấy và bảng tính Excel rời rạc, dẫn tới:

- Dữ liệu phân tán, khó tra cứu và tổng hợp báo cáo.
- Khó theo dõi các mốc thời gian quan trọng (đến hạn ký HĐLĐ, đến kỳ nâng lương, hết hạn thẻ BHYT).
- Khó thống kê phục vụ báo cáo Bộ Giáo dục & Đào tạo và kiểm định chất lượng cơ sở giáo dục (CSGD).
- Rủi ro sai sót khi tính toán bảo hiểm, hệ số lương theo nhiều thời điểm.

Hệ thống DAU HRM được xây dựng nhằm **số hóa và tập trung hóa** toàn bộ dữ liệu nhân sự trên nền tảng web, cho phép nhiều đơn vị cùng khai thác theo phân quyền.

## 2. Mục tiêu nghiệp vụ (Business Goals)

| Mã | Mục tiêu | Chỉ số đo lường (KPI gợi ý) |
|----|----------|------------------------------|
| BG-01 | Tập trung hóa toàn bộ hồ sơ nhân sự trên một nền tảng duy nhất | 100% hồ sơ nhân sự đang làm việc được số hóa |
| BG-02 | Rút ngắn thời gian tra cứu & tổng hợp thông tin nhân sự | Tra cứu 1 hồ sơ < 30 giây |
| BG-03 | Chủ động cảnh báo các mốc hạn (HĐLĐ, nâng lương) | Không bỏ sót HĐLĐ đến hạn |
| BG-04 | Chuẩn hóa số liệu thống kê phục vụ báo cáo Bộ GD&ĐT và kiểm định CSGD | Xuất báo cáo theo chuẩn CSGD tức thời |
| BG-05 | Đảm bảo an toàn & phân quyền truy cập dữ liệu nhân sự nhạy cảm | Mỗi người dùng chỉ thấy đúng phân hệ được cấp quyền |
| BG-06 | Tự động hóa nhập liệu từ tài liệu (PDF/ảnh) bằng AI | Giảm thời gian nhập liệu thủ công |

## 3. Phân tích yêu cầu nghiệp vụ (Business Requirements)

### 3.1. Nhóm quản lý hồ sơ nhân sự

- **BR-01**: Hệ thống phải lưu trữ đầy đủ thông tin nhân sự: thông tin cá nhân (họ lót, tên, giới tính, ngày sinh, nơi sinh, nguyên quán, CCCD), thông tin liên hệ, thông tin công tác (khoa/phòng, chức vụ, chức danh, trình độ, ngày vào trường, ngày chính thức, tình trạng giảng viên).
- **BR-02**: Mỗi nhân sự có hồ sơ chi tiết bao gồm **quan hệ gia đình** và **quá trình đào tạo**.
- **BR-03**: Hệ thống phải phân biệt nhân sự đang làm việc và nhân sự đã nghỉ việc (`danghiviec`), cho phép theo dõi thời gian nghỉ việc.
- **BR-04**: Cho phép quản lý hình ảnh (ảnh thẻ) của nhân sự.

### 3.2. Nhóm tổ chức – đơn vị

- **BR-05**: Quản lý cây tổ chức: Khoa/Phòng → Tổ bộ môn; phân bổ nhân sự & giảng viên theo tổ bộ môn.
- **BR-06**: Quản lý danh mục ngành đào tạo và danh sách giảng viên theo ngành (phục vụ chuẩn đội ngũ CSGD).

### 3.3. Nhóm hợp đồng lao động

- **BR-07**: Quản lý danh mục loại HĐLĐ (thời hạn) và danh sách ký HĐLĐ của từng nhân sự (số HĐ, loại, lần ký, từ ngày – đến ngày).
- **BR-08**: Cảnh báo danh sách HĐLĐ **đến hạn ký** và danh sách nhân sự **kết thúc HĐLĐ / nghỉ việc**.

### 3.4. Nhóm lương & bảo hiểm

- **BR-09**: Quản lý danh mục hệ số lương (ngạch/bậc, số năm nâng bậc, mức nâng) và danh sách HSL của từng nhân sự theo mốc thời gian.
- **BR-10**: Lập danh sách **dự kiến nâng lương** dựa trên quy tắc số năm nâng bậc.
- **BR-11**: Quản lý danh sách nghỉ không lương (ảnh hưởng tính thời gian nâng lương).
- **BR-12**: Quản lý tỉ lệ đóng bảo hiểm theo tháng/năm cho từng loại (BHXH, BHYT, BHTN, BHTNLĐ – phần đơn vị và phần người lao động), thông tin bảo hiểm cá nhân (số sổ, nơi KCB, thai sản) và quá trình đóng bảo hiểm hằng tháng.
- **BR-13**: Tổng hợp số liệu bảo hiểm bắt buộc phục vụ báo cáo cơ quan BHXH.

### 3.5. Nhóm thi đua – khen thưởng – công tác

- **BR-14**: Quản lý mức độ hoàn thành nhiệm vụ (HTNV) theo cá nhân và tập thể theo năm học.
- **BR-15**: Quản lý danh hiệu thi đua (cá nhân, tập thể) và hình thức khen thưởng (cá nhân, tập thể) theo năm học.
- **BR-16**: Quản lý nâng cao trình độ (học tập nâng cao) của nhân sự.

### 3.6. Nhóm công phép & thống kê

- **BR-17**: Thiết lập ngày nghỉ lễ trong năm; quản lý & thống kê nghỉ phép năm của nhân sự.
- **BR-18**: Cung cấp thống kê tổng quan đội ngũ (số lượng, giới tính, trình độ, chức danh GS/PGS, tỉ lệ giảng viên), thống kê theo chức danh–trình độ, theo ngành và theo chuẩn CSGD.

### 3.7. Nhóm quản trị & công cụ

- **BR-19**: Quản lý người dùng, vai trò và phân quyền chi tiết theo từng phân hệ (module) và hành động (xem/thêm/sửa/xóa).
- **BR-20**: Sao lưu/xuất dữ liệu ra Excel; trích xuất dữ liệu từ CSDL, từ PDF/ảnh (OCR bằng AI); tách file PDF.
- **BR-21**: Quản lý danh mục dùng chung: trình độ, chức danh, chức vụ, khoa/phòng, năm học, mức độ HTNV, danh hiệu thi đua, hình thức khen thưởng.

## 4. Phạm vi (Scope)

### 4.1. Trong phạm vi (In-scope)
Toàn bộ 12 phân hệ nghiệp vụ nêu tại tài liệu Tổng quan; quản trị người dùng & phân quyền; công cụ sao lưu/trích xuất.

### 4.2. Ngoài phạm vi (Out-of-scope)
- Tính lương chi tiết & chi trả (payroll thực tế), kết nối ngân hàng.
- Chấm công tự động (máy chấm công), kết nối thiết bị phần cứng.
- Cổng tự phục vụ nhân viên (self-service) đầy đủ; nhân viên chỉ tra cứu hồ sơ cá nhân.
- Tích hợp trực tiếp với hệ thống của cơ quan BHXH/Thuế (hệ thống chỉ xuất số liệu).

## 5. Giả định & ràng buộc nghiệp vụ

- **AS-01**: Dữ liệu năm học có một giá trị mặc định (`macdinh`) dùng làm kỳ làm việc hiện hành.
- **AS-02**: Mã nhân viên (`manv`) là định danh nghiệp vụ duy nhất, dùng để liên kết mọi phân hệ.
- **AS-03**: Tài khoản có `manv = 1` hoặc `username = 'Admin'` được coi là quản trị viên toàn quyền.
- **CO-01**: Hệ thống dùng tiếng Việt là ngôn ngữ chính (có nút chuyển VN nhưng chưa đa ngôn ngữ đầy đủ).
- **CO-02**: Phụ thuộc hạ tầng đám mây Supabase và Google Gemini (yêu cầu Internet).

## 6. Phân tích người dùng & vai trò (Stakeholders & Roles)

### 6.1. Các bên liên quan (Stakeholders)

| Bên liên quan | Vai trò trong nghiệp vụ |
|---------------|--------------------------|
| Ban Giám hiệu (BGH) | Ra quyết định, xem thống kê tổng hợp |
| Phòng Tổ chức – Hành chính | Người dùng chính, quản lý toàn bộ hồ sơ & nghiệp vụ nhân sự |
| Bộ phận Kế toán/Bảo hiểm | Quản lý lương, HSL, bảo hiểm |
| Trưởng Khoa/Phòng, Tổ trưởng bộ môn | Tra cứu & quản lý nhân sự đơn vị mình (theo quyền) |
| Cán bộ, giảng viên, nhân viên | Tra cứu hồ sơ cá nhân |
| Quản trị viên hệ thống (Admin) | Quản lý người dùng, phân quyền, danh mục, sao lưu |

### 6.2. Mô hình vai trò kỹ thuật

Hệ thống áp dụng **RBAC** với 2 cấp:

1. **Quản trị viên (isAdmin)**: xác định bởi `manv = '1'` hoặc `username = 'Admin'` → toàn quyền (`ALL`) trên mọi module, bỏ qua kiểm tra chi tiết.
2. **Người dùng thường**: được gán **Vai trò (Role)** qua bảng `UserRoles`, và tập **quyền chi tiết** qua bảng `RolePermissions` — mỗi bản ghi gắn một *Module* (phân hệ) với một *Permission* (`READ`, `CREATE`, `UPDATE`, `DELETE`, `PARTIAL_UPDATE`, `ALL`).

Quy tắc suy diễn quyền (theo `permissionService.ts`):
- `ALL` → được mọi thao tác.
- Mọi quyền ghi (`CREATE`/`UPDATE`/`DELETE`/`PARTIAL_UPDATE`) đều **bao hàm** quyền `READ`.
- `PARTIAL_UPDATE` được tính như `UPDATE`.
- Không có bản ghi quyền cho module → `NONE` (menu bị vô hiệu hóa/ẩn thao tác).

### 6.3. Ma trận phân quyền (mẫu, minh họa)

| Module | Admin | Cán bộ TC-HC | Kế toán/BH | Trưởng đơn vị | Nhân viên |
|--------|:----:|:----:|:----:|:----:|:----:|
| Hồ sơ nhân sự | ALL | ALL | READ | READ (đơn vị) | – |
| Hồ sơ cá nhân | ALL | READ | READ | READ | READ |
| Lương & HSL | ALL | UPDATE | ALL | READ | – |
| Bảo hiểm | ALL | READ | ALL | – | – |
| Thi đua / Khen thưởng | ALL | ALL | – | READ | – |
| Quản lý người dùng & phân quyền | ALL | – | – | – | – |
| Danh mục | ALL | UPDATE | – | – | – |

*(Ma trận trên là mẫu tham chiếu; quyền thực tế do Admin cấu hình động trong phân hệ "Phân quyền chức năng".)*

## 7. Quy tắc nghiệp vụ chính (Business Rules)

| Mã | Quy tắc |
|----|---------|
| RULE-01 | Đăng nhập chấp nhận Username **hoặc** Email **hoặc** Mã NV; mật khẩu băm SHA-256 (định dạng chuỗi Argon2) phải khớp. |
| RULE-02 | Tài khoản `enable = false` bị chặn đăng nhập (trừ Admin id=1). |
| RULE-03 | Người dùng chưa được gán vai trò (`UserRoles`) không được vào hệ thống. |
| RULE-04 | Nút Thêm/Sửa/Xóa trên mỗi phân hệ bị vô hiệu hóa nếu người dùng không có quyền tương ứng. |
| RULE-05 | Dự kiến nâng lương tính theo số năm nâng bậc của ngạch/bậc trong danh mục HSL, có loại trừ thời gian nghỉ không lương. |
| RULE-06 | Số tiền đóng bảo hiểm tính theo tổng hệ số × lương cơ sở × tỉ lệ đóng theo tháng/năm hiệu lực. |
| RULE-07 | Thống kê tổng quan chỉ tính nhân sự `danghiviec = false`. |
| RULE-08 | Nhân sự nghỉ việc/kết thúc HĐLĐ được tách khỏi danh sách đang làm việc nhưng vẫn lưu trữ lịch sử. |

## 8. Phân tích rủi ro & ràng buộc (Business View)

| Mã | Rủi ro nghiệp vụ | Mức độ | Biện pháp giảm thiểu đề xuất |
|----|------------------|:------:|------------------------------|
| RISK-B01 | Rò rỉ dữ liệu nhân sự nhạy cảm (CCCD, lương, bảo hiểm) | Cao | Siết phân quyền, mã hóa, kiểm soát khóa API (xem SRS mục 7) |
| RISK-B02 | Sai sót tính bảo hiểm/nâng lương do cấu hình tỉ lệ/mốc sai | Cao | Quy trình duyệt số liệu, đối soát định kỳ |
| RISK-B03 | Phụ thuộc một cá nhân quản trị (Admin) | Trung bình | Phân tách vai trò, tài liệu hóa quy trình |
| RISK-B04 | Mất kết nối Internet làm gián đoạn nghiệp vụ | Trung bình | Kế hoạch dự phòng, sao lưu định kỳ ra Excel |
| RISK-B05 | Dữ liệu OCR (AI) sai lệch cần kiểm tra lại | Trung bình | Bắt buộc người dùng rà soát trước khi lưu |
| RISK-B06 | Không đồng bộ danh mục dùng chung gây lệch báo cáo | Thấp | Chuẩn hóa & khóa chỉnh sửa danh mục |

## 9. Tiêu chí thành công

- Toàn bộ nghiệp vụ BR-01…BR-21 được vận hành trên hệ thống.
- Người dùng khai thác đúng theo phân quyền, không xảy ra truy cập trái phép.
- Thống kê phục vụ báo cáo Bộ GD&ĐT và kiểm định CSGD được xuất chính xác, kịp thời.

---
*Xem tiếp: SRS (`02-SRS-System-Requirements.md`) để có đặc tả chức năng & phi chức năng chi tiết.*
