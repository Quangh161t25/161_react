import React from 'react';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Layers,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { PasswordItem } from '../../types/password';
import { PASSWORD_CATEGORIES } from '../../data/passwords';

interface PasswordStatsTabProps {
  passwords: PasswordItem[];
  onSelectPassword: (item: PasswordItem) => void;
}

export const PasswordStatsTab: React.FC<PasswordStatsTabProps> = ({
  passwords,
  onSelectPassword,
}) => {
  const total = passwords.length;
  const strongCount = passwords.filter((p) => (p.securityScore || 70) >= 80).length;
  const mediumCount = passwords.filter(
    (p) => (p.securityScore || 70) >= 60 && (p.securityScore || 70) < 80
  ).length;
  const weakCount = passwords.filter((p) => (p.securityScore || 70) < 60).length;
  const twoFactorCount = passwords.filter((p) => !!p.pinOr2FA).length;

  const weakPasswords = passwords.filter((p) => (p.securityScore || 70) < 60);

  // Category breakdown
  const categoryStats = PASSWORD_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
    const count = passwords.filter((p) => p.category === cat.id).length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      id: cat.id,
      name: cat.name,
      count,
      pct,
    };
  });

  return (
    <div className="space-y-6 p-4 md:p-6 overflow-y-auto">
      {/* 4 Quick Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tổng tài khoản lưu trữ</p>
            <h3 className="text-2xl font-extrabold text-foreground mt-0.5">{total}</h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Độ mạnh cao (&ge;80%)</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-extrabold text-foreground">{strongCount}</h3>
              <span className="text-xs font-medium text-emerald-600">
                {total > 0 ? Math.round((strongCount / total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Cần đổi mật khẩu (&lt;60%)</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-extrabold text-rose-600">{weakCount}</h3>
              <span className="text-xs font-medium text-rose-600">
                {total > 0 ? Math.round((weakCount / total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Bảo mật 2 lớp (2FA)</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-extrabold text-foreground">{twoFactorCount}</h3>
              <span className="text-xs font-medium text-blue-600">
                {total > 0 ? Math.round((twoFactorCount / total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Charts / Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Phân bố tài khoản theo Danh mục
            </h4>
            <span className="text-xs text-muted-foreground">{categoryStats.length} nhóm</span>
          </div>

          <div className="space-y-3 pt-2">
            {categoryStats.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{item.name}</span>
                  <span className="text-muted-foreground font-medium">
                    <strong className="text-foreground">{item.count}</strong> ({item.pct}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Health Analysis */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Sức khỏe Bảo mật Mật khẩu
            </h4>
            <span className="text-xs font-semibold text-emerald-600">
              {total > 0 ? Math.round((strongCount / total) * 100) : 100}% an toàn
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl border border-border bg-emerald-500/5 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
                <span>Rất mạnh & An toàn (&ge;80 điểm)</span>
                <span>{strongCount} tài khoản</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${total > 0 ? (strongCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-amber-500/5 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-600">
                <span>Mức trung bình (60 - 79 điểm)</span>
                <span>{mediumCount} tài khoản</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${total > 0 ? (mediumCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-rose-500/5 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-600">
                <span>Yếu / Cần đổi mật khẩu (&lt;60 điểm)</span>
                <span>{weakCount} tài khoản</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${total > 0 ? (weakCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weak Passwords Warning List */}
      {weakPasswords.length > 0 && (
        <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Cảnh báo: Có {weakPasswords.length} tài khoản có độ bảo mật thấp cần cập nhật</span>
          </div>

          <div className="divide-y divide-border/60">
            {weakPasswords.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectPassword(item)}
                className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-rose-500/10 px-2 rounded-lg transition-colors"
              >
                <div>
                  <h5 className="text-xs font-bold text-foreground">{item.title}</h5>
                  <span className="text-[11px] text-muted-foreground font-mono">{item.username}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-rose-600 tabular-nums">
                    {item.securityScore || 40}/100 điểm
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
