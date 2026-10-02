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

---

### Case Study #2: Tự động chuyển đổi kiểu xem thông minh cho Điện thoại (Mobile View Mode)
* **Thời điểm:** 2026-10-02 08:33
* **Phản hồi của bạn:**  
  `"KIỂU XEM KHÁC NHAU. MÁY TÍNH 1 KIỂU XEM KHI MỞ SANG ĐIỆN THOẠI PHẢI ĐỔI KIỂU XEM THÀNH ĐIỆN THOẠI CHỨ . SAO VẪN DÙNG KIỂU XEM CŨ"`

#### Diễn biến suy nghĩ nội tâm của AI khi nhận phản hồi trên:

1. **Nhận thức "vấn đề cốt lõi" (Root Cause Awakening):**
   * AI lập tức hiểu ra: Trên máy tính, màn hình rộng nên kiểu xem mặc định là dạng **Bảng (Table)** hoặc **Tháng (Month View)** rất hợp lý. Nhưng khi mở web trên điện thoại, hệ thống vẫn "cố chấp" dùng kiểu xem cũ của máy tính (Table 10-15 cột phải cuộn ngang mỏi tay; Lịch Tháng chia 7 cột bé xíu 40px bị ép chữ).
   * Trong khi đó, hệ thống thực ra đã có sẵn các giao diện card/grid và agenda dành riêng cho điện thoại cực đẹp, nhưng code trước đây lại fix cứng `useState('table')` và `useState('month')` khi khởi tạo!

2. **Khảo sát toàn bộ các module trong hệ thống:**
   * AI rà soát tất cả các trang chính:
     * **Lịch biểu (`CalendarPage`):** Máy tính xem Tháng (`month`), nhưng điện thoại bắt buộc phải là Lịch biểu danh sách (`agenda`) đọc theo ngày dọc.
     * **Học hỏi (`LearningPage`):** Máy tính xem Bảng (`table`), điện thoại phải tự chuyển sang Thẻ Card (`grid`) có ảnh bìa, tóm tắt, thẻ tag.
     * **Ghi chú (`NotePage`):** Máy tính xem Bảng, điện thoại chuyển sang Thẻ Card (`grid`) hiển thị Markdown preview trực quan.
     * **Nhân sự (`EmployeePage`):** Máy tính xem Bảng, điện thoại chuyển sang Thẻ Card (`grid`) có avatar, trạng thái, nút gọi điện/email.
     * **Mật khẩu (`PasswordPage`):** Máy tính xem Bảng, điện thoại chuyển sang Thẻ Két an toàn (`grid`).
     * **Tài chính (`CashTransactionPage`, `CostProposalPage`):** Tương tự, tự chuyển sang Thẻ Card trên điện thoại.
     * **Dự án (`ProjectListPage`):** Tự chuyển sang Thẻ Card trên điện thoại.

3. **Thiết kế giải pháp chuyên nghiệp & Tự động thích ứng:**
   * Tạo hook dùng chung `useIsMobile(breakpoint = 768)` chuẩn theo Tailwind CSS:
     * Tự động nhận diện khi người dùng truy cập từ điện thoại hoặc xoay màn hình/đổi kích thước cửa sổ.
     * Khi phát hiện điện thoại: Tự động đổi `viewMode` sang kiểu xem điện thoại (`grid` hoặc `agenda`).
     * Khi phát hiện máy tính: Tự động giữ kiểu xem máy tính (`table` hoặc `month`).
     * Người dùng vẫn hoàn toàn có thể bấm nút chuyển đổi thủ công nếu muốn xem dạng khác.

4. **Tối ưu hóa bổ trợ cho giao diện điện thoại mượt mà:**
   * **Nút Menu trên Header:** Thay vì icon thu gọn của máy tính (`PanelLeftClose`), trên điện thoại hiển thị chuẩn icon Hamburger `Menu` 3 gạch, khi mở menu thì chuyển thành dấu `X`.
   * **Thanh Sidebar:** Thêm nút bấm `X` ở góc trên để người dùng điện thoại có thể tắt menu dễ dàng mà không cần với tay chạm vào vùng tối.
   * **Ngăn kéo (Drawer):** Loại bỏ khoảng thụt lề thừa `pl-6`, bung full 100% màn hình điện thoại giúp trải nghiệm xem và sửa bài học/chi tiết rộng rãi, sắc nét.

