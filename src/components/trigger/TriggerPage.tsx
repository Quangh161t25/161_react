import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Bell,
  FileText,
  Pin,
  Download,
  List,
  LayoutGrid,
  ChevronDown,
  SquarePen,
  Printer,
  Sparkles,
  ArrowUpDown,
  Check,
  Zap,
  RotateCcw,
  ChartColumn,
} from 'lucide-react';
import {
  Trigger,
  TriggerAction,
  TriggerStatus,
  TriggerPriority,
  TriggerRepeat,
} from '../../types/trigger';
import {
  triggerService,
  TRIGGERS_CHANGED_EVENT,
} from '../../services/triggerService';
import { notificationService } from '../../services/notificationService';
import { TablePagination } from '../common/TablePagination';
import {
  ColumnCustomizerPopover,
  ColumnItem,
  TableDensity,
} from '../common/ColumnCustomizerPopover';
import { useAutoSync } from '../../hooks/useAutoSync';
import { RealtimeSyncBadge } from '../common/RealtimeSyncBadge';
import { TriggerFormDrawer } from './TriggerFormDrawer';
import { TriggerDetailDrawer } from './TriggerDetailDrawer';
import { TriggerStatsTab } from './TriggerStatsTab';
import { formatDate, toLocalDateStr, compareDates } from '../../utils/dateUtils';

interface TriggerPageProps {
  onBack: () => void;
}

// Cấu hình các cột mặc định cho Trigger Table
const DEFAULT_TRIGGER_COLUMNS: ColumnItem[] = [
  { id: 'code', label: 'Mã Trigger', visible: true, width: 110, align: 'center', locked: true },
  { id: 'title', label: 'Tiêu đề trigger', visible: true, width: 240, align: 'left', locked: true },
  { id: 'action', label: 'Hành động', visible: true, width: 160, align: 'left' },
  { id: 'status', label: 'Trạng thái', visible: true, width: 120, align: 'center' },
  { id: 'priority', label: 'Mức ưu tiên', visible: true, width: 120, align: 'center' },
  { id: 'runAt', label: 'Thời gian chạy', visible: true, width: 170, align: 'center' },
  { id: 'repeat', label: 'Lặp lại', visible: true, width: 120, align: 'center' },
  { id: 'tags', label: 'Thẻ (Tags)', visible: true, width: 150, align: 'left' },
  { id: 'content', label: 'Nội dung chi tiết', visible: false, width: 220, align: 'left' },
  { id: 'result', label: 'Kết quả chạy', visible: false, width: 160, align: 'left' },
  { id: 'createdAt', label: 'Ngày tạo', visible: false, width: 130, align: 'center' },
  { id: 'actions', label: 'Thao tác', visible: true, width: 130, align: 'center', locked: true },
];

const STORAGE_KEYS = {
  COLUMNS: 'trigger_table_columns_v2',
  DENSITY: 'trigger_table_density_v2',
  VIEW_MODE: 'trigger_view_mode_v2',
  PAGE_SIZE: 'trigger_page_size_v2',
};

// Map nhãn và icon cho Action
const ACTION_MAP: Record<TriggerAction, { label: string; icon: typeof Bell; bg: string; text: string; border: string }> = {
  notify: {
    label: 'Thông báo',
    icon: Bell,
    bg: 'bg-blue-500/10 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
  },
  add_note: {
    label: 'Thêm Ghi chú',
    icon: FileText,
    bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
  },
  webhook: {
    label: 'Webhook',
    icon: Sparkles,
    bg: 'bg-purple-500/10 dark:bg-purple-950/40',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/20',
  },
};

// Map nhãn và badge cho Status
const STATUS_MAP: Record<TriggerStatus, { label: string; icon: typeof Clock; bg: string; text: string; border: string }> = {
  pending: {
    label: 'Đang chờ',
    icon: Clock,
    bg: 'bg-amber-500/10 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
  },
  done: {
    label: 'Đã chạy',
    icon: CheckCircle2,
    bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
  },
  cancelled: {
    label: 'Đã hủy',
    icon: XCircle,
    bg: 'bg-slate-500/10 dark:bg-slate-800/40',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/20',
  },
};

// Map nhãn và badge cho Priority
const PRIORITY_MAP: Record<TriggerPriority, { label: string; bg: string; text: string; border: string }> = {
  urgent: {
    label: 'Khẩn cấp',
    bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/30',
  },
  high: {
    label: 'Cao',
    bg: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
  },
  medium: {
    label: 'Trung bình',
    bg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-500/30',
  },
  low: {
    label: 'Thấp',
    bg: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/30',
  },
};

// Map lặp lại
const REPEAT_MAP: Record<TriggerRepeat, string> = {
  none: 'Không lặp',
  daily: 'Hàng ngày',
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
};

