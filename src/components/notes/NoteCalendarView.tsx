import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Pin,
  Plus,
  Search,
  Eye,
  SquarePen,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
} from 'lucide-react';
import { Note } from '../../types/note';
import { NOTE_CATEGORIES } from '../../data/notes';
import { useSettings } from '../../context/SettingsContext';

interface NoteCalendarViewProps {
  notes: Note[];
  onSelectNote: (note: Note) => void;
  onAddNote: (defaultDate?: string) => void;
  onEditNote?: (note: Note) => void;
}

type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

// Helper to normalize any date string to YYYY-MM-DD
function normalizeDateStr(dateStr?: string): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  // DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Try Date.parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

const WEEKDAYS = ['Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'CN'];
const FULL_WEEKDAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

export const NoteCalendarView: React.FC<NoteCalendarViewProps> = ({
  notes,
  onSelectNote,
  onAddNote,
  onEditNote,
}) => {
  const { formatDate } = useSettings();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDayDate, setSelectedDayDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 - 11

  // Filter notes by search & category
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (selectedCategory !== 'all' && note.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = note.title.toLowerCase().includes(q);
        const matchContent = (note.content || '').toLowerCase().includes(q);
        const matchLocation = (note.location || '').toLowerCase().includes(q);
        const matchTags = (note.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchContent && !matchLocation && !matchTags) {
          return false;
        }
      }
      return true;
    });
  }, [notes, selectedCategory, searchQuery]);

  // Map notes by normalized date: "YYYY-MM-DD" -> Note[]
  const notesByDate = useMemo(() => {
    const map = new Map<string, Note[]>();
    filteredNotes.forEach((note) => {
      const dateKey = normalizeDateStr(note.noteDate || note.createdAt);
      if (dateKey) {
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(note);
      }
    });
    return map;
  }, [filteredNotes]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else if (viewMode === 'day') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
      setSelectedDayDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else if (viewMode === 'day') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
      setSelectedDayDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDayDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
  };

  // Month Grid Calculation
  const monthDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Day of week: 0 (Sun), 1 (Mon), ..., 6 (Sat)
    // We want Monday as start of week: 0 -> Mon, ..., 6 -> Sun
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const calendarCells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      notes: Note[];
    }[] = [];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 1. Previous month trailing days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      calendarCells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        notes: notesByDate.get(dateStr) || [],
      });
    }

    // 2. Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      calendarCells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        notes: notesByDate.get(dateStr) || [],
      });
    }

    // 3. Next month leading days to complete 35 or 42 grid cells
    const remaining = (7 - (calendarCells.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const nextDate = new Date(year, month + 1, dayNum);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      calendarCells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        notes: notesByDate.get(dateStr) || [],
      });
    }

    return calendarCells;
  }, [year, month, notesByDate]);

  // Week View Days Calculation
  const weekDays = useMemo(() => {
    const current = new Date(currentDate);
    let dayOfWeek = current.getDay() - 1; // Mon = 0, Sun = 6
    if (dayOfWeek === -1) dayOfWeek = 6;

    const startOfWeek = new Date(current);
    startOfWeek.setDate(current.getDate() - dayOfWeek);

    const days: {
      dateStr: string;
      date: Date;
      dayName: string;
      isToday: boolean;
      notes: Note[];
    }[] = [];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        dateStr,
        date: d,
        dayName: FULL_WEEKDAYS[i],
        isToday: dateStr === todayStr,
        notes: notesByDate.get(dateStr) || [],
      });
    }

    return days;
  }, [currentDate, notesByDate]);

  // Agenda / List View: sorted notes grouped by date
  const agendaList = useMemo(() => {
    const grouped = new Map<string, Note[]>();
    filteredNotes.forEach((note) => {
      const dateKey = normalizeDateStr(note.noteDate || note.createdAt) || 'Không có ngày';
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(note);
    });

    // Sort dates descending
    return Array.from(grouped.entries()).sort((a, b) => {
      if (a[0] === 'Không có ngày') return 1;
      if (b[0] === 'Không có ngày') return -1;
      return b[0].localeCompare(a[0]);
    });
  }, [filteredNotes]);

  // Category Color Map
  const getCategoryColor = (cat: string) => {
    const lower = (cat || '').toLowerCase();
    if (lower.includes('họp')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    if (lower.includes('kỹ thuật')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (lower.includes('kế hoạch')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    if (lower.includes('ý tưởng')) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    if (lower.includes('quy trình')) return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-card">
      {/* Calendar Header Toolbar */}
      <div className="px-3 py-2.5 border-b border-border bg-card/90 backdrop-blur-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
        {/* Left: Date Navigator & Jump */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-border bg-background p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handlePrev}
              title="Thời gian trước"
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={handleNext}
              title="Thời gian tiếp theo"
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2 px-1">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <span>
              {viewMode === 'day'
                ? `Ngày ${formatDate(selectedDayDate)}`
                : `Tháng ${month + 1}, Năm ${year}`}
            </span>
          </h2>
        </div>

        {/* Center: Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, địa điểm, thẻ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 px-2 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả chuyên mục</option>
            {NOTE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Right: View Mode Switcher & Add Button */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* View Mode Tabs */}
          <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'month'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tháng
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'week'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tuần
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'day'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ngày
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'agenda'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Lịch biểu
            </button>
          </div>

          <button
            type="button"
            onClick={() => onAddNote()}
            className="h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thêm ghi chú</span>
          </button>
        </div>
      </div>

      {/* Main Calendar Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4">
        {/* 1. MONTH VIEW */}
        {viewMode === 'month' && (
          <div className="h-full flex flex-col border border-border rounded-2xl overflow-hidden shadow-2xs bg-card">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/60 text-center text-xs font-bold text-foreground py-2 select-none">
              {WEEKDAYS.map((wd, i) => (
                <div key={wd} className={i >= 5 ? 'text-amber-600 dark:text-amber-400' : ''}>
                  {wd}
                </div>
              ))}
            </div>

            {/* Month Day Grid */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border bg-card">
              {monthDays.map((cell, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDayDate(cell.dateStr);
                  }}
                  className={`min-h-[100px] sm:min-h-[120px] p-1 sm:p-1.5 flex flex-col transition-colors group relative ${
                    cell.isCurrentMonth ? 'bg-card' : 'bg-muted/20 text-muted-foreground'
                  } ${cell.isToday ? 'ring-2 ring-primary ring-inset bg-primary/5' : ''}`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        cell.isToday
                          ? 'bg-primary text-primary-foreground font-extrabold shadow-xs'
                          : cell.isCurrentMonth
                          ? 'text-foreground group-hover:text-primary'
                          : 'text-muted-foreground/60'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Quick Add Button on Hover */}
                    <button
                      type="button"
                      title={`Thêm ghi chú cho ngày ${cell.dateStr}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddNote(cell.dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Note event pills inside day cell */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] sm:max-h-[100px] pr-0.5">
                    {cell.notes.slice(0, 3).map((note) => (
                      <div
                        key={note.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectNote(note);
                        }}
                        title={`${note.title} ${note.noteTime ? `(${note.noteTime})` : ''} - ${note.category}`}
                        className={`px-1.5 py-1 rounded-lg border text-[11px] font-medium transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1 shadow-2xs ${getCategoryColor(
                          note.category
                        )}`}
                      >
                        {note.isPinned && <Pin className="w-2.5 h-2.5 text-amber-500 fill-current shrink-0" />}
                        {note.noteTime && (
                          <span className="font-mono text-[10px] opacity-75 shrink-0">
                            {note.noteTime}
                          </span>
                        )}
                        <span className="truncate flex-1 leading-tight">{note.title}</span>
                      </div>
                    ))}

                    {cell.notes.length > 3 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayDate(cell.dateStr);
                          setViewMode('day');
                        }}
                        className="w-full text-center text-[10px] font-bold text-primary hover:underline py-0.5 bg-primary/5 rounded"
                      >
                        +{cell.notes.length - 3} ghi chú khác
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. WEEK VIEW */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 h-full">
            {weekDays.map((day) => (
              <div
                key={day.dateStr}
                className={`flex flex-col rounded-2xl border bg-card p-3 shadow-2xs transition-all ${
                  day.isToday ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border'
                }`}
              >
                {/* Week Day Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase">{day.dayName}</span>
                    <p className={`text-sm font-extrabold ${day.isToday ? 'text-primary' : 'text-foreground'}`}>
                      {day.date.getDate()} Thg {day.date.getMonth() + 1}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddNote(day.dateStr)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Thêm ghi chú"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Day Notes List */}
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {day.notes.length === 0 ? (
                    <div className="h-28 flex items-center justify-center text-center text-xs text-muted-foreground/60 italic">
                      Trống
                    </div>
                  ) : (
                    day.notes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => onSelectNote(note)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer hover:shadow-md transition-all space-y-1.5 ${getCategoryColor(
                          note.category
                        )}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold truncate text-foreground">{note.title}</span>
                          {note.isPinned && <Pin className="w-3 h-3 text-amber-500 fill-current shrink-0" />}
                        </div>
                        {note.noteTime && (
                          <div className="flex items-center gap-1 text-[11px] opacity-80 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{note.noteTime}</span>
                          </div>
                        )}
                        {note.location && (
                          <div className="flex items-center gap-1 text-[11px] truncate opacity-80">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{note.location}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. DAY VIEW */}
        {viewMode === 'day' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Chi tiết ngày được chọn
                </span>
                <h3 className="text-lg font-bold text-foreground mt-0.5">
                  {formatDate(selectedDayDate)} ({notesByDate.get(selectedDayDate)?.length || 0} bài viết & ghi chú)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onAddNote(selectedDayDate)}
                className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm ghi chú ngày này</span>
              </button>
            </div>

            {/* List for this day */}
            <div className="space-y-3">
              {(notesByDate.get(selectedDayDate) || []).length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/60 text-muted-foreground space-y-2">
                  <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground/60" />
                  <p className="text-sm font-medium">Chưa có bài viết hoặc ghi chú nào trong ngày này</p>
                  <button
                    type="button"
                    onClick={() => onAddNote(selectedDayDate)}
                    className="mt-2 text-xs font-semibold text-primary hover:underline"
                  >
                    + Bấm để tạo ngay
                  </button>
                </div>
              ) : (
                (notesByDate.get(selectedDayDate) || []).map((note) => (
                  <div
                    key={note.id}
                    onClick={() => onSelectNote(note)}
                    className="p-4 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {note.coverUrl && (
                        <img
                          src={note.coverUrl}
                          alt=""
                          className="w-14 h-14 rounded-xl object-cover border border-border shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                            {note.title}
                          </h4>
                          {note.isPinned && (
                            <span className="p-0.5 text-amber-500">
                              <Pin className="w-3.5 h-3.5 fill-current" />
                            </span>
                          )}
                        </div>
                        {note.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{note.summary}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                          {note.noteTime && (
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3.5 h-3.5 text-primary" /> {note.noteTime}
                            </span>
                          )}
                          {note.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" /> {note.location}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getCategoryColor(
                              note.category
                            )}`}
                          >
                            {note.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditNote?.(note);
                        }}
                        className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Chỉnh sửa"
                      >
                        <SquarePen className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectNote(note)}
                        className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Chi tiết
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. AGENDA / TIMELINE VIEW */}
        {viewMode === 'agenda' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {agendaList.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/60 text-muted-foreground">
                <CalendarRange className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                <p className="text-sm font-medium">Không tìm thấy bài viết ghi chú nào</p>
              </div>
            ) : (
              agendaList.map(([dateKey, dateNotes]) => (
                <div key={dateKey} className="space-y-3">
                  {/* Date Heading Group */}
                  <div className="flex items-center gap-2 sticky top-0 bg-card/90 backdrop-blur-xs py-1 z-10">
                    <CalendarCheck className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-extrabold text-foreground">
                      {dateKey === 'Không có ngày' ? 'Chưa phân ngày cụ thể' : formatDate(dateKey)}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-bold text-muted-foreground">
                      {dateNotes.length}
                    </span>
                  </div>

                  {/* Notes in this date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dateNotes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => onSelectNote(note)}
                        className="p-4 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer space-y-3 group flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getCategoryColor(
                                note.category
                              )}`}
                            >
                              {note.category}
                            </span>
                            {note.isPinned && (
                              <span className="text-amber-500">
                                <Pin className="w-3.5 h-3.5 fill-current" />
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {note.title}
                          </h4>

                          {note.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {note.summary}
                            </p>
                          )}
                        </div>

                        {/* Footer info */}
                        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2 truncate">
                            {note.noteTime && (
                              <span className="flex items-center gap-1 font-mono font-medium text-foreground">
                                <Clock className="w-3 h-3 text-primary" /> {note.noteTime}
                              </span>
                            )}
                            {note.location && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-rose-500 shrink-0" /> {note.location}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0 font-medium">
                            {note.author}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