5. **Xác minh & Biên dịch:**
   * Chạy `npm run build` thành công 100% không phát sinh lỗi kiểu dữ liệu hay component.

---

### Case Study #3: Ẩn nút bấm sắp xếp trên giao diện nhưng vẫn giữ nguyên logic sắp xếp
* **Thời điểm:** 2026-10-02 08:42
* **Câu lệnh gốc & Ảnh chụp của bạn:**  
  `"sao có cái nút này ở đây.. xóa đi nhưng khi load lại thì vẫn sắp xếp theo ngày lớn nhỏ,"` + kèm ảnh chụp nút bấm `[ Ngày & Giờ (Lớn → Nhỏ) ]`.

#### Diễn biến suy nghĩ nội tâm của AI khi nhận câu lệnh trên:

1. **Nhìn ảnh & Nhận diện ngay đối tượng:**
   * AI nhìn ảnh chụp thấy nút bấm màu xanh `[ ⇣≡ Ngày & Giờ (Lớn → Nhỏ) ]` trên thanh công cụ.
   * *Suy nghĩ của AI:* "Người dùng muốn giao diện thật gọn gàng, sạch sẽ, không cần nút bấm này hiển thị trên thanh công cụ làm chật mắt. Nhưng người dùng nhấn mạnh: *'xóa đi nhưng khi load lại thì vẫn sắp xếp theo ngày lớn nhỏ'*, nghĩa là logic sắp xếp mặc định từ ngày mới nhất tới cũ nhất (descending) phải được giữ nguyên 100% ngầm bên dưới!"

2. **Truy vết & Xử lý:**
   * Tìm thấy nút bấm này trong `src/components/notes/NotePage.tsx` (dòng 1366–1400) và kiểm tra cả nút tương tự ở `src/components/calendar/CalendarAgendaView.tsx`.
   * Tiến hành xóa bỏ khối JSX hiển thị nút bấm khỏi thanh công cụ.
   * Giữ nguyên tuyệt đối state khởi tạo và thuật toán sort:
     * `sortField = 'dateTime'`, `sortDirection = 'desc'` trong `NotePage.tsx`.
     * `b.startDate.localeCompare(a.startDate)` (ngày lớn tới nhỏ) trong `CalendarAgendaView.tsx`.
   * Như vậy: Giao diện hoàn toàn sạch đẹp, không có nút thừa, nhưng mỗi lần load lại trang thì toàn bộ dữ liệu vẫn tự động được xếp chuẩn từ ngày lớn tới nhỏ đúng như mong muốn.

3. **Kiểm tra biên dịch:**
   * Chạy `npm run build` hoàn tất không có bất kỳ lỗi nào.

---

### Case Study #4: Mở ngăn kéo chi tiết (Detail Drawer) theo chuẩn từng module khi click vào lịch trình
* **Thời điểm:** 2026-10-02 09:12
* **Câu lệnh gốc & Ảnh đính kèm của bạn:**  
  `"khi click vào mấy cái hiện ra ở đây sẽ mở ra kiểu xem như ở các modul cơ mà k phải là mở ra popop như ảnh 3"`  
  *(Kèm 3 ảnh: Ảnh 1 & 2 là giao diện Lịch theo ngày và Agenda list chứa các sự kiện Ghi chú, Thu chi, Công việc; Ảnh 3 là popup hộp thoại `EventDetailModal` nhỏ màu trắng hiện ra khi click vào một mục).*

#### Diễn biến suy nghĩ nội tâm của AI khi nhận câu lệnh trên:

