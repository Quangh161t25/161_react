import React, { useState, useMemo } from 'react';
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
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Filter,
  Moon,
} from 'lucide-react';
import { CalendarEvent, CalendarEventSource } from '../../types/calendar';
import { normalizeDateToISO } from '../../services/calendarService';
import { getLunarFullInfoFromDateStr } from '../../utils/lunarCalendar';

interface CalendarAgendaViewProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onNavigateToModule?: (link: string) => void;
  currentDate?: Date;
}

type AgendaScope = 'all' | 'month' | 'upcoming' | 'past';
type SortOrder = 'desc' | 'asc';

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({
  events,
  onSelectEvent,
  onNavigateToModule,
  currentDate = new Date(),
}) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [scope, setScope] = useState<AgendaScope>('all');

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  // Chuẩn hóa và làm sạch tất cả events với ISO YYYY-MM-DD
  const normalizedEvents = useMemo(() => {
    return events
      .map((e) => {
        const iso = normalizeDateToISO(e.startDate);
        return {
          ...e,
          _isoDate: iso || '9999-12-31',
        };
      })
      .filter((e) => Boolean(e._isoDate && e._isoDate !== '9999-12-31'));
  }, [events]);

  // Lọc theo phạm vi (Scope)
  const filteredEvents = useMemo(() => {
    return normalizedEvents.filter((e) => {
      if (scope === 'month') {
        return e._isoDate.startsWith(currentMonthPrefix);
      }
      if (scope === 'upcoming') {
        return e._isoDate >= todayStr;
      }
      if (scope === 'past') {
        return e._isoDate < todayStr;
      }
      return true;
    });
  }, [normalizedEvents, scope, currentMonthPrefix, todayStr]);

  // Sắp xếp theo ngày chuẩn xác (desc: mới nhất trước, asc: cũ nhất trước)
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const cmp = a._isoDate.localeCompare(b._isoDate);
      if (cmp !== 0) {
        return sortOrder === 'desc' ? -cmp : cmp;
      }
      if (a.time && b.time) {
        return sortOrder === 'desc' ? b.time.localeCompare(a.time) : a.time.localeCompare(b.time);
      }
      if (a.time) return -1;
      if (b.time) return 1;
      return a.title.localeCompare(b.title);
    });
  }, [filteredEvents, sortOrder]);

  // Nhóm theo ngày ISO
  const grouped = useMemo(() => {
    const map: Record<string, typeof sortedEvents> = {};
    sortedEvents.forEach((e) => {
      const d = e._isoDate;
      if (!map[d]) map[d] = [];
      map[d].push(e);
    });
    return map;
  }, [sortedEvents]);

  const dateKeys = useMemo(() => {
    const keys = Object.keys(grouped);
    return keys.sort((a, b) => (sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b)));
  }, [grouped, sortOrder]);

  const getSourceIcon = (source: CalendarEventSource) => {
    switch (source) {
      case 'work_task':
        return <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'work_project':
        return <FolderKanban className="w-3.5 h-3.5 text-cyan-600 shrink-0" />;
      case 'finance_proposal':
        return <Wallet className="w-3.5 h-3.5 text-orange-600 shrink-0" />;
      case 'finance_cash':
        return <Wallet className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      case 'hr_birthday':
        return <Cake className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'note':
        return <BookOpen className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'learning':
        return <GraduationCap className="w-3.5 h-3.5 text-teal-600 shrink-0" />;
      default:
        return <CalendarIcon className="w-3.5 h-3.5 text-sky-600 shrink-0" />;
    }
  };

  const formatHeaderDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);

    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayOfWeek = isNaN(dateObj.getTime()) ? '' : dayNames[dateObj.getDay()];
    const formattedDMY = `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${y}`;

    const isToday = dateStr === todayStr;

    // Hôm qua / Ngày mai
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    const isYesterday = dateStr === yesterdayStr;

    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    const isTomorrow = dateStr === tomorrowStr;

    const lunar = getLunarFullInfoFromDateStr(dateStr);

    return {
      dayOfWeek,
      formattedDMY,
      isToday,
      isYesterday,
      isTomorrow,
      lunar,
    };
  };

  return (
    <div className="bg-card flex-1 flex flex-col min-h-[500px] overflow-hidden">
      {/* Control Header */}
      <div className="p-3.5 md:p-4 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">
              Lịch biểu & Danh sách Lịch trình
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {sortedEvents.length} / {events.length} mục
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>Đang sắp xếp:</span>
            <span className="font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded text-[11px]">
              {sortOrder === 'desc' ? 'Mới nhất trước (Gần đây → Cũ dần)' : 'Cũ nhất trước (Từ quá khứ → Tương lai)'}
            </span>
            <span className="text-muted-foreground/60">•</span>
            <span>Chuẩn hóa ngày chính xác theo thứ tự Năm-Tháng-Ngày</span>
          </p>
        </div>

        {/* Toolbar: Scope Filter & Sort Order */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scope Filters */}
          <div className="inline-flex items-center bg-background border border-border rounded-lg p-0.5 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                scope === 'all'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setScope('month')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                scope === 'month'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={`Sự kiện trong tháng ${currentMonth}/${currentYear}`}
            >
              Tháng {currentMonth}/{currentYear}
            </button>
            <button
              type="button"
              onClick={() => setScope('upcoming')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                scope === 'upcoming'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Hôm nay & Sắp tới
            </button>
            <button
              type="button"
              onClick={() => setScope('past')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                scope === 'past'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Đã qua
            </button>
          </div>

          {/* Sort Order Toggle */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
            title={sortOrder === 'desc' ? 'Chuyển sang Cũ nhất trước' : 'Chuyển sang Mới nhất trước'}
          >
            {sortOrder === 'desc' ? (
              <>
                <ArrowDownWideNarrow className="w-3.5 h-3.5 text-primary" />
                <span>Mới nhất trước</span>
              </>
            ) : (
              <>
                <ArrowUpWideNarrow className="w-3.5 h-3.5 text-primary" />
                <span>Cũ nhất trước</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-6">
        {dateKeys.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-xs space-y-3">
            <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/30" />
            <div className="text-sm font-semibold text-foreground">Không tìm thấy lịch trình nào</div>
            <p className="max-w-md mx-auto text-muted-foreground">
              {scope !== 'all'
                ? 'Không có sự kiện nào trong bộ lọc này. Hãy thử chọn "Tất cả" hoặc chuyển tháng.'
                : 'Chưa có dữ liệu lịch biểu nào được ghi nhận.'}
            </p>
            {scope !== 'all' && (
              <button
                type="button"
                onClick={() => setScope('all')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Filter className="w-3 h-3" />
                Xem tất cả sự kiện
              </button>
            )}
          </div>
        ) : (
          dateKeys.map((dateStr) => {
            const dateEvents = grouped[dateStr];
            const { dayOfWeek, formattedDMY, isToday, isYesterday, isTomorrow, lunar } = formatHeaderDate(dateStr);

            return (
              <div key={dateStr} className="space-y-3">
                {/* Date Group Header */}
                <div className="sticky top-0 z-10 py-1 bg-card/95 backdrop-blur-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Badge Hôm nay / Hôm qua / Ngày mai hoặc Thứ */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-colors shadow-2xs ${
                        isToday
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : isTomorrow
                          ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
                          : isYesterday
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          : 'bg-muted/80 text-foreground border-border'
                      }`}
                    >
                      {isToday && <span>⭐ Hôm nay</span>}
                      {isTomorrow && <span>Ngày mai</span>}
                      {isYesterday && <span>Hôm qua</span>}
                      <span>{dayOfWeek}</span>
                      <span className="font-mono text-[11px] opacity-90">({formattedDMY})</span>
                    </div>

                    {/* Lunar Info Badge */}
                    {lunar && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        <Moon className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Âm lịch: {lunar.lunar.day}/{lunar.lunar.month}{lunar.lunar.isLeap ? '*' : ''}</span>
                        {lunar.canChiDay?.fullName && (
                          <span className="text-[10px] opacity-75">({lunar.canChiDay.fullName})</span>
                        )}
                        {lunar.isSpecialDay && (
                          <span className="ml-1 px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-white">
                            {lunar.specialDayLabel}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      {dateEvents.length} sự kiện
                    </span>
                  </div>
                </div>

                {/* Event Cards Grid */}
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
                            {/* Amount badge with exact VND formatting */}
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

                            {/* Time badge */}
                            {evt.time && (
                              <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                {evt.time}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {evt.title}
                        </h3>

                        {/* Description */}
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
