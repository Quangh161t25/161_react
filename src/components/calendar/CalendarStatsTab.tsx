import React from 'react';
import {
  Calendar as CalendarIcon,
  CheckSquare,
  FolderKanban,
  Wallet,
  Cake,
  BookOpen,
  Users,
  Clock,
  ExternalLink,
  Layers,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { CalendarEvent } from '../../types/calendar';

interface CalendarStatsTabProps {
  events: CalendarEvent[];
  currentDate: Date;
  onNavigateToModule?: (path: string) => void;
}

export const CalendarStatsTab: React.FC<CalendarStatsTabProps> = ({
  events,
  currentDate,
  onNavigateToModule,
}) => {
  const total = events.length;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // Counts by source
  const taskCount = events.filter((e) => e.source === 'work_task').length;
  const projectCount = events.filter((e) => e.source === 'work_project').length;
  const financeCount = events.filter(
    (e) => e.source === 'finance_proposal' || e.source === 'finance_cash'
  ).length;
  const birthdayCount = events.filter((e) => e.source === 'hr_birthday').length;
  const meetingCount = events.filter((e) => e.source === 'custom').length;
  const noteCount = events.filter((e) => e.source === 'note').length;

  // Time-based metrics
  const todayEvents = events.filter((e) => e.startDate === todayStr);
  const thisMonthEvents = events.filter((e) => e.startDate.startsWith(currentMonthStr));
  const pastEvents = events.filter((e) => e.startDate < todayStr);
  const upcomingEvents = events.filter((e) => e.startDate >= todayStr);

  // Group by category/source
  const sourceStats = [
    {
      id: 'work_task',
      label: 'Công việc & Nhiệm vụ',
      count: taskCount,
      color: 'bg-blue-500',
      text: 'text-blue-500',
      icon: CheckSquare,
    },
    {
      id: 'work_project',
      label: 'Dự án & Giai đoạn',
      count: projectCount,
      color: 'bg-cyan-500',
      text: 'text-cyan-500',
      icon: FolderKanban,
    },
    {
      id: 'finance',
      label: 'Thu chi & Đề xuất tài chính',
      count: financeCount,
      color: 'bg-emerald-500',
      text: 'text-emerald-500',
      icon: Wallet,
    },
    {
      id: 'hr_birthday',
      label: 'Sinh nhật Nhân sự',
      count: birthdayCount,
      color: 'bg-pink-500',
      text: 'text-pink-500',
      icon: Cake,
    },
    {
      id: 'custom',
      label: 'Lịch họp nội bộ',
      count: meetingCount,
      color: 'bg-amber-500',
      text: 'text-amber-500',
      icon: CalendarIcon,
    },
    {
      id: 'note',
      label: 'Ghi chú công tác',
      count: noteCount,
      color: 'bg-purple-500',
      text: 'text-purple-500',
      icon: BookOpen,
    },
  ];

  // Top Assignees / Personnel with events
  const assigneeStats = events.reduce((acc, curr) => {
    if (!curr.assigneeName) return acc;
    acc[curr.assigneeName] = (acc[curr.assigneeName] || 0) + 1;
    return acc;
  }, {} as { [name: string]: number });

  const topAssignees = Object.entries(assigneeStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="space-y-6 p-4 md:p-6 overflow-y-auto">
      {/* 4 Quick Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng sự kiện */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tổng sự kiện ghi nhận</p>
            <h3 className="text-2xl font-extrabold text-foreground mt-0.5">{total}</h3>
          </div>
        </div>

        {/* Card 2: Công việc & Dự án */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Công việc & Dự án</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-extrabold text-foreground">{taskCount + projectCount}</h3>
              <span className="text-xs font-medium text-blue-600">
                {total > 0 ? Math.round(((taskCount + projectCount) / total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Thu chi & Đề xuất */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Thu chi & Đề xuất</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-extrabold text-foreground">{financeCount}</h3>
              <span className="text-xs font-medium text-emerald-600">
                {total > 0 ? Math.round((financeCount / total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Sinh nhật & Lịch họp */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 shrink-0">
            <Cake className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Sinh nhật & Lịch họp</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-extrabold text-foreground">{birthdayCount + meetingCount}</h3>
              <span className="text-xs font-medium text-pink-600">
                {total > 0 ? Math.round(((birthdayCount + meetingCount) / total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Charts / Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Breakdown */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Cơ cấu sự kiện theo Phân hệ
            </h4>
            <span className="text-xs text-muted-foreground">{sourceStats.length} phân hệ</span>
          </div>

          <div className="space-y-3 pt-2">
            {sourceStats.map((item) => {
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
              const IconComp = item.icon;
              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <IconComp className={`w-3.5 h-3.5 ${item.text}`} />
                      {item.label}
                    </span>
                    <span className="text-muted-foreground font-medium">
                      <strong className="text-foreground">{item.count}</strong> ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline Breakdown & Assignee Workload */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Phân bố theo Thời gian & Nhân sự
            </h4>
            <span className="text-xs text-muted-foreground">Tháng {currentDate.getMonth() + 1}/{currentDate.getFullYear()}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                Hôm nay
              </span>
              <div className="text-xl font-bold text-foreground">{todayEvents.length}</div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <CalendarIcon className="w-3 h-3 text-blue-500" />
                Tháng này
              </span>
              <div className="text-xl font-bold text-foreground">{thisMonthEvents.length}</div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                Đã qua
              </span>
              <div className="text-xl font-bold text-foreground">{pastEvents.length}</div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                Sắp tới
              </span>
              <div className="text-xl font-bold text-foreground">{upcomingEvents.length}</div>
            </div>
          </div>

          {/* Top Personnel */}
          {topAssignees.length > 0 && (
            <div className="pt-2 space-y-2 border-t border-border">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>Nhân sự có nhiều đầu việc / lịch trình nhất</span>
              </div>
              <div className="space-y-1.5">
                {topAssignees.map(([name, count]) => {
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={name} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-foreground truncate max-w-[200px]">{name}</span>
                      <span className="text-muted-foreground font-mono font-medium">
                        <strong className="text-foreground">{count}</strong> việc ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Events List */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Lịch trình sắp tới ({upcomingEvents.length})
          </h4>
        </div>

        <div className="divide-y divide-border">
          {upcomingEvents.slice(0, 8).map((evt) => (
            <div
              key={evt.id}
              className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${evt.badgeBg} ${evt.badgeColor} ${evt.badgeBorder}`}
                >
                  {evt.categoryName}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">
                    {evt.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {evt.startDate} {evt.time ? `• ${evt.time}` : ''} {evt.assigneeName ? `• ${evt.assigneeName}` : ''}
                  </div>
                </div>
              </div>

              {evt.sourceLink && onNavigateToModule && (
                <button
                  type="button"
                  onClick={() => onNavigateToModule(evt.sourceLink!)}
                  className="p-1 text-primary hover:bg-primary/10 rounded-md transition-colors shrink-0"
                  title="Mở phân hệ"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
