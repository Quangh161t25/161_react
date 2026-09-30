import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  Users,
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
import { Counterparty, CounterpartyType, MasterStatus } from '../../../types/financeMaster';
import { counterpartyService } from '../../../services/financeMasterService';
import { cashTransactionService } from '../../../services/cashTransactionService';
import {
  ColumnCustomizerPopover,
  ColumnItem,
  TableDensity,
} from '../../common/ColumnCustomizerPopover';
import { CounterpartyDetailDrawer } from './CounterpartyDetailDrawer';
import { CounterpartyFormDrawer } from './CounterpartyFormDrawer';
import { CounterpartyStatsTab } from './CounterpartyStatsTab';

interface CounterpartyPageProps {
  onBack: () => void;
}

export const DEFAULT_COUNTERPARTY_COLUMNS: ColumnItem[] = [
  { id: 'code', label: 'Mã đối tượng', visible: true, pinned: true, width: 140, align: 'left', wrap: 'truncate' },
  { id: 'name', label: 'Tên đối tượng / Công ty', visible: true, pinned: true, width: 280, align: 'left', wrap: 'truncate' },
  { id: 'type', label: 'Phân loại', visible: true, width: 150, align: 'center', wrap: 'truncate' },
  { id: 'phone', label: 'Số điện thoại', visible: true, width: 150, align: 'left', wrap: 'truncate' },
  { id: 'taxCode', label: 'Mã số thuế', visible: true, width: 150, align: 'center', wrap: 'truncate' },
  { id: 'bankAccount', label: 'Số tài khoản', visible: true, width: 180, align: 'left', wrap: 'truncate' },
  { id: 'bankName', label: 'Ngân hàng', visible: true, width: 180, align: 'left', wrap: 'truncate' },
  { id: 'contactPerson', label: 'Người liên hệ', visible: true, width: 190, align: 'left', wrap: 'truncate' },
  { id: 'contactPersonPhone', label: 'SĐT người LH', visible: false, width: 150, align: 'left', wrap: 'truncate' },
  { id: 'email', label: 'Email', visible: false, width: 200, align: 'left', wrap: 'truncate' },
  { id: 'address', label: 'Địa chỉ', visible: false, width: 260, align: 'left', wrap: 'truncate' },
  { id: 'status', label: 'Trạng thái', visible: true, width: 140, align: 'center', wrap: 'truncate' },
  { id: 'note', label: 'Ghi chú', visible: false, width: 220, align: 'left', wrap: 'truncate' },
  { id: 'createdAt', label: 'Ngày tạo', visible: false, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'updatedAt', label: 'Cập nhật', visible: false, width: 130, align: 'center', wrap: 'truncate' },
];

