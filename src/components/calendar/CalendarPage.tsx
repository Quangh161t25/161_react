import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  CheckSquare,
  FolderKanban,
  Wallet,
  Cake,
  BookOpen,
  ArrowLeft,
  ChartColumn,
  Download,
  RefreshCw,
  Printer,
  ChevronDown,
  Check,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import {
  CalendarEvent,
  CalendarEventSource,
  CalendarViewMode,
} from '../../types/calendar';
import { calendarService } from '../../services/calendarService';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CalendarMonthView } from './CalendarMonthView';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarDayView } from './CalendarDayView';
import { CalendarAgendaView } from './CalendarAgendaView';
import { CalendarStatsTab } from './CalendarStatsTab';
import { EventDetailModal } from './EventDetailModal';
import { EventFormModal } from './EventFormModal';

import { NoteDetailDrawer } from '../notes/NoteDetailDrawer';
import { EmployeeDetailDrawer } from '../employee/EmployeeDetailDrawer';
import { TaskDetailDrawer } from '../work/tasks/TaskDetailDrawer';
import { ProjectDetailDrawer } from '../work/projects/ProjectDetailDrawer';
import { CashTransactionDetailDrawer } from '../finance/CashTransactionDetailDrawer';
import { CostProposalDetailDrawer } from '../finance/CostProposalDetailDrawer';

import { Note } from '../../types/note';
import { Employee } from '../../types/employee';
import { Task, Project, TaskStatus } from '../../types/task';
import { CashTransaction } from '../../types/cashTransaction';
import { CostProposal } from '../../types/cost-proposal';

import { noteService } from '../../services/noteService';
import { employeeService } from '../../services/employeeService';
import { taskService, projectService } from '../../services/taskService';
import { cashTransactionService } from '../../services/cashTransactionService';
import { googleSheetsService } from '../../services/googleSheetsService';

