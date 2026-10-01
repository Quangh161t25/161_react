import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Trash2,
  Users,
  Building,
  UserCheck,
  Briefcase,
  Phone,
  Landmark,
  Copy,
  Check,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  User,
  Clock,
  FileText,
} from 'lucide-react';
import { Counterparty } from '../../../types/financeMaster';

interface CounterpartyDetailDrawerProps {
  counterparty: Counterparty;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onEdit: (c: Counterparty) => void;
  onDelete: (id: string) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

export const CounterpartyDetailDrawer: React.FC<CounterpartyDetailDrawerProps> = ({
  counterparty,
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    const text = `ĐỐI TƯỢNG THU CHI: ${counterparty.name}
Mã: ${counterparty.code}
Phân loại: ${
      counterparty.type === 'customer'
        ? 'Khách hàng'
        : counterparty.type === 'vendor'
        ? 'Nhà cung cấp'
        : counterparty.type === 'employee'
        ? 'Nhân viên nội bộ'
        : counterparty.type === 'partner'
        ? 'Đối tác'
        : 'Khác'
    }
SĐT: ${counterparty.phone || '—'}
Email: ${counterparty.email || '—'}
Địa chỉ: ${counterparty.address || '—'}
Mã số thuế: ${counterparty.taxCode || '—'}
Số tài khoản: ${counterparty.bankAccount || '—'} (${counterparty.bankName || '—'}${counterparty.bankBranch ? ` - CN: ${counterparty.bankBranch}` : ''})
Người liên hệ: ${counterparty.contactPerson || '—'} (${counterparty.contactPersonPhone || '—'})
Trạng thái: ${counterparty.status === 'active' ? 'Đang giao dịch' : 'Tạm dừng'}
Ghi chú: ${counterparty.note || '—'}`;

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

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
      case 'normal':
        return 'min(640px, 100vw)';
      case 'wide':
        return 'min(980px, 100vw)';
      case 'fullscreen':
        return '100vw';
      default:
        return 'min(640px, 100vw)';
    }
  };

  const typeConfig = {
    customer: { label: 'Khách hàng', icon: UserCheck, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    vendor: { label: 'Nhà cung cấp', icon: Building, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    employee: { label: 'Nhân viên nội bộ', icon: User, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    partner: { label: 'Đối tác liên kết', icon: Briefcase, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
    other: { label: 'Đối tượng khác', icon: Users, color: 'bg-muted text-muted-foreground border-border' },
  }[counterparty.type] || { label: counterparty.type, icon: Users, color: 'bg-muted text-muted-foreground border-border' };

  const TypeIcon = typeConfig.icon;

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
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                {counterparty.code}
              </span>
              <h2 className="text-sm font-semibold truncate text-foreground">
                {counterparty.name}
              </h2>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Width Controls */}
              <div className="hidden md:flex items-center border border-border rounded-lg bg-background p-0.5 mr-1">
                <button
                  type="button"
                  title="Gọn (440px)"
                  onClick={() => setWidthMode('narrow')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'narrow' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Vừa (580px)"
                  onClick={() => setWidthMode('normal')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'normal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Rộng (820px)"
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

              {/* Navigation */}
              <div className="flex items-center border border-border rounded-lg bg-background p-0.5 mr-1">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={currentIndex <= 0}
                  className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Đối tượng trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] px-1 font-mono text-muted-foreground">
                  {currentIndex + 1}/{totalCount}
                </span>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={currentIndex >= totalCount - 1}
                  className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Đối tượng tiếp theo"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Đóng (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {/* Hero Profile Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                  <TypeIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-foreground">{counterparty.name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        counterparty.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {counterparty.status === 'active' ? 'Đang giao dịch' : 'Tạm ngưng'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    Mã số thuế: {counterparty.taxCode || 'Chưa cập nhật MST'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors shrink-0"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAll ? 'Đã sao chép' : 'Sao chép thông tin'}</span>
              </button>
            </div>

            {/* Contact Details Grid */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                <Phone className="w-3.5 h-3.5" />
                <span>Thông tin liên lạc & Địa chỉ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Số điện thoại</span>
                    <span className="font-semibold text-foreground">{counterparty.phone || '—'}</span>
                  </div>
                  {counterparty.phone && (
                    <button
                      type="button"
                      onClick={() => handleCopy(counterparty.phone || '', 'phone')}
                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                    >
                      {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Email</span>
                    <span className="font-semibold text-foreground">{counterparty.email || '—'}</span>
                  </div>
                  {counterparty.email && (
                    <button
                      type="button"
                      onClick={() => handleCopy(counterparty.email || '', 'email')}
                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                    >
                      {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                <div className="sm:col-span-2 p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-0.5">Địa chỉ trụ sở / Giao dịch</span>
                  <span className="font-medium text-foreground">{counterparty.address || '—'}</span>
                </div>
              </div>
            </div>

            {/* Banking & Invoicing */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                <Landmark className="w-3.5 h-3.5" />
                <span>Tài khoản Ngân hàng & Hoá đơn</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Mã số thuế (MST)</span>
                    <span className="font-mono font-bold text-foreground">{counterparty.taxCode || '—'}</span>
                  </div>
                  {counterparty.taxCode && (
                    <button
                      type="button"
                      onClick={() => handleCopy(counterparty.taxCode || '', 'tax')}
                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                    >
                      {copiedField === 'tax' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Số tài khoản (STK)</span>
                    <span className="font-mono font-bold text-foreground">{counterparty.bankAccount || '—'}</span>
                  </div>
                  {counterparty.bankAccount && (
                    <button
                      type="button"
                      onClick={() => handleCopy(counterparty.bankAccount || '', 'bankAcc')}
                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                    >
                      {copiedField === 'bankAcc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-0.5">Tên ngân hàng</span>
                  <span className="font-semibold text-foreground">{counterparty.bankName || '—'}</span>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-0.5">Chi nhánh ngân hàng</span>
                  <span className="font-semibold text-foreground">{counterparty.bankBranch || '—'}</span>
                </div>
              </div>
            </div>

            {/* Representative / Contact Person */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                <User className="w-3.5 h-3.5" />
                <span>Người đại diện / Người liên hệ phụ trách</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-0.5">Họ và tên</span>
                  <span className="font-semibold text-foreground">{counterparty.contactPerson || '—'}</span>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-0.5">SĐT người liên hệ</span>
                  <span className="font-semibold text-foreground">{counterparty.contactPersonPhone || '—'}</span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Ghi chú bổ sung</span>
              </div>
              <div className="p-3.5 rounded-lg border border-border bg-card text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {counterparty.note || 'Không có ghi chú thêm.'}
              </div>
            </div>

            {/* Metadata & Audit */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Nhật ký khởi tạo</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <span className="text-muted-foreground block mb-1">Ngày tạo</span>
                  <span className="font-medium text-foreground">{counterparty.createdAt || '—'}</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <span className="text-muted-foreground block mb-1">Cập nhật lần cuối</span>
                  <span className="font-medium text-foreground">{counterparty.updatedAt || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-3">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 w-full justify-end animate-in fade-in-0">
                <span className="text-xs text-rose-600 font-medium mr-2">Xác nhận xoá đối tượng này?</span>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted text-foreground"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(counterparty.code || counterparty.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Xoá vĩnh viễn
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xoá</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(counterparty)}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-all"
                  >
                    <SquarePen className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa</span>
                  </button>
                </div>
              </>
            )}
          </div>
      </div>
    </>
  );
};
