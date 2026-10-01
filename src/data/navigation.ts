import {
  House,
  Wallet,
  Layers,
  Copyright,
  Settings,
  BookOpen,
  CheckSquare,
  KeyRound,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { NavItem, DashboardModule, UserProfile } from '../types';

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Trang chủ',
    href: '/',
    icon: House,
  },
  {
    id: 'calendar',
    label: 'Lịch biểu',
    href: '/lich',
    icon: Calendar,
  },
  {
    id: 'notes',
    label: 'Ghi chú',
    href: '/ghi-chu',
    icon: BookOpen,
  },
  {
    id: 'work',
    label: 'Công việc',
    href: '/cong-viec',
    icon: CheckSquare,
  },
  {
    id: 'learning',
    label: 'Học hỏi',
    href: '/hoc-hoi',
    icon: GraduationCap,
  },
  {
    id: 'finance',
    label: 'Tài chính',
    href: '/tai-chinh',
    icon: Wallet,
  },
  {
    id: 'passwords',
    label: 'Mật khẩu',
    href: '/mat-khau',
    icon: KeyRound,
  },
  {
    id: 'system',
    label: 'Hệ thống',
    href: '/he-thong',
    icon: Layers,
  },
  {
    id: 'copyright',
    label: 'Thông tin bản quyền',
    href: '/thong-tin-ban-quyen',
    icon: Copyright,
  },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  {
    id: 'settings',
    label: 'Cài đặt',
    href: '/cai-dat',
    icon: Settings,
  },
];

export const DASHBOARD_MODULES: DashboardModule[] = [
  {
    id: 'calendar',
    title: 'Lịch & Sự kiện Toàn hệ thống',
    description: 'Tổng hợp hạn chót công việc, dự án, dòng tiền, sinh nhật và cuộc họp.',
    href: '/lich',
    icon: Calendar,
    gradientClass: 'from-rose-600 to-pink-700 dark:from-rose-500 dark:to-pink-600',
  },
  {
    id: 'notes',
    title: 'Ghi chú',
    description: 'Soạn thảo bài viết, nhật ký hoạt động & tài liệu.',
    href: '/ghi-chu',
    icon: BookOpen,
    gradientClass: 'from-purple-600 to-indigo-700 dark:from-purple-500 dark:to-indigo-600',
  },
  {
    id: 'work',
    title: 'Công việc & Dự án',
    description: 'Quản lý nhiệm vụ, tiến độ dự án, quy trình và KPI.',
    href: '/cong-viec',
    icon: CheckSquare,
    gradientClass: 'from-blue-600 to-cyan-700 dark:from-blue-500 dark:to-cyan-600',
  },
  {
    id: 'learning',
    title: 'Học hỏi & Kiến thức',
    description: 'Sổ tay kiến thức, bài học kinh nghiệm, liên kết tài liệu & kỹ năng.',
    href: '/hoc-hoi',
    icon: GraduationCap,
    gradientClass: 'from-violet-600 to-fuchsia-700 dark:from-violet-500 dark:to-fuchsia-600',
  },
  {
    id: 'finance',
    title: 'Tài chính',
    description: 'Thu chi, công nợ và báo cáo tài chính.',
    href: '/tai-chinh',
    icon: Wallet,
    gradientClass: 'from-emerald-600 to-teal-700 dark:from-emerald-500 dark:to-teal-600',
  },
  {
    id: 'passwords',
    title: 'Quản lý Mật khẩu & Vault',
    description: 'Két bảo mật tài khoản cá nhân/công ty & Extension trình duyệt.',
    href: '/mat-khau',
    icon: KeyRound,
    gradientClass: 'from-amber-600 to-orange-700 dark:from-amber-500 dark:to-orange-600',
  },
  {
    id: 'system',
    title: 'Hệ thống',
    description: 'Cấu hình, phân quyền và nhân sự.',
    href: '/he-thong',
    icon: Layers,
    gradientClass: 'from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700',
  },
  {
    id: 'copyright',
    title: 'Thông tin bản quyền',
    description: 'Quản lý sở hữu trí tuệ và thông tin nhà phát triển.',
    href: '/thong-tin-ban-quyen',
    icon: Copyright,
    gradientClass: 'from-blue-600 to-blue-800',
  },
];

export const CURRENT_USER: UserProfile = {
  name: 'Lê Minh Công',
  title: 'Tổng Giám Đốc',
  avatarUrl: 'https://ui-avatars.com/api/?name=Le+Minh+Cong&background=0f172a&color=fff',
  isOnline: true,
};
