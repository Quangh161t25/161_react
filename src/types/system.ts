export interface SystemItem {
  id: string;
  code: string;
  title: string;
  description: string;
  href: string;
  guideHref?: string;
  icon: any;
  iconColor: string;
  iconBgColor: string;
  isPinned?: boolean;
}

export interface SystemSection {
  id: string;
  title: string;
  items: SystemItem[];
}
