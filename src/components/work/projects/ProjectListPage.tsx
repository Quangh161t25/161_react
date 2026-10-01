import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  LayoutGrid,
  Plus,
  SquarePen,
  Trash2,
  FolderKanban,
  ChartColumn,
  Printer,
  Bookmark,
  Download,
  ChevronDown,
  Tag,
  CircleCheck,
  Wallet,
  Clock,
} from 'lucide-react';
import { Project, ProjectStatus, Task } from '../../../types/task';
import { projectService, taskService } from '../../../services/taskService';
import { ProjectFormDrawer } from './ProjectFormDrawer';
import { ProjectDetailDrawer } from './ProjectDetailDrawer';
import { useAutoSync } from '../../../hooks/useAutoSync';
import { RealtimeSyncBadge } from '../../common/RealtimeSyncBadge';
import { useSettings } from '../../../context/SettingsContext';
import { TablePagination } from '../../common/TablePagination';

interface ProjectListPageProps {
  onBack: () => void;
  onSelectTask?: (task: Task) => void;
}

export const ProjectListPage: React.FC<ProjectListPageProps> = ({
  onBack,
  onSelectTask,
}) => {
  const [projects, setProjects] = useState<Project[]>(() => projectService.getInitialProjects());
  const [tasks, setTasks] = useState<Task[]>(() => taskService.getInitialTasks());

  const [activeTopTab, setActiveTopTab] = useState<'list' | 'stats'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | ProjectStatus>('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Smart Realtime Auto-Sync Hook (25s interval, focus refresh, instant badge)
  const { isSyncing, lastSyncTime, triggerManualSync } = useAutoSync<Project[]>({
    syncFn: async () => {
      const [liveProjs, liveTasks] = await Promise.all([
        projectService.fetchFromSheet().catch(() => projectService.getInitialProjects()),
        taskService.fetchFromSheet().catch(() => taskService.getInitialTasks()),
      ]);
      if (Array.isArray(liveTasks)) setTasks(liveTasks);
      return Array.isArray(liveProjs) ? liveProjs : [];
    },
    onDataReceived: (liveProjs) => {
      if (Array.isArray(liveProjs)) {
        setProjects(liveProjs);
      }
    },
    intervalMs: 25000,
  });

  // Drawers
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<Project | null>(null);
  const [formDrawerState, setFormDrawerState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    project?: Project | null;
  }>({
    isOpen: false,
    mode: 'create',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatMoney = (n: number) => (n ? n.toLocaleString('vi-VN') : '0');

  const handleSaveProject = (payload: Project) => {
    let updated: Project[];
    if (formDrawerState.mode === 'edit') {
      updated = projects.map((p) => (p.id === payload.id ? payload : p));
    } else {
      updated = [payload, ...projects];
    }
    setProjects(updated);
    projectService.saveAllToSheet(updated);
    setFormDrawerState({ isOpen: false, mode: 'create' });
    showToast(`Đã lưu dự án "${payload.name}"!`);
  };

  const handleDeleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    projectService.saveAllToSheet(updated);
    if (selectedProjectForDetail?.id === id) {
      setSelectedProjectForDetail(null);
    }
    showToast('Đã xóa dự án.');
  };

  const handleSyncData = async () => {
    try {
      await triggerManualSync();
      showToast('Đã đồng bộ dự án từ Google Sheet!');
    } catch {
      showToast('Đã tải từ bộ nhớ');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Mã dự án',
      'Tên dự án',
      'Quản lý (PM)',
      'Ngân sách (VNĐ)',
      'Đã giải ngân (VNĐ)',
      'Tiến độ (%)',
      'Trạng thái',
      'Ngày bắt đầu',
      'Hạn chót',
      'Mô tả',
    ];

    const rows = filteredProjects.map((p) => [
      `"${p.code}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.managerName || '').replace(/"/g, '""')}"`,
      p.budget || 0,
      p.spentAmount || 0,
      p.progress || 0,
      `"${p.status}"`,
      p.startDate || '',
      p.endDate || '',
      `"${(p.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `danh_sach_du_an_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV thành công!');
  };

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return projects.filter((p) => {
      if (q) {
        const matchCode = p.code.toLowerCase().includes(q);
        const matchName = p.name.toLowerCase().includes(q);
        const matchPM = (p.managerName || '').toLowerCase().includes(q);
        const matchCust = (p.customerName || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchPM && !matchCust) return false;
      }
      if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
      return true;
    });
  }, [projects, searchQuery, selectedStatus]);

  // User global settings
  const { settings } = useSettings();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(settings.rowsPerPage || 50);

  useEffect(() => {
    if (settings.rowsPerPage) {
      setItemsPerPage(settings.rowsPerPage);
      setCurrentPage(1);
    }
  }, [settings.rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus]);

  // Paginated List for Table & Grid View
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(start, start + itemsPerPage);
  }, [filteredProjects, currentPage, itemsPerPage]);

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Đã hoàn thành
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
            Đang triển khai
          </span>
        );
      case 'on_hold':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Tạm dừng
          </span>
        );
      case 'planning':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-600 border border-slate-500/20">
            Lập kế hoạch
          </span>
        );
    }
  };

  const getStatusLabel = (s: ProjectStatus | 'all') => {
    switch (s) {
      case 'planning': return 'Lập kế hoạch';
      case 'in_progress': return 'Đang triển khai';
      case 'completed': return 'Đã hoàn thành';
      case 'on_hold': return 'Tạm dừng';
      default: return 'Trạng thái';
    }
  };

  // Stats Calculations
  const totalProjects = projects.length;
  const inProgressCount = projects.filter((p) => p.status === 'in_progress').length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-foreground text-background text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CircleCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top View Tabs: Danh sách / Thống kê */}
      <div className="flex items-center gap-1.5 mb-1.5 px-0.5 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTopTab('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'list'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Danh sách dự án</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTopTab('stats')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'stats'
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
          {activeTopTab === 'list' && (
            <div className="px-3 py-2 border-b border-border bg-card">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
                {/* Left: Back button, Search and Dropdowns */}
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
                      placeholder="Tìm kiếm dự án, mã, PM..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Filter: Status */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
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
                    {isStatusDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)} />
                        <div className="absolute left-0 top-full mt-1.5 w-44 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => { setSelectedStatus('all'); setIsStatusDropdownOpen(false); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selectedStatus === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-foreground'}`}
                          >
                            Tất cả trạng thái
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedStatus('planning'); setIsStatusDropdownOpen(false); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-slate-600 ${selectedStatus === 'planning' ? 'bg-slate-500/10 font-semibold' : 'hover:bg-muted'}`}
                          >
                            Lập kế hoạch
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedStatus('in_progress'); setIsStatusDropdownOpen(false); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-blue-600 ${selectedStatus === 'in_progress' ? 'bg-blue-500/10 font-semibold' : 'hover:bg-muted'}`}
                          >
                            Đang triển khai
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedStatus('completed'); setIsStatusDropdownOpen(false); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-emerald-600 ${selectedStatus === 'completed' ? 'bg-emerald-500/10 font-semibold' : 'hover:bg-muted'}`}
                          >
                            Đã hoàn thành
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedStatus('on_hold'); setIsStatusDropdownOpen(false); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-amber-600 ${selectedStatus === 'on_hold' ? 'bg-amber-500/10 font-semibold' : 'hover:bg-muted'}`}
                          >
                            Tạm dừng
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-auto">
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

                  {/* Grid / Table Toggle */}
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                    title={viewMode === 'table' ? 'Xem dạng lưới thẻ' : 'Xem dạng danh sách bảng'}
                    className={`h-8 w-8 flex items-center justify-center border rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>

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

          {/* List View: Grid / Table */}
          {activeTopTab === 'list' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {viewMode === 'grid' ? (
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {paginatedProjects.map((proj) => {
                      const projTasks = tasks.filter(
                        (t) => t.projectId === proj.id || t.projectCode === proj.code
                      );
                      const doneCount = projTasks.filter((t) => t.status === 'completed').length;

                      return (
                        <div
                          key={proj.id}
                          onClick={() => setSelectedProjectForDetail(proj)}
                          className="group bg-card rounded-xl p-4 border border-border hover:border-primary/50 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                {proj.code}
                              </span>
                              {getStatusBadge(proj.status)}
                            </div>

                            <div>
                              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {proj.name}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {proj.description || 'Không có mô tả chi tiết.'}
                              </p>
                            </div>

                            <div className="space-y-1 pt-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Tiến độ</span>
                                <span className="font-bold text-primary tabular-nums">{proj.progress}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-600 rounded-full transition-all duration-300"
                                  style={{ width: `${proj.progress}%` }}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/50 text-muted-foreground">
                              <div>
                                <span className="block text-[11px] opacity-70">PM (Quản trị):</span>
                                <span className="font-semibold text-foreground truncate block">
                                  {proj.managerName} {proj.managerCode ? `(${proj.managerCode})` : ''}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[11px] opacity-70">Ngân sách:</span>
                                <span className="font-bold text-foreground tabular-nums">{formatMoney(proj.budget)} đ</span>
                              </div>
                              <div>
                                <span className="block text-[11px] opacity-70">Đầu việc:</span>
                                <span className="font-semibold text-foreground tabular-nums">{doneCount}/{projTasks.length} xong</span>
                              </div>
                              <div>
                                <span className="block text-[11px] opacity-70">Thời hạn:</span>
                                <span className="font-medium text-foreground tabular-nums">{proj.endDate}</span>
                              </div>
                            </div>
                          </div>

                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pt-2 border-t border-border/50 flex items-center justify-end gap-1"
                          >
                            <button
                              type="button"
                              onClick={() => setFormDrawerState({ isOpen: true, mode: 'edit', project: proj })}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                            >
                              <SquarePen className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Xoá dự án "${proj.name}"?`)) {
                                  handleDeleteProject(proj.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 text-muted-foreground hover:text-rose-600 text-xs flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xoá</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/70 text-[11px] font-bold text-muted-foreground uppercase tracking-wider sticky top-0 z-10">
                        <th className="px-4 py-2.5 bg-muted/95">Mã DA</th>
                        <th className="px-4 py-2.5 bg-muted/95">Tên dự án</th>
                        <th className="px-4 py-2.5 bg-muted/95">Quản lý (PM)</th>
                        <th className="px-4 py-2.5 text-right bg-muted/95">Ngân sách</th>
                        <th className="px-4 py-2.5 text-right bg-muted/95">Đã giải ngân</th>
                        <th className="px-4 py-2.5 text-center bg-muted/95">Tiến độ</th>
                        <th className="px-4 py-2.5 text-center bg-muted/95">Trạng thái</th>
                        <th className="px-4 py-2.5 text-center bg-muted/95">Thời hạn</th>
                        <th className="px-4 py-2.5 text-center bg-muted/95 sticky right-0">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {paginatedProjects.map((p) => (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedProjectForDetail(p)}
                          className="hover:bg-muted/40 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-2.5 font-mono font-bold text-purple-600">{p.code}</td>
                          <td className="px-4 py-2.5 font-semibold text-foreground">{p.name}</td>
                          <td className="px-4 py-2.5 text-foreground">
                            <div className="flex items-center gap-1.5">
                              <span>{p.managerName}</span>
                              {p.managerCode && (
                                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.2 rounded border border-border/50 text-muted-foreground">
                                  {p.managerCode}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{formatMoney(p.budget)} đ</td>
                          <td className="px-4 py-2.5 text-right font-medium text-amber-600 tabular-nums">{formatMoney(p.spentAmount || 0)} đ</td>
                          <td className="px-4 py-2.5 text-center font-bold text-primary tabular-nums">{p.progress}%</td>
                          <td className="px-4 py-2.5 text-center">{getStatusBadge(p.status)}</td>
                          <td className="px-4 py-2.5 text-center tabular-nums text-muted-foreground">{p.endDate}</td>
                          <td
                            onClick={(e) => e.stopPropagation()}
                            className="px-4 py-2.5 text-center sticky right-0 bg-card shadow-[-1px_0_0_0_hsl(var(--border))]"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setFormDrawerState({ isOpen: true, mode: 'edit', project: p })}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                title="Sửa"
                              >
                                <SquarePen className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Xoá dự án "${p.name}"?`)) {
                                    handleDeleteProject(p.id);
                                  }
                                }}
                                className="p-1 rounded hover:bg-rose-50 text-muted-foreground hover:text-rose-600"
                                title="Xoá"
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
              )}

              {/* Table Pagination Footer */}
              <TablePagination
                currentPage={currentPage}
                totalItems={filteredProjects.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemLabel="dự án"
              />
            </div>
          )}

          {/* Stats Tab */}
          {activeTopTab === 'stats' && (
            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 shrink-0">
                    <FolderKanban className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Tổng số dự án</p>
                    <h3 className="text-2xl font-extrabold text-foreground mt-0.5">{totalProjects}</h3>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Đang triển khai</p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <h3 className="text-2xl font-extrabold text-foreground">{inProgressCount}</h3>
                      <span className="text-xs font-medium text-blue-600">
                        {totalProjects > 0 ? Math.round((inProgressCount / totalProjects) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                    <CircleCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Đã hoàn thành</p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <h3 className="text-2xl font-extrabold text-foreground">{completedCount}</h3>
                      <span className="text-xs font-medium text-emerald-600">
                        {totalProjects > 0 ? Math.round((completedCount / totalProjects) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Tổng ngân sách</p>
                    <h3 className="text-xl font-extrabold text-foreground mt-0.5 tabular-nums">
                      {formatMoney(totalBudget)} đ
                    </h3>
                  </div>
                </div>
              </div>

              {/* Progress & Budget Summary */}
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-primary" />
                  Tiến độ & Giải ngân theo từng Dự án
                </h4>
                <div className="space-y-3">
                  {projects.map((p) => (
                    <div key={p.id} className="p-3 rounded-xl border border-border bg-muted/10 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-foreground">{p.name} ({p.code})</span>
                        <span className="text-primary font-bold">{p.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>PM: {p.managerName}</span>
                        <span>Đã giải ngân: {formatMoney(p.spentAmount || 0)} / {formatMoney(p.budget)} đ</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Drawer */}
      {formDrawerState.isOpen && (
        <ProjectFormDrawer
          mode={formDrawerState.mode}
          project={formDrawerState.project}
          allProjects={projects}
          onClose={() => setFormDrawerState({ isOpen: false, mode: 'create' })}
          onSave={handleSaveProject}
        />
      )}

      {/* Detail Drawer */}
      {selectedProjectForDetail && (
        <ProjectDetailDrawer
          project={selectedProjectForDetail}
          allTasks={tasks}
          currentIndex={projects.findIndex((p) => p.id === selectedProjectForDetail.id)}
          totalCount={projects.length}
          onClose={() => setSelectedProjectForDetail(null)}
          onPrev={() => {
            const idx = projects.findIndex((p) => p.id === selectedProjectForDetail.id);
            if (idx > 0) setSelectedProjectForDetail(projects[idx - 1]);
          }}
          onNext={() => {
            const idx = projects.findIndex((p) => p.id === selectedProjectForDetail.id);
            if (idx < projects.length - 1) setSelectedProjectForDetail(projects[idx + 1]);
          }}
          onEdit={(project) => {
            setSelectedProjectForDetail(null);
            setFormDrawerState({ isOpen: true, mode: 'edit', project });
          }}
          onDelete={(id) => {
            handleDeleteProject(id);
            setSelectedProjectForDetail(null);
          }}
          onSelectTask={(task) => onSelectTask?.(task)}
        />
      )}
    </div>
  );
};
