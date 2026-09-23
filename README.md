# 161_react

Phần mềm Quản lý Doanh nghiệp (ERP System) xây dựng bằng **React + TypeScript + Vite + Tailwind CSS + Lucide Icons**.

## 🚀 Tính năng & Phân hệ đã xây dựng

1. **Giao diện Đăng nhập (`/dang-nhap`)**:
   - Xác thực người dùng, hỗ trợ ẩn/hiện mật khẩu, ghi nhớ đăng nhập, quên mật khẩu.
2. **Trang chủ Dashboard (`/`)**:
   - Lời chào động theo thời gian thực (*Buổi sáng, Chiều, Tối*).
   - Thẻ phân hệ tương tác (*Tổng quan, Tài chính, Hệ thống, Thông tin bản quyền, Cài đặt*).
3. **Phân hệ Tài chính (`/tai-chinh`)**:
   - 10 nhóm chức năng thuộc 3 khối nghiệp vụ (*Đề xuất & Kế hoạch, Danh mục, Báo cáo*).
4. **Quản lý Đề xuất Chi phí (`/tai-chinh/de-xuat-chi-phi`)**:
   - Bảng dữ liệu đa tính năng, ghim cột checkbox/mã/thao tác, chuyển đổi chế độ xem lưới/bảng.
   - Drawer Thêm/Sửa đề xuất với tính năng tự động tính tổng dòng chi phí.
   - Drawer Chi tiết đề xuất với luồng trình duyệt, in ấn, chuyển bản ghi linh hoạt.
5. **Cài đặt Hệ thống (`/cai-dat`)**:
   - 8 màu chủ đạo, chế độ Sáng/Tối/Hệ thống, 6 phông chữ tiếng Việt, cỡ chữ, định dạng ngày giờ, định dạng số tiền tệ, cấu hình bảng, tự động lưu `localStorage`.
6. **Layout & Header/Sidebar chung**:
   - Đồng hồ thời gian thực tiếng Việt, chuông thông báo, menu tài khoản người dùng, breadcrumb đa cấp độ, sidebar thu gọn mở rộng và drawer cho mobile.

## 🛠️ Hướng dẫn cài đặt & khởi chạy

1. Cài đặt các gói phụ thuộc:
```bash
npm install
```

2. Khởi chạy môi trường phát triển (Dev Server):
```bash
npm run dev
```

3. Biên dịch dự án (Production Build):
```bash
npm run build
```
