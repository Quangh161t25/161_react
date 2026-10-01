import React, { useState, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Trash2,
  Landmark,
  Wallet,
  Smartphone,
  Copy,
  Check,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  Clock,
  DollarSign,
  FileText,
  Star,
  Receipt,
} from 'lucide-react';
import { FinanceAccount } from '../../../types/financeMaster';
import { CashTransaction } from '../../../types/cashTransaction';
import { cashTransactionService } from '../../../services/cashTransactionService';

interface FinanceAccountDetailDrawerProps {
  account: FinanceAccount;
  transactions?: CashTransaction[];
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onEdit: (acc: FinanceAccount) => void;
  onDelete: (id: string) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

export const FinanceAccountDetailDrawer: React.FC<FinanceAccountDetailDrawerProps> = ({
  account,
  transactions: propTransactions,
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
  onEdit,
  onDelete,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('normal');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const formatMoney = (n: number) => (n ? n.toLocaleString('vi-VN') : '0');

  const allTransactions = useMemo(() => {
    return propTransactions || cashTransactionService.getInitialTransactions();
  }, [propTransactions]);

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

  const accountTransactions = useMemo(() => {
    return allTransactions.filter(
      (t) =>
        t.status === 'completed' &&
        (isMatchingAccount(t.account, account) ||
          (t.type === 'transfer' && isMatchingAccount(t.destinationAccount, account)))
    );
  }, [allTransactions, account]);

  const liveInflow = useMemo(() => {
    return allTransactions
      .filter(
        (t) =>
          t.status === 'completed' &&
          ((t.type === 'income' && isMatchingAccount(t.account, account)) ||
            (t.type === 'transfer' && isMatchingAccount(t.destinationAccount, account)))
      )
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [allTransactions, account]);

  const liveOutflow = useMemo(() => {
    return allTransactions
      .filter(
        (t) =>
          t.status === 'completed' &&
          ((t.type === 'expense' && isMatchingAccount(t.account, account)) ||
            (t.type === 'transfer' && isMatchingAccount(t.account, account)))
      )
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [allTransactions, account]);

  const liveBalance = (Number(account.initialBalance) || 0) + liveInflow - liveOutflow;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    const text = `TÀI KHOẢN TÀI CHÍNH: ${account.accountName}
Mã: ${account.code}
Loại: ${account.type === 'bank' ? 'Ngân hàng' : account.type === 'cash' ? 'Tiền mặt' : 'Ví điện tử'}
${account.type === 'bank' ? `Ngân hàng: ${account.bankName || '—'}\nSố tài khoản: ${account.accountNumber || '—'}\nChủ tài khoản: ${account.accountHolder || '—'}\nChi nhánh: ${account.branch || '—'}\n` : ''}Số dư hiện tại: ${formatMoney(account.currentBalance)} ${account.currency || 'VND'}
Tồn đầu kỳ: ${formatMoney(account.initialBalance)} ${account.currency || 'VND'}
Trạng thái: ${account.status === 'active' ? 'Đang hoạt động' : 'Tạm khóa'}
Ghi chú: ${account.note || '—'}`;

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const toggleFullscreen = () => {
    if (widthMode === 'fullscreen') {
      setWidthMode(prevWidthMode);
    } else {
      setPrevWidthMode(widthMode);
      setWidthMode('fullscreen');
    }
  };

  const getDrawerWidthStyle = () => {
    switch (widthMode) {
      case 'narrow':
        return 'min(480px, 100vw)';
      case 'normal':
        return 'min(640px, 100vw)';
      case 'wide':
        return 'min(980px, 100vw)';
      case 'fullscreen':
        return '100vw';
      default:
        return 'min(640px, 100vw)';
    }
  };

  const typeConfig = {
    bank: { label: 'Tài khoản Ngân hàng', icon: Landmark, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    cash: { label: 'Quỹ Tiền mặt', icon: Wallet, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    wallet: { label: 'Ví điện tử', icon: Smartphone, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  }[account.type] || { label: account.type, icon: Landmark, color: 'bg-muted text-muted-foreground border-border' };

  const TypeIcon = typeConfig.icon;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Main Drawer Container */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex flex-col bg-card border-l border-border shadow-2xl transition-[width] duration-300 ease-in-out"
        style={{
          width: getDrawerWidthStyle(),
          maxWidth: '100vw',
        }}
      >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                {account.code}
              </span>
              <h2 className="text-sm font-semibold truncate text-foreground">
                {account.accountName}
              </h2>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Width Controls */}
              <div className="hidden md:flex items-center border border-border rounded-lg bg-background p-0.5 mr-1">
                <button
                  type="button"
                  title="Gọn (440px)"
                  onClick={() => setWidthMode('narrow')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'narrow' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Vừa (580px)"
                  onClick={() => setWidthMode('normal')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'normal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Rộng (820px)"
                  onClick={() => setWidthMode('wide')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'wide' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRightOpen className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={widthMode === 'fullscreen' ? 'Thu nhỏ' : 'Toàn màn hình'}
                  onClick={toggleFullscreen}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'fullscreen' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {widthMode === 'fullscreen' ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Prev / Next */}
              <div className="flex items-center border border-border rounded-lg bg-background p-0.5 mr-1">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={currentIndex <= 0}
                  className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Tài khoản trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] px-1 font-mono text-muted-foreground">
                  {currentIndex + 1}/{totalCount}
                </span>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={currentIndex >= totalCount - 1}
                  className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Tài khoản tiếp theo"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Đóng (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {/* Bank Card / Hero Visual */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-primary/95 to-slate-950 p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TypeIcon className="w-5 h-5 text-primary-foreground/80" />
                  <span className="text-xs uppercase tracking-wider font-semibold opacity-90">
                    {typeConfig.label}
                  </span>
                </div>
                {account.isDefault && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    <Star className="w-3 h-3 fill-current" />
                    Mặc định
                  </span>
                )}
              </div>

              <div className="mt-6 space-y-1">
                <div className="text-xs opacity-75 font-mono">Số dư khả dụng thực tế</div>
                <div className="text-3xl font-black tracking-tight font-mono">
                  {formatMoney(liveBalance)}{' '}
                  <span className="text-sm font-sans font-normal opacity-80">
                    {account.currency || 'VND'}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <div>
                  <div className="opacity-70 text-[10px] uppercase tracking-wider">Chủ tài khoản / Thủ quỹ</div>
                  <div className="font-semibold tracking-wide mt-0.5">
                    {account.accountHolder || account.accountName}
                  </div>
                </div>
                {account.accountNumber && (
                  <div className="text-right">
                    <div className="opacity-70 text-[10px] uppercase tracking-wider">Số tài khoản</div>
                    <div className="font-mono font-semibold tracking-widest mt-0.5">
                      {account.accountNumber}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground font-mono">ID: {account.id}</span>
              <button
                type="button"
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAll ? 'Đã sao chép' : 'Sao chép thông tin'}</span>
              </button>
            </div>

            {/* Banking Details if Bank Account */}
            {account.type === 'bank' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Chi tiết Ngân hàng thụ hưởng</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Số tài khoản</span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        {account.accountNumber || '—'}
                      </span>
                    </div>
                    {account.accountNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopy(account.accountNumber || '', 'accNumber')}
                        className="p-1 rounded hover:bg-muted text-muted-foreground"
                        title="Sao chép STK"
                      >
                        {copiedField === 'accNumber' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-card">
                    <span className="text-muted-foreground block mb-0.5">Tên ngân hàng</span>
                    <span className="font-semibold text-foreground">{account.bankName || '—'}</span>
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-card">
                    <span className="text-muted-foreground block mb-0.5">Tên chủ tài khoản</span>
                    <span className="font-semibold text-foreground">{account.accountHolder || '—'}</span>
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-card">
                    <span className="text-muted-foreground block mb-0.5">Chi nhánh</span>
                    <span className="font-semibold text-foreground">{account.branch || '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Balance Overview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Số dư & Biến động dòng tiền</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Tồn đầu kỳ</span>
                  <div className="font-mono font-bold text-foreground text-xs sm:text-sm">
                    {formatMoney(account.initialBalance)} đ
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                  <span className="text-emerald-600 dark:text-emerald-400 block mb-1 font-medium">Tổng thu vào</span>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                    +{formatMoney(liveInflow)} đ
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                  <span className="text-rose-600 dark:text-rose-400 block mb-1 font-medium">Tổng chi ra</span>
                  <div className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs sm:text-sm">
                    -{formatMoney(liveOutflow)} đ
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <span className="text-primary block mb-1 font-medium">Số dư thực tế</span>
                  <div className="font-mono font-bold text-primary text-xs sm:text-sm">
                    {formatMoney(liveBalance)} đ
                  </div>
                </div>
              </div>
            </div>

            {/* Linked Transactions History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-primary/20 pb-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Lịch sử phát sinh chứng từ ({accountTransactions.length})</span>
                </div>
              </div>

              {accountTransactions.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {accountTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between gap-3 text-xs hover:border-primary/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              tx.type === 'income'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : tx.type === 'expense'
                                ? 'bg-rose-500/10 text-rose-600'
                                : 'bg-blue-500/10 text-blue-600'
                            }`}
                          >
                            {tx.type === 'income' ? 'Thu' : tx.type === 'expense' ? 'Chi' : 'Chuyển'}
                          </span>
                          <span className="font-mono font-bold text-foreground truncate">{tx.code}</span>
                          <span className="text-muted-foreground text-[11px]">{tx.transactionDate}</span>
                        </div>
                        <p className="text-muted-foreground truncate mt-0.5">{tx.title}</p>
                      </div>

                      <div
                        className={`font-mono font-bold whitespace-nowrap text-right ${
                          tx.type === 'income' || (tx.type === 'transfer' && isMatchingAccount(tx.destinationAccount, account))
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {tx.type === 'income' || (tx.type === 'transfer' && isMatchingAccount(tx.destinationAccount, account))
                          ? '+'
                          : '-'}
                        {formatMoney(tx.amount)} đ
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-border bg-muted/20 text-center text-xs text-muted-foreground">
                  Chưa có giao dịch thu chi nào phát sinh qua tài khoản này
                </div>
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Ghi chú quản lý</span>
              </div>
              <div className="p-3.5 rounded-lg border border-border bg-card text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {account.note || 'Không có ghi chú bổ sung.'}
              </div>
            </div>

            {/* Metadata & Audit */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Nhật ký khởi tạo</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <span className="text-muted-foreground block mb-1">Ngày tạo</span>
                  <span className="font-medium text-foreground">{account.createdAt || '—'}</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <span className="text-muted-foreground block mb-1">Cập nhật lần cuối</span>
                  <span className="font-medium text-foreground">{account.updatedAt || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-3">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 w-full justify-end animate-in fade-in-0">
                <span className="text-xs text-rose-600 font-medium mr-2">Xác nhận xoá tài khoản này?</span>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted text-foreground"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(account.code || account.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Xoá vĩnh viễn
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xoá</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(account)}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-all"
                  >
                    <SquarePen className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa</span>
                  </button>
                </div>
              </>
            )}
          </div>
      </div>
    </>
  );
};
