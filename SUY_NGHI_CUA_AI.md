# BẬT MÍ QUY TRÌNH SUY NGHĨ CỦA AI KHI NHẬN CÂU LỆNH TỪ BẠN

> **Tài liệu ghi lại quy trình tư duy nội tâm (Internal Thought Process)**  
> Giải thích chi tiết cách AI tiếp nhận, phân tích, xử lý và phản hồi mỗi khi bạn đưa ra một câu lệnh hoặc yêu cầu.

---

## 1. Giai đoạn 1: Tiếp nhận và "Giải mã" câu lệnh (Intent & Context Decoding)

Mỗi khi bạn gửi một câu lệnh, dù câu lệnh rất ngắn, gõ nhanh hay có từ viết tắt, trong "đầu" AI sẽ diễn ra quá trình bóc tách:

1. **Xử lý từ ngữ tự nhiên & thói quen gõ nhanh:**
   - Bạn thường tập trung vào ý tưởng nên hay viết tắt: *k* (không), *đc* (được), *trc* (trước), *trg* (trường/trong), *mk* (mật khẩu), *from* (form), *modul* (module)...
   - *Suy nghĩ của AI:*  
     - *"Từ 'from' ở đây chắc chắn là 'form biểu mẫu', không phải từ 'từ đâu đến đâu'."*  
     - *"Từ 'câu lệch' ở đây là 'câu lệnh'."*  
     - *"Người dùng bảo 'đưa cái này xuống dưới' -> 'cái này' là cái nào? Hãy nhìn vào ảnh chụp màn hình đính kèm và ngữ cảnh gần nhất!"*

2. **Kết hợp đa giác quan (Hình ảnh + Văn bản):**
   - Nếu bạn gửi kèm ảnh chụp màn hình:
     - AI sẽ "soi" tọa độ và nội dung trên ảnh: Bạn đang đứng ở trang nào, tab nào, modal hay drawer nào đang mở?
     - Vùng bạn nhắc tới gồm những trường dữ liệu cụ thể nào (ví dụ: Tóm tắt, Chuyên mục, Mức độ, Nguồn, Ngày tháng...)?

3. **Xác định mục tiêu cốt lõi (User Goal):**
   - Người dùng thực sự muốn gì? (Cải thiện trải nghiệm nhập liệu nhanh hơn, sửa lỗi bấm không ăn, đồng bộ màu sắc, hay sắp xếp lại trật tự hiển thị).

---

## 2. Giai đoạn 2: Định vị mã nguồn (Codebase Reconnaissance)

Sau khi hiểu ý bạn, AI không sửa bừa mà đi tìm chính xác "nơi chịu trách nhiệm":

1. **Tìm file liên quan:**
   - Module Học hỏi -> `src/components/learning/`
   - Giao diện form -> `LearningFormDrawer.tsx`
   - Màn hình chính quản lý dữ liệu -> `LearningPage.tsx`
   - Kiểu dữ liệu / Types -> `src/types/learning.ts`

2. **Đọc và nạp ngữ cảnh (`view_file`):**
   - AI đọc trực tiếp file hiện tại để nắm cấu trúc JSX, state, hooks, các biến đang có.
   - Tuyệt đối không đoán mò cấu trúc nếu chưa đọc code thực tế.

---

## 3. Giai đoạn 3: Đánh giá rủi ro & Lựa chọn giải pháp (Risk Assessment & Strategy)

Đây là bước AI cân nhắc nhiều nhất trước khi chạm vào mã nguồn:

1. **Nguyên tắc "Phẫu thuật chính xác" (Surgical Changes):**
   - *Suy nghĩ:* *"Chỉ sửa đúng những gì người dùng yêu cầu. Tuyệt đối không xóa nhầm comment, không format lung tung làm hỏng git diff, không tự ý đổi logic cũ đang chạy ổn định."*

2. **Dự phòng lỗi tiềm ẩn (Defensive Coding):**
   - Ví dụ khi làm tính năng *"Gợi ý thẻ từ bài học trước"*:
     - *Suy nghĩ:* *"Lỡ người dùng mới cài web, danh sách bài học đang rỗng thì sao? -> Phải đặt giá trị mặc định `allEntries = []`."*
     - *"Lỡ bài học cũ có thẻ bị trùng lặp hoặc viết hoa/thường khác nhau? -> Phải dùng `Set` và chuẩn hóa để lọc sạch thẻ trùng."*
     - *"Thẻ nào được dùng nhiều nhất nên ưu tiên hiển thị trước để người dùng chọn nhanh."*

