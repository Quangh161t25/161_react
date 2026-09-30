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
  'Nhật ký & Hoạt động',
  'Ghi chép cá nhân',
  'Kế hoạch công việc',
  'Tài liệu kỹ thuật',
  'Hướng dẫn quy trình',
  'Ý tưởng & Sáng kiến',
  'Báo cáo thị trường',
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
  'Đi chơi',
  'Cà phê',
  'Dã ngoại',
  'Ăn uống',
  'Ưu tiên cao',
  'Thể thao',
  'Bảo mật',
  'Tuyển dụng',
  'AI',
  'Cloud',
];

export const PRESET_TAGS = NOTE_TAG_SUGGESTIONS;

// Dữ liệu ghi chú được đồng bộ trực tiếp từ Google Sheet (tab GhiChu)
export const MOCK_NOTES: Note[] = [];
