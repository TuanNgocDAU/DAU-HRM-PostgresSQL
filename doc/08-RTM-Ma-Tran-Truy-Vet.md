# RTM – MA TRẬN TRUY VẾT YÊU CẦU (Requirement Traceability Matrix)
## Hệ thống Quản lý Nhân sự – Trường Đại học Kiến trúc Đà Nẵng

| | |
|---|---|
| **Mã tài liệu** | RTM-DAU-HRM-08 |
| **Phiên bản** | 1.0 |
| **Ngày** | 02/07/2026 |

---

## 1. Mục đích

Ma trận truy vết liên kết **Mục tiêu nghiệp vụ (BG)** → **Yêu cầu nghiệp vụ (BR)** → **Yêu cầu chức năng (FR)** → **Use Case (UC)** → **Thành phần triển khai (component/bảng dữ liệu)** → **Trạng thái**, nhằm đảm bảo mọi yêu cầu đều được hiện thực và kiểm chứng.

**Trạng thái**: ✅ Đã triển khai (xác nhận trong mã nguồn).

## 2. Ma trận truy vết chính

| BR | FR | UC | Module (mã) | Component nguồn | Bảng dữ liệu chính | TT |
|----|----|----|-------------|-----------------|--------------------|:--:|
| RULE-01..03 | FR-AUTH-01..03 | UC-01 | (đăng nhập) | `LoginForm.tsx`, `permissionService.ts` | Users, UserRoles, RolePermissions, Modules, Permissions | ✅ |
| BR-19 | FR-AUTH-04 | UC-02 | `caiDat` | `AdminDashboard.tsx` (ChangePasswordModal) | Users | ✅ |
| BR-19 | FR-AUTH-05 | UC-01 | — | `AdminDashboard.tsx` (refreshPermissions) | RolePermissions | ✅ |
| BR-01,02 | FR-HS-01..05 | UC-10, UC-11 | `hoSoNhanSu` | `HoSoNhanSuManagement.tsx` | DanhSachNhanVien, DanhSachQuanHeGiaDinh, DanhSachQuaTrinhDaoTao | ✅ |
| BR-01 | FR-HS-06 | UC-03 | `traCuu-hoSo` | `UserProfile.tsx` | DanhSachNhanVien | ✅ |
| BR-03 | FR-HS-07 | UC-10 | `traCuu-khoaPhong` | `DanhSachNhanSuKhoaPhong.tsx`, `DanhSachNhanVienNghiViec.tsx` | DanhSachNhanVien, DanhMucPhongBan | ✅ |
| BR-04 | FR-HS-08 | UC-10 | `hinhAnhNhanSu` | `HinhAnhNhanSuSettings.tsx` | DanhSachNhanVien | ✅ |
| BR-05 | FR-ORG-01,02 | UC-12 | `toBoMon-*` | `DanhMucToBoMonManagement.tsx`, `GiangVienToBoMonManagement.tsx`, `ToBoMonStatistics.tsx` | DanhMucToBoMon, DanhSachNhanSuBoMon | ✅ |
| BR-06 | FR-ORG-03 | UC-12 | `nganhHoc-*` | `DanhMucNganhDaoTaoManagement.tsx`, `DanhSachGVNganhDaoTaoManagement.tsx`, `NganhDaoTaoStatistics.tsx` | DanhMucNganhDaoTao, DanhSachGVNganhDaoTao | ✅ |
| BR-07 | FR-HDLD-01,02 | UC-13 | `hdld-danhMuc`, `hdld-danhSachKy` | `DanhMucHDLDManagement.tsx`, `DanhSachKyHDLDManagement.tsx` | DanhMucHDLD, DanhSachKyHDLD | ✅ |
| BR-08 | FR-HDLD-03,04 | UC-14 | `hdld-denHanKy`, `hdld-ketThuc` | `DanhSachDenHanKyHDLD.tsx`, `DanhSachNhanVienNghiViec.tsx` | DanhSachKyHDLD, DanhSachNhanVien | ✅ |
| BR-07 | FR-HDLD-05 | UC-13 | `hdld-overview` | `HopDongLaoDongOverview.tsx` | DanhSachKyHDLD | ✅ |
| BR-09 | FR-SAL-01,02 | UC-15 | `luong-danhMucHSL`, `luong-danhSachHSL` | `DanhMucHSLManagement.tsx`, `DanhSachHSLManagement.tsx` | DanhMucHSL, DanhSachHSL | ✅ |
| BR-11 | FR-SAL-03 | UC-15 | `luong-nghiKhongLuong` | `NghiKhongLuongManagement.tsx` | DanhSachNghiKhongLuong | ✅ |
| BR-10 | FR-SAL-04 | UC-16 | `luong-duKienNangLuong` | `DuKienNangLuongList.tsx` | DanhSachHSL, DanhMucHSL | ✅ |
| BR-12 | FR-INS-01 | UC-21 | `baoHiem-danhMucBenhVien` | `DanhMucBenhVienManagement.tsx` | DanhMucBenhVien | ✅ |
| BR-12 | FR-INS-02 | UC-21 | `baoHiem-tiLeDong` | `BaoHiemTiLeDongManagement.tsx` | ThongTinBaoHiemHangThang | ✅ |
| BR-12 | FR-INS-03,04 | UC-21 | `baoHiem-danhSachThamGia` | `BaoHiemDanhSachThamGiaManagement.tsx` | ThongTinBaoHiemCaNhan, QuaTrinhDongBaoHiem | ✅ |
| BR-13 | FR-INS-05 | UC-21 | `baoHiem-soLieuBatBuoc` | `BaoHiemSoLieuBatBuoc.tsx` | QuaTrinhDongBaoHiem, ThongTinBaoHiemHangThang | ✅ |
| BR-14 | FR-MERIT-01 | UC-17 | `htnv-ca-nhan`, `htnv-tap-the` | `DanhSachCaNhanHTNVManagement.tsx`, `DanhSachTapTheHTNVManagement.tsx` | DanhSachCaNhanHTNV, DanhSachTapTheHTNV | ✅ |
| BR-15 | FR-MERIT-02 | UC-17 | `thiDua-caNhan`, `thiDua-tapThe` | `DanhSachCaNhanDHTDManagement.tsx`, `DanhSachTapTheDHTDManagement.tsx` | DanhSachCaNhanDHTD, DanhSachTapTheDHTD | ✅ |
| BR-15 | FR-MERIT-03 | UC-17 | `khenThuong-caNhan`, `khenThuong-tapThe` | `DanhSachCaNhanKhenThuongManagement.tsx`, `DanhSachTapTheKhenThuongManagement.tsx` | DanhSachCaNhanKhenThuong, DanhSachTapTheKhenThuong | ✅ |
| BR-16 | FR-MERIT-04 | UC-18 | `daoTao` | `NangCaoTrinhDoManagement.tsx` | DanhSachHocTapNangCaoTrinhDo | ✅ |
| BR-14 | FR-MERIT-05 | UC-17 | `quaTrinhCongTac-overview`, `thiDua-overview` | `QuaTrinhCongTacOverview.tsx`, `ThiDuaOverview.tsx` | (tổng hợp) | ✅ |
| BR-17 | FR-LEAVE-01..03 | UC-19 | `congCu-quanLyCongPhep-*` | `NgayNghiLeManagement.tsx`, `NghiPhepNamManagement.tsx`, `ThongKeNghiPhepManagement.tsx` | DanhSachNgayNghiLe, DanhSachNghiPhepNam | ✅ |
| BR-18 | FR-STAT-01 | UC-20 | `dashboard` | `AdminDashboard.tsx` (DashboardOverview) | DanhSachNhanVien, DanhMuc* | ✅ |
| BR-18 | FR-STAT-02 | UC-20 | `thongKe-trinhDoChucDanh` | `ThongKeTrinhDoChucDanh.tsx` | DanhSachNhanVien, DanhMucTrinhDo/ChucDanh | ✅ |
| BR-18 | FR-STAT-03 | UC-20 | `thongKe-chuanCSGD` | `ChuanCSGDStatistics.tsx` | DanhSachGVNganhDaoTao, DanhMucNganhDaoTao | ✅ |
| BR-19 | FR-ADMIN-01 | UC-30 | `quanLyNguoiDung` | `UserManagement.tsx` | Users | ✅ |
| BR-19 | FR-ADMIN-02 | UC-31 | `phanQuyen` | `UserRoleManagement.tsx` | UserRoles, Roles | ✅ |
| BR-19 | FR-ADMIN-03 | UC-32 | `danhMucChucNang` | `DanhMucChucNangManagement.tsx` | Modules | ✅ |
| BR-19 | FR-ADMIN-04 | UC-32 | `phanQuyenChucNang` | `RolePermissionManagement.tsx` | RolePermissions, Modules, Permissions | ✅ |
| BR-21 | FR-ADMIN-05 | UC-33 | `danhMuc-*` | `DanhMucTrinhDoManagement.tsx`, `DanhMucChucDanhManagement.tsx`, `DanhMucChucVuManagement.tsx`, `DanhMucPhongBanManagement.tsx`, `DanhMucNamHocManagement.tsx`, `DanhMucMucDoHTNVManagement.tsx`, `DanhMucDanhHieuThiDuaManagement.tsx`, `DanhMucHinhThucKhenThuongManagement.tsx` | DanhMucTrinhDo, DanhMucChucDanh, DanhMucChucVu, DanhMucPhongBan, DanhMucNamHoc, DanhMucMucDoHTNV, DanhMucDanhHieuThiDua, DanhMucHinhThucKhenThuong | ✅ |
| BR-20 | FR-TOOL-01,02 | UC-34 | `congCu-saoLuu`, `congCu-trichXuat-csdl` | `DSTableManagement.tsx`, `ExtractDataFromFiles.tsx` | (mọi bảng) | ✅ |
| BR-20 | FR-TOOL-03 | UC-35 | `congCu-trichXuat-pdf` | `ExtractDataFromFiles.tsx`, `services/geminiService.ts` | — (Gemini API) | ✅ |
| BR-20 | FR-TOOL-04 | UC-35 | `congCu-tachPdf` | `SplitPDFManagement.tsx` | — | ✅ |

