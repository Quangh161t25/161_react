import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  Landmark,
  Wallet,
  Smartphone,
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
  Star,
} from 'lucide-react';
import { FinanceAccount, AccountType, MasterStatus } from '../../../types/financeMaster';
import { CashTransaction } from '../../../types/cashTransaction';
import { financeAccountService } from '../../../services/financeMasterService';
import { cashTransactionService } from '../../../services/cashTransactionService';
import {
  ColumnCustomizerPopover,
  ColumnItem,
  TableDensity,
} from '../../common/ColumnCustomizerPopover';
import { FinanceAccountDetailDrawer } from './FinanceAccountDetailDrawer';
import { FinanceAccountFormDrawer } from './FinanceAccountFormDrawer';
import { FinanceAccountStatsTab } from './FinanceAccountStatsTab';

interface FinanceAccountPageProps {
  onBack: () => void;
}

export const DEFAULT_ACCOUNT_COLUMNS: ColumnItem[] = [
  { id: 'code', label: 'Mã tài khoản', visible: true, pinned: true, width: 140, align: 'left', wrap: 'truncate' },
  { id: 'accountName', label: 'Tên tài khoản / Quỹ', visible: true, pinned: true, width: 260, align: 'left', wrap: 'truncate' },
  { id: 'type', label: 'Loại', visible: true, width: 150, align: 'center', wrap: 'truncate' },
  { id: 'currentBalance', label: 'Số dư hiện tại', visible: true, width: 180, align: 'right', wrap: 'truncate' },
  { id: 'initialBalance', label: 'Tồn đầu kỳ', visible: true, width: 160, align: 'right', wrap: 'truncate' },
  { id: 'accountNumber', label: 'Số tài khoản (STK)', visible: true, width: 180, align: 'left', wrap: 'truncate' },
  { id: 'bankName', label: 'Ngân hàng', visible: true, width: 180, align: 'left', wrap: 'truncate' },
  { id: 'accountHolder', label: 'Chủ tài khoản / Quản lý', visible: true, width: 220, align: 'left', wrap: 'truncate' },
  { id: 'branch', label: 'Chi nhánh', visible: false, width: 180, align: 'left', wrap: 'truncate' },
  { id: 'status', label: 'Trạng thái', visible: true, width: 140, align: 'center', wrap: 'truncate' },
  { id: 'isDefault', label: 'Mặc định', visible: true, width: 110, align: 'center', wrap: 'truncate' },
  { id: 'currency', label: 'Tiền tệ', visible: false, width: 90, align: 'center', wrap: 'truncate' },
  { id: 'note', label: 'Ghi chú', visible: false, width: 240, align: 'left', wrap: 'truncate' },
  { id: 'createdAt', label: 'Ngày tạo', visible: false, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'updatedAt', label: 'Cập nhật', visible: false, width: 130, align: 'center', wrap: 'truncate' },
];

