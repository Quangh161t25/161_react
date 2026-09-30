export type MasteryLevel = 'learning' | 'practicing' | 'mastered' | 'review_needed';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type LearningSourceType =
  | 'Khóa học'
  | 'Sách / Ebook'
  | 'Youtube / Video'
  | 'Bài viết / Blog'
  | 'Mentor / Chuyên gia'
  | 'Thực chiến / Dự án'
  | 'Tài liệu kỹ thuật / Docs'
  | 'Khác';

export interface LearningLink {
  id: string;
  title: string;
  url: string;
}

export interface LearningAttachment {
  id: string;
  name: string;
  size: string;
  url: string;
  type?: string;
}

export interface LearningEntry {
  id: string;
  code: string; // e.g., 'HH-001'
  title: string;
  content: string; // Markdown formatted rich text
  summary?: string; // Tóm tắt ngắn cốt lõi
  category: string; // e.g., 'Lập trình', 'Kinh doanh', 'Marketing', etc.
  tags: string[];
  sourceType: LearningSourceType;
  sourceName?: string; // Tên nguồn: Tên sách, Kênh youtube, Tác giả, Khóa học
  sourceUrl?: string; // Link gốc / URL tham khảo chính
  links: LearningLink[]; // Các link tài liệu bổ sung
  images: string[]; // Danh sách link ảnh (Catbox)
  coverUrl?: string; // Ảnh bìa minh họa
  masteryLevel: MasteryLevel; // Mức độ nắm vững
  difficulty: DifficultyLevel; // Độ khó
  rating: number; // 1-5 sao đánh giá độ hữu ích
  entryDate: string; // Ngày học (YYYY-MM-DD)
  nextReviewDate?: string; // Ngày ôn tập lại (Spaced Repetition)
  isPinned: boolean;
  color?: string; // Nhãn màu
  author?: string;
  createdAt: string;
  updatedAt: string;
}
