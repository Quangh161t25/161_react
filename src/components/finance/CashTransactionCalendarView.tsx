import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  Plus,
} from 'lucide-react';
import { CashTransaction } from '../../types/cashTransaction';
import { getLunarFullInfo } from '../../utils/lunarCalendar';
import { useSettings } from '../../context/SettingsContext';

interface CashTransactionCalendarViewProps {
  transactions: CashTransaction[];
  onSelectTransaction: (tx: CashTransaction) => void;
  onAddTransactionWithDate?: (dateStr: string) => void;
}

export const CashTransactionCalendarView: React.FC<CashTransactionCalendarViewProps> = ({
  transactions,
  onSelectTransaction,
  onAddTransactionWithDate,
}) => {
  const { formatDate } = useSettings();
  const formatNumber = (num: number) => (num ? num.toLocaleString('vi-VN') : '0');

  // Current view date state (Default to September 2026 based on mock data)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 0-indexed: 8 = September
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Days of week header (Vietnamese standard starting Monday)
  const DAYS_OF_WEEK = [
    { label: 'Th 2', full: 'Thứ Hai' },
    { label: 'Th 3', full: 'Thứ Ba' },
    { label: 'Th 4', full: 'Thứ Tư' },
    { label: 'Th 5', full: 'Thứ Năm' },
    { label: 'Th 6', full: 'Thứ Sáu' },
    { label: 'Th 7', full: 'Thứ Bảy' },
    { label: 'CN', full: 'Chủ Nhật' },
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(8);
  };

  // Build calendar matrix
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const daysInMonth = lastDayOfMonth.getDate();
    const cells = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const lunar = getLunarFullInfo(d, m + 1, y);
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        lunar,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const lunar = getLunarFullInfo(d, currentMonth + 1, currentYear);
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        lunar,
      });
    }

    // Next month filler days to complete 35 or 42 grid
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const lunar = getLunarFullInfo(d, m + 1, y);
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        lunar,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Group transactions by date
  const transactionsByDate = useMemo(() => {
    const map: Record<string, CashTransaction[]> = {};
    transactions.forEach((tx) => {
      if (tx.transactionDate) {
        if (!map[tx.transactionDate]) map[tx.transactionDate] = [];
        map[tx.transactionDate].push(tx);
      }
    });
    return map;
  }, [transactions]);

  // Selected day transactions
  const selectedDayTransactions = selectedDay ? transactionsByDate[selectedDay] || [] : [];
  const selectedDayInflow = selectedDayTransactions
    .filter((t) => t.type === 'income' && t.status === 'completed')
    .reduce((s, t) => s + t.amount, 0);
  const selectedDayOutflow = selectedDayTransactions
    .filter((t) => t.type === 'expense' && t.status === 'completed')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4 p-4 md:p-6 overflow-y-auto">
      {/* CALENDAR TOOLBAR */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Tháng {currentMonth + 1} / {currentYear}
            </h3>
            <p className="text-xs text-muted-foreground">
              Lịch theo dõi dòng tiền & Âm Dương Lịch Việt Nam
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors cursor-pointer"
          >
            Hôm nay
          </button>
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CALENDAR GRID + SIDE DETAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar Matrix */}
        <div
          className={`${
            selectedDay ? 'lg:col-span-3' : 'lg:col-span-4'
          } bg-card rounded-2xl border border-border overflow-hidden shadow-sm`}
        >
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-bold text-muted-foreground py-2.5">
            {DAYS_OF_WEEK.map((d, i) => (
              <div key={d.label} className={i === 6 ? 'text-rose-500' : ''}>
                {d.label}
              </div>
            ))}
          </div>

          {/* Day Cells Matrix */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border">
            {calendarCells.map((cell) => {
              const dayTxs = transactionsByDate[cell.dateStr] || [];
              const dayInflow = dayTxs
                .filter((t) => t.type === 'income' && t.status === 'completed')
                .reduce((s, t) => s + t.amount, 0);
              const dayOutflow = dayTxs
                .filter((t) => t.type === 'expense' && t.status === 'completed')
                .reduce((s, t) => s + t.amount, 0);

              const isSelected = selectedDay === cell.dateStr;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDay(cell.dateStr)}
                  className={`min-h-[110px] p-2 transition-all cursor-pointer flex flex-col justify-between group ${
                    cell.isCurrentMonth
                      ? 'bg-card hover:bg-primary/5'
                      : 'bg-muted/20 text-muted-foreground/60'
                  } ${isSelected ? 'ring-2 ring-primary bg-primary/10' : ''}`}
                >
                  {/* Top Row: Solar Day & Lunar Day */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : cell.isCurrentMonth
                          ? 'text-foreground group-hover:text-primary'
                          : 'text-muted-foreground/60'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Lunar Pill */}
                    <div className="flex items-center gap-1">
                      {cell.lunar.isSpecialDay && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      )}
                      <span
                        className={`text-[10px] font-medium px-1 rounded ${
                          cell.lunar.isSpecialDay
                            ? 'text-amber-600 bg-amber-500/10 font-bold'
                            : 'text-muted-foreground'
                        }`}
                        title={`Âm lịch: Ngày ${cell.lunar.lunar.day}/${cell.lunar.lunar.month} (${cell.lunar.canChiDay.fullName})`}
                      >
                        {cell.lunar.displayText}
                      </span>
                    </div>
                  </div>

                  {/* Cash Flow Badges for this day */}
                  <div className="space-y-1 my-1">
                    {dayInflow > 0 && (
                      <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 truncate">
                        <span className="flex items-center gap-0.5 truncate">
                          <ArrowDownLeft className="w-3 h-3 shrink-0" />
                          <span className="truncate">+{formatNumber(dayInflow)} đ</span>
                        </span>
                      </div>
                    )}
                    {dayOutflow > 0 && (
                      <div className="flex items-center justify-between text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 truncate">
                        <span className="flex items-center gap-0.5 truncate">
                          <ArrowUpRight className="w-3 h-3 shrink-0" />
                          <span className="truncate">-{formatNumber(dayOutflow)} đ</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{dayTxs.length > 0 ? `${dayTxs.length} GD` : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Cash Flow Panel */}
        {selectedDay && (
          <div className="lg:col-span-1 bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4 animate-fadeIn flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                  Dòng tiền ngày
                </span>
                <h4 className="text-base font-bold text-foreground">
                  {formatDate(selectedDay)}
                </h4>
                {(() => {
                  const [y, m, d] = selectedDay.split('-').map(Number);
                  const l = getLunarFullInfo(d, m, y);
                  return (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                      Âm lịch: {l.lunar.day}/{l.lunar.month} ({l.canChiDay.fullName})
                    </p>
                  );
                })()}
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Daily KPI */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold block text-[10px]">
                  Tổng Thu
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  +{formatNumber(selectedDayInflow)} đ
                </span>
              </div>
              <div className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                <span className="text-rose-600 dark:text-rose-400 font-semibold block text-[10px]">
                  Tổng Chi
                </span>
                <span className="font-bold text-rose-700 dark:text-rose-300">
                  -{formatNumber(selectedDayOutflow)} đ
                </span>
              </div>
            </div>

            {/* Transaction List on this day */}
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-1 custom-scrollbar">
              {selectedDayTransactions.length > 0 ? (
                selectedDayTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="p-3 bg-muted/20 rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-primary">
                        {tx.code}
                      </span>
                      <span
                        className={`text-xs font-black ${
                          tx.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : tx.type === 'expense'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                        {formatNumber(tx.amount)} đ
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-foreground line-clamp-2">
                      {tx.title}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border">
                      <span>{tx.counterpartyName || '—'}</span>
                      <span>{tx.transactionTime || '09:00'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Không có giao dịch nào trong ngày này
                </div>
              )}
            </div>

            {/* Add transaction for this day */}
            {onAddTransactionWithDate && (
              <button
                type="button"
                onClick={() => onAddTransactionWithDate(selectedDay)}
                className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm phiếu cho ngày này</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
