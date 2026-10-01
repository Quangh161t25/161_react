import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Star,
  ShieldCheck,
  Tag,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { PasswordItem } from '../../types/password';
import { PASSWORD_CATEGORIES } from '../../data/passwords';

interface PasswordDetailDrawerProps {
  item: PasswordItem;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onEdit: (item: PasswordItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

export const PasswordDetailDrawer: React.FC<PasswordDetailDrawerProps> = ({
  item,
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('normal');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const toggleFullscreen = () => {
    if (widthMode === 'fullscreen') {
      setWidthMode(prevWidthMode);
    } else {
      setPrevWidthMode(widthMode);
      setWidthMode('fullscreen');
    }
  };

  const getDrawerWidthStyle = () => {
    switch (widthMode) {
      case 'narrow':
        return 'min(480px, 100vw)';
      case 'wide':
        return 'min(980px, 100vw)';
      case 'fullscreen':
        return '100vw';
      case 'normal':
      default:
        return 'min(640px, 100vw)';
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const categoryInfo = PASSWORD_CATEGORIES.find((c) => c.id === item.category);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Main Drawer Container */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex flex-col bg-card border-l border-border shadow-2xl transition-[width] duration-300 ease-in-out"
        style={{
          width: getDrawerWidthStyle(),
          maxWidth: '100vw',
        }}
      >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">{item.code}</span>
                  <span className="text-xs text-muted-foreground">
                    ({currentIndex + 1}/{totalCount})
                  </span>
                </div>
                <h2 className="text-sm font-bold text-foreground leading-tight truncate max-w-[200px] sm:max-w-xs">
                  {item.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Prev / Next */}
              <div className="flex items-center border border-border rounded-lg bg-background p-0.5 mr-1">
                <button
                  type="button"
                  title="Trước đó"
                  disabled={currentIndex <= 0}
                  onClick={onPrev}
                  className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Tiếp theo"
                  disabled={currentIndex >= totalCount - 1}
                  onClick={onNext}
                  className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Width Controls */}
              <div className="hidden md:flex items-center border border-border rounded-lg bg-background p-0.5 mr-1">
                <button
                  type="button"
                  title="Gọn"
                  onClick={() => setWidthMode('narrow')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'narrow' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Vừa"
                  onClick={() => setWidthMode('normal')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'normal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Rộng"
                  onClick={() => setWidthMode('wide')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'wide' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRightOpen className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={widthMode === 'fullscreen' ? 'Thu nhỏ' : 'Toàn màn hình'}
                  onClick={toggleFullscreen}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'fullscreen' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {widthMode === 'fullscreen' ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => onToggleFavorite(item.id)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  item.isFavorite
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
                title="Yêu thích"
              >
                <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-500' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => onEdit(item)}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Chỉnh sửa"
              >
                <SquarePen className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${item.title}"?`)) {
                    onDelete(item.id);
                  }
                }}
                className="p-1.5 rounded-lg border border-border text-rose-500 hover:bg-rose-500/10"
                title="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar">
            {/* Top Overview Card */}
            <div className="bg-muted/40 p-4 rounded-2xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${categoryInfo?.badgeBg || 'bg-muted'} ${categoryInfo?.color || 'text-foreground'}`}>
                  {categoryInfo?.name || item.category}
                </span>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>Mở trang đăng nhập</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <h1 className="text-base font-bold text-foreground">
                {item.title}
              </h1>

              {item.url && (
                <div className="text-xs text-muted-foreground font-mono truncate">
                  {item.url}
                </div>
              )}
            </div>

            {/* Credentials Card */}
            <div className="bg-card p-4 rounded-2xl border border-border shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Thông tin xác thực & Mật khẩu
              </h3>

              {/* Username Field */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-muted-foreground block mb-0.5">Tên đăng nhập / Email:</span>
                  <div className="font-semibold text-xs text-foreground truncate select-all">
                    {item.username}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(item.username, 'username')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors shrink-0"
                >
                  {copiedField === 'username' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedField === 'username' ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>

              {/* Password Field */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-muted-foreground block mb-0.5">Mật khẩu:</span>
                    <div className="font-mono text-sm font-bold text-primary tracking-wide break-all select-all">
                      {showPassword ? item.password : '••••••••••••••••'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground"
                      title={showPassword ? 'Ẩn' : 'Hiện'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.password, 'password')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs"
                    >
                      {copiedField === 'password' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedField === 'password' ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>

                {/* Password Strength Score */}
                <div className="flex items-center gap-2 pt-1 border-t border-border/50 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-muted-foreground">Độ mạnh mật khẩu:</span>
                  <span className="font-bold text-foreground">
                    {item.securityScore || 90}/100
                  </span>
                </div>
              </div>

              {/* 2FA / PIN Field if available */}
              {item.pinOr2FA && (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-amber-600 font-semibold block mb-0.5">Mã PIN / 2FA:</span>
                    <div className="font-mono text-xs font-bold text-foreground select-all">
                      {item.pinOr2FA}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.pinOr2FA || '', 'pin')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors shrink-0"
                  >
                    {copiedField === 'pin' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedField === 'pin' ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Tags & Notes */}
            {(item.tags?.length || item.note) && (
              <div className="bg-card p-4 rounded-2xl border border-border space-y-3">
                {item.tags && item.tags.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1.5">
                      <Tag className="w-3.5 h-3.5" /> Nhãn phân loại:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-0.5 rounded-lg bg-muted text-foreground text-xs font-medium border border-border"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {item.note && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-xs font-semibold text-muted-foreground block mb-1">
                      Ghi chú:
                    </span>
                    <p className="text-xs text-foreground whitespace-pre-line leading-relaxed bg-muted/30 p-2.5 rounded-xl border border-border/60">
                      {item.note}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Audit Dates */}
            <div className="p-3 bg-muted/20 rounded-xl border border-border text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span>Ngày đổi mật khẩu gần nhất:</span>
                <span className="font-semibold text-foreground">{item.lastChangedDate || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Khởi tạo lúc:</span>
                <span className="font-semibold text-foreground">{item.createdAt || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cập nhật lần cuối:</span>
                <span className="font-semibold text-foreground">{item.updatedAt || '—'}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/40">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <SquarePen className="w-4 h-4" />
              <span>Chỉnh sửa tài khoản</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
            >
              Đóng
            </button>
          </div>
      </div>
    </>
  );
};
