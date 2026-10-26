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

export interface NoteIconItem {
  emoji: string;
  name: string;
  group: 'mood' | 'weather' | 'activity';
}

export const NOTE_ICON_GROUPS = [
  {
    id: 'mood',
    label: 'Cảm xúc & Tâm trạng',
    icons: [
      { emoji: '😊', name: 'Vui vẻ', group: 'mood' },
      { emoji: '🎉', name: 'Hào hứng', group: 'mood' },
      { emoji: '😎', name: 'Tự tin', group: 'mood' },
      { emoji: '🥰', name: 'Hạnh phúc', group: 'mood' },
      { emoji: '🥳', name: 'Ăn mừng', group: 'mood' },
      { emoji: '😐', name: 'Bình thường', group: 'mood' },
      { emoji: '🤔', name: 'Suy ngẫm', group: 'mood' },
      { emoji: '😢', name: 'Buồn', group: 'mood' },
      { emoji: '😔', name: 'Thất vọng', group: 'mood' },
      { emoji: '😭', name: 'Đau lòng', group: 'mood' },
      { emoji: '😡', name: 'Tức giận', group: 'mood' },
      { emoji: '😤', name: 'Bực bội', group: 'mood' },
      { emoji: '🤯', name: 'Quá tải', group: 'mood' },
      { emoji: '😴', name: 'Mệt mỏi', group: 'mood' },
    ],
  },
  {
    id: 'weather',
    label: 'Thời tiết',
    icons: [
      { emoji: '☀️', name: 'Nắng đẹp', group: 'weather' },
      { emoji: '🌤️', name: 'Nắng nhẹ', group: 'weather' },
      { emoji: '⛅', name: 'Có mây', group: 'weather' },
      { emoji: '☁️', name: 'Râm mát', group: 'weather' },
      { emoji: '🌧️', name: 'Mưa rào', group: 'weather' },
      { emoji: '⛈️', name: 'Giông bão', group: 'weather' },
      { emoji: '🌦️', name: 'Mưa rào nhẹ', group: 'weather' },
      { emoji: '💨', name: 'Gió to', group: 'weather' },
      { emoji: '❄️', name: 'Se lạnh', group: 'weather' },
      { emoji: '🌫️', name: 'Sương mù', group: 'weather' },
    ],
  },
  {
    id: 'activity',
    label: 'Bối cảnh & Hoạt động',
    icons: [
      { emoji: '☕', name: 'Cà phê', group: 'activity' },
      { emoji: '💡', name: 'Sáng kiến', group: 'activity' },
      { emoji: '🎯', name: 'Mục tiêu', group: 'activity' },
      { emoji: '⚡', name: 'Cấp bách', group: 'activity' },
      { emoji: '🔥', name: 'Quan trọng', group: 'activity' },
      { emoji: '🏆', name: 'Thành tựu', group: 'activity' },
      { emoji: '🤝', name: 'Gặp gỡ', group: 'activity' },
      { emoji: '✈️', name: 'Công tác', group: 'activity' },
    ],
  },
];

export const ALL_NOTE_ICONS = NOTE_ICON_GROUPS.flatMap((g) => g.icons);

export const getNoteIconLabel = (emoji: string): string => {
  const found = ALL_NOTE_ICONS.find((i) => i.emoji === emoji);
  return found ? found.name : emoji;
};

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