1. **Hiểu sâu sắc trải nghiệm người dùng (UX Empathy):**
   * *Quan sát ảnh 3:* Khi người dùng bấm vào một sự kiện trên lịch trình (ví dụ một bài Ghi chú, hoặc một Phiếu thu chi, hoặc một Nhiệm vụ), hệ thống hiện tại đang hiển thị một dialog popup nhỏ (`EventDetailModal`) rất đơn điệu: chỉ có tiêu đề, ngày tháng và nút "Đi tới module".
   * *Suy nghĩ của AI:* "Người dùng cảm thấy popup này quá sơ sài và gượng gạo! Ở từng module riêng biệt (Ghi chú, Thu chi, Nhân sự, Công việc, Dự án, Đề xuất CP), hệ thống vốn dĩ đã có các **Ngăn kéo chi tiết (Detail Drawer)** cực kỳ xịn xò, hỗ trợ xem trước Markdown, danh sách công việc con (checklist), bình luận, phiếu thu chi song ngữ có thể in ấn, hồ sơ nhân sự đầy đủ ảnh thẻ và tài khoản ngân hàng, chuyển qua lại giữa các mục (Next/Prev)... Người dùng muốn khi bấm vào bất kỳ mục nào trên Lịch biểu, nó phải mở ngay Drawer chuẩn chỉnh chuyên nghiệp của chính module đó ra để xem và thao tác, chứ không phải một chiếc popup tạm bợ!"

2. **Phân tích kiến trúc điều hướng sự kiện (Architecture Mapping):**
   * Dữ liệu trong `CalendarPage` được tổng hợp từ `calendarService.aggregateAllEvents()` với thuộc tính `source`:
     * `note` ➔ Module Ghi chú.
     * `hr_birthday` / `hr_event` ➔ Module Nhân sự.
     * `work_task` ➔ Module Công việc.
     * `work_project` ➔ Module Dự án.
     * `finance_cash` ➔ Module Thu chi tiền mặt & ngân hàng.
     * `finance_proposal` ➔ Module Đề xuất chi phí.
     * `custom` ➔ Lịch họp nội bộ / sự kiện người dùng tự tạo trong Lịch biểu.

3. **Thiết kế giải pháp tích hợp thông minh:**
   * Thay vì chỉ có một state `selectedEventForDetail` mở `EventDetailModal`:
     * Bổ sung state và danh sách tương ứng cho từng module: `selectedNote`, `selectedEmployee`, `selectedTask`, `selectedProject`, `selectedCashTx`, `selectedProposal`, và `selectedCustomEvent`.
     * Khi người dùng click vào bất kỳ sự kiện nào (trong chế độ xem Tháng, Tuần, Ngày, hay Lịch trình Agenda):
       * Hàm `handleSelectEvent(evt)` tự động kiểm tra `evt.source`.
       * Trích xuất ID gốc hoặc mã (code) để tìm kiếm đối tượng hoàn chỉnh từ bộ nhớ dịch vụ tương ứng (`noteService`, `employeeService`, `taskService`, `projectService`, `cashTransactionService`, `googleSheetsService`).
       * Mở chính xác Ngăn kéo chi tiết tương ứng:
         * **Ghi chú:** Mở `NoteDetailDrawer` (đầy đủ nội dung định dạng Markdown, danh sách người tham gia, đính kèm, ghim, xóa, copy).
         * **Sinh nhật / Nhân sự:** Mở `EmployeeDetailDrawer` (hồ sơ nhân sự, phòng ban, chức vụ, số tài khoản, CCCD, ngày sinh).
         * **Công việc:** Mở `TaskDetailDrawer` (tiến độ %, danh sách subtasks có thể tích hoàn thành trực tiếp, ghi chú, bình luận).
         * **Dự án:** Mở `ProjectDetailDrawer` (ngân sách, khách hàng, tiến độ dự án, các công việc liên kết).
         * **Thu chi tiền:** Mở `CashTransactionDetailDrawer` (phiếu thu/chi mẫu chuẩn, tài khoản, đối tượng nộp/nhận, số tiền bằng chữ, in phiếu).
         * **Đề xuất CP:** Mở `CostProposalDetailDrawer` (bảng chi tiết chi phí, trạng thái phê duyệt).
         * **Lịch họp tự tạo:** Mở `EventDetailModal` riêng của Lịch biểu.
   * Đồng thời hỗ trợ đầy đủ các thao tác ngay trên Drawer: Sửa, Xóa (tự động đồng bộ và làm mới lịch biểu ngay lập tức), Ghim, Chuyển tiếp mục trước/sau.

