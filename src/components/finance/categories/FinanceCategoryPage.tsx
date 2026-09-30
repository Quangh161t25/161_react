import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  FolderTree,
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
  Layers,
} from 'lucide-react';
import { FinanceCategory, CategoryType, MasterStatus } from '../../../types/financeMaster';
import { financeCategoryService } from '../../../services/financeMasterService';
import {
  ColumnCustomizerPopover,
  ColumnItem,
  TableDensity,
} from '../../common/ColumnCustomizerPopover';
import { FinanceCategoryDetailDrawer } from './FinanceCategoryDetailDrawer';
import { FinanceCategoryFormDrawer } from './FinanceCategoryFormDrawer';
import { FinanceCategoryStatsTab } from './FinanceCategoryStatsTab';

interface FinanceCategoryPageProps {
  onBack: () => void;
}

export const DEFAULT_CATEGORY_COLUMNS: ColumnItem[] = [
  { id: 'code', label: 'Mã khoản mục', visible: true, pinned: true, width: 140, align: 'left', wrap: 'truncate' },
  { id: 'name', label: 'Tên khoản mục', visible: true, pinned: true, width: 260, align: 'left', wrap: 'truncate' },
  { id: 'type', label: 'Loại khoản mục', visible: true, width: 160, align: 'center', wrap: 'truncate' },
  { id: 'level', label: 'Cấp độ', visible: true, width: 120, align: 'center', wrap: 'truncate' },
  { id: 'parentCategory', label: 'Nhóm cha (Cấp 1)', visible: true, width: 220, align: 'left', wrap: 'truncate' },
  { id: 'description', label: 'Diễn giải / Mô tả', visible: true, width: 300, align: 'left', wrap: 'truncate' },
  { id: 'status', label: 'Trạng thái', visible: true, width: 140, align: 'center', wrap: 'truncate' },
  { id: 'order', label: 'Thứ tự', visible: false, width: 100, align: 'center', wrap: 'truncate' },
  { id: 'createdBy', label: 'Người tạo', visible: false, width: 150, align: 'left', wrap: 'truncate' },
  { id: 'createdAt', label: 'Ngày tạo', visible: false, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'updatedAt', label: 'Cập nhật', visible: false, width: 130, align: 'center', wrap: 'truncate' },
];