## 3. Truy vết Mục tiêu nghiệp vụ → Yêu cầu

| Mục tiêu (BG) | Yêu cầu nghiệp vụ liên quan | Chức năng đáp ứng |
|---------------|------------------------------|--------------------|
| BG-01 Tập trung hóa hồ sơ | BR-01..06 | FR-HS-*, FR-ORG-* |
| BG-02 Tra cứu nhanh | BR-01,03,18 | FR-HS-01/06, FR-STAT-01 |
| BG-03 Cảnh báo hạn | BR-08,10 | FR-HDLD-03, FR-SAL-04 |
| BG-04 Chuẩn hóa báo cáo | BR-18 | FR-STAT-01..03 |
| BG-05 An toàn & phân quyền | BR-19, RULE-01..04 | FR-AUTH-*, FR-ADMIN-* |
| BG-06 Tự động hóa nhập liệu AI | BR-20 | FR-TOOL-03 |

## 4. Truy vết Rủi ro → Yêu cầu/khuyến nghị kiểm soát

| Rủi ro | Liên quan yêu cầu | Khuyến nghị kiểm chứng |
|--------|-------------------|------------------------|
| RISK-T01 (lộ khóa) | FR-AUTH-*, INT-01/02 | Kiểm tra bật RLS; ẩn khóa AI sau backend |
| RISK-T02 (băm mật khẩu yếu) | FR-AUTH-01 | Rà soát thuật toán băm + muối |
| RISK-T03 (quyền ở client) | FR-ADMIN-04 | Kiểm thử vượt quyền qua gọi API trực tiếp |
| RISK-B02 (sai tính BH/lương) | FR-INS-04, FR-SAL-04 | Case kiểm thử số học đối soát |
| RISK-B05 (OCR sai) | FR-TOOL-03 | Bắt buộc bước rà soát trước lưu |

