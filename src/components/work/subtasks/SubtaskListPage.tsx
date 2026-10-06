import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  SquarePen,
  ExternalLink,
  CheckCircle2,
  Circle,
  FolderKanban,
  User,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  Columns,
  Download,
  AlertCircle,
  Clock,
  ListChecks,
  Filter,
} from 'lucide-react';
import { Task, TaskSubtask, TaskStatus, Project } from '../../../types/task';
import { Employee } from '../../../types/employee';
import { taskService, projectService } from '../../../services/taskService';
import { employeeService } from '../../../services/employeeService';
import { SubtaskFormModal } from './SubtaskFormModal';
import { TaskDetailDrawer } from '../tasks/TaskDetailDrawer';
import { useAutoSync } from '../../../hooks/useAutoSync';
import { RealtimeSyncBadge } from '../../common/RealtimeSyncBadge';

interface SubtaskListPageProps {
  onBack: () => void;
}

export interface FlattenedSubtask {
  subtaskId: string;
  subtaskTitle: string;
  completed: boolean;
  assignee?: string;
  dueDate?: string;
  parentTaskId: string;
  parentTaskCode: string;
  parentTaskTitle: string;
  parentProjectName?: string;
  parentDepartment?: string;
  parentPriority: string;
  parentStatus: TaskStatus;
  parentProgress: number;
}