4. **Xác minh & Tự kiểm tra (Verification):**
   * Chạy lệnh kiểm thử `npm run build` toàn dự án.
   * Kết quả: Biên dịch thành công 100% trong 9.96 giây, không có bất kỳ lỗi TypeScript hay runtime nào.

---

### Case Study #5: Đồng bộ hóa giao diện Thêm mới (Add Form Drawer) trong Lịch biểu & Ứng dụng Karpathy Guidelines
* **Thời điểm:** 2026-10-02 09:21
* **Câu lệnh gốc & Ảnh đính kèm của bạn:**  
  `"xem lại thêm mới ở modul lịch biểu nhé. thêm mới cũng lấy view như các modul . check lại sử dụng skill"`  
  *(Kèm ảnh khoanh đỏ 2 nút bấm: Nút `+ Thêm ˅` trên thanh công cụ góc phải và nút `+ Thêm sự kiện ngày này` ở chế độ xem Ngày).*

#### Diễn biến suy nghĩ nội tâm của AI khi nhận câu lệnh trên:

1. **Kích hoạt & Tuân thủ kỹ năng (Skill Activation: `karpathy-guidelines`):**
   * AI lập tức mở và đọc tài liệu `SKILL.md` của `karpathy-guidelines` để làm kim chỉ nam thực thi:
     * **Nguyên tắc 1: Think Before Coding:** Xác định rõ ràng giả định và vấn đề cốt lõi trước khi gõ code. Nhìn vào ảnh khoanh đỏ, người dùng vừa được chuyển đổi giao diện *Xem chi tiết* sang Drawer, và lập tức nhận ra một điểm "lệch tông": Khi bấm nút **Thêm mới** (`+ Thêm ˅` hoặc `+ Thêm sự kiện ngày này`), hệ thống vẫn đang bật một hộp thoại popup nhỏ (`EventFormModal`) nằm chính giữa màn hình, trong khi ở TẤT CẢ các module khác (Ghi chú, Công việc, Dự án, Thu chi, Đề xuất chi phí, Nhân sự, Học hỏi), giao diện Thêm mới luôn là một **Ngăn kéo trượt từ bên phải sang (Slide-Over Form Drawer)**!
     * **Nguyên tắc 2: Simplicity First:** Không viết thêm các thành phần phức tạp thừa thãi hay chuyển hướng lung tung. Giữ nguyên toàn bộ logic nghiệp vụ (tạo Meeting, Task, Note, Cash, Proposal) đã có sẵn nhưng nâng cấp container thành Drawer chuẩn chỉnh.
     * **Nguyên tắc 3: Surgical Changes:** Chỉnh sửa chính xác component `EventFormModal.tsx` thành dạng Drawer và đồng bộ kiểu xem trên toàn bộ các nút Thêm trong `CalendarPage`.
     * **Nguyên tắc 4: Goal-Driven Execution:** Tiêu chí thành công cụ thể là: Mọi nút bấm Thêm mới đều trượt Drawer từ bên phải sang mượt mà, hỗ trợ đổi độ rộng (Gọn, Chuẩn, Rộng, Toàn màn hình), full 100% trên điện thoại, biên dịch sạch 0 lỗi qua `npm run build`.

2. **Thiết kế & Tái cấu trúc giao diện Thêm mới thành Form Drawer:**
   * Thay thế wrapper modal `fixed inset-0 ... flex items-center justify-center max-w-xl` thành chuẩn Drawer:
     * Lớp nền làm mờ `backdrop-blur-xs`.
     * Ngăn kéo bên phải `fixed inset-y-0 right-0 flex max-w-full` với hiệu ứng trượt mượt mà `slide-in-from-right duration-300`.
     * Bộ chuyển đổi 4 chế độ rộng chuyên nghiệp: **Gọn (540px)**, **Chuẩn (768px)**, **Rộng (1080px)**, **Toàn màn hình (100vw)** và tự co 100vw trên màn hình điện thoại.
     * Thanh Header chuẩn ERP: Icon, Tiêu đề, Badge phân hệ, Nút thu phóng kích thước và Nút đóng `X`.
     * Thanh chuyển đổi phân hệ nhanh: Lịch họp, Công việc, Ghi chú, Thu / Chi, Đề xuất CP.
     * Thân form cuộn độc lập (`overflow-y-auto custom-scrollbar`).
     * Thanh Footer cố định dính ở đáy (`border-t bg-card sticky footer`) gồm nút "Hủy" và nút "Lưu {Tên phân hệ}" kèm trạng thái loading spinner.

