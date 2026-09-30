import React, { useMemo } from 'react';
import {
  Users,
  Building,
  UserCheck,
  Briefcase,
} from 'lucide-react';
import { Counterparty } from '../../../types/financeMaster';

interface CounterpartyStatsTabProps {
  counterparties: Counterparty[];
  onSelectCounterparty?: (c: Counterparty) => void;
}

export const CounterpartyStatsTab: React.FC<CounterpartyStatsTabProps> = ({
  counterparties,
  onSelectCounterparty,
}) => {
  const stats = useMemo(() => {
    const total = counterparties.length;
    const customers = counterparties.filter((c) => c.type === 'customer');
    const vendors = counterparties.filter((c) => c.type === 'vendor');
    const employees = counterparties.filter((c) => c.type === 'employee');
    const partners = counterparties.filter((c) => c.type === 'partner');
    const others = counterparties.filter((c) => c.type === 'other');

    const activeCount = counterparties.filter((c) => c.status === 'active').length;
    const inactiveCount = counterparties.filter((c) => c.status === 'inactive').length;

    return {
      total,
      customerCount: customers.length,
      vendorCount: vendors.length,
      employeeCount: employees.length,
      partnerCount: partners.length,
      otherCount: others.length,
      activeCount,
      inactiveCount,
      customers,
      vendors,
      employees,
      partners,
    };
  }, [counterparties]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* 1. Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng đối tượng</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeCount} đang giao dịch • {stats.inactiveCount} tạm ngưng
            </p>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-card border border-emerald-500/20 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Khách hàng ({stats.customerCount})
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.customerCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.customerCount / stats.total) * 100) : 0}% tổng đối tác
            </p>
          </div>
        </div>

        {/* Vendors */}
        <div className="bg-card border border-amber-500/20 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Nhà cung cấp ({stats.vendorCount})
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.vendorCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.vendorCount / stats.total) * 100) : 0}% tổng đối tác
            </p>
          </div>
        </div>

        {/* Partners & Employees */}
        <div className="bg-card border border-blue-500/20 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Đối tác & Khác ({stats.partnerCount + stats.otherCount + stats.employeeCount})
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.partnerCount + stats.otherCount + stats.employeeCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.employeeCount} nhân viên nội bộ
            </p>
          </div>
        </div>
      </div>

      {/* 2. Breakdown Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vendors */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-sm text-foreground">Danh sách Nhà cung cấp ({stats.vendorCount})</h3>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
              Nhà cung cấp
            </span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {stats.vendors.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">Chưa có nhà cung cấp</p>
            ) : (
              stats.vendors.map((v) => (
                <div
                  key={v.id}
                  onClick={() => onSelectCounterparty?.(v)}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/60 transition-colors cursor-pointer text-xs"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">{v.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">({v.code})</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] truncate">
                      MST: {v.taxCode || '—'} • LH: {v.contactPerson || v.phone || '—'}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                      v.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {v.status === 'active' ? 'Giao dịch' : 'Tạm dừng'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm text-foreground">Danh sách Khách hàng ({stats.customerCount})</h3>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
              Khách hàng
            </span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {stats.customers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">Chưa có khách hàng</p>
            ) : (
              stats.customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectCounterparty?.(c)}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/60 transition-colors cursor-pointer text-xs"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">{c.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">({c.code})</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] truncate">
                      SĐT: {c.phone || '—'} • Đ/C: {c.address || '—'}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                      c.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {c.status === 'active' ? 'Giao dịch' : 'Tạm dừng'}
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
