import React, { useMemo } from 'react';
import {
  GitBranch,
  ShieldCheck,
  ArrowRight,
  Layers,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { ApprovalThreshold } from '../../../types/financeMaster';

interface ApprovalThresholdStatsTabProps {
  thresholds: ApprovalThreshold[];
  onSelectThreshold?: (t: ApprovalThreshold) => void;
}

export const ApprovalThresholdStatsTab: React.FC<ApprovalThresholdStatsTabProps> = ({
  thresholds,
  onSelectThreshold,
}) => {
  const formatMoney = (n: number) => (n ? n.toLocaleString('vi-VN') : '0');

  const stats = useMemo(() => {
    const total = thresholds.length;
    const activeCount = thresholds.filter((t) => t.status === 'active').length;
    const inactiveCount = thresholds.filter((t) => t.status === 'inactive').length;

    const level1Rules = thresholds.filter((t) => t.approvalLevels === 1);
    const level2Rules = thresholds.filter((t) => t.approvalLevels === 2);
    const level3Rules = thresholds.filter((t) => t.approvalLevels === 3);
    const level4Rules = thresholds.filter((t) => t.approvalLevels >= 4);

    // Sorted by minAmount ascending
    const sortedMatrix = [...thresholds].sort((a, b) => a.minAmount - b.minAmount);

    return {
      total,
      activeCount,
      inactiveCount,
      level1Count: level1Rules.length,
      level2Count: level2Rules.length,
      level3Count: level3Rules.length,
      level4Count: level4Rules.length,
      sortedMatrix,
    };
  }, [thresholds]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* 1. Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Rules */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng quy tắc</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeCount} quy tắc đang hiệu lực
            </p>
          </div>
        </div>

        {/* 1 Level */}
        <div className="bg-card border border-emerald-500/20 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Duyệt 1 cấp ({stats.level1Count})
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.level1Count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Hạn mức chi nhỏ / thông thường</p>
          </div>
        </div>

        {/* 2 Levels */}
        <div className="bg-card border border-blue-500/20 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Duyệt 2 cấp ({stats.level2Count})
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.level2Count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Hạn mức chi vừa (Trưởng BP + KTT)</p>
          </div>
        </div>

        {/* 3+ Levels */}
        <div className="bg-card border border-amber-500/20 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Duyệt 3 cấp trở lên ({stats.level3Count + stats.level4Count})
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.level3Count + stats.level4Count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Hạn mức lớn (Cần Giám đốc / HĐQT)</p>
          </div>
        </div>
      </div>

      {/* 2. Visual Matrix of Approval Tiers */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">
              Ma trận Phân cấp & Hạn mức Phê duyệt Chi phí
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {stats.sortedMatrix.length} mức phân quyền
          </span>
        </div>

        <div className="space-y-3">
          {stats.sortedMatrix.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              Chưa có ngưỡng duyệt nào được định nghĩa
            </p>
          ) : (
            stats.sortedMatrix.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectThreshold?.(item)}
                className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {item.code}
                    </span>
                    <span className="text-sm font-bold text-foreground">{item.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        item.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {item.status === 'active' ? 'Hiệu lực' : 'Tạm dừng'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-primary bg-background px-3 py-1 rounded-lg border border-border">
                    <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>
                      {formatMoney(item.minAmount)} đ →{' '}
                      {item.maxAmount === 0 ? 'Không giới hạn' : `${formatMoney(item.maxAmount)} đ`}
                    </span>
                  </div>
                </div>

                {/* Flow Steps */}
                <div className="pt-2 border-t border-border flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-muted-foreground font-semibold shrink-0">
                    Quy trình {item.approvalLevels} cấp duyệt:
                  </span>
                  {item.approvers && item.approvers.length > 0 ? (
                    item.approvers.map((app, stepIdx) => (
                      <React.Fragment key={stepIdx}>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border shadow-xs">
                          <span className="w-4 h-4 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center">
                            {stepIdx + 1}
                          </span>
                          <span className="font-medium text-foreground">{app}</span>
                        </div>
                        {stepIdx < item.approvers.length - 1 && (
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic">Chưa cấu hình người duyệt</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
