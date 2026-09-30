# 🔐 Hướng dẫn cài đặt & Sử dụng Extension ERP PassVault

Tiện ích mở rộng **ERP PassVault** giúp quản lý mật khẩu an toàn, tra cứu tức thì, tự động nhận diện form đăng nhập/đăng ký trên mọi trang web và tự động lưu mật khẩu nhanh chóng.

---

## 1. Tính năng nổi bật

1. **Xem & Quản lý toàn bộ Mật khẩu trực tiếp trên Extension**:
   - Tra cứu, tìm kiếm nhanh theo tiêu đề, email/username, website.
   - Lọc theo danh mục: *Công việc, Email, Website, Mạng XH, Server, Tài chính, Phần mềm*.
   - Ẩn/Hiện mật khẩu, sao chép nhanh 1 chạm (Copy User, Copy Pass).
   - Nút **+ Thêm tài khoản mới** và **✏️ Sửa / 🗑️ Xóa** trực tiếp trong Popup mà không cần mở tab mới.

2. **Tự động bắt form & Thêm mật khẩu nhanh (Auto-Detect & Quick Save)**:
   - Khi bạn đăng nhập hoặc đăng ký tài khoản mới trên bất kỳ trang web nào (Facebook, Google, GitHub, Ngân hàng, Portal công ty...), Extension sẽ tự động phát hiện và hiển thị thanh thông báo:
     > 🛡️ **ERP PassVault - Lưu tài khoản vào kho bảo mật?**
     > [Website: domain.com] | [User: ...] | [Mật khẩu: ••••••••]
     > Nút: **[💾 Lưu vào Vault]** & **[Bỏ qua]**
   - Chỉ với 1 cú click **[💾 Lưu vào Vault]**, tài khoản được lưu ngay vào kho bảo mật và đồng bộ với danh sách.

3. **Trợ lý Icon Thông minh ngay tại ô Mật khẩu (Inline Helper)**:
   - Khi bạn nhấp vào bất kỳ ô mật khẩu nào trên trang web, icon chiếc chìa khóa xanh ERP sẽ xuất hiện.
   - Nhấp vào icon để:
     - ⚡ **Điền tài khoản đã lưu khớp trang**
     - ✨ **Tạo mật khẩu mạnh tự động 16 ký tự** (tự điền cả 2 ô Mật khẩu & Xác nhận mật khẩu)
     - 💾 **Mở thanh lưu tài khoản ngay lập tức**

4. **Đồng bộ 2 chiều với Web ERP Doanh nghiệp**:
   - Sao chép mã **Sync Token JSON** từ Web ERP để cập nhật kho mật khẩu trên Extension.
   - Xuất / Nhập tệp JSON sao lưu linh hoạt.

---

## 2. Hướng dẫn cài đặt vào Trình duyệt (Chỉ 30 giây)

### Bước 1: Mở trang Quản lý Tiện ích (Extensions)
- **Google Chrome / Cốc Cốc / Brave**: Truy cập `chrome://extensions/`
- **Microsoft Edge**: Truy cập `edge://extensions/`

### Bước 2: Bật Chế độ dành cho nhà phát triển (Developer mode)
- Gạt công tắc **Developer mode** ở góc trên cùng bên phải màn hình sang trạng thái **BẬT (ON)**.

### Bước 3: Tải Tiện ích đã giải nén (Load unpacked)
- Nhấn vào nút **"Load unpacked"** (Tải tiện ích đã giải nén) ở góc trên bên trái.
- Chọn thư mục `chrome-extension` trong dự án:
  `d:\tải xuống 2\h161 react\chrome-extension`

### Bước 4: Ghim Tiện ích lên thanh công cụ
- Nhấn vào biểu tượng hình **Mảnh ghép** (Extensions) ở góc trên bên phải trình duyệt.
- Nhấn vào biểu tượng **Ghim (Pin)** bên cạnh **ERP PassVault - Quản lý Mật khẩu & Auto-Fill**.

---

## 3. Thử nghiệm tính năng Auto-Save & Auto-Fill

1. Truy cập bất kỳ trang đăng nhập hoặc đăng ký (ví dụ: Google, GitHub, Facebook, hoặc hệ thống nội bộ).
2. Nhập thông tin đăng nhập và bấm Đăng nhập/Đăng ký -> Extension sẽ hiện popup hỏi bạn có muốn lưu vào **ERP PassVault** không.
3. Bấm **[💾 Lưu vào Vault]** -> Tài khoản được ghi nhận ngay lập tức!
4. Mở icon Extension ở góc trình duyệt: Tài khoản vừa lưu sẽ xuất hiện ở đầu danh sách với huy hiệu **★ Khớp trang**.
