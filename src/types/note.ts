export interface NoteAttachment {
  id: string;
  name: string;
  size: string;
  url: string;
  type?: string;
}

export interface NoteParticipant {
  id?: string;
  code?: string;
  name: string;
  avatarUrl?: string;
  role?: string;
  department?: string;
}

export type NoteStatus = 'published' | 'draft' | 'archived';

export type NoteCategory =
  | 'Biên bản cuộc họp'
  | 'Nhật ký & Hoạt động'
  | 'Ghi chép cá nhân'
  | 'Kế hoạch công việc'
  | 'Tài liệu kỹ thuật'
  | 'Hướng dẫn quy trình'
  | 'Ý tưởng & Sáng kiến'
  | 'Báo cáo thị trường'
  | string;

export interface Note {
  id: string;
  code: string; // e.g., 'NOTE-001'
  title: string;
  content: string; // Rich article content / markdown / text
  summary?: string;
  coverUrl?: string;
  images?: string[];
  category: NoteCategory;
  tags: string[];
  location?: string;
  coordinates?: string;
  authorId?: string;
  authorCode?: string;
  author: string;
  authorAvatar?: string;
  noteDate: string; // YYYY-MM-DD or DD/MM/YYYY
  noteTime?: string; // HH:mm
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  color?: string; // blue, emerald, amber, purple, rose, slate, etc.
  attachments?: NoteAttachment[];
  status: NoteStatus;
  participants?: NoteParticipant[];
  activity?: string;
}
