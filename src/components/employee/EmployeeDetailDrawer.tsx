import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Trash2,
  Printer,
  Phone,
  Mail,
  Building2,
  Briefcase,
  User,
  CreditCard,
  GraduationCap,
  MapPin,
  Calendar,
  Shield,
  ShieldCheck,
  Clock,
  History,
  MessageSquare,
  Paperclip,
  Copy,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  CircleUser,
  Users,
  Heart,
  Layers,
  CircleDot,
  IdCard,
  School,
  Landmark,
  AlertCircle,
  Smile,
  Ban,
  Share2,
  FileText,
  Star,
  ExternalLink,
} from 'lucide-react';
import { Employee } from '../../types/employee';

interface EmployeeDetailDrawerProps {
  employee: Employee;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';
type ActivityTab = 'history' | 'comments' | 'attachments';

export const EmployeeDetailDrawer: React.FC<EmployeeDetailDrawerProps> = ({
  employee,
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
  onEdit,
  onDelete,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('normal');
  const [activityTab, setActivityTab] = useState<ActivityTab>('history');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    const bankListStr =
      employee.bankAccounts && employee.bankAccounts.length > 0
        ? employee.bankAccounts
            .map(
              (b, idx) =>
                `  [${idx + 1}] ${b.bankName || 'Ngân hàng'}: ${b.accountNumber} - ${b.accountHolder || employee.name}${b.isPrimary ? ' (Chính)' : ''}${b.branch ? ` - CN: ${b.branch}` : ''}`
            )
            .join('\n')
        : employee.bankAccount
        ? `${employee.bankAccount} (${employee.bankName || ''})`
        : '—';

    const lines = [
      `=== THÔNG TIN NHÂN SỰ: ${employee.name} ===`,
      `Mã nhân viên: ${employee.code || '—'}`,
      `Chức vụ: ${employee.role || '—'}`,
      `Phòng ban: ${employee.department || '—'}`,
      `Bộ phận: ${employee.subDepartment || '—'}`,
      `Trạng thái: ${
        employee.status === 'working'
          ? 'Đang làm việc'
          : employee.status === 'probation'
          ? 'Thử việc'
          : employee.status === 'resigned'
          ? 'Đã nghỉ việc'
          : 'Tạm hoãn'
      }`,
      `Điện thoại: ${employee.phone || '—'}`,
      `Email công việc: ${employee.email || '—'}`,
      `Email cá nhân: ${employee.personalEmail || '—'}`,
      `Giới tính: ${employee.gender || '—'}`,
      `Ngày sinh: ${employee.dob || '—'}`,
      `CMND/CCCD: ${employee.idCardNumber || '—'}`,
      `Địa chỉ: ${employee.currentAddress || employee.permanentAddress || '—'}`,
      `Tài khoản ngân hàng:\n${bankListStr}`,
      `Sở thích: ${employee.hobbies || '—'}`,
      `Không thích: ${employee.dislikes || '—'}`,
      `Facebook: ${employee.facebook || employee.socialMedia?.facebook || '—'}`,
      `Zalo: ${employee.zalo || employee.socialMedia?.zalo || '—'}`,
      `LinkedIn: ${employee.linkedin || employee.socialMedia?.linkedin || '—'}`,
      `TikTok: ${employee.tiktok || employee.socialMedia?.tiktok || '—'}`,
      `Ghi chú: ${employee.notes || '—'}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const toggleFullscreen = () => {
    if (widthMode === 'fullscreen') {
      setWidthMode(prevWidthMode || 'normal');
    } else {
      setPrevWidthMode(widthMode);
      setWidthMode('fullscreen');
    }
  };

  const getDrawerWidthStyle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return '100vw';
    }
    switch (widthMode) {
      case 'narrow':
        return 'min(540px, 100vw)';
      case 'wide':
        return 'min(1024px, 100vw)';
      case 'fullscreen':
        return '100vw';
      case 'normal':
      default:
        return 'min(768px, -6rem + 100vw)';
    }
  };

  const getStatusBadge = (status: Employee['status']) => {
    switch (status) {
      case 'working':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border transition-colors rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="whitespace-nowrap">Đang làm việc</span>
          </span>
        );
      case 'probation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border transition-colors rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="whitespace-nowrap">Thử việc</span>
          </span>
        );
      case 'resigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border transition-colors rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span className="whitespace-nowrap">Đã nghỉ việc</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border transition-colors rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="whitespace-nowrap">Tạm hoãn</span>
          </span>
        );
      default:
        return null;
    }
  };

  const avatarUrl =
    employee.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name || 'User')}&background=1d4ed8&color=fff`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Main Drawer Container */}
      <div
        className="fixed inset-y-0 right-0 w-full bg-card shadow-2xl flex flex-col h-[100dvh] border-l border-border outline-none transform-gpu z-50 transition-[width] duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Hồ sơ Nhân sự"
        tabIndex={-1}
        style={{
          width: getDrawerWidthStyle(),
          transform: 'none',
        }}
      >
        {/* Top Header */}
        <div
          className="flex items-center justify-between gap-4 border-b border-border bg-card shrink-0"
          style={{
            paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
            paddingBottom: '0.5rem',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          }}
        >
          {/* Left Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground leading-tight truncate">
                Hồ sơ Nhân sự
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {employee.name}
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Width Switcher (Tablet/Desktop) */}
            <div
              role="group"
              aria-label="Bề rộng ngăn bên"
              className="hidden sm:flex items-center gap-0.5 shrink-0 rounded-xl border border-border p-0.5"
            >
              <button
                type="button"
                aria-pressed={widthMode === 'narrow'}
                aria-label="Hẹp"
                title="Hẹp"
                onClick={() => setWidthMode('narrow')}
                className={`p-2 rounded-lg transition-colors active:scale-90 hover:bg-muted hover:text-foreground ${
                  widthMode === 'narrow'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <PanelRightClose className="w-4 h-4 stroke-[2.5px]" />
              </button>
              <button
                type="button"
                aria-pressed={widthMode === 'normal'}
                aria-label="Chuẩn"
                title="Chuẩn"
                onClick={() => setWidthMode('normal')}
                className={`p-2 rounded-lg transition-colors active:scale-90 hover:bg-muted hover:text-foreground ${
                  widthMode === 'normal'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <PanelRight className="w-4 h-4 stroke-[2.5px]" />
              </button>
              <button
                type="button"
                aria-pressed={widthMode === 'wide'}
                aria-label="Rộng"
                title="Rộng"
                onClick={() => setWidthMode('wide')}
                className={`p-2 rounded-lg transition-colors active:scale-90 hover:bg-muted hover:text-foreground ${
                  widthMode === 'wide'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <PanelRightOpen className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </div>

            {/* Navigation & Fullscreen */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                disabled={currentIndex <= 0}
                onClick={onPrev}
                aria-label="Bản ghi trước"
                title="Bản ghi trước"
                className="p-2 rounded-lg text-muted-foreground transition-colors active:scale-90 hover:bg-muted hover:text-foreground disabled:opacity-35 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5px]" />
              </button>
              <span
                className="px-1 text-xs font-medium text-muted-foreground tabular-nums select-none whitespace-nowrap"
                aria-label={`Bản ghi ${currentIndex + 1} trên ${totalCount}`}
              >
                {currentIndex + 1}/{totalCount}
              </span>
              <button
                type="button"
                disabled={currentIndex >= totalCount - 1}
                onClick={onNext}
                aria-label="Bản ghi sau"
                title="Bản ghi sau"
                className="p-2 rounded-lg text-muted-foreground transition-colors active:scale-90 hover:bg-muted hover:text-foreground disabled:opacity-35 disabled:pointer-events-none"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5px]" />
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={widthMode === 'fullscreen' ? 'Thu nhỏ' : 'Mở toàn màn hình'}
                title={widthMode === 'fullscreen' ? 'Thu nhỏ' : 'Mở toàn màn hình'}
                className="p-2 rounded-lg text-muted-foreground transition-colors active:scale-90 hover:bg-muted hover:text-foreground ml-1 border-l border-border rounded-l-none pl-2"
              >
                {widthMode === 'fullscreen' ? (
                  <Minimize2 className="w-4 h-4 stroke-[2.5px]" />
                ) : (
                  <Maximize2 className="w-4 h-4 stroke-[2.5px]" />
                )}
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              title="Đóng"
              className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors active:scale-90 shrink-0"
            >
              <X className="w-5 h-5 stroke-[2.5px]" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-5 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-5">
            {/* 1. Profile Banner Card */}
            <div className="bg-card p-4 rounded-xl border border-border/70 shadow-xs flex items-center gap-4">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAvatarPreviewOpen(true)}
                  className="p-0 border-0 bg-transparent cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
                  title="Xem lớn"
                  aria-label="Xem lớn"
                >
                  <img
                    alt={employee.name}
                    className="block w-14 h-14 rounded-xl border-2 border-card shadow-sm object-cover bg-card"
                    src={avatarUrl}
                  />
                </button>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card shadow-xs pointer-events-none ${
                    employee.status === 'working'
                      ? 'bg-emerald-500'
                      : employee.status === 'probation'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <h2 className="text-base font-bold text-foreground leading-tight truncate flex-1 min-w-0">
                    {employee.name}
                  </h2>
                  <div className="shrink-0">{getStatusBadge(employee.status)}</div>
                </div>
                <p className="text-xs text-primary font-medium">
                  {employee.role || '—'}
                </p>
              </div>
            </div>

            {/* 2. Quick Action Buttons Grid */}
            <div className="gap-2 sm:gap-3 p-2.5 sm:p-3.5 min-w-0 grid grid-cols-4 bg-card rounded-xl border border-border shadow-xs">
              {/* Trạng thái */}
              <button
                type="button"
                onClick={() => onEdit(employee)}
                className="flex flex-col items-center gap-1 sm:gap-1.5 transition-[transform,colors] duration-150 outline-none min-w-0 w-full hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-[transform,colors,background-color,border-color] duration-150 shadow-xs border bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground">
                  <Briefcase className="w-4 h-4" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-center transition-colors truncate w-full px-0.5 leading-tight text-primary">
                  Trạng thái
                </span>
              </button>

              {/* In */}
              <button
                type="button"
                onClick={() => window.print()}
                className="flex flex-col items-center gap-1 sm:gap-1.5 transition-[transform,colors] duration-150 outline-none min-w-0 w-full hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-[transform,colors,background-color,border-color] duration-150 shadow-xs border bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground">
                  <Printer className="w-4 h-4" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-center transition-colors truncate w-full px-0.5 leading-tight text-muted-foreground">
                  In
                </span>
              </button>

              {/* Gửi Email */}
              <button
                type="button"
                onClick={() => {
                  const targetEmail = employee.email || employee.personalEmail;
                  if (targetEmail) {
                    window.location.href = `mailto:${targetEmail}`;
                  }
                }}
                className="flex flex-col items-center gap-1 sm:gap-1.5 transition-[transform,colors] duration-150 outline-none min-w-0 w-full hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-[transform,colors,background-color,border-color] duration-150 shadow-xs border bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-center transition-colors truncate w-full px-0.5 leading-tight text-muted-foreground">
                  Gửi Email
                </span>
              </button>

              {/* Gọi điện */}
              <button
                type="button"
                onClick={() => {
                  if (employee.phone) {
                    window.location.href = `tel:${employee.phone}`;
                  }
                }}
                className="flex flex-col items-center gap-1 sm:gap-1.5 transition-[transform,colors] duration-150 outline-none min-w-0 w-full hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-[transform,colors,background-color,border-color] duration-150 shadow-xs border bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-center transition-colors truncate w-full px-0.5 leading-tight text-muted-foreground">
                  Gọi điện
                </span>
              </button>
            </div>

            {/* 3. Section Cards */}
            <div className="space-y-5">
              {/* Section: Thông tin cá nhân */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <User className="w-3.5 h-3.5" />
                    <span className="truncate">Thông tin cá nhân</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full">
                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <CircleUser className="w-3 h-3" />
                      Họ tên
                    </span>
                    <p className="text-xs text-foreground font-semibold leading-relaxed min-w-0 wrap-anywhere">
                      {employee.name || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Users className="w-3 h-3" />
                      Giới tính
                    </span>
                    <div className="text-xs leading-relaxed min-w-0 wrap-anywhere">
                      {employee.gender ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border transition-colors rounded-full bg-primary/10 text-primary border-primary/20">
                          <span className="whitespace-nowrap">{employee.gender}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Calendar className="w-3 h-3" />
                      Ngày sinh
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.dob || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Heart className="w-3 h-3" />
                      Tình trạng hôn nhân
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.maritalStatus || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <MapPin className="w-3 h-3" />
                      Quốc tịch
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.nationality || 'Việt Nam'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <User className="w-3 h-3" />
                      Dân tộc
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.ethnicity || 'Kinh'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <User className="w-3 h-3" />
                      Tôn giáo
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.religion || 'Không'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <MapPin className="w-3 h-3" />
                      Quê quán
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.hometown || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section: Thông tin công việc */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span className="truncate">Thông tin công việc</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full">
                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <IdCard className="w-3 h-3" />
                      Mã nhân viên
                    </span>
                    <p className="text-xs font-mono font-bold text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.code || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Briefcase className="w-3 h-3" />
                      Chức vụ
                    </span>
                    <p className="text-xs text-foreground font-semibold leading-relaxed min-w-0 wrap-anywhere">
                      {employee.role || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Building2 className="w-3 h-3" />
                      Phòng ban
                    </span>
                    <p className="text-xs text-foreground font-semibold leading-relaxed min-w-0 wrap-anywhere">
                      {employee.department || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Building2 className="w-3 h-3" />
                      Bộ phận
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.subDepartment || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Layers className="w-3 h-3" />
                      Cấp bậc
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.rank ? `Cấp ${employee.rank}` : '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <CircleDot className="w-3 h-3" />
                      Trạng thái
                    </span>
                    <div className="text-xs leading-relaxed min-w-0 wrap-anywhere">
                      {getStatusBadge(employee.status)}
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Calendar className="w-3 h-3" />
                      Ngày vào làm
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.startDate || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Calendar className="w-3 h-3" />
                      Ngày chính thức
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.officialDate || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Calendar className="w-3 h-3" />
                      Ngày nghỉ việc
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.resignationDate || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <CircleDot className="w-3 h-3" />
                      Lý do nghỉ
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.resignationReason || '—'}
                    </p>
                  </div>

                  {/* Username & Password */}
                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <User className="w-3 h-3" />
                      Tên đăng nhập
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-foreground">
                        {employee.username || employee.code || '—'}
                      </span>
                      {employee.username && (
                        <button
                          type="button"
                          onClick={() => handleCopy(employee.username!, 'username')}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Sao chép"
                        >
                          {copiedField === 'username' ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <KeyRound className="w-3 h-3" />
                      Mật khẩu
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-foreground">
                        {employee.password
                          ? showPassword
                            ? employee.password
                            : '••••••••'
                          : '—'}
                      </span>
                      {employee.password && (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          >
                            {showPassword ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(employee.password!, 'password')}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Sao chép"
                          >
                            {copiedField === 'password' ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Giấy tờ & địa chỉ */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <IdCard className="w-3.5 h-3.5" />
                    <span className="truncate">Giấy tờ & địa chỉ</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full">
                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <IdCard className="w-3 h-3" />
                      CMND/CCCD
                    </span>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono font-semibold text-foreground leading-relaxed min-w-0 wrap-anywhere">
                        {employee.idCardNumber || '—'}
                      </p>
                      {employee.idCardNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopy(employee.idCardNumber!, 'idCard')}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Sao chép CCCD"
                        >
                          {copiedField === 'idCard' ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Calendar className="w-3 h-3" />
                      Ngày cấp
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.idCardDate || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full sm:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <MapPin className="w-3 h-3" />
                      Nơi cấp
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.idCardPlace || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full sm:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <MapPin className="w-3 h-3" />
                      Địa chỉ thường trú
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.permanentAddress || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full sm:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <MapPin className="w-3 h-3" />
                      Chỗ ở hiện tại
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.currentAddress || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section: Thông tin liên hệ */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="truncate">Thông tin liên hệ</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full">
                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Mail className="w-3 h-3" />
                      Email công việc
                    </span>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                        {employee.email ? (
                          <a
                            href={`mailto:${employee.email}`}
                            className="text-primary hover:underline"
                          >
                            {employee.email}
                          </a>
                        ) : (
                          '—'
                        )}
                      </p>
                      {employee.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy(employee.email, 'email')}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Sao chép email"
                        >
                          {copiedField === 'email' ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Mail className="w-3 h-3" />
                      Email cá nhân
                    </span>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                        {employee.personalEmail ? (
                          <a
                            href={`mailto:${employee.personalEmail}`}
                            className="text-primary hover:underline"
                          >
                            {employee.personalEmail}
                          </a>
                        ) : (
                          '—'
                        )}
                      </p>
                      {employee.personalEmail && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(employee.personalEmail!, 'personalEmail')
                          }
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Sao chép email"
                        >
                          {copiedField === 'personalEmail' ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Phone className="w-3 h-3" />
                      Điện thoại
                    </span>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono font-semibold text-foreground leading-relaxed min-w-0 wrap-anywhere">
                        {employee.phone ? (
                          <a
                            href={`tel:${employee.phone}`}
                            className="text-primary hover:underline"
                          >
                            {employee.phone}
                          </a>
                        ) : (
                          '—'
                        )}
                      </p>
                      {employee.phone && (
                        <button
                          type="button"
                          onClick={() => handleCopy(employee.phone, 'phone')}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Sao chép SĐT"
                        >
                          {copiedField === 'phone' ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <User className="w-3 h-3" />
                      Người liên hệ khẩn cấp
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.emergencyContactName || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Phone className="w-3 h-3" />
                      SĐT khẩn cấp
                    </span>
                    <p className="text-xs font-mono text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.emergencyContactPhone || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Heart className="w-3 h-3" />
                      Quan hệ
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.emergencyContactRelation || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section: Học vấn & Chứng chỉ */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span className="truncate">Học vấn & Chứng chỉ</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full">
                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <GraduationCap className="w-3 h-3" />
                      Trình độ học vấn
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.educationLevel || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Briefcase className="w-3 h-3" />
                      Chuyên ngành
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.major || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full sm:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <School className="w-3 h-3" />
                      Trường đào tạo
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.school || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section: Tài chính & Ngân hàng */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <Landmark className="w-3.5 h-3.5" />
                    <span className="truncate">Tài chính & Ngân hàng</span>
                  </h4>
                  {employee.bankAccounts && employee.bankAccounts.length > 0 && (
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {employee.bankAccounts.length} tài khoản
                    </span>
                  )}
                </div>

                {employee.bankAccounts && employee.bankAccounts.length > 0 ? (
                  <div className="space-y-3">
                    {employee.bankAccounts.map((account, idx) => (
                      <div
                        key={account.id || idx}
                        className={`p-3.5 rounded-xl border transition-all ${
                          account.isPrimary
                            ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
                            : 'bg-muted/30 border-border hover:border-border/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-border/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`p-1.5 rounded-lg shrink-0 ${
                                account.isPrimary
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              <Landmark className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-foreground truncate">
                              {account.bankName || `Tài khoản ${idx + 1}`}
                            </span>
                          </div>
                          {account.isPrimary && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                              <Star className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
                              Tài khoản chính
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-[11px] font-medium text-muted-foreground block mb-0.5">
                              Số tài khoản
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-foreground">
                                {account.accountNumber || '—'}
                              </span>
                              {account.accountNumber && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(
                                      account.accountNumber,
                                      `bank-${account.id || idx}`
                                    )
                                  }
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                  title="Sao chép số tài khoản"
                                >
                                  {copiedField === `bank-${account.id || idx}` ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-[11px] font-medium text-muted-foreground block mb-0.5">
                              Chủ tài khoản
                            </span>
                            <span className="font-semibold text-foreground uppercase">
                              {account.accountHolder || employee.name || '—'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] font-medium text-muted-foreground block mb-0.5">
                              Chi nhánh
                            </span>
                            <span className="text-foreground">
                              {account.branch || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full">
                    <div className="space-y-1 min-w-0 w-full">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                        <CreditCard className="w-3 h-3" />
                        Số tài khoản
                      </span>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono font-bold text-foreground leading-relaxed min-w-0 wrap-anywhere">
                          {employee.bankAccount || '—'}
                        </p>
                        {employee.bankAccount && (
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(employee.bankAccount!, 'bankAccount')
                            }
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Sao chép số tài khoản"
                          >
                            {copiedField === 'bankAccount' ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 min-w-0 w-full">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                        <User className="w-3 h-3" />
                        Chủ tài khoản
                      </span>
                      <p className="text-xs font-semibold text-foreground uppercase leading-relaxed min-w-0 wrap-anywhere">
                        {employee.bankAccountHolder || employee.name || '—'}
                      </p>
                    </div>

                    <div className="space-y-1 min-w-0 w-full">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                        <Landmark className="w-3 h-3" />
                        Ngân hàng
                      </span>
                      <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                        {employee.bankName || '—'}
                      </p>
                    </div>

                    <div className="space-y-1 min-w-0 w-full">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                        <Building2 className="w-3 h-3" />
                        Chi nhánh
                      </span>
                      <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                        {employee.bankBranch || '—'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Sở thích & Thói quen */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <Smile className="w-3.5 h-3.5" />
                    <span className="truncate">Sở thích & Thói quen</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full">
                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0 text-emerald-600 dark:text-emerald-400">
                      <Smile className="w-3 h-3 text-emerald-500" />
                      Sở thích
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere whitespace-pre-line bg-muted/30 p-2.5 rounded-lg border border-border/50">
                      {employee.hobbies || 'Chưa có thông tin'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0 text-rose-600 dark:text-rose-400">
                      <Ban className="w-3 h-3 text-rose-500" />
                      Không thích / Kiêng kỵ
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere whitespace-pre-line bg-muted/30 p-2.5 rounded-lg border border-border/50">
                      {employee.dislikes || 'Chưa có thông tin'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section: Mạng xã hội & Kênh liên kết */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="truncate">Mạng xã hội & Kênh liên kết</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full">
                  {/* Facebook */}
                  <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      Facebook
                    </span>
                    {employee.facebook || employee.socialMedia?.facebook ? (
                      <div className="flex items-center justify-between gap-1">
                        <a
                          href={
                            (employee.facebook || employee.socialMedia?.facebook || '').startsWith('http')
                              ? (employee.facebook || employee.socialMedia?.facebook || '')
                              : `https://facebook.com/${employee.facebook || employee.socialMedia?.facebook}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary font-medium hover:underline truncate flex items-center gap-1"
                        >
                          <span className="truncate">
                            {employee.facebook || employee.socialMedia?.facebook}
                          </span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">—</p>
                    )}
                  </div>

                  {/* Zalo */}
                  <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                    <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                      Zalo
                    </span>
                    {employee.zalo || employee.socialMedia?.zalo ? (
                      <div className="flex items-center justify-between gap-1">
                        <a
                          href={
                            (employee.zalo || employee.socialMedia?.zalo || '').startsWith('http')
                              ? (employee.zalo || employee.socialMedia?.zalo || '')
                              : `https://zalo.me/${employee.zalo || employee.socialMedia?.zalo}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary font-medium hover:underline truncate flex items-center gap-1"
                        >
                          <span className="truncate">
                            {employee.zalo || employee.socialMedia?.zalo}
                          </span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">—</p>
                    )}
                  </div>

                  {/* LinkedIn */}
                  <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                    <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      LinkedIn
                    </span>
                    {employee.linkedin || employee.socialMedia?.linkedin ? (
                      <div className="flex items-center justify-between gap-1">
                        <a
                          href={
                            (employee.linkedin || employee.socialMedia?.linkedin || '').startsWith('http')
                              ? (employee.linkedin || employee.socialMedia?.linkedin || '')
                              : `https://linkedin.com/in/${employee.linkedin || employee.socialMedia?.linkedin}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary font-medium hover:underline truncate flex items-center gap-1"
                        >
                          <span className="truncate">
                            {employee.linkedin || employee.socialMedia?.linkedin}
                          </span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">—</p>
                    )}
                  </div>

                  {/* TikTok */}
                  <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      TikTok
                    </span>
                    {employee.tiktok || employee.socialMedia?.tiktok ? (
                      <div className="flex items-center justify-between gap-1">
                        <a
                          href={
                            (employee.tiktok || employee.socialMedia?.tiktok || '').startsWith('http')
                              ? (employee.tiktok || employee.socialMedia?.tiktok || '')
                              : `https://tiktok.com/@${(employee.tiktok || employee.socialMedia?.tiktok || '').replace(/^@/, '')}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary font-medium hover:underline truncate flex items-center gap-1"
                        >
                          <span className="truncate">
                            {employee.tiktok || employee.socialMedia?.tiktok}
                          </span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">—</p>
                    )}
                  </div>

                  {/* Instagram */}
                  <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                    <span className="text-[11px] font-semibold text-pink-600 dark:text-pink-400 flex items-center gap-1">
                      Instagram
                    </span>
                    {employee.instagram || employee.socialMedia?.instagram ? (
                      <div className="flex items-center justify-between gap-1">
                        <a
                          href={
                            (employee.instagram || employee.socialMedia?.instagram || '').startsWith('http')
                              ? (employee.instagram || employee.socialMedia?.instagram || '')
                              : `https://instagram.com/${(employee.instagram || employee.socialMedia?.instagram || '').replace(/^@/, '')}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary font-medium hover:underline truncate flex items-center gap-1"
                        >
                          <span className="truncate">
                            {employee.instagram || employee.socialMedia?.instagram}
                          </span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">—</p>
                    )}
                  </div>

                  {/* X / Twitter */}
                  <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      X / Twitter
                    </span>
                    {employee.twitter || employee.socialMedia?.twitter ? (
                      <div className="flex items-center justify-between gap-1">
                        <a
                          href={
                            (employee.twitter || employee.socialMedia?.twitter || '').startsWith('http')
                              ? (employee.twitter || employee.socialMedia?.twitter || '')
                              : `https://x.com/${(employee.twitter || employee.socialMedia?.twitter || '').replace(/^@/, '')}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary font-medium hover:underline truncate flex items-center gap-1"
                        >
                          <span className="truncate">
                            {employee.twitter || employee.socialMedia?.twitter}
                          </span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">—</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Ghi chú nhân sự */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate">Ghi chú nhân sự</span>
                  </h4>
                </div>

                <div className="w-full">
                  {employee.notes ? (
                    <div className="text-xs text-foreground leading-relaxed bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg whitespace-pre-line">
                      {employee.notes}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Chưa có ghi chú nội bộ nào cho nhân sự này.
                    </p>
                  )}
                </div>
              </div>

              {/* Section: Bảo hiểm */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <Shield className="w-3.5 h-3.5" />
                    <span className="truncate">Bảo hiểm</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full">
                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Shield className="w-3 h-3" />
                      Số BHXH
                    </span>
                    <p className="text-xs font-mono font-semibold text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.socialInsuranceNumber || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                      Số BHYT
                    </span>
                    <p className="text-xs font-mono font-semibold text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.healthInsuranceNumber || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full sm:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <IdCard className="w-3 h-3" />
                      Mã số thuế cá nhân
                    </span>
                    <p className="text-xs font-mono font-semibold text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.taxCode || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section: Thông tin hệ thống */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="truncate">Thông tin hệ thống</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full">
                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Calendar className="w-3 h-3" />
                      Ngày tạo
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.createdAt || '—'}
                    </p>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0 break-words [&>svg]:shrink-0">
                      <Calendar className="w-3 h-3" />
                      Cập nhật lần cuối
                    </span>
                    <p className="text-xs text-foreground leading-relaxed min-w-0 wrap-anywhere">
                      {employee.updatedAt || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section: Nhật ký hoạt động */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <History className="w-3.5 h-3.5" />
                    <span className="truncate">Nhật ký hoạt động</span>
                  </h4>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <div className="min-w-0 max-w-full overflow-x-auto">
                      <div className="flex gap-0.5 p-0.5 bg-muted/50 rounded-lg border border-border/50 w-fit">
                        <button
                          type="button"
                          onClick={() => setActivityTab('history')}
                          className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all select-none whitespace-nowrap cursor-pointer ${
                            activityTab === 'history'
                              ? 'bg-primary text-primary-foreground shadow-xs shadow-primary/25'
                              : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                          }`}
                        >
                          <History className="w-3.5 h-3.5" />
                          Thay đổi
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivityTab('comments')}
                          className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all select-none whitespace-nowrap cursor-pointer ${
                            activityTab === 'comments'
                              ? 'bg-primary text-primary-foreground shadow-xs shadow-primary/25'
                              : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Trao đổi
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivityTab('attachments')}
                          className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all select-none whitespace-nowrap cursor-pointer ${
                            activityTab === 'attachments'
                              ? 'bg-primary text-primary-foreground shadow-xs shadow-primary/25'
                              : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                          }`}
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          Tệp kèm
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Empty State / Content for Activity Tab */}
                {activityTab === 'history' && (
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground px-6 py-10 bg-card rounded-xl border border-dashed border-border">
                    <History className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-xs text-foreground font-semibold">
                      Chưa có thao tác nào
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm text-balance">
                      Mọi thay đổi trên bản ghi này sẽ được ghi lại tại đây.
                    </p>
                  </div>
                )}

                {activityTab === 'comments' && (
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground px-6 py-10 bg-card rounded-xl border border-dashed border-border">
                    <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-xs text-foreground font-semibold">
                      Chưa có trao đổi nào
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm text-balance">
                      Bình luận và trao đổi công việc liên quan sẽ xuất hiện ở đây.
                    </p>
                  </div>
                )}

                {activityTab === 'attachments' && (
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground px-6 py-10 bg-card rounded-xl border border-dashed border-border">
                    <Paperclip className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-xs text-foreground font-semibold">
                      Chưa có tệp đính kèm
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm text-balance">
                      Hợp đồng, CV và tài liệu hồ sơ đính kèm sẽ hiển thị tại đây.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div
          className="bg-card border-t border-border flex flex-col-reverse sm:flex-row items-center shrink-0 w-full gap-2 z-10"
          style={{
            paddingTop: '0.5rem',
            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          }}
        >
          {showDeleteConfirm ? (
            <div className="flex items-center justify-between w-full gap-2 animate-in fade-in duration-200">
              <span className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Xác nhận xóa nhân viên này?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(employee.id || employee.code);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-xs"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted h-8 px-3 text-xs text-muted-foreground hover:text-foreground border border-border cursor-pointer"
              >
                Đóng
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted h-8 px-3 text-xs text-muted-foreground hover:text-foreground border border-border cursor-pointer"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5 shrink-0 text-emerald-500" />
                      Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                      Sao chép
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(employee)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 text-xs bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer"
                >
                  <SquarePen className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 text-xs text-rose-600 hover:bg-rose-500/10 border border-rose-200 dark:border-rose-950 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  Xóa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Preview Lightbox Modal */}
      {isAvatarPreviewOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsAvatarPreviewOpen(false)}
        >
          <div
            className="relative max-w-md w-full bg-card rounded-2xl overflow-hidden shadow-2xl border border-border p-4 flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 border-b border-border">
              <h4 className="text-sm font-bold text-foreground truncate">
                {employee.name}
              </h4>
              <button
                type="button"
                onClick={() => setIsAvatarPreviewOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={avatarUrl}
              alt={employee.name}
              className="w-64 h-64 sm:w-80 sm:h-80 object-cover rounded-xl shadow-md border border-border"
            />
            <p className="text-xs text-muted-foreground font-mono">
              {employee.code}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
