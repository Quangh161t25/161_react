import React, { useMemo } from 'react';
import {
  Landmark,
  Wallet,
  Smartphone,
  DollarSign,
} from 'lucide-react';
import { FinanceAccount } from '../../../types/financeMaster';

interface FinanceAccountStatsTabProps {
  accounts: FinanceAccount[];
  onSelectAccount?: (acc: FinanceAccount) => void;
}

export const FinanceAccountStatsTab: React.FC<FinanceAccountStatsTabProps> = ({
  accounts,
  onSelectAccount,
}) => {
  const formatMoney = (n: number) => (n ? n.toLocaleString('vi-VN') : '0');

  const stats = useMemo(() => {
    const totalCount = accounts.length;
    const totalBalance = accounts.reduce((acc, a) => acc + (Number(a.currentBalance) || 0), 0);
    const totalInitial = accounts.reduce((acc, a) => acc + (Number(a.initialBalance) || 0), 0);

    const bankAccounts = accounts.filter((a) => a.type === 'bank');
    const cashAccounts = accounts.filter((a) => a.type === 'cash');
    const walletAccounts = accounts.filter((a) => a.type === 'wallet');

    const bankBalance = bankAccounts.reduce((acc, a) => acc + (Number(a.currentBalance) || 0), 0);
    const cashBalance = cashAccounts.reduce((acc, a) => acc + (Number(a.currentBalance) || 0), 0);
    const walletBalance = walletAccounts.reduce((acc, a) => acc + (Number(a.currentBalance) || 0), 0);

    const activeCount = accounts.filter((a) => a.status === 'active').length;
    const inactiveCount = accounts.filter((a) => a.status === 'inactive').length;

    return {
      totalCount,
      totalBalance,
      totalInitial,
      bankCount: bankAccounts.length,
      cashCount: cashAccounts.length,
      walletCount: walletAccounts.length,
      bankBalance,
      cashBalance,
      walletBalance,
      activeCount,
      inactiveCount,
      bankAccounts,
      cashAccounts,
      walletAccounts,
    };
  }, [accounts]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* 1. Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Assets */}
        <div className="bg-card border border-primary/20 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Tổng số dư hiện tại
            </span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground font-mono">
              {formatMoney(stats.totalBalance)} <span className="text-xs font-sans text-muted-foreground">VNĐ</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tồn đầu kỳ: {formatMoney(stats.totalInitial)} VNĐ
            </p>
          </div>
        </div>

        {/* Bank Total */}
        <div className="bg-card border border-blue-500/20 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Ngân hàng ({stats.bankCount} TK)
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
              {formatMoney(stats.bankBalance)} <span className="text-xs font-sans text-muted-foreground">VNĐ</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalBalance > 0 ? Math.round((stats.bankBalance / stats.totalBalance) * 100) : 0}% tổng tài sản
            </p>
          </div>
        </div>

        {/* Cash Total */}
        <div className="bg-card border border-emerald-500/20 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Quỹ tiền mặt ({stats.cashCount} Quỹ)
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatMoney(stats.cashBalance)} <span className="text-xs font-sans text-muted-foreground">VNĐ</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalBalance > 0 ? Math.round((stats.cashBalance / stats.totalBalance) * 100) : 0}% tổng tài sản
            </p>
          </div>
        </div>

        {/* Wallet / Other */}
        <div className="bg-card border border-purple-500/20 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Ví điện tử ({stats.walletCount} Ví)
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
              {formatMoney(stats.walletBalance)} <span className="text-xs font-sans text-muted-foreground">VNĐ</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeCount} tài khoản hoạt động
            </p>
          </div>
        </div>
      </div>

      {/* 2. Account Breakdown Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Accounts List */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-sm text-foreground">Tài khoản Ngân hàng</h3>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600">
              {formatMoney(stats.bankBalance)} đ
            </span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {stats.bankAccounts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">Chưa có tài khoản ngân hàng</p>
            ) : (
              stats.bankAccounts.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => onSelectAccount?.(acc)}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/60 transition-colors cursor-pointer text-xs"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">{acc.accountName}</span>
                      {acc.isDefault && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-medium">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground font-mono text-[11px]">
                      {acc.bankName} - {acc.accountNumber || 'Chưa có STK'} ({acc.accountHolder || '—'})
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-foreground">
                      {formatMoney(acc.currentBalance)} đ
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        acc.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {acc.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cash & Wallet Accounts List */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm text-foreground">Quỹ Tiền mặt & Ví điện tử</h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600">
              {formatMoney(stats.cashBalance + stats.walletBalance)} đ
            </span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {[...stats.cashAccounts, ...stats.walletAccounts].length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">Chưa có quỹ tiền mặt hoặc ví</p>
            ) : (
              [...stats.cashAccounts, ...stats.walletAccounts].map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => onSelectAccount?.(acc)}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/60 transition-colors cursor-pointer text-xs"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">{acc.accountName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                        {acc.type === 'cash' ? 'Tiền mặt' : 'Ví điện tử'}
                      </span>
                    </div>
                    <p className="text-muted-foreground font-mono text-[11px]">
                      Mã: {acc.code} • Thủ quỹ: {acc.accountHolder || 'Thủ quỹ công ty'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-foreground">
                      {formatMoney(acc.currentBalance)} đ
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        acc.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {acc.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