// Helper tính khoảng thời gian còn lại
const getRelativeCountdown = (runAt: string): { text: string; isPast: boolean; isSoon: boolean } => {
  if (!runAt) return { text: '—', isPast: false, isSoon: false };
  const target = new Date(runAt).getTime();
  if (isNaN(target)) return { text: runAt, isPast: false, isSoon: false };
  const diffMs = target - Date.now();
  const isPast = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  const diffSec = Math.floor(absDiff / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (isPast) {
    if (diffMin < 1) return { text: 'Vừa xong', isPast: true, isSoon: false };
    if (diffMin < 60) return { text: `${diffMin} phút trước`, isPast: true, isSoon: false };
    if (diffHour < 24) return { text: `${diffHour} giờ trước`, isPast: true, isSoon: false };
    return { text: `${diffDay} ngày trước`, isPast: true, isSoon: false };
  } else {
    const isSoon = diffHour < 1; // Sắp chạy trong vòng 1 giờ
    if (diffMin < 1) return { text: 'Dưới 1 phút', isPast: false, isSoon: true };
    if (diffMin < 60) return { text: `Còn ${diffMin} phút`, isPast: false, isSoon };
    if (diffHour < 24) return { text: `Còn ${diffHour} giờ`, isPast: false, isSoon: false };
    return { text: `Còn ${diffDay} ngày`, isPast: false, isSoon: false };
  }
};

// Helper định dạng ngày giờ dd/mm/yyyy hh:mm
const formatTriggerRunAt = (runAt: string) => {
  if (!runAt) return '—';
  try {
    const [datePart, timePart] = runAt.split('T');
    const formattedDate = datePart ? formatDate(datePart) : '';
    const formattedTime = (timePart || '').slice(0, 5);
    return `${formattedTime} ${formattedDate}`.trim();
  } catch {
    return runAt;
  }
};

export const TriggerPage: React.FC<TriggerPageProps> = ({ onBack }) => {
  // Danh sách triggers từ local storage & sync với Sheet
  const [triggers, setTriggers] = useState<Trigger[]>(() => triggerService.getAll());

  // Top Tabs: 'list' (Danh sách trigger) | 'stats' (Thống kê & Lịch trình)
  const [activeTopTab, setActiveTopTab] = useState<'list' | 'stats'>('list');

  // Chế độ xem: table | grid
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    return (localStorage.getItem(STORAGE_KEYS.VIEW_MODE) as 'table' | 'grid') || 'table';
  });

  // Tùy chỉnh cột
  const [columns, setColumns] = useState<ColumnItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COLUMNS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge với default để đảm bảo đủ cột
          const map = new Map(parsed.map((c: ColumnItem) => [c.id, c]));
          return DEFAULT_TRIGGER_COLUMNS.map((def) => map.get(def.id) || def);
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_TRIGGER_COLUMNS;
  });

  // Độ giãn hàng
  const [density, setDensity] = useState<TableDensity>(() => {
    return (localStorage.getItem(STORAGE_KEYS.DENSITY) as TableDensity) || 'normal';
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [onlyPinned, setOnlyPinned] = useState(false);

  // Sắp xếp
  const [sortField, setSortField] = useState<'runAt' | 'createdAt' | 'code' | 'title'>('runAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAGE_SIZE);
    return saved ? parseInt(saved, 10) || 50 : 50;
  });

  // Selected for Bulk Action
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Drawers
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [formDrawerInitialTrigger, setFormDrawerInitialTrigger] = useState<Trigger | null>(null);
  const [selectedTriggerForDetail, setSelectedTriggerForDetail] = useState<Trigger | null>(null);

  // Running state & Toasts
  const [runningId, setRunningId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 4000);
  };

  // Google Sheets Realtime Smart Sync Hook (interval 25s, instant badge)
  const { isSyncing, lastSyncTime, triggerManualSync } = useAutoSync<Trigger[]>({
    syncFn: () => triggerService.fetchFromSheet(),
    onDataReceived: (liveTriggers) => {
      if (Array.isArray(liveTriggers)) {
        setTriggers(liveTriggers);
      }
    },
    intervalMs: 25000,
  });

  // Listen to local trigger changes event
  useEffect(() => {
    const reload = () => setTriggers(triggerService.getAll());
    window.addEventListener(TRIGGERS_CHANGED_EVENT, reload);
    return () => window.removeEventListener(TRIGGERS_CHANGED_EVENT, reload);
  }, []);

  // Save Column settings
  const handleColumnsChange = (newCols: ColumnItem[]) => {
    setColumns(newCols);
    localStorage.setItem(STORAGE_KEYS.COLUMNS, JSON.stringify(newCols));
  };

  // Save Density
  const handleDensityChange = (newDensity: TableDensity) => {
    setDensity(newDensity);
    localStorage.setItem(STORAGE_KEYS.DENSITY, newDensity);
  };

  // Reset columns
  const handleResetColumns = () => {
    setColumns(DEFAULT_TRIGGER_COLUMNS);
    setDensity('normal');
    localStorage.removeItem(STORAGE_KEYS.COLUMNS);
    localStorage.removeItem(STORAGE_KEYS.DENSITY);
  };

  // Save View Mode
  const handleViewModeChange = (mode: 'table' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
  };

  // Save Items per page
  const handleItemsPerPageChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
    localStorage.setItem(STORAGE_KEYS.PAGE_SIZE, String(size));
  };

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    triggers.forEach((t) => {
      (t.tags || []).forEach((tag) => {
        const clean = tag.trim();
        if (clean) set.add(clean);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [triggers]);

  // Lọc danh sách trigger
  const filteredTriggers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return triggers.filter((t) => {
      // Search
      if (q) {
        const matchTitle = (t.title || '').toLowerCase().includes(q);
        const matchCode = (t.code || t.id || '').toLowerCase().includes(q);
        const matchContent = (t.content || '').toLowerCase().includes(q);
        const matchTags = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
        if (!matchTitle && !matchCode && !matchContent && !matchTags) {
          return false;
        }
      }

      // Filter: Action
      if (actionFilter !== 'all' && t.action !== actionFilter) {
        return false;
      }

      // Filter: Status
      if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false;
      }

      // Filter: Priority
      if (priorityFilter !== 'all') {
        const prio = t.priority || 'medium';
        if (prio !== priorityFilter) return false;
      }

      // Filter: Tag
      if (selectedTag !== 'all') {
        if (!(t.tags || []).includes(selectedTag)) return false;
      }

      // Filter: Pinned
      if (onlyPinned && !t.isPinned) {
        return false;
      }

      return true;
    });
  }, [triggers, searchQuery, actionFilter, statusFilter, priorityFilter, selectedTag, onlyPinned]);

  // Sắp xếp
  const sortedTriggers = useMemo(() => {
    const list = [...filteredTriggers];

    list.sort((a, b) => {
      // Luôn ưu tiên mục được Ghim lên trên đầu
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortField === 'runAt') {
        return compareDates(a.runAt, b.runAt, sortDirection);
      }
      if (sortField === 'createdAt') {
        return compareDates(a.createdAt, b.createdAt, sortDirection);
      }
      if (sortField === 'code') {
        const cmp = (a.code || a.id).localeCompare(b.code || b.id);
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      if (sortField === 'title') {
        const cmp = (a.title || '').localeCompare(b.title || '', 'vi');
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      return 0;
    });

    return list;
  }, [filteredTriggers, sortField, sortDirection]);

  // Phân trang
  const totalItems = sortedTriggers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedTriggers = useMemo(() => {
    const start = (validCurrentPage - 1) * itemsPerPage;
    return sortedTriggers.slice(start, start + itemsPerPage);
  }, [sortedTriggers, validCurrentPage, itemsPerPage]);

  // Bulk selection logic
  const isAllPageSelected =
    paginatedTriggers.length > 0 && paginatedTriggers.every((t) => selectedIds.includes(t.id));

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageIds = new Set(paginatedTriggers.map((t) => t.id));
      setSelectedIds(selectedIds.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedTriggers.map((t) => t.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Thao tác: Kích hoạt chạy ngay
  const handleRunNow = async (id: string) => {
    const target = triggers.find((t) => t.id === id);
    if (!target) return;

    setRunningId(id);
    try {
      await triggerService.runTriggerNow(id);
      showToast(`Đã kích hoạt chạy trigger "${target.title}" thành công!`, 'success');
      // Request notification permission if needed
      if (target.action === 'notify' && notificationService.isSupported() && Notification.permission === 'default') {
        notificationService.requestPermission();
      }
    } catch (err: any) {
      showToast(`Không thể chạy trigger: ${err.message || 'Lỗi không xác định'}`, 'error');
    } finally {
      setRunningId(null);
    }
  };

  // Thao tác: Xóa 1 trigger
  const handleDeleteTrigger = (id: string) => {
    const target = triggers.find((t) => t.id === id);
    if (!target) return;
    if (window.confirm(`Bạn có chắc muốn xóa trigger "${target.title}" (${target.code || target.id})?`)) {
      triggerService.remove(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      if (selectedTriggerForDetail?.id === id) {
        setSelectedTriggerForDetail(null);
      }
      showToast(`Đã xóa trigger "${target.title}" thành công!`, 'success');
    }
  };

  // Thao tác: Xóa nhiều trigger đã chọn
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} trigger đã chọn?`)) {
      triggerService.removeMany(selectedIds);
      setSelectedIds([]);
      if (selectedTriggerForDetail && selectedIds.includes(selectedTriggerForDetail.id)) {
        setSelectedTriggerForDetail(null);
      }
      showToast(`Đã xóa ${selectedIds.length} trigger thành công!`, 'success');
    }
  };

  // Thao tác: Chỉnh sửa
  const handleOpenEdit = (trigger: Trigger) => {
    setFormDrawerInitialTrigger(trigger);
    setIsFormDrawerOpen(true);
  };

  // Thao tác: Tạo mới
  const handleOpenAdd = () => {
    setFormDrawerInitialTrigger(null);
    setIsFormDrawerOpen(true);
  };

  // Thao tác: Lưu từ Drawer
  const handleSaveTrigger = (trigger: Trigger) => {
    triggerService.upsert(trigger);
    setIsFormDrawerOpen(false);
    setFormDrawerInitialTrigger(null);
    if (selectedTriggerForDetail?.id === trigger.id) {
      setSelectedTriggerForDetail(trigger);
    }
    showToast(`Đã lưu trigger "${trigger.title}" thành công!`, 'success');
  };

  // Thao tác: Xuất CSV chuẩn tiếng Việt (BOM)
  const handleExportCSV = () => {
    const headers = [
      'Mã Trigger',
      'Tiêu đề',
      'Hành động',
      'Trạng thái',
      'Mức ưu tiên',
      'Thời gian chạy (runAt)',
      'Lặp lại',
      'Thẻ (Tags)',
      'Nội dung chi tiết',
      'Đã ghim',
      'Ghi chú',
      'Kết quả',
      'Thời điểm kích hoạt (firedAt)',
      'Người tạo',
      'Ngày tạo',
      'Cập nhật',
    ];

    const rows = sortedTriggers.map((t) => [
      t.code || t.id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${ACTION_MAP[t.action]?.label || t.action}"`,
      `"${STATUS_MAP[t.status]?.label || t.status}"`,
      `"${PRIORITY_MAP[t.priority || 'medium']?.label || t.priority}"`,
      `"${formatTriggerRunAt(t.runAt)}"`,
      `"${REPEAT_MAP[t.repeat || 'none'] || t.repeat}"`,
      `"${(t.tags || []).join(', ')}"`,
      `"${(t.content || '').replace(/"/g, '""')}"`,
      t.isPinned ? 'Có' : 'Không',
      `"${(t.note || '').replace(/"/g, '""')}"`,
      `"${(t.result || '').replace(/"/g, '""')}"`,
      t.firedAt ? `"${formatTriggerRunAt(t.firedAt)}"` : '',
      `"${t.createdBy || ''}"`,
      t.createdAt ? `"${formatDate(t.createdAt)}"` : '',
      t.updatedAt ? `"${formatDate(t.updatedAt)}"` : '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_sach_Trigger_${toLocalDateStr().replace(/-/g, '')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã xuất file CSV thành công!', 'success');
  };

  // Đồng bộ thủ công với Google Sheets
  const handleManualSync = async () => {
    try {
      await triggerManualSync();
      showToast('Đồng bộ với Google Sheet thành công!', 'success');
    } catch (err: any) {
      showToast(`Đồng bộ thất bại: ${err.message || 'Lỗi mạng'}`, 'error');
    }
  };

  // Padding theo density
  const cellPadding =
    density === 'compact'
      ? 'px-2 py-1.5 text-xs'
      : density === 'relaxed'
      ? 'px-3 py-3 text-xs'
      : 'px-2.5 py-2 text-xs';

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-background">
      {/* Top Tabs */}
      <div className="flex items-center gap-1.5 mb-1.5 px-0.5 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTopTab('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'list'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Danh sách trigger ({triggers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTopTab('stats')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'stats'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <ChartColumn className="w-3.5 h-3.5" />
          <span>Thống kê & Lịch trình</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 min-h-0 flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-xs">
        {activeTopTab === 'stats' ? (
          <TriggerStatsTab
            triggers={triggers}
            onSelectTrigger={(trigger) => setSelectedTriggerForDetail(trigger)}
            onRunNow={handleRunNow}
          />
        ) : (
          <>
            {/* Toolbar */}
            <div className="px-3 py-2 border-b border-border bg-card">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
                {/* Left: Back & Search & Filters */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={onBack}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                    title="Quay lại"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">Quay lại</span>
                  </button>

                  {/* Search box */}
                  <div className="relative flex-1 min-w-[160px] max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Tìm trigger, mã, nội dung, thẻ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Filter: Action */}
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shrink-0 cursor-pointer"
                  >
                    <option value="all">Tất cả hành động</option>
                    <option value="notify">Thông báo</option>
                    <option value="add_note">Thêm Ghi chú</option>
                  </select>

                  {/* Filter: Status */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shrink-0 cursor-pointer"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Đang chờ</option>
                    <option value="done">Đã chạy</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>

                  {/* Filter: Priority */}
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shrink-0 cursor-pointer"
                  >
                    <option value="all">Tất cả mức ưu tiên</option>
                    <option value="urgent">Khẩn cấp</option>
                    <option value="high">Cao</option>
                    <option value="medium">Trung bình</option>
                    <option value="low">Thấp</option>
                  </select>

                  {/* Filter: Tag */}
                  {allTags.length > 0 && (
                    <select
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shrink-0 cursor-pointer"
                    >
                      <option value="all">Tất cả thẻ (#{allTags.length})</option>
                      {allTags.map((t) => (
                        <option key={t} value={t}>
                          #{t}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Filter: Pinned Only */}
                  <button
                    type="button"
                    onClick={() => setOnlyPinned(!onlyPinned)}
                    className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      onlyPinned
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Chỉ hiển thị mục đã ghim"
                  >
                    <Pin className={`w-3.5 h-3.5 ${onlyPinned ? 'fill-current' : ''}`} />
                    <span>Ghim</span>
                  </button>

                  {/* Sort Mode Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                      className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-medium flex items-center gap-1.5 text-foreground hover:bg-muted transition-colors"
                      title="Tùy chọn sắp xếp"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>
                        {sortField === 'runAt'
                          ? 'Thời gian chạy'
                          : sortField === 'createdAt'
                          ? 'Ngày tạo'
                          : sortField === 'code'
                          ? 'Mã trigger'
                          : 'Tiêu đề'}
                      </span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
                    </button>

                    {isSortMenuOpen && (
                      <div className="absolute left-0 mt-1 w-48 rounded-lg border border-border bg-popover shadow-lg py-1 z-30 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setSortField('runAt');
                            setSortDirection('asc');
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-muted ${
                            sortField === 'runAt' && sortDirection === 'asc' ? 'text-primary font-semibold' : ''
                          }`}
                        >
                          <span>Sắp chạy trước</span>
                          {sortField === 'runAt' && sortDirection === 'asc' && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSortField('runAt');
                            setSortDirection('desc');
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-muted ${
                            sortField === 'runAt' && sortDirection === 'desc' ? 'text-primary font-semibold' : ''
                          }`}
                        >
                          <span>Chạy sau cùng</span>
                          {sortField === 'runAt' && sortDirection === 'desc' && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div className="border-t border-border my-1" />
                        <button
                          type="button"
                          onClick={() => {
                            setSortField('createdAt');
                            setSortDirection('desc');
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-muted ${
                            sortField === 'createdAt' && sortDirection === 'desc' ? 'text-primary font-semibold' : ''
                          }`}
                        >
                          <span>Mới tạo nhất</span>
                          {sortField === 'createdAt' && sortDirection === 'desc' && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSortField('createdAt');
                            setSortDirection('asc');
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-muted ${
                            sortField === 'createdAt' && sortDirection === 'asc' ? 'text-primary font-semibold' : ''
                          }`}
                        >
                          <span>Cũ nhất</span>
                          {sortField === 'createdAt' && sortDirection === 'asc' && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div className="border-t border-border my-1" />
                        <button
                          type="button"
                          onClick={() => {
                            setSortField('code');
                            setSortDirection('asc');
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-muted ${
                            sortField === 'code' ? 'text-primary font-semibold' : ''
                          }`}
                        >
                          <span>Theo mã (A-Z)</span>
                          {sortField === 'code' && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSortField('title');
                            setSortDirection('asc');
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-muted ${
                            sortField === 'title' ? 'text-primary font-semibold' : ''
                          }`}
                        >
                          <span>Theo tiêu đề (A-Z)</span>
                          {sortField === 'title' && <Check className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions, Sync, View Mode & Add */}
                <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-center">
                  {/* Bulk Delete */}
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      className="h-8 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                      title="Xóa các mục đã chọn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa ({selectedIds.length})</span>
                    </button>
                  )}

                  {/* Realtime Smart Sync Badge with Google Sheet */}
                  <RealtimeSyncBadge
                    isSyncing={isSyncing}
                    lastSyncTime={lastSyncTime}
                    onSync={handleManualSync}
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

                  {/* Export CSV */}
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    title="Xuất file CSV"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Column Customizer */}
                  {viewMode === 'table' && (
                    <ColumnCustomizerPopover
                      columns={columns}
                      onChangeColumns={handleColumnsChange}
                      density={density}
                      onChangeDensity={handleDensityChange}
                      onReset={handleResetColumns}
                    />
                  )}

                  {/* Table / Grid Switcher */}
                  <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
                    <button
                      type="button"
                      onClick={() => handleViewModeChange('table')}
                      className={`h-7 w-7 flex items-center justify-center rounded-md transition-all ${
                        viewMode === 'table'
                          ? 'bg-background text-foreground shadow-2xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Xem dạng Bảng"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewModeChange('grid')}
                      className={`h-7 w-7 flex items-center justify-center rounded-md transition-all ${
                        viewMode === 'grid'
                          ? 'bg-background text-foreground shadow-2xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Xem dạng Thẻ (Grid)"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add Button */}
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm trigger</span>
                  </button>
                </div>
              </div>

              {/* Toast message */}
              {toastMessage && (
                <div
                  className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between border transition-all animate-fadeIn ${
                    toastType === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : toastType === 'error'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                      : 'bg-primary/10 border-primary/20 text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {toastType === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    {toastType === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
                    {toastType === 'info' && <Sparkles className="w-4 h-4 shrink-0" />}
                    <span>{toastMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setToastMessage(null)}
                    className="hover:opacity-70 p-0.5"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-auto bg-card">
              {filteredTriggers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                    <Zap className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {searchQuery || actionFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' || selectedTag !== 'all' || onlyPinned
                      ? 'Không tìm thấy trigger phù hợp với bộ lọc'
                      : 'Chưa có trigger nào'}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mb-4">
                    Trigger giúp bạn tự động nhận thông báo hoặc tự động thêm dòng vào Ghi chú theo đúng lịch hẹn ngày giờ.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tạo trigger mới</span>
                  </button>
                </div>
              ) : viewMode === 'table' ? (
                /* TABLE VIEW */
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/50 border-b border-border sticky top-0 z-10 select-none">
                    <tr>
                      {/* Checkbox column */}
                      <th className="w-10 px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={isAllPageSelected}
                          onChange={toggleSelectAllPage}
                          className="rounded border-border text-primary focus:ring-primary cursor-pointer w-3.5 h-3.5"
                        />
                      </th>

                      {/* Dynamic columns */}
                      {columns
                        .filter((col) => col.visible)
                        .map((col) => {
                          const isSortable = ['code', 'title', 'runAt', 'createdAt'].includes(col.id);
                          return (
                            <th
                              key={col.id}
                              style={{ width: col.width }}
                              onClick={() => {
                                if (isSortable) {
                                  if (sortField === col.id) {
                                    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                                  } else {
                                    setSortField(col.id as any);
                                    setSortDirection('asc');
                                  }
                                }
                              }}
                              className={`px-2.5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${
                                col.align === 'center'
                                  ? 'text-center'
                                  : col.align === 'right'
                                  ? 'text-right'
                                  : 'text-left'
                              } ${isSortable ? 'cursor-pointer hover:text-foreground' : ''}`}
                            >
                              <div className={`inline-flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : ''}`}>
                                <span>{col.label}</span>
                                {isSortable && sortField === col.id && (
                                  <span className="text-primary font-bold">
                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                          );
                        })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {paginatedTriggers.map((t) => {
                      const isSelected = selectedIds.includes(t.id);
                      const countdown = getRelativeCountdown(t.runAt);
                      const isRunning = runningId === t.id;
                      const actionInfo = ACTION_MAP[t.action] || ACTION_MAP.notify;
                      const ActionIcon = actionInfo.icon;
                      const statusInfo = STATUS_MAP[t.status] || STATUS_MAP.pending;
                      const StatusIcon = statusInfo.icon;
                      const priorityInfo = PRIORITY_MAP[t.priority || 'medium'] || PRIORITY_MAP.medium;

                      return (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTriggerForDetail(t)}
                          className={`group hover:bg-muted/40 transition-colors cursor-pointer ${
                            isSelected ? 'bg-primary/5' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td
                            className="px-3 py-2 text-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectId(t.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectId(t.id)}
                              className="rounded border-border text-primary focus:ring-primary cursor-pointer w-3.5 h-3.5"
                            />
                          </td>

                          {/* Dynamic Columns */}
                          {columns
                            .filter((col) => col.visible)
                            .map((col) => {
                              switch (col.id) {
                                case 'code':
                                  return (
                                    <td key={col.id} className={`${cellPadding} text-center font-mono font-medium text-xs text-foreground`}>
                                      <span className="px-1.5 py-0.5 rounded bg-muted text-foreground border border-border">
                                        {t.code || t.id.slice(0, 10)}
                                      </span>
                                    </td>
                                  );

                                case 'title':
                                  return (
                                    <td key={col.id} className={`${cellPadding} font-semibold text-foreground`}>
                                      <div className="flex items-center gap-1.5">
                                        {t.isPinned && (
                                          <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                        )}
                                        <span className="truncate group-hover:text-primary transition-colors">
                                          {t.title}
                                        </span>
                                      </div>
                                    </td>
                                  );

                                case 'action':
                                  return (
                                    <td key={col.id} className={cellPadding}>
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${actionInfo.bg} ${actionInfo.text} ${actionInfo.border}`}
                                      >
                                        <ActionIcon className="w-3 h-3" />
                                        <span>{actionInfo.label}</span>
                                      </span>
                                    </td>
                                  );

                                case 'status':
                                  return (
                                    <td key={col.id} className={`${cellPadding} text-center`}>
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                                      >
                                        <StatusIcon className="w-3 h-3" />
                                        <span>{statusInfo.label}</span>
                                      </span>
                                    </td>
                                  );

                                case 'priority':
                                  return (
                                    <td key={col.id} className={`${cellPadding} text-center`}>
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${priorityInfo.bg} ${priorityInfo.border}`}
                                      >
                                        <span>{priorityInfo.label}</span>
                                      </span>
                                    </td>
                                  );

                                case 'runAt':
                                  return (
                                    <td key={col.id} className={`${cellPadding} text-center tabular-nums`}>
                                      <div className="flex flex-col items-center">
                                        <span className="font-medium text-foreground">
                                          {formatTriggerRunAt(t.runAt)}
                                        </span>
                                        {t.status === 'pending' && (
                                          <span
                                            className={`text-[10px] font-medium ${
                                              countdown.isSoon
                                                ? 'text-rose-500 animate-pulse font-bold'
                                                : 'text-muted-foreground'
                                            }`}
                                          >
                                            {countdown.text}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  );

                                case 'repeat':
                                  return (
                                    <td key={col.id} className={`${cellPadding} text-center text-xs text-muted-foreground`}>
                                      {t.repeat && t.repeat !== 'none' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
                                          <RotateCcw className="w-2.5 h-2.5" />
                                          <span>{REPEAT_MAP[t.repeat] || t.repeat}</span>
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground/40">—</span>
                                      )}
                                    </td>
                                  );

                                case 'tags':
                                  return (
                                    <td key={col.id} className={cellPadding}>
                                      <div className="flex flex-wrap items-center gap-1">
                                        {(t.tags || []).slice(0, 3).map((tag, idx) => (
                                          <span
                                            key={idx}
                                            className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border"
                                          >
                                            #{tag}
                                          </span>
                                        ))}
                                        {(t.tags || []).length > 3 && (
                                          <span className="text-[10px] text-muted-foreground">
                                            +{t.tags!.length - 3}
                                          </span>
                                        )}
                                        {(!t.tags || t.tags.length === 0) && (
                                          <span className="text-muted-foreground/30 text-xs">—</span>
                                        )}
                                      </div>
                                    </td>
                                  );

                                case 'content':
                                  return (
                                    <td key={col.id} className={`${cellPadding} text-muted-foreground`}>
                                      <span className="line-clamp-1" title={t.content}>
                                        {t.content || '—'}
                                      </span>
                                    </td>
                                  );

                                case 'result':
                                  return (
                                    <td key={col.id} className={`${cellPadding} text-muted-foreground text-xs`}>
                                      <span className="line-clamp-1" title={t.result || ''}>
                                        {t.result || '—'}
                                      </span>
                                    </td>
                                  );

                                case 'createdAt':
                                  return (
                                    <td key={col.id} className={`${cellPadding} text-center tabular-nums text-muted-foreground text-xs`}>
                                      {t.createdAt ? formatDate(t.createdAt) : '—'}
                                    </td>
                                  );

                                case 'actions':
                                  return (
                                    <td
                                      key={col.id}
                                      className={`${cellPadding} text-center`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="inline-flex items-center gap-1">
                                        {/* Run Now Button */}
                                        <button
                                          type="button"
                                          onClick={() => handleRunNow(t.id)}
                                          disabled={isRunning}
                                          className="h-7 w-7 rounded-md hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-colors"
                                          title="Kích hoạt chạy ngay lập tức"
                                        >
                                          {isRunning ? (
                                            <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <Play className="w-3.5 h-3.5 fill-current" />
                                          )}
                                        </button>

                                        {/* Edit Button */}
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEdit(t)}
                                          className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                                          title="Chỉnh sửa trigger"
                                        >
                                          <SquarePen className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteTrigger(t.id)}
                                          className="h-7 w-7 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors"
                                          title="Xóa trigger"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  );

                                default:
                                  return <td key={col.id} className={cellPadding}>—</td>;
                              }
                            })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                /* GRID / CARD VIEW */
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {paginatedTriggers.map((t) => {
                    const isSelected = selectedIds.includes(t.id);
                    const countdown = getRelativeCountdown(t.runAt);
                    const isRunning = runningId === t.id;
                    const actionInfo = ACTION_MAP[t.action] || ACTION_MAP.notify;
                    const ActionIcon = actionInfo.icon;
                    const statusInfo = STATUS_MAP[t.status] || STATUS_MAP.pending;
                    const StatusIcon = statusInfo.icon;
                    const priorityInfo = PRIORITY_MAP[t.priority || 'medium'] || PRIORITY_MAP.medium;

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTriggerForDetail(t)}
                        className={`group relative rounded-xl border p-3.5 bg-card hover:border-primary/50 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between ${
                          isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        {/* Top: Code, Pin, Status */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelectId(t.id);
                                }}
                                className="rounded border-border text-primary focus:ring-primary cursor-pointer w-3.5 h-3.5"
                              />
                              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                                {t.code || t.id.slice(0, 10)}
                              </span>
                              {t.isPinned && (
                                <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                <span>{statusInfo.label}</span>
                              </span>
                            </div>
                          </div>

                          {/* Title & Action Type */}
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
                            {t.title}
                          </h3>

                          {/* Action Badge & Priority Badge */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${actionInfo.bg} ${actionInfo.text} ${actionInfo.border}`}
                            >
                              <ActionIcon className="w-3 h-3" />
                              <span>{actionInfo.label}</span>
                            </span>

                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityInfo.bg} ${priorityInfo.border}`}
                            >
                              <span>{priorityInfo.label}</span>
                            </span>

                            {t.repeat && t.repeat !== 'none' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                                <RotateCcw className="w-2.5 h-2.5" />
                                <span>{REPEAT_MAP[t.repeat] || t.repeat}</span>
                              </span>
                            )}
                          </div>

                          {/* Content Snippet */}
                          {t.content && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 bg-muted/40 p-2 rounded-lg border border-border/50">
                              {t.content}
                            </p>
                          )}

                          {/* Tags */}
                          {(t.tags || []).length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mb-3">
                              {t.tags!.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Bottom: Schedule & Quick Actions */}
                        <div className="pt-2.5 border-t border-border flex items-center justify-between gap-2 mt-auto">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground text-xs">
                                {formatTriggerRunAt(t.runAt)}
                              </span>
                              {t.status === 'pending' && (
                                <span
                                  className={`text-[10px] ${
                                    countdown.isSoon ? 'text-rose-500 font-bold animate-pulse' : 'text-muted-foreground'
                                  }`}
                                >
                                  {countdown.text}
                                </span>
                              )}
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleRunNow(t.id)}
                              disabled={isRunning}
                              className="h-7 w-7 rounded-md hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-colors"
                              title="Chạy ngay"
                            >
                              {isRunning ? (
                                <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(t)}
                              className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                              title="Sửa"
                            >
                              <SquarePen className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTrigger(t.id)}
                              className="h-7 w-7 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination Footer */}
            <div className="border-t border-border bg-card px-3 py-2">
              <TablePagination
                currentPage={validCurrentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemLabel="trigger"
              />
            </div>
          </>
        )}
      </div>

      {/* Form Drawer (Add / Edit) */}
      <TriggerFormDrawer
        isOpen={isFormDrawerOpen}
        onClose={() => {
          setIsFormDrawerOpen(false);
          setFormDrawerInitialTrigger(null);
        }}
        onSave={handleSaveTrigger}
        initialTrigger={formDrawerInitialTrigger}
        existingCount={triggers.length}
      />

      {/* Detail Drawer */}
      <TriggerDetailDrawer
        trigger={selectedTriggerForDetail}
        onClose={() => setSelectedTriggerForDetail(null)}
        onEdit={(trigger) => {
          setSelectedTriggerForDetail(null);
          handleOpenEdit(trigger);
        }}
        onDelete={(id) => {
          handleDeleteTrigger(id);
        }}
        onRunNow={handleRunNow}
        onPrev={() => {
          if (!selectedTriggerForDetail) return;
          const idx = sortedTriggers.findIndex((t) => t.id === selectedTriggerForDetail.id);
          if (idx > 0) {
            setSelectedTriggerForDetail(sortedTriggers[idx - 1]);
          }
        }}
        onNext={() => {
          if (!selectedTriggerForDetail) return;
          const idx = sortedTriggers.findIndex((t) => t.id === selectedTriggerForDetail.id);
          if (idx !== -1 && idx < sortedTriggers.length - 1) {
            setSelectedTriggerForDetail(sortedTriggers[idx + 1]);
          }
        }}
        hasPrev={Boolean(
          selectedTriggerForDetail &&
            sortedTriggers.findIndex((t) => t.id === selectedTriggerForDetail.id) > 0
        )}
        hasNext={Boolean(
          selectedTriggerForDetail &&
            sortedTriggers.findIndex((t) => t.id === selectedTriggerForDetail.id) <
              sortedTriggers.length - 1
        )}
      />
    </div>
  );
};
