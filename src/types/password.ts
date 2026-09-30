export type PasswordCategory =
  | 'all'
  | 'web'
  | 'social'
  | 'email'
  | 'work'
  | 'server'
  | 'finance'
  | 'software'
  | 'other';

export interface PasswordCategoryInfo {
  id: PasswordCategory;
  name: string;
  iconName: string;
  color: string;
  badgeBg: string;
}

export interface PasswordItem {
  id: string;
  code: string; // MK-001, MK-002
  title: string; // Tên dịch vụ / Website (vd: Google Workspace, Facebook Fanpage, Server VPS HCM)
  category: PasswordCategory;
  url?: string;
  username: string; // Tên đăng nhập / Email / Số điện thoại
  password: string; // Mật khẩu (được mã hóa hoặc lưu trong vault an toàn)
  pinOr2FA?: string; // Mã PIN / Khóa bảo mật 2FA (tùy chọn)
  note?: string; // Ghi chú thêm
  tags?: string[]; // Tags ví dụ: ["Cá nhân", "Công ty", "Ưu tiên"]
  isFavorite?: boolean;
  securityScore?: number; // 0 - 100 điểm đánh giá độ mạnh
  lastChangedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordVaultSettings {
  isMasterPinEnabled: boolean;
  masterPinHash?: string; // Hash of the PIN
  autoLockMinutes: number; // Tự động khóa sau X phút (0 = không tự khóa)
  lastUnlockedTime?: number;
}

export interface ExtensionSyncPayload {
  version: string;
  exportedAt: string;
  vaultName: string;
  itemCount: number;
  items: PasswordItem[];
}
