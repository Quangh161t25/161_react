import React, { useState } from 'react';
import {
  X,
  Clock,
  Play,
  SquarePen,
  Trash2,
  Bell,
  FileText,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Pin,
  Tag,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Trigger } from '../../types/trigger';
import { formatDate } from '../../utils/dateUtils';

interface TriggerDetailDrawerProps {
  trigger: Trigger | null;
  onClose: () => void;
  onEdit: (trigger: Trigger) => void;
  onDelete: (id: string) => void;
  onRunNow: (id: string) => Promise<void>;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const TriggerDetailDrawer: React.FC<TriggerDetailDrawerProps> = ({
  trigger,
  onClose,
  onEdit,
  onDelete,
  onRunNow,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  if (!trigger) return null;

  const handleRun = async () => {
    setIsRunning(true);
    setRunMessage(null);
    try {
      await onRunNow(trigger.id);
      setRunMessage('Đã kích hoạt trigger thành công!');
      setTimeout(() => setRunMessage(null), 3500);
    } catch (err: any) {
      setRunMessage(`Lỗi: ${err?.message || 'Không thể chạy'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    const text = `TRIGGER: ${trigger.title}
Mã: ${trigger.code}
Hành động: ${trigger.action === 'notify' ? 'Thông báo' : 'Thêm ghi chú'}
Hẹn lúc: ${trigger.runTime || ''} ${trigger.runDate || trigger.runAt}
Trạng thái: ${trigger.status}
Nội dung: ${trigger.content || '—'}
Kết quả: ${trigger.result || 'Chưa chạy'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã chạy
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 border border-slate-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            Đang chờ
          </span>
        );
    }
  };

  const getPriorityBadge = (p?: string) => {
    switch (p) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">Khẩn cấp</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">Cao</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-500/10 text-slate-600 border border-slate-500/20">Thấp</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">Trung bình</span>;
    }
  };

  const [datePart, timePart] = (trigger.runAt || '').split('T');
  const displayDate = trigger.runDate ? formatDate(trigger.runDate) : formatDate(datePart);
  const displayTime = trigger.runTime || (timePart ? timePart.slice(0, 5) : '09:00');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Top Bar with Navigation & Actions */}
          <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {trigger.code}
              </span>
              {trigger.isPinned && (
                <span className="p-1 rounded-md bg-amber-500/10 text-amber-600" title="Đã ghim">
                  <Pin className="w-3.5 h-3.5 fill-current" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {hasPrev && (
                <button
                  type="button"
                  onClick={onPrev}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Trigger trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {hasNext && (
                <button
                  type="button"
                  onClick={onNext}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Trigger tiếp theo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Sao chép thông tin"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => onEdit(trigger)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Chỉnh sửa"
              >
                <SquarePen className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(trigger.id)}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                title="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {runMessage && (
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2 animate-in fade-in">
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{runMessage}</span>
              </div>
            )}

            {/* Title & Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {getStatusBadge(trigger.status)}
                {getPriorityBadge(trigger.priority)}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
                  {trigger.action === 'notify' ? (
                    <>
                      <Bell className="w-3.5 h-3.5 text-blue-500" />
                      Thông báo
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      Thêm vào Ghi chú
                    </>
                  )}
                </span>
              </div>

              <h1 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                {trigger.title}
              </h1>
            </div>

            {/* Quick Action Button: Kích hoạt ngay */}
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-foreground text-xs">Kích hoạt trigger ngay lập tức</p>
                <p className="text-[11px] text-muted-foreground">
                  Thực hiện hành động ngay mà không cần chờ đến đúng giờ hẹn.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRun}
                disabled={isRunning}
                className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center gap-1.5 shrink-0 shadow-xs transition-colors disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? 'Đang chạy...' : 'Chạy ngay'}</span>
              </button>
            </div>

            {/* Scheduled Time Card */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <h3 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Thời gian hẹn kích hoạt
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[11px] text-muted-foreground block mb-0.5">Ngày hẹn</span>
                  <span className="font-bold text-foreground text-xs tabular-nums">
                    {displayDate || '—'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[11px] text-muted-foreground block mb-0.5">Giờ hẹn (24h)</span>
                  <span className="font-bold text-foreground text-xs font-mono">
                    {displayTime || '—'}
                  </span>
                </div>
              </div>

              {trigger.repeat && trigger.repeat !== 'none' && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <RotateCcw className="w-3.5 h-3.5 text-primary" />
                  <span>
                    Tần suất lặp lại:{' '}
                    <strong className="text-foreground">
                      {trigger.repeat === 'daily'
                        ? 'Hàng ngày'
                        : trigger.repeat === 'weekly'
                        ? 'Hàng tuần'
                        : 'Hàng tháng'}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Chi tiết nội dung */}
            {trigger.content && (
              <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                <h3 className="font-bold text-foreground text-xs text-muted-foreground">
                  Nội dung chi tiết / Thông điệp
                </h3>
                <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                  {trigger.content}
                </p>
              </div>
            )}

            {/* Kết quả chạy gần nhất (nếu có) */}
            {(trigger.result || trigger.firedAt) && (
              <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
                <h3 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Lịch sử thực thi
                </h3>
                {trigger.firedAt && (
                  <div className="text-[11px] text-muted-foreground">
                    Thời điểm chạy thực tế: <strong className="text-foreground font-mono">{formatDate(trigger.firedAt)} {trigger.firedAt.includes('T') ? trigger.firedAt.split('T')[1].slice(0, 8) : ''}</strong>
                  </div>
                )}
                {trigger.result && (
                  <div className="p-2.5 rounded-lg bg-background border border-border text-xs text-foreground">
                    {trigger.result}
                  </div>
                )}
              </div>
            )}

            {/* Thẻ (Tags) */}
            {trigger.tags && trigger.tags.length > 0 && (
              <div>
                <h3 className="font-bold text-foreground text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Thẻ phân loại
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {trigger.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ghi chú nội bộ */}
            {trigger.note && (
              <div className="p-3 rounded-lg border border-border bg-muted/20 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground block mb-0.5">Ghi chú quản trị:</span>
                <p>{trigger.note}</p>
              </div>
            )}

            {/* Metadata Footer */}
            <div className="pt-3 border-t border-border grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <div>
                <span>Người tạo:</span>{' '}
                <strong className="text-foreground">{trigger.createdBy || 'Admin'}</strong>
              </div>
              <div>
                <span>Ngày tạo:</span>{' '}
                <strong className="text-foreground tabular-nums">{formatDate(trigger.createdAt)}</strong>
              </div>
              {trigger.updatedAt && (
                <div className="col-span-2">
                  <span>Cập nhật gần nhất:</span>{' '}
                  <strong className="text-foreground tabular-nums">{formatDate(trigger.updatedAt)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-muted/30">
            <button
              type="button"
              onClick={() => onDelete(trigger.id)}
              className="h-8 px-3 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa trigger</span>
            </button>

            <button
              type="button"
              onClick={() => onEdit(trigger)}
              className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <SquarePen className="w-3.5 h-3.5" />
              <span>Chỉnh sửa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
