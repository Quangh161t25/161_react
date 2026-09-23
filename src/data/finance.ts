import {
  FileText,
  ClipboardList,
  ArrowLeftRight,
  HandCoins,
  FolderTree,
  Landmark,
  Contact,
  GitBranch,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import { FinanceSectionData } from '../types/finance';

export const FINANCE_SECTIONS: FinanceSectionData[] = [
  {
    id: 'proposal_planning',
    title: 'Đề xuất & Kế hoạch',
    items: [
      {
        id: 'cost_proposal',
        title: 'Đề xuất chi phí',
        description: 'Lập phiếu đề xuất, trình duyệt và in phiếu.',
        href: '/tai-chinh/de-xuat-chi-phi',
        icon: FileText,
        iconColor: '#059669', // Emerald-600
        iconBgColor: 'rgba(5, 150, 105, 0.12)',
        isPinned: false,
      },
      {
        id: 'cost_plan',
        title: 'Kế hoạch chi phí',
        description: 'Ngân sách cả năm theo khoản mục và phòng ban.',
        href: '/tai-chinh/ke-hoach-chi-phi',
        icon: ClipboardList,
        iconColor: '#0d9488', // Teal-600
        iconBgColor: 'rgba(13, 148, 136, 0.12)',
        isPinned: false,
      },
      {
        id: 'receipt_payment',
        title: 'Thu chi',
        description: 'Phiếu thu, phiếu chi và luân chuyển tài khoản.',
        href: '/tai-chinh/thu-chi',
        icon: ArrowLeftRight,
        iconColor: '#0891b2', // Cyan-600
        iconBgColor: 'rgba(8, 145, 178, 0.12)',
        isPinned: false,
      },
      {
        id: 'advance_refund',
        title: 'Tạm ứng / hoàn ứng',
        description: 'Tạm ứng cho nhân viên và quyết toán chi tiêu.',
        href: '/tai-chinh/tam-ung-hoan-ung',
        icon: HandCoins,
        iconColor: '#475569', // Slate-600
        iconBgColor: 'rgba(71, 85, 105, 0.12)',
        isPinned: false,
      },
    ],
  },
  {
    id: 'categories',
    title: 'Danh mục',
    items: [
      {
        id: 'finance_categories',
        title: 'Danh mục tài chính',
        description: 'Khoản mục thu chi hai cấp.',
        href: '/tai-chinh/danh-muc-tai-chinh',
        icon: FolderTree,
        iconColor: '#4f46e5', // Indigo-600
        iconBgColor: 'rgba(79, 70, 229, 0.12)',
        isPinned: false,
      },
      {
        id: 'accounts',
        title: 'Tài khoản',
        description: 'Quỹ tiền mặt, tài khoản ngân hàng và tồn đầu.',
        href: '/tai-chinh/tai-khoan',
        icon: Landmark,
        iconColor: '#7c3aed', // Violet-600
        iconBgColor: 'rgba(124, 58, 237, 0.12)',
        isPinned: false,
      },
      {
        id: 'recipients',
        title: 'Đối tượng thu chi',
        description: 'Nhà cung cấp, khách hàng và nhân viên.',
        href: '/tai-chinh/doi-tuong-thu-chi',
        icon: Contact,
        iconColor: '#2563eb', // Blue-600
        iconBgColor: 'rgba(37, 99, 235, 0.12)',
        isPinned: false,
      },
      {
        id: 'approval_thresholds',
        title: 'Ngưỡng duyệt',
        description: 'Mức tiền nào cần mấy cấp duyệt.',
        href: '/tai-chinh/nguong-duyet',
        icon: GitBranch,
        iconColor: '#d97706', // Amber-600
        iconBgColor: 'rgba(217, 119, 6, 0.12)',
        isPinned: false,
      },
    ],
  },
  {
    id: 'reports',
    title: 'Báo cáo',
    items: [
      {
        id: 'account_reports',
        title: 'Báo cáo tài khoản',
        description: 'Tồn đầu kỳ, thu chi trong kỳ và tồn cuối kỳ.',
        href: '/tai-chinh/bao-cao-tai-khoan',
        icon: BookOpen,
        iconColor: '#e11d48', // Rose-600
        iconBgColor: 'rgba(225, 29, 72, 0.12)',
        isPinned: false,
      },
      {
        id: 'revenue_expenditure_reports',
        title: 'Báo cáo thu chi',
        description: 'Thống kê theo khoản mục, phòng ban và kế hoạch.',
        href: '/tai-chinh/bao-cao-thu-chi',
        icon: BarChart3,
        iconColor: '#ea580c', // Orange-600
        iconBgColor: 'rgba(234, 88, 12, 0.12)',
        isPinned: false,
      },
    ],
  },
];