## 5. Thống kê độ phủ

| Nhóm | Số FR | Đã triển khai |
|------|:-----:|:-------------:|
| Xác thực & phiên | 7 | 7 (✅) |
| Hồ sơ nhân sự | 8 | 8 (✅) |
| Tổ chức | 3 | 3 (✅) |
| Hợp đồng lao động | 5 | 5 (✅) |
| Lương & HSL | 4 | 4 (✅) |
| Bảo hiểm | 5 | 5 (✅) |
| Thi đua/Khen thưởng/Công tác | 5 | 5 (✅) |
| Công phép | 3 | 3 (✅) |
| Thống kê | 3 | 3 (✅) |
| Quản trị & danh mục | 5 | 5 (✅) |
| Công cụ | 4 | 4 (✅) |
| **Tổng** | **52** | **52 (100%)** |

> Ghi chú: Một số mục menu (Giảng viên mời – thỉnh giảng/đồng cơ hữu, tra cứu BGH) hiển thị trong cấu trúc điều hướng nhưng thuộc diện **"Tính năng đang cập nhật"** trong mã nguồn — chưa nằm trong 52 FR đã xác nhận triển khai ở trên.

---
*Kết thúc bộ tài liệu phân tích. Tham chiếu tài liệu tổng quan tại `00-Tong-Quan-Phan-Tich.md`.*
