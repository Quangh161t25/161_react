import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  GitBranch,
  LayoutGrid,
  Download,
  Plus,
  SquarePen,
  Trash2,
  List,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChartColumn,
} from 'lucide-react';
import { ApprovalThreshold, MasterStatus } from '../../../types/financeMaster';
import { approvalThresholdService } from '../../../services/financeMasterService';
import {
  ColumnCustomizerPopover,
  ColumnItem,
  TableDensity,
} from '../../common/ColumnCustomizerPopover';
import { ApprovalThresholdDetailDrawer } from './ApprovalThresholdDetailDrawer';
import { ApprovalThresholdFormDrawer } from './ApprovalThresholdFormDrawer';
import { ApprovalThresholdStatsTab } from './ApprovalThresholdStatsTab';

interface ApprovalThresholdPageProps {
  onBack: () => void;
}

export const DEFAULT_THRESHOLD_COLUMNS: ColumnItem[] = [
  { id: 'code', label: 'Mã ngưỡng', visible: true, pinned: true, width: 130, align: 'left', wrap: 'truncate' },
  { id: 'name', label: 'Tên quy tắc', visible: true, pinned: true, width: 260, align: 'left', wrap: 'truncate' },
  { id: 'amountRange', label: 'Hạn mức số tiền (VNĐ)', visible: true, width: 260, align: 'left', wrap: 'truncate' },
  { id: 'approvalLevels', label: 'Cấp duyệt', visible: true, width: 120, align: 'center', wrap: 'truncate' },
  { id: 'approvers', label: 'Luồng người phê duyệt', visible: true, width: 340, align: 'left', wrap: 'truncate' },
  { id: 'appliesTo', label: 'Nghiệp vụ áp dụng', visible: true, width: 180, align: 'center', wrap: 'truncate' },
  { id: 'department', label: 'Phòng ban', visible: false, width: 180, align: 'left', wrap: 'truncate' },
  { id: 'category', label: 'Khoản mục', visible: false, width: 180, align: 'left', wrap: 'truncate' },
  { id: 'status', label: 'Trạng thái', visible: true, width: 140, align: 'center', wrap: 'truncate' },
  { id: 'note', label: 'Ghi chú', visible: false, width: 220, align: 'left', wrap: 'truncate' },
  { id: 'createdAt', label: 'Ngày tạo', visible: false, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'updatedAt', label: 'Cập nhật', visible: false, width: 130, align: 'center', wrap: 'truncate' },
];

