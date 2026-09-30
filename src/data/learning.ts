import { LearningEntry, LearningSourceType, MasteryLevel } from '../types/learning';

export const LEARNING_CATEGORIES = [
  'Lập trình & Kỹ thuật',
  'AI & Tự động hóa',
  'Kinh doanh & Khởi nghiệp',
  'Marketing & Bán hàng',
  'Quản trị & Lãnh đạo',
  'Tài chính & Đầu tư',
  'Kỹ năng mềm & Giao tiếp',
  'Ngoại ngữ',
  'Thiết kế & Sáng tạo',
  'Tư duy & Phong cách sống',
  'Khác',
];

export const LEARNING_SOURCE_TYPES: LearningSourceType[] = [
  'Khóa học',
  'Sách / Ebook',
  'Youtube / Video',
  'Bài viết / Blog',
  'Mentor / Chuyên gia',
  'Thực chiến / Dự án',
  'Tài liệu kỹ thuật / Docs',
  'Khác',
];

export const MASTERY_LEVEL_MAP: Record<
  MasteryLevel,
  { label: string; colorClass: string; bgClass: string; borderClass: string; icon: string }
> = {
  learning: {
    label: 'Đang học',
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    icon: 'BookOpen',
  },
  practicing: {
    label: 'Đang thực hành',
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    icon: 'Hammer',
  },
  mastered: {
    label: 'Đã nắm vững',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
    icon: 'CheckCircle2',
  },
  review_needed: {
    label: 'Cần ôn lại',
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/30',
    icon: 'RotateCcw',
  },
};

// No hardcoded mock data - only loads directly from Google Sheets
export const INITIAL_LEARNING_ENTRIES: LearningEntry[] = [];
