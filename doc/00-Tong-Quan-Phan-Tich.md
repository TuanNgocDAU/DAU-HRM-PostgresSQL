# TÀI LIỆU PHÂN TÍCH HỆ THỐNG
# HỆ THỐNG QUẢN LÝ NHÂN SỰ – TRƯỜNG ĐẠI HỌC KIẾN TRÚC ĐÀ NẴNG (DAU HRM)

| Thông tin | Chi tiết |
|-----------|----------|
| **Tên hệ thống** | Hệ thống Quản lý Nhân sự DAU (DAU Human Resource Management) |
| **Đơn vị chủ quản** | Trường Đại học Kiến trúc Đà Nẵng (DAU) |
| **Phiên bản ứng dụng** | 2.4.0 |
| **Loại ứng dụng** | Ứng dụng Web SPA (Single Page Application) |
| **Ngày lập tài liệu** | 02/07/2026 |
| **Người lập** | Bộ phận Phân tích Hệ thống |
| **Trạng thái** | Phân tích trên hệ thống đã triển khai (reverse engineering) |

---

## 1. Mục đích tài liệu

Bộ tài liệu này phân tích toàn diện Hệ thống Quản lý Nhân sự của Trường Đại học Kiến trúc Đà Nẵng nhằm:

- Ghi nhận và chuẩn hóa các **yêu cầu nghiệp vụ** và **yêu cầu chức năng** đang được hệ thống đáp ứng.
- Cung cấp cơ sở tài liệu cho việc **bảo trì, nâng cấp, chuyển giao** và **kiểm thử** hệ thống.
- Làm tài liệu tham chiếu cho các bên liên quan (nghiệp vụ, phát triển, kiểm thử, vận hành).

Tài liệu được xây dựng theo phương pháp **phân tích ngược (reverse engineering)** từ mã nguồn thực tế của ứng dụng, do đó phản ánh **hiện trạng hệ thống đang vận hành**.

## 2. Phạm vi phân tích

Hệ thống quản lý toàn bộ vòng đời nhân sự trong một cơ sở giáo dục đại học, bao gồm 12 phân hệ nghiệp vụ chính:

1. Hồ sơ & Danh sách nhân sự
2. Tổ chức: Khoa/Phòng, Tổ bộ môn, Ngành đào tạo
3. Hợp đồng lao động (HĐLĐ)
4. Lương & Hệ số lương (HSL)
5. Bảo hiểm (BHXH, BHYT, BHTN, BHTNLĐ)
6. Nâng cao trình độ (đào tạo)
7. Quá trình công tác & Mức độ hoàn thành nhiệm vụ (HTNV)
8. Thi đua
9. Khen thưởng
10. Thống kê số liệu
11. Quản lý công phép (nghỉ phép, nghỉ lễ)
12. Quản trị hệ thống: Người dùng, Phân quyền, Danh mục, Công cụ (sao lưu, trích xuất AI)

## 3. Kiến trúc công nghệ (tóm tắt)

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | React 19, TypeScript 5.8, Vite 6, TailwindCSS 4, lucide-react, motion |
| Backend / CSDL | Supabase (PostgreSQL + REST API tự sinh) |
| Xác thực | Cơ chế tự xây dựng trên bảng `Users` (băm mật khẩu SHA-256, định dạng chuỗi Argon2) |
| Trí tuệ nhân tạo | Google Gemini API (`@google/genai`) – OCR trích xuất văn bản, dịch thuật |
| Thư viện tài liệu | `xlsx` (Excel), `pdf-lib` + `pdfjs-dist` (PDF), `qrcode.react` |
| Triển khai | Client build tĩnh (Vite), nguồn gốc Google AI Studio |

## 4. Danh mục tài liệu đầu ra

| STT | Mã | Tài liệu | File |
|-----|-----|----------|------|
| 1 | — | Tổng quan phân tích (tài liệu này) | `00-Tong-Quan-Phan-Tich.md` |
| 2 | BRD | Tài liệu yêu cầu nghiệp vụ | `01-BRD-Business-Requirements.md` |
| 3 | SRS | Đặc tả yêu cầu hệ thống | `02-SRS-System-Requirements.md` |
| 4 | UC | Đặc tả ca sử dụng | `03-Use-Case-Specification.md` |
| 5 | ERD | Phân tích dữ liệu & sơ đồ thực thể quan hệ | `04-ERD-So-Do-Du-Lieu.md` |
| 6 | DFD | Sơ đồ luồng dữ liệu | `05-DFD-Luong-Du-Lieu.md` |
| 7 | BPMN | Sơ đồ quy trình nghiệp vụ / Flowchart | `06-BPMN-Flowchart-Quy-Trinh.md` |
| 8 | WF | Wireframe / Prototype giao diện | `07-Wireframe-Prototype.md` |
| 9 | RTM | Ma trận truy vết yêu cầu | `08-RTM-Ma-Tran-Truy-Vet.md` |

## 5. Ánh xạ yêu cầu phân tích → tài liệu

| Yêu cầu phân tích | Tài liệu chứa nội dung |
|-------------------|------------------------|
| Phân tích yêu cầu nghiệp vụ | BRD (mục 3–5) |
| Phân tích yêu cầu chức năng | SRS (mục 3) |
| Phân tích dữ liệu | ERD (toàn bộ) |
| Phân tích người dùng & vai trò | BRD (mục 6), Use Case (mục 2) |
| Phân tích quy trình & luồng công việc | BPMN/Flowchart (toàn bộ) |
| Phân tích giao diện & trải nghiệm người dùng | Wireframe/Prototype (toàn bộ) |
| Phân tích tích hợp hệ thống | SRS (mục 5) |
| Phân tích hạ tầng kỹ thuật | SRS (mục 4, 6) |
| Phân tích rủi ro & ràng buộc | BRD (mục 8), SRS (mục 7) |

## 6. Thuật ngữ & viết tắt

| Thuật ngữ | Giải thích |
|-----------|-----------|
| HRM | Human Resource Management – Quản lý nhân sự |
| HĐLĐ | Hợp đồng lao động |
| HSL | Hệ số lương |
| HTNV | Hoàn thành nhiệm vụ |
| DHTD | Danh hiệu thi đua |
| GV / GVNV | Giảng viên / Giảng viên – Nhân viên |
| BHXH / BHYT / BHTN / BHTNLĐ | Bảo hiểm xã hội / y tế / thất nghiệp / tai nạn lao động |
| RBAC | Role-Based Access Control – Kiểm soát truy cập theo vai trò |
| CSGD | Cơ sở giáo dục |
| BGH | Ban Giám hiệu |
| CRUD | Create – Read – Update – Delete |
| NV | Nhân viên (mã nhân viên: `manv`) |

---
*Tài liệu được lập trên cơ sở phân tích mã nguồn thực tế tại `F:\QuanLyNhanSu-Online\App-Local\DAU - Human Resource Management`.*
