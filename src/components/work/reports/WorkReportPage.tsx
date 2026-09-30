import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Award,
  Printer,
  CheckSquare,
  Clock,
  AlertTriangle,
  ChartColumn,
  Users,
  Search,
  Download,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { Task } from '../../../types/task';
import { Employee } from '../../../types/employee';
import { taskService } from '../../../services/taskService';
import { employeeService } from '../../../services/employeeService';

interface WorkReportPageProps {
  onBack: () => void;
}

export const WorkReportPage: React.FC<WorkReportPageProps> = ({ onBack }) => {
  const [tasks, setTasks] = useState<Task[]>(() => taskService.getInitialTasks());
  const [employees, setEmployees] = useState<Employee[]>(() => employeeService.getInitialEmployees());
  const [activeTopTab, setActiveTopTab] = useState<'overview' | 'personnel'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      taskService.fetchFromSheet().catch(() => taskService.getInitialTasks()),
      employeeService.fetchFromSheet().catch(() => employeeService.getInitialEmployees()),
    ]).then(([liveTasks, liveEmps]) => {
      if (isMounted) {
        if (Array.isArray(liveTasks)) setTasks(liveTasks);
        if (Array.isArray(liveEmps) && liveEmps.length > 0) setEmployees(liveEmps);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const departments = useMemo(() => {
    const set = new Set(employees.map((e) => e.department).filter(Boolean));
    return Array.from(set);
  }, [employees]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled' && t.dueDate && t.dueDate < todayStr
  ).length;

  const onTimeTasks = tasks.filter(
    (t) => t.status === 'completed' && (!t.completedAt || t.completedAt.split(' ')[0] <= t.dueDate)
  ).length;

  const onTimeRate = completedTasks > 0 ? Math.round((onTimeTasks / completedTasks) * 100) : 100;
  const totalHours = tasks.reduce((sum, t) => sum + (Number(t.actualHours) || Number(t.estimatedHours) || 0), 0);

  // Group by Employee KPI
  const employeeStats = useMemo(() => {
    return employees
      .filter((emp) => {
        if (selectedDept !== 'all' && emp.department !== selectedDept) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = emp.name.toLowerCase().includes(q);
          const matchCode = emp.code.toLowerCase().includes(q);
          const matchDept = (emp.department || '').toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchDept) return false;
        }
        return true;
      })
      .map((emp) => {
        const empTasks = tasks.filter(
          (t) => t.assigneeId === emp.id || t.assigneeCode === emp.code || t.assigneeName === emp.name
        );
        const empDone = empTasks.filter((t) => t.status === 'completed').length;
        const empOverdue = empTasks.filter(
          (t) => t.status !== 'completed' && t.status !== 'cancelled' && t.dueDate && t.dueDate < todayStr
        ).length;
        const empRate = empTasks.length > 0 ? Math.round((empDone / empTasks.length) * 100) : 0;
        const empHours = empTasks.reduce((sum, t) => sum + (t.actualHours || t.estimatedHours || 0), 0);
        const avgScore = empTasks.length > 0
          ? Math.round(empTasks.reduce((sum, t) => sum + (t.kpiScore || 85), 0) / empTasks.length)
          : 85;

        return {
          id: emp.id,
          code: emp.code,
          name: emp.name,
          department: emp.department,
          role: emp.role,
          total: empTasks.length,
          done: empDone,
          overdue: empOverdue,
          rate: empRate,
          hours: empHours,
          score: avgScore,
        };
      })
      .sort((a, b) => b.done - a.done);
  }, [employees, tasks, selectedDept, searchQuery, todayStr]);

  const handleExportCSV = () => {
    const headers = ['Mã NV', 'Họ tên', 'Phòng ban', 'Chức vụ', 'Tổng việc', 'Đã hoàn thành', 'Quá hạn', 'Tỷ lệ (%)', 'Tổng giờ', 'Điểm KPI'];
    const rows = employeeStats.map((e) => [
      `"${e.code}"`,
      `"${e.name}"`,
      `"${e.department}"`,
      `"${e.role}"`,
      e.total,
      e.done,
      e.overdue,
      e.rate,
      e.hours,
      e.score,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bao_cao_hieu_suat_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* Top View Tabs: Tổng quan / Chi tiết nhân sự */}
      <div className="flex items-center gap-1.5 mb-1.5 px-0.5 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTopTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'overview'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <ChartColumn className="w-3.5 h-3.5" />
          <span>Tổng quan hiệu suất</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTopTab('personnel')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'personnel'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Bảng điểm KPI nhân sự</span>
        </button>
      </div>

      {/* Main Card Container */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          {/* Header Bar Toolbar */}
          <div className="px-3 py-2 border-b border-border bg-card">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
              {/* Left: Back button, Search, Department filter */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                    title="Quay lại"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">Quay lại</span>
                  </button>
                )}

                {/* Search Bar */}
                <div className="relative flex-1 min-w-[160px] max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm nhân sự, phòng ban..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Filter: Department */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                    className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      selectedDept !== 'all'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{selectedDept === 'all' ? 'Phòng ban' : selectedDept}</span>
                    <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                  </button>
                  {isDeptDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsDeptDropdownOpen(false)} />
                      <div className="absolute left-0 top-full mt-1.5 w-48 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => { setSelectedDept('all'); setIsDeptDropdownOpen(false); }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selectedDept === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-foreground'}`}
                        >
                          Tất cả phòng ban
                        </button>
                        {departments.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => { setSelectedDept(d); setIsDeptDropdownOpen(false); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate ${selectedDept === d ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-foreground'}`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  title="In báo cáo"
                  className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  title="Xuất file CSV"
                  className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6">
            {/* 4 Quick Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Tổng công việc</p>
                  <h3 className="text-2xl font-extrabold text-foreground mt-0.5">{totalTasks}</h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Tỷ lệ đúng hạn</p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <h3 className="text-2xl font-extrabold text-emerald-600">{onTimeRate}%</h3>
                    <span className="text-xs font-medium text-muted-foreground">
                      ({completedTasks}/{totalTasks} xong)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Đang quá hạn</p>
                  <h3 className="text-2xl font-extrabold text-rose-600 mt-0.5">{overdueTasks}</h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Tổng giờ làm việc</p>
                  <h3 className="text-2xl font-extrabold text-foreground mt-0.5 tabular-nums">{totalHours}h</h3>
                </div>
              </div>
            </div>

            {/* Performance Ranking Table */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  Bảng đánh giá KPI & Hiệu suất Nhân sự
                </h4>
                <span className="text-xs text-muted-foreground">{employeeStats.length} nhân sự</span>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-[11px] font-bold text-muted-foreground uppercase">
                      <th className="px-4 py-2.5">Hạng</th>
                      <th className="px-4 py-2.5">Nhân viên</th>
                      <th className="px-4 py-2.5">Phòng ban</th>
                      <th className="px-4 py-2.5 text-center">Tổng việc</th>
                      <th className="px-4 py-2.5 text-center">Hoàn thành</th>
                      <th className="px-4 py-2.5 text-center">Quá hạn</th>
                      <th className="px-4 py-2.5 text-center">Tỷ lệ xong</th>
                      <th className="px-4 py-2.5 text-center">Giờ làm</th>
                      <th className="px-4 py-2.5 text-center">Điểm KPI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {employeeStats.map((emp, idx) => (
                      <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-bold">
                          {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-foreground">
                          {emp.name} <span className="font-mono text-[10px] text-muted-foreground">({emp.code})</span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{emp.department}</td>
                        <td className="px-4 py-2.5 text-center tabular-nums">{emp.total}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-emerald-600 tabular-nums">{emp.done}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-rose-600 tabular-nums">{emp.overdue}</td>
                        <td className="px-4 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-bold tabular-nums">{emp.rate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center tabular-nums text-muted-foreground">{emp.hours}h</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold ${emp.score >= 90 ? 'bg-emerald-500/10 text-emerald-600' : emp.score >= 75 ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'}`}>
                            {emp.score}/100
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
