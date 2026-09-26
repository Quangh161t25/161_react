export interface WikiTableColumn {
  id: string;
  title: string;
  align?: 'left' | 'center' | 'right';
  width?: number;
}

export interface WikiTableRow {
  id: string;
  cells: { [columnId: string]: string };
}

export interface WikiTable {
  id?: string;
  title?: string;
  columns: WikiTableColumn[];
  rows: WikiTableRow[];
}

export interface NoteAttachment {
  id: string;
  name: string;
  size: string;
  url: string;
  type?: string;
}

export type NoteStatus = 'published' | 'draft' | 'archived';

export type NoteCategory =
  | 'Biên bản cuộc họp'
  | 'Tài liệu kỹ thuật'
  | 'Kế hoạch công việc'
  | 'Hướng dẫn quy trình'
  | 'Ý tưởng & Sáng kiến'
  | 'Báo cáo thị trường'
  | 'Ghi chép cá nhân'
  | string;

export interface Note {
  id: string;
  code: string; // e.g., 'NOTE-001'
  title: string;
  summary?: string;
  content: string; // HTML or rich text
  coverUrl?: string;
  images?: string[];
  category: NoteCategory;
  tags: string[];
  location?: string;
  coordinates?: string;
  author: string;
  authorAvatar?: string;
  noteDate: string; // YYYY-MM-DD or DD/MM/YYYY
  noteTime?: string; // HH:mm
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  color?: string; // blue, emerald, amber, purple, rose, slate, etc.
  tableData?: WikiTable;
  attachments?: NoteAttachment[];
  status: NoteStatus;
}
