import { Note } from '../types/note';

export const NOTE_COLOR_THEMES = [
  { id: 'blue', name: 'Xanh dương', badge: 'bg-blue-500 text-white' },
  { id: 'emerald', name: 'Xanh ngọc', badge: 'bg-emerald-500 text-white' },
  { id: 'amber', name: 'Hổ phách', badge: 'bg-amber-500 text-white' },
  { id: 'purple', name: 'Tím', badge: 'bg-purple-500 text-white' },
  { id: 'rose', name: 'Hồng đỏ', badge: 'bg-rose-500 text-white' },
  { id: 'indigo', name: 'Xanh chàm', badge: 'bg-indigo-500 text-white' },
  { id: 'slate', name: 'Xám thanh lịch', badge: 'bg-slate-500 text-white' },
];

export const NOTE_CATEGORIES = [
  'Biên bản cuộc họp',
  'Tài liệu kỹ thuật',
  'Kế hoạch công việc',
  'Hướng dẫn quy trình',
  'Ý tưởng & Sáng kiến',
  'Báo cáo thị trường',
  'Ghi chép cá nhân',
];

export const NOTE_TAG_SUGGESTIONS = [
  'Chiến lược',
  'Q4-2026',
  'Kỹ thuật',
  'Quy trình',
  'Onboarding',
  'Khảo sát',
  'Mặt bằng',
  'Ý tưởng',
  'ERP',
  'Tài chính',
  'Văn hóa',
  'Ưu tiên cao',
];

export const PRESET_TAGS = NOTE_TAG_SUGGESTIONS;

