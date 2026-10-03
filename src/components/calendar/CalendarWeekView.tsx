import React from 'react';
import {
  CheckSquare,
  FolderKanban,
  Wallet,
  Cake,
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  GraduationCap,
} from 'lucide-react';
import { CalendarEvent, CalendarEventSource } from '../../types/calendar';
import { getLunarFullInfoFromDateStr } from '../../utils/lunarCalendar';

interface CalendarWeekViewProps {
  currentDate: Date; // A date in the week
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onAddEventForDate: (dateStr: string) => void;
  onSelectDate?: (date: Date) => void;
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  currentDate,
  events,
  onSelectEvent,
  onAddEventForDate,
  onSelectDate,
}) => {
  // Find Monday of the current week
  const curr = new Date(currentDate);
  const dayOfWeek = curr.getDay(); // 0 = Sun, 1 = Mon ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(curr);
  monday.setDate(curr.getDate() + diffToMonday);

  const weekDays: {
    date: Date;
    dateStr: string;
    dayNumber: number;
    month: number;
    name: string;
  }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    weekDays.push({
      date: d,
      dateStr,
      dayNumber: d.getDate(),
      month: d.getMonth() + 1,
      name: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'][i],
    });
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const HOURS = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const getSourceIcon = (source: CalendarEventSource) => {
    switch (source) {
      case 'work_task':
        return <CheckSquare className="w-3 h-3 shrink-0" />;
      case 'work_project':
        return <FolderKanban className="w-3 h-3 shrink-0" />;
      case 'finance_proposal':
      case 'finance_cash':
        return <Wallet className="w-3 h-3 shrink-0" />;
      case 'hr_birthday':
        return <Cake className="w-3 h-3 shrink-0" />;
      case 'note':
        return <BookOpen className="w-3 h-3 shrink-0" />;
      case 'learning':
        return <GraduationCap className="w-3 h-3 shrink-0" />;
      default:
        return <CalendarIcon className="w-3 h-3 shrink-0" />;
    }
  };

  return (
    <div className="bg-card flex-1 flex flex-col min-h-[500px] overflow-hidden">
      {/* Week Header */}
      <div className="grid grid-cols-8 border-b border-border bg-muted/60 text-center text-xs font-bold py-2">
        <div className="text-muted-foreground w-16 text-right pr-2 self-center">Giờ</div>
        {weekDays.map((wd, idx) => {
          const isToday = wd.dateStr === todayStr;
          const lunarInfo = getLunarFullInfoFromDateStr(wd.dateStr);

          return (
            <div
              key={wd.dateStr}
              onClick={() => onSelectDate?.(wd.date)}
              className="flex flex-col items-center cursor-pointer hover:bg-background/80 rounded-lg p-1 transition-all group"
              title={`Nhấp để mở xem chi tiết ngày ${wd.dayNumber}/${wd.month}${
                lunarInfo ? ` (ÂL: ${lunarInfo.displayText} - ${lunarInfo.canChiDay.fullName})` : ''
              }`}
            >
              <span className={`text-[11px] ${idx >= 5 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {wd.name}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-primary text-primary-foreground shadow-xs' : 'text-foreground group-hover:text-primary'
                  }`}
                >
                  {wd.dayNumber}
                </span>
                {lunarInfo && (
                  <span
                    className={`text-[9px] font-medium leading-none ${
                      lunarInfo.isSpecialDay
                        ? 'text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-0.5 rounded'
                        : 'text-muted-foreground/75'
                    }`}
                  >
                    {lunarInfo.displayText}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-Day Events Section */}
      <div className="grid grid-cols-8 border-b border-border bg-muted/20 min-h-[48px] divide-x divide-border/50">
        <div className="text-[11px] font-semibold text-muted-foreground p-2 flex items-center justify-end">
          Cả ngày
        </div>
        {weekDays.map((wd) => {
          const allDayEvts = events.filter((e) => e.startDate === wd.dateStr && e.allDay);
          return (
            <div
              key={wd.dateStr}
              onClick={() => onAddEventForDate(wd.dateStr)}
              className="p-1 flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar"
            >
              {allDayEvts.map((evt) => (
                <div
                  key={evt.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent(evt);
                  }}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-l-[3px] shadow-xs truncate cursor-pointer transition-all hover:scale-[1.02] ${evt.badgeBg} ${evt.badgeColor} ${evt.badgeBorder}`}
                  title={`${evt.title}${evt.amount !== undefined ? ` [${evt.categoryName.includes('Chi') ? '-' : '+'}${evt.amount.toLocaleString('vi-VN')} đ]` : ''}${evt.description ? `\n${evt.description}` : ''}`}
                >
                  {getSourceIcon(evt.source)}
                  <span className="truncate flex-1">{evt.title}</span>
                  {evt.amount !== undefined && evt.amount !== null && (
                    <span className="font-mono text-[9px] font-bold shrink-0 opacity-90">
                      {evt.categoryName.includes('Chi') ? '-' : '+'}
                      {evt.amount >= 1000000 ? `${(evt.amount / 1000000).toFixed(1)}tr` : `${Math.round(evt.amount / 1000)}k`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Hourly Timeline */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="divide-y divide-border/50">
          {HOURS.map((hour) => {
            const hourPrefix = hour.slice(0, 2);
            return (
              <div key={hour} className="grid grid-cols-8 min-h-[50px] divide-x divide-border/40 hover:bg-muted/10 transition-colors">
                {/* Time Label */}
                <div className="text-[11px] font-mono text-muted-foreground text-right pr-2 pt-1 select-none">
                  {hour}
                </div>

                {/* Day Columns */}
                {weekDays.map((wd) => {
                  const timedEvts = events.filter(
                    (e) => e.startDate === wd.dateStr && e.time && e.time.startsWith(hourPrefix)
                  );

                  return (
                    <div
                      key={wd.dateStr}
                      onClick={() => onAddEventForDate(wd.dateStr)}
                      className="p-1 relative flex flex-col gap-1 cursor-pointer"
                    >
                      {timedEvts.map((evt) => (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(evt);
                          }}
                          className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-semibold border border-l-[3px] shadow-xs transition-all hover:scale-[1.02] ${evt.badgeBg} ${evt.badgeColor} ${evt.badgeBorder}`}
                          title={`${evt.time} - ${evt.title}${evt.amount !== undefined ? ` [${evt.categoryName.includes('Chi') ? '-' : '+'}${evt.amount.toLocaleString('vi-VN')} đ]` : ''}${evt.description ? `\n${evt.description}` : ''}`}
                        >
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span className="font-mono text-[9px]">{evt.time}</span>
                          <span className="truncate flex-1 font-bold">{evt.title}</span>
                          {evt.amount !== undefined && evt.amount !== null && (
                            <span className="font-mono text-[9px] font-bold shrink-0">
                              {evt.categoryName.includes('Chi') ? '-' : '+'}
                              {evt.amount >= 1000000 ? `${(evt.amount / 1000000).toFixed(1)}tr` : `${Math.round(evt.amount / 1000)}k`}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