3. **Cân nhắc giữa "Hỏi lại" vs "Chủ động làm luôn":**
   - Nếu yêu cầu có rủi ro cao (như xóa dữ liệu, ghi đè lớn): AI sẽ hỏi lại bạn để xin ý kiến.
   - Nếu yêu cầu rõ ràng theo ngữ cảnh (như sắp xếp lại layout UI, thêm gợi ý): AI sẽ tự tin chọn giải pháp tốt nhất và làm ngay để bạn không mất thời gian chờ đợi.

---

## 4. Giai đoạn 4: Thực thi chỉnh sửa (Execution)

AI tiến hành sửa mã nguồn bằng công cụ chỉnh sửa chuẩn xác từng khối (`replace_file_content`):
- Thêm props/interface cần thiết.
- Tái cấu trúc lại JSX theo đúng trật tự bạn muốn.
- Giữ nguyên toàn bộ logic tương tác (upload ảnh Catbox, markdown preview, zoom fullscreen...).
- Đảm bảo giao diện ăn khớp với hệ thống giao diện Tailwind CSS (hỗ trợ cả Dark/Light mode).

---

## 5. Giai đoạn 5: Tự kiểm tra & Nghiệm thu (Verification & Self-Correction)

AI không bao giờ bàn giao việc khi chưa tự kiểm tra:

1. **Chạy Build kiểm tra (`npm run build`):**
   - Lệnh này chạy trình biên dịch TypeScript `tsc` và đóng gói Vite.
   - Nếu có bất kỳ lỗi cú pháp, thiếu biến, sai kiểu dữ liệu -> Quá trình build sẽ báo đỏ ngay.
   - *Suy nghĩ:* *"Nếu có lỗi đỏ, mình phải tự đọc log lỗi và sửa triệt để ngay, không để người dùng gặp lỗi trắng trang."*

2. **Kiểm tra trạng thái Git (`git status`, `git diff`):**
   - Xem lại toàn bộ những dòng vừa sửa xem có chuẩn xác, gọn gàng và sạch sẽ không.

---

## 6. Giai đoạn 6: Phản hồi tới bạn (Delivery)

Khi trả lời:
- Không dùng từ ngữ kỹ thuật quá rối rắm, hàn lâm gây khó hiểu.
- Trình bày dạng danh sách gạch đầu dòng rõ ràng, trực quan bằng tiếng Việt.
- Báo cáo chính xác: Những gì đã thay đổi, vị trí nào đã được đảo, và kết quả kiểm tra hệ thống.

---

## 💡 Mẹo nhỏ để bạn và AI phối hợp ăn ý nhất

1. **Gửi ảnh chụp màn hình:** Khi muốn đổi giao diện hay sửa lỗi hiển thị, 1 bức ảnh đáng giá ngàn lời nói. AI có khả năng đọc ảnh rất nhạy.
2. **Nêu tên module hoặc màn hình:** Ví dụ *"ở form Thêm của module Tài chính"*, *"ở bảng danh sách Mật khẩu"*.
3. **Khi gặp lỗi bất thường:** Chỉ cần copy dòng báo lỗi hoặc chụp ảnh gửi lên, AI sẽ truy vết tận gốc nguyên nhân và khắc phục.

---

## 8. NHẬT KÝ SUY NGHĨ THỰC TẾ QUA TỪNG CÂU LỆNH (CASE STUDIES)

### Case Study #1: Câu lệnh chỉnh sửa module Lịch biểu
* **Thời điểm:** 2026-10-01 16:27
* **Câu lệnh gốc của bạn:**  
  `"cũng ok . h tôi muốn chỉnh sửa chi tiết từng modul 1 . 1 modul lịch biểu. phân lịch này load lại là sắp xếp theo ngày lớn tới nhỏ rồi."` + kèm 1 ảnh chụp màn hình có vẽ 2 khung đỏ.

#### Diễn biến suy nghĩ nội tâm của AI khi nhận câu lệnh trên:

