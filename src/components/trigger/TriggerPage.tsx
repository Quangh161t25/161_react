import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, BookOpen, Clock, Edit3, Info, Save, Trash2, Zap } from 'lucide-react';
import { Trigger, TriggerAction } from '../../types/trigger';
import { TRIGGERS_CHANGED_EVENT, triggerService } from '../../services/triggerService';
import { notificationService } from '../../services/notificationService';
import { TimePickerInput } from '../common/TimePickerInput';
import { generateId } from '../../utils/idGenerator';
import { toLocalDateStr, toLocalTimeStr } from '../../utils/dateUtils';

interface TriggerPageProps {
  onBack: () => void;
}

const ACTION_OPTIONS: { id: TriggerAction; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'notify', label: 'Thông báo cho tôi', icon: Bell },
  { id: 'add_note', label: 'Thêm 1 dòng vào Ghi chú', icon: BookOpen },
];

const fiveMinutesFromNow = () => new Date(Date.now() + 5 * 60 * 1000);

const formatRunAt = (runAt: string) => {
  const [date, time] = runAt.split('T');
  return `${time} ${date.split('-').reverse().join('/')}`;
};

const inputClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all';

export const TriggerPage: React.FC<TriggerPageProps> = ({ onBack }) => {
  const [triggers, setTriggers] = useState<Trigger[]>(() => triggerService.getAll());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [action, setAction] = useState<TriggerAction>('notify');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(() => toLocalDateStr(fiveMinutesFromNow()));
  const [time, setTime] = useState(() => toLocalTimeStr(fiveMinutesFromNow()));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reload = () => setTriggers(triggerService.getAll());
    window.addEventListener(TRIGGERS_CHANGED_EVENT, reload);
    return () => window.removeEventListener(TRIGGERS_CHANGED_EVENT, reload);
  }, []);

  const pending = triggers
    .filter((t) => t.status === 'pending')
    .sort((a, b) => a.runAt.localeCompare(b.runAt));
  const history = triggers
    .filter((t) => t.status === 'done')
    .sort((a, b) => (b.firedAt || '').localeCompare(a.firedAt || ''));

  const resetForm = () => {
    setEditingId(null);
    setAction('notify');
    setTitle('');
    setContent('');
    setDate(toLocalDateStr(fiveMinutesFromNow()));
    setTime(toLocalTimeStr(fiveMinutesFromNow()));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập nội dung cần làm');
      return;
    }
    if (!date || !time) {
      setError('Vui lòng chọn ngày và giờ');
      return;
    }
    const runAt = `${date}T${time}`;
    if (runAt < `${toLocalDateStr()}T${toLocalTimeStr()}`) {
      setError('Thời gian đã qua, vui lòng chọn thời điểm khác');
      return;
    }

    const existing = triggers.find((t) => t.id === editingId);
    triggerService.upsert({
      id: existing?.id || generateId('trigger'),
      title: title.trim(),
      content: content.trim(),
      action,
      runAt,
      status: 'pending',
      createdAt: existing?.createdAt || new Date().toISOString(),
    });
    // Lúc này người dùng vừa bấm nút nên trình duyệt cho phép hỏi quyền thông báo
    if (action === 'notify' && notificationService.isSupported() && Notification.permission === 'default') {
      notificationService.requestPermission();
    }
    resetForm();
  };

  const handleEdit = (trigger: Trigger) => {
    const [editDate, editTime] = trigger.runAt.split('T');
    setEditingId(trigger.id);
    setAction(trigger.action);
    setTitle(trigger.title);
    setContent(trigger.content);
    setDate(editDate);
    setTime(editTime);
    setError(null);
  };

  const handleDelete = (trigger: Trigger) => {
    if (!window.confirm(`Bạn có chắc muốn xóa trigger "${trigger.title}"?`)) return;
    triggerService.remove(trigger.id);
    if (editingId === trigger.id) resetForm();
  };

  const renderRow = (trigger: Trigger) => {
    const option = ACTION_OPTIONS.find((o) => o.id === trigger.action);
    const Icon = option?.icon || Zap;
    const isPending = trigger.status === 'pending';
    return (
      <li key={trigger.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground break-words">{trigger.title}</p>
          {trigger.content && (
            <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">{trigger.content}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
            <Clock className="w-3 h-3 shrink-0" />
            <span>{formatRunAt(trigger.runAt)}</span>
            <span>· {option?.label}</span>
          </p>
          {trigger.firedAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Đã chạy lúc {new Date(trigger.firedAt).toLocaleString('vi-VN')}
              {trigger.result ? ` · ${trigger.result}` : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isPending && (
            <button
              type="button"
              onClick={() => handleEdit(trigger)}
              title="Sửa"
              aria-label={`Sửa ${trigger.title}`}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDelete(trigger)}
            title="Xóa"
            aria-label={`Xóa ${trigger.title}`}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </li>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-background">
      <div className="flex-1 min-h-0 flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="h-8 inline-flex items-center gap-1 px-2.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>
          <h1 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" /> Trigger
          </h1>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 text-xs text-muted-foreground">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Trigger lưu trên thiết bị này và chạy khi web đang mở. Nếu web đang đóng lúc đến giờ, trigger sẽ chạy bù
                ngay khi bạn mở lại.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="rounded-2xl border border-border p-4 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">
                {editingId ? 'Sửa trigger' : 'Tạo trigger mới'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ACTION_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = action === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setAction(option.id)}
                      className={`h-11 px-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors ${
                        isActive
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{option.label}</span>
                    </button>
                  );
                })}
              </div>

              <div>
                <label htmlFor="trigger-title" className="block text-xs font-semibold text-foreground mb-1">
                  {action === 'notify' ? 'Nội dung thông báo' : 'Tiêu đề ghi chú'} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="trigger-title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setError(null);
                  }}
                  placeholder={action === 'notify' ? 'Ví dụ: Gọi điện cho khách' : 'Ví dụ: Tổng kết cuối ngày'}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="trigger-content" className="block text-xs font-semibold text-muted-foreground mb-1">
                  {action === 'notify' ? 'Chi tiết' : 'Nội dung ghi chú'}
                </label>
                <textarea
                  id="trigger-content"
                  rows={2}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="trigger-date" className="block text-xs font-semibold text-foreground mb-1">
                    Ngày <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="trigger-date"
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setError(null);
                    }}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Giờ (24h) <span className="text-rose-500">*</span>
                  </label>
                  <TimePickerInput
                    value={time}
                    onChange={(val) => {
                      setTime(val);
                      setError(null);
                    }}
                    force24h={true}
                  />
                </div>
              </div>

              {error && <p className="text-xs text-rose-500">{error}</p>}

              <div className="flex items-center justify-end gap-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="h-8 px-3 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors"
                  >
                    Hủy sửa
                  </button>
                )}
                <button
                  type="submit"
                  className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {editingId ? 'Lưu thay đổi' : 'Tạo trigger'}
                </button>
              </div>
            </form>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">Đang chờ ({pending.length})</h2>
              {pending.length === 0 ? (
                <p className="text-xs text-muted-foreground">Chưa có trigger nào đang chờ.</p>
              ) : (
                <ul className="space-y-2">{pending.map(renderRow)}</ul>
              )}
            </section>

            {history.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-foreground">Đã chạy ({history.length})</h2>
                <ul className="space-y-2">{history.map(renderRow)}</ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
