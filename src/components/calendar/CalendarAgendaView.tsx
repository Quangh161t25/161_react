import React from 'react';
import {
  CheckSquare,
  FolderKanban,
  Wallet,
  Cake,
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  GraduationCap,
} from 'lucide-react';
import { CalendarEvent, CalendarEventSource } from '../../types/calendar';

interface CalendarAgendaViewProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onNavigateToModule?: (link: string) => void;
}

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({
  events,
  onSelectEvent,
  onNavigateToModule,
}) => {
  // Luôn sắp xếp theo ngày lớn tới nhỏ (mới nhất đến cũ nhất)
  const sorted = [...events].sort((a, b) => {
    const cmp = a.startDate.localeCompare(b.startDate);
    if (cmp !== 0) {
      return -cmp;
    }
    if (a.time && b.time) {
      return b.time.localeCompare(a.time);
    }
    if (a.time) return -1;
    if (b.time) return 1;
    return 0;
  });

  // Group by Date
  const grouped: Record<string, CalendarEvent[]> = {};
  sorted.forEach((e) => {
    const d = e.startDate.slice(0, 10);
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(e);
  });

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const getSourceIcon = (source: CalendarEventSource) => {
    switch (source) {
      case 'work_task':
        return <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'work_project':
        return <FolderKanban className="w-4 h-4 text-cyan-600 shrink-0" />;
      case 'finance_proposal':
        return <Wallet className="w-4 h-4 text-orange-600 shrink-0" />;
      case 'finance_cash':
        return <Wallet className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'hr_birthday':
        return <Cake className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'note':
        return <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />;
      case 'learning':
        return <GraduationCap className="w-4 h-4 text-teal-600 shrink-0" />;
      default:
        return <CalendarIcon className="w-4 h-4 text-sky-600 shrink-0" />;
    }
  };

  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="bg-card flex-1 flex flex-col min-h-[500px] overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Lịch biểu & Danh sách Lịch trình
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tổng hợp tất cả các hạn chót, sự kiện, sinh nhật và phiếu thu chi theo thứ tự thời gian
          </p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          {events.length} mục
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-6">
        {dateKeys.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-xs">
            <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            Không có lịch trình nào phù hợp.
          </div>
        ) : (
          dateKeys.map((dateStr) => {
            const dateEvents = grouped[dateStr];
            const isToday = dateStr === todayStr;

            return (
              <div key={dateStr} className="space-y-3">
                {/* Date Header */}
                <div className="flex items-center gap-3">
                  <div
                    className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                      isToday
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-muted/70 text-foreground border-border'
                    }`}
                  >
                    {isToday ? `Hôm nay (${dateStr})` : dateStr}
                  </div>
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    {dateEvents.length} sự kiện
                  </span>
                </div>

                {/* Event Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dateEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => onSelectEvent(evt)}
                      className="group bg-background rounded-xl p-3.5 border border-border hover:border-primary/50 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border border-l-[3px] shadow-xs ${evt.badgeBg} ${evt.badgeColor} ${evt.badgeBorder}`}
                          >
                            {getSourceIcon(evt.source)}
                            <span>{evt.categoryName}</span>
                          </span>

                          <div className="flex items-center gap-2">
                            {evt.amount !== undefined && evt.amount !== null && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold font-mono shadow-2xs whitespace-nowrap ${
                                  evt.categoryName.includes('Chi') || (evt.source === 'finance_cash' && !evt.categoryName.includes('Thu'))
                                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {evt.categoryName.includes('Chi') ? '-' : '+'}
                                {evt.amount.toLocaleString('vi-VN')} ₫
                              </span>
                            )}

                            {evt.time && (
                              <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                {evt.time}
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {evt.title}
                        </h3>

                        {evt.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {evt.description}
                          </p>
                        )}
                      </div>

                      {/* Footer Info */}
                      <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                        {evt.assigneeName ? (
                          <span className="text-muted-foreground truncate max-w-[200px]">
                            {evt.assigneeName} {evt.assigneeCode ? `(${evt.assigneeCode})` : ''}
                          </span>
                        ) : (
                          <span />
                        )}

                        {evt.sourceLink && onNavigateToModule && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToModule(evt.sourceLink!);
                            }}
                            className="text-primary hover:underline font-semibold inline-flex items-center gap-1 text-[10px]"
                          >
                            <span>Mở module</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
