import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Bell,
  FileText,
  Clock,
  Calendar,
  Pin,
  AlertTriangle,
} from 'lucide-react';
import {
  Trigger,
  TriggerAction,
  TriggerStatus,
  TriggerPriority,
  TriggerRepeat,
} from '../../types/trigger';
import { generateId } from '../../utils/idGenerator';
import {
  toLocalDateStr,
  formatDate,
  toInputDateValue,
} from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';

interface TriggerFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trigger: Trigger) => void;
  initialTrigger?: Trigger | null;
  existingCount?: number;
}

const ACTION_OPTIONS: Array<{
  id: TriggerAction;
  label: string;
  desc: string;
  icon: typeof Bell;
  color: string;
}> = [
  {
    id: 'notify',
    label: 'Thông báo cho tôi',
    desc: 'Bắn thông báo trình duyệt và hiển thị popup trên màn hình',
    icon: Bell,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  },
  {
    id: 'add_note',
    label: 'Thêm 1 dòng vào Ghi chú',
    desc: 'Tự động tạo 1 ghi chú mới trên hệ thống và đồng bộ Google Sheet',
    icon: FileText,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  },
];

const PRIORITY_OPTIONS: Array<{ id: TriggerPriority; label: string; color: string }> = [
  { id: 'low', label: 'Thấp', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  { id: 'medium', label: 'Trung bình', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { id: 'high', label: 'Cao', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { id: 'urgent', label: 'Khẩn cấp', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
];

const REPEAT_OPTIONS: Array<{ id: TriggerRepeat; label: string }> = [
  { id: 'none', label: 'Không lặp lại' },
  { id: 'daily', label: 'Hàng ngày' },
  { id: 'weekly', label: 'Hàng tuần' },
  { id: 'monthly', label: 'Hàng tháng' },
];

export const TriggerFormDrawer: React.FC<TriggerFormDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTrigger,
  existingCount = 0,
}) => {
  const { currentUser } = useAuth();

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [action, setAction] = useState<TriggerAction>('notify');
  const [runDate, setRunDate] = useState(() => toLocalDateStr());
  const [runTime, setRunTime] = useState(() => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [priority, setPriority] = useState<TriggerPriority>('medium');
  const [repeat, setRepeat] = useState<TriggerRepeat>('none');
  const [isPinned, setIsPinned] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<TriggerStatus>('pending');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialTrigger) {
      setTitle(initialTrigger.title || '');
      setContent(initialTrigger.content || '');
      setAction(initialTrigger.action || 'notify');

      if (initialTrigger.runAt && initialTrigger.runAt.includes('T')) {
        const [d, t] = initialTrigger.runAt.split('T');
        setRunDate(toInputDateValue(d) || toLocalDateStr());
        setRunTime(t ? t.slice(0, 5) : '09:00');
      } else {
        setRunDate(toInputDateValue(initialTrigger.runDate) || toLocalDateStr());
        setRunTime(initialTrigger.runTime || '09:00');
      }

      setPriority(initialTrigger.priority || 'medium');
      setRepeat(initialTrigger.repeat || 'none');
      setIsPinned(!!initialTrigger.isPinned);
      setTags(initialTrigger.tags || []);
      setNote(initialTrigger.note || '');
      setStatus(initialTrigger.status || 'pending');
    } else {
      // Default new trigger 5 mins from now
      const d = new Date(Date.now() + 5 * 60 * 1000);
      setTitle('');
      setContent('');
      setAction('notify');
      setRunDate(toLocalDateStr(d));
      setRunTime(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      );
      setPriority('medium');
      setRepeat('none');
      setIsPinned(false);
      setTags([]);
      setTagInput('');
      setNote('');
      setStatus('pending');
    }
    setErrorMsg('');
  }, [initialTrigger, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#+/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề hoặc nội dung thông báo');
      return;
    }
    if (!runDate || !runTime) {
      setErrorMsg('Vui lòng chọn ngày và giờ hẹn chạy');
      return;
    }

    const runAt = `${runDate}T${runTime}`;
    const code = initialTrigger?.code || `TG-${String(existingCount + 1).padStart(3, '0')}`;
    const id = initialTrigger?.id || generateId('trig', code);
    const nowIso = new Date().toISOString();

    const payload: Trigger = {
      id,
      code,
      title: title.trim(),
      content: content.trim(),
      action,
      runAt,
      runDate: formatDate(runDate),
      runTime,
      status,
      priority,
      repeat,
      tags,
      isPinned,
      note: note.trim() || undefined,
      createdBy: initialTrigger?.createdBy || currentUser?.name || currentUser?.username || 'Admin',
      createdAt: initialTrigger?.createdAt || nowIso,
      updatedAt: nowIso,
      result: initialTrigger?.result,
      firedAt: initialTrigger?.firedAt,
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {initialTrigger ? 'Chỉnh sửa trigger' : 'Tạo trigger / Hẹn giờ mới'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {initialTrigger
                    ? `Mã: ${initialTrigger.code}`
                    : 'Thiết lập thời gian và hành động tự động kích hoạt'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form id="trigger-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Hành động */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Loại hành động <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ACTION_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = action === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setAction(opt.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? `${opt.color} shadow-xs font-medium`
                          : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-foreground">{opt.label}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Tiêu đề */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Tiêu đề / Tên trigger <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Nhắc gọi điện cho đối tác A lúc 14:00"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>

            {/* 3. Chi tiết / Nội dung */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Nội dung chi tiết / Ghi chú kích hoạt
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nội dung sẽ được đưa vào thông báo hoặc tạo thành bài ghi chú..."
                rows={3}
                className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden resize-none leading-relaxed"
              />
            </div>

            {/* 4. Ngày & Giờ hẹn chạy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-muted/20">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Ngày hẹn <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={runDate}
                  onChange={(e) => setRunDate(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Giờ hẹn (24h) <span className="text-destructive">*</span>
                </label>
                <input
                  type="time"
                  value={runTime}
                  onChange={(e) => setRunTime(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-hidden"
                />
              </div>
            </div>

            {/* 5. Mức ưu tiên & Lặp lại */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Mức độ ưu tiên
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TriggerPriority)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-hidden"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Tần suất lặp lại
                </label>
                <select
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value as TriggerRepeat)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-hidden"
                >
                  {REPEAT_OPTIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 6. Thẻ (Tags) */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Thẻ phân loại (Tags)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Gõ tag và nhấn Enter..."
                  className="flex-1 h-8 px-3 rounded-lg border border-border bg-background text-foreground text-xs outline-hidden focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="h-8 px-3 rounded-lg bg-muted text-foreground hover:bg-muted/80 font-medium text-xs transition-colors"
                >
                  Thêm
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 7. Trạng thái & Ghim */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/10">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                <span className="font-semibold text-foreground">Ghim lên đầu danh sách</span>
              </label>

              {initialTrigger && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TriggerStatus)}
                    className="h-7 px-2 rounded-md border border-border bg-background text-foreground text-xs"
                  >
                    <option value="pending">Đang chờ</option>
                    <option value="done">Đã chạy</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
              )}
            </div>

            {/* 8. Ghi chú thêm */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Ghi chú nội bộ
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú thêm cho người quản trị..."
                className="w-full h-8 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary outline-hidden"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2 bg-muted/30">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-semibold transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="trigger-form"
              className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{initialTrigger ? 'Cập nhật' : 'Lưu trigger'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
