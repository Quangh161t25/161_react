import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  CheckSquare,
  Kanban,
  Calendar as CalendarIcon,
  ChartColumn,
  Plus,
  Trash2,
  SquarePen,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Printer,
  Bookmark,
  Download,
  ChevronDown,
  Tag,
  Briefcase,
  AlertCircle,
  CircleCheck,
  User,
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, Project } from '../../../types/task';
import { Employee } from '../../../types/employee';
import { taskService, projectService } from '../../../services/taskService';
import { employeeService } from '../../../services/employeeService';
import { TaskKanbanView } from './TaskKanbanView';
import { TaskCalendarView } from './TaskCalendarView';
import { TaskStatsTab } from './TaskStatsTab';
import { TaskFormDrawer } from './TaskFormDrawer';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import {
  ColumnCustomizerPopover,
  ColumnItem,
  TableDensity,
} from '../../common/ColumnCustomizerPopover';
import { useAutoSync } from '../../../hooks/useAutoSync';
import { RealtimeSyncBadge } from '../../common/RealtimeSyncBadge';

interface TaskListPageProps {
  onBack: () => void;
  initialViewMode?: 'table' | 'kanban' | 'calendar' | 'stats';
}

export const DEFAULT_TASK_COLUMNS: ColumnItem[] = [
  { id: 'code', label: 'Mã công việc', visible: true, pinned: true, width: 130, align: 'left', wrap: 'truncate' },
  { id: 'title', label: 'Tiêu đề công việc', visible: true, pinned: true, width: 280, align: 'left', wrap: 'truncate' },
  { id: 'status', label: 'Trạng thái', visible: true, width: 150, align: 'center', wrap: 'truncate' },
  { id: 'priority', label: 'Mức ưu tiên', visible: true, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'progress', label: 'Tiến độ', visible: true, width: 150, align: 'left', wrap: 'truncate' },
  { id: 'assigneeName', label: 'Người thực hiện', visible: true, width: 190, align: 'left', wrap: 'truncate' },
  { id: 'projectName', label: 'Dự án', visible: true, width: 200, align: 'left', wrap: 'truncate' },
  { id: 'dueDate', label: 'Hạn chót', visible: true, width: 140, align: 'center', wrap: 'truncate' },
  { id: 'subtasksCount', label: 'Nhiệm vụ con', visible: true, width: 120, align: 'center', wrap: 'truncate' },
  { id: 'department', label: 'Phòng ban', visible: false, width: 160, align: 'left', wrap: 'truncate' },
  { id: 'assignerName', label: 'Người giao việc', visible: false, width: 160, align: 'left', wrap: 'truncate' },
  { id: 'estimatedHours', label: 'Giờ ước tính', visible: false, width: 120, align: 'right', wrap: 'truncate' },
  { id: 'createdAt', label: 'Ngày tạo', visible: false, width: 140, align: 'center', wrap: 'truncate' },
];

