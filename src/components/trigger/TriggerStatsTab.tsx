import React from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  FileText,
  AlertTriangle,
  Play,
  Sparkles,
} from 'lucide-react';
import { Trigger } from '../../types/trigger';
import { formatDate } from '../../utils/dateUtils';

interface TriggerStatsTabProps {
  triggers: Trigger[];
  onSelectTrigger: (trigger: Trigger) => void;
  onRunNow: (id: string) => Promise<void>;
}

export const TriggerStatsTab: React.FC<TriggerStatsTabProps> = ({
  triggers,
  onSelectTrigger,
  onRunNow,
}) => {
  const total = triggers.length;
  const pending = triggers.filter((t) => t.status === 'pending');
  const done = triggers.filter((t) => t.status === 'done');
  const cancelled = triggers.filter((t) => t.status === 'cancelled');

  const countByAction = {
    notify: triggers.filter((t) => t.action === 'notify').length,
    add_note: triggers.filter((t) => t.action === 'add_note').length,
  };

  const countByPriority = {
    urgent: triggers.filter((t) => t.priority === 'urgent').length,
    high: triggers.filter((t) => t.priority === 'high').length,
    medium: triggers.filter((t) => !t.priority || t.priority === 'medium').length,
    low: triggers.filter((t) => t.priority === 'low').length,
  };

  const completionRate = total > 0 ? Math.round((done.length / total) * 100) : 0;

  // Triggers sắp chạy (trong 24 giờ tới)
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const upcoming = pending
    .filter((t) => t.runAt && t.runAt <= next24h)
    .sort((a, b) => (a.runAt || '').localeCompare(b.runAt || ''));

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-xs">
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Tổng số trigger</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{total}</p>
          <span className="text-[11px] text-muted-foreground">Tất cả tác vụ hẹn giờ</span>
        </div>

        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <span>Đang chờ chạy</span>
            <Clock className="w-4 h-4 animate-spin text-blue-500" style={{ animationDuration: '6s' }} />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
            {pending.length}
          </p>
          <span className="text-[11px] text-muted-foreground">Đang đếm ngược đến giờ</span>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span>Đã kích hoạt</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {done.length}
          </p>
          <span className="text-[11px] text-muted-foreground">Tỷ lệ: {completionRate}%</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Đã hủy / Bỏ qua</span>
            <XCircle className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-muted-foreground tabular-nums">{cancelled.length}</p>
          <span className="text-[11px] text-muted-foreground">Không còn kích hoạt</span>
        </div>
      </div>

      {/* 2. Upcoming Triggers in 24 Hours */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-card shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-foreground">
              Sắp kích hoạt trong 24 giờ tới ({upcoming.length})
            </h3>
          </div>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            Không có trigger nào cần chạy trong 24 giờ tới.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {upcoming.map((item) => {
              const [d, t] = (item.runAt || '').split('T');
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectTrigger(item)}
                  className="p-3 rounded-lg border border-border hover:border-primary/50 bg-background transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
                      <span className="font-mono font-bold text-primary">{item.code}</span>
                      <span className="text-amber-600 font-semibold tabular-nums">
                        {t || ''} {formatDate(d)}
                      </span>
                    </div>
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {item.title}
                    </h4>
                    {item.content && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {item.content}
                      </p>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      {item.action === 'notify' ? (
                        <>
                          <Bell className="w-3 h-3 text-blue-500" />
                          Thông báo
                        </>
                      ) : (
                        <>
                          <FileText className="w-3 h-3 text-emerald-500" />
                          Ghi chú
                        </>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRunNow(item.id);
                      }}
                      className="px-2 py-0.5 rounded bg-primary/10 hover:bg-primary text-primary hover:text-white font-medium text-[11px] flex items-center gap-1 transition-colors"
                      title="Chạy ngay"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Chạy ngay</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Distribution Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Theo loại hành động */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
          <h3 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Phân loại theo hành động
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Bell className="w-3.5 h-3.5 text-blue-500" />
                Thông báo cho tôi
              </span>
              <span className="font-bold tabular-nums">{countByAction.notify} trigger</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{
                  width: `${total > 0 ? (countByAction.notify / total) * 100 : 0}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                Tự thêm vào Ghi chú
              </span>
              <span className="font-bold tabular-nums">{countByAction.add_note} trigger</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{
                  width: `${total > 0 ? (countByAction.add_note / total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Theo mức độ ưu tiên */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
          <h3 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Phân bổ mức độ ưu tiên
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5">
              <span className="text-[11px] text-rose-600 font-medium block">Khẩn cấp</span>
              <span className="text-base font-bold text-rose-600 tabular-nums">
                {countByPriority.urgent}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
              <span className="text-[11px] text-amber-600 font-medium block">Cao</span>
              <span className="text-base font-bold text-amber-600 tabular-nums">
                {countByPriority.high}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5">
              <span className="text-[11px] text-blue-600 font-medium block">Trung bình</span>
              <span className="text-base font-bold text-blue-600 tabular-nums">
                {countByPriority.medium}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-500/20 bg-slate-500/5">
              <span className="text-[11px] text-slate-600 font-medium block">Thấp</span>
              <span className="text-base font-bold text-slate-600 tabular-nums">
                {countByPriority.low}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