export const CounterpartyPage: React.FC<CounterpartyPageProps> = ({ onBack }) => {
  // Data states
  const [counterparties, setCounterparties] = useState<Counterparty[]>(() =>
    counterpartyService.getInitialCounterparties()
  );
  const [activeTopTab, setActiveTopTab] = useState<'list' | 'stats'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | CounterpartyType>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | MasterStatus>('all');

  // Filter Dropdowns
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
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
      const saved = localStorage.getItem('erp_counterparty_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingMap = new Map(parsed.map((p: ColumnItem) => [p.id, p]));
          const merged: ColumnItem[] = [];
          parsed.forEach((p: ColumnItem) => {
            const def = DEFAULT_COUNTERPARTY_COLUMNS.find((d) => d.id === p.id);
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
          DEFAULT_COUNTERPARTY_COLUMNS.forEach((def) => {
            if (!existingMap.has(def.id)) merged.push(def);
          });
          return merged;
        }
      }
    } catch {}
    return DEFAULT_COUNTERPARTY_COLUMNS;
  });

  const [tableDensity, setTableDensity] = useState<TableDensity>(() => {
    try {
      return (localStorage.getItem('erp_counterparty_density') as TableDensity) || 'normal';
    } catch {
      return 'normal';
    }
  });

  // Drawers
  const [selectedCounterpartyForDetail, setSelectedCounterpartyForDetail] = useState<Counterparty | null>(null);
  const [formDrawerState, setFormDrawerState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    counterparty?: Counterparty | null;
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
        const data = await counterpartyService.fetchFromSheet();
        if (isMounted && data && data.length > 0) {
          setCounterparties(data);
        }
      } catch (e) {
        console.warn('Initial counterparties fetch failed:', e);
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
      localStorage.setItem('erp_counterparty_columns', JSON.stringify(newCols));
    } catch {}
  };

  const handleResetColumns = () => {
    setTableColumns(DEFAULT_COUNTERPARTY_COLUMNS);
    try {
      localStorage.removeItem('erp_counterparty_columns');
    } catch {}
  };

  const handleSaveDensity = (newDensity: TableDensity) => {
    setTableDensity(newDensity);
    try {
      localStorage.setItem('erp_counterparty_density', newDensity);
    } catch {}
  };

  const handleSyncFromSheets = async () => {
    setIsSyncing(true);
    setSyncToastMessage(null);
    setSyncError(null);
    try {
      const data = await counterpartyService.fetchFromSheet();
      setCounterparties(data);
      setSyncToastMessage(`Đồng bộ thành công ${data.length} đối tượng từ Google Sheets`);
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

  // Filter Counterparties
  const filteredCounterparties = useMemo(() => {
    return counterparties.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = c.code.toLowerCase().includes(q);
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = (c.phone || '').toLowerCase().includes(q);
        const matchTax = (c.taxCode || '').toLowerCase().includes(q);
        const matchPerson = (c.contactPerson || '').toLowerCase().includes(q);
        const matchBank = (c.bankAccount || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchPhone && !matchTax && !matchPerson && !matchBank) return false;
      }

      if (selectedType !== 'all' && c.type !== selectedType) return false;
      if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;

      return true;
    });
  }, [counterparties, searchQuery, selectedType, selectedStatus]);

  const paginatedCounterparties = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCounterparties.slice(start, start + itemsPerPage);
  }, [filteredCounterparties, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCounterparties.length / itemsPerPage) || 1;

  // Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedCounterparties.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey && lastSelectedIdRef.current) {
      const allIds = paginatedCounterparties.map((c) => c.id);
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
  const handleSaveCounterparty = async (cp: Counterparty) => {
    let updated: Counterparty[];
    const prevCp = counterparties.find((c) => c.id === cp.id || c.code === cp.code);
    const isEdit = !!prevCp;

    if (isEdit) {
      updated = counterparties.map((c) => (c.id === cp.id || c.code === cp.code ? cp : c));
      await counterpartyService.updateInSheet(cp);
    } else {
      updated = [cp, ...counterparties];
      await counterpartyService.appendToSheet(cp);
    }

    setCounterparties(updated);
    counterpartyService.saveToCache(updated);

    // Cascade update to all Cash Transactions linked to this counterparty by ID or Code
    try {
      const allTx = cashTransactionService.getInitialTransactions();
      let hasTxChanges = false;
      const updatedTxList = allTx.map((tx) => {
        const isMatched =
          tx.counterpartyId === cp.id ||
          tx.counterpartyCode === cp.code ||
          (prevCp && tx.counterpartyName && tx.counterpartyName.toLowerCase().trim() === prevCp.name.toLowerCase().trim());

        if (isMatched) {
          hasTxChanges = true;
          return {
            ...tx,
            counterpartyId: cp.id,
            counterpartyCode: cp.code,
            counterpartyName: cp.name,
            counterpartyPhone: cp.phone || tx.counterpartyPhone,
            counterpartyAddress: cp.address || tx.counterpartyAddress,
            counterpartyType: cp.type,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return tx;
      });

      if (hasTxChanges) {
        cashTransactionService.saveToCache(updatedTxList);
      }
    } catch (err) {
      console.warn('Could not cascade update cash transactions:', err);
    }

    if (selectedCounterpartyForDetail?.id === cp.id) {
      setSelectedCounterpartyForDetail(cp);
    }
  };

  const handleDeleteCounterparty = async (idOrCode: string) => {
    const updated = counterparties.filter((c) => c.id !== idOrCode && c.code !== idOrCode);
    setCounterparties(updated);
    setSelectedIds((prev) => prev.filter((id) => id !== idOrCode));
    counterpartyService.saveToCache(updated);
    await counterpartyService.deleteFromSheet(idOrCode);
  };

  const handleBatchDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá ${selectedIds.length} đối tượng đã chọn?`)) {
      return;
    }
    const selectedCps = counterparties.filter((c) => selectedIds.includes(c.id));
    const codesToDelete = selectedCps.map((c) => c.code || c.id);
    const updated = counterparties.filter((c) => !selectedIds.includes(c.id));
    setCounterparties(updated);
    setSelectedIds([]);
    counterpartyService.saveToCache(updated);
    await counterpartyService.deleteFromSheet(codesToDelete);
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport =
      selectedIds.length > 0
        ? counterparties.filter((c) => selectedIds.includes(c.id))
        : filteredCounterparties;

    const headers = ['Mã ĐT', 'Tên đối tượng', 'Phân loại', 'SĐT', 'Email', 'MST', 'STK', 'Ngân hàng', 'Người liên hệ', 'Trạng thái'];
    const rows = listToExport.map((c) => [
      c.code,
      `"${c.name.replace(/"/g, '""')}"`,
      c.type === 'customer'
        ? 'Khách hàng'
        : c.type === 'vendor'
        ? 'Nhà cung cấp'
        : c.type === 'employee'
        ? 'Nhân viên'
        : c.type === 'partner'
        ? 'Đối tác'
        : 'Khác',
      c.phone || '',
      c.email || '',
      `'${c.taxCode || ''}`,
      `'${c.bankAccount || ''}`,
      `"${(c.bankName || '').replace(/"/g, '""')}"`,
      `"${(c.contactPerson || '').replace(/"/g, '""')}"`,
      c.status === 'active' ? 'Đang giao dịch' : 'Tạm ngưng',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Doi_tuong_thu_chi_${new Date().toISOString().split('T')[0]}.csv`);
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
          localStorage.setItem('erp_counterparty_columns', JSON.stringify(tableColumns));
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
                <span>Danh sách ({counterparties.length})</span>
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
                <span>Thống kê phân loại</span>
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
                    placeholder="Tìm tên, SĐT, MST, người liên hệ..."
                    className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Type Filter */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTypeDropdownOpen(!isTypeDropdownOpen);
                      setIsStatusDropdownOpen(false);
                    }}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>
                      {selectedType === 'all'
                        ? 'Tất cả đối tượng'
                        : selectedType === 'customer'
                        ? 'Khách hàng'
                        : selectedType === 'vendor'
                        ? 'Nhà cung cấp'
                        : selectedType === 'employee'
                        ? 'Nhân viên'
                        : selectedType === 'partner'
                        ? 'Đối tác'
                        : 'Khác'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  {isTypeDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-44 rounded-lg border border-border bg-card shadow-lg z-30 p-1 text-xs animate-in fade-in-0">
                      {[
                        { id: 'all', label: 'Tất cả phân loại' },
                        { id: 'customer', label: '👤 Khách hàng' },
                        { id: 'vendor', label: '🏢 Nhà cung cấp' },
                        { id: 'employee', label: '👔 Nhân viên' },
                        { id: 'partner', label: '🤝 Đối tác' },
                        { id: 'other', label: '📁 Khác' },
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

                {/* Status Filter */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsStatusDropdownOpen(!isStatusDropdownOpen);
                      setIsTypeDropdownOpen(false);
                    }}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>
                      {selectedStatus === 'all'
                        ? 'Tất cả trạng thái'
                        : selectedStatus === 'active'
                        ? 'Đang giao dịch'
                        : 'Tạm ngưng'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  {isStatusDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-40 rounded-lg border border-border bg-card shadow-lg z-30 p-1 text-xs animate-in fade-in-0">
                      {[
                        { id: 'all', label: 'Tất cả trạng thái' },
                        { id: 'active', label: '🟢 Đang giao dịch' },
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
                  <span>Thêm đối tượng</span>
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
                              paginatedCounterparties.length > 0 &&
                              paginatedCounterparties.every((c) => selectedIds.includes(c.id))
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
                      {paginatedCounterparties.length === 0 ? (
                        <tr>
                          <td
                            colSpan={visibleColumns.length + 2}
                            className="text-center py-12 text-xs text-muted-foreground"
                          >
                            <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                            Không tìm thấy đối tượng thu chi nào
                          </td>
                        </tr>
                      ) : (
                        paginatedCounterparties.map((item) => {
                          const isSelected = selectedIds.includes(item.id);

                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedCounterpartyForDetail(item)}
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
                                    ) : col.id === 'type' ? (
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                          item.type === 'customer'
                                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                            : item.type === 'vendor'
                                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                            : item.type === 'employee'
                                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                            : item.type === 'partner'
                                            ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                            : 'bg-muted text-muted-foreground border-border'
                                        }`}
                                      >
                                        {item.type === 'customer'
                                          ? 'Khách hàng'
                                          : item.type === 'vendor'
                                          ? 'Nhà cung cấp'
                                          : item.type === 'employee'
                                          ? 'Nhân viên'
                                          : item.type === 'partner'
                                          ? 'Đối tác'
                                          : 'Khác'}
                                      </span>
                                    ) : col.id === 'phone' ? (
                                      <span className="font-mono text-foreground">
                                        {item.phone || '—'}
                                      </span>
                                    ) : col.id === 'taxCode' ? (
                                      <span className="font-mono text-muted-foreground">
                                        {item.taxCode || '—'}
                                      </span>
                                    ) : col.id === 'bankAccount' ? (
                                      <span className="font-mono text-foreground">
                                        {item.bankAccount || '—'}
                                      </span>
                                    ) : col.id === 'status' ? (
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                          item.status === 'active'
                                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                            : 'bg-muted text-muted-foreground border border-border'
                                        }`}
                                      >
                                        {item.status === 'active' ? 'Đang giao dịch' : 'Tạm ngưng'}
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
                                      setFormDrawerState({ isOpen: true, mode: 'edit', counterparty: item })
                                    }
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    title="Sửa"
                                  >
                                    <SquarePen className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Xoá đối tượng "${item.name}"?`)) {
                                        handleDeleteCounterparty(item.code || item.id);
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
                  {paginatedCounterparties.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedCounterpartyForDetail(item)}
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
                            {item.status === 'active' ? 'Giao dịch' : 'Tạm ngưng'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-foreground line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            MST: {item.taxCode || '—'} • SĐT: {item.phone || '—'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate">LH: {item.contactPerson || '—'}</span>
                        <span
                          className={`font-medium ${
                            item.type === 'customer'
                              ? 'text-emerald-600'
                              : item.type === 'vendor'
                              ? 'text-amber-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {item.type === 'customer'
                            ? 'Khách hàng'
                            : item.type === 'vendor'
                            ? 'Nhà cung cấp'
                            : item.type === 'employee'
                            ? 'Nhân viên'
                            : 'Đối tác'}
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
                <span>trên tổng số {filteredCounterparties.length} dòng</span>
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
          <CounterpartyStatsTab
            counterparties={counterparties}
            onSelectCounterparty={(cp) => setSelectedCounterpartyForDetail(cp)}
          />
        )}
      </div>

      {/* DETAIL DRAWER */}
      {selectedCounterpartyForDetail && (
        <CounterpartyDetailDrawer
          counterparty={selectedCounterpartyForDetail}
          currentIndex={counterparties.findIndex((c) => c.id === selectedCounterpartyForDetail.id)}
          totalCount={counterparties.length}
          onClose={() => setSelectedCounterpartyForDetail(null)}
          onPrev={() => {
            const idx = counterparties.findIndex((c) => c.id === selectedCounterpartyForDetail.id);
            if (idx > 0) setSelectedCounterpartyForDetail(counterparties[idx - 1]);
          }}
          onNext={() => {
            const idx = counterparties.findIndex((c) => c.id === selectedCounterpartyForDetail.id);
            if (idx < counterparties.length - 1) setSelectedCounterpartyForDetail(counterparties[idx + 1]);
          }}
          onEdit={(cp) => {
            setSelectedCounterpartyForDetail(null);
            setFormDrawerState({ isOpen: true, mode: 'edit', counterparty: cp });
          }}
          onDelete={(id) => {
            handleDeleteCounterparty(id);
            setSelectedCounterpartyForDetail(null);
          }}
        />
      )}

      {/* FORM DRAWER */}
      {formDrawerState.isOpen && (
        <CounterpartyFormDrawer
          mode={formDrawerState.mode}
          counterparty={formDrawerState.counterparty}
          allCounterparties={counterparties}
          onClose={() => setFormDrawerState({ isOpen: false, mode: 'create' })}
          onSave={handleSaveCounterparty}
        />
      )}
    </div>
  );
};
