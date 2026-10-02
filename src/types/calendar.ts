export type CalendarEventSource =
  | 'work_task' // Công việc (Deadline / Ngày bắt đầu)
  | 'work_project' // Dự án (Ngày kết thúc / Milestone)
  | 'finance_proposal' // Đề xuất chi phí (Ngày thanh toán / dự kiến)
  | 'finance_cash' // Thu chi & Sổ quỹ
  | 'hr_birthday' // Sinh nhật nhân sự
  | 'hr_event' // Sự kiện nhân sự (Thử việc, Ký hợp đồng)
  | 'note' // Ghi chú & Lịch nhắc
  | 'learning' // Học hỏi & Kiến thức
  | 'custom'; // Lịch họp / Sự kiện riêng

export type CalendarEventPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  time?: string; // e.g. "09:00", "14:30" or undefined for all-day
  allDay?: boolean;
  source: CalendarEventSource;
  sourceId?: string; // CV-001, DA-002, NV-003, DX-004, TC-005, GC-001
  sourceLink?: string; // Path to module: /cong-viec/danh-sach, /tai-chinh/thu-chi, etc.
  categoryName: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  description?: string;
  assigneeId?: string;
  assigneeCode?: string;
  assigneeName?: string;
  department?: string;
  amount?: number; // Số tiền (nếu là tài chính)
  status?: string; // Trạng thái
  priority?: CalendarEventPriority;
  location?: string; // Địa điểm phòng họp hoặc link online
  isCompleted?: boolean;
}

export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarFilterState {
  searchQuery: string;
  selectedSources: CalendarEventSource[];
  department?: string;
}