interface CalendarPageProps {
  onBack?: () => void;
  onNavigate?: (path: string) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  onBack,
  onNavigate,
}) => {
  // Top Tabs: 'list' (Lịch biểu) | 'stats' (Thống kê)
  const [activeTopTab, setActiveTopTab] = useState<'list' | 'stats'>('list');

  const isMobile = useIsMobile();

  // Current view date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  // Trên điện thoại: mặc định kiểu xem Lịch biểu danh sách ('agenda'), trên máy tính: 'month'
  const [viewMode, setViewMode] = useState<CalendarViewMode>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'agenda' : 'month'
  );

  // Tự động đồng bộ kiểu xem tương thích khi chuyển đổi giữa điện thoại và máy tính
  useEffect(() => {
    if (isMobile) {
      setViewMode((prev) => (prev === 'month' || prev === 'week' ? 'agenda' : prev));
    } else {
      setViewMode((prev) => (prev === 'agenda' ? 'month' : prev));
    }
  }, [isMobile]);

  // Aggregated events data
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>(() =>
    calendarService.aggregateAllEvents()
  );

  // Filters & Dropdowns
  const [searchQuery, setSearchQuery] = useState('');
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [selectedSources, setSelectedSources] = useState<CalendarEventSource[]>([
    'work_task',
    'work_project',
    'finance_proposal',
    'finance_cash',
    'hr_birthday',
    'note',
    'custom',
  ]);

  // Modals & UI States
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Module-specific detail drawer states
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [allNotesList, setAllNotesList] = useState<Note[]>([]);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [allEmployeesList, setAllEmployeesList] = useState<Employee[]>([]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [allTasksList, setAllTasksList] = useState<Task[]>([]);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [allProjectsList, setAllProjectsList] = useState<Project[]>([]);

  const [selectedCashTx, setSelectedCashTx] = useState<CashTransaction | null>(null);
  const [allCashTxsList, setAllCashTxsList] = useState<CashTransaction[]>([]);

  const [selectedProposal, setSelectedProposal] = useState<CostProposal | null>(null);
  const [allProposalsList, setAllProposalsList] = useState<CostProposal[]>([]);

  const [selectedCustomEvent, setSelectedCustomEvent] = useState<CalendarEvent | null>(null);

  // Active Creation Form Drawer
  const [activeAddDrawer, setActiveAddDrawer] = useState<'meeting' | 'note' | 'task' | 'cash' | 'proposal' | null>(null);
  const [addDrawerDate, setAddDrawerDate] = useState<string>('');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  const closeAllDrawers = useCallback(() => {
    setSelectedNote(null);
    setSelectedEmployee(null);
    setSelectedTask(null);
    setSelectedProject(null);
    setSelectedCashTx(null);
    setSelectedProposal(null);
    setSelectedCustomEvent(null);
    setActiveAddDrawer(null);
  }, []);

  const openAddDrawer = useCallback((mod: 'meeting' | 'note' | 'task' | 'cash' | 'proposal', dateStr?: string) => {
    closeAllDrawers();
    setAddDrawerDate(dateStr || currentDate.toISOString().slice(0, 10));
    setActiveAddDrawer(mod);
  }, [closeAllDrawers, currentDate]);

  const handleSelectEvent = useCallback((evt: CalendarEvent) => {
    closeAllDrawers();

    // 1. Ghi chú (Note)
    if (evt.source === 'note') {
      const notes = noteService.getInitialNotes();
      setAllNotesList(notes);
      const rawId = evt.id.startsWith('note_') ? evt.id.replace('note_', '') : evt.id;
      const found = notes.find((n) => n.id === rawId || (evt.sourceId && n.code === evt.sourceId));
      if (found) {
        setSelectedNote(found);
        return;
      }
    }

    // 2. Nhân sự & Sinh nhật (Employee / Birthday)
    if (evt.source === 'hr_birthday' || evt.source === 'hr_event') {
      const emps = employeeService.getInitialEmployees();
      setAllEmployeesList(emps);
      const rawId = evt.id.startsWith('emp_birth_')
        ? evt.id.replace('emp_birth_', '')
        : evt.id.startsWith('emp_start_')
        ? evt.id.replace('emp_start_', '')
        : evt.id;
      const found = emps.find((e) => e.id === rawId || (evt.sourceId && e.code === evt.sourceId));
      if (found) {
        setSelectedEmployee(found);
        return;
      }
    }

    // 3. Công việc (Task)
    if (evt.source === 'work_task') {
      const tasks = taskService.getInitialTasks();
      setAllTasksList(tasks);
      const rawId = evt.id.startsWith('task_due_') ? evt.id.replace('task_due_', '') : evt.id;
      const found = tasks.find((t) => t.id === rawId || (evt.sourceId && t.code === evt.sourceId));
      if (found) {
        setSelectedTask(found);
        return;
      }
    }

    // 4. Dự án (Project)
    if (evt.source === 'work_project') {
      const projs = projectService.getInitialProjects();
      const tasks = taskService.getInitialTasks();
      setAllProjectsList(projs);
      setAllTasksList(tasks);
      const rawId = evt.id.startsWith('proj_end_') ? evt.id.replace('proj_end_', '') : evt.id;
      const found = projs.find((p) => p.id === rawId || (evt.sourceId && p.code === evt.sourceId));
      if (found) {
        setSelectedProject(found);
        return;
      }
    }

    // 5. Phiếu thu / chi (Finance Cash Transaction)
    if (evt.source === 'finance_cash') {
      const txs = cashTransactionService.getInitialTransactions();
      setAllCashTxsList(txs);
      const rawId = evt.id.startsWith('tx_') ? evt.id.replace('tx_', '') : evt.id;
      const found = txs.find((t) => t.id === rawId || (evt.sourceId && t.code === evt.sourceId));
      if (found) {
        setSelectedCashTx(found);
        return;
      }
    }

    // 6. Đề xuất chi phí (Finance Cost Proposal)
    if (evt.source === 'finance_proposal') {
      const props = googleSheetsService.getInitialProposals();
      setAllProposalsList(props);
      const rawId = evt.id.startsWith('prop_') ? evt.id.replace('prop_', '') : evt.id;
      const found = props.find((p) => p.id === rawId || (evt.sourceId && p.code === evt.sourceId));
      if (found) {
        setSelectedProposal(found);
        return;
      }
    }

    // Mặc định: Sự kiện lịch họp riêng (Custom Event)
    setSelectedCustomEvent(evt);
  }, [closeAllDrawers]);

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = allTasksList.map((t) => {
      if (t.id === taskId) {
        const subtasks = (t.subtasks || []).map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...t, subtasks };
      }
      return t;
    });
    taskService.saveToCache(updated);
    setAllTasksList(updated);
    if (selectedTask && selectedTask.id === taskId) {
      const cur = updated.find((t) => t.id === taskId);
      if (cur) setSelectedTask(cur);
    }
  };

  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const updated = allTasksList.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    taskService.saveToCache(updated);
    setAllTasksList(updated);
    if (selectedTask && selectedTask.id === taskId) {
      const cur = updated.find((t) => t.id === taskId);
      if (cur) setSelectedTask(cur);
    }
    setAllEvents(calendarService.aggregateAllEvents());
  };

  const handleAddTaskComment = (taskId: string, content: string) => {
    const newComment = {
      id: `cm_${Date.now()}`,
      author: 'Tôi',
      content,
      createdAt: new Date().toISOString(),
    };
    const updated = allTasksList.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          comments: [...(t.comments || []), newComment],
        };
      }
      return t;
    });
    taskService.saveToCache(updated);
    setAllTasksList(updated);
    if (selectedTask && selectedTask.id === taskId) {
      const cur = updated.find((t) => t.id === taskId);
      if (cur) setSelectedTask(cur);
    }
  };

  // Re-aggregate on mount
  useEffect(() => {
    setAllEvents(calendarService.aggregateAllEvents());
  }, []);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0 - 11

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else if (viewMode === 'day') {
      next.setDate(next.getDate() - 1);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else if (viewMode === 'day') {
      next.setDate(next.getDate() + 1);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const fresh = calendarService.aggregateAllEvents();
      setAllEvents(fresh);
      setIsRefreshing(false);
      showToast(`Đã làm mới dữ liệu (${fresh.length} sự kiện từ các phân hệ)`);
    }, 400);
  };

  const handleSaveCustomEvent = (newEvent: CalendarEvent) => {
    calendarService.addCustomEvent(newEvent);
    const fresh = calendarService.aggregateAllEvents();
    setAllEvents(fresh);
    showToast(`Đã lưu sự kiện "${newEvent.title}"`);
  };

  const handleDeleteCustomEvent = (id: string) => {
    calendarService.deleteCustomEvent(id);
    const fresh = calendarService.aggregateAllEvents();
    setAllEvents(fresh);
    showToast('Đã xóa sự kiện thành công');
  };

  const toggleSource = (source: CalendarEventSource) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const selectAllSources = () => {
    setSelectedSources([
      'work_task',
      'work_project',
      'finance_proposal',
      'finance_cash',
      'hr_birthday',
      'note',
      'custom',
    ]);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((evt) => {
      if (!selectedSources.includes(evt.source)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = evt.title.toLowerCase().includes(q);
        const matchDesc = (evt.description || '').toLowerCase().includes(q);
        const matchCat = evt.categoryName.toLowerCase().includes(q);
        const matchPerson = (evt.assigneeName || '').toLowerCase().includes(q);
        const matchId = (evt.sourceId || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat && !matchPerson && !matchId) return false;
      }

      return true;
    });
  }, [allEvents, selectedSources, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Tiêu đề',
      'Phân hệ',
      'Ngày bắt đầu',
      'Ngày kết thúc',
      'Thời gian',
      'Người phụ trách',
      'Địa điểm',
      'Mô tả',
    ];

    const rows = filteredEvents.map((e) => [
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${e.categoryName || ''}"`,
      e.startDate || '',
      e.endDate || '',
      e.time || (e.allDay ? 'Cả ngày' : ''),
      `"${(e.assigneeName || '').replace(/"/g, '""')}"`,
      `"${(e.location || '').replace(/"/g, '""')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `danh_sach_lich_trinh_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV thành công!');
  };

  const monthNames = [
    'Tháng 01', 'Tháng 02', 'Tháng 03', 'Tháng 04', 'Tháng 05', 'Tháng 06',
    'Tháng 07', 'Tháng 08', 'Tháng 09', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const sourceOptions: {
    id: CalendarEventSource;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }[] = [
    { id: 'work_task', label: 'Công việc & Nhiệm vụ', icon: CheckSquare, color: 'text-blue-500' },
    { id: 'work_project', label: 'Dự án & Giai đoạn', icon: FolderKanban, color: 'text-cyan-500' },
    { id: 'finance_proposal', label: 'Đề xuất tài chính', icon: Wallet, color: 'text-emerald-500' },
    { id: 'finance_cash', label: 'Phiếu thu & Chi tiền', icon: Wallet, color: 'text-emerald-500' },
    { id: 'hr_birthday', label: 'Sinh nhật Nhân sự', icon: Cake, color: 'text-pink-500' },
    { id: 'custom', label: 'Lịch họp nội bộ', icon: CalendarIcon, color: 'text-amber-500' },
    { id: 'note', label: 'Ghi chú công tác', icon: BookOpen, color: 'text-purple-500' },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-foreground text-background text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top View Tabs: Lịch biểu / Thống kê */}
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
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Lịch biểu</span>
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
                {/* Left: Back button, Search, Date Navigator, Source Filter */}
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
                      placeholder="Tìm kiếm sự kiện, công việc, sinh nhật..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Date Navigation Group */}
                  <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-0.5 h-8 shrink-0">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Trước"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleToday}
                      className="h-7 px-2 flex items-center justify-center rounded-md hover:bg-muted text-xs font-medium text-foreground transition-colors"
                    >
                      Hôm nay
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Sau"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-4 w-px bg-border mx-0.5" />
                    <span className="text-xs font-semibold text-foreground px-2 whitespace-nowrap">
                      {monthNames[currentMonth]}, {currentYear}
                    </span>
                  </div>

                  {/* Filter: Nguồn Phân hệ Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedSources.length < 7
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>
                        {selectedSources.length === 7
                          ? 'Tất cả phân hệ'
                          : `Phân hệ (${selectedSources.length})`}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>

                    {isSourceDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsSourceDropdownOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-1.5 w-60 bg-card border border-border rounded-xl shadow-xl z-50 p-1.5 space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              selectAllSources();
                              setIsSourceDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                              selectedSources.length === 7
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            <span>Tất cả phân hệ</span>
                            {selectedSources.length === 7 && <Check className="w-3.5 h-3.5" />}
                          </button>
                          <div className="h-px bg-border my-1" />
                          {sourceOptions.map((opt) => {
                            const isChecked = selectedSources.includes(opt.id);
                            const IconComp = opt.icon;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleSource(opt.id)}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between hover:bg-muted text-foreground"
                              >
                                <div className="flex items-center gap-2">
                                  <IconComp className={`w-3.5 h-3.5 ${opt.color}`} />
                                  <span>{opt.label}</span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-3.5 h-3.5 rounded border-border text-primary pointer-events-none"
                                />
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: View Mode switcher (Tháng / Tuần / Ngày / Lịch biểu), Refresh, Print, Export CSV, Add */}
                <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-auto">
                  {/* View Mode Switcher */}
                  <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50 h-8">
                    <button
                      type="button"
                      onClick={() => setViewMode('month')}
                      className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all ${
                        viewMode === 'month'
                          ? 'bg-card text-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Tháng
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('week')}
                      className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all ${
                        viewMode === 'week'
                          ? 'bg-card text-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Tuần
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('day')}
                      className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all ${
                        viewMode === 'day'
                          ? 'bg-card text-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('agenda')}
                      className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all ${
                        viewMode === 'agenda'
                          ? 'bg-card text-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Lịch biểu
                    </button>
                  </div>

                  {/* Refresh Live Events */}
                  <button
                    type="button"
                    onClick={handleRefresh}
                    title="Làm mới dữ liệu các phân hệ"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>

                  {/* Print */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    title="In lịch"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Printer className="w-3.5 h-3.5" />
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

                  {/* Add Event Button with Module Dropdown */}
                  <div className="relative">
                    <div className="inline-flex rounded-lg shadow-sm">
                      <button
                        type="button"
                        onClick={() => openAddDrawer('meeting')}
                        className="h-8 px-2.5 rounded-l-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                        className="h-8 px-1.5 rounded-r-lg bg-primary hover:bg-primary/90 text-primary-foreground border-l border-primary-foreground/20 flex items-center justify-center transition-all"
                        title="Chọn phân hệ muốn thêm"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {isAddMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsAddMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-1.5 w-52 bg-card border border-border rounded-xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in-0 zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddMenuOpen(false);
                              openAddDrawer('task');
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-muted text-foreground flex items-center gap-2 transition-colors"
                          >
                            <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                            <span>Thêm Công việc mới</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsAddMenuOpen(false);
                              openAddDrawer('note');
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-muted text-foreground flex items-center gap-2 transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                            <span>Thêm Ghi chú mới</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsAddMenuOpen(false);
                              openAddDrawer('cash');
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-muted text-foreground flex items-center gap-2 transition-colors"
                          >
                            <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Thêm Phiếu Thu / Chi</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsAddMenuOpen(false);
                              openAddDrawer('proposal');
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-muted text-foreground flex items-center gap-2 transition-colors"
                          >
                            <Layers className="w-3.5 h-3.5 text-teal-500" />
                            <span>Thêm Đề xuất chi phí</span>
                          </button>

                          <div className="h-px bg-border my-1" />

                          <button
                            type="button"
                            onClick={() => {
                              setIsAddMenuOpen(false);
                              openAddDrawer('meeting');
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-muted text-foreground flex items-center gap-2 transition-colors"
                          >
                            <CalendarIcon className="w-3.5 h-3.5 text-amber-500" />
                            <span>Lịch họp & Sự kiện</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Views Content */}
          {activeTopTab === 'list' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {viewMode === 'month' && (
                <CalendarMonthView
                  year={currentYear}
                  month={currentMonth}
                  events={filteredEvents}
                  onSelectEvent={handleSelectEvent}
                  onAddEventForDate={(dateStr) => openAddDrawer('meeting', dateStr)}
                  onSelectDate={(date) => {
                    setCurrentDate(date);
                    setViewMode('day');
                  }}
                />
              )}

              {viewMode === 'week' && (
                <CalendarWeekView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onSelectEvent={handleSelectEvent}
                  onAddEventForDate={(dateStr) => openAddDrawer('meeting', dateStr)}
                  onSelectDate={(date) => {
                    setCurrentDate(date);
                    setViewMode('day');
                  }}
                />
              )}

              {viewMode === 'day' && (
                <CalendarDayView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onSelectEvent={handleSelectEvent}
                  onAddEventForDate={(dateStr) => openAddDrawer('meeting', dateStr)}
                />
              )}

              {viewMode === 'agenda' && (
                <CalendarAgendaView
                  events={filteredEvents}
                  onSelectEvent={handleSelectEvent}
                  onNavigateToModule={onNavigate}
                />
              )}
            </div>
          )}

          {/* Stats Tab Content */}
          {activeTopTab === 'stats' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <CalendarStatsTab
                events={allEvents}
                currentDate={currentDate}
                onNavigateToModule={onNavigate}
              />
            </div>
          )}
        </div>
      </div>

      {/* Module Detail Drawers */}
      {selectedNote && (
        <NoteDetailDrawer
          isOpen={!!selectedNote}
          note={selectedNote}
          allNotes={allNotesList}
          currentIndex={Math.max(0, allNotesList.findIndex((n) => n.id === selectedNote.id))}
          totalCount={allNotesList.length}
          onClose={() => setSelectedNote(null)}
          onNavigate={(nextNote) => setSelectedNote(nextNote)}
          onEdit={() => {
            setSelectedNote(null);
            if (onNavigate) onNavigate('/ghi-chu');
          }}
          onDelete={(noteId) => {
            const updated = allNotesList.filter((n) => n.id !== noteId);
            noteService.saveToCache(updated);
            const target = allNotesList.find((n) => n.id === noteId);
            if (target?.code) {
              noteService.deleteFromSheet(target.code);
            }
            setAllNotesList(updated);
            setSelectedNote(null);
            setAllEvents(calendarService.aggregateAllEvents());
            showToast('Đã xóa ghi chú');
          }}
          onTogglePin={(noteId) => {
            const updated = allNotesList.map((n) => {
              if (n.id === noteId) {
                const next = !n.isPinned;
                if (n.code) noteService.updateInSheet(n.code, { isPinned: next });
                return { ...n, isPinned: next };
              }
              return n;
            });
            noteService.saveToCache(updated);
            setAllNotesList(updated);
            setSelectedNote((prev) => (prev ? { ...prev, isPinned: !prev.isPinned } : null));
          }}
        />
      )}

      {selectedEmployee && (
        <EmployeeDetailDrawer
          employee={selectedEmployee}
          currentIndex={Math.max(0, allEmployeesList.findIndex((e) => e.id === selectedEmployee.id))}
          totalCount={allEmployeesList.length}
          onClose={() => setSelectedEmployee(null)}
          onPrev={() => {
            const idx = allEmployeesList.findIndex((e) => e.id === selectedEmployee.id);
            if (idx > 0) setSelectedEmployee(allEmployeesList[idx - 1]);
          }}
          onNext={() => {
            const idx = allEmployeesList.findIndex((e) => e.id === selectedEmployee.id);
            if (idx < allEmployeesList.length - 1) setSelectedEmployee(allEmployeesList[idx + 1]);
          }}
          onEdit={() => {
            setSelectedEmployee(null);
            if (onNavigate) onNavigate('/he-thong/nhan-vien');
          }}
          onDelete={(id) => {
            const updated = allEmployeesList.filter((e) => e.id !== id);
            employeeService.saveToCache(updated);
            setAllEmployeesList(updated);
            setSelectedEmployee(null);
            setAllEvents(calendarService.aggregateAllEvents());
            showToast('Đã xóa nhân sự');
          }}
        />
      )}

      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          currentIndex={Math.max(0, allTasksList.findIndex((t) => t.id === selectedTask.id))}
          totalCount={allTasksList.length}
          onClose={() => setSelectedTask(null)}
          onPrev={() => {
            const idx = allTasksList.findIndex((t) => t.id === selectedTask.id);
            if (idx > 0) setSelectedTask(allTasksList[idx - 1]);
          }}
          onNext={() => {
            const idx = allTasksList.findIndex((t) => t.id === selectedTask.id);
            if (idx < allTasksList.length - 1) setSelectedTask(allTasksList[idx + 1]);
          }}
          onEdit={() => {
            setSelectedTask(null);
            if (onNavigate) onNavigate('/cong-viec/danh-sach');
          }}
          onDelete={(id) => {
            const updated = allTasksList.filter((t) => t.id !== id);
            taskService.saveToCache(updated);
            setAllTasksList(updated);
            setSelectedTask(null);
            setAllEvents(calendarService.aggregateAllEvents());
            showToast('Đã xóa công việc');
          }}
          onToggleSubtask={handleToggleSubtask}
          onStatusChange={handleTaskStatusChange}
          onAddComment={handleAddTaskComment}
        />
      )}

      {selectedProject && (
        <ProjectDetailDrawer
          project={selectedProject}
          allTasks={allTasksList}
          currentIndex={Math.max(0, allProjectsList.findIndex((p) => p.id === selectedProject.id))}
          totalCount={allProjectsList.length}
          onClose={() => setSelectedProject(null)}
          onPrev={() => {
            const idx = allProjectsList.findIndex((p) => p.id === selectedProject.id);
            if (idx > 0) setSelectedProject(allProjectsList[idx - 1]);
          }}
          onNext={() => {
            const idx = allProjectsList.findIndex((p) => p.id === selectedProject.id);
            if (idx < allProjectsList.length - 1) setSelectedProject(allProjectsList[idx + 1]);
          }}
          onEdit={() => {
            setSelectedProject(null);
            if (onNavigate) onNavigate('/cong-viec/du-an');
          }}
          onDelete={(id) => {
            const updated = allProjectsList.filter((p) => p.id !== id);
            projectService.saveToCache(updated);
            setAllProjectsList(updated);
            setSelectedProject(null);
            setAllEvents(calendarService.aggregateAllEvents());
            showToast('Đã xóa dự án');
          }}
          onSelectTask={(task) => {
            setSelectedProject(null);
            setSelectedTask(task);
          }}
        />
      )}

      {selectedCashTx && (
        <CashTransactionDetailDrawer
          isOpen={!!selectedCashTx}
          transaction={selectedCashTx}
          allTransactions={allCashTxsList}
          currentIndex={Math.max(0, allCashTxsList.findIndex((t) => t.id === selectedCashTx.id))}
          totalCount={allCashTxsList.length}
          onClose={() => setSelectedCashTx(null)}
          onPrev={() => {
            const idx = allCashTxsList.findIndex((t) => t.id === selectedCashTx.id);
            if (idx > 0) setSelectedCashTx(allCashTxsList[idx - 1]);
          }}
          onNext={() => {
            const idx = allCashTxsList.findIndex((t) => t.id === selectedCashTx.id);
            if (idx < allCashTxsList.length - 1) setSelectedCashTx(allCashTxsList[idx + 1]);
          }}
          onNavigate={(tx) => setSelectedCashTx(tx)}
          onEdit={() => {
            setSelectedCashTx(null);
            if (onNavigate) onNavigate('/tai-chinh/thu-chi');
          }}
          onDelete={(id) => {
            const tx = allCashTxsList.find((t) => t.id === id);
            const updated = allCashTxsList.filter((t) => t.id !== id);
            cashTransactionService.saveToCache(updated);
            if (tx?.code) {
              cashTransactionService.deleteFromSheet(tx.code);
            }
            setAllCashTxsList(updated);
            setSelectedCashTx(null);
            setAllEvents(calendarService.aggregateAllEvents());
            showToast('Đã xóa phiếu thu chi');
          }}
          onTogglePin={(id) => {
            const updated = allCashTxsList.map((t) =>
              t.id === id ? { ...t, isPinned: !t.isPinned } : t
            );
            cashTransactionService.saveToCache(updated);
            setAllCashTxsList(updated);
            setSelectedCashTx((prev) => (prev ? { ...prev, isPinned: !prev.isPinned } : null));
          }}
          onViewProposal={(code) => {
            const props = googleSheetsService.getInitialProposals();
            const found = props.find((p) => p.code === code);
            if (found) {
              setSelectedCashTx(null);
              setAllProposalsList(props);
              setSelectedProposal(found);
            } else if (onNavigate) {
              onNavigate('/tai-chinh/de-xuat-chi-phi');
            }
          }}
          onNavigateToModule={onNavigate}
        />
      )}

      {selectedProposal && (
        <CostProposalDetailDrawer
          proposal={selectedProposal}
          currentIndex={Math.max(0, allProposalsList.findIndex((p) => p.id === selectedProposal.id))}
          totalCount={allProposalsList.length}
          onClose={() => setSelectedProposal(null)}
          onPrev={() => {
            const idx = allProposalsList.findIndex((p) => p.id === selectedProposal.id);
            if (idx > 0) setSelectedProposal(allProposalsList[idx - 1]);
          }}
          onNext={() => {
            const idx = allProposalsList.findIndex((p) => p.id === selectedProposal.id);
            if (idx < allProposalsList.length - 1) setSelectedProposal(allProposalsList[idx + 1]);
          }}
          onEdit={() => {
            setSelectedProposal(null);
            if (onNavigate) onNavigate('/tai-chinh/de-xuat-chi-phi');
          }}
          onDelete={(id) => {
            const updated = allProposalsList.filter((p) => p.id !== id);
            googleSheetsService.saveToCache(updated);
            setAllProposalsList(updated);
            setSelectedProposal(null);
            setAllEvents(calendarService.aggregateAllEvents());
            showToast('Đã xóa đề xuất chi phí');
          }}
          onCopy={() => {
            showToast('Đã sao chép nội dung đề xuất');
          }}
          onSubmitForApproval={() => {
            showToast('Đã gửi đề xuất chi phí để phê duyệt');
          }}
        />
      )}

      {/* Custom Event Modal (for meetings and events created within Calendar) */}
      <EventDetailModal
        event={selectedCustomEvent}
        isOpen={!!selectedCustomEvent}
        onClose={() => setSelectedCustomEvent(null)}
        onNavigateToModule={onNavigate}
        onDeleteCustomEvent={handleDeleteCustomEvent}
      />

      <EventFormModal
        isOpen={activeAddDrawer !== null}
        defaultDate={addDrawerDate}
        defaultModule={activeAddDrawer || 'meeting'}
        onClose={() => setActiveAddDrawer(null)}
        onSave={handleSaveCustomEvent}
        onSaveSuccess={(msg) => {
          const fresh = calendarService.aggregateAllEvents();
          setAllEvents(fresh);
          showToast(`✅ ${msg}`);
        }}
      />
    </div>
  );
};
