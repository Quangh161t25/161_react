import React from 'react';
import {
  CheckSquare,
  FolderKanban,
  Wallet,
  Cake,
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Plus,
  GraduationCap,
} from 'lucide-react';
import { CalendarEvent, CalendarEventSource } from '../../types/calendar';
import { getLunarFullInfoFromDateStr } from '../../utils/lunarCalendar';

interface CalendarDayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onAddEventForDate: (dateStr: string) => void;
}

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  currentDate,
  events,
  onSelectEvent,
  onAddEventForDate,
}) => {
  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

  const dayEvents = events.filter((e) => e.startDate === dateStr);
  const allDayEvents = dayEvents.filter((e) => e.allDay);
  const timedEvents = dayEvents.filter((e) => !e.allDay && e.time);

  const lunarInfo = getLunarFullInfoFromDateStr(dateStr);
  const daysOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayName = daysOfWeek[currentDate.getDay()];

  const HOURS = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

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

  return (
    <div className="bg-card flex-1 flex flex-col min-h-[500px] overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 border-b border-border bg-muted/30 gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-foreground">
              {dayName}, ngày {currentDate.getDate()}/{currentDate.getMonth() + 1}/{currentDate.getFullYear()}
            </h2>
            {lunarInfo?.isSpecialDay && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                🔴 {lunarInfo.specialDayLabel}
              </span>
            )}
          </div>

          {/* Âm lịch chi tiết */}
          {lunarInfo && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="font-semibold text-primary flex items-center gap-1">
                <span>🌙 Âm lịch:</span>
                <span>
                  Ngày {lunarInfo.lunar.day} tháng {lunarInfo.lunar.month}{lunarInfo.lunar.isLeap ? ' (Nhuận)' : ''} năm {lunarInfo.canChiYear.fullName}
                </span>
              </span>
              <span className="opacity-40">•</span>
              <span>Ngày {lunarInfo.canChiDay.fullName}</span>
              <span className="opacity-40">•</span>
              <span className="text-foreground/80 font-medium">Tiết: {lunarInfo.tietKhi}</span>
              <span className="opacity-40">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {dayEvents.length} sự kiện & hạn chót
              </span>
            </div>
          )}

          {/* Giờ Hoàng Đạo */}
          {lunarInfo && lunarInfo.gioHoangDao.length > 0 && (
            <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-1 pt-0.5">
              <span className="font-medium text-amber-600 dark:text-amber-400">✨ Giờ Hoàng Đạo:</span>
              <span>{lunarInfo.gioHoangDao.join(', ')}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onAddEventForDate(dateStr)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs shrink-0 self-start sm:self-auto transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm sự kiện ngày này</span>
        </button>
      </div>

      {/* All-Day Events Banner */}
      {allDayEvents.length > 0 && (
        <div className="p-3 bg-muted/20 border-b border-border space-y-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Sự kiện & Hạn chót cả ngày ({allDayEvents.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {allDayEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => onSelectEvent(evt)}
                className={`p-2.5 rounded-xl border border-l-4 flex items-start gap-2.5 cursor-pointer shadow-xs hover:scale-[1.01] transition-transform ${evt.badgeBg} ${evt.badgeColor} ${evt.badgeBorder}`}
              >
                {getSourceIcon(evt.source)}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold opacity-70 block">
                    {evt.categoryName}
                  </span>
                  <div className="font-bold text-xs truncate">{evt.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly Timeline */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
        {HOURS.map((hour) => {
          const hourPrefix = hour.slice(0, 2);
          const evtsAtHour = timedEvents.filter((e) => e.time && e.time.startsWith(hourPrefix));

          return (
            <div key={hour} className="flex items-start gap-3 group">
              <span className="w-14 text-xs font-mono font-bold text-muted-foreground pt-1 text-right select-none shrink-0">
                {hour}
              </span>

              <div className="flex-1 min-h-[44px] p-2 rounded-xl border border-dashed border-border/70 hover:border-primary/50 bg-background/50 hover:bg-muted/10 transition-colors flex flex-col gap-2">
                {evtsAtHour.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground/40 italic py-1">
                    Trống lịch
                  </span>
                ) : (
                  evtsAtHour.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => onSelectEvent(evt)}
                      className={`p-3 rounded-xl border border-l-4 shadow-xs cursor-pointer hover:shadow-md transition-all space-y-1.5 ${evt.badgeBg} ${evt.badgeColor} ${evt.badgeBorder}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {getSourceIcon(evt.source)}
                          <span className="font-bold text-xs text-foreground truncate">
                            {evt.title}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-background/80 border border-border shrink-0">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {evt.time}
                        </span>
                      </div>

                      {evt.location && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>{evt.location}</span>
                        </div>
                      )}

                      {evt.assigneeName && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <User className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>{evt.assigneeName} {evt.assigneeCode ? `(${evt.assigneeCode})` : ''}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