export const ApprovalThresholdPage: React.FC<ApprovalThresholdPageProps> = ({ onBack }) => {
  const formatMoney = (n: number) => (n ? n.toLocaleString('vi-VN') : '0');

  // Data states
  const [thresholds, setThresholds] = useState<ApprovalThreshold[]>(() =>
    approvalThresholdService.getInitialThresholds()
  );
  const [activeTopTab, setActiveTopTab] = useState<'list' | 'stats'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppliesTo, setSelectedAppliesTo] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | MasterStatus>('all');

  // Filter Dropdowns
  const [isAppliesDropdownOpen, setIsAppliesDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Resizing state
  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const resizingRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);
  const lastSelectedIdRef = useRef<string | null>(null);

  // Column Customizer & Density State
  const [tableColumns, setTableColumns] = useState<ColumnItem[]>(() => {
    try {
      const saved = localStorage.getItem('erp_approval_threshold_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingMap = new Map(parsed.map((p: ColumnItem) => [p.id, p]));
          const merged: ColumnItem[] = [];
          parsed.forEach((p: ColumnItem) => {
            const def = DEFAULT_THRESHOLD_COLUMNS.find((d) => d.id === p.id);
            if (def) {
              merged.push({
                ...def,
                ...p,
                width: p.width || def.width || 160,
                pinned: p.pinned !== undefined ? p.pinned : def.pinned,
                align: p.align || def.align || 'left',
                wrap: p.wrap || def.wrap || 'truncate',
              });
            }
          });
          DEFAULT_THRESHOLD_COLUMNS.forEach((def) => {
            if (!existingMap.has(def.id)) merged.push(def);
          });
          return merged;
        }
      }
    } catch {}
    return DEFAULT_THRESHOLD_COLUMNS;
  });

  const [tableDensity, setTableDensity] = useState<TableDensity>(() => {
    try {
      return (localStorage.getItem('erp_approval_threshold_density') as TableDensity) || 'normal';
    } catch {
      return 'normal';
    }
  });

  // Drawers
  const [selectedThresholdForDetail, setSelectedThresholdForDetail] = useState<ApprovalThreshold | null>(null);
  const [formDrawerState, setFormDrawerState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    threshold?: ApprovalThreshold | null;
  }>({
    isOpen: false,
    mode: 'create',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Auto-fetch data from Google Sheets on mount
  useEffect(() => {
    let isMounted = true;
    const loadFromSheets = async () => {
      try {
        setIsSyncing(true);
        const data = await approvalThresholdService.fetchFromSheet();
        if (isMounted && data && data.length > 0) {
          setThresholds(data);
        }
      } catch (e) {
        console.warn('Initial thresholds fetch failed:', e);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };
    loadFromSheets();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveColumns = (newCols: ColumnItem[]) => {
    setTableColumns(newCols);
    try {
      localStorage.setItem('erp_approval_threshold_columns', JSON.stringify(newCols));
    } catch {}
  };

  const handleResetColumns = () => {
    setTableColumns(DEFAULT_THRESHOLD_COLUMNS);
    try {
      localStorage.removeItem('erp_approval_threshold_columns');
    } catch {}
  };

  const handleSaveDensity = (newDensity: TableDensity) => {
    setTableDensity(newDensity);
    try {
      localStorage.setItem('erp_approval_threshold_density', newDensity);
    } catch {}
  };

  const handleSyncFromSheets = async () => {
    setIsSyncing(true);
    setSyncToastMessage(null);
    setSyncError(null);
    try {
      const data = await approvalThresholdService.fetchFromSheet();
      setThresholds(data);
      setSyncToastMessage(`Đồng bộ thành công ${data.length} ngưỡng duyệt từ Google Sheets`);
    } catch (err: any) {
      setSyncError(err.message || 'Lỗi đồng bộ Google Sheets');
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncToastMessage(null);
        setSyncError(null);
      }, 4000);
    }
  };

  // Filter Thresholds
  const filteredThresholds = useMemo(() => {
    return thresholds.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = t.code.toLowerCase().includes(q);
        const matchName = t.name.toLowerCase().includes(q);
        const matchDept = (t.department || '').toLowerCase().includes(q);
        const matchApprovers = (t.approvers || []).some((app) => app.toLowerCase().includes(q));
        if (!matchCode && !matchName && !matchDept && !matchApprovers) return false;
      }

      if (selectedAppliesTo !== 'all' && t.appliesTo !== selectedAppliesTo) return false;
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;

      return true;
    });
  }, [thresholds, searchQuery, selectedAppliesTo, selectedStatus]);

  const paginatedThresholds = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredThresholds.slice(start, start + itemsPerPage);
  }, [filteredThresholds, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredThresholds.length / itemsPerPage) || 1;

  // Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedThresholds.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey && lastSelectedIdRef.current) {
      const allIds = paginatedThresholds.map((t) => t.id);
      const start = allIds.indexOf(lastSelectedIdRef.current);
      const end = allIds.indexOf(id);
      if (start !== -1 && end !== -1) {
        const [low, high] = start < end ? [start, end] : [end, start];
        const rangeIds = allIds.slice(low, high + 1);
        setSelectedIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
        lastSelectedIdRef.current = id;
        return;
      }
    }
    lastSelectedIdRef.current = id;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // CRUD
  const handleSaveThreshold = async (t: ApprovalThreshold) => {
    let updated: ApprovalThreshold[];
    const isEdit = thresholds.some((item) => item.id === t.id || item.code === t.code);

    if (isEdit) {
      updated = thresholds.map((item) => (item.id === t.id || item.code === t.code ? t : item));
      await approvalThresholdService.updateInSheet(t);
    } else {
      updated = [t, ...thresholds];
      await approvalThresholdService.appendToSheet(t);
    }

    setThresholds(updated);
    approvalThresholdService.saveToCache(updated);
    if (selectedThresholdForDetail?.id === t.id) {
      setSelectedThresholdForDetail(t);
    }
  };

  const handleDeleteThreshold = async (idOrCode: string) => {
    const updated = thresholds.filter((t) => t.id !== idOrCode && t.code !== idOrCode);
    setThresholds(updated);
    setSelectedIds((prev) => prev.filter((id) => id !== idOrCode));
    approvalThresholdService.saveToCache(updated);
    await approvalThresholdService.deleteFromSheet(idOrCode);
  };

  const handleBatchDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá ${selectedIds.length} quy tắc ngưỡng duyệt đã chọn?`)) {
      return;
    }
    const selectedThrs = thresholds.filter((t) => selectedIds.includes(t.id));
    const codesToDelete = selectedThrs.map((t) => t.code || t.id);
    const updated = thresholds.filter((t) => !selectedIds.includes(t.id));
    setThresholds(updated);
    setSelectedIds([]);
    approvalThresholdService.saveToCache(updated);
    await approvalThresholdService.deleteFromSheet(codesToDelete);
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport =
      selectedIds.length > 0
        ? thresholds.filter((t) => selectedIds.includes(t.id))
        : filteredThresholds;

    const headers = ['Mã ngưỡng', 'Tên quy tắc', 'Từ (VNĐ)', 'Đến (VNĐ)', 'Số cấp duyệt', 'Luồng người duyệt', 'Áp dụng', 'Phòng ban', 'Trạng thái'];
    const rows = listToExport.map((t) => [
      t.code,
      `"${t.name.replace(/"/g, '""')}"`,
      t.minAmount || 0,
      t.maxAmount === 0 ? 'Không giới hạn' : t.maxAmount || 0,
      t.approvalLevels,
      `"${(t.approvers || []).join(' -> ').replace(/"/g, '""')}"`,
      t.appliesTo === 'proposal' ? 'Đề xuất chi phí' : t.appliesTo === 'expense' ? 'Phiếu chi' : 'Tất cả',
      t.department || 'Tất cả',
      t.status === 'active' ? 'Hiệu lực' : 'Tạm ngưng',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nguong_duyet_chi_phi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Resizing
  const handleMouseDownResize = (colId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const col = tableColumns.find((c) => c.id === colId);
    if (!col) return;
    setResizingColId(colId);
    resizingRef.current = {
      colId,
      startX: e.clientX,
      startWidth: col.width || 150,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { colId, startX, startWidth } = resizingRef.current;
      const delta = e.clientX - startX;
      const newWidth = Math.max(60, startWidth + delta);
      setTableColumns((prev) =>
        prev.map((c) => (c.id === colId ? { ...c, width: newWidth } : c))
      );
    };

    const handleMouseUp = () => {
      if (resizingRef.current) {
        resizingRef.current = null;
        setResizingColId(null);
        try {
          localStorage.setItem('erp_approval_threshold_columns', JSON.stringify(tableColumns));
        } catch {}
      }
    };

    if (resizingColId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColId, tableColumns]);

  const visibleColumns = useMemo(() => tableColumns.filter((c) => c.visible), [tableColumns]);

  const leftPinnedOffsets = useMemo(() => {
    let offset = 48;
    const offsets: Record<string, number> = {};
    visibleColumns.forEach((col) => {
      if (col.pinned) {
        offsets[col.id] = offset;
        offset += col.width || 150;
      }
    });
    return offsets;
  }, [visibleColumns]);

  const densityPadding: Record<TableDensity, string> = {
    compact: 'py-1.5 px-3 text-xs',
    normal: 'py-2.5 px-3 text-xs',
    relaxed: 'py-3.5 px-4 text-sm',
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-background">
      <div className="flex-1 min-h-0 flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* TOP TABS */}
        <div className="px-3 pt-3 border-b border-border flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors mr-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>

            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setActiveTopTab('list')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTopTab === 'list'
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Danh sách ({thresholds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTopTab('stats')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTopTab === 'stats'
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ChartColumn className="w-3.5 h-3.5" />
                <span>Ma trận phê duyệt</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {syncToastMessage && (
            <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 animate-in fade-in-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{syncToastMessage}</span>
            </div>
          )}
          {syncError && (
            <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/20 animate-in fade-in-0">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{syncError}</span>
            </div>
          )}
        </div>

        {/* TAB 1: LIST VIEW */}
        {activeTopTab === 'list' ? (
          <div className="flex-1 min-h-0 flex flex-col">
            {/* TOOLBAR */}
            <div className="p-3 border-b border-border flex items-center justify-between gap-2 flex-wrap">
              {/* Search & Filters */}
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {/* Search */}
                <div className="relative min-w-[220px] max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Tìm tên, người duyệt, phòng ban..."
                    className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* AppliesTo Filter */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAppliesDropdownOpen(!isAppliesDropdownOpen);
                      setIsStatusDropdownOpen(false);
                    }}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>
                      {selectedAppliesTo === 'all'
                        ? 'Tất cả nghiệp vụ'
                        : selectedAppliesTo === 'proposal'
                        ? 'Đề xuất chi phí'
                        : selectedAppliesTo === 'expense'
                        ? 'Phiếu chi tiền'
                        : 'Tạm ứng'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  {isAppliesDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-44 rounded-lg border border-border bg-card shadow-lg z-30 p-1 text-xs animate-in fade-in-0">
                      {[
                        { id: 'all', label: 'Tất cả nghiệp vụ' },
                        { id: 'proposal', label: '📄 Đề xuất chi phí' },
                        { id: 'expense', label: '💸 Phiếu chi tiền' },
                        { id: 'advance', label: '🤝 Tạm ứng' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedAppliesTo(t.id);
                            setIsAppliesDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors ${
                            selectedAppliesTo === t.id ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsStatusDropdownOpen(!isStatusDropdownOpen);
                      setIsAppliesDropdownOpen(false);
                    }}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>
                      {selectedStatus === 'all'
                        ? 'Tất cả trạng thái'
                        : selectedStatus === 'active'
                        ? 'Đang hiệu lực'
                        : 'Tạm ngưng'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  {isStatusDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-40 rounded-lg border border-border bg-card shadow-lg z-30 p-1 text-xs animate-in fade-in-0">
                      {[
                        { id: 'all', label: 'Tất cả trạng thái' },
                        { id: 'active', label: '🟢 Đang hiệu lực' },
                        { id: 'inactive', label: '🔴 Tạm ngưng' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedStatus(s.id as any);
                            setIsStatusDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors ${
                            selectedStatus === s.id ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBatchDelete}
                    className="h-8 px-3 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-medium flex items-center gap-1.5 transition-colors animate-in fade-in-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xoá ({selectedIds.length})</span>
                  </button>
                )}

                <div className="flex items-center border border-border rounded-lg bg-background p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1 rounded text-xs transition-colors ${
                      viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Dạng bảng"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded text-xs transition-colors ${
                      viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Dạng lưới"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>

                <ColumnCustomizerPopover
                  columns={tableColumns}
                  density={tableDensity}
                  onChangeColumns={handleSaveColumns}
                  onReset={handleResetColumns}
                  onChangeDensity={handleSaveDensity}
                />

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs flex items-center gap-1.5 transition-colors"
                  title="Xuất dữ liệu CSV"
                >
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">Xuất CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncFromSheets}
                  disabled={isSyncing}
                  className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Đồng bộ từ Google Sheets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isSyncing ? 'animate-spin text-primary' : ''}`} />
                  <span className="hidden sm:inline">Đồng bộ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormDrawerState({ isOpen: true, mode: 'create' })}
                  className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-primary/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm ngưỡng duyệt</span>
                </button>
              </div>
            </div>

            {/* TABLE / GRID */}
            <div className="flex-1 min-h-0 overflow-auto relative">
              {viewMode === 'table' ? (
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full border-separate border-spacing-0 text-left">
                    <thead className="bg-muted/80 backdrop-blur sticky top-0 z-20">
                      <tr>
                        <th className="sticky left-0 top-0 z-30 bg-muted/95 border-b border-border w-12 px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={
                              paginatedThresholds.length > 0 &&
                              paginatedThresholds.every((t) => selectedIds.includes(t.id))
                            }
                            onChange={handleSelectAll}
                            className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                          />
                        </th>

                        {visibleColumns.map((col) => {
                          const isPinned = !!col.pinned;
                          const leftOffset = isPinned ? leftPinnedOffsets[col.id] : undefined;

                          return (
                            <th
                              key={col.id}
                              style={{
                                width: col.width || 150,
                                minWidth: col.width || 150,
                                left: isPinned ? `${leftOffset}px` : undefined,
                              }}
                              className={`sticky top-0 border-b border-border font-semibold text-xs text-foreground select-none relative group ${
                                isPinned ? 'z-30 bg-muted/95 shadow-[1px_0_0_0_hsl(var(--border))]' : 'z-20 bg-muted/80'
                              } ${
                                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                              } px-3 py-2.5`}
                            >
                              <span>{col.label}</span>
                              <div
                                onMouseDown={(e) => handleMouseDownResize(col.id, e)}
                                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 group-hover:bg-border/60 transition-colors"
                              />
                            </th>
                          );
                        })}

                        <th className="sticky right-0 top-0 z-30 bg-muted/95 border-b border-border w-24 px-3 py-2.5 text-center font-semibold text-xs text-foreground shadow-[-1px_0_0_0_hsl(var(--border))]">
                          Thao tác
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border bg-card">
                      {paginatedThresholds.length === 0 ? (
                        <tr>
                          <td
                            colSpan={visibleColumns.length + 2}
                            className="text-center py-12 text-xs text-muted-foreground"
                          >
                            <GitBranch className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                            Không tìm thấy quy tắc ngưỡng duyệt nào
                          </td>
                        </tr>
                      ) : (
                        paginatedThresholds.map((item) => {
                          const isSelected = selectedIds.includes(item.id);

                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedThresholdForDetail(item)}
                              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                                isSelected ? 'bg-primary/5' : ''
                              }`}
                            >
                              <td
                                onClick={(e) => handleSelectRow(item.id, e)}
                                className={`sticky left-0 z-10 w-12 px-3 text-center border-b border-border ${
                                  isSelected ? 'bg-primary/5' : 'bg-card'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                                />
                              </td>

                              {visibleColumns.map((col) => {
                                const isPinned = !!col.pinned;
                                const leftOffset = isPinned ? leftPinnedOffsets[col.id] : undefined;

                                return (
                                  <td
                                    key={col.id}
                                    style={{
                                      width: col.width || 150,
                                      minWidth: col.width || 150,
                                      left: isPinned ? `${leftOffset}px` : undefined,
                                    }}
                                    className={`border-b border-border ${densityPadding} ${
                                      isPinned
                                        ? `sticky z-10 shadow-[1px_0_0_0_hsl(var(--border))] ${
                                            isSelected ? 'bg-primary/5' : 'bg-card'
                                          }`
                                        : ''
                                    } ${
                                      col.align === 'center'
                                        ? 'text-center'
                                        : col.align === 'right'
                                        ? 'text-right'
                                        : 'text-left'
                                    }`}
                                  >
                                    {col.id === 'code' ? (
                                      <span className="font-mono font-semibold text-primary">
                                        {item.code}
                                      </span>
                                    ) : col.id === 'name' ? (
                                      <span className="font-semibold text-foreground truncate block">
                                        {item.name}
                                      </span>
                                    ) : col.id === 'amountRange' ? (
                                      <span className="font-mono font-medium text-foreground">
                                        {formatMoney(item.minAmount)} đ →{' '}
                                        {item.maxAmount === 0 ? (
                                          <span className="text-primary font-bold">Không giới hạn</span>
                                        ) : (
                                          `${formatMoney(item.maxAmount)} đ`
                                        )}
                                      </span>
                                    ) : col.id === 'approvalLevels' ? (
                                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                        {item.approvalLevels} Cấp
                                      </span>
                                    ) : col.id === 'approvers' ? (
                                      <div className="flex items-center gap-1.5 truncate">
                                        {item.approvers && item.approvers.length > 0 ? (
                                          item.approvers.map((app, idx) => (
                                            <React.Fragment key={idx}>
                                              <span className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-medium text-foreground truncate">
                                                {app}
                                              </span>
                                              {idx < item.approvers.length - 1 && (
                                                <span className="text-muted-foreground text-[10px]">→</span>
                                              )}
                                            </React.Fragment>
                                          ))
                                        ) : (
                                          <span className="text-muted-foreground">—</span>
                                        )}
                                      </div>
                                    ) : col.id === 'appliesTo' ? (
                                      <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-foreground font-medium">
                                        {item.appliesTo === 'proposal'
                                          ? 'Đề xuất chi'
                                          : item.appliesTo === 'expense'
                                          ? 'Phiếu chi'
                                          : item.appliesTo === 'advance'
                                          ? 'Tạm ứng'
                                          : 'Tất cả'}
                                      </span>
                                    ) : col.id === 'status' ? (
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                          item.status === 'active'
                                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                            : 'bg-muted text-muted-foreground border border-border'
                                        }`}
                                      >
                                        {item.status === 'active' ? 'Hiệu lực' : 'Tạm ngưng'}
                                      </span>
                                    ) : (
                                      <span className="text-foreground truncate block">
                                        {(item as any)[col.id] || '—'}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}

                              <td
                                onClick={(e) => e.stopPropagation()}
                                className={`sticky right-0 z-10 w-24 px-3 border-b border-border text-center shadow-[-1px_0_0_0_hsl(var(--border))] ${
                                  isSelected ? 'bg-primary/5' : 'bg-card'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFormDrawerState({ isOpen: true, mode: 'edit', threshold: item })
                                    }
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    title="Sửa"
                                  >
                                    <SquarePen className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Xoá ngưỡng duyệt "${item.name}"?`)) {
                                        handleDeleteThreshold(item.code || item.id);
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
              ) : (
                /* GRID VIEW */
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {paginatedThresholds.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedThresholdForDetail(item)}
                      className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {item.code}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              item.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {item.status === 'active' ? 'Hiệu lực' : 'Tạm ngưng'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-foreground line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                            {formatMoney(item.minAmount)} đ →{' '}
                            {item.maxAmount === 0 ? 'Không giới hạn' : `${formatMoney(item.maxAmount)} đ`}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <span>{item.approvalLevels} Cấp duyệt</span>
                        <span className="font-medium text-primary truncate max-w-[150px]">
                          {(item.approvers || []).join(' → ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PAGINATION FOOTER */}
            <div className="px-4 py-2.5 border-t border-border bg-card flex items-center justify-between gap-2 flex-wrap text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Hiển thị</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-7 px-2 rounded-md border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>trên tổng số {filteredThresholds.length} dòng</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                  title="Trang đầu"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium text-foreground">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                  title="Trang tiếp"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                  title="Trang cuối"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <ApprovalThresholdStatsTab
            thresholds={thresholds}
            onSelectThreshold={(t) => setSelectedThresholdForDetail(t)}
          />
        )}
      </div>

      {/* DETAIL DRAWER */}
      {selectedThresholdForDetail && (
        <ApprovalThresholdDetailDrawer
          threshold={selectedThresholdForDetail}
          currentIndex={thresholds.findIndex((t) => t.id === selectedThresholdForDetail.id)}
          totalCount={thresholds.length}
          onClose={() => setSelectedThresholdForDetail(null)}
          onPrev={() => {
            const idx = thresholds.findIndex((t) => t.id === selectedThresholdForDetail.id);
            if (idx > 0) setSelectedThresholdForDetail(thresholds[idx - 1]);
          }}
          onNext={() => {
            const idx = thresholds.findIndex((t) => t.id === selectedThresholdForDetail.id);
            if (idx < thresholds.length - 1) setSelectedThresholdForDetail(thresholds[idx + 1]);
          }}
          onEdit={(t) => {
            setSelectedThresholdForDetail(null);
            setFormDrawerState({ isOpen: true, mode: 'edit', threshold: t });
          }}
          onDelete={(id) => {
            handleDeleteThreshold(id);
            setSelectedThresholdForDetail(null);
          }}
        />
      )}

      {/* FORM DRAWER */}
      {formDrawerState.isOpen && (
        <ApprovalThresholdFormDrawer
          mode={formDrawerState.mode}
          threshold={formDrawerState.threshold}
          allThresholds={thresholds}
          onClose={() => setFormDrawerState({ isOpen: false, mode: 'create' })}
          onSave={handleSaveThreshold}
        />
      )}
    </div>
  );
};