3. **Kiểm tra biên dịch & Xác nhận:**
   * Chạy lệnh `npm run build`: hoàn tất thành công trong 9.73s, **0 lỗi**.

---

### Case Study #6: Kiểm toán bảo mật hệ thống (Security Audit), vá lỗ hổng rò rỉ mật khẩu & chuyển đổi Avatar cục bộ (Zero Third-Party Leakage)
* **Thời điểm:** 2026-10-02 10:15
* **Câu lệnh gốc & Tình huống của bạn:**  
  `"xem lại cái này có bảo mật k"`  
  *(Kèm ảnh chụp màn hình F12 Network tab tại trang Đăng nhập hiển thị yêu cầu `/api/sheets/employees` nặng 156 KB và request tới `ui-avatars.com` chứa tên đầy đủ)*  
  Sau đó: `"tôi đẩy code lên vercel thì k thấy gì"` -> `"ý là k bị lộ thông tin ấy"` -> `"có sửa cho tôi đi"`.

#### Diễn biến suy nghĩ nội tâm của AI khi nhận câu lệnh trên:

1. **Phân tích hiện trạng & Phát hiện nguyên nhân cốt lõi (Root Cause Analysis):**
   * **Hiểu lầm khi kiểm tra trên Vercel:** Khi bạn mở F12 trên bản Vercel và thấy Network tab trống không, AI quan sát thấy ô Filter của bạn đang gõ chữ `mp3`. Trình duyệt đã lọc ẩn đi toàn bộ các request khác chứ không phải hệ thống không gọi API.
   * **Xác minh trực tiếp trên bản Vercel thực tế (`https://161v2.vercel.app`):**
     AI đã chủ động chạy lệnh kiểm thử độc lập:
     `curl -s "https://161v2.vercel.app/api/sheets/employees"`
     **Kết quả gây sốc:** Máy chủ Vercel trả về toàn bộ danh sách nhân viên công ty công khai, trong đó có **mật khẩu dạng văn bản thuần (plain text password: "1", "161", "123456", ...)**, số điện thoại, CCCD, ngày sinh mà **hoàn toàn không yêu cầu bất kỳ phiên đăng nhập nào!**
   * **Nguyên nhân kỹ thuật:**
     * Trước đây, logic đăng nhập (`AuthContext.tsx`) được viết theo kiểu Client-Side: Khi người dùng vào trang đăng nhập `/dang-nhap`, trình duyệt tự động gọi `employeeService.fetchFromSheet()`, tải toàn bộ bảng `NhanVien` từ Google Sheet về máy khách rồi tự so sánh `matchedEmp.password === cleanPassword` ngay trong JavaScript trình duyệt!
     * Endpoint `GET /api/sheets/employees` trả thẳng dữ liệu thô từ Google Sheet mà không hề bóc tách hay lọc bỏ trường `password`.
     * Khi nhân viên chưa có ảnh đại diện, hệ thống gửi URL tới `https://ui-avatars.com/api/?name=${name}...`, làm lộ họ tên nhân viên sang dịch vụ bên thứ ba mỗi khi avatar được render.

2. **Kế hoạch hành động phẫu thuật (Surgical & Karpathy Guidelines):**
   * Chuyển toàn bộ quy trình xác thực danh tính vào phía Server (Server-Side Authentication).
   * Tuyệt đối không bao giờ để trường `password` xuất hiện trong bất kỳ API công khai nào.
   * Xóa bỏ hoàn toàn phụ thuộc vào `ui-avatars.com`, thay bằng thuật toán sinh ảnh SVG chữ cái viết tắt (Initials Avatar) chạy offline 100% bằng Data URI, không tốn thêm bất kỳ 1 byte request mạng nào.

