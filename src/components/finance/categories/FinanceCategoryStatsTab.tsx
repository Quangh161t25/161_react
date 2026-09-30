import React, { useMemo } from 'react';
import {
  FolderTree,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { FinanceCategory } from '../../../types/financeMaster';

interface FinanceCategoryStatsTabProps {
  categories: FinanceCategory[];
  onSelectCategory?: (category: FinanceCategory) => void;
}

export const FinanceCategoryStatsTab: React.FC<FinanceCategoryStatsTabProps> = ({
  categories,
  onSelectCategory,
}) => {
  const stats = useMemo(() => {
    const total = categories.length;
    const incomeCats = categories.filter((c) => c.type === 'income');
    const expenseCats = categories.filter((c) => c.type === 'expense');
    const transferCats = categories.filter((c) => c.type === 'transfer');

    const activeCount = categories.filter((c) => c.status === 'active').length;
    const inactiveCount = categories.filter((c) => c.status === 'inactive').length;

    const level1Count = categories.filter((c) => c.level === 1).length;
    const level2Count = categories.filter((c) => c.level === 2).length;

    return {
      total,
      incomeCount: incomeCats.length,
      expenseCount: expenseCats.length,
      transferCount: transferCats.length,
      activeCount,
      inactiveCount,
      level1Count,
      level2Count,
      incomeCats,
      expenseCats,
      transferCats,
    };
  }, [categories]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* 1. Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng khoản mục</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.level1Count} nhóm Cấp 1 • {stats.level2Count} mục Cấp 2
            </p>
          </div>
        </div>

        {/* Income */}
        <div className="bg-card border border-emerald-500/20 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Danh mục Thu
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.incomeCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.incomeCount / stats.total) * 100) : 0}% tổng danh mục
            </p>
          </div>
        </div>

        {/* Expense */}
        <div className="bg-card border border-rose-500/20 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Danh mục Chi
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {stats.expenseCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.expenseCount / stats.total) * 100) : 0}% tổng danh mục
            </p>
          </div>
        </div>

        {/* Active Ratio */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Đang hoạt động</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">
              {stats.activeCount} <span className="text-xs font-normal text-muted-foreground">/ {stats.total}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.inactiveCount} mục tạm ngừng sử dụng
            </p>
          </div>
        </div>
      </div>

      {/* 2. Visual Distribution & Hierarchy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income Tree */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="font-semibold text-sm text-foreground">Khoản mục Thu ({stats.incomeCount})</h3>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Thu nhập
            </span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {stats.incomeCats.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">Chưa có khoản mục thu</p>
            ) : (
              stats.incomeCats.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => onSelectCategory?.(cat)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    cat.level === 1
                      ? 'bg-emerald-500/5 border-emerald-500/20 font-semibold text-foreground hover:bg-emerald-500/10'
                      : 'ml-4 bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {cat.level === 1 ? (
                      <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0" />
                    )}
                    <span>{cat.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">({cat.code})</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      cat.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {cat.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expense Tree */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h3 className="font-semibold text-sm text-foreground">Khoản mục Chi ({stats.expenseCount})</h3>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
              Chi phí
            </span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {stats.expenseCats.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">Chưa có khoản mục chi</p>
            ) : (
              stats.expenseCats.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => onSelectCategory?.(cat)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    cat.level === 1
                      ? 'bg-rose-500/5 border-rose-500/20 font-semibold text-foreground hover:bg-rose-500/10'
                      : 'ml-4 bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {cat.level === 1 ? (
                      <Layers className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0" />
                    )}
                    <span>{cat.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">({cat.code})</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      cat.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {cat.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transfer & System Info */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h3 className="font-semibold text-sm text-foreground">Luân chuyển & Nội bộ ({stats.transferCount})</h3>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              Luân chuyển
            </span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {stats.transferCats.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">Chưa có mục luân chuyển</p>
            ) : (
              stats.transferCats.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => onSelectCategory?.(cat)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    cat.level === 1
                      ? 'bg-blue-500/5 border-blue-500/20 font-semibold text-foreground hover:bg-blue-500/10'
                      : 'ml-4 bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {cat.level === 1 ? (
                      <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0" />
                    )}
                    <span>{cat.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">({cat.code})</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      cat.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {cat.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
