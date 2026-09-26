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
    content: `
      <h2>1. Mục tiêu trọng tâm quý 4</h2>
      <p>Ban Giám đốc đã thống nhất các định hướng phát triển chiến lược cho giai đoạn cuối năm 2026 với các chỉ số KPI trọng yếu:</p>
      <ul>
        <li><strong>Doanh thu:</strong> Đạt mốc tăng trưởng 125% so với cùng kỳ năm 2025.</li>
        <li><strong>Mở rộng:</strong> Hoàn tất khai trương 2 chi nhánh mới tại TP.Thủ Đức và TP.Đà Nẵng.</li>
        <li><strong>Chuyển đổi số:</strong> Đưa hệ thống ERP nội bộ vào vận hành chính thức cho toàn bộ 5 phòng ban.</li>
      </ul>

      <h2>2. Phân bổ ngân sách dự kiến</h2>
      <p>Dưới đây là bảng số liệu phân bổ chi tiết cho từng hạng mục công việc đã được phê duyệt:</p>
    `,
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
    noteDate: '26/09/2026',
    noteTime: '09:30',
    createdAt: '09:30 - 26/09/2026',
    updatedAt: '11:15 - 26/09/2026',
    isPinned: true,
    color: 'blue',
    status: 'published',
    tableData: {
      title: 'Bảng Phân Bổ Ngân Sách Dự Án Q4',
      columns: [
        { id: 'col-1', title: 'Hạng mục đầu tư', align: 'left', width: 220 },
        { id: 'col-2', title: 'Phòng ban phụ trách', align: 'left', width: 160 },
        { id: 'col-3', title: 'Ngân sách (VNĐ)', align: 'right', width: 160 },
        { id: 'col-4', title: 'Tiến độ thực hiện', align: 'center', width: 140 },
      ],
      rows: [
        {
          id: 'row-1',
          cells: {
            'col-1': 'Phát triển & Triển khai Hệ thống ERP',
            'col-2': 'Phòng Kỹ thuật & IT',
            'col-3': '450.000.000',
            'col-4': 'Đang triển khai (80%)',
          },
        },
        {
          id: 'row-2',
          cells: {
            'col-1': 'Thuê mặt bằng & Setup Chi nhánh Thủ Đức',
            'col-2': 'Phòng Hành chính - Nhân sự',
            'col-3': '680.000.000',
            'col-4': 'Ký hợp đồng thuê',
          },
        },
        {
          id: 'row-3',
          cells: {
            'col-1': 'Chiến dịch Quảng bá & Marketing Mở rộng',
            'col-2': 'Phòng Kinh doanh & MKT',
            'col-3': '250.000.000',
            'col-4': 'Lên kế hoạch',
          },
        },
        {
          id: 'row-4',
          cells: {
            'col-1': 'Tuyển dụng & Đào tạo 30 Nhân sự mới',
            'col-2': 'Phòng Nhân sự',
            'col-3': '120.000.000',
            'col-4': 'Đang tiếp nhận CV',
          },
        },
      ],
    },
    attachments: [
      {
        id: 'att-1',
        name: 'Ke_hoach_chien_luoc_Q4_2026.pdf',
        size: '2.4 MB',
        url: '#',
        type: 'pdf',
      },
      {
        id: 'att-2',
        name: 'Bang_du_toan_ngan_sach.xlsx',
        size: '840 KB',
        url: '#',
        type: 'excel',
      },
    ],
  },
  {
    id: 'note-002',
    code: 'NOTE-002',
    title: 'Tài liệu Hướng dẫn Quy trình Onboarding Nhân viên Mới',
    summary: 'Cẩm nang chi tiết các bước tiếp nhận nhân viên mới, bàn giao trang thiết bị và cấp phát tài khoản phần mềm.',
    content: `
      <h2>1. Quy trình 3 ngày đầu tiên</h2>
      <p>Nhân viên mới cần được hướng dẫn tận tình để hòa nhập nhanh chóng vào văn hóa doanh nghiệp:</p>
      <ul>
        <li><strong>Ngày 1:</strong> Đón tiếp, giới thiệu phòng ban, ký hợp đồng thử việc và nhận thẻ nhân viên.</li>
        <li><strong>Ngày 2:</strong> Cài đặt máy tính làm việc, hướng dẫn sử dụng phần mềm ERP, email công ty.</li>
        <li><strong>Ngày 3:</strong> Gặp gỡ Mentor chuyên môn, nhận kế hoạch đào tạo 2 tháng đầu.</li>
      </ul>

      <h2>2. Danh mục bàn giao trang thiết bị tiêu chuẩn</h2>
      <p>Bộ phận IT & Hành chính phối hợp chuẩn bị đầy đủ danh sách thiết bị sau:</p>
    `,
    coverUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80',
    ],
    category: 'Hướng dẫn quy trình',
    tags: ['Quy trình', 'Onboarding', 'Kỹ thuật'],
    location: 'Văn phòng Trụ sở chính, Tầng 3, Hà Nội',
    coordinates: '21.0285° N, 105.8542° E',
    author: 'Nguyễn Thị Thu Hà',
    authorAvatar: 'https://ui-avatars.com/api/?name=Nguyen+Thu+Ha&background=10b981&color=fff',
    noteDate: '24/09/2026',
    noteTime: '14:00',
    createdAt: '14:00 - 24/09/2026',
    updatedAt: '16:45 - 25/09/2026',
    isPinned: true,
    color: 'emerald',
    status: 'published',
    tableData: {
      title: 'Danh Mục Bàn Giao Thiết Bị Nhân Sự',
      columns: [
        { id: 'col-1', title: 'Tên thiết bị / Dịch vụ', align: 'left', width: 220 },
        { id: 'col-2', title: 'Quy cách / Cấu hình', align: 'left', width: 180 },
        { id: 'col-3', title: 'Đơn vị phụ trách', align: 'left', width: 150 },
        { id: 'col-4', title: 'Trạng thái', align: 'center', width: 130 },
      ],
      rows: [
        {
          id: 'row-1',
          cells: {
            'col-1': 'Laptop Dell Latitude Core i7 / 16GB RAM',
            'col-2': 'Máy mới 100%, BH 24T',
            'col-3': 'Phòng IT',
            'col-4': 'Sẵn sàng',
          },
        },
        {
          id: 'row-2',
          cells: {
            'col-1': 'Màn hình Dell 24 inch IPS Full HD',
            'col-2': 'Kèm cáp HDMI, chân xoay',
            'col-3': 'Phòng IT',
            'col-4': 'Sẵn sàng',
          },
        },
        {
          id: 'row-3',
          cells: {
            'col-1': 'Tài khoản Email & ERP Doanh nghiệp',
            'col-2': 'Cấp quyền theo chức vụ',
            'col-3': 'Quản trị hệ thống',
            'col-4': 'Đã khởi tạo',
          },
        },
        {
          id: 'row-4',
          cells: {
            'col-1': 'Bộ văn phòng phẩm & Thẻ ra vào',
            'col-2': 'Sổ tay, bút, thẻ từ',
            'col-3': 'Phòng Hành chính',
            'col-4': 'Đã hoàn tất',
          },
        },
      ],
    },
  },
  {
    id: 'note-003',
    code: 'NOTE-003',
    title: 'Báo cáo Khảo sát Mặt bằng Chi nhánh Mới - TP.Thủ Đức',
    summary: 'Đánh giá 3 địa điểm tiềm năng tại khu vực Thảo Điền và An Phú, phân tích ưu nhược điểm và lưu lượng khách hàng.',
    content: `
      <h2>1. Tổng quan vị trí khảo sát</h2>
      <p>Đoàn khảo sát đã thực địa tại 3 địa điểm trên trục đường Song Hành và Mai Chí Thọ trong 2 ngày 20-21/09/2026.</p>
      <ul>
        <li><strong>Vị trí A:</strong> Mặt tiền Song Hành Xa Lộ Hà Nội, diện tích sàn 320m2, vỉa hè rộng 8m đỗ xe thoải mái.</li>
        <li><strong>Vị trí B:</strong> Khu phức hợp An Phú, diện tích 250m2, giá thuê cạnh tranh, lượng cư dân văn phòng cao.</li>
        <li><strong>Vị trí C:</strong> Đường Nguyễn Cơ Thạch, khu đô thị Sala, hình ảnh thương hiệu sang trọng.</li>
      </ul>
    `,
    coverUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    ],
    category: 'Báo cáo thị trường',
    tags: ['Khảo sát', 'Mặt bằng', 'Chiến lược'],
    location: 'Trục đường Song Hành, Phường An Phú, TP.Thủ Đức, TP.HCM',
    coordinates: '10.8012° N, 106.7465° E',
    author: 'Trần Văn Hoàng',
    authorAvatar: 'https://ui-avatars.com/api/?name=Tran+Van+Hoang&background=f59e0b&color=fff',
    noteDate: '22/09/2026',
    noteTime: '10:00',
    createdAt: '10:00 - 22/09/2026',
    updatedAt: '15:30 - 23/09/2026',
    isPinned: false,
    color: 'amber',
    status: 'published',
    tableData: {
      title: 'So Sánh 3 Phương Án Mặt Bằng',
      columns: [
        { id: 'col-1', title: 'Địa điểm', align: 'left', width: 160 },
        { id: 'col-2', title: 'Diện tích (m2)', align: 'center', width: 120 },
        { id: 'col-3', title: 'Giá thuê / tháng', align: 'right', width: 160 },
        { id: 'col-4', title: 'Chỗ đỗ xe', align: 'center', width: 130 },
        { id: 'col-5', title: 'Đánh giá chung', align: 'center', width: 140 },
      ],
      rows: [
        {
          id: 'row-1',
          cells: {
            'col-1': 'Phương án A (Song Hành)',
            'col-2': '320 m²',
            'col-3': '85.000.000 đ',
            'col-4': 'Ô tô + 40 xe máy',
            'col-5': '★★★★★ (Khuyên chọn)',
          },
        },
        {
          id: 'row-2',
          cells: {
            'col-1': 'Phương án B (An Phú)',
            'col-2': '250 m²',
            'col-3': '62.000.000 đ',
            'col-4': '20 xe máy',
            'col-5': '★★★★☆ (Tiềm năng)',
          },
        },
        {
          id: 'row-3',
          cells: {
            'col-1': 'Phương án C (Sala)',
            'col-2': '280 m²',
            'col-3': '135.000.000 đ',
            'col-4': 'Hầm gửi xe chung',
            'col-5': '★★★☆☆ (Chi phí cao)',
          },
        },
      ],
    },
  },
  {
    id: 'note-004',
    code: 'NOTE-004',
    title: 'Ý tưởng Cải tiến Kiến trúc Hệ thống ERP Đa Nền tảng',
    summary: 'Đề xuất kiến trúc Micro-frontend kết hợp lưu trữ Cache offline-first và đồng bộ Google Sheets 2 chiều thời gian thực.',
    content: `
      <h2>1. Định hướng kiến trúc công nghệ</h2>
      <p>Hệ thống ERP phiên bản mới hướng tới hiệu suất cao, phản hồi dưới 100ms trên cả máy tính và thiết bị di động:</p>
      <ul>
        <li><strong>Frontend:</strong> React 18, TypeScript, Tailwind CSS, Lucide Icons.</li>
        <li><strong>Lưu trữ:</strong> Offline-first Local Cache + Live 2-way Google Sheets Sync.</li>
        <li><strong>Giao diện:</strong> Ngăn kéo Drawer co dãn đa kích thước, Responsive 100% Mobile.</li>
      </ul>
    `,
    coverUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    ],
    category: 'Ý tưởng & Sáng kiến',
    tags: ['Ý tưởng', 'ERP', 'Kỹ thuật'],
    location: 'Lab Nghiên cứu & Phát triển (R&D Center), TP.HCM',
    coordinates: '10.7769° N, 106.7009° E',
    author: 'Phạm Minh Đức',
    authorAvatar: 'https://ui-avatars.com/api/?name=Pham+Minh+Duc&background=8b5cf6&color=fff',
    noteDate: '18/09/2026',
    noteTime: '16:20',
    createdAt: '16:20 - 18/09/2026',
    updatedAt: '08:30 - 20/09/2026',
    isPinned: false,
    color: 'purple',
    status: 'published',
  },
  {
    id: 'note-005',
    code: 'NOTE-005',
    title: 'Quy chuẩn Văn hóa Doanh nghiệp & 5 Giá trị Cốt lõi',
    summary: 'Tài liệu hướng dẫn văn hóa ứng xử, chuẩn mực giao tiếp nội bộ và tác phong chuyên nghiệp với đối tác.',
    content: `
      <h2>5 Giá trị Cốt lõi của Tổ chức</h2>
      <ol>
        <li><strong>Tận tâm (Dedication):</strong> Đặt khách hàng và đối tác làm trung tâm của mọi quyết định.</li>
        <li><strong>Chính trực (Integrity):</strong> Minh bạch, trung thực và nhất quán trong lời nói và hành động.</li>
        <li><strong>Đổi mới (Innovation):</strong> Không ngừng học hỏi, sáng tạo và cải tiến quy trình làm việc.</li>
        <li><strong>Đồng đội (Teamwork):</strong> Tôn trọng, lắng nghe và chia sẻ thành công cùng tập thể.</li>
        <li><strong>Hiệu quả (Efficiency):</strong> Tối ưu hóa nguồn lực và thời gian để đạt kết quả vượt trội.</li>
      </ol>
    `,
    coverUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    category: 'Tài liệu kỹ thuật',
    tags: ['Văn hóa', 'Quy trình'],
    location: 'Toàn hệ thống công ty',
    author: 'Lê Minh Công',
    authorAvatar: 'https://ui-avatars.com/api/?name=Le+Minh+Cong&background=0f172a&color=fff',
    noteDate: '10/09/2026',
    noteTime: '08:00',
    createdAt: '08:00 - 10/09/2026',
    updatedAt: '08:00 - 10/09/2026',
    isPinned: false,
    color: 'slate',
    status: 'published',
  },
];
