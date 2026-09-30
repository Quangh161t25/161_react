import React, { useState, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Trash2,
  Printer,
  Copy,
  Check,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  FileText,
  Pin,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Receipt,
  Download,
  AlertCircle,
  Building2,
  CreditCard,
  Calendar,
  Layers,
  Phone,
  MapPin,
  ExternalLink,
  Wallet,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { CashTransaction } from '../../types/cashTransaction';
import {
  FinanceCategory,
  FinanceAccount,
  Counterparty,
  ApprovalThreshold,
} from '../../types/financeMaster';
import {
  financeCategoryService,
  financeAccountService,
  counterpartyService,
  approvalThresholdService,
} from '../../services/financeMasterService';
import { employeeService } from '../../services/employeeService';
import { useSettings } from '../../context/SettingsContext';

interface CashTransactionDetailDrawerProps {
  isOpen?: boolean;
  transaction: CashTransaction | null;
  allTransactions?: CashTransaction[];
  currentIndex?: number;
  totalCount?: number;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onNavigate?: (tx: CashTransaction) => void;
  onEdit: (tx: CashTransaction) => void;
  onDelete: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onViewProposal?: (code: string) => void;
  onNavigateToModule?: (path: string) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';
type DetailTab = 'overview' | 'voucher' | 'attachments';

export const CashTransactionDetailDrawer: React.FC<CashTransactionDetailDrawerProps> = ({
  isOpen,
  transaction,
  allTransactions,
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
  onNavigate,
  onEdit,
  onDelete,
  onTogglePin,
  onViewProposal,
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

  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('normal');
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Match with Master Entities
  const matchedAccount = useMemo<FinanceAccount | null>(() => {
    if (!transaction) return null;
    const accounts = financeAccountService.getInitialAccounts();
    return (
      accounts.find(
        (a) =>
          a.accountName === transaction.account ||
          `${a.accountName} (${a.accountNumber})` === transaction.account ||
          a.code === transaction.account
      ) || null
    );
  }, [transaction]);

  const matchedDestinationAccount = useMemo<FinanceAccount | null>(() => {
    if (!transaction || !transaction.destinationAccount) return null;
    const accounts = financeAccountService.getInitialAccounts();
    return (
      accounts.find(
        (a) =>
          a.accountName === transaction.destinationAccount ||
          `${a.accountName} (${a.accountNumber})` === transaction.destinationAccount ||
          a.code === transaction.destinationAccount
      ) || null
    );
  }, [transaction]);

  const matchedCounterparty = useMemo<Counterparty | null>(() => {
    if (!transaction) return null;
    const counterparties = counterpartyService.getInitialCounterparties();
    const employees = employeeService.getInitialEmployees();

    if (transaction.counterpartyId) {
      const cleanId = transaction.counterpartyId.replace('cp:', '').replace('emp:', '');
      const cp = counterparties.find((c) => c.id === cleanId || c.code === cleanId);
      if (cp) return cp;
      const emp = employees.find((e) => e.id === cleanId || e.code === cleanId);
      if (emp) {
        return {
          id: emp.id,
          code: emp.code,
          name: emp.name,
          phone: emp.phone,
          address: emp.currentAddress || emp.permanentAddress,
          type: 'employee',
          status: 'active',
          createdAt: '',
          updatedAt: '',
        };
      }
    }

    if (transaction.counterpartyCode) {
      const cp = counterparties.find((c) => c.code === transaction.counterpartyCode);
      if (cp) return cp;
      const emp = employees.find((e) => e.code === transaction.counterpartyCode);
      if (emp) {
        return {
          id: emp.id,
          code: emp.code,
          name: emp.name,
          phone: emp.phone,
          address: emp.currentAddress || emp.permanentAddress,
          type: 'employee',
          status: 'active',
          createdAt: '',
          updatedAt: '',
        };
      }
    }

    const query = (transaction.counterpartyName || '').toLowerCase().trim();
    if (!query) return null;
    const cp = counterparties.find(
      (c) =>
        c.name.toLowerCase().trim() === query ||
        (c.phone && c.phone === transaction.counterpartyPhone)
    );
    if (cp) return cp;

    const emp = employees.find(
      (e) =>
        e.name.toLowerCase().trim() === query ||
        (e.phone && e.phone === transaction.counterpartyPhone)
    );
    if (emp) {
      return {
        id: emp.id,
        code: emp.code,
        name: emp.name,
        phone: emp.phone,
        address: emp.currentAddress || emp.permanentAddress,
        type: 'employee',
        status: 'active',
        createdAt: '',
        updatedAt: '',
      };
    }

    return null;
  }, [transaction]);

  const matchedCategory = useMemo<FinanceCategory | null>(() => {
    if (!transaction || !transaction.category) return null;
    const categories = financeCategoryService.getInitialCategories();
    return (
      categories.find(
        (c) =>
          c.name.toLowerCase() === transaction.category.toLowerCase() ||
          c.code.toLowerCase() === transaction.category.toLowerCase()
      ) || null
    );
  }, [transaction]);

  const matchedThreshold = useMemo<ApprovalThreshold | null>(() => {
    if (!transaction || (transaction.type !== 'expense' && transaction.type !== 'transfer')) {
      return null;
    }
    const thresholds = approvalThresholdService
      .getInitialThresholds()
      .filter((th) => th.status === 'active');
    return (
      thresholds.find((th) => {
        if (th.department && th.department !== 'Tất cả' && th.department !== transaction.department) {
          return false;
        }
        if (th.category && th.category !== 'Tất cả' && th.category !== transaction.category) {
          return false;
        }
        const matchMin = th.minAmount <= transaction.amount;
        const matchMax = th.maxAmount === 0 || th.maxAmount >= transaction.amount;
        return matchMin && matchMax;
      }) || null
    );
  }, [transaction]);

  if (!transaction || (isOpen !== undefined && !isOpen)) return null;

  const currentIdx =
    currentIndex !== undefined
      ? currentIndex
      : allTransactions
      ? allTransactions.findIndex((t) => t.id === transaction.id)
      : 0;
  const total =
    totalCount !== undefined
      ? totalCount
      : allTransactions
      ? allTransactions.length
      : 1;

  const handlePrev = () => {
    if (onPrev) return onPrev();
    if (allTransactions && onNavigate && currentIdx > 0) {
      onNavigate(allTransactions[currentIdx - 1]);
    }
  };

  const handleNext = () => {
    if (onNext) return onNext();
    if (allTransactions && onNavigate && currentIdx < allTransactions.length - 1) {
      onNavigate(allTransactions[currentIdx + 1]);
    }
  };

  const toggleFullscreen = () => {
    if (widthMode === 'fullscreen') {
      setWidthMode(prevWidthMode || 'normal');
    } else {
      setPrevWidthMode(widthMode);
      setWidthMode('fullscreen');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(transaction.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyAll = () => {
    const typeLabel =
      transaction.type === 'income'
        ? 'Phiếu Thu'
        : transaction.type === 'expense'
        ? 'Phiếu Chi'
        : 'Luân Chuyển Quỹ';

    const lines = [
      `=== THÔNG TIN CHỨNG TỪ: ${transaction.code} ===`,
      `Loại chứng từ: ${typeLabel}`,
      `Tiêu đề: ${transaction.title}`,
      `Số tiền: ${formatNumber(transaction.amount)} VNĐ (${transaction.amountInWords || '—'})`,
      `Ngày giao dịch: ${transaction.transactionDate} ${formatTime(transaction.transactionTime)}`,
      `Tài khoản nguồn: ${transaction.account}`,
      transaction.destinationAccount ? `Tài khoản đích: ${transaction.destinationAccount}` : '',
      `Khoản mục: ${transaction.category}${transaction.subCategory ? ` - ${transaction.subCategory}` : ''}`,
      `Đối tác / Người nộp-nhận: ${transaction.counterpartyName || '—'}`,
      `SĐT đối tác: ${transaction.counterpartyPhone || '—'}`,
      `Địa chỉ: ${transaction.counterpartyAddress || '—'}`,
      `Phòng ban: ${transaction.department || '—'}`,
      `Số hóa đơn VAT: ${transaction.invoiceNumber || '—'}`,
      `Mã đề xuất liên kết: ${transaction.refProposalCode || '—'}`,
      `Người lập: ${transaction.createdBy || '—'} | Người duyệt: ${transaction.approvedBy || '—'}`,
      `Trạng thái: ${transaction.status === 'completed' ? 'Đã hoàn thành' : 'Chờ duyệt'}`,
      transaction.reason ? `Diễn giải: ${transaction.reason}` : '',
      transaction.note ? `Ghi chú: ${transaction.note}` : '',
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const getDrawerWidthStyle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return '100vw';
    }
    switch (widthMode) {
      case 'narrow':
        return 'min(540px, 100vw)';
      case 'wide':
        return 'min(1024px, 100vw)';
      case 'fullscreen':
        return '100vw';
      case 'normal':
      default:
        return 'min(768px, -6rem + 100vw)';
    }
  };

  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'transfer';

  const getTypeBadge = () => {
    if (isIncome) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <ArrowDownLeft className="w-3.5 h-3.5" />
          Phiếu Thu
        </span>
      );
    }
    if (isExpense) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <ArrowUpRight className="w-3.5 h-3.5" />
          Phiếu Chi
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        <ArrowLeftRight className="w-3.5 h-3.5" />
        Luân Chuyển
      </span>
    );
  };

  const getStatusBadge = (st: CashTransaction['status']) => {
    switch (st) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium border transition-colors rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Hoàn thành
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium border transition-colors rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Chờ duyệt
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium border transition-colors rounded-full bg-muted text-muted-foreground border-border">
            Bản nháp
          </span>
        );
    }
  };

  const voucherTitle = isIncome
    ? 'PHIẾU THU'
    : isExpense
    ? 'PHIẾU CHI'
    : 'ỦY NHIỆM CHI / LỆNH CHUYỂN TIỀN';

  const voucherSubtitle = isIncome
    ? 'Mẫu số: 01 - TT (Ban hành theo Thông tư số 200/2014/TT-BTC)'
    : isExpense
    ? 'Mẫu số: 02 - TT (Ban hành theo Thông tư số 200/2014/TT-BTC)'
    : 'Chứng từ kế toán chuyển tiền nội bộ & ngân hàng';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Main Drawer Container */}
      <div
        className="fixed inset-y-0 right-0 w-full bg-card shadow-2xl flex flex-col h-[100dvh] border-l border-border outline-none transform-gpu z-50 transition-[width] duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Hồ sơ Chứng từ Thu Chi"
        tabIndex={-1}
        style={{
          width: getDrawerWidthStyle(),
          transform: 'none',
        }}
      >
        {/* Top Header */}
        <div
          className="flex items-center justify-between gap-4 border-b border-border bg-card shrink-0"
          style={{
            paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
            paddingBottom: '0.5rem',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          }}
        >
          {/* Left Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground leading-tight truncate">
                Chi tiết Chứng từ Thu Chi
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {transaction.code} • {transaction.title}
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {onTogglePin && (
              <button
                type="button"
                onClick={() => onTogglePin(transaction.id)}
                className={`p-2 rounded-lg transition-colors active:scale-90 ${
                  transaction.isPinned
                    ? 'text-amber-500 bg-amber-500/10'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title={transaction.isPinned ? 'Bỏ ghim' : 'Ghim phiếu lên đầu'}
              >
                <Pin className={`w-4 h-4 ${transaction.isPinned ? 'fill-current' : ''}`} />
              </button>
            )}

            {/* Width Switcher (Tablet/Desktop) */}
            <div
              role="group"
              aria-label="Bề rộng ngăn bên"
              className="hidden sm:flex items-center gap-0.5 shrink-0 rounded-xl border border-border p-0.5"
            >
              <button
                type="button"
                aria-pressed={widthMode === 'narrow'}
                aria-label="Hẹp"
                title="Hẹp"
                onClick={() => setWidthMode('narrow')}
                className={`p-2 rounded-lg transition-colors active:scale-90 hover:bg-muted hover:text-foreground ${
                  widthMode === 'narrow' ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}
              >
                <PanelRightClose className="w-4 h-4 stroke-[2.5px]" />
              </button>
              <button
                type="button"
                aria-pressed={widthMode === 'normal'}
                aria-label="Chuẩn"
                title="Chuẩn"
                onClick={() => setWidthMode('normal')}
                className={`p-2 rounded-lg transition-colors active:scale-90 hover:bg-muted hover:text-foreground ${
                  widthMode === 'normal' ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}
              >
                <PanelRight className="w-4 h-4 stroke-[2.5px]" />
              </button>
              <button
                type="button"
                aria-pressed={widthMode === 'wide'}
                aria-label="Rộng"
                title="Rộng"
                onClick={() => setWidthMode('wide')}
                className={`p-2 rounded-lg transition-colors active:scale-90 hover:bg-muted hover:text-foreground ${
                  widthMode === 'wide' ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}
              >
                <PanelRightOpen className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </div>

            {/* Navigation & Fullscreen */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                disabled={currentIdx <= 0}
                onClick={handlePrev}
                aria-label="Bản ghi trước"
                title="Bản ghi trước"
                className="p-2 rounded-lg text-muted-foreground transition-colors active:scale-90 hover:bg-muted hover:text-foreground disabled:opacity-35 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5px]" />
              </button>
              <span
                className="px-1 text-xs font-medium text-muted-foreground tabular-nums select-none whitespace-nowrap"
                aria-label={`Bản ghi ${currentIdx + 1} trên ${total}`}
              >
                {currentIdx + 1}/{total}
              </span>
              <button
                type="button"
                disabled={currentIdx >= total - 1}
                onClick={handleNext}
                aria-label="Bản ghi sau"
                title="Bản ghi sau"
                className="p-2 rounded-lg text-muted-foreground transition-colors active:scale-90 hover:bg-muted hover:text-foreground disabled:opacity-35 disabled:pointer-events-none"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5px]" />
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={widthMode === 'fullscreen' ? 'Thu nhỏ' : 'Mở toàn màn hình'}
                title={widthMode === 'fullscreen' ? 'Thu nhỏ' : 'Mở toàn màn hình'}
                className="p-2 rounded-lg text-muted-foreground transition-colors active:scale-90 hover:bg-muted hover:text-foreground ml-1 border-l border-border rounded-l-none pl-2"
              >
                {widthMode === 'fullscreen' ? (
                  <Minimize2 className="w-4 h-4 stroke-[2.5px]" />
                ) : (
                  <Maximize2 className="w-4 h-4 stroke-[2.5px]" />
                )}
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              title="Đóng"
              className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors active:scale-90 shrink-0"
            >
              <X className="w-5 h-5 stroke-[2.5px]" />
            </button>
          </div>
        </div>

        {/* Top View Selector Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-5 py-2 border-b border-border bg-card">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Thông tin hạch toán</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('voucher')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'voucher'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Mẫu phiếu in kế toán</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attachments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'attachments'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Hóa đơn & Tệp ({transaction.attachments?.length || 0})</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-5 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-5">
            {/* 1. Summary Card */}
            <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border ${
                  isIncome
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : isExpense
                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                    : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                }`}
              >
                {isIncome ? (
                  <ArrowDownLeft className="w-7 h-7" />
                ) : isExpense ? (
                  <ArrowUpRight className="w-7 h-7" />
                ) : (
                  <ArrowLeftRight className="w-7 h-7" />
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-mono font-bold text-primary truncate">
                      {transaction.code}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Sao chép mã"
                    >
                      {copiedCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {getTypeBadge()}
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-base font-bold text-foreground truncate max-w-md">
                    {transaction.title}
                  </h2>
                  <div
                    className={`text-xl font-black tabular-nums ${
                      isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isExpense
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {isIncome ? '+' : isExpense ? '-' : ''}
                    {formatNumber(transaction.amount)} VNĐ
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Quick Action Buttons Grid */}
            <div className="gap-2 sm:gap-3 p-2.5 sm:p-3.5 min-w-0 grid grid-cols-4 bg-card rounded-xl border border-border shadow-xs">
              {/* In chứng từ */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex flex-col items-center gap-1 sm:gap-1.5 transition-[transform,colors] duration-150 outline-none min-w-0 w-full hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-[transform,colors,background-color,border-color] duration-150 shadow-xs border bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground">
                  <Printer className="w-4 h-4" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-center transition-colors truncate w-full px-0.5 leading-tight text-primary">
                  In chứng từ
                </span>
              </button>

              {/* Sửa thông tin */}
              <button
                type="button"
                onClick={() => onEdit(transaction)}
                className="flex flex-col items-center gap-1 sm:gap-1.5 transition-[transform,colors] duration-150 outline-none min-w-0 w-full hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-[transform,colors,background-color,border-color] duration-150 shadow-xs border bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground">
                  <SquarePen className="w-4 h-4" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-center transition-colors truncate w-full px-0.5 leading-tight text-muted-foreground">
                  Chỉnh sửa
                </span>
              </button>

              {/* Sao chép toàn bộ */}
              <button
                type="button"
                onClick={handleCopyAll}
                className="flex flex-col items-center gap-1 sm:gap-1.5 transition-[transform,colors] duration-150 outline-none min-w-0 w-full hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-[transform,colors,background-color,border-color] duration-150 shadow-xs border bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground">
                  {copiedAll ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-center transition-colors truncate w-full px-0.5 leading-tight text-muted-foreground">
                  {copiedAll ? 'Đã chép' : 'Sao chép'}
                </span>
              </button>

              {/* Gọi điện / Liên hệ */}
              <button
                type="button"
                onClick={() => {
                  if (transaction.counterpartyPhone) {
                    window.location.href = `tel:${transaction.counterpartyPhone}`;
                  }
                }}
                disabled={!transaction.counterpartyPhone}
                className="flex flex-col items-center gap-1 sm:gap-1.5 transition-[transform,colors] duration-150 outline-none min-w-0 w-full hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-[transform,colors,background-color,border-color] duration-150 shadow-xs border bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-center transition-colors truncate w-full px-0.5 leading-tight text-muted-foreground">
                  Gọi điện
                </span>
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* Section 1: Thông tin hạch toán & Tài khoản (Liên kết Tài khoản) */}
                <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                    <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                      <Wallet className="w-3.5 h-3.5" />
                      <span className="truncate">Hạch toán & Dòng tiền</span>
                    </h4>
                    {onNavigateToModule && (
                      <button
                        type="button"
                        onClick={() => onNavigateToModule('/tai-chinh/tai-khoan')}
                        className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <span>Mở module Tài khoản</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full">
                    <div className="space-y-1 min-w-0 w-full">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                        <CreditCard className="w-3 h-3" />
                        Số tiền giao dịch
                      </span>
                      <p className="text-sm font-bold text-foreground">
                        {formatNumber(transaction.amount)} VNĐ
                      </p>
                    </div>

                    <div className="space-y-1 min-w-0 w-full">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                        <FileText className="w-3 h-3" />
                        Bằng chữ
                      </span>
                      <p className="text-xs font-medium italic text-foreground">
                        {transaction.amountInWords || '—'}
                      </p>
                    </div>

                    <div className="space-y-1 min-w-0 w-full">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                        <Calendar className="w-3 h-3" />
                        Ngày & Giờ giao dịch
                      </span>
                      <p className="text-xs font-semibold text-foreground">
                        {formatDate(transaction.transactionDate)} ({formatTime(transaction.transactionTime)})
                      </p>
                    </div>

                    <div className="space-y-1 min-w-0 w-full">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                        <CreditCard className="w-3 h-3" />
                        Hình thức thanh toán
                      </span>
                      <p className="text-xs font-semibold text-foreground">
                        {transaction.paymentMethod === 'cash'
                          ? 'Tiền mặt tại quỹ'
                          : transaction.paymentMethod === 'bank_transfer'
                          ? 'Chuyển khoản ngân hàng'
                          : transaction.paymentMethod === 'credit_card'
                          ? 'Thẻ tín dụng'
                          : 'Ví điện tử'}
                      </p>
                    </div>

                    {/* Linked Account Card */}
                    <div className="space-y-1 min-w-0 w-full p-2.5 bg-muted/30 rounded-lg border border-border">
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                        <Wallet className="w-3 h-3 text-primary" />
                        Tài khoản nguồn (Trích tiền)
                      </span>
                      <p className="text-xs font-bold text-primary">
                        {matchedAccount?.accountName || transaction.account}
                      </p>
                      {matchedAccount && (
                        <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/60 mt-1">
                          <p>Mã TK: <span className="font-mono font-semibold text-foreground">{matchedAccount.code}</span> | Ngân hàng: <span className="text-foreground">{matchedAccount.bankName || 'Nội bộ'}</span></p>
                          <p>Số dư hiện tại: <span className="font-semibold text-emerald-600">{formatNumber(matchedAccount.currentBalance ?? matchedAccount.initialBalance ?? 0)} VNĐ</span></p>
                        </div>
                      )}
                    </div>

                    {/* Linked Destination Account Card */}
                    {isTransfer && transaction.destinationAccount && (
                      <div className="space-y-1 min-w-0 w-full p-2.5 bg-muted/30 rounded-lg border border-border">
                        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                          <Wallet className="w-3 h-3 text-blue-600" />
                          Tài khoản nhận (Đích)
                        </span>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {matchedDestinationAccount?.accountName || transaction.destinationAccount}
                        </p>
                        {matchedDestinationAccount && (
                          <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/60 mt-1">
                            <p>Mã TK: <span className="font-mono font-semibold text-foreground">{matchedDestinationAccount.code}</span> | Ngân hàng: <span className="text-foreground">{matchedDestinationAccount.bankName || 'Nội bộ'}</span></p>
                            <p>Số dư hiện tại: <span className="font-semibold text-emerald-600">{formatNumber(matchedDestinationAccount.currentBalance ?? matchedDestinationAccount.initialBalance ?? 0)} VNĐ</span></p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Linked Category Card */}
                    <div className="space-y-1 min-w-0 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                          <Layers className="w-3 h-3" />
                          Khoản mục tài chính
                        </span>
                        {onNavigateToModule && (
                          <button
                            type="button"
                            onClick={() => onNavigateToModule('/tai-chinh/danh-muc-tai-chinh')}
                            className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Xem danh mục</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        {matchedCategory?.name || transaction.category}{' '}
                        {transaction.subCategory ? `• ${transaction.subCategory}` : ''}
                      </p>
                      {matchedCategory && (
                        <p className="text-[11px] text-muted-foreground">
                          Mã: <span className="font-mono text-primary">{matchedCategory.code}</span> | Phân cấp: Cấp {matchedCategory.level}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 w-full">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                        <Building2 className="w-3 h-3" />
                        Phòng ban chịu phí
                      </span>
                      <p className="text-xs font-semibold text-foreground">
                        {transaction.department || 'Ban Giám Đốc'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Thông tin đối tác (Liên kết Đối tượng thu chi) */}
                <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                    <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                      <Users className="w-3.5 h-3.5" />
                      <span className="truncate">Đối tác & Bên liên quan</span>
                    </h4>
                    {onNavigateToModule && (
                      <button
                        type="button"
                        onClick={() => onNavigateToModule('/tai-chinh/doi-tuong-thu-chi')}
                        className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <span>Mở module Đối tượng</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full">
                    <div className="space-y-1 min-w-0 w-full">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                        <User className="w-3 h-3" />
                        Họ tên / Tên đơn vị
                      </span>
                      <p className="text-xs font-bold text-foreground">
                        {matchedCounterparty?.name || transaction.counterpartyName || '—'}
                      </p>
                      {matchedCounterparty && (
                        <p className="text-[11px] text-muted-foreground">
                          Mã ĐT: <span className="font-mono text-primary">{matchedCounterparty.code}</span>
                          {matchedCounterparty.taxCode && ` | MST: ${matchedCounterparty.taxCode}`}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 w-full">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                        <Layers className="w-3 h-3" />
                        Phân loại đối tác
                      </span>
                      <p className="text-xs font-medium text-foreground">
                        {transaction.counterpartyType === 'customer'
                          ? 'Khách hàng'
                          : transaction.counterpartyType === 'vendor'
                          ? 'Nhà cung cấp'
                          : transaction.counterpartyType === 'employee'
                          ? 'Nhân viên nội bộ'
                          : 'Đối tác / Khác'}
                      </p>
                    </div>

                    <div className="space-y-1 min-w-0 w-full">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                        <Phone className="w-3 h-3" />
                        Số điện thoại
                      </span>
                      <p className="text-xs font-semibold text-foreground">
                        {transaction.counterpartyPhone || '—'}
                      </p>
                    </div>

                    <div className="space-y-1 min-w-0 w-full">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                        <Receipt className="w-3 h-3" />
                        Số Hóa đơn VAT / Hợp đồng
                      </span>
                      <p className="text-xs font-mono font-semibold text-primary">
                        {transaction.invoiceNumber || '—'}
                      </p>
                    </div>

                    <div className="space-y-1 min-w-0 w-full sm:col-span-2">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3 h-3" />
                        Địa chỉ
                      </span>
                      <p className="text-xs font-medium text-foreground">
                        {transaction.counterpartyAddress || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Ngưỡng duyệt & Quy trình phê duyệt (Liên kết Ngưỡng duyệt) */}
                {(isExpense || isTransfer) && (
                  <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                      <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="truncate">Hạn mức & Quy trình phê duyệt</span>
                      </h4>
                      {onNavigateToModule && (
                        <button
                          type="button"
                          onClick={() => onNavigateToModule('/tai-chinh/nguong-duyet')}
                          className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <span>Mở module Ngưỡng duyệt</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {matchedThreshold ? (
                      <div className="space-y-2.5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                          <div>
                            <span className="font-semibold text-foreground text-sm">{matchedThreshold.name}</span>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Hạn mức áp dụng: {matchedThreshold.minAmount.toLocaleString('vi-VN')} VNĐ -{' '}
                              {matchedThreshold.maxAmount > 0
                                ? `${matchedThreshold.maxAmount.toLocaleString('vi-VN')} VNĐ`
                                : 'Không giới hạn'}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                            {matchedThreshold.approvalLevels} cấp duyệt
                          </span>
                        </div>

                        {matchedThreshold.approvers && matchedThreshold.approvers.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-medium text-muted-foreground">Trình tự phê duyệt quy định:</span>
                            <div className="flex items-center gap-2 flex-wrap">
                              {matchedThreshold.approvers.map((appr, idx) => (
                                <React.Fragment key={idx}>
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border shadow-xs">
                                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                      {idx + 1}
                                    </span>
                                    <span className="font-medium text-foreground">{appr}</span>
                                  </div>
                                  {idx < matchedThreshold.approvers.length - 1 && (
                                    <span className="text-muted-foreground font-bold">➔</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Chứng từ áp dụng quy trình duyệt tiêu chuẩn nội bộ.
                      </p>
                    )}
                  </div>
                )}

                {/* Section 4: Diễn giải & Chứng từ liên kết */}
                <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                    <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="truncate">Diễn giải & Liên kết</span>
                    </h4>
                  </div>

                  <div className="space-y-3 text-xs">
                    {transaction.reason && (
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium">Diễn giải chi tiết:</span>
                        <p className="p-3 bg-muted/30 rounded-lg text-foreground leading-relaxed italic border border-border">
                          {transaction.reason}
                        </p>
                      </div>
                    )}

                    {transaction.refProposalCode && (
                      <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">
                            Đề xuất chi phí liên kết:
                          </span>
                          <span className="font-mono font-bold text-primary">
                            {transaction.refProposalCode}
                          </span>
                        </div>
                        {onViewProposal && (
                          <button
                            type="button"
                            onClick={() => onViewProposal(transaction.refProposalCode!)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            <span>Xem đề xuất</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}

                    {transaction.note && (
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-medium">Ghi chú nội bộ:</span>
                        <p className="p-3 bg-amber-500/10 rounded-lg text-amber-900 dark:text-amber-200 border border-amber-500/20">
                          {transaction.note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 5: Người lập & Duyệt */}
                <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                    <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate">Phê duyệt & Người thực hiện</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Người lập phiếu:</span>
                      <strong className="text-foreground mt-0.5 block">{transaction.createdBy || 'Lê Minh Công'}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Người duyệt:</span>
                      <strong className="text-foreground mt-0.5 block">{transaction.approvedBy || 'Lê Minh Công'}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Ngày tạo:</span>
                      <span className="text-foreground mt-0.5 block">{formatDate(transaction.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Cập nhật:</span>
                      <span className="text-foreground mt-0.5 block">{formatDate(transaction.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: VOUCHER PRINT VIEW */}
            {activeTab === 'voucher' && (
              <div className="print:m-0">
                <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-xs print:shadow-none print:border-none space-y-6">
                  {/* Voucher Header */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-border">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        CÔNG TY CỔ PHẦN CÔNG NGHỆ H161
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Địa chỉ: Tòa nhà Landmark 81, Tầng 12, P. Cầu Giấy, TP. Hà Nội
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Mã số thuế: 0108998877 | ĐT: 024 3999 8888
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[11px] font-semibold text-foreground">
                        {voucherSubtitle}
                      </p>
                      <div className="flex sm:justify-end items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">Mã phiếu:</span>
                        <span className="font-mono font-bold text-sm text-primary">
                          {transaction.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Ngày lập: {formatDate(transaction.transactionDate)} ({formatTime(transaction.transactionTime)})
                      </p>
                    </div>
                  </div>

                  {/* Voucher Title */}
                  <div className="text-center my-4">
                    <div className="inline-block mb-2">{getTypeBadge()}</div>
                    <h2 className="text-2xl font-black text-foreground uppercase tracking-wide">
                      {voucherTitle}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Ngày {transaction.transactionDate.split('-')[2]} tháng {transaction.transactionDate.split('-')[1]} năm {transaction.transactionDate.split('-')[0]}
                    </p>
                  </div>

                    {/* Voucher Body */}
                  <div className="space-y-3.5 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="text-muted-foreground shrink-0 min-w-[150px] font-medium">
                        {isIncome ? 'Họ tên người nộp tiền:' : isExpense ? 'Họ tên người nhận tiền:' : 'Đơn vị / Bộ phận chuyển:'}
                      </span>
                      <span className="font-bold text-foreground text-sm">
                        {matchedCounterparty?.name || transaction.counterpartyName || '—'}
                      </span>
                      {transaction.counterpartyPhone && (
                        <span className="text-xs text-muted-foreground">({transaction.counterpartyPhone})</span>
                      )}
                    </div>

                    {transaction.counterpartyAddress && (
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                        <span className="text-muted-foreground shrink-0 min-w-[150px] font-medium">
                          Địa chỉ:
                        </span>
                        <span className="text-foreground">
                          {matchedCounterparty?.address || transaction.counterpartyAddress}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="text-muted-foreground shrink-0 min-w-[150px] font-medium">
                        Lý do {isIncome ? 'thu:' : isExpense ? 'chi:' : 'chuyển:'}
                      </span>
                      <span className="text-foreground font-semibold">
                        {transaction.title}
                      </span>
                    </div>

                    {transaction.reason && (
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                        <span className="text-muted-foreground shrink-0 min-w-[150px] font-medium">
                          Diễn giải:
                        </span>
                        <span className="text-muted-foreground italic">
                          {transaction.reason}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 pt-2">
                      <span className="text-muted-foreground shrink-0 min-w-[150px] font-medium">
                        Số tiền:
                      </span>
                      <span className={`text-lg font-black ${isIncome ? 'text-emerald-600' : isExpense ? 'text-rose-600' : 'text-blue-600'}`}>
                        {formatNumber(transaction.amount)} VNĐ
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <span className="text-muted-foreground shrink-0 min-w-[150px] font-medium">
                        Bằng chữ:
                      </span>
                      <span className="font-semibold text-foreground italic">
                        {transaction.amountInWords || '—'}
                      </span>
                    </div>

                    {/* Accounting Accounts box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-muted/40 rounded-lg border border-border mt-3">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">Tài khoản hạch toán:</span>
                        <span className="font-semibold text-xs text-foreground">
                          {matchedAccount?.accountName || transaction.account}
                        </span>
                      </div>
                      {isTransfer && transaction.destinationAccount && (
                        <div>
                          <span className="text-[11px] text-muted-foreground block">Tài khoản đích:</span>
                          <span className="font-semibold text-xs text-primary">
                            {matchedDestinationAccount?.accountName || transaction.destinationAccount}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-[11px] text-muted-foreground block">Khoản mục tài chính:</span>
                        <span className="font-semibold text-xs text-foreground">
                          {matchedCategory?.name || transaction.category} {transaction.subCategory ? `• ${transaction.subCategory}` : ''}
                        </span>
                      </div>
                      {transaction.invoiceNumber && (
                        <div>
                          <span className="text-[11px] text-muted-foreground block">Số Hóa đơn VAT:</span>
                          <span className="font-mono font-semibold text-xs text-primary">
                            {transaction.invoiceNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5 Official Signatures */}
                  <div className="grid grid-cols-5 gap-2 text-center mt-10 pt-6 border-t border-border text-xs">
                    <div>
                      <p className="font-bold text-foreground">Giám đốc</p>
                      <p className="text-[10px] text-muted-foreground italic">(Ký, họ tên, đóng dấu)</p>
                      <div className="h-16 flex items-end justify-center">
                        <span className="font-semibold text-foreground">Lê Minh Công</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Kế toán trưởng</p>
                      <p className="text-[10px] text-muted-foreground italic">(Ký, họ tên)</p>
                      <div className="h-16 flex items-end justify-center">
                        <span className="font-semibold text-foreground">Nguyễn Thị Hạnh</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Người lập biểu</p>
                      <p className="text-[10px] text-muted-foreground italic">(Ký, họ tên)</p>
                      <div className="h-16 flex items-end justify-center">
                        <span className="font-semibold text-foreground">{transaction.createdBy || 'Lê Minh Công'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        {isIncome ? 'Người nộp tiền' : isExpense ? 'Người nhận tiền' : 'Người giao dịch'}
                      </p>
                      <p className="text-[10px] text-muted-foreground italic">(Ký, họ tên)</p>
                      <div className="h-16 flex items-end justify-center">
                        <span className="font-semibold text-foreground">
                          {transaction.counterpartyName || '—'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Thủ quỹ</p>
                      <p className="text-[10px] text-muted-foreground italic">(Ký, họ tên)</p>
                      <div className="h-16 flex items-end justify-center">
                        <span className="font-semibold text-foreground">Trần Bích Ngọc</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ATTACHMENTS */}
            {activeTab === 'attachments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Danh sách hóa đơn & Tệp chứng từ ({transaction.attachments?.length || 0})
                  </h4>
                </div>

                {transaction.attachments && transaction.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {transaction.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3.5 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors shadow-xs"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {att.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{att.size}</p>
                          </div>
                        </div>
                        <a
                          href={att.url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                          title="Xem / Tải về"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-card">
                    <Receipt className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs font-medium text-muted-foreground">
                      Chưa có tệp đính kèm hoặc hóa đơn điện tử
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer */}
        <div
          className="bg-card border-t border-border flex flex-col-reverse sm:flex-row items-center shrink-0 w-full gap-2 z-10"
          style={{
            paddingTop: '0.5rem',
            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          }}
        >
          {showDeleteConfirm ? (
            <div className="flex items-center justify-between w-full gap-2 animate-in fade-in duration-200">
              <span className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Xác nhận xóa chứng từ {transaction.code}?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(transaction.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-xs"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted h-8 px-3 text-xs text-muted-foreground hover:text-foreground border border-border cursor-pointer"
              >
                Đóng
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted h-8 px-3 text-xs text-muted-foreground hover:text-foreground border border-border cursor-pointer"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5 shrink-0 text-emerald-500" />
                      Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                      Sao chép
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted h-8 px-3 text-xs text-muted-foreground hover:text-foreground border border-border cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  In phiếu
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(transaction)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 text-xs bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer"
                >
                  <SquarePen className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 text-xs text-rose-600 hover:bg-rose-500/10 border border-rose-200 dark:border-rose-950 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  Xóa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