export const TaskListPage: React.FC<TaskListPageProps> = ({
  onBack,
  initialViewMode = 'table',
}) => {
  // Data states
  const [tasks, setTasks] = useState<Task[]>(() => taskService.getInitialTasks());
  const [projects, setProjects] = useState<Project[]>(() => projectService.getInitialProjects());
  const [employees, setEmployees] = useState<Employee[]>(() => employeeService.getInitialEmployees());

  // UI view states
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'calendar' | 'stats'>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | TaskStatus>('all');
  const [selectedPriority, setSelectedPriority] = useState<'all' | TaskPriority>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<'all' | string>('all');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<'all' | string>('all');

  // Dropdown popover open states
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);

  // Table Selection & Pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Sync state & Realtime Auto-Sync Hook (25s interval, focus refresh, instant badge)
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const { isSyncing, lastSyncTime, triggerManualSync } = useAutoSync<Task[]>({
    syncFn: async () => {
      const [liveTasks, liveProjects, liveEmps] = await Promise.all([
        taskService.fetchFromSheet().catch(() => taskService.getInitialTasks()),
        projectService.fetchFromSheet().catch(() => projectService.getInitialProjects()),
        employeeService.fetchFromSheet().catch(() => employeeService.getInitialEmployees()),
      ]);
      if (Array.isArray(liveProjects)) setProjects(liveProjects);
      if (Array.isArray(liveEmps) && liveEmps.length > 0) setEmployees(liveEmps);
      return Array.isArray(liveTasks) ? liveTasks : [];
    },
    onDataReceived: (liveTasks) => {
      if (Array.isArray(liveTasks)) {
        setTasks(liveTasks);
      }
    },
    intervalMs: 25000,
  });

  // Drawers
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [formDrawerState, setFormDrawerState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    task?: Task | null;
    defaultStatus?: TaskStatus;
    defaultDate?: string;
  }>({
    isOpen: false,
    mode: 'create',
  });

  // Table Columns & Density Customizer
  const [tableColumns, setTableColumns] = useState<ColumnItem[]>(() => {
    try {
      const saved = localStorage.getItem('erp_task_list_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_TASK_COLUMNS;
  });

  const [tableDensity, setTableDensity] = useState<TableDensity>(() => {
    try {
      return (localStorage.getItem('erp_task_list_density') as TableDensity) || 'normal';
    } catch {
      return 'normal';
    }
  });

  const showToast = (msg: string) => {
    setSyncToastMessage(msg);
    setTimeout(() => setSyncToastMessage(null), 3000);
  };

  // Save changes to tasks
  const handleSaveTask = (taskPayload: Task) => {
    let updated: Task[];
    const isEdit =
      formDrawerState.mode === 'edit' ||
      tasks.some((t) => (taskPayload.code && t.code === taskPayload.code) || t.id === taskPayload.id);

    if (isEdit) {
      updated = tasks.map((t) =>
        (taskPayload.code && t.code === taskPayload.code) || t.id === taskPayload.id
          ? { ...t, ...taskPayload }
          : t
      );
    } else {
      updated = [taskPayload, ...tasks];
    }
    setTasks(updated);
    taskService.saveAllToSheet(updated);
    setFormDrawerState({ isOpen: false, mode: 'create' });
    if (
      (taskPayload.code && selectedTaskForDetail?.code === taskPayload.code) ||
      selectedTaskForDetail?.id === taskPayload.id
    ) {
      setSelectedTaskForDetail(taskPayload);
    }
    showToast(`Đã lưu công việc "${taskPayload.title}"!`);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    taskService.saveAllToSheet(updated);
    if (selectedTaskForDetail?.id === id) {
      setSelectedTaskForDetail(null);
    }
    showToast('Đã xóa công việc.');
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} công việc đã chọn?`)) return;
    const set = new Set(selectedIds);
    const updated = tasks.filter((t) => !set.has(t.id));
    setTasks(updated);
    taskService.saveAllToSheet(updated);
    setSelectedIds([]);
    showToast(`Đã xóa ${selectedIds.length} công việc.`);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId || t.code === taskId) {
        return {
          ...t,
          status: newStatus,
          progress: newStatus === 'completed' ? 100 : t.progress,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      }
      return t;
    });
    setTasks(updated);
    taskService.saveAllToSheet(updated);
    if (selectedTaskForDetail?.id === taskId || selectedTaskForDetail?.code === taskId) {
      setSelectedTaskForDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId || t.code === taskId) {
        const nextSubtasks = (t.subtasks || []).map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        const done = nextSubtasks.filter((s) => s.completed).length;
        const progress = nextSubtasks.length > 0 ? Math.round((done / nextSubtasks.length) * 100) : t.progress;
        return {
          ...t,
          subtasks: nextSubtasks,
          progress,
          status: progress === 100 ? ('completed' as TaskStatus) : t.status,
        };
      }
      return t;
    });
    setTasks(updated);
    taskService.saveAllToSheet(updated);
    if (selectedTaskForDetail?.id === taskId || selectedTaskForDetail?.code === taskId) {
      const found = updated.find((x) => x.id === taskId || x.code === taskId);
      if (found) setSelectedTaskForDetail(found);
    }
  };

  const handleAddComment = (taskId: string, content: string) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextComments = [
          ...(t.comments || []),
          {
            id: 'cm_' + Date.now(),
            author: 'Quản trị viên',
            content,
            createdAt: timeStr,
          },
        ];
        return { ...t, comments: nextComments };
      }
      return t;
    });
    setTasks(updated);
    taskService.saveAllToSheet(updated);
    if (selectedTaskForDetail?.id === taskId) {
      const found = updated.find((x) => x.id === taskId);
      if (found) setSelectedTaskForDetail(found);
    }
  };

  // Sync handler delegating to smart auto-sync
  const handleSyncData = async () => {
    try {
      await triggerManualSync();
      showToast('Đã đồng bộ công việc từ Google Sheet!');
    } catch {
      showToast('Đã tải từ bộ nhớ cục bộ');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Mã công việc',
      'Tiêu đề',
      'Trạng thái',
      'Mức ưu tiên',
      'Tiến độ (%)',
      'Người thực hiện',
      'Dự án',
      'Hạn chót',
      'Phòng ban',
      'Người giao việc',
      'Giờ ước tính',
      'Ngày tạo',
    ];

    const rows = filteredTasks.map((t) => [
      `"${t.code}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.status}"`,
      `"${t.priority}"`,
      t.progress,
      `"${(t.assigneeName || '').replace(/"/g, '""')}"`,
      `"${(t.projectName || '').replace(/"/g, '""')}"`,
      t.dueDate || '',
      `"${(t.department || '').replace(/"/g, '""')}"`,
      `"${(t.assignerName || '').replace(/"/g, '""')}"`,
      t.estimatedHours || 0,
      t.createdAt || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `danh_sach_cong_viec_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV thành công!');
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tasks.filter((t) => {
      if (q) {
        const matchCode = t.code.toLowerCase().includes(q);
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchAssignee = t.assigneeName.toLowerCase().includes(q);
        const matchProj = (t.projectName || '').toLowerCase().includes(q);
        const matchDept = (t.department || '').toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchAssignee && !matchProj && !matchDept) return false;
      }

      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;
      if (selectedProjectId !== 'all' && t.projectId !== selectedProjectId) return false;
      if (selectedAssigneeId !== 'all' && t.assigneeId !== selectedAssigneeId && t.assigneeName !== selectedAssigneeId) return false;

      return true;
    });
  }, [tasks, searchQuery, selectedStatus, selectedPriority, selectedProjectId, selectedAssigneeId]);

  // Paginated Table data
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(start, start + itemsPerPage);
  }, [filteredTasks, currentPage, itemsPerPage]);

  const visibleColumns = useMemo(() => tableColumns.filter((c) => c.visible), [tableColumns]);

  const densityPadding = useMemo(() => {
    switch (tableDensity) {
      case 'compact':
        return 'py-1.5 px-3 text-xs';
      case 'relaxed':
        return 'py-3.5 px-4 text-sm';
      case 'normal':
      default:
        return 'py-2.5 px-3 text-xs';
    }
  }, [tableDensity]);

  const isOverdue = (dueDate: string, status: TaskStatus) => {
    if (status === 'completed' || status === 'cancelled') return false;
    if (!dueDate) return false;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return dueDate < today;
  };

  const getStatusLabel = (s: TaskStatus | 'all') => {
    switch (s) {
      case 'todo': return 'Chưa làm';
      case 'in_progress': return 'Đang làm';
      case 'review': return 'Chờ duyệt';
      case 'completed': return 'Đã xong';
      case 'cancelled': return 'Đã hủy';
      default: return 'Trạng thái';
    }
  };

  const getPriorityLabel = (p: TaskPriority | 'all') => {
    switch (p) {
      case 'urgent': return 'Khẩn cấp';
      case 'high': return 'Ưu tiên cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return 'Mức ưu tiên';
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* Toast Notification */}
      {syncToastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-foreground text-background text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CircleCheck className="w-4 h-4 text-emerald-400" />
          <span>{syncToastMessage}</span>
        </div>
      )}

      {/* Top View Tabs: Danh sách / Kanban / Lịch / Thống kê */}
      <div className="flex items-center gap-1.5 mb-1.5 px-0.5 shrink-0">
        <button
          type="button"
          onClick={() => setViewMode('table')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'table'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Danh sách</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('kanban')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'kanban'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Kanban className="w-3.5 h-3.5" />
          <span>Bảng Kanban</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('calendar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'calendar'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Lịch Deadline</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('stats')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'stats'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <ChartColumn className="w-3.5 h-3.5" />
          <span>Thống kê</span>
        </button>
      </div>

      {/* Main Card Container */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          {/* Header Bar Toolbar */}
          {viewMode !== 'stats' && (
            <div className="px-3 py-2 border-b border-border bg-card">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
                {/* Left: Back button, Search and Dropdown Filters */}
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
                      placeholder="Tìm kiếm công việc, dự án..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Filter: Status */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStatusOpen(!isStatusOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedStatus !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>{getStatusLabel(selectedStatus)}</span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>
                    {isStatusOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsStatusOpen(false)} />
                        <div className="absolute left-0 top-full mt-1.5 w-44 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => { setSelectedStatus('all'); setIsStatusOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selectedStatus === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-foreground'}`}
                          >
                            Tất cả trạng thái
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedStatus('todo'); setIsStatusOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-slate-600 ${selectedStatus === 'todo' ? 'bg-slate-500/10 font-semibold' : 'hover:bg-muted'}`}
                          >
                            Chưa làm
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedStatus('in_progress'); setIsStatusOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-amber-600 ${selectedStatus === 'in_progress' ? 'bg-amber-500/10 font-semibold' : 'hover:bg-muted'}`}
                          >
                            Đang làm
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedStatus('review'); setIsStatusOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-blue-600 ${selectedStatus === 'review' ? 'bg-blue-500/10 font-semibold' : 'hover:bg-muted'}`}
                          >
                            Chờ duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedStatus('completed'); setIsStatusOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-emerald-600 ${selectedStatus === 'completed' ? 'bg-emerald-500/10 font-semibold' : 'hover:bg-muted'}`}
                          >
                            Đã xong
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter: Priority */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedPriority !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{getPriorityLabel(selectedPriority)}</span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>
                    {isPriorityOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsPriorityOpen(false)} />
                        <div className="absolute left-0 top-full mt-1.5 w-44 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => { setSelectedPriority('all'); setIsPriorityOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selectedPriority === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-foreground'}`}
                          >
                            Tất cả mức ưu tiên
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedPriority('urgent'); setIsPriorityOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-rose-600 ${selectedPriority === 'urgent' ? 'bg-rose-500/10 font-semibold' : 'hover:bg-muted'}`}
                          >
                            🔴 Khẩn cấp
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedPriority('high'); setIsPriorityOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-amber-600 ${selectedPriority === 'high' ? 'bg-amber-500/10 font-semibold' : 'hover:bg-muted'}`}
                          >
                            🟠 Ưu tiên cao
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedPriority('medium'); setIsPriorityOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-blue-600 ${selectedPriority === 'medium' ? 'bg-blue-500/10 font-semibold' : 'hover:bg-muted'}`}
                          >
                            🔵 Trung bình
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedPriority('low'); setIsPriorityOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-slate-600 ${selectedPriority === 'low' ? 'bg-slate-500/10 font-semibold' : 'hover:bg-muted'}`}
                          >
                            ⚪ Thấp
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter: Project */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsProjectOpen(!isProjectOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedProjectId !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[120px]">
                        {selectedProjectId === 'all'
                          ? 'Dự án'
                          : projects.find((p) => p.id === selectedProjectId)?.name || 'Dự án'}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>
                    {isProjectOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsProjectOpen(false)} />
                        <div className="absolute left-0 top-full mt-1.5 w-56 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5 max-h-60 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => { setSelectedProjectId('all'); setIsProjectOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selectedProjectId === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-foreground'}`}
                          >
                            Tất cả dự án
                          </button>
                          {projects.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => { setSelectedProjectId(p.id); setIsProjectOpen(false); setCurrentPage(1); }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate ${selectedProjectId === p.id ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-foreground'}`}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter: Assignee */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedAssigneeId !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[130px]">
                        {selectedAssigneeId === 'all'
                          ? 'Người thực hiện'
                          : (() => {
                              const emp = employees.find((e) => e.id === selectedAssigneeId || e.code === selectedAssigneeId || e.name === selectedAssigneeId);
                              return emp ? `${emp.name} (${emp.code || emp.id})` : 'Người thực hiện';
                            })()}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>
                    {isAssigneeOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsAssigneeOpen(false)} />
                        <div className="absolute left-0 top-full mt-1.5 w-64 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                          <button
                            type="button"
                            onClick={() => { setSelectedAssigneeId('all'); setIsAssigneeOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selectedAssigneeId === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-foreground'}`}
                          >
                            Tất cả người thực hiện
                          </button>
                          {employees.map((e) => (
                            <button
                              key={e.id}
                              type="button"
                              onClick={() => { setSelectedAssigneeId(e.id); setIsAssigneeOpen(false); setCurrentPage(1); }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate flex items-center justify-between gap-1.5 ${selectedAssigneeId === e.id ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-foreground'}`}
                            >
                              <span className="truncate">{e.name}</span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded shrink-0 ${selectedAssigneeId === e.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                {e.code || e.id}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-auto">
                  {/* Bulk Delete */}
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      className="h-8 px-2.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 animate-in fade-in"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa ({selectedIds.length})</span>
                    </button>
                  )}

                  {/* Google Sheets Realtime Smart Sync Badge */}
                  <RealtimeSyncBadge
                    isSyncing={isSyncing}
                    lastSyncTime={lastSyncTime}
                    onSync={handleSyncData}
                  />

                  {/* Print */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    title="In danh sách"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  {/* Bookmark */}
                  <button
                    type="button"
                    title="Ghim mục"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>

                  {/* Column Customizer Popover */}
                  {viewMode === 'table' && (
                    <ColumnCustomizerPopover
                      columns={tableColumns}
                      onChangeColumns={(cols: ColumnItem[]) => {
                        setTableColumns(cols);
                        try {
                          localStorage.setItem('erp_task_list_columns', JSON.stringify(cols));
                        } catch {}
                      }}
                      density={tableDensity}
                      onChangeDensity={(den: TableDensity) => {
                        setTableDensity(den);
                        try {
                          localStorage.setItem('erp_task_list_density', den);
                        } catch {}
                      }}
                      onReset={() => {
                        setTableColumns(DEFAULT_TASK_COLUMNS);
                        setTableDensity('normal');
                        try {
                          localStorage.removeItem('erp_task_list_columns');
                          localStorage.removeItem('erp_task_list_density');
                        } catch {}
                      }}
                      align="right"
                    />
                  )}

                  {/* Export CSV */}
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    title="Xuất file CSV"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Add Button */}
                  <button
                    type="button"
                    onClick={() => setFormDrawerState({ isOpen: true, mode: 'create' })}
                    className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Views Area */}
          {viewMode === 'kanban' && (
            <div className="flex-1 min-h-0 flex flex-col p-2 overflow-y-auto">
              <TaskKanbanView
                tasks={filteredTasks}
                onSelectTask={(task) => setSelectedTaskForDetail(task)}
                onStatusChange={handleStatusChange}
                onAddNewTask={(st) =>
                  setFormDrawerState({ isOpen: true, mode: 'create', defaultStatus: st || 'todo' })
                }
              />
            </div>
          )}

          {viewMode === 'calendar' && (
            <div className="flex-1 min-h-0 flex flex-col p-2 overflow-y-auto">
              <TaskCalendarView
                tasks={filteredTasks}
                onSelectTask={(task) => setSelectedTaskForDetail(task)}
                onAddNewTask={(date) =>
                  setFormDrawerState({ isOpen: true, mode: 'create', defaultDate: date })
                }
              />
            </div>
          )}

          {viewMode === 'stats' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <TaskStatsTab tasks={filteredTasks} />
            </div>
          )}

          {viewMode === 'table' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* Table Body */}
              <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/70 text-[11px] font-bold text-muted-foreground uppercase tracking-wider sticky top-0 z-10">
                      <th className="w-10 px-3 py-2.5 text-center bg-muted/95">
                        <input
                          type="checkbox"
                          checked={
                            paginatedTasks.length > 0 &&
                            selectedIds.length === paginatedTasks.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(paginatedTasks.map((t) => t.id));
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                          className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                        />
                      </th>

                      {visibleColumns.map((col) => (
                        <th
                          key={col.id}
                          style={{ width: col.width || 150, minWidth: col.width || 150 }}
                          className={`px-3 py-2.5 bg-muted/95 ${
                            col.align === 'center'
                              ? 'text-center'
                              : col.align === 'right'
                              ? 'text-right'
                              : 'text-left'
                          }`}
                        >
                          {col.label}
                        </th>
                      ))}

                      <th className="w-24 px-3 py-2.5 text-center sticky right-0 bg-muted/95 shadow-[-1px_0_0_0_hsl(var(--border))]">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/60">
                    {paginatedTasks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={visibleColumns.length + 2}
                          className="py-12 text-center text-xs text-muted-foreground"
                        >
                          <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          Không tìm thấy công việc nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      paginatedTasks.map((item) => {
                        const isSelected = selectedIds.includes(item.id);
                        const overdue = isOverdue(item.dueDate, item.status);
                        const subtasksDone = (item.subtasks || []).filter((s) => s.completed).length;
                        const subtasksTotal = (item.subtasks || []).length;

                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedTaskForDetail(item)}
                            className={`hover:bg-muted/40 transition-colors cursor-pointer ${
                              isSelected ? 'bg-primary/5' : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <td
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 text-center"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedIds((prev) =>
                                    prev.includes(item.id)
                                      ? prev.filter((x) => x !== item.id)
                                      : [...prev, item.id]
                                  );
                                }}
                                className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                              />
                            </td>

                            {/* Dynamic Cells */}
                            {visibleColumns.map((col) => {
                              if (col.id === 'code') {
                                return (
                                  <td key={col.id} className={`${densityPadding} font-mono font-bold text-primary`}>
                                    {item.code}
                                  </td>
                                );
                              }
                              if (col.id === 'title') {
                                return (
                                  <td key={col.id} className={`${densityPadding}`}>
                                    <div className="font-semibold text-foreground truncate max-w-[260px]">
                                      {item.title}
                                    </div>
                                  </td>
                                );
                              }
                              if (col.id === 'status') {
                                return (
                                  <td key={col.id} className={`${densityPadding} text-center`}>
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                        item.status === 'completed'
                                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                          : item.status === 'in_progress'
                                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                          : item.status === 'review'
                                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                          : 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                                      }`}
                                    >
                                      {item.status === 'completed'
                                        ? 'Đã xong'
                                        : item.status === 'in_progress'
                                        ? 'Đang làm'
                                        : item.status === 'review'
                                        ? 'Chờ duyệt'
                                        : 'Chưa làm'}
                                    </span>
                                  </td>
                                );
                              }
                              if (col.id === 'priority') {
                                return (
                                  <td key={col.id} className={`${densityPadding} text-center`}>
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                        item.priority === 'urgent'
                                          ? 'bg-rose-500/10 text-rose-600'
                                          : item.priority === 'high'
                                          ? 'bg-amber-500/10 text-amber-600'
                                          : item.priority === 'medium'
                                          ? 'bg-blue-500/10 text-blue-600'
                                          : 'bg-muted text-muted-foreground'
                                      }`}
                                    >
                                      {item.priority === 'urgent'
                                        ? 'Khẩn cấp'
                                        : item.priority === 'high'
                                        ? 'Cao'
                                        : item.priority === 'medium'
                                        ? 'Trung bình'
                                        : 'Thấp'}
                                    </span>
                                  </td>
                                );
                              }
                              if (col.id === 'progress') {
                                return (
                                  <td key={col.id} className={`${densityPadding}`}>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            item.progress === 100
                                              ? 'bg-emerald-500'
                                              : item.progress > 50
                                              ? 'bg-primary'
                                              : 'bg-amber-500'
                                          }`}
                                          style={{ width: `${item.progress}%` }}
                                        />
                                      </div>
                                      <span className="text-[11px] font-semibold tabular-nums text-foreground w-8 text-right">
                                        {item.progress}%
                                      </span>
                                    </div>
                                  </td>
                                );
                              }
                              if (col.id === 'assigneeName') {
                                return (
                                  <td key={col.id} className={`${densityPadding}`}>
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="font-medium text-foreground truncate">
                                        {item.assigneeName || 'Chưa giao'}
                                      </span>
                                      {item.assigneeCode && (
                                        <span className="text-[10px] font-mono bg-muted px-1.5 py-0.2 rounded border border-border/50 text-muted-foreground shrink-0">
                                          {item.assigneeCode}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                );
                              }
                              if (col.id === 'projectName') {
                                return (
                                  <td key={col.id} className={`${densityPadding}`}>
                                    <span className="text-muted-foreground truncate block">
                                      {item.projectName || '—'}
                                    </span>
                                  </td>
                                );
                              }
                              if (col.id === 'dueDate') {
                                return (
                                  <td key={col.id} className={`${densityPadding} text-center`}>
                                    <span
                                      className={`tabular-nums text-[11px] ${
                                        overdue ? 'text-rose-600 font-bold' : 'text-foreground'
                                      }`}
                                    >
                                      {item.dueDate}
                                    </span>
                                  </td>
                                );
                              }
                              if (col.id === 'subtasksCount') {
                                return (
                                  <td key={col.id} className={`${densityPadding} text-center tabular-nums`}>
                                    {subtasksTotal > 0 ? `${subtasksDone}/${subtasksTotal}` : '—'}
                                  </td>
                                );
                              }
                              return (
                                <td key={col.id} className={`${densityPadding}`}>
                                  {(item as any)[col.id] || '—'}
                                </td>
                              );
                            })}

                            {/* Actions */}
                            <td
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-2 text-center sticky right-0 bg-card shadow-[-1px_0_0_0_hsl(var(--border))]"
                            >
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormDrawerState({ isOpen: true, mode: 'edit', task: item })
                                  }
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title="Sửa"
                                >
                                  <SquarePen className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Xoá công việc "${item.title}"?`)) {
                                      handleDeleteTask(item.id);
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 text-muted-foreground hover:text-rose-600 transition-colors"
                                  title="Xoá"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-border bg-muted/20 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Hiển thị</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-7 px-2 rounded-md border border-border bg-background text-foreground text-xs"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                  </select>
                  <span>/ {filteredTasks.length} dòng</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30"
                    title="Trang đầu"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30"
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-semibold text-foreground">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30"
                    title="Trang sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30"
                    title="Trang cuối"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Drawer */}
      {formDrawerState.isOpen && (
        <TaskFormDrawer
          mode={formDrawerState.mode}
          task={formDrawerState.task}
          allTasks={tasks}
          defaultStatus={formDrawerState.defaultStatus}
          defaultDate={formDrawerState.defaultDate}
          onClose={() => setFormDrawerState({ isOpen: false, mode: 'create' })}
          onSave={handleSaveTask}
        />
      )}

      {/* Detail Drawer */}
      {selectedTaskForDetail && (
        <TaskDetailDrawer
          task={selectedTaskForDetail}
          currentIndex={tasks.findIndex((t) => t.id === selectedTaskForDetail.id)}
          totalCount={tasks.length}
          onClose={() => setSelectedTaskForDetail(null)}
          onPrev={() => {
            const idx = tasks.findIndex((t) => t.id === selectedTaskForDetail.id);
            if (idx > 0) setSelectedTaskForDetail(tasks[idx - 1]);
          }}
          onNext={() => {
            const idx = tasks.findIndex((t) => t.id === selectedTaskForDetail.id);
            if (idx < tasks.length - 1) setSelectedTaskForDetail(tasks[idx + 1]);
          }}
          onEdit={(task) => {
            setSelectedTaskForDetail(null);
            setFormDrawerState({ isOpen: true, mode: 'edit', task });
          }}
          onDelete={(id) => {
            handleDeleteTask(id);
            setSelectedTaskForDetail(null);
          }}
          onToggleSubtask={handleToggleSubtask}
          onStatusChange={handleStatusChange}
          onAddComment={handleAddComment}
        />
      )}
    </div>
  );
};
