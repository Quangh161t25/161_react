import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  Landmark,
} from 'lucide-react';
import { CashTransaction, CashAccountBalance } from '../../types/cashTransaction';
import { CASH_ACCOUNTS } from '../../data/cashTransactions';
import { financeAccountService } from '../../services/financeMasterService';

interface CashTransactionStatsTabProps {
  transactions: CashTransaction[];
}

export const CashTransactionStatsTab: React.FC<CashTransactionStatsTabProps> = ({
  transactions,
}) => {
  const formatNumber = (num: number) => (num ? num.toLocaleString('vi-VN') : '0');

  // 1. Totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalIncome - totalExpense;

  const incomeCount = transactions.filter((t) => t.type === 'income').length;
  const expenseCount = transactions.filter((t) => t.type === 'expense').length;

  // 2. Account balances calculation (integrated with Master accounts + flexible matching)
  const masterAccounts = useMemo(() => financeAccountService.getInitialAccounts(), []);

  const baseAccounts: CashAccountBalance[] = useMemo(() => {
    const active = masterAccounts.filter((a) => a.status === 'active');
    if (active.length > 0) {
      return active.map((acc) => ({
        accountName: acc.accountName,
        accountNumber: acc.accountNumber,
        bankName: acc.bankName,
        type: acc.type,
        initialBalance: acc.initialBalance ?? 0,
        totalIncome: 0,
        totalExpense: 0,
        currentBalance: acc.currentBalance ?? acc.initialBalance ?? 0,
      }));
    }
    return CASH_ACCOUNTS;
  }, [masterAccounts]);

  const isMatchingAccount = (
    txAccount: string | undefined,
    accName: string,
    accNumber?: string
  ) => {
    if (!txAccount) return false;
    const tx = txAccount.trim().toLowerCase();
    const name = accName.trim().toLowerCase();
    const num = accNumber ? accNumber.trim().toLowerCase() : '';
    const full = num ? `${name} (${num})` : name;

    return (
      tx === name ||
      tx === full ||
      (num && tx.includes(num)) ||
      tx.includes(name) ||
      name.includes(tx)
    );
  };

  const accountsData: CashAccountBalance[] = useMemo(() => {
    return baseAccounts.map((acc: CashAccountBalance) => {
      const inflow = transactions
        .filter(
          (t) =>
            t.status === 'completed' &&
            ((t.type === 'income' && isMatchingAccount(t.account, acc.accountName, acc.accountNumber)) ||
              (t.type === 'transfer' && isMatchingAccount(t.destinationAccount, acc.accountName, acc.accountNumber)))
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const outflow = transactions
        .filter(
          (t) =>
            t.status === 'completed' &&
            ((t.type === 'expense' && isMatchingAccount(t.account, acc.accountName, acc.accountNumber)) ||
              (t.type === 'transfer' && isMatchingAccount(t.account, acc.accountName, acc.accountNumber)))
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const currentBalance = acc.initialBalance + inflow - outflow;

      return {
        ...acc,
        totalIncome: inflow,
        totalExpense: outflow,
        currentBalance,
      };
    });
  }, [baseAccounts, transactions]);

  const totalLiquidAssets = accountsData.reduce((sum, acc) => sum + acc.currentBalance, 0);

  // 3. Category Breakdowns
  const expenseByCategory: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense' && t.status === 'completed')
    .forEach((t) => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

  const topExpenseCategories = Object.entries(expenseByCategory)
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      pct: totalExpense > 0 ? (amt / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const incomeByCategory: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'income' && t.status === 'completed')
    .forEach((t) => {
      incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
    });

  const topIncomeCategories = Object.entries(incomeByCategory)
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      pct: totalIncome > 0 ? (amt / totalIncome) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 4. Department Breakdown
  const expenseByDept: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense' && t.status === 'completed')
    .forEach((t) => {
      const dept = t.department || 'Khác';
      expenseByDept[dept] = (expenseByDept[dept] || 0) + t.amount;
    });

  const deptBreakdown = Object.entries(expenseByDept)
    .map(([dept, amt]) => ({
      department: dept,
      amount: amt,
      pct: totalExpense > 0 ? (amt / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6 p-4 md:p-6 overflow-y-auto">
      {/* 4 TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tổng Thu (Inflow)</p>
            <h3 className="text-2xl font-extrabold text-foreground mt-0.5">
              +{formatNumber(totalIncome)} <span className="text-xs font-semibold">đ</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              <strong className="text-emerald-600">{incomeCount}</strong> phiếu thu
            </p>
          </div>
        </div>

        {/* Total Outflow */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tổng Chi (Outflow)</p>
            <h3 className="text-2xl font-extrabold text-foreground mt-0.5">
              -{formatNumber(totalExpense)} <span className="text-xs font-semibold">đ</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              <strong className="text-rose-600">{expenseCount}</strong> phiếu chi
            </p>
          </div>
        </div>

        {/* Net Cashflow */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              netCashFlow >= 0
                ? 'bg-primary/10 text-primary'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            {netCashFlow >= 0 ? (
              <TrendingUp className="w-6 h-6" />
            ) : (
              <TrendingDown className="w-6 h-6" />
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Dòng tiền Ròng (Net)</p>
            <h3
              className={`text-2xl font-extrabold mt-0.5 ${
                netCashFlow >= 0
                  ? 'text-foreground'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {netCashFlow >= 0 ? '+' : ''}
              {formatNumber(netCashFlow)} <span className="text-xs font-semibold">đ</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Thu ròng trong kỳ</p>
          </div>
        </div>

        {/* Total Liquidity */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tổng số dư quỹ & NH</p>
            <h3 className="text-2xl font-extrabold text-foreground mt-0.5">
              {formatNumber(totalLiquidAssets)} <span className="text-xs font-semibold">đ</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Qua <strong className="text-foreground">{accountsData.length}</strong> tài khoản
            </p>
          </div>
        </div>
      </div>

      {/* ACCOUNT BALANCES BREAKDOWN */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              Số dư các quỹ tiền mặt & Tài khoản ngân hàng
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Theo dõi tồn đầu kỳ, thu trong kỳ, chi trong kỳ và số dư khả dụng thực tế
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {accountsData.map((acc) => {
            const pctOfTotal =
              totalLiquidAssets > 0
                ? (acc.currentBalance / totalLiquidAssets) * 100
                : 0;
            return (
              <div
                key={acc.accountName}
                className="p-4 bg-muted/20 rounded-xl border border-border hover:border-primary/50 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1.5 ${
                        acc.type === 'cash'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : acc.type === 'wallet'
                          ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}
                    >
                      {acc.type === 'cash'
                        ? 'Tiền mặt'
                        : acc.type === 'wallet'
                        ? 'Ví điện tử'
                        : 'Ngân hàng'}
                    </span>
                    <h5 className="text-xs font-bold text-foreground line-clamp-1">
                      {acc.accountName}
                    </h5>
                    {acc.accountNumber && (
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        STK: {acc.accountNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Số dư khả dụng:</span>
                  <span className="text-base font-black text-foreground">
                    {formatNumber(acc.currentBalance)} đ
                  </span>
                </div>

                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(pctOfTotal, 5), 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Chiếm {pctOfTotal.toFixed(1)}% tổng quỹ</span>
                  <span>Thu: +{formatNumber(acc.totalIncome)} đ</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-COLUMN STRUCTURE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Expense Categories */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-500" />
              Cơ cấu Khoản mục Chi tiêu
            </h4>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {topExpenseCategories.length} khoản mục
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {topExpenseCategories.slice(0, 6).map((item, idx) => (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    {idx + 1}. {item.category}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    <strong className="text-foreground">{formatNumber(item.amount)} đ</strong> (
                    {item.pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Income Sources */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-500" />
              Nguồn Thu Chủ Yếu
            </h4>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {topIncomeCategories.length} nguồn thu
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {topIncomeCategories.slice(0, 6).map((item, idx) => (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    {idx + 1}. {item.category}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    <strong className="text-foreground">{formatNumber(item.amount)} đ</strong> (
                    {item.pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Phân bổ Chi phí theo Phòng Ban
            </h4>
            <span className="text-xs text-muted-foreground">{deptBreakdown.length} đơn vị</span>
          </div>

          <div className="space-y-3 pt-2">
            {deptBreakdown.map((item, idx) => (
              <div key={item.department} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    {idx + 1}. {item.department}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    <strong className="text-foreground">{formatNumber(item.amount)} đ</strong> (
                    {item.pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
