import React from 'react';
import {
  Users,
  UserCheck,
  Clock,
  UserX,
  Building2,
  GraduationCap,
  PieChart,
} from 'lucide-react';
import { Employee } from '../../types/employee';

interface EmployeeStatsTabProps {
  employees: Employee[];
}

export const EmployeeStatsTab: React.FC<EmployeeStatsTabProps> = ({ employees }) => {
  const total = employees.length;
  const workingCount = employees.filter((e) => e.status === 'working').length;
  const probationCount = employees.filter((e) => e.status === 'probation').length;
  const resignedCount = employees.filter((e) => e.status === 'resigned').length;

  const maleCount = employees.filter((e) => e.gender === 'Nam').length;
  const femaleCount = employees.filter((e) => e.gender === 'Nữ').length;

  // Group by department
  const deptStats = employees.reduce((acc, curr) => {
    acc[curr.department] = (acc[curr.department] || 0) + 1;
    return acc;
  }, {} as { [dept: string]: number });

  // Group by education
  const eduStats = employees.reduce((acc, curr) => {
    const level = curr.educationLevel || 'Đại học';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as { [edu: string]: number });

  return (
    <div className="space-y-6 p-4 md:p-6 overflow-y-auto">
      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tổng nhân sự</p>
            <h3 className="text-2xl font-extrabold text-foreground mt-0.5">{total}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Đang làm việc</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-extrabold text-foreground">{workingCount}</h3>
              <span className="text-xs font-medium text-emerald-600">
                {total > 0 ? Math.round((workingCount / total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Đang thử việc</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-extrabold text-foreground">{probationCount}</h3>
              <span className="text-xs font-medium text-amber-600">
                {total > 0 ? Math.round((probationCount / total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Đã nghỉ việc</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-extrabold text-foreground">{resignedCount}</h3>
              <span className="text-xs font-medium text-slate-500">
                {total > 0 ? Math.round((resignedCount / total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Charts / Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Headcount Breakdown */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Cơ cấu nhân sự theo Phòng ban
            </h4>
            <span className="text-xs text-muted-foreground">{Object.keys(deptStats).length} phòng ban</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(deptStats).map(([dept, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={dept} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{dept}</span>
                    <span className="text-muted-foreground font-medium">
                      <strong className="text-foreground">{count}</strong> ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gender & Education Breakdown */}
        <div className="space-y-6">
          {/* Gender Ratio */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              Tỷ lệ giới tính
            </h4>

            <div className="space-y-3 pt-1">
              <div className="flex h-4 rounded-full overflow-hidden w-full bg-muted">
                <div
                  className="bg-blue-600 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold"
                  style={{ width: `${total > 0 ? (maleCount / total) * 100 : 50}%` }}
                />
                <div
                  className="bg-pink-500 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold"
                  style={{ width: `${total > 0 ? (femaleCount / total) * 100 : 50}%` }}
                />
              </div>

              <div className="flex items-center justify-around pt-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                  <span className="text-muted-foreground">Nam:</span>
                  <strong className="text-foreground">{maleCount}</strong>
                  <span className="text-muted-foreground">
                    ({total > 0 ? Math.round((maleCount / total) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500" />
                  <span className="text-muted-foreground">Nữ:</span>
                  <strong className="text-foreground">{femaleCount}</strong>
                  <span className="text-muted-foreground">
                    ({total > 0 ? Math.round((femaleCount / total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Education Breakdown */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              Trình độ học vấn
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {Object.entries(eduStats).map(([edu, count]) => (
                <div key={edu} className="p-3 rounded-xl border border-border bg-muted/20 text-center">
                  <span className="text-xs text-muted-foreground block truncate">{edu}</span>
                  <span className="text-lg font-bold text-foreground mt-1 block">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
