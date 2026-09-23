import { LucideIcon } from 'lucide-react';

export interface FinanceItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  isPinned?: boolean;
}

export interface FinanceSectionData {
  id: string;
  title: string;
  items: FinanceItem[];
}