export const SubtaskListPage: React.FC<SubtaskListPageProps> = ({ onBack }) => {
  // Data States
  const [tasks, setTasks] = useState<Task[]>(() => taskService.getInitialTasks());
  const [projects] = useState<Project[]>(() => projectService.getInitialProjects());
  const [employees] = useState<Employee[]>(() => employeeService.getInitialEmployees());

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<'all' | string>('all');
  const [selectedParentTaskId, setSelectedParentTaskId] = useState<'all' | string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<'all' | string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'table' | 'kanban'>('grouped');

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultParentTaskId, setDefaultParentTaskId] = useState<string | undefined>(undefined);
  const [subtaskToEdit, setSubtaskToEdit] = useState<{ taskId: string; subtask: TaskSubtask } | null>(null);
  const [selectedParentTask, setSelectedParentTask] = useState<Task | null>(null);

  // Quick inline add state per parent task: { [taskId]: text }
  const [quickAddTitles, setQuickAddTitles] = useState<Record<string, string>>({});

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Realtime Auto-Sync Hook with Google Sheets
  const { isSyncing, lastSyncTime, triggerManualSync } = useAutoSync<Task[]>({
    syncFn: () => taskService.fetchFromSheet(),
    onDataReceived: (remoteTasks) => {
      if (remoteTasks && remoteTasks.length > 0) {
        setTasks(remoteTasks);
        if (selectedParentTask) {
          const fresh = remoteTasks.find((t) => t.id === selectedParentTask.id);
          if (fresh) setSelectedParentTask(fresh);
        }
      }
    },
  });

  // Save changes helper
  const updateAndSaveTasks = (nextTasks: Task[]) => {
    setTasks(nextTasks);
    taskService.saveAllToSheet(nextTasks);
    if (selectedParentTask) {
      const refreshed = nextTasks.find((t) => t.id === selectedParentTask.id);
      if (refreshed) setSelectedParentTask(refreshed);
    }
  };

  // Toggle Subtask Completion
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId || t.code === taskId) {
        const nextSubtasks = (t.subtasks || []).map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        const done = nextSubtasks.filter((s) => s.completed).length;
        const progress = nextSubtasks.length > 0 ? Math.round((done / nextSubtasks.length) * 100) : t.progress;
        const nextStatus: TaskStatus =
          progress === 100
            ? 'completed'
            : progress > 0 && t.status === 'todo'
            ? 'in_progress'
            : t.status;

        return {
          ...t,
          subtasks: nextSubtasks,
          progress,
          status: nextStatus,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      }
      return t;
    });

    updateAndSaveTasks(updated);
  };

  // Save Subtask (Add or Edit) from Modal
  const handleSaveSubtask = (taskId: string, subtask: TaskSubtask, isEdit: boolean) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        let nextSubtasks = t.subtasks ? [...t.subtasks] : [];
        if (isEdit) {
          nextSubtasks = nextSubtasks.map((s) => (s.id === subtask.id ? subtask : s));
        } else {
          nextSubtasks.push(subtask);
        }
        const done = nextSubtasks.filter((s) => s.completed).length;
        const progress = nextSubtasks.length > 0 ? Math.round((done / nextSubtasks.length) * 100) : t.progress;
        const nextStatus: TaskStatus =
          progress === 100
            ? 'completed'
            : progress > 0 && t.status === 'todo'
            ? 'in_progress'
            : t.status;

        return {
          ...t,
          subtasks: nextSubtasks,
          progress,
          status: nextStatus,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      }
      return t;
    });

    updateAndSaveTasks(updated);
    showToast(isEdit ? 'Đã cập nhật việc con!' : 'Đã thêm mới việc con!');
  };

  // Delete Subtask
  const handleDeleteSubtask = (taskId: string, subtaskId: string, title?: string) => {
    const confirmText = title
      ? `Bạn có chắc chắn muốn xóa việc con "${title}"?`
      : 'Bạn có chắc chắn muốn xóa việc con này?';
    if (!window.confirm(confirmText)) return;

    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextSubtasks = (t.subtasks || []).filter((s) => s.id !== subtaskId);
        const done = nextSubtasks.filter((s) => s.completed).length;
        const progress = nextSubtasks.length > 0 ? Math.round((done / nextSubtasks.length) * 100) : 0;
        return {
          ...t,
          subtasks: nextSubtasks,
          progress,
          status: progress === 100 && nextSubtasks.length > 0 ? ('completed' as TaskStatus) : t.status,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      }
      return t;
    });

    updateAndSaveTasks(updated);
    showToast('Đã xóa việc con!');
  };

  // Quick inline add handler
  const handleQuickAdd = (taskId: string) => {
    const title = (quickAddTitles[taskId] || '').trim();
    if (!title) return;

    const parent = tasks.find((t) => t.id === taskId);
    const newSubtask: TaskSubtask = {
      id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      completed: false,
      assignee: parent?.assigneeName,
      dueDate: parent?.dueDate,
    };

    handleSaveSubtask(taskId, newSubtask, false);
    setQuickAddTitles((prev) => ({ ...prev, [taskId]: '' }));
  };

  // Flatten all subtasks for table and statistics
  const allFlattenedSubtasks = useMemo<FlattenedSubtask[]>(() => {
    const result: FlattenedSubtask[] = [];
    tasks.forEach((t) => {
      if (t.subtasks && t.subtasks.length > 0) {
        t.subtasks.forEach((st) => {
          result.push({
            subtaskId: st.id,
            subtaskTitle: st.title,
            completed: !!st.completed,
            assignee: st.assignee || t.assigneeName,
            dueDate: st.dueDate || t.dueDate,
            parentTaskId: t.id,
            parentTaskCode: t.code,
            parentTaskTitle: t.title,
            parentProjectName: t.projectName,
            parentDepartment: t.department,
            parentPriority: t.priority,
            parentStatus: t.status,
            parentProgress: t.progress,
          });
        });
      }
    });
    return result;
  }, [tasks]);

  // Overall Statistics
  const totalSubtasksCount = allFlattenedSubtasks.length;
  const completedSubtasksCount = allFlattenedSubtasks.filter((s) => s.completed).length;
  const pendingSubtasksCount = totalSubtasksCount - completedSubtasksCount;
  const completionPercentage = totalSubtasksCount > 0 ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100) : 0;
  const parentTasksWithSubtasksCount = tasks.filter((t) => (t.subtasks || []).length > 0).length;

  // Filtered Flattened Subtasks
  const filteredFlattenedSubtasks = useMemo(() => {
    return allFlattenedSubtasks.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.subtaskTitle.toLowerCase().includes(q);
        const matchParentTitle = item.parentTaskTitle.toLowerCase().includes(q);
        const matchParentCode = item.parentTaskCode.toLowerCase().includes(q);
        const matchAssignee = (item.assignee || '').toLowerCase().includes(q);
        if (!matchTitle && !matchParentTitle && !matchParentCode && !matchAssignee) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter === 'pending' && item.completed) return false;
      if (statusFilter === 'completed' && !item.completed) return false;

      // 3. Project Filter
      if (selectedProjectId !== 'all') {
        const parent = tasks.find((t) => t.id === item.parentTaskId);
        if (parent?.projectId !== selectedProjectId && parent?.projectName !== selectedProjectId) {
          return false;
        }
      }

      // 4. Parent Task Filter
      if (selectedParentTaskId !== 'all' && item.parentTaskId !== selectedParentTaskId) {
        return false;
      }

      // 5. Assignee Filter
      if (selectedAssignee !== 'all') {
        if ((item.assignee || '').trim().toLowerCase() !== selectedAssignee.trim().toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [allFlattenedSubtasks, searchQuery, statusFilter, selectedProjectId, selectedParentTaskId, selectedAssignee, tasks]);

  // Distinct Assignees list
  const distinctAssignees = useMemo(() => {
    const set = new Set<string>();
    allFlattenedSubtasks.forEach((s) => {
      if (s.assignee && s.assignee.trim()) set.add(s.assignee.trim());
    });
    employees.forEach((e) => {
      if (e.name) set.add(e.name.trim());
    });
    return Array.from(set).sort();
  }, [allFlattenedSubtasks, employees]);

  // Tasks grouped for Grouped View
  const filteredTasksForGroupedView = useMemo(() => {
    return tasks.filter((task) => {
      // Check project filter
      if (selectedProjectId !== 'all' && task.projectId !== selectedProjectId && task.projectName !== selectedProjectId) {
        return false;
      }
      // Check parent task filter
      if (selectedParentTaskId !== 'all' && task.id !== selectedParentTaskId) {
        return false;
      }

      const taskSubtasks = task.subtasks || [];
      const hasMatchingSubtasks = taskSubtasks.some((st) => {
        // Status filter
        if (statusFilter === 'pending' && st.completed) return false;
        if (statusFilter === 'completed' && !st.completed) return false;

        // Assignee filter
        if (selectedAssignee !== 'all' && (st.assignee || task.assigneeName)?.toLowerCase() !== selectedAssignee.toLowerCase()) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = st.title.toLowerCase().includes(q);
          const matchParent = task.title.toLowerCase().includes(q) || task.code.toLowerCase().includes(q);
          const matchAssignee = (st.assignee || task.assigneeName).toLowerCase().includes(q);
          return matchTitle || matchParent || matchAssignee;
        }

        return true;
      });

      // If search query is entered, match parent or subtask
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchParent = task.title.toLowerCase().includes(q) || task.code.toLowerCase().includes(q);
        return hasMatchingSubtasks || matchParent;
      }

      // In grouped view, show tasks that have subtasks or match the direct filter
      return taskSubtasks.length > 0 || selectedParentTaskId === task.id;
    });
  }, [tasks, selectedProjectId, selectedParentTaskId, statusFilter, selectedAssignee, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Mã việc chính',
      'Việc chính',
      'Tên việc con',
      'Trạng thái việc con',
      'Người thực hiện',
      'Hạn chót',
      'Dự án',
      'Phòng ban',
    ];

    const rows = filteredFlattenedSubtasks.map((item) => [
      item.parentTaskCode,
      `"${item.parentTaskTitle.replace(/"/g, '""')}"`,
      `"${item.subtaskTitle.replace(/"/g, '""')}"`,
      item.completed ? 'Đã hoàn thành' : 'Chưa hoàn thành',
      `"${item.assignee || ''}"`,
      item.dueDate || '',
      `"${item.parentProjectName || ''}"`,
      `"${item.parentDepartment || ''}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `danh_sach_viec_con_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV thành công!');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background text-foreground">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-foreground text-background px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col p-2.5 sm:p-4 md:p-6 space-y-4 max-w-[1600px] w-full mx-auto">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-xs"
              title="Quay lại phân hệ Công việc"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <ListChecks className="w-4 h-4" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  Công việc con
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20 hidden md:inline-block">
                  Subtasks Hub
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quản lý, phân công và kiểm tra tiến độ các đầu việc con của công việc chính
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <RealtimeSyncBadge
              isSyncing={isSyncing}
              lastSyncTime={lastSyncTime}
              onSync={triggerManualSync}
            />

            <button
              type="button"
              onClick={handleExportCSV}
              className="h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-all shadow-xs"
              title="Xuất file CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSubtaskToEdit(null);
                setDefaultParentTaskId(tasks[0]?.id);
                setIsModalOpen(true);
              }}
              className="h-8 px-3.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm việc con</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Card 1: Tổng số việc con */}
          <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 border border-purple-500/20">
              <ListChecks className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">
                Tổng số việc con
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-foreground tabular-nums">
                  {totalSubtasksCount}
                </span>
                <span className="text-[11px] text-muted-foreground">đầu việc</span>
              </div>
            </div>
          </div>

          {/* Card 2: Đã hoàn thành */}
          <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">
                Đã hoàn thành
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-emerald-600 tabular-nums">
                  {completedSubtasksCount}
                </span>
                <span className="text-[11px] text-emerald-700/80 font-semibold tabular-nums">
                  ({completionPercentage}%)
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Chưa hoàn thành */}
          <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">
                Chưa hoàn thành
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-amber-600 tabular-nums">
                  {pendingSubtasksCount}
                </span>
                <span className="text-[11px] text-muted-foreground">cần làm</span>
              </div>
            </div>
          </div>

          {/* Card 4: Công việc chính liên kết */}
          <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-500/20">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">
                Việc chính có việc con
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-foreground tabular-nums">
                  {parentTasksWithSubtasksCount}
                </span>
                <span className="text-[11px] text-muted-foreground">/ {tasks.length} tổng số</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters & View Switcher */}
        <div className="p-3 rounded-xl border border-border bg-card shadow-xs space-y-2.5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên việc con, việc chính, mã việc, người thực hiện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-border bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 rounded-lg border border-border bg-muted/40 self-end md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'grouped'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Gom nhóm theo công việc chính"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Theo việc chính</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Xem dạng bảng chi tiết"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bảng chi tiết</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Xem 2 cột Kanban: Chưa xong vs Đã xong"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">2 Cột</span>
              </button>
            </div>
          </div>

          {/* Filter Dropdowns Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs">
            <span className="text-muted-foreground flex items-center gap-1 font-semibold text-[11px] mr-1">
              <Filter className="w-3 h-3" />
              Lọc:
            </span>

            {/* Status Filter Tabs */}
            <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
              {(
                [
                  { id: 'all', label: 'Tất cả' },
                  { id: 'pending', label: 'Chưa xong' },
                  { id: 'completed', label: 'Đã xong' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    statusFilter === tab.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Parent Task Selector */}
            <select
              value={selectedParentTaskId}
              onChange={(e) => setSelectedParentTaskId(e.target.value)}
              className="h-7 px-2.5 rounded-lg border border-border bg-background text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[200px]"
            >
              <option value="all">Tất cả việc chính</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.code}] {t.title}
                </option>
              ))}
            </select>

            {/* Project Selector */}
            {projects.length > 0 && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="h-7 px-2.5 rounded-lg border border-border bg-background text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[180px]"
              >
                <option value="all">Tất cả dự án</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            {/* Assignee Selector */}
            {distinctAssignees.length > 0 && (
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="h-7 px-2.5 rounded-lg border border-border bg-background text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[180px]"
              >
                <option value="all">Tất cả người thực hiện</option>
                {distinctAssignees.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}

            {/* Reset Filters button if any active */}
            {(statusFilter !== 'all' ||
              selectedParentTaskId !== 'all' ||
              selectedProjectId !== 'all' ||
              selectedAssignee !== 'all' ||
              searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setSelectedParentTaskId('all');
                  setSelectedProjectId('all');
                  setSelectedAssignee('all');
                  setSearchQuery('');
                }}
                className="text-[11px] font-semibold text-primary hover:underline ml-auto"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Content Body based on View Mode */}
        {totalSubtasksCount === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto border border-purple-500/20">
              <ListChecks className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Chưa có công việc con nào</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Chia nhỏ các công việc chính thành nhiều đầu việc con để dễ dàng theo dõi và thúc đẩy tiến độ hoàn thành.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubtaskToEdit(null);
                setDefaultParentTaskId(tasks[0]?.id);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm công việc con đầu tiên</span>
            </button>
          </div>
        ) : filteredFlattenedSubtasks.length === 0 && viewMode === 'table' ? (
          <div className="p-10 text-center rounded-2xl border border-border bg-card">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium text-muted-foreground">
              Không tìm thấy công việc con nào phù hợp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <>
            {/* VIEW 1: GROUPED BY PARENT TASK */}
            {viewMode === 'grouped' && (
              <div className="space-y-4">
                {filteredTasksForGroupedView.map((task) => {
                  const taskSubtasks = task.subtasks || [];
                  const doneCount = taskSubtasks.filter((s) => s.completed).length;
                  const totalCount = taskSubtasks.length;
                  const subProgress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

                  return (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden transition-all hover:border-primary/40"
                    >
                      {/* Parent Task Card Header */}
                      <div className="p-3.5 sm:p-4 bg-muted/30 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                              {task.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedParentTask(task)}
                              className="text-sm font-bold text-foreground hover:text-primary transition-colors text-left truncate flex items-center gap-1.5 group"
                              title="Xem chi tiết công việc chính"
                            >
                              <span>{task.title}</span>
                              <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0 opacity-70" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                            {task.projectName && (
                              <span className="flex items-center gap-1">
                                <FolderKanban className="w-3 h-3 text-primary/70" />
                                {task.projectName}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-muted-foreground" />
                              {task.assigneeName}
                            </span>
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-rose-500" />
                                {task.dueDate}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Parent Task Progress & Quick Add Action */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="text-right space-y-1">
                            <div className="flex items-center justify-end gap-1.5 text-xs font-semibold">
                              <span className="text-muted-foreground text-[11px]">
                                {doneCount}/{totalCount} việc con
                              </span>
                              <span className="text-primary tabular-nums font-bold">
                                {subProgress}%
                              </span>
                            </div>
                            <div className="w-28 sm:w-36 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  subProgress === 100
                                    ? 'bg-emerald-500'
                                    : subProgress > 50
                                    ? 'bg-primary'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${subProgress}%` }}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSubtaskToEdit(null);
                              setDefaultParentTaskId(task.id);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1 transition-all"
                            title="Thêm việc con vào công việc này"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Thêm việc</span>
                          </button>
                        </div>
                      </div>

                      {/* Subtasks Checklist */}
                      <div className="p-3.5 sm:p-4 space-y-2">
                        {taskSubtasks.length === 0 ? (
                          <p className="text-xs text-muted-foreground/70 italic py-2">
                            Chưa có việc con nào. Nhập tiêu đề bên dưới hoặc bấm "+ Thêm việc" để tạo.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {taskSubtasks.map((st) => (
                              <div
                                key={st.id}
                                className={`group p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                                  st.completed
                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-muted-foreground'
                                    : 'bg-background border-border hover:border-primary/40 text-foreground'
                                }`}
                              >
                                {/* Checkbox & Title */}
                                <div
                                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                                  onClick={() => handleToggleSubtask(task.id, st.id)}
                                >
                                  {st.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                                  )}
                                  <span
                                    className={`text-xs font-medium truncate ${
                                      st.completed ? 'line-through opacity-70' : ''
                                    }`}
                                  >
                                    {st.title}
                                  </span>
                                </div>

                                {/* Meta details: Assignee, Due date & Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                  {st.assignee && (
                                    <span className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                                      <User className="w-3 h-3" />
                                      {st.assignee}
                                    </span>
                                  )}
                                  {st.dueDate && (
                                    <span className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                                      <Calendar className="w-3 h-3 text-rose-500" />
                                      {st.dueDate}
                                    </span>
                                  )}

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSubtaskToEdit({ taskId: task.id, subtask: st });
                                        setIsModalOpen(true);
                                      }}
                                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                      title="Chỉnh sửa việc con"
                                    >
                                      <SquarePen className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSubtask(task.id, st.id, st.title)}
                                      className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                      title="Xóa việc con"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline Quick Add Input */}
                        <div className="pt-2">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleQuickAdd(task.id);
                            }}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="text"
                              placeholder="+ Nhập nhanh việc con mới rồi nhấn Enter..."
                              value={quickAddTitles[task.id] || ''}
                              onChange={(e) =>
                                setQuickAddTitles((prev) => ({ ...prev, [task.id]: e.target.value }))
                              }
                              className="flex-1 h-8 px-3 text-xs rounded-xl border border-dashed border-border bg-background/50 placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-background transition-all"
                            />
                            {(quickAddTitles[task.id] || '').trim() && (
                              <button
                                type="submit"
                                className="h-8 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shrink-0"
                              >
                                Lưu
                              </button>
                            )}
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW 2: TABLE VIEW */}
            {viewMode === 'table' && (
              <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                        <th className="py-3 px-3.5 w-10 text-center">#</th>
                        <th className="py-3 px-3.5 min-w-[240px]">Tên công việc con</th>
                        <th className="py-3 px-3.5 min-w-[200px]">Thuộc công việc chính</th>
                        <th className="py-3 px-3.5 min-w-[140px]">Người thực hiện</th>
                        <th className="py-3 px-3.5 min-w-[110px] text-center">Hạn chót</th>
                        <th className="py-3 px-3.5 min-w-[120px] text-center">Trạng thái</th>
                        <th className="py-3 px-3.5 w-24 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredFlattenedSubtasks.map((item) => (
                        <tr
                          key={`${item.parentTaskId}_${item.subtaskId}`}
                          className={`hover:bg-muted/40 transition-colors ${
                            item.completed ? 'bg-muted/10 text-muted-foreground' : ''
                          }`}
                        >
                          {/* 1. Toggle Checkbox */}
                          <td className="py-3 px-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSubtask(item.parentTaskId, item.subtaskId)}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              {item.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* 2. Subtask Title */}
                          <td className="py-3 px-3.5">
                            <span
                              onClick={() => handleToggleSubtask(item.parentTaskId, item.subtaskId)}
                              className={`font-medium cursor-pointer ${
                                item.completed ? 'line-through opacity-70 text-muted-foreground' : 'text-foreground'
                              }`}
                            >
                              {item.subtaskTitle}
                            </span>
                          </td>

                          {/* 3. Parent Task Link */}
                          <td className="py-3 px-3.5">
                            <button
                              type="button"
                              onClick={() => {
                                const parent = tasks.find((t) => t.id === item.parentTaskId);
                                if (parent) setSelectedParentTask(parent);
                              }}
                              className="text-left group flex flex-col items-start gap-0.5"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                  {item.parentTaskCode}
                                </span>
                                <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[180px]">
                                  {item.parentTaskTitle}
                                </span>
                              </div>
                              {item.parentProjectName && (
                                <span className="text-[10px] text-muted-foreground truncate">
                                  Dự án: {item.parentProjectName}
                                </span>
                              )}
                            </button>
                          </td>

                          {/* 4. Assignee */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-1.5 text-foreground">
                              <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{item.assignee || '—'}</span>
                            </div>
                          </td>

                          {/* 5. Due Date */}
                          <td className="py-3 px-3.5 text-center tabular-nums text-muted-foreground">
                            {item.dueDate ? (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-rose-500 shrink-0" />
                                {item.dueDate}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>

                          {/* 6. Status Badge */}
                          <td className="py-3 px-3.5 text-center">
                            {item.completed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                Hoàn thành
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                <Clock className="w-3 h-3" />
                                Chưa xong
                              </span>
                            )}
                          </td>

                          {/* 7. Actions */}
                          <td className="py-3 px-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const parent = tasks.find((t) => t.id === item.parentTaskId);
                                  const targetSubtask = parent?.subtasks?.find((s) => s.id === item.subtaskId);
                                  if (targetSubtask) {
                                    setSubtaskToEdit({ taskId: item.parentTaskId, subtask: targetSubtask });
                                    setIsModalOpen(true);
                                  }
                                }}
                                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title="Chỉnh sửa việc con"
                              >
                                <SquarePen className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteSubtask(item.parentTaskId, item.subtaskId, item.subtaskTitle)
                                }
                                className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Xóa việc con"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW 3: KANBAN 2 COLUMNS (Chưa hoàn thành vs Đã hoàn thành) */}
            {viewMode === 'kanban' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1: Chưa hoàn thành */}
                <div className="rounded-2xl border border-border bg-card shadow-xs flex flex-col overflow-hidden">
                  <div className="p-3.5 bg-amber-500/5 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Chưa hoàn thành
                      </h3>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 tabular-nums">
                      {filteredFlattenedSubtasks.filter((s) => !s.completed).length}
                    </span>
                  </div>

                  <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {filteredFlattenedSubtasks
                      .filter((s) => !s.completed)
                      .map((item) => (
                        <div
                          key={`kanban_${item.parentTaskId}_${item.subtaskId}`}
                          className="p-3 rounded-xl border border-border bg-background hover:border-primary/40 shadow-xs space-y-2.5 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className="flex items-start gap-2 cursor-pointer flex-1"
                              onClick={() => handleToggleSubtask(item.parentTaskId, item.subtaskId)}
                            >
                              <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary mt-0.5 shrink-0" />
                              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                {item.subtaskTitle}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => {
                                  const parent = tasks.find((t) => t.id === item.parentTaskId);
                                  const targetSubtask = parent?.subtasks?.find((s) => s.id === item.subtaskId);
                                  if (targetSubtask) {
                                    setSubtaskToEdit({ taskId: item.parentTaskId, subtask: targetSubtask });
                                    setIsModalOpen(true);
                                  }
                                }}
                                className="p-1 rounded text-muted-foreground hover:text-foreground"
                                title="Sửa"
                              >
                                <SquarePen className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteSubtask(item.parentTaskId, item.subtaskId, item.subtaskTitle)
                                }
                                className="p-1 rounded text-muted-foreground hover:text-destructive"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Footer Info */}
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40 text-muted-foreground">
                            <button
                              type="button"
                              onClick={() => {
                                const parent = tasks.find((t) => t.id === item.parentTaskId);
                                if (parent) setSelectedParentTask(parent);
                              }}
                              className="hover:text-primary transition-colors font-medium truncate max-w-[160px]"
                            >
                              [{item.parentTaskCode}] {item.parentTaskTitle}
                            </button>
                            {item.assignee && (
                              <span className="flex items-center gap-1 font-medium text-foreground">
                                <User className="w-3 h-3 text-muted-foreground" />
                                {item.assignee}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Column 2: Đã hoàn thành */}
                <div className="rounded-2xl border border-border bg-card shadow-xs flex flex-col overflow-hidden">
                  <div className="p-3.5 bg-emerald-500/5 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Đã hoàn thành
                      </h3>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 tabular-nums">
                      {filteredFlattenedSubtasks.filter((s) => s.completed).length}
                    </span>
                  </div>

                  <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {filteredFlattenedSubtasks
                      .filter((s) => s.completed)
                      .map((item) => (
                        <div
                          key={`kanban_${item.parentTaskId}_${item.subtaskId}`}
                          className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-xs space-y-2.5 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className="flex items-start gap-2 cursor-pointer flex-1"
                              onClick={() => handleToggleSubtask(item.parentTaskId, item.subtaskId)}
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              <span className="text-xs font-semibold line-through text-muted-foreground">
                                {item.subtaskTitle}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => {
                                  const parent = tasks.find((t) => t.id === item.parentTaskId);
                                  const targetSubtask = parent?.subtasks?.find((s) => s.id === item.subtaskId);
                                  if (targetSubtask) {
                                    setSubtaskToEdit({ taskId: item.parentTaskId, subtask: targetSubtask });
                                    setIsModalOpen(true);
                                  }
                                }}
                                className="p-1 rounded text-muted-foreground hover:text-foreground"
                                title="Sửa"
                              >
                                <SquarePen className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteSubtask(item.parentTaskId, item.subtaskId, item.subtaskTitle)
                                }
                                className="p-1 rounded text-muted-foreground hover:text-destructive"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Footer Info */}
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-500/20 text-muted-foreground">
                            <button
                              type="button"
                              onClick={() => {
                                const parent = tasks.find((t) => t.id === item.parentTaskId);
                                if (parent) setSelectedParentTask(parent);
                              }}
                              className="hover:text-primary transition-colors font-medium truncate max-w-[160px]"
                            >
                              [{item.parentTaskCode}] {item.parentTaskTitle}
                            </button>
                            {item.assignee && (
                              <span className="flex items-center gap-1 font-medium">
                                <User className="w-3 h-3 text-muted-foreground" />
                                {item.assignee}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Subtask Add / Edit Modal */}
      <SubtaskFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSubtaskToEdit(null);
        }}
        onSave={handleSaveSubtask}
        tasks={tasks}
        defaultTaskId={defaultParentTaskId}
        subtaskToEdit={subtaskToEdit}
        employees={employees}
      />

      {/* Parent Task Detail Drawer */}
      {selectedParentTask && (
        <TaskDetailDrawer
          task={selectedParentTask}
          currentIndex={tasks.findIndex((t) => t.id === selectedParentTask.id)}
          totalCount={tasks.length}
          onClose={() => setSelectedParentTask(null)}
          onPrev={() => {
            const idx = tasks.findIndex((t) => t.id === selectedParentTask.id);
            if (idx > 0) setSelectedParentTask(tasks[idx - 1]);
          }}
          onNext={() => {
            const idx = tasks.findIndex((t) => t.id === selectedParentTask.id);
            if (idx < tasks.length - 1) setSelectedParentTask(tasks[idx + 1]);
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          onToggleSubtask={handleToggleSubtask}
          onStatusChange={(taskId, newStatus) => {
            const updated = tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
            updateAndSaveTasks(updated);
          }}
        />
      )}
    </div>
  );
};
