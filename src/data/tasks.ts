import {
  CheckSquare,
  CalendarCheck,
  ListTodo,
  ListChecks,
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
        badge: 'Cá nhân',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
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
      {
        id: 'subtasks',
        title: 'Công việc con',
        description: 'Quản lý, phân công và kiểm tra tiến độ các đầu việc con của công việc chính.',
        href: '/cong-viec/cong-viec-con',
        icon: ListChecks,
        iconColor: '#8b5cf6', // Violet/Purple-500
        iconBgColor: 'rgba(139, 92, 246, 0.12)',
        badge: 'Mới',
        badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        isPinned: false,
      },
    ],
  },
];

// Dữ liệu dự án, công việc và quy trình được đồng bộ trực tiếp 100% từ Google Sheet
export const MOCK_PROJECTS: Project[] = [];
export const MOCK_TASKS: Task[] = [];
export const MOCK_WORKFLOWS: WorkflowTemplate[] = [];