export const MOCK_NOTES: Note[] = [
  {
    id: 'note-001',
    code: 'NOTE-001',
    title: 'Biên bản Cuộc họp Chiến lược Q4/2026 & Mở rộng Thị trường',
    summary: 'Tổng hợp mục tiêu doanh thu, ngân sách mở rộng 3 chi nhánh mới và lộ trình chuyển đổi số ERP toàn diện.',
    content: `## 1. Mục tiêu trọng tâm quý 4
Ban Giám đốc đã thống nhất các định hướng phát triển chiến lược cho giai đoạn cuối năm 2026 với các chỉ số KPI trọng yếu:
- **Doanh thu:** Đạt mốc tăng trưởng 125% so với cùng kỳ năm 2025.
- **Mở rộng:** Hoàn tất khai trương 2 chi nhánh mới tại TP.Thủ Đức và TP.Đà Nẵng.
- **Chuyển đổi số:** Đưa hệ thống ERP nội bộ vào vận hành chính thức cho toàn bộ 5 phòng ban.

## 2. Phân bổ ngân sách dự kiến
- **Phát triển ERP:** 450.000.000 VNĐ (Phòng Kỹ thuật & IT phụ trách - Đang triển khai 80%).
- **Thuê mặt bằng:** 680.000.000 VNĐ (Phòng HC-NS phụ trách - Đã ký hợp đồng).
- **Chiến dịch Marketing:** 250.000.000 VNĐ (Phòng MKT phụ trách).
- **Tuyển dụng 30 nhân sự:** 120.000.000 VNĐ.

> [!NOTE]
> Tất cả các phòng ban cần hoàn thành báo cáo khả thi trước ngày 15/10/2026.`,
    coverUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
    ],
    category: 'Biên bản cuộc họp',
    tags: ['Chiến lược', 'Q4-2026', 'Ưu tiên cao'],
    location: 'Phòng Họp Ban Giám Đốc - Tòa nhà Landmark 81, TP.HCM',
    coordinates: '10.7951° N, 106.7218° E',
    author: 'Lê Minh Công',
    authorAvatar: 'https://ui-avatars.com/api/?name=Le+Minh+Cong&background=0f172a&color=fff',
    noteDate: '2026-09-26',
    noteTime: '09:30',
    createdAt: '2026-09-26',
    updatedAt: '2026-09-26',
    isPinned: true,
    color: 'blue',
    status: 'published',
    attachments: [
      {
        id: 'att-1',
        name: 'Ke_hoach_ngan_sach_Q4_2026.pdf',
        size: '2.4 MB',
        url: '#',
        type: 'pdf',
      },
      {
        id: 'att-2',
        name: 'So_do_to_chuc_chi_nhanh_moi.png',
        size: '1.8 MB',
        url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
        type: 'image',
      },
    ],
  },
  {
    id: 'note-002',
    code: 'NOTE-002',
    title: 'Kiến trúc Hạ tầng Hệ thống Cloud & Microservices 2026',
    summary: 'Tài liệu kiến trúc giải pháp công nghệ: Kubernetes Cluster, PostgreSQL Replica, Redis Caching và CI/CD Pipeline.',
    content: `## 1. Tổng quan Kiến trúc
Hệ thống ERP phiên bản 2026 được xây dựng trên kiến trúc Modern Web Application:
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS + Lucide Icons.
- **State & Local Cache:** Offline-first caching LocalStorage + Realtime Google Sheets Sync 2 chiều.
- **Backend API Server:** Node.js / Go Microservices chạy containerized trên Kubernetes.

## 2. Tiêu chuẩn Mã nguồn & UI Module
Mọi phân hệ trong hệ thống ERP phải tuân thủ nghiêm ngặt theo **Module Nhân sự Mẫu**:
- Bảng dữ liệu hỗ trợ kéo dãn kích thước cột trực tiếp (interactive resizer).
- Sticky Columns 100% solid background chống lem mờ khi cuộn ngang.
- Ngăn bên Drawer hỗ trợ 4 chế độ kích thước (Hẹp, Chuẩn, Rộng, Toàn màn hình).
- Phím tắt điều hướng nhanh và hỗ trợ Shift + Click chọn nhiều bản ghi.`,
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    ],
    category: 'Tài liệu kỹ thuật',
    tags: ['Kỹ thuật', 'ERP', 'Chiến lược'],
    location: 'Trung tâm Dữ liệu Data Center Q.9, TP.Thủ Đức',
    coordinates: '10.8415° N, 106.8098° E',
    author: 'Trần Hoàng Long',
    authorAvatar: 'https://ui-avatars.com/api/?name=Tran+Hoang+Long&background=1d4ed8&color=fff',
    noteDate: '2026-09-25',
    noteTime: '14:15',
    createdAt: '2026-09-25',
    updatedAt: '2026-09-25',
    isPinned: true,
    color: 'emerald',
    status: 'published',
  },
  {
    id: 'note-003',
    code: 'NOTE-003',
    title: 'Quy trình Onboarding & Đào tạo Nhân sự Mới 2026',
    summary: 'Quy chuẩn 7 ngày đầu tiên dành cho nhân viên mới: Nhận việc, bàn giao thiết bị, cài đặt hệ thống và bảo mật.',
    content: `## Quy trình Tiếp nhận 7 Ngày Vàng:
- **Ngày 1 (Chào đón):** Nhận máy tính, tạo tài khoản Email & ERP nội bộ, ký kết hợp đồng thử việc.
- **Ngày 2-3 (Văn hóa & Nội quy):** Đào tạo sổ tay văn hóa doanh nghiệp, quy chế bảo mật thông tin.
- **Ngày 4-5 (Nghiệp vụ chuyên môn):** Bàn giao tài liệu hướng dẫn và làm việc cùng Mentor hướng dẫn.
- **Ngày 7 (Đánh giá tuần đầu):** Trưởng bộ phận gặp mặt phản hồi và giải đáp các thắc mắc.

> [!TIP]
> Mentor cần chủ động gửi trước Checklist đào tạo 1 ngày trước khi nhân sự mới nhận việc.`,
    coverUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    ],
    category: 'Hướng dẫn quy trình',
    tags: ['Quy trình', 'Onboarding', 'Văn hóa'],
    location: 'Tầng 12, Tòa nhà Bitexco Financial Tower, Quận 1, TP.HCM',
    coordinates: '10.7719° N, 106.7044° E',
    author: 'Nguyễn Thị Bích Ngọc',
    authorAvatar: 'https://ui-avatars.com/api/?name=Nguyen+Thi+Bich+Ngoc&background=db2777&color=fff',
    noteDate: '2026-09-24',
    noteTime: '10:00',
    createdAt: '2026-09-24',
    updatedAt: '2026-09-24',
    isPinned: false,
    color: 'rose',
    status: 'published',
  },
  {
    id: 'note-004',
    code: 'NOTE-004',
    title: 'Báo cáo Khảo sát Mặt bằng Chi nhánh Đà Nẵng',
    summary: 'Đánh giá vị trí 3 tuyến đường trọng điểm: Nguyễn Văn Linh, Bạch Đằng và 2 Tháng 9.',
    content: `## 1. Kết quả Khảo sát thực địa
- **Vị trí A (120 Nguyễn Văn Linh):** Lưu lượng giao thông rất cao, diện tích 180m2 x 3 tầng, giá thuê 65tr/tháng.
- **Vị trí B (45 Bạch Đằng):** View sông Hàn, nhận diện thương hiệu cực tốt, giá thuê 85tr/tháng.
- **Vị trí C (88 Đường 2 Tháng 9):** Chỗ để xe rộng, thuận tiện kết nối sân bay, giá thuê 55tr/tháng.

## 2. Đề xuất của Đoàn khảo sát
Ưu tiên lựa chọn **Vị trí A (Nguyễn Văn Linh)** do lưu lượng khách hàng mục tiêu lớn và chi phí hợp lý.`,
    coverUrl: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
    ],
    category: 'Báo cáo thị trường',
    tags: ['Khảo sát', 'Mặt bằng', 'Chiến lược'],
    location: '120 Nguyễn Văn Linh, Q.Thanh Khê, TP.Đà Nẵng',
    coordinates: '16.0610° N, 108.2140° E',
    author: 'Phạm Đức Anh',
    authorAvatar: 'https://ui-avatars.com/api/?name=Pham+Duc+Anh&background=059669&color=fff',
    noteDate: '2026-09-23',
    noteTime: '16:45',
    createdAt: '2026-09-23',
    updatedAt: '2026-09-23',
    isPinned: false,
    color: 'amber',
    status: 'published',
  },
];