export const FinanceCategoryPage: React.FC<FinanceCategoryPageProps> = ({ onBack }) => {
  // Data states
  const [categories, setCategories] = useState<FinanceCategory[]>(() =>
    financeCategoryService.getInitialCategories()
  );
  const [activeTopTab, setActiveTopTab] = useState<'list' | 'stats'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | CategoryType>('all');
  const [selectedLevel, setSelectedLevel] = useState<'all' | '1' | '2'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | MasterStatus>('all');

  // Filter Dropdowns
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
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
      const saved = localStorage.getItem('erp_finance_category_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingMap = new Map(parsed.map((p: ColumnItem) => [p.id, p]));
          const merged: ColumnItem[] = [];
          parsed.forEach((p: ColumnItem) => {
            const def = DEFAULT_CATEGORY_COLUMNS.find((d) => d.id === p.id);
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
          DEFAULT_CATEGORY_COLUMNS.forEach((def) => {
            if (!existingMap.has(def.id)) merged.push(def);
          });
          return merged;
        }
      }
    } catch {}
    return DEFAULT_CATEGORY_COLUMNS;
  });

  const [tableDensity, setTableDensity] = useState<TableDensity>(() => {
    try {
      return (localStorage.getItem('erp_finance_category_density') as TableDensity) || 'normal';
    } catch {
      return 'normal';
    }
  });

  // Drawers
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = useState<FinanceCategory | null>(null);
  const [formDrawerState, setFormDrawerState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    category?: FinanceCategory | null;
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
        const data = await financeCategoryService.fetchFromSheet();
        if (isMounted && data && data.length > 0) {
          setCategories(data);
        }
      } catch (e) {
        console.warn('Initial categories fetch failed:', e);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };
    loadFromSheets();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save Column changes to localStorage
  const handleSaveColumns = (newCols: ColumnItem[]) => {
    setTableColumns(newCols);
    try {
      localStorage.setItem('erp_finance_category_columns', JSON.stringify(newCols));
    } catch {}
  };

  const handleResetColumns = () => {
    setTableColumns(DEFAULT_CATEGORY_COLUMNS);
    try {
      localStorage.removeItem('erp_finance_category_columns');
    } catch {}
  };

  const handleSaveDensity = (newDensity: TableDensity) => {
    setTableDensity(newDensity);
    try {
      localStorage.setItem('erp_finance_category_density', newDensity);
    } catch {}
  };

  // Manual Google Sheets Sync
  const handleSyncFromSheets = async () => {
    setIsSyncing(true);
    setSyncToastMessage(null);
    setSyncError(null);
    try {
      const data = await financeCategoryService.fetchFromSheet();
      setCategories(data);
      setSyncToastMessage(`Đồng bộ thành công ${data.length} khoản mục từ Google Sheets`);
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

  // Filter Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = c.code.toLowerCase().includes(q);
        const matchName = c.name.toLowerCase().includes(q);
        const matchParent = (c.parentCategory || '').toLowerCase().includes(q);
        const matchDesc = (c.description || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchParent && !matchDesc) return false;
      }

      // Type
      if (selectedType !== 'all' && c.type !== selectedType) return false;

      // Level
      if (selectedLevel !== 'all' && String(c.level) !== selectedLevel) return false;

      // Status
      if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;

      return true;
    });
  }, [categories, searchQuery, selectedType, selectedLevel, selectedStatus]);

  // Pagination slice
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage) || 1;

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedCategories.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey && lastSelectedIdRef.current) {
      const allIds = paginatedCategories.map((c) => c.id);
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

  // CRUD Operations
  const handleSaveCategory = async (cat: FinanceCategory) => {
    const isEdit = categories.some((c) => c.id === cat.id || c.code === cat.code);
    let updated: FinanceCategory[];
    if (isEdit) {
      updated = categories.map((c) => (c.id === cat.id || c.code === cat.code ? cat : c));
      await financeCategoryService.updateInSheet(cat);
    } else {
      updated = [cat, ...categories];
      await financeCategoryService.appendToSheet(cat);
    }
    setCategories(updated);
    financeCategoryService.saveToCache(updated);
    if (selectedCategoryForDetail?.id === cat.id) {
      setSelectedCategoryForDetail(cat);
    }
  };

  const handleDeleteCategory = async (idOrCode: string) => {
    const updated = categories.filter((c) => c.id !== idOrCode && c.code !== idOrCode);
    setCategories(updated);
    setSelectedIds((prev) => prev.filter((id) => id !== idOrCode));
    financeCategoryService.saveToCache(updated);
    await financeCategoryService.deleteFromSheet(idOrCode);
  };

  const handleBatchDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá ${selectedIds.length} khoản mục đã chọn?`)) {
      return;
    }
    const selectedCats = categories.filter((c) => selectedIds.includes(c.id));
    const codesToDelete = selectedCats.map((c) => c.code || c.id);
    const updated = categories.filter((c) => !selectedIds.includes(c.id));
    setCategories(updated);
    setSelectedIds([]);
    financeCategoryService.saveToCache(updated);
    await financeCategoryService.deleteFromSheet(codesToDelete);
  };

  // CSV Export
  const handleExportCSV = () => {
    const listToExport =
      selectedIds.length > 0
        ? categories.filter((c) => selectedIds.includes(c.id))
        : filteredCategories;

    const headers = ['Mã', 'Tên khoản mục', 'Loại', 'Cấp', 'Nhóm cha', 'Trạng thái', 'Mô tả', 'Người tạo', 'Ngày tạo'];
    const rows = listToExport.map((c) => [
      c.code,
      c.name,
      c.type === 'income' ? 'Thu tiền' : c.type === 'expense' ? 'Chi tiền' : 'Luân chuyển',
      c.level === 1 ? 'Cấp 1' : 'Cấp 2',
      c.parentCategory || '',
      c.status === 'active' ? 'Đang sử dụng' : 'Tạm ngưng',
      `"${(c.description || '').replace(/"/g, '""')}"`,
      c.createdBy || '',
      c.createdAt || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Danh_muc_tai_chinh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Resizing logic
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
          localStorage.setItem('erp_finance_category_columns', JSON.stringify(tableColumns));
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

  // Visible columns & sticky offsets
  const visibleColumns = useMemo(() => tableColumns.filter((c) => c.visible), [tableColumns]);

  const leftPinnedOffsets = useMemo(() => {
    let offset = 48; // Checkbox column
    const offsets: Record<string, number> = {};
    visibleColumns.forEach((col) => {
      if (col.pinned) {
        offsets[col.id] = offset;
        offset += col.width || 150;
      }
    });
    return offsets;
  }, [visibleColumns]);

  // Density padding
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
                <span>Danh sách ({categories.length})</span>
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
                <span>Thống kê & Cây danh mục</span>
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
                    placeholder="Tìm tên, mã, nhóm cha..."
                    className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Type Filter */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTypeDropdownOpen(!isTypeDropdownOpen);
                      setIsLevelDropdownOpen(false);
                      setIsStatusDropdownOpen(false);
                    }}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>
                      {selectedType === 'all'
                        ? 'Tất cả loại'
                        : selectedType === 'income'
                        ? 'Thu tiền'
                        : selectedType === 'expense'
                        ? 'Chi tiền'
                        : 'Luân chuyển'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  {isTypeDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-40 rounded-lg border border-border bg-card shadow-lg z-30 p-1 text-xs animate-in fade-in-0">
                      {[
                        { id: 'all', label: 'Tất cả loại' },
                        { id: 'income', label: '💰 Thu tiền' },
                        { id: 'expense', label: '💸 Chi tiền' },
                        { id: 'transfer', label: '🔄 Luân chuyển' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedType(t.id as any);
                            setIsTypeDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors ${
                            selectedType === t.id ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Level Filter */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLevelDropdownOpen(!isLevelDropdownOpen);
                      setIsTypeDropdownOpen(false);
                      setIsStatusDropdownOpen(false);
                    }}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>
                      {selectedLevel === 'all'
                        ? 'Tất cả cấp'
                        : selectedLevel === '1'
                        ? 'Cấp 1 (Nhóm cha)'
                        : 'Cấp 2 (Mục con)'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  {isLevelDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-44 rounded-lg border border-border bg-card shadow-lg z-30 p-1 text-xs animate-in fade-in-0">
                      {[
                        { id: 'all', label: 'Tất cả cấp độ' },
                        { id: '1', label: '📁 Cấp 1 (Nhóm cha)' },
                        { id: '2', label: '📄 Cấp 2 (Khoản mục con)' },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => {
                            setSelectedLevel(lvl.id as any);
                            setIsLevelDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors ${
                            selectedLevel === lvl.id ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'
                          }`}
                        >
                          {lvl.label}
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
                      setIsTypeDropdownOpen(false);
                      setIsLevelDropdownOpen(false);
                    }}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>
                      {selectedStatus === 'all'
                        ? 'Tất cả trạng thái'
                        : selectedStatus === 'active'
                        ? 'Đang sử dụng'
                        : 'Tạm ngưng'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  {isStatusDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-40 rounded-lg border border-border bg-card shadow-lg z-30 p-1 text-xs animate-in fade-in-0">
                      {[
                        { id: 'all', label: 'Tất cả trạng thái' },
                        { id: 'active', label: '🟢 Đang sử dụng' },
                        { id: 'inactive', label: '⚪ Tạm ngưng' },
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
                {/* Batch Delete */}
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

                {/* View Mode */}
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

                {/* Column Customizer */}
                <ColumnCustomizerPopover
                  columns={tableColumns}
                  density={tableDensity}
                  onChangeColumns={handleSaveColumns}
                  onReset={handleResetColumns}
                  onChangeDensity={handleSaveDensity}
                />

                {/* Export CSV */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs flex items-center gap-1.5 transition-colors"
                  title="Xuất dữ liệu CSV"
                >
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">Xuất CSV</span>
                </button>

                {/* Sync Sheets */}
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

                {/* Create Button */}
                <button
                  type="button"
                  onClick={() => setFormDrawerState({ isOpen: true, mode: 'create' })}
                  className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-primary/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm danh mục</span>
                </button>
              </div>
            </div>

            {/* TABLE / GRID CONTAINER */}
            <div className="flex-1 min-h-0 overflow-auto relative">
              {viewMode === 'table' ? (
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full border-separate border-spacing-0 text-left">
                    {/* Header */}
                    <thead className="bg-muted/80 backdrop-blur sticky top-0 z-20">
                      <tr>
                        {/* Checkbox Header */}
                        <th className="sticky left-0 top-0 z-30 bg-muted/95 border-b border-border w-12 px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={
                              paginatedCategories.length > 0 &&
                              paginatedCategories.every((c) => selectedIds.includes(c.id))
                            }
                            onChange={handleSelectAll}
                            className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                          />
                        </th>

                        {/* Dynamic Columns */}
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

                              {/* Resize Handle */}
                              <div
                                onMouseDown={(e) => handleMouseDownResize(col.id, e)}
                                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 group-hover:bg-border/60 transition-colors"
                              />
                            </th>
                          );
                        })}

                        {/* Action Header */}
                        <th className="sticky right-0 top-0 z-30 bg-muted/95 border-b border-border w-24 px-3 py-2.5 text-center font-semibold text-xs text-foreground shadow-[-1px_0_0_0_hsl(var(--border))]">
                          Thao tác
                        </th>
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody className="divide-y divide-border bg-card">
                      {paginatedCategories.length === 0 ? (
                        <tr>
                          <td
                            colSpan={visibleColumns.length + 2}
                            className="text-center py-12 text-xs text-muted-foreground"
                          >
                            <FolderTree className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                            Không tìm thấy khoản mục nào phù hợp
                          </td>
                        </tr>
                      ) : (
                        paginatedCategories.map((item) => {
                          const isSelected = selectedIds.includes(item.id);

                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedCategoryForDetail(item)}
                              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                                isSelected ? 'bg-primary/5' : ''
                              }`}
                            >
                              {/* Checkbox Cell */}
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

                              {/* Dynamic Cells */}
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
                                      <div className="flex items-center gap-2 truncate">
                                        {item.level === 1 ? (
                                          <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                                        ) : (
                                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0 ml-1.5" />
                                        )}
                                        <span className={`truncate ${item.level === 1 ? 'font-semibold text-foreground' : 'text-foreground/90'}`}>
                                          {item.name}
                                        </span>
                                      </div>
                                    ) : col.id === 'type' ? (
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                          item.type === 'income'
                                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                            : item.type === 'expense'
                                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                            : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                        }`}
                                      >
                                        {item.type === 'income'
                                          ? 'Thu tiền'
                                          : item.type === 'expense'
                                          ? 'Chi tiền'
                                          : 'Luân chuyển'}
                                      </span>
                                    ) : col.id === 'level' ? (
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                                          item.level === 1
                                            ? 'bg-primary/10 text-primary font-semibold'
                                            : 'bg-muted text-muted-foreground'
                                        }`}
                                      >
                                        {item.level === 1 ? 'Cấp 1' : 'Cấp 2'}
                                      </span>
                                    ) : col.id === 'parentCategory' ? (
                                      (() => {
                                        if (!item.parentCategory) return <span className="text-muted-foreground/60">—</span>;
                                        const parent = categories.find(
                                          (c) => c.code === item.parentCategory || c.name === item.parentCategory || c.id === item.parentCategory
                                        );
                                        return (
                                          <div className="flex items-center gap-1.5 truncate">
                                            <span className="text-foreground/90 font-medium truncate">
                                              {parent ? parent.name : item.parentCategory}
                                            </span>
                                            {parent?.code && (
                                              <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border/50 shrink-0">
                                                {parent.code}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })()
                                    ) : col.id === 'status' ? (
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                          item.status === 'active'
                                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                            : 'bg-muted text-muted-foreground border border-border'
                                        }`}
                                      >
                                        {item.status === 'active' ? 'Đang sử dụng' : 'Tạm ngưng'}
                                      </span>
                                    ) : col.id === 'description' ? (
                                      <span className="text-muted-foreground truncate block">
                                        {item.description || '—'}
                                      </span>
                                    ) : (
                                      <span className="text-foreground truncate block">
                                        {(item as any)[col.id] || '—'}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}

                              {/* Actions Cell */}
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
                                      setFormDrawerState({ isOpen: true, mode: 'edit', category: item })
                                    }
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    title="Sửa"
                                  >
                                    <SquarePen className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Xoá khoản mục "${item.name}"?`)) {
                                        handleDeleteCategory(item.code || item.id);
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
                  {paginatedCategories.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedCategoryForDetail(item)}
                      className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
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
                            {item.status === 'active' ? 'Đang dùng' : 'Tạm ngưng'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-foreground line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {item.description || 'Không có mô tả chi tiết'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-primary" />
                          <span>{item.level === 1 ? 'Cấp 1 (Nhóm cha)' : `Cấp 2 (${item.parentCategory || '—'})`}</span>
                        </span>
                        <span
                          className={`font-medium ${
                            item.type === 'income'
                              ? 'text-emerald-600'
                              : item.type === 'expense'
                              ? 'text-rose-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {item.type === 'income' ? 'Thu' : item.type === 'expense' ? 'Chi' : 'Luân chuyển'}
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
                <span>trên tổng số {filteredCategories.length} dòng</span>
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
          /* TAB 2: STATS TAB */
          <FinanceCategoryStatsTab
            categories={categories}
            onSelectCategory={(cat) => setSelectedCategoryForDetail(cat)}
          />
        )}
      </div>

      {/* DETAIL DRAWER */}
      {selectedCategoryForDetail && (
        <FinanceCategoryDetailDrawer
          category={selectedCategoryForDetail}
          currentIndex={categories.findIndex((c) => c.id === selectedCategoryForDetail.id)}
          totalCount={categories.length}
          allCategories={categories}
          onClose={() => setSelectedCategoryForDetail(null)}
          onPrev={() => {
            const idx = categories.findIndex((c) => c.id === selectedCategoryForDetail.id);
            if (idx > 0) setSelectedCategoryForDetail(categories[idx - 1]);
          }}
          onNext={() => {
            const idx = categories.findIndex((c) => c.id === selectedCategoryForDetail.id);
            if (idx < categories.length - 1) setSelectedCategoryForDetail(categories[idx + 1]);
          }}
          onEdit={(cat) => {
            setSelectedCategoryForDetail(null);
            setFormDrawerState({ isOpen: true, mode: 'edit', category: cat });
          }}
          onDelete={(id) => {
            handleDeleteCategory(id);
            setSelectedCategoryForDetail(null);
          }}
        />
      )}

      {/* FORM DRAWER */}
      {formDrawerState.isOpen && (
        <FinanceCategoryFormDrawer
          mode={formDrawerState.mode}
          category={formDrawerState.category}
          allCategories={categories}
          onClose={() => setFormDrawerState({ isOpen: false, mode: 'create' })}
          onSave={handleSaveCategory}
        />
      )}
    </div>
  );
};
