import { PasswordCategoryInfo, PasswordItem } from '../types/password';

export const PASSWORD_CATEGORIES: PasswordCategoryInfo[] = [
  { id: 'all', name: 'Tất cả tài khoản', iconName: 'KeyRound', color: 'text-primary', badgeBg: 'bg-primary/10' },
  { id: 'work', name: 'Công việc & ERP', iconName: 'Building2', color: 'text-blue-500', badgeBg: 'bg-blue-500/10' },
  { id: 'email', name: 'Email & Thư tín', iconName: 'Mail', color: 'text-amber-500', badgeBg: 'bg-amber-500/10' },
  { id: 'web', name: 'Website & Dịch vụ Web', iconName: 'Globe', color: 'text-emerald-500', badgeBg: 'bg-emerald-500/10' },
  { id: 'social', name: 'Mạng xã hội & Chat', iconName: 'Share2', color: 'text-indigo-500', badgeBg: 'bg-indigo-500/10' },
  { id: 'server', name: 'Server / VPS & Cloud', iconName: 'Server', color: 'text-purple-500', badgeBg: 'bg-purple-500/10' },
  { id: 'finance', name: 'Ngân hàng & Ví điện tử', iconName: 'Wallet', color: 'text-rose-500', badgeBg: 'bg-rose-500/10' },
  { id: 'software', name: 'Bản quyền & Phần mềm', iconName: 'Cpu', color: 'text-cyan-500', badgeBg: 'bg-cyan-500/10' },
  { id: 'other', name: 'Mục khác', iconName: 'FolderLock', color: 'text-slate-500', badgeBg: 'bg-slate-500/10' },
];

// Danh sách tài khoản & mật khẩu do người dùng lưu trong két mã hóa
export const INITIAL_PASSWORDS: PasswordItem[] = [];
