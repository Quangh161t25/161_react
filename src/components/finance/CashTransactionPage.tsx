import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Search,
  Building2,
  Tag,
  Bookmark,
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
  CheckCircle2,
  AlertCircle,
  ChartColumn,
  Link2,
  Pin,
  SlidersHorizontal,
  Printer,
  Receipt,
  Wallet,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { CashTransaction, TransactionType } from '../../types/cashTransaction';
import { cashTransactionService } from '../../services/cashTransactionService';
import {
  FinanceCategory,
  FinanceAccount,
  Counterparty,
} from '../../types/financeMaster';
import { Employee } from '../../types/employee';
import {
  financeCategoryService,
  financeAccountService,
  counterpartyService,
} from '../../services/financeMasterService';
import { employeeService } from '../../services/employeeService';
import {
  CASH_ACCOUNTS,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  TRANSFER_CATEGORIES,
} from '../../data/cashTransactions';
import {
  ColumnCustomizerPopover,
  ColumnItem,
  TableDensity,
} from '../common/ColumnCustomizerPopover';
import { CashTransactionDetailDrawer } from './CashTransactionDetailDrawer';
import { CashTransactionFormDrawer } from './CashTransactionFormDrawer';
import { CashTransactionStatsTab } from './CashTransactionStatsTab';
import { CashTransactionCalendarView } from './CashTransactionCalendarView';
import { useSettings } from '../../context/SettingsContext';
import { useAutoSync } from '../../hooks/useAutoSync';
import { RealtimeSyncBadge } from '../common/RealtimeSyncBadge';

interface CashTransactionPageProps {
  onBack: () => void;
  onNavigateToModule?: (path: string) => void;
}

export const DEFAULT_TRANSACTION_COLUMNS: ColumnItem[] = [
  { id: 'code', label: 'Mã phiếu', visible: true, pinned: true, width: 140, align: 'left', wrap: 'truncate' },
  { id: 'type', label: 'Loại GD', visible: true, pinned: true, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'transactionDate', label: 'Ngày GD', visible: true, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'transactionTime', label: 'Giờ GD', visible: true, width: 100, align: 'center', wrap: 'truncate' },
  { id: 'title', label: 'Tiêu đề / Lý do', visible: true, width: 320, align: 'left', wrap: 'truncate' },
  { id: 'amount', label: 'Số tiền (VNĐ)', visible: true, width: 170, align: 'right', wrap: 'truncate' },
  { id: 'runningBalance', label: 'Số dư sau GD', visible: true, width: 170, align: 'right', wrap: 'truncate' },
  { id: 'amountInWords', label: 'Bằng chữ', visible: false, width: 260, align: 'left', wrap: 'truncate' },
  { id: 'account', label: 'Tài khoản nguồn', visible: true, width: 220, align: 'left', wrap: 'truncate' },
  { id: 'destinationAccount', label: 'Tài khoản đích', visible: true, width: 220, align: 'left', wrap: 'truncate' },
  { id: 'counterpartyName', label: 'Đối tượng', visible: true, width: 240, align: 'left', wrap: 'truncate' },
  { id: 'counterpartyPhone', label: 'SĐT đối tượng', visible: false, width: 150, align: 'center', wrap: 'truncate' },
  { id: 'counterpartyAddress', label: 'Địa chỉ đối tượng', visible: false, width: 260, align: 'left', wrap: 'truncate' },
  { id: 'category', label: 'Khoản mục', visible: true, width: 200, align: 'left', wrap: 'truncate' },
  { id: 'subCategory', label: 'Hạng mục con', visible: false, width: 180, align: 'left', wrap: 'truncate' },
  { id: 'department', label: 'Phòng ban', visible: true, width: 190, align: 'left', wrap: 'truncate' },
  { id: 'paymentMethod', label: 'Phương thức', visible: false, width: 160, align: 'center', wrap: 'truncate' },
  { id: 'status', label: 'Trạng thái', visible: true, width: 140, align: 'center', wrap: 'truncate' },
  { id: 'invoiceNumber', label: 'Số HĐ / VAT', visible: true, width: 160, align: 'center', wrap: 'truncate' },
  { id: 'refProposalCode', label: 'Mã đề xuất', visible: false, width: 140, align: 'center', wrap: 'truncate' },
  { id: 'reason', label: 'Diễn giải chi tiết', visible: false, width: 280, align: 'left', wrap: 'truncate' },
  { id: 'note', label: 'Ghi chú', visible: false, width: 220, align: 'left', wrap: 'truncate' },
  { id: 'createdBy', label: 'Người lập', visible: false, width: 150, align: 'left', wrap: 'truncate' },
  { id: 'approvedBy', label: 'Người duyệt', visible: false, width: 150, align: 'left', wrap: 'truncate' },
  { id: 'createdAt', label: 'Ngày tạo', visible: false, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'updatedAt', label: 'Cập nhật', visible: false, width: 130, align: 'center', wrap: 'truncate' },
];