export const FinanceAccountPage: React.FC<FinanceAccountPageProps> = ({ onBack }) => {
  const formatMoney = (n: number) => (n ? n.toLocaleString('vi-VN') : '0');

  // Data states
  const [accounts, setAccounts] = useState<FinanceAccount[]>(() =>
    financeAccountService.getInitialAccounts()
  );
  const [transactions, setTransactions] = useState<CashTransaction[]>(() =>
    cashTransactionService.getInitialTransactions()
  );
  const [activeTopTab, setActiveTopTab] = useState<'list' | 'stats'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | AccountType>('all');
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
      const saved = localStorage.getItem('erp_finance_account_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingMap = new Map(parsed.map((p: ColumnItem) => [p.id, p]));
          const merged: ColumnItem[] = [];
          parsed.forEach((p: ColumnItem) => {
            const def = DEFAULT_ACCOUNT_COLUMNS.find((d) => d.id === p.id);
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
          DEFAULT_ACCOUNT_COLUMNS.forEach((def) => {
            if (!existingMap.has(def.id)) merged.push(def);
          });
          return merged;
        }
      }
    } catch {}
    return DEFAULT_ACCOUNT_COLUMNS;
  });

  const [tableDensity, setTableDensity] = useState<TableDensity>(() => {
    try {
      return (localStorage.getItem('erp_finance_account_density') as TableDensity) || 'normal';
    } catch {
      return 'normal';
    }
  });

  // Drawers
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<FinanceAccount | null>(null);
  const [formDrawerState, setFormDrawerState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    account?: FinanceAccount | null;
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
        const data = await financeAccountService.fetchFromSheet();
        if (isMounted && data && data.length > 0) {
          setAccounts(data);
        }
      } catch (e) {
        console.warn('Initial accounts fetch failed:', e);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };
    loadFromSheets();
    setTransactions(cashTransactionService.getInitialTransactions());
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveColumns = (newCols: ColumnItem[]) => {
    setTableColumns(newCols);
    try {
      localStorage.setItem('erp_finance_account_columns', JSON.stringify(newCols));
    } catch {}
  };

  const handleResetColumns = () => {
    setTableColumns(DEFAULT_ACCOUNT_COLUMNS);
    try {
      localStorage.removeItem('erp_finance_account_columns');
    } catch {}
  };

  const handleSaveDensity = (newDensity: TableDensity) => {
    setTableDensity(newDensity);
    try {
      localStorage.setItem('erp_finance_account_density', newDensity);
    } catch {}
  };

  const handleSyncFromSheets = async () => {
    setIsSyncing(true);
    setSyncToastMessage(null);
    setSyncError(null);
    try {
      const data = await financeAccountService.fetchFromSheet();
      setAccounts(data);
      setTransactions(cashTransactionService.getInitialTransactions());
      setSyncToastMessage(`Đồng bộ thành công ${data.length} tài khoản từ Google Sheets`);
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

  const isMatchingAccount = (
    txAccount: string | undefined,
    acc: { accountName: string; accountNumber?: string; code?: string }
  ) => {
    if (!txAccount) return false;
    const tx = txAccount.trim().toLowerCase();
    const name = acc.accountName.trim().toLowerCase();
    const code = acc.code ? acc.code.trim().toLowerCase() : '';
    const num = acc.accountNumber ? acc.accountNumber.trim().toLowerCase() : '';
    const full = num ? `${name} (${num})` : name;

    return (
      tx === name ||
      tx === code ||
      tx === full ||
      (num && tx.includes(num)) ||
      tx.includes(name) ||
      name.includes(tx)
    );
  };

  // Dynamically calculate live currentBalance, totalIncome, and totalExpense from Thu Chi transactions
  const liveAccounts: FinanceAccount[] = useMemo(() => {
    return accounts.map((acc) => {
      const matchingInflow = transactions
        .filter(
          (t) =>
            t.status === 'completed' &&
            ((t.type === 'income' && isMatchingAccount(t.account, acc)) ||
              (t.type === 'transfer' && isMatchingAccount(t.destinationAccount, acc)))
        )
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const matchingOutflow = transactions
        .filter(
          (t) =>
            t.status === 'completed' &&
            ((t.type === 'expense' && isMatchingAccount(t.account, acc)) ||
              (t.type === 'transfer' && isMatchingAccount(t.account, acc)))
        )
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const count = transactions.filter(
        (t) =>
          t.status === 'completed' &&
          (isMatchingAccount(t.account, acc) ||
            (t.type === 'transfer' && isMatchingAccount(t.destinationAccount, acc)))
      ).length;

      const initial = Number(acc.initialBalance) || 0;
      const current = initial + matchingInflow - matchingOutflow;

      return {
        ...acc,
        currentBalance: current,
        totalIncome: matchingInflow,
        totalExpense: matchingOutflow,
        transactionCount: count,
      };
    });
  }, [accounts, transactions]);

  // Filter Accounts
  const filteredAccounts = useMemo(() => {
    return liveAccounts.filter((a) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = a.code.toLowerCase().includes(q);
        const matchName = a.accountName.toLowerCase().includes(q);
        const matchBank = (a.bankName || '').toLowerCase().includes(q);
        const matchNum = (a.accountNumber || '').toLowerCase().includes(q);
        const matchHolder = (a.accountHolder || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchBank && !matchNum && !matchHolder) return false;
      }

      if (selectedType !== 'all' && a.type !== selectedType) return false;
      if (selectedStatus !== 'all' && a.status !== selectedStatus) return false;

      return true;
    });
  }, [liveAccounts, searchQuery, selectedType, selectedStatus]);

  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAccounts.slice(start, start + itemsPerPage);
  }, [filteredAccounts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage) || 1;

  // Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedAccounts.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey && lastSelectedIdRef.current) {
      const allIds = paginatedAccounts.map((a) => a.id);
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
  const handleSaveAccount = async (acc: FinanceAccount) => {
    let updated: FinanceAccount[];
    const isEdit = accounts.some((a) => a.id === acc.id || a.code === acc.code);

    // If marked default, unset other defaults
    let processedAccs = accounts;
    if (acc.isDefault) {
      processedAccs = processedAccs.map((a) => ({ ...a, isDefault: false }));
    }

    if (isEdit) {
      updated = processedAccs.map((a) => (a.id === acc.id || a.code === acc.code ? acc : a));
      await financeAccountService.updateInSheet(acc);
    } else {
      updated = [acc, ...processedAccs];
      await financeAccountService.appendToSheet(acc);
    }

    setAccounts(updated);
    financeAccountService.saveToCache(updated);
    if (selectedAccountForDetail?.id === acc.id) {
      setSelectedAccountForDetail(acc);
    }
  };

  const handleDeleteAccount = async (idOrCode: string) => {
    const updated = accounts.filter((a) => a.id !== idOrCode && a.code !== idOrCode);
    setAccounts(updated);
    setSelectedIds((prev) => prev.filter((id) => id !== idOrCode));
    financeAccountService.saveToCache(updated);
    await financeAccountService.deleteFromSheet(idOrCode);
  };

  const handleBatchDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá ${selectedIds.length} tài khoản đã chọn?`)) {
      return;
    }
    const selectedAccs = accounts.filter((a) => selectedIds.includes(a.id));
    const codesToDelete = selectedAccs.map((a) => a.code || a.id);
    const updated = accounts.filter((a) => !selectedIds.includes(a.id));
    setAccounts(updated);
    setSelectedIds([]);
    financeAccountService.saveToCache(updated);
    await financeAccountService.deleteFromSheet(codesToDelete);
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport =
      selectedIds.length > 0
        ? accounts.filter((a) => selectedIds.includes(a.id))
        : filteredAccounts;

    const headers = ['Mã TK', 'Tên tài khoản', 'Loại', 'Số dư hiện tại', 'Tồn đầu kỳ', 'STK', 'Ngân hàng', 'Chủ TK', 'Mặc định', 'Trạng thái'];
    const rows = listToExport.map((a) => [
      a.code,
      `"${a.accountName.replace(/"/g, '""')}"`,
      a.type === 'bank' ? 'Ngân hàng' : a.type === 'cash' ? 'Tiền mặt' : 'Ví điện tử',
      a.currentBalance || 0,
      a.initialBalance || 0,
      `'${a.accountNumber || ''}`,
      `"${(a.bankName || '').replace(/"/g, '""')}"`,
      `"${(a.accountHolder || '').replace(/"/g, '""')}"`,
      a.isDefault ? 'Mặc định' : '',
      a.status === 'active' ? 'Đang hoạt động' : 'Tạm khóa',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tai_khoan_tai_chinh_${new Date().toISOString().split('T')[0]}.csv`);
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
          localStorage.setItem('erp_finance_account_columns', JSON.stringify(tableColumns));
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
                <span>Danh sách ({accounts.length})</span>
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
                <span>Thống kê & Số dư</span>
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
                    placeholder="Tìm tên tài khoản, STK, ngân hàng..."
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
                        ? 'Tất cả loại'
                        : selectedType === 'bank'
                        ? 'Tài khoản Ngân hàng'
                        : selectedType === 'cash'
                        ? 'Quỹ Tiền mặt'
                        : 'Ví điện tử'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  {isTypeDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-48 rounded-lg border border-border bg-card shadow-lg z-30 p-1 text-xs animate-in fade-in-0">
                      {[
                        { id: 'all', label: 'Tất cả loại tài khoản' },
                        { id: 'bank', label: '🏦 Tài khoản Ngân hàng' },
                        { id: 'cash', label: '💵 Quỹ Tiền mặt' },
                        { id: 'wallet', label: '📱 Ví điện tử' },
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
                        ? 'Đang hoạt động'
                        : 'Tạm khóa'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  {isStatusDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-40 rounded-lg border border-border bg-card shadow-lg z-30 p-1 text-xs animate-in fade-in-0">
                      {[
                        { id: 'all', label: 'Tất cả trạng thái' },
                        { id: 'active', label: '🟢 Đang hoạt động' },
                        { id: 'inactive', label: '🔴 Tạm khóa' },
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
                  <span>Thêm tài khoản</span>
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
                              paginatedAccounts.length > 0 &&
                              paginatedAccounts.every((a) => selectedIds.includes(a.id))
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
                      {paginatedAccounts.length === 0 ? (
                        <tr>
                          <td
                            colSpan={visibleColumns.length + 2}
                            className="text-center py-12 text-xs text-muted-foreground"
                          >
                            <Landmark className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                            Không tìm thấy tài khoản tài chính nào
                          </td>
                        </tr>
                      ) : (
                        paginatedAccounts.map((item) => {
                          const isSelected = selectedIds.includes(item.id);

                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedAccountForDetail(item)}
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
                                    ) : col.id === 'accountName' ? (
                                      <div className="flex items-center gap-2 truncate">
                                        <span className="font-semibold text-foreground truncate">
                                          {item.accountName}
                                        </span>
                                        {item.isDefault && (
                                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 font-medium shrink-0">
                                            Mặc định
                                          </span>
                                        )}
                                      </div>
                                    ) : col.id === 'type' ? (
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                          item.type === 'bank'
                                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                            : item.type === 'cash'
                                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                            : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                        }`}
                                      >
                                        {item.type === 'bank' ? (
                                          <Landmark className="w-3 h-3" />
                                        ) : item.type === 'cash' ? (
                                          <Wallet className="w-3 h-3" />
                                        ) : (
                                          <Smartphone className="w-3 h-3" />
                                        )}
                                        <span>
                                          {item.type === 'bank'
                                            ? 'Ngân hàng'
                                            : item.type === 'cash'
                                            ? 'Tiền mặt'
                                            : 'Ví điện tử'}
                                        </span>
                                      </span>
                                    ) : col.id === 'currentBalance' ? (
                                      <span className="font-mono font-bold text-foreground">
                                        {formatMoney(item.currentBalance)} đ
                                      </span>
                                    ) : col.id === 'initialBalance' ? (
                                      <span className="font-mono text-muted-foreground">
                                        {formatMoney(item.initialBalance)} đ
                                      </span>
                                    ) : col.id === 'accountNumber' ? (
                                      <span className="font-mono text-foreground font-medium">
                                        {item.accountNumber || '—'}
                                      </span>
                                    ) : col.id === 'status' ? (
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                          item.status === 'active'
                                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                            : 'bg-muted text-muted-foreground border border-border'
                                        }`}
                                      >
                                        {item.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                                      </span>
                                    ) : col.id === 'isDefault' ? (
                                      item.isDefault ? (
                                        <Star className="w-4 h-4 text-amber-500 fill-amber-500 mx-auto" />
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )
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
                                      setFormDrawerState({ isOpen: true, mode: 'edit', account: item })
                                    }
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    title="Sửa"
                                  >
                                    <SquarePen className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Xoá tài khoản "${item.accountName}"?`)) {
                                        handleDeleteAccount(item.code || item.id);
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
                  {paginatedAccounts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedAccountForDetail(item)}
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
                            {item.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-foreground line-clamp-1">{item.accountName}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                            {item.bankName ? `${item.bankName} - ${item.accountNumber}` : item.accountHolder}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Số dư:</span>
                        <span className="font-mono font-bold text-primary">
                          {formatMoney(item.currentBalance)} đ
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
                <span>trên tổng số {filteredAccounts.length} dòng</span>
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
          <FinanceAccountStatsTab
            accounts={liveAccounts}
            onSelectAccount={(acc) => setSelectedAccountForDetail(acc)}
          />
        )}
      </div>

      {/* DETAIL DRAWER */}
      {selectedAccountForDetail && (
        <FinanceAccountDetailDrawer
          account={
            liveAccounts.find((a) => a.id === selectedAccountForDetail.id) || selectedAccountForDetail
          }
          transactions={transactions}
          currentIndex={liveAccounts.findIndex((a) => a.id === selectedAccountForDetail.id)}
          totalCount={liveAccounts.length}
          onClose={() => setSelectedAccountForDetail(null)}
          onPrev={() => {
            const idx = liveAccounts.findIndex((a) => a.id === selectedAccountForDetail.id);
            if (idx > 0) setSelectedAccountForDetail(liveAccounts[idx - 1]);
          }}
          onNext={() => {
            const idx = liveAccounts.findIndex((a) => a.id === selectedAccountForDetail.id);
            if (idx < liveAccounts.length - 1) setSelectedAccountForDetail(liveAccounts[idx + 1]);
          }}
          onEdit={(acc) => {
            setSelectedAccountForDetail(null);
            setFormDrawerState({ isOpen: true, mode: 'edit', account: acc });
          }}
          onDelete={(id) => {
            handleDeleteAccount(id);
            setSelectedAccountForDetail(null);
          }}
        />
      )}

      {/* FORM DRAWER */}
      {formDrawerState.isOpen && (
        <FinanceAccountFormDrawer
          mode={formDrawerState.mode}
          account={formDrawerState.account}
          allAccounts={accounts}
          onClose={() => setFormDrawerState({ isOpen: false, mode: 'create' })}
          onSave={handleSaveAccount}
        />
      )}
    </div>
  );
};
