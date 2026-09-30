import React from 'react';
import {
  CheckSquare,
  Clock,
  CircleCheck,
  AlertTriangle,
  Building2,
  Award,
  BarChart3,
} from 'lucide-react';
import { Task } from '../../../types/task';

interface TaskStatsTabProps {
  tasks: Task[];
}

export const TaskStatsTab: React.FC<TaskStatsTabProps> = ({ tasks }) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const review = tasks.filter((t) => t.status === 'review').length;
  const todo = tasks.filter((t) => t.status === 'todo').length;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const overdue = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled' && t.dueDate && t.dueDate < todayStr
  ).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Breakdown by Department
  const deptMap: Record<string, { total: number; completed: number }> = {};
  tasks.forEach((t) => {
    const d = t.department || 'Chung';
    if (!deptMap[d]) deptMap[d] = { total: 0, completed: 0 };
    deptMap[d].total += 1;
    if (t.status === 'completed') deptMap[d].completed += 1;
  });

  // Breakdown by Assignee
  const assigneeMap: Record<string, { total: number; completed: number; code?: string }> = {};
  tasks.forEach((t) => {
    const a = t.assigneeName || 'Chưa phân công';
    if (!assigneeMap[a]) assigneeMap[a] = { total: 0, completed: 0, code: t.assigneeCode };
    assigneeMap[a].total += 1;
    if (t.status === 'completed') assigneeMap[a].completed += 1;
  });

  const assigneeRanking = Object.entries(assigneeMap).sort((a, b) => b[1].completed - a[1].completed);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium">Tổng số công việc</span>
            <h4 className="text-xl font-bold text-foreground tabular-nums">{total} việc</h4>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CircleCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium">Tỷ lệ hoàn thành</span>
            <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {completionRate}% ({completed}/{total})
            </h4>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium">Đang triển khai</span>
            <h4 className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {inProgress + review} việc
            </h4>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-medium">Quá hạn xử lý</span>
            <h4 className="text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {overdue} việc
            </h4>
          </div>
        </div>
      </div>

      {/* Grid: Status Distribution & Department Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span>Phân bổ theo trạng thái thực hiện</span>
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Đã hoàn thành</span>
                <span className="font-bold text-emerald-600 tabular-nums">{completed} ({total > 0 ? Math.round((completed/total)*100) : 0}%)</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${total > 0 ? (completed/total)*100 : 0}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Đang thực hiện</span>
                <span className="font-bold text-amber-600 tabular-nums">{inProgress} ({total > 0 ? Math.round((inProgress/total)*100) : 0}%)</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${total > 0 ? (inProgress/total)*100 : 0}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Chờ duyệt / Nghiệm thu</span>
                <span className="font-bold text-blue-600 tabular-nums">{review} ({total > 0 ? Math.round((review/total)*100) : 0}%)</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${total > 0 ? (review/total)*100 : 0}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Chưa thực hiện (Cần làm)</span>
                <span className="font-bold text-slate-600 tabular-nums">{todo} ({total > 0 ? Math.round((todo/total)*100) : 0}%)</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${total > 0 ? (todo/total)*100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Department Workload */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Khối lượng công việc theo phòng ban</span>
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {Object.entries(deptMap).map(([dept, data]) => {
              const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
              return (
                <div key={dept} className="p-2.5 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{dept}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {data.completed}/{data.total} hoàn thành ({rate}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${rate}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Assignee Ranking */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Xếp hạng năng suất nhân sự</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {assigneeRanking.map(([name, data], idx) => (
            <div
              key={name}
              className="p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                    idx === 0
                      ? 'bg-amber-500 text-white shadow-sm'
                      : idx === 1
                      ? 'bg-slate-300 text-slate-800'
                      : idx === 2
                      ? 'bg-amber-700 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-foreground truncate flex items-center gap-1">
                    <span>{name}</span>
                    {data.code && (
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1 rounded">
                        {data.code}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Tổng giao: {data.total} việc
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-bold text-emerald-600 block">{data.completed} xong</span>
                <span className="text-[10px] text-muted-foreground">
                  {data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