export const CashTransactionPage: React.FC<CashTransactionPageProps> = ({
  onBack,
  onNavigateToModule,
}) => {
  const { formatDate } = useSettings();
  const formatNumber = (num: number) => (num ? num.toLocaleString('vi-VN') : '0');

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '09:00';
    if (timeStr.includes('T') || timeStr.includes('Z')) {
      try {
        const d = new Date(timeStr);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
        }
      } catch {}
    }
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      return `${h}:${m}`;
    }
    return timeStr;
  };

  // Master Data States
  const [masterCategories, setMasterCategories] = useState<FinanceCategory[]>(() =>
    financeCategoryService.getInitialCategories()
  );
  const [masterAccounts, setMasterAccounts] = useState<FinanceAccount[]>(() =>
    financeAccountService.getInitialAccounts()
  );
  const [masterCounterparties, setMasterCounterparties] = useState<Counterparty[]>(() =>
    counterpartyService.getInitialCounterparties()
  );
  const [employees, setEmployees] = useState<Employee[]>(() =>
    employeeService.getInitialEmployees()
  );

  // Data states
  const [transactions, setTransactions] = useState<CashTransaction[]>(() =>
    cashTransactionService.getInitialTransactions()
  );
  const [activeTopTab, setActiveTopTab] = useState<'list' | 'calendar' | 'stats'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | TransactionType>('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Dropdown states
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Smart Realtime Auto-Sync Hook (25s interval, focus refresh, instant badge)
  const [isMutating, setIsMutating] = useState(false);
  const { isSyncing: isAutoSyncing, lastSyncTime, triggerManualSync } = useAutoSync<CashTransaction[]>({
    syncFn: async () => {
      const [liveData, liveCats, liveAccs, liveCps, liveEmps] = await Promise.all([
        cashTransactionService.fetchFromSheet(),
        financeCategoryService.fetchFromSheet().catch(() => financeCategoryService.getInitialCategories()),
        financeAccountService.fetchFromSheet().catch(() => financeAccountService.getInitialAccounts()),
        counterpartyService.fetchFromSheet().catch(() => counterpartyService.getInitialCounterparties()),
        employeeService.fetchFromSheet().catch(() => employeeService.getInitialEmployees()),
      ]);
      if (liveCats && liveCats.length > 0) setMasterCategories(liveCats);
      if (liveAccs && liveAccs.length > 0) setMasterAccounts(liveAccs);
      if (liveCps && liveCps.length > 0) setMasterCounterparties(liveCps);
      if (liveEmps && liveEmps.length > 0) setEmployees(liveEmps);
      return Array.isArray(liveData) ? liveData : [];
    },
    onDataReceived: (liveData) => {
      if (Array.isArray(liveData)) {
        setTransactions(liveData);
      }
    },
    intervalMs: 25000,
  });
  const isSyncing = isAutoSyncing || isMutating;
  const setIsSyncing = setIsMutating;

  // Resizing state
  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const resizingRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);
  const lastSelectedIdRef = useRef<string | null>(null);

  // Column Customizer & Density State
  const [tableColumns, setTableColumns] = useState<ColumnItem[]>(() => {
    try {
      const saved = localStorage.getItem('erp_thuchi_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingMap = new Map(parsed.map((p: ColumnItem) => [p.id, p]));
          const merged: ColumnItem[] = [];
          parsed.forEach((p: ColumnItem) => {
            const def = DEFAULT_TRANSACTION_COLUMNS.find((d) => d.id === p.id);
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
          DEFAULT_TRANSACTION_COLUMNS.forEach((def) => {
            if (!existingMap.has(def.id)) {
              merged.push(def);
            }
          });
          return merged;
        }
      }
    } catch {}
    return DEFAULT_TRANSACTION_COLUMNS;
  });

  const [tableDensity, setTableDensity] = useState<TableDensity>(() => {
    try {
      const saved = localStorage.getItem('erp_thuchi_density');
      if (saved === 'compact' || saved === 'normal' || saved === 'relaxed') {
        return saved;
      }
    } catch {}
    return 'normal';
  });

  const handleSaveColumns = (newCols: ColumnItem[]) => {
    setTableColumns(newCols);
    try {
      localStorage.setItem('erp_thuchi_columns', JSON.stringify(newCols));
    } catch {}
  };

  const handleSaveDensity = (newDensity: TableDensity) => {
    setTableDensity(newDensity);
    try {
      localStorage.setItem('erp_thuchi_density', newDensity);
    } catch {}
  };

  const handleResetColumns = () => {
    setTableColumns(DEFAULT_TRANSACTION_COLUMNS);
    setTableDensity('normal');
    try {
      localStorage.removeItem('erp_thuchi_columns');
      localStorage.removeItem('erp_thuchi_density');
    } catch {}
  };

  // Interactive Column Resizing from Table Header
  const handleStartResize = useCallback(
    (columnId: string, startEvent: React.MouseEvent) => {
      startEvent.preventDefault();
      startEvent.stopPropagation();
      const col = tableColumns.find((c) => c.id === columnId);
      const currentWidth = col?.width || 160;

      setResizingColId(columnId);
      resizingRef.current = {
        colId: columnId,
        startX: startEvent.clientX,
        startWidth: currentWidth,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizingRef.current) return;
        const delta = moveEvent.clientX - resizingRef.current.startX;
        const nextWidth = Math.max(60, Math.min(1200, resizingRef.current.startWidth + delta));

        setTableColumns((prev) =>
          prev.map((c) => (c.id === resizingRef.current?.colId ? { ...c, width: nextWidth } : c))
        );
      };

      const handleMouseUp = () => {
        setResizingColId(null);
        resizingRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        setTableColumns((current) => {
          try {
            localStorage.setItem('erp_thuchi_columns', JSON.stringify(current));
          } catch {}
          return current;
        });
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [tableColumns]
  );

  // Drawers state
  const [selectedTransactionForDetail, setSelectedTransactionForDetail] =
    useState<CashTransaction | null>(null);
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<CashTransaction | null>(null);
  const [formInitialType, setFormInitialType] = useState<TransactionType>('expense');

  const showToast = (message: string, isErr = false) => {
    if (isErr) {
      setSyncError(message);
      setTimeout(() => setSyncError(null), 4000);
    } else {
      setSyncToastMessage(message);
      setTimeout(() => setSyncToastMessage(null), 3500);
    }
  };

  // Dynamic Counterparty Resolution by ID / Code / Name
  const getResolvedCounterparty = useCallback(
    (tx: CashTransaction) => {
      if (tx.counterpartyId) {
        if (
          tx.counterpartyType === 'employee' ||
          tx.counterpartyId.startsWith('emp-') ||
          tx.counterpartyId.startsWith('emp:')
        ) {
          const cleanId = tx.counterpartyId.replace('emp:', '');
          const emp = employees.find((e) => e.id === cleanId || e.code === cleanId);
          if (emp) {
            return {
              name: emp.name,
              code: emp.code,
              phone: emp.phone,
              address: emp.currentAddress || emp.permanentAddress,
              type: 'employee' as const,
              department: emp.department,
            };
          }
        }
        const cleanCpId = tx.counterpartyId.replace('cp:', '');
        const cp = masterCounterparties.find((c) => c.id === cleanCpId || c.code === cleanCpId);
        if (cp) {
          return {
            name: cp.name,
            code: cp.code,
            phone: cp.phone,
            address: cp.address,
            type: cp.type,
          };
        }
      }
      if (tx.counterpartyCode) {
        const cp = masterCounterparties.find((c) => c.code === tx.counterpartyCode);
        if (cp) {
          return {
            name: cp.name,
            code: cp.code,
            phone: cp.phone,
            address: cp.address,
            type: cp.type,
          };
        }
        const emp = employees.find((e) => e.code === tx.counterpartyCode);
        if (emp) {
          return {
            name: emp.name,
            code: emp.code,
            phone: emp.phone,
            address: emp.currentAddress || emp.permanentAddress,
            type: 'employee' as const,
            department: emp.department,
          };
        }
      }
      return {
        name: tx.counterpartyName,
        code: tx.counterpartyCode,
        phone: tx.counterpartyPhone,
        address: tx.counterpartyAddress,
        type: tx.counterpartyType,
      };
    },
    [masterCounterparties, employees]
  );

  // Dynamic Account Name Resolution by Code / Name
  const getResolvedAccountName = useCallback(
    (accountStr?: string) => {
      if (!accountStr) return '—';
      const clean = accountStr.trim();
      const matched = masterAccounts.find(
        (a) =>
          a.code === clean ||
          a.id === clean ||
          a.accountName === clean ||
          `${a.accountName} (${a.accountNumber})` === clean
      );
      return matched ? matched.accountName : clean;
    },
    [masterAccounts]
  );

  // Dynamic Category Name Resolution by Code / Name
  const getResolvedCategoryName = useCallback(
    (categoryStr?: string) => {
      if (!categoryStr) return '—';
      const clean = categoryStr.trim();
      const matched = masterCategories.find(
        (c) => c.code === clean || c.id === clean || c.name === clean
      );
      return matched ? matched.name : clean;
    },
    [masterCategories]
  );

  // Filtered List
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const q = searchQuery.toLowerCase().trim();
      const cp = getResolvedCounterparty(tx);
      const accName = getResolvedAccountName(tx.account);
      const destAccName = getResolvedAccountName(tx.destinationAccount);
      const catName = getResolvedCategoryName(tx.category);

      const matchQuery =
        !q ||
        tx.code.toLowerCase().includes(q) ||
        tx.title.toLowerCase().includes(q) ||
        (cp.name && cp.name.toLowerCase().includes(q)) ||
        (cp.code && cp.code.toLowerCase().includes(q)) ||
        (cp.phone && cp.phone.includes(q)) ||
        accName.toLowerCase().includes(q) ||
        tx.account.toLowerCase().includes(q) ||
        (destAccName && destAccName.toLowerCase().includes(q)) ||
        (tx.invoiceNumber && tx.invoiceNumber.toLowerCase().includes(q)) ||
        catName.toLowerCase().includes(q) ||
        (tx.category && tx.category.toLowerCase().includes(q)) ||
        (tx.reason && tx.reason.toLowerCase().includes(q));

      const matchType = selectedType === 'all' || tx.type === selectedType;
      const matchAccount =
        selectedAccount === 'all' ||
        tx.account === selectedAccount ||
        accName === selectedAccount ||
        tx.destinationAccount === selectedAccount ||
        destAccName === selectedAccount;
      const matchCategory =
        selectedCategory === 'all' ||
        tx.category === selectedCategory ||
        catName === selectedCategory;
      const matchStatus = selectedStatus === 'all' || tx.status === selectedStatus;

      return matchQuery && matchType && matchAccount && matchCategory && matchStatus;
    }).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const dtA = `${a.transactionDate || ''} ${a.transactionTime || ''}`;
      const dtB = `${b.transactionDate || ''} ${b.transactionTime || ''}`;
      return dtB.localeCompare(dtA);
    });
  }, [
    transactions,
    searchQuery,
    selectedType,
    selectedAccount,
    selectedCategory,
    selectedStatus,
    getResolvedCounterparty,
    getResolvedAccountName,
    getResolvedCategoryName,
  ]);

  // Running balance calculation (Số dư tích lũy theo thời gian)
  const runningBalanceMap = useMemo(() => {
    const isAccountFilter = selectedAccount !== 'all';
    const sorted = [...transactions].sort((a, b) => {
      const dtA = `${a.transactionDate || ''} ${a.transactionTime || ''} ${a.code || ''}`;
      const dtB = `${b.transactionDate || ''} ${b.transactionTime || ''} ${b.code || ''}`;
      return dtA.localeCompare(dtB);
    });

    let currentBal = 0;
    if (isAccountFilter) {
      const matchedAcc = masterAccounts.find(
        (a) =>
          a.accountName === selectedAccount ||
          a.accountNumber === selectedAccount ||
          a.id === selectedAccount ||
          `${a.accountName} (${a.accountNumber})` === selectedAccount
      );
      currentBal = matchedAcc ? (matchedAcc.initialBalance || 0) : 0;
    } else {
      currentBal = masterAccounts.reduce((sum, acc) => sum + (acc.initialBalance || 0), 0);
    }

    const map = new Map<string, number>();

    sorted.forEach((tx) => {
      if (tx.status !== 'cancelled') {
        if (isAccountFilter) {
          const isSource =
            tx.account === selectedAccount ||
            tx.account.toLowerCase().includes(selectedAccount.toLowerCase());
          const isDest =
            tx.destinationAccount &&
            (tx.destinationAccount === selectedAccount ||
              tx.destinationAccount.toLowerCase().includes(selectedAccount.toLowerCase()));

          if (tx.type === 'income' && isSource) {
            currentBal += tx.amount;
          } else if (tx.type === 'expense' && isSource) {
            currentBal -= tx.amount;
          } else if (tx.type === 'transfer') {
            if (isSource && !isDest) currentBal -= tx.amount;
            else if (isDest && !isSource) currentBal += tx.amount;
          }
        } else {
          if (tx.type === 'income') {
            currentBal += tx.amount;
          } else if (tx.type === 'expense') {
            currentBal -= tx.amount;
          }
        }
      }
      map.set(tx.id, currentBal);
    });

    return map;
  }, [transactions, masterAccounts, selectedAccount]);

  // Bulk Selection
  const isAllSelected =
    filteredTransactions.length > 0 && selectedIds.length === filteredTransactions.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map((t) => t.id));
    }
  };

  const handleToggleSelect = (id: string, e?: React.MouseEvent | React.SyntheticEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();

    const isShiftKey = (e as React.MouseEvent)?.shiftKey;
    const currentIndex = filteredTransactions.findIndex((t) => t.id === id);

    if (isShiftKey && lastSelectedIdRef.current !== null && currentIndex !== -1) {
      const lastIndex = filteredTransactions.findIndex((t) => t.id === lastSelectedIdRef.current);
      if (lastIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = filteredTransactions.slice(start, end + 1).map((t) => t.id);

        setSelectedIds((prev) => {
          const isTargetSelected = prev.includes(id);
          if (isTargetSelected) {
            const rangeSet = new Set(rangeIds);
            return prev.filter((item) => !rangeSet.has(item));
          } else {
            const combined = new Set([...prev, ...rangeIds]);
            return Array.from(combined);
          }
        });
        lastSelectedIdRef.current = id;
        return;
      }
    }

    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    lastSelectedIdRef.current = id;
  };

  // Bulk Delete
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${count} chứng từ đã chọn?`)) return;

    const idSet = new Set(selectedIds);
    const toDelete = transactions.filter((t) => idSet.has(t.id));
    const codesToDelete = toDelete.map((t) => t.code).filter(Boolean);

    const updatedList = transactions.filter((t) => !idSet.has(t.id));
    setTransactions(updatedList);
    cashTransactionService.saveToLocalCache(updatedList);

    if (selectedTransactionForDetail && idSet.has(selectedTransactionForDetail.id)) {
      setSelectedTransactionForDetail(null);
    }
    setSelectedIds([]);

    setIsSyncing(true);
    const ok = await cashTransactionService.deleteTransactions(codesToDelete);
    setIsSyncing(false);
    if (ok) {
      showToast(`Đã xóa thành công ${count} chứng từ và đồng bộ Google Sheet!`);
    } else {
      showToast(`Đã xóa ${count} chứng từ khỏi bộ nhớ.`, true);
    }
  };

  // Create / Edit Submit
  const handleFormSubmit = async (formData: Partial<CashTransaction>) => {
    if (editingTransaction) {
      const updatedTx = {
        ...editingTransaction,
        ...formData,
        updatedAt: new Date().toISOString().split('T')[0],
      } as CashTransaction;

      const updatedList = transactions.map((t) =>
        t.id === editingTransaction.id ? updatedTx : t
      );
      setTransactions(updatedList);
      cashTransactionService.saveToLocalCache(updatedList);

      if (selectedTransactionForDetail?.id === editingTransaction.id) {
        setSelectedTransactionForDetail(updatedTx);
      }

      setIsFormDrawerOpen(false);
      setEditingTransaction(null);

      setIsSyncing(true);
      const ok = await cashTransactionService.updateTransaction(updatedTx);
      setIsSyncing(false);
      if (ok) {
        showToast(`Đã cập nhật chứng từ ${editingTransaction.code} trên Google Sheet!`);
      } else {
        showToast('Đã lưu thông tin chứng từ.', true);
      }
    } else {
      const created: CashTransaction = {
        id: `tx-${Date.now()}`,
        code: formData.code || `GD-${Date.now()}`,
        type: formData.type || 'expense',
        title: formData.title || '',
        amount: formData.amount || 0,
        amountInWords: formData.amountInWords,
        transactionDate: formData.transactionDate || new Date().toISOString().split('T')[0],
        transactionTime: formData.transactionTime || '09:30',
        category: formData.category || 'Chi phí khác',
        subCategory: formData.subCategory,
        account: formData.account || 'Vietcombank - Tài khoản chính',
        destinationAccount: formData.destinationAccount,
        paymentMethod: formData.paymentMethod || 'bank_transfer',
        counterpartyType: formData.counterpartyType || 'vendor',
        counterpartyName: formData.counterpartyName || 'Khách vãng lai',
        counterpartyPhone: formData.counterpartyPhone,
        counterpartyAddress: formData.counterpartyAddress,
        department: formData.department,
        refProposalCode: formData.refProposalCode,
        invoiceNumber: formData.invoiceNumber,
        reason: formData.reason || '',
        note: formData.note,
        status: formData.status || 'completed',
        isPinned: formData.isPinned || false,
        attachments: formData.attachments || [],
        createdBy: formData.createdBy || 'Lê Minh Công',
        approvedBy: formData.approvedBy || 'Lê Minh Công',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };

      const updatedList = [created, ...transactions];
      setTransactions(updatedList);
      cashTransactionService.saveToLocalCache(updatedList);

      setIsFormDrawerOpen(false);
      setEditingTransaction(null);

      setIsSyncing(true);
      const ok = await cashTransactionService.appendTransaction(created);
      setIsSyncing(false);
      if (ok) {
        showToast(`Đã thêm phiếu "${created.code}" vào Google Sheet thành công!`);
      } else {
        showToast('Đã thêm phiếu vào bộ nhớ tạm.', true);
      }
    }
  };

  // Delete single
  const handleDeleteTransaction = async (id: string) => {
    const deleted = transactions.find((t) => t.id === id);
    if (!deleted) return;
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa chứng từ "${deleted.code}"?`);
    if (!confirmDelete) return;

    const updatedList = transactions.filter((t) => t.id !== id);
    setTransactions(updatedList);
    cashTransactionService.saveToLocalCache(updatedList);
    if (selectedTransactionForDetail?.id === id) {
      setSelectedTransactionForDetail(null);
    }
    setSelectedIds((prev) => prev.filter((i) => i !== id));

    setIsSyncing(true);
    const ok = await cashTransactionService.deleteTransactions([deleted.code]);
    setIsSyncing(false);
    if (ok) {
      showToast(`Đã xóa chứng từ ${deleted.code} và đồng bộ Google Sheet!`);
    } else {
      showToast('Đã xóa chứng từ khỏi bộ nhớ.', true);
    }
  };

  // Toggle Pin
  const handleTogglePin = (id: string) => {
    const updated = transactions.map((t) =>
      t.id === id ? { ...t, isPinned: !t.isPinned } : t
    );
    setTransactions(updated);
    cashTransactionService.saveToLocalCache(updated);
    const target = updated.find((t) => t.id === id);
    if (target) {
      cashTransactionService.updateTransaction(target);
    }
    if (selectedTransactionForDetail?.id === id && target) {
      setSelectedTransactionForDetail(target);
    }
  };

  // Manual Sync from Google Sheet
  const handleManualSync = async () => {
    try {
      const data = await triggerManualSync();
      if (Array.isArray(data)) {
        showToast(
          data.length > 0
            ? `Đã đồng bộ thành công ${data.length} chứng từ từ Google Sheet!`
            : 'Đã đồng bộ với Google Sheet (danh sách chứng từ trống).'
        );
      } else {
        showToast('Google Sheet đã ở trạng thái mới nhất!');
      }
    } catch {
      showToast('Không thể kết nối với Google Sheet.', true);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Mã phiếu',
      'Loại giao dịch',
      'Tiêu đề / Lý do',
      'Số tiền (VNĐ)',
      'Bằng chữ',
      'Ngày GD',
      'Giờ GD',
      'Tài khoản nguồn',
      'Tài khoản đích',
      'Đối tượng',
      'SĐT đối tượng',
      'Địa chỉ đối tượng',
      'Khoản mục',
      'Hạng mục con',
      'Phòng ban',
      'Phương thức',
      'Số HĐ / VAT',
      'Mã đề xuất liên kết',
      'Trạng thái',
      'Người lập',
      'Người duyệt',
      'Ngày tạo',
      'Cập nhật',
    ];

    const rows = filteredTransactions.map((t) => [
      `"${t.code}"`,
      `"${t.type === 'income' ? 'Thu' : t.type === 'expense' ? 'Chi' : 'Luân chuyển'}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.amount,
      `"${t.amountInWords || ''}"`,
      `"${t.transactionDate}"`,
      `"${t.transactionTime || '09:00'}"`,
      `"${t.account}"`,
      `"${t.destinationAccount || ''}"`,
      `"${(t.counterpartyName || '').replace(/"/g, '""')}"`,
      `"${t.counterpartyPhone || ''}"`,
      `"${t.counterpartyAddress || ''}"`,
      `"${t.category}"`,
      `"${t.subCategory || ''}"`,
      `"${t.department || ''}"`,
      `"${t.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}"`,
      `"${t.invoiceNumber || ''}"`,
      `"${t.refProposalCode || ''}"`,
      `"${t.status === 'completed' ? 'Hoàn thành' : 'Chờ duyệt'}"`,
      `"${t.createdBy || ''}"`,
      `"${t.approvedBy || ''}"`,
      t.createdAt,
      t.updatedAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `so_thu_chi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV thành công!');
  };

  const renderTypeBadge = (tType: TransactionType) => {
    switch (tType) {
      case 'income':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Phiếu Thu
          </span>
        );
      case 'expense':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Phiếu Chi
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Luân chuyển
          </span>
        );
    }
  };

  const renderStatusBadge = (st: CashTransaction['status']) => {
    switch (st) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Hoàn thành
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Chờ duyệt
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
            Bản nháp
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-destructive/10 text-destructive border border-destructive/20">
            Đã hủy
          </span>
        );
    }
  };

  const currentDetailIndex = useMemo(() => {
    if (!selectedTransactionForDetail) return -1;
    return filteredTransactions.findIndex((t) => t.id === selectedTransactionForDetail.id);
  }, [selectedTransactionForDetail, filteredTransactions]);

  // Density padding classes matching EmployeePage
  const cellPaddingClass = useMemo(() => {
    switch (tableDensity) {
      case 'compact':
        return 'py-1 px-3';
      case 'relaxed':
        return 'py-3.5 px-4';
      default:
        return 'py-2 px-3.5';
    }
  }, [tableDensity]);

  const headerPaddingClass = useMemo(() => {
    switch (tableDensity) {
      case 'compact':
        return 'py-1.5';
      case 'relaxed':
        return 'py-3';
      default:
        return 'py-2';
    }
  }, [tableDensity]);

  // Visible columns & Offset calculations for multi-column left pinning
  const visibleColumns = useMemo(
    () => tableColumns.filter((col) => col.visible),
    [tableColumns]
  );

  const columnOffsets = useMemo(() => {
    const offsets = new Map<string, { left: number; isPinned: boolean; isLastPinned: boolean }>();
    let currentLeft = 44; // Starts after sticky Checkbox column

    const pinnedCols = visibleColumns.filter((c) => c.pinned);
    const lastPinnedId = pinnedCols.length > 0 ? pinnedCols[pinnedCols.length - 1].id : null;

    visibleColumns.forEach((col) => {
      const isPinned = !!col.pinned;
      const colWidth = col.width || 160;

      if (isPinned) {
        offsets.set(col.id, {
          left: currentLeft,
          isPinned: true,
          isLastPinned: col.id === lastPinnedId,
        });
        currentLeft += colWidth;
      } else {
        offsets.set(col.id, {
          left: 0,
          isPinned: false,
          isLastPinned: false,
        });
      }
    });

    return offsets;
  }, [visibleColumns]);

  const renderTransactionCell = (
    col: ColumnItem,
    tx: CashTransaction,
    stickyBgClass: string
  ) => {
    const colId = col.id;
    const colWidth = col.width || 160;
    const colAlign = col.align || 'left';
    const isWrap = col.wrap === 'wrap';

    const alignClass =
      colAlign === 'center' ? 'text-center' : colAlign === 'right' ? 'text-right' : 'text-left';
    const justifyClass =
      colAlign === 'center'
        ? 'justify-center'
        : colAlign === 'right'
        ? 'justify-end'
        : 'justify-start';
    const textWrapClass = isWrap
      ? 'whitespace-normal break-words leading-relaxed'
      : 'whitespace-nowrap truncate';

    const offsetInfo = columnOffsets.get(col.id);
    const isPinned = !!offsetInfo?.isPinned;
    const pinnedLeft = offsetInfo?.left || 0;
    const isLastPinned = !!offsetInfo?.isLastPinned;

    const stickyTdClass = isPinned
      ? `sticky z-[10] ${stickyBgClass} ${
          isLastPinned ? 'shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)]' : ''
        }`
      : '';

    const colStyle: React.CSSProperties = {
      width: colWidth,
      minWidth: colWidth,
      maxWidth: colWidth,
      ...(isPinned ? { left: `${pinnedLeft}px` } : {}),
    };

    const tdBaseClass = `${cellPaddingClass} border-r border-border/40 ${alignClass} ${stickyTdClass}`;

    switch (colId) {
      case 'code':
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
            <div className={`flex items-center ${justifyClass} gap-1.5 min-w-0`}>
              {tx.isPinned && (
                <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              )}
              <span className={`font-mono font-bold text-primary ${textWrapClass}`}>{tx.code}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTransactionForDetail(tx);
                }}
                title="Xem chi tiết"
                className="shrink-0 p-0.5 rounded text-primary hover:bg-primary/10"
              >
                <Link2 className="w-3 h-3" />
              </button>
            </div>
          </td>
        );

      case 'type':
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
            <div className={`flex items-center ${justifyClass}`}>
              {renderTypeBadge(tx.type)}
            </div>
          </td>
        );

      case 'transactionDate':
        return (
          <td key={colId} style={colStyle} className={`${tdBaseClass} tabular-nums font-medium text-foreground ${textWrapClass}`}>
            {formatDate(tx.transactionDate)}
          </td>
        );

      case 'transactionTime':
        return (
          <td key={colId} style={colStyle} className={`${tdBaseClass} tabular-nums text-muted-foreground ${textWrapClass}`}>
            {formatTime(tx.transactionTime)}
          </td>
        );

      case 'title':
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
            <div className={`flex flex-col ${justifyClass} min-w-0`}>
              <span className={`font-semibold text-foreground ${textWrapClass}`}>
                {tx.title}
              </span>
              {tx.invoiceNumber && (
                <span className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  HĐ: {tx.invoiceNumber}
                </span>
              )}
            </div>
          </td>
        );

      case 'amount':
        return (
          <td key={colId} style={colStyle} className={`${tdBaseClass} font-mono font-bold text-right`}>
            <span
              className={`text-xs ${
                tx.type === 'income'
                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                  : tx.type === 'expense'
                  ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                  : 'text-blue-600 dark:text-blue-400 font-extrabold'
              }`}
            >
              {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
              {formatNumber(tx.amount)} đ
            </span>
          </td>
        );

      case 'runningBalance':
      case 'balance': {
        const bal = runningBalanceMap.get(tx.id);
        return (
          <td key={colId} style={colStyle} className={`${tdBaseClass} font-mono font-bold text-right`}>
            <span
              className={`text-xs ${
                bal !== undefined && bal < 0
                  ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                  : 'text-slate-800 dark:text-slate-200 font-bold'
              }`}
            >
              {bal !== undefined ? `${formatNumber(bal)} đ` : '—'}
            </span>
          </td>
        );
      }

      case 'amountInWords':
        return (
          <td key={colId} style={colStyle} className={`${tdBaseClass} italic text-muted-foreground ${textWrapClass}`}>
            {tx.amountInWords || '—'}
          </td>
        );

      case 'account':
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
            <span className={`font-medium text-foreground ${textWrapClass}`}>
              {getResolvedAccountName(tx.account)}
            </span>
          </td>
        );

      case 'destinationAccount':
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
            {tx.destinationAccount ? (
              <span className={`font-medium text-blue-600 dark:text-blue-400 ${textWrapClass}`}>
                {getResolvedAccountName(tx.destinationAccount)}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </td>
        );

      case 'counterpartyName': {
        const cp = getResolvedCounterparty(tx);
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
            <div className={`flex flex-col ${justifyClass} min-w-0`}>
              <span className={`font-medium text-foreground ${textWrapClass}`}>
                {cp.name || '—'}
              </span>
              {cp.code && (
                <span className="text-[10px] font-mono text-primary/80">
                  [{cp.code}]
                </span>
              )}
            </div>
          </td>
        );
      }

      case 'counterpartyPhone': {
        const cp = getResolvedCounterparty(tx);
        return (
          <td key={colId} style={colStyle} className={`${tdBaseClass} font-mono text-primary ${textWrapClass}`}>
            {cp.phone || '—'}
          </td>
        );
      }

      case 'counterpartyAddress': {
        const cp = getResolvedCounterparty(tx);
        return (
          <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>
            {cp.address || '—'}
          </td>
        );
      }

      case 'category':
        return (
          <td key={colId} style={colStyle} className={`${tdBaseClass} font-medium text-foreground ${textWrapClass}`}>
            {getResolvedCategoryName(tx.category)}
          </td>
        );

      case 'subCategory':
        return (
          <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>
            {tx.subCategory || '—'}
          </td>
        );

      case 'department':
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
            <span className={`flex items-center ${justifyClass} gap-1.5 text-foreground ${textWrapClass}`}>
              <Building2 className="w-3 h-3 text-primary/70 shrink-0" />
              <span className={textWrapClass}>{tx.department || 'Ban Giám Đốc'}</span>
            </span>
          </td>
        );

      case 'paymentMethod':
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
              {tx.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
            </span>
          </td>
        );

      case 'status':
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
            <div className={`flex items-center ${justifyClass}`}>
              {renderStatusBadge(tx.status)}
            </div>
          </td>
        );

      case 'invoiceNumber':
        return (
          <td key={colId} style={colStyle} className={`${tdBaseClass} font-mono font-medium text-primary ${textWrapClass}`}>
            {tx.invoiceNumber || '—'}
          </td>
        );

      case 'refProposalCode':
        return (
          <td key={colId} style={colStyle} className={`${tdBaseClass} font-mono font-medium text-foreground ${textWrapClass}`}>
            {tx.refProposalCode || '—'}
          </td>
        );

      case 'reason':
        return (
          <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>
            {tx.reason || '—'}
          </td>
        );

      case 'note':
        return (
          <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>
            {tx.note || '—'}
          </td>
        );

      case 'createdBy':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-foreground ${textWrapClass}`}>{tx.createdBy}</td>;
      case 'approvedBy':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-foreground ${textWrapClass}`}>{tx.approvedBy || '—'}</td>;
      case 'createdAt':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} tabular-nums text-muted-foreground ${textWrapClass}`}>{tx.createdAt}</td>;
      case 'updatedAt':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} tabular-nums text-muted-foreground ${textWrapClass}`}>{tx.updatedAt}</td>;

      default:
        return <td key={colId} style={colStyle} className={tdBaseClass}>—</td>;
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* Top View Tabs & Master Quick Links Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 px-0.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTopTab('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTopTab === 'list'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Danh sách</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTopTab('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTopTab === 'calendar'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Lịch thu chi</span>
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

        {/* Master Modules Quick-Jump Bar */}
        {onNavigateToModule && (
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => onNavigateToModule('/tai-chinh/danh-muc-tai-chinh')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium transition-colors shadow-xs shrink-0 cursor-pointer"
              title="Quản lý Danh mục tài chính"
            >
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <span>Danh mục thu chi</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToModule('/tai-chinh/tai-khoan')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium transition-colors shadow-xs shrink-0 cursor-pointer"
              title="Quản lý Tài khoản & Quỹ"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tài khoản & Quỹ</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToModule('/tai-chinh/doi-tuong-thu-chi')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium transition-colors shadow-xs shrink-0 cursor-pointer"
              title="Quản lý Đối tượng thu chi"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Đối tượng thu chi</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToModule('/tai-chinh/nguong-duyet')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium transition-colors shadow-xs shrink-0 cursor-pointer"
              title="Quản lý Ngưỡng duyệt chi phí"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
              <span>Ngưỡng duyệt</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {/* Main Card Container */}
        <div className="flex-1 min-h-0 flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          {/* Header Bar Toolbar */}
          {activeTopTab === 'list' && (
            <div className="px-3 py-2 border-b border-border bg-card">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
                {/* Left: Back button, Search and Dropdown Filters */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                  {/* Quay lại Button */}
                  <button
                    type="button"
                    onClick={onBack}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                    title="Quay lại Tài chính"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">Quay lại</span>
                  </button>

                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[160px] max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm chứng từ, đối tượng..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Filter: Transaction Type */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedType !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>
                        {selectedType === 'all'
                          ? 'Loại GD'
                          : selectedType === 'income'
                          ? 'Phiếu Thu'
                          : selectedType === 'expense'
                          ? 'Phiếu Chi'
                          : 'Luân chuyển'}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>
                    {isTypeDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsTypeDropdownOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-1.5 w-44 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedType('all');
                              setIsTypeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                              selectedType === 'all'
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            Tất cả loại GD
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedType('income');
                              setIsTypeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-emerald-600 ${
                              selectedType === 'income' ? 'bg-emerald-500/10 font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Phiếu Thu (Tiền vào)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedType('expense');
                              setIsTypeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-rose-600 ${
                              selectedType === 'expense' ? 'bg-rose-500/10 font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Phiếu Chi (Tiền ra)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedType('transfer');
                              setIsTypeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-blue-600 ${
                              selectedType === 'transfer' ? 'bg-blue-500/10 font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Luân chuyển quỹ
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter: Account (Live from Master Data) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedAccount !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[120px]">
                        {selectedAccount === 'all' ? 'Tài khoản' : selectedAccount}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60 shrink-0" />
                    </button>
                    {isAccountDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsAccountDropdownOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-1.5 w-72 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5 max-h-64 overflow-y-auto custom-scrollbar">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAccount('all');
                              setIsAccountDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                              selectedAccount === 'all'
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            Tất cả tài khoản & quỹ
                          </button>
                          {(masterAccounts.length > 0 ? masterAccounts : CASH_ACCOUNTS).map((acc: any) => {
                            const accName = acc.accountName || acc.name;
                            const balance = acc.currentBalance ?? acc.initialBalance ?? acc.balance ?? 0;
                            return (
                              <button
                                key={acc.id || accName}
                                type="button"
                                onClick={() => {
                                  setSelectedAccount(accName);
                                  setIsAccountDropdownOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 ${
                                  selectedAccount === accName
                                    ? 'bg-primary text-primary-foreground font-semibold'
                                    : 'hover:bg-muted text-foreground'
                                }`}
                              >
                                <span className="truncate">{accName}</span>
                                <span className={`text-[10px] tabular-nums font-mono shrink-0 ${selectedAccount === accName ? 'text-primary-foreground/80' : 'text-emerald-600'}`}>
                                  {formatNumber(balance)} đ
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter: Category (Live from Master Data) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedCategory !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[120px]">
                        {selectedCategory === 'all' ? 'Khoản mục' : selectedCategory}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60 shrink-0" />
                    </button>
                    {isCategoryDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsCategoryDropdownOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-1.5 w-64 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory('all');
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                              selectedCategory === 'all'
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            Tất cả khoản mục
                          </button>
                          {(masterCategories.length > 0
                            ? masterCategories.map((c) => c.name)
                            : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES, ...TRANSFER_CATEGORIES]
                          ).map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(c);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate ${
                                selectedCategory === c
                                  ? 'bg-primary text-primary-foreground font-semibold'
                                  : 'hover:bg-muted text-foreground'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
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
                      <span>
                        {selectedStatus === 'all'
                          ? 'Trạng thái'
                          : selectedStatus === 'completed'
                          ? 'Hoàn thành'
                          : selectedStatus === 'pending'
                          ? 'Chờ duyệt'
                          : 'Bản nháp'}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>
                    {isStatusDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsStatusDropdownOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-1.5 w-44 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatus('all');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                              selectedStatus === 'all'
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            Tất cả trạng thái
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatus('completed');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-emerald-600 ${
                              selectedStatus === 'completed' ? 'bg-emerald-500/10 font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Đã hoàn thành
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatus('pending');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-amber-600 ${
                              selectedStatus === 'pending' ? 'bg-amber-500/10 font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Chờ duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatus('draft');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-slate-600 ${
                              selectedStatus === 'draft' ? 'bg-muted font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Bản nháp
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Actions Toolbar */}
                <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-auto">
                  {/* Bulk Delete Button */}
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      title={`Xóa ${selectedIds.length} chứng từ đã chọn`}
                      className="h-8 px-2.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa ({selectedIds.length})</span>
                    </button>
                  )}

                  {/* Google Sheets Realtime Smart Sync Badge */}
                  <RealtimeSyncBadge
                    isSyncing={isSyncing}
                    lastSyncTime={lastSyncTime}
                    onSync={handleManualSync}
                  />

                  {/* Print */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    title="In sổ thu chi"
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
                  <ColumnCustomizerPopover
                    columns={tableColumns}
                    onChangeColumns={handleSaveColumns}
                    density={tableDensity}
                    onChangeDensity={handleSaveDensity}
                    onReset={handleResetColumns}
                    align="right"
                  />

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

                  {/* Add Transaction */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTransaction(null);
                      setFormInitialType('expense');
                      setIsFormDrawerOpen(true);
                    }}
                    className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Lịch thu chi */}
          {activeTopTab === 'calendar' && (
            <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
              <CashTransactionCalendarView
                transactions={transactions}
                onSelectTransaction={(tx) => setSelectedTransactionForDetail(tx)}
                onAddTransactionWithDate={(_d) => {
                  setEditingTransaction(null);
                  setFormInitialType('expense');
                  setIsFormDrawerOpen(true);
                }}
              />
            </div>
          )}

          {/* Tab 3: Thống kê */}
          {activeTopTab === 'stats' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <CashTransactionStatsTab transactions={transactions} />
            </div>
          )}

          {/* Tab 1: Danh sách */}
          {activeTopTab === 'list' && (
            <div className="flex-1 min-h-0 flex flex-col">
              {viewMode === 'table' ? (
                /* Desktop Table View */
                <div className="flex-1 min-h-0 relative overflow-hidden">
                  <div className="h-full overflow-auto custom-scrollbar">
                    <table className="text-left border-separate border-spacing-0 w-max min-w-full text-xs table-fixed">
                      <thead className="sticky top-0 z-[20] bg-muted">
                        <tr className="border-b border-border bg-muted">
                          {/* 1. Sticky Checkbox */}
                          <th
                            style={{ width: 44, minWidth: 44, maxWidth: 44 }}
                            className={`sticky left-0 z-[25] px-3 bg-muted border-b border-r border-border text-center ${headerPaddingClass} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]`}
                          >
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={handleSelectAll}
                              className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                            />
                          </th>

                          {/* Dynamic Columns */}
                          {visibleColumns.map((col) => {
                            const colWidth = col.width || 160;
                            const colAlign = col.align || 'left';
                            const alignClass =
                              colAlign === 'center'
                                ? 'text-center'
                                : colAlign === 'right'
                                ? 'text-right'
                                : 'text-left';
                            const justifyClass =
                              colAlign === 'center'
                                ? 'justify-center'
                                : colAlign === 'right'
                                ? 'justify-end'
                                : 'justify-between';

                            const offsetInfo = columnOffsets.get(col.id);
                            const isPinned = !!offsetInfo?.isPinned;
                            const pinnedLeft = offsetInfo?.left || 0;
                            const isLastPinned = !!offsetInfo?.isLastPinned;

                            const stickyThClass = isPinned
                              ? `sticky z-[25] bg-muted ${
                                  isLastPinned ? 'shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)]' : ''
                                }`
                              : 'bg-muted';

                            const thStyle: React.CSSProperties = {
                              width: colWidth,
                              minWidth: colWidth,
                              maxWidth: colWidth,
                              ...(isPinned ? { left: `${pinnedLeft}px` } : {}),
                            };

                            return (
                              <th
                                key={col.id}
                                style={thStyle}
                                className={`font-semibold text-foreground border-b border-r border-border whitespace-nowrap px-4 ${headerPaddingClass} ${alignClass} ${stickyThClass} relative group/th select-none`}
                              >
                                <div className={`flex items-center ${justifyClass} gap-1 pr-1`}>
                                  <span className="truncate">{col.label}</span>
                                  {isPinned && (
                                    <span title="Cột đang ghim cố định" className="inline-flex">
                                      <Pin className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 fill-current shrink-0" />
                                    </span>
                                  )}
                                  <SlidersHorizontal className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                                </div>
                                {/* Resizer Handle */}
                                <div
                                  className={`absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize select-none z-20 flex justify-center items-center group/resizer hover:bg-primary/20 ${
                                    resizingColId === col.id ? 'bg-primary/30' : ''
                                  }`}
                                  onMouseDown={(e) => handleStartResize(col.id, e)}
                                  title={`Kéo để chỉnh kích thước cột ${col.label}`}
                                >
                                  <div className="w-[2px] h-3.5 bg-border group-hover/resizer:bg-primary group-hover/resizer:h-full transition-all" />
                                </div>
                              </th>
                            );
                          })}

                          {/* Sticky Thao tác Action Header */}
                          <th
                            style={{ width: 76, minWidth: 76, maxWidth: 76 }}
                            className={`sticky right-0 z-[25] px-3 bg-muted border-b border-l border-border text-center font-semibold text-foreground ${headerPaddingClass} shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]`}
                          >
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {isSyncing && transactions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={tableColumns.filter((c) => c.visible).length + 2}
                              className="py-16 text-center text-muted-foreground bg-card"
                            >
                              <div className="flex flex-col items-center justify-center gap-2">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-medium text-foreground">
                                  Đang đồng bộ dữ liệu chứng từ từ Google Sheet...
                                </span>
                              </div>
                            </td>
                          </tr>
                        ) : filteredTransactions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={tableColumns.filter((c) => c.visible).length + 2}
                              className="py-12 text-center text-muted-foreground bg-card"
                            >
                              Không tìm thấy chứng từ thu chi nào phù hợp
                            </td>
                          </tr>
                        ) : (
                          filteredTransactions.map((tx, index) => {
                            const isSelected = selectedIds.includes(tx.id);
                            const isActiveDetail = selectedTransactionForDetail?.id === tx.id;
                            const isEven = index % 2 === 1;

                            const stickyBgClass = isActiveDetail
                              ? 'bg-blue-100 dark:bg-blue-950 text-foreground !bg-opacity-100'
                              : isSelected
                              ? 'bg-blue-50 dark:bg-blue-900 text-foreground group-hover:bg-blue-100 dark:group-hover:bg-blue-800 !bg-opacity-100'
                              : isEven
                              ? 'bg-slate-50 dark:bg-slate-900 text-foreground group-hover:bg-slate-100 dark:group-hover:bg-slate-850 !bg-opacity-100'
                              : 'bg-white dark:bg-card text-foreground group-hover:bg-slate-100 dark:group-hover:bg-slate-850 !bg-opacity-100';

                            const rowBgClass = isActiveDetail
                              ? 'bg-blue-100 dark:bg-blue-950'
                              : isSelected
                              ? 'bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800'
                              : isEven
                              ? 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                              : 'bg-white dark:bg-card hover:bg-slate-100 dark:hover:bg-slate-800';

                            return (
                              <tr
                                key={tx.id}
                                onClick={() => setSelectedTransactionForDetail(tx)}
                                aria-current={isActiveDetail}
                                className={`group cursor-pointer transition-colors ${rowBgClass} [&>td]:border-b [&>td]:border-border`}
                              >
                                {/* 1. Sticky Checkbox */}
                                <td
                                  style={{ width: 44, minWidth: 44, maxWidth: 44 }}
                                  className={`sticky left-0 z-[10] px-3 ${cellPaddingClass.split(' ')[0]} border-r border-border text-center ${stickyBgClass} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] cursor-pointer select-none`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSelect(tx.id, e);
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleSelect(tx.id, e);
                                    }}
                                    onChange={() => {}}
                                    className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer align-middle"
                                  />
                                </td>

                                {/* Dynamic Columns */}
                                {visibleColumns.map((col) =>
                                  renderTransactionCell(col, tx, stickyBgClass)
                                )}

                                {/* Sticky Thao tác */}
                                <td
                                  style={{ width: 76, minWidth: 76, maxWidth: 76 }}
                                  className={`sticky right-0 z-[10] px-2 ${cellPaddingClass.split(' ')[0]} border-l border-border/50 text-center ${stickyBgClass} shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]`}
                                >
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      title="Chỉnh sửa chứng từ"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTransaction(tx);
                                        setFormInitialType(tx.type);
                                        setIsFormDrawerOpen(true);
                                      }}
                                      className="p-1 rounded-md text-primary hover:bg-primary/10 transition-colors"
                                    >
                                      <SquarePen className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Xóa chứng từ"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTransaction(tx.id);
                                      }}
                                      className="p-1 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
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
                </div>
              ) : (
                /* Grid Cards View */
                <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
                  {isSyncing && transactions.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium text-foreground">
                        Đang đồng bộ dữ liệu chứng từ từ Google Sheet...
                      </span>
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="py-16 text-center text-xs text-muted-foreground">
                      Không tìm thấy chứng từ thu chi nào phù hợp
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTransactionForDetail(tx)}
                        className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-primary truncate">
                                {tx.code}
                              </span>
                              {tx.isPinned && (
                                <Pin className="w-3 h-3 text-amber-500 fill-current shrink-0" />
                              )}
                            </div>
                            <h3 className="font-semibold text-sm text-foreground line-clamp-2 mt-1">
                              {tx.title}
                            </h3>
                          </div>
                          {renderTypeBadge(tx.type)}
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                          <div className="flex items-center justify-between font-mono font-bold text-sm">
                            <span>Số tiền:</span>
                            <span
                              className={
                                tx.type === 'income'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : tx.type === 'expense'
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-blue-600 dark:text-blue-400'
                              }
                            >
                              {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                              {formatNumber(tx.amount)} đ
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="truncate">Tài khoản:</span>
                            <span className="font-medium text-foreground truncate max-w-[150px]">
                              {tx.account}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="truncate">Đối tượng:</span>
                            <span className="font-medium text-foreground truncate max-w-[150px]">
                              {tx.counterpartyName || '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Ngày GD:</span>
                            <span className="tabular-nums text-foreground">{formatDate(tx.transactionDate)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/40">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTransaction(tx);
                              setFormInitialType(tx.type);
                              setIsFormDrawerOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs rounded-lg border border-border hover:bg-muted text-primary flex items-center gap-1 font-medium transition-colors"
                          >
                            <SquarePen className="w-3 h-3" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTransaction(tx.id);
                            }}
                            className="px-2.5 py-1 text-xs rounded-lg border border-destructive/20 hover:bg-destructive/10 text-destructive flex items-center gap-1 font-medium transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </div>
              )}

              {/* Table / Grid Footer Pagination */}
              <div className="p-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground shrink-0 bg-card">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>
                    Hiển thị <span className="font-semibold text-foreground">{filteredTransactions.length}</span> / {transactions.length} chứng từ
                  </span>
                  {selectedIds.length > 0 && (
                    <div className="inline-flex items-center gap-1.5">
                      <span className="font-medium text-primary">
                        (Đã chọn {selectedIds.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        className="px-2 py-0.5 rounded border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Xóa {selectedIds.length} mục đã chọn
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled
                    className="p-1.5 rounded-lg border border-border opacity-50 cursor-not-allowed"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled
                    className="p-1.5 rounded-lg border border-border opacity-50 cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2.5 py-1 bg-primary text-primary-foreground font-semibold rounded-lg text-xs">
                    1
                  </span>
                  <button
                    type="button"
                    disabled
                    className="p-1.5 rounded-lg border border-border opacity-50 cursor-not-allowed"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled
                    className="p-1.5 rounded-lg border border-border opacity-50 cursor-not-allowed"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedTransactionForDetail && (
        <CashTransactionDetailDrawer
          isOpen={!!selectedTransactionForDetail}
          transaction={selectedTransactionForDetail}
          currentIndex={currentDetailIndex}
          totalCount={filteredTransactions.length}
          onClose={() => setSelectedTransactionForDetail(null)}
          onEdit={(tx) => {
            setSelectedTransactionForDetail(null);
            setEditingTransaction(tx);
            setFormInitialType(tx.type);
            setIsFormDrawerOpen(true);
          }}
          onDelete={(id) => handleDeleteTransaction(id)}
          onTogglePin={handleTogglePin}
          onNavigateToModule={onNavigateToModule}
          onNext={() => {
            if (currentDetailIndex < filteredTransactions.length - 1) {
              setSelectedTransactionForDetail(filteredTransactions[currentDetailIndex + 1]);
            }
          }}
          onPrev={() => {
            if (currentDetailIndex > 0) {
              setSelectedTransactionForDetail(filteredTransactions[currentDetailIndex - 1]);
            }
          }}
        />
      )}

      {/* Form Drawer (Create / Edit) */}
      <CashTransactionFormDrawer
        isOpen={isFormDrawerOpen}
        initialType={formInitialType}
        transactionToEdit={editingTransaction}
        onClose={() => {
          setIsFormDrawerOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleFormSubmit}
        onNavigateToModule={onNavigateToModule}
      />

      {/* Toast Notifications */}
      {syncToastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-card border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-xs font-semibold text-foreground">
            {syncToastMessage}
          </span>
        </div>
      )}

      {syncError && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-card border border-destructive/40 text-destructive rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <span className="text-xs font-semibold text-foreground">
            {syncError}
          </span>
        </div>
      )}
    </div>
  );
};
