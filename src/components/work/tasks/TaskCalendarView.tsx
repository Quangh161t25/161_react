import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
} from 'lucide-react';
import { Task } from '../../../types/task';

interface TaskCalendarViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onAddNewTask?: (defaultDate?: string) => void;
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onSelectTask,
  onAddNewTask,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Build days grid
  const calendarCells: Array<{
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }> = [];

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Prev month padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevM = month === 0 ? 12 : month;
    const prevY = month === 0 ? year - 1 : year;
    const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Next month padding to fill complete weeks (multiples of 7)
  const remaining = 7 - (calendarCells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 1 : month + 2;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      calendarCells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs space-y-4 p-4 md:p-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {monthNames[month]} năm {year}
            </h3>
            <p className="text-xs text-muted-foreground">Lịch hạn chót và phân bổ công việc</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-semibold transition-colors"
          >
            Hôm nay
          </button>
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-muted-foreground border-b border-border/60 pb-2">
        <span>Chủ Nhật</span>
        <span>Thứ 2</span>
        <span>Thứ 3</span>
        <span>Thứ 4</span>
        <span>Thứ 5</span>
        <span>Thứ 6</span>
        <span>Thứ 7</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 auto-rows-fr">
        {calendarCells.map((cell) => {
          const dayTasks = tasks.filter((t) => t.dueDate === cell.dateStr);

          return (
            <div
              key={cell.dateStr}
              className={`min-h-[110px] p-2 rounded-xl border transition-colors flex flex-col justify-between group ${
                cell.isToday
                  ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20'
                  : cell.isCurrentMonth
                  ? 'bg-card border-border/70 hover:border-border'
                  : 'bg-muted/20 border-transparent text-muted-foreground/40'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold tabular-nums w-6 h-6 flex items-center justify-center rounded-full ${
                    cell.isToday
                      ? 'bg-primary text-primary-foreground font-bold'
                      : cell.isCurrentMonth
                      ? 'text-foreground'
                      : 'text-muted-foreground/50'
                  }`}
                >
                  {cell.dayNum}
                </span>

                {onAddNewTask && cell.isCurrentMonth && (
                  <button
                    type="button"
                    onClick={() => onAddNewTask(cell.dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-opacity"
                    title={`Thêm task ngày ${cell.dateStr}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Tasks List on this Day */}
              <div className="space-y-1 my-1 flex-1 overflow-y-auto max-h-[85px] custom-scrollbar">
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    title={`${t.code} - ${t.title} (${t.assigneeName || 'Chưa giao'})`}
                    className={`text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer transition-all hover:scale-[1.02] ${
                      t.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 line-through opacity-80'
                        : t.priority === 'urgent'
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 font-bold'
                        : 'bg-primary/10 text-primary border-primary/20 font-medium'
                    }`}
                  >
                    <span className="font-mono mr-1">{t.code}:</span>
                    <span>{t.title}</span>
                  </div>
                ))}
              </div>

              {/* Bottom Task count dot indicator */}
              {dayTasks.length > 0 && (
                <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>{dayTasks.length} việc</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
