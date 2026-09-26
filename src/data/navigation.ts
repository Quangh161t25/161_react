import {
  House,
  LayoutDashboard,
  Wallet,
  Layers,
  Copyright,
  Settings,
  BookOpen,
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
    id: 'overview',
    label: 'Tổng quan',
    href: '/tong-quan',
    icon: LayoutDashboard,
  },
  {
    id: 'notes',
    label: 'Ghi chú & Wiki',
    href: '/ghi-chu',
    icon: BookOpen,
  },
  {
    id: 'finance',
    label: 'Tài chính',
    href: '/tai-chinh',
    icon: Wallet,
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
    id: 'overview',
    title: 'Tổng quan',
    description: 'Thống kê nhân sự hôm nay và màn hình Live TV.',
    href: '/tong-quan',
    icon: LayoutDashboard,
    gradientClass: 'from-sky-600 to-indigo-700 dark:from-sky-500 dark:to-indigo-600',
  },
  {
    id: 'notes',
    title: 'Ghi chú & Wiki',
    description: 'Soạn thảo bài viết Web, vẽ bảng dữ liệu Wiki, ảnh & GPS.',
    href: '/ghi-chu',
    icon: BookOpen,
    gradientClass: 'from-purple-600 to-indigo-700 dark:from-purple-500 dark:to-indigo-600',
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
