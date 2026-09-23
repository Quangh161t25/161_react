import { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
}

export interface DashboardModule {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  gradientClass: string;
}

export interface UserProfile {
  name: string;
  title: string;
  avatarUrl: string;
  isOnline: boolean;
}