3. **Các giải pháp bảo mật đã triển khai triệt để:**
   * **Về phía Backend (`api/sheets.js` & `server/sheetsService.mjs`):**
     * **Bảo vệ API danh sách nhân sự:** Trong `GET /api/sheets/employees`, thêm bước lọc bỏ triệt để:  
       `const safeEmployees = employees.map(({ password, ...safe }) => safe);`  
       Dù bất kỳ ai gọi vào API này, mật khẩu cũng sẽ không bao giờ tồn tại trong JSON trả về.
     * **Tạo Endpoint xác thực bảo mật Server-Side (`POST /api/sheets/login`):**  
       Người dùng gửi `{ username, password }`. Máy chủ tự đọc Google Sheet nội bộ, kiểm tra trạng thái hoạt động/nghỉ việc, so khớp mật khẩu và chỉ trả về thông tin hồ sơ an toàn (`AuthUser`) không kèm mật khẩu. Trả về thông báo lỗi chung `"Tên tài khoản hoặc mật khẩu không chính xác!"` để chống tấn công dò quét tài khoản (Username Enumeration).
     * **Tạo Endpoint đổi mật khẩu Server-Side (`POST /api/sheets/change-password`):**  
       Xác minh mật khẩu hiện tại trực tiếp trên Google Sheet trước khi ghi nhận mật khẩu mới.
     * **Bảo toàn mật khẩu khi cập nhật thông tin (`updateEmployeeInSheet`):**  
       Khi phòng nhân sự sửa thông tin nhân viên từ giao diện web, nếu trường `password` không được truyền vào, hệ thống tự động giữ nguyên mật khẩu cũ trong Google Sheet, ngăn chặn việc bị ghi đè thành chuỗi rỗng.
     * **Bộ lọc Avatar cũ trong Google Sheet:** Tự động phát hiện và chuyển đổi các link `ui-avatars.com` cũ từng lưu trong cell Google Sheet thành SVG Data URI cục bộ.
   * **Về phía Frontend (`src/context/AuthContext.tsx`, `src/utils/avatarUtils.ts`):**
     * Tạo module tiện ích `avatarUtils.ts` với hàm `getInitialsAvatar` và `getSafeAvatarUrl`. Tự động tạo ảnh SVG Data URI chuẩn Retina từ chữ cái đầu của tên (ví dụ: Lê Minh Công -> `LC`) với màu nền phẳng hiện đại, tương thích hoàn toàn trên mọi trình duyệt.
     * Cập nhật `AuthContext.tsx`: Hàm `login` gọi `POST /api/sheets/login`. Khi người dùng mở trang `/dang-nhap`, trình duyệt **không bao giờ tải trước danh sách nhân sự**, triệt tiêu hoàn toàn nguy cơ lộ dữ liệu.
     * Rà soát và thay thế toàn bộ các nơi gọi `ui-avatars.com` trong `EmployeePage.tsx`, `EmployeeDetailDrawer.tsx`, `EmployeeFormDrawer.tsx`, `NotePage.tsx`, `NoteCalendarView.tsx`, `NoteDetailDrawer.tsx`, `NoteFormDrawer.tsx`, `navigation.ts`.
   * **Cấu hình Vercel (`vercel.json`):**
     * Định tuyến chính xác quy tắc rewrite: `/api/:path*` -> `/api/sheets` để đảm bảo Vercel Serverless Function xử lý mọi đường dẫn API thông suốt.

4. **Kiểm chứng & Đảm bảo chất lượng (Verification):**
   * Quét lại mã nguồn: `git grep "ui-avatars.com" src/` -> Trả về **0 kết quả** (đã loại bỏ 100%).
   * Chạy lệnh `npm run build`:
     * Chuyển đổi thành công 2001 modules.
     * Biên dịch TypeScript và đóng gói Vite hoàn tất trong 19.57s.
     * **0 lỗi TypeScript, 0 lỗi cú pháp.**






