import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Trash2,
  GitBranch,
  ShieldCheck,
  Building2,
  FileText,
  Copy,
  Check,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  Clock,
} from 'lucide-react';
import { ApprovalThreshold } from '../../../types/financeMaster';

interface ApprovalThresholdDetailDrawerProps {
  threshold: ApprovalThreshold;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onEdit: (t: ApprovalThreshold) => void;
  onDelete: (id: string) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

export const ApprovalThresholdDetailDrawer: React.FC<ApprovalThresholdDetailDrawerProps> = ({
  threshold,
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
  const [copiedAll, setCopiedAll] = useState(false);

  const formatMoney = (n: number) => (n ? n.toLocaleString('vi-VN') : '0');

  const handleCopyAll = () => {
    const text = `NGƯỠNG DUYỆT CHI PHÍ: ${threshold.name}
Mã: ${threshold.code}
Hạn mức: ${formatMoney(threshold.minAmount)} VNĐ → ${threshold.maxAmount === 0 ? 'Không giới hạn' : `${formatMoney(threshold.maxAmount)} VNĐ`}
Số cấp duyệt: ${threshold.approvalLevels} Cấp
Các cấp phê duyệt: ${(threshold.approvers || []).join(' → ')}
Áp dụng cho: ${threshold.appliesTo === 'proposal' ? 'Đề xuất chi phí' : threshold.appliesTo === 'expense' ? 'Phiếu chi tiền' : threshold.appliesTo === 'advance' ? 'Tạm ứng' : 'Tất cả nghiệp vụ chi'}
Phòng ban: ${threshold.department || 'Tất cả'}
Khoản mục: ${threshold.category || 'Tất cả'}
Trạng thái: ${threshold.status === 'active' ? 'Hiệu lực' : 'Tạm dừng'}
Ghi chú: ${threshold.note || '—'}`;

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
                {threshold.code}
              </span>
              <h2 className="text-sm font-semibold truncate text-foreground">
                {threshold.name}
              </h2>
            </div>

            <div className="flex items-center gap-1 shrink-0">
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

              <div className="flex items-center border border-border rounded-lg bg-background p-0.5 mr-1">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={currentIndex <= 0}
                  className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Ngưỡng duyệt trước"
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
                  title="Ngưỡng duyệt tiếp theo"
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
            {/* Hero Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                  <GitBranch className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-foreground">{threshold.name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
                      {threshold.approvalLevels} Cấp phê duyệt
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        threshold.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {threshold.status === 'active' ? 'Đang hiệu lực' : 'Tạm ngưng'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    Hạn mức: {formatMoney(threshold.minAmount)} VNĐ →{' '}
                    {threshold.maxAmount === 0 ? 'Không giới hạn' : `${formatMoney(threshold.maxAmount)} VNĐ`}
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

            {/* Visual Step-by-Step Approval Workflow */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Quy trình luân chuyển phê duyệt</span>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-4">
                {threshold.approvers && threshold.approvers.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-primary/30">
                    {threshold.approvers.map((role, idx) => (
                      <div key={idx} className="relative flex items-start gap-3">
                        <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shadow-sm">
                          {idx + 1}
                        </div>
                        <div className="bg-muted/30 border border-border rounded-lg p-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">
                              Cấp {idx + 1}: {role}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              Bắt buộc duyệt
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Phê duyệt tính hợp lý, chứng từ và hạn mức ngân sách
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Chưa có danh sách người duyệt
                  </p>
                )}
              </div>
            </div>

            {/* Scope of Application */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Phạm vi & Điều kiện áp dụng</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Loại nghiệp vụ</span>
                  <span className="font-semibold text-foreground">
                    {threshold.appliesTo === 'proposal'
                      ? 'Đề xuất chi phí'
                      : threshold.appliesTo === 'expense'
                      ? 'Phiếu chi tiền'
                      : threshold.appliesTo === 'advance'
                      ? 'Tạm ứng'
                      : 'Tất cả nghiệp vụ'}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Phòng ban</span>
                  <span className="font-semibold text-foreground">{threshold.department || 'Tất cả phòng ban'}</span>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Khoản mục</span>
                  <span className="font-semibold text-foreground">{threshold.category || 'Tất cả khoản mục'}</span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Ghi chú quy trình</span>
              </div>
              <div className="p-3.5 rounded-lg border border-border bg-card text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {threshold.note || 'Không có ghi chú thêm.'}
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
                  <span className="font-medium text-foreground">{threshold.createdAt || '—'}</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <span className="text-muted-foreground block mb-1">Cập nhật lần cuối</span>
                  <span className="font-medium text-foreground">{threshold.updatedAt || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-3">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 w-full justify-end animate-in fade-in-0">
                <span className="text-xs text-rose-600 font-medium mr-2">Xác nhận xoá quy tắc này?</span>
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
                    onDelete(threshold.code || threshold.id);
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
                    onClick={() => onEdit(threshold)}
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