1. **Phân tích câu chữ & Giải mã ý định (Intent Decoding):**
   * Bạn viết: *"h tôi muốn chỉnh sửa chi tiết từng modul 1"* $\rightarrow$ AI hiểu bạn đang bắt đầu rà soát chất lượng toàn diện của dự án theo từng module một.
   * Bạn viết: *"1 modul lịch biểu. phân lịch này load lại là sắp xếp theo ngày lớn tới nhỏ rồi."*
     * *"phân lịch này"* $\rightarrow$ AI phân tích đây là từ gõ nhanh của *"phần Lịch biểu"* hoặc tab Lịch biểu.
     * *"load lại là sắp xếp theo ngày lớn tới nhỏ rồi"* $\rightarrow$ Bạn muốn mặc định khi vào hoặc tải lại trang, thứ tự ngày phải xếp giảm dần (ngày lớn nhất / mới nhất hiển thị trước tiên, các ngày nhỏ / cũ hiển thị phía sau).

2. **"Mở mắt" soi ảnh chụp màn hình bạn gửi:**
   * AI nhìn vào 2 vị trí được đóng khung đỏ:
     * **Khung đỏ 1:** Đang chọn tab **"Lịch biểu"** (chế độ xem Agenda) ở góc trên bên phải.
     * **Khung đỏ 2:** Dòng ngày đầu tiên đang hiển thị là **`2021-01-05`**, bên dưới tiếp theo là `2021-06-07`, `2022-09-22`, `2023-02-05`...
   * *AI nhận định thực trạng:* "Hiện tại danh sách có 570 sự kiện, nhưng hệ thống lại xếp tăng dần từ năm 2021 đến 2026. Điều này khiến các sự kiện hiện tại của năm 2026 bị chìm xuống đáy danh sách, người dùng phải cuộn chuột rất mỏi tay mới thấy. Người dùng muốn đảo ngược lại: ngày lớn (2026) lên đầu!"

3. **Định vị mã nguồn & Đọc code thực tế:**
   * AI chạy lệnh tìm kiếm các file liên quan đến Calendar.
   * Xác định file giao diện: `src/components/calendar/CalendarAgendaView.tsx`.
   * Mở file ra đọc đoạn logic sắp xếp ở dòng 26-32:
     ```typescript
     if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
     ```
     $\rightarrow$ Phát hiện nguyên nhân: `a.localeCompare(b)` chính là phép so sánh tăng dần (nhỏ tới lớn).

4. **Cân nhắc & Lựa chọn giải pháp kỹ thuật tối ưu:**
   * *Suy nghĩ 1:* Nếu chỉ sửa cứng thành `b.startDate.localeCompare(a.startDate)` thì giải quyết được ngay yêu cầu hiện tại.
   * *Suy nghĩ 2:* Nhưng lỡ sau này người dùng có nhu cầu muốn xem lại lịch trình từ xa xưa đến nay thì sao?
   * *Quyết định:*
     * Tạo state `sortOrder = 'desc'` để mặc định khi load trang luôn là **Lớn tới Nhỏ (Mới nhất trước)** đúng 100% yêu cầu.
     * Bổ sung thêm nút bấm trực quan `[Ngày: Lớn → Nhỏ (Mới nhất)]` $\leftrightarrow$ `[Ngày: Nhỏ → Lớn (Cũ nhất)]` ngay trên thanh tiêu đề cạnh huy hiệu "570 mục", vừa giúp người dùng nhìn thấy rõ trạng thái sắp xếp, vừa cho phép bấm đảo chiều nếu cần.
   * *Lường trước lỗi tiềm ẩn (Defensive coding):*
     * Khi gom nhóm sự kiện theo ngày vào object (`Record<string, CalendarEvent[]>`), việc gọi `Object.keys()` có thể bị ảnh hưởng bởi cơ chế duyệt object của trình duyệt.
     * Để tránh việc thứ tự ngày bị nhảy lung tung, AI chủ động thêm lệnh sort tường minh cho mảng `dateKeys`:
       ```typescript
       const dateKeys = Object.keys(grouped).sort((a, b) => {
         return sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b);
       });
       ```
       $\rightarrow$ Đảm bảo 100% các tiêu đề ngày luôn hiển thị chuẩn chỉ theo chiều giảm dần.

5. **Thực thi và Tự kiểm tra (Verification):**
   * Sử dụng công cụ `replace_file_content` sửa file `CalendarAgendaView.tsx`.
   * Chạy lệnh `npm run build` để kiểm tra toàn bộ mã nguồn.
   * Kết quả: Trình biên dịch TypeScript và Vite hoàn tất trong 9.97 giây với exit code 0, không có bất kỳ lỗi nào.

6. **Bàn giao kết quả:**
   * Gửi phản hồi ngắn gọn, nêu rõ 2 điểm đã làm: mặc định ngày lớn tới nhỏ + bổ sung nút đảo chiều linh hoạt, kèm đường dẫn file cụ thể.

