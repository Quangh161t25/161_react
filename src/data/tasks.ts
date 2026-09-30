import {
  CheckSquare,
  FolderKanban,
  BarChart2,
  CalendarCheck,
  ListTodo,
  Workflow,
} from 'lucide-react';
import { Task, Project, WorkflowTemplate, WorkSectionData } from '../types/task';

export const WORK_SECTIONS: WorkSectionData[] = [
  {
    id: 'tasks_management',
    title: 'Nhiệm vụ & Thực thi',
    items: [
      {
        id: 'task_list',
        title: 'Danh sách công việc',
        description: 'Xem, giao việc, phân công theo Kanban, Bảng và Lịch.',
        href: '/cong-viec/danh-sach',
        icon: CheckSquare,
        iconColor: '#2563eb', // Blue-600
        iconBgColor: 'rgba(37, 99, 235, 0.12)',
        badge: 'Chính',
        badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        isPinned: true,
      },
      {
        id: 'my_tasks',
        title: 'Công việc của tôi',
        description: 'Tập trung các đầu việc được giao trực tiếp cho bạn.',
        href: '/cong-viec/danh-sach?view=my_tasks',
        icon: ListTodo,
        iconColor: '#059669', // Emerald-600
        iconBgColor: 'rgba(5, 150, 105, 0.12)',
        isPinned: false,
      },
      {
        id: 'work_calendar',
        title: 'Lịch công tác & Deadline',
        description: 'Theo dõi hạn chót và lịch trình thực hiện theo tháng.',
        href: '/cong-viec/danh-sach?view=calendar',
        icon: CalendarCheck,
        iconColor: '#0891b2', // Cyan-600
        iconBgColor: 'rgba(8, 145, 178, 0.12)',
        isPinned: false,
      },
    ],
  },
  {
    id: 'projects_workflows',
    title: 'Dự án & Quy trình',
    items: [
      {
        id: 'project_list',
        title: 'Quản lý Dự án',
        description: 'Dự án lớn, ngân sách, nhân sự tham gia và tiến độ.',
        href: '/cong-viec/du-an',
        icon: FolderKanban,
        iconColor: '#7c3aed', // Violet-600
        iconBgColor: 'rgba(124, 58, 237, 0.12)',
        badge: 'Dự án',
        badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        isPinned: true,
      },
      {
        id: 'workflow_templates',
        title: 'Quy trình mẫu',
        description: 'Mẫu quy trình chuẩn nhiều bước và phân quyền SLA.',
        href: '/cong-viec/quy-trinh',
        icon: Workflow,
        iconColor: '#d97706', // Amber-600
        iconBgColor: 'rgba(217, 119, 6, 0.12)',
        isPinned: false,
      },
    ],
  },
  {
    id: 'analytics_kpi',
    title: 'Báo cáo & Đánh giá KPI',
    items: [
      {
        id: 'kpi_reports',
        title: 'Báo cáo hiệu suất & KPI',
        description: 'Tỷ lệ hoàn thành đúng hạn, khối lượng việc và năng suất.',
        href: '/cong-viec/kpi-bao-cao',
        icon: BarChart2,
        iconColor: '#e11d48', // Rose-600
        iconBgColor: 'rgba(225, 29, 72, 0.12)',
        isPinned: false,
      },
    ],
  },
];

// Dữ liệu dự án, công việc và quy trình được đồng bộ trực tiếp 100% từ Google Sheet
export const MOCK_PROJECTS: Project[] = [];
export const MOCK_TASKS: Task[] = [];
export const MOCK_WORKFLOWS: WorkflowTemplate[] = [];
