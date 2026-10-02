import React from 'react';
import {
  CheckSquare,
  FolderKanban,
  Wallet,
  Cake,
  BookOpen,
  Calendar as CalendarIcon,
  Plus,
  GraduationCap,
} from 'lucide-react';
import { CalendarEvent, CalendarEventSource } from '../../types/calendar';
import { getLunarFullInfoFromDateStr } from '../../utils/lunarCalendar';

interface CalendarMonthViewProps {
  year: number;
  month: number; // 0-indexed (0 = Jan, 8 = Sep)
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onAddEventForDate: (dateStr: string) => void;
  onSelectDate?: (date: Date) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  year,
  month,
  events,
  onSelectEvent,
  onAddEventForDate,
  onSelectDate,
}) => {
  // Month calculations
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Day of week for 1st day (0 = Sun, 1 = Mon ... 6 = Sat)
  // Convert to Mon = 0, Sun = 6
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;

  const totalDays = lastDayOfMonth.getDate();

  // Prev month filler days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevDays = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    prevDays.push({
      day: prevMonthLastDay - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  // Current month days
  const currentDays = [];
  for (let i = 1; i <= totalDays; i++) {
    currentDays.push({
      day: i,
      month,
      year,
      isCurrentMonth: true,
    });
  }

  // Next month filler days to complete grid (multiples of 7)
  const remaining = (prevDays.length + currentDays.length) % 7;
  const nextDaysCount = remaining === 0 ? 0 : 7 - remaining;
  const nextDays = [];
  for (let i = 1; i <= nextDaysCount; i++) {
    nextDays.push({
      day: i,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  const allGridDays = [...prevDays, ...currentDays, ...nextDays];

  // Today string
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Map events to date string
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  events.forEach((evt) => {
    const d = evt.startDate.slice(0, 10);
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push(evt);
  });

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

  const WEEK_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  return (
    <div className="bg-card flex-1 flex flex-col min-h-[500px] overflow-hidden">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/60 text-center text-xs font-bold text-muted-foreground py-2.5">
        {WEEK_DAYS.map((wd, idx) => (
          <div key={wd} className={idx >= 5 ? 'text-amber-500' : ''}>
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 divide-x divide-y divide-border/60">
        {allGridDays.map((cell, index) => {
          // Format date string YYYY-MM-DD
          const realMonth = ((cell.month % 12) + 12) % 12 + 1;
          const dateStr = `${cell.year}-${String(realMonth).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          const dayEvents = eventsByDate[dateStr] || [];
          const maxVisible = 3;
          const visibleEvents = dayEvents.slice(0, maxVisible);
          const hiddenCount = dayEvents.length - maxVisible;

          // Lunar date calculation (Âm lịch Việt Nam)
          const lunarInfo = getLunarFullInfoFromDateStr(dateStr);

          return (
            <div
              key={index}
              onClick={() => onSelectDate?.(new Date(cell.year, realMonth - 1, cell.day))}
              className={`min-h-[105px] sm:min-h-[120px] p-1.5 sm:p-2 flex flex-col justify-between transition-all relative group cursor-pointer ${
                !cell.isCurrentMonth
                  ? 'bg-muted/10 opacity-40 hover:opacity-85'
                  : isToday
                  ? 'bg-primary/5 hover:bg-primary/10 ring-1 ring-primary/20'
                  : 'hover:bg-muted/30'
              }`}
              title={`Nhấp để mở xem chi tiết ngày ${cell.day}/${realMonth}/${cell.year}${
                lunarInfo
                  ? ` (Âm lịch: ${lunarInfo.displayText} - ${lunarInfo.canChiDay.fullName} - Tiết ${lunarInfo.tietKhi})`
                  : ''
              }`}
            >
              {/* Day Number Row (Solar Day + Lunar Day) */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {/* Dương lịch */}
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0 ${
                      isToday
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : cell.isCurrentMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {cell.day}
                  </span>

                  {/* Âm lịch */}
                  {lunarInfo && (
                    <span
                      title={`Âm lịch: Ngày ${lunarInfo.lunar.day}/${lunarInfo.lunar.month}${lunarInfo.lunar.isLeap ? ' (Nhuận)' : ''} (${lunarInfo.canChiDay.fullName}) - Tiết: ${lunarInfo.tietKhi}`}
                      className={`text-[10px] leading-none select-none truncate ${
                        lunarInfo.isSpecialDay
                          ? 'text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-1 py-0.5 rounded'
                          : cell.isCurrentMonth
                          ? 'text-muted-foreground/80 font-medium'
                          : 'text-muted-foreground/40'
                      }`}
                    >
                      {lunarInfo.specialDayLabel || lunarInfo.displayText}
                    </span>
                  )}
                </div>

                {/* Quick Add Button on hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddEventForDate(dateStr);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background border border-border/70 transition-all shadow-xs"
                  title="Thêm công việc, ghi chú, tài chính hoặc sự kiện cho ngày này"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Event Chips List */}
              <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                {visibleEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(evt);
                    }}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold border border-l-[3px] shadow-xs cursor-pointer truncate transition-all hover:scale-[1.02] ${evt.badgeBg} ${evt.badgeColor} ${evt.badgeBorder}`}
                    title={`${evt.title}${evt.time ? ` (${evt.time})` : ''} - ${evt.categoryName}`}
                  >
                    {getSourceIcon(evt.source)}
                    <span className="truncate flex-1">{evt.title}</span>
                    {evt.time && (
                      <span className="text-[9px] opacity-70 font-mono hidden sm:inline">
                        {evt.time}
                      </span>
                    )}
                  </div>
                ))}

                {/* More events popover indicator */}
                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDate?.(new Date(cell.year, realMonth - 1, cell.day));
                    }}
                    className="text-[10px] font-bold text-primary hover:underline text-left px-1 mt-0.5"
                    title="Mở xem toàn bộ sự kiện trong ngày"
                  >
                    +{hiddenCount} sự kiện khác
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
