import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  GitBranch,
} from 'lucide-react';
import { ApprovalThreshold, MasterStatus, FinanceCategory } from '../../../types/financeMaster';
import { financeCategoryService } from '../../../services/financeMasterService';
import { employeeService } from '../../../services/employeeService';
import { Employee } from '../../../types/employee';

interface ApprovalThresholdFormDrawerProps {
  mode: 'create' | 'edit';
  threshold?: ApprovalThreshold | null;
  allThresholds?: ApprovalThreshold[];
  onClose: () => void;
  onSave: (threshold: ApprovalThreshold) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

export const ApprovalThresholdFormDrawer: React.FC<ApprovalThresholdFormDrawerProps> = ({
  mode,
  threshold,
  allThresholds = [],
  onClose,
  onSave,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('normal');

  // Master Data States
  const [masterCategories, setMasterCategories] = useState<FinanceCategory[]>(() =>
    financeCategoryService.getInitialCategories()
  );
  const [masterEmployees, setMasterEmployees] = useState<Employee[]>(() =>
    employeeService.getInitialEmployees()
  );

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      financeCategoryService.fetchFromSheet().catch(() => financeCategoryService.getInitialCategories()),
      employeeService.fetchFromSheet().catch(() => employeeService.getInitialEmployees()),
    ]).then(([cats, emps]) => {
      if (isMounted) {
        if (cats?.length) setMasterCategories(cats);
        if (emps?.length) setMasterEmployees(emps);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const departmentsList = Array.from(
    new Set(masterEmployees.map((e) => e.department).filter(Boolean))
  );

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [minAmount, setMinAmount] = useState<number>(0);
  const [maxAmount, setMaxAmount] = useState<number>(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [approvalLevels, setApprovalLevels] = useState<number>(1);
  const [approvers, setApprovers] = useState<string[]>(['Trưởng bộ phận']);
  const [department, setDepartment] = useState('Tất cả');
  const [category, setCategory] = useState('Tất cả');
  const [appliesTo, setAppliesTo] = useState<'all' | 'expense' | 'proposal' | 'advance'>('all');
  const [status, setStatus] = useState<MasterStatus>('active');
  const [note, setNote] = useState('');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === 'edit' && threshold) {
      setCode(threshold.code || '');
      setName(threshold.name || '');
      setMinAmount(threshold.minAmount || 0);
      setMaxAmount(threshold.maxAmount || 0);
      setIsUnlimited(threshold.maxAmount === 0);
      setApprovalLevels(threshold.approvalLevels || 1);
      setApprovers(
        threshold.approvers && threshold.approvers.length > 0
          ? threshold.approvers
          : ['Trưởng bộ phận']
      );
      setDepartment(threshold.department || 'Tất cả');
      setCategory(threshold.category || 'Tất cả');
      setAppliesTo(threshold.appliesTo || 'all');
      setStatus(threshold.status || 'active');
      setNote(threshold.note || '');
    } else {
      const count = allThresholds.length + 1;
      setCode(`ND-${String(count).padStart(3, '0')}`);
      setName('');
      setMinAmount(0);
      setMaxAmount(10000000);
      setIsUnlimited(false);
      setApprovalLevels(1);
      setApprovers(['Trưởng bộ phận']);
      setDepartment('Tất cả');
      setCategory('Tất cả');
      setAppliesTo('all');
      setStatus('active');
      setNote('');
    }
  }, [mode, threshold, allThresholds]);

  // Adjust approvers array length when levels count changes
  const handleLevelsChange = (levels: number) => {
    setApprovalLevels(levels);
    const defaults = ['Trưởng bộ phận', 'Kế toán trưởng', 'Giám đốc điều hành', 'Hội đồng quản trị'];
    const current = [...approvers];
    while (current.length < levels) {
      current.push(defaults[current.length] || `Cấp phê duyệt ${current.length + 1}`);
    }
    setApprovers(current.slice(0, levels));
  };

  const handleApproverChange = (idx: number, val: string) => {
    const updated = [...approvers];
    updated[idx] = val;
    setApprovers(updated);
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Vui lòng nhập tên ngưỡng duyệt';
    if (!code.trim()) newErrors.code = 'Vui lòng nhập mã ngưỡng duyệt';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: ApprovalThreshold = {
      id: threshold?.id || `thr-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      minAmount: Number(minAmount) || 0,
      maxAmount: isUnlimited ? 0 : Number(maxAmount) || 0,
      approvalLevels: Number(approvalLevels) || 1,
      approvers: approvers.filter(Boolean),
      department: department.trim() || 'Tất cả',
      category: category.trim() || 'Tất cả',
      appliesTo,
      status,
      note: note.trim(),
      createdBy: threshold?.createdBy || 'Lê Minh Công',
      createdAt: threshold?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(payload);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    code,
    name,
    minAmount,
    maxAmount,
    isUnlimited,
    approvalLevels,
    approvers,
    department,
    category,
    appliesTo,
    status,
    note,
  ]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Main Drawer Container */}
      <form
        onSubmit={handleSubmit}
        className="fixed inset-y-0 right-0 z-50 flex flex-col bg-card border-l border-border shadow-2xl transition-[width] duration-300 ease-in-out"
        style={{
          width: getDrawerWidthStyle(),
          maxWidth: '100vw',
        }}
      >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <GitBranch className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">
                {mode === 'create' ? 'Thêm ngưỡng duyệt chi phí mới' : `Chỉnh sửa: ${threshold?.name}`}
              </h2>
            </div>

            <div className="flex items-center gap-1">
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

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 text-xs">
            {/* 1. Code & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  Mã ngưỡng duyệt <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VD: ND-001"
                  className={`w-full h-9 px-3 font-mono rounded-lg border bg-card text-foreground text-xs uppercase focus:outline-none focus:ring-1 focus:ring-primary ${
                    errors.code ? 'border-rose-500' : 'border-border'
                  }`}
                />
                {errors.code && <p className="text-[11px] text-rose-500">{errors.code}</p>}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-semibold text-foreground">
                  Tên quy tắc ngưỡng duyệt <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Chi tiêu dưới 10 triệu đồng"
                  className={`w-full h-9 px-3 rounded-lg border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                    errors.name ? 'border-rose-500' : 'border-border'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
              </div>
            </div>

            {/* 2. Amount Range */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
              <div className="font-semibold text-foreground">Hạn mức số tiền áp dụng (VNĐ)</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Số tiền tối thiểu từ (&gt;=)</label>
                  <input
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full h-9 px-3 font-mono rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-foreground">Số tiền tối đa đến (&lt;=)</label>
                    <label className="flex items-center gap-1.5 text-[11px] text-primary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUnlimited}
                        onChange={(e) => setIsUnlimited(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>Không giới hạn</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    disabled={isUnlimited}
                    value={isUnlimited ? '' : maxAmount}
                    onChange={(e) => setMaxAmount(Number(e.target.value))}
                    placeholder={isUnlimited ? 'Không giới hạn hạn mức' : 'VD: 50000000'}
                    className={`w-full h-9 px-3 font-mono rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                      isUnlimited ? 'opacity-50 cursor-not-allowed bg-muted' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* 3. Approval Levels & Steps */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground">
                  Số cấp phê duyệt quy định <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleLevelsChange(lvl)}
                      className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                        approvalLevels === lvl
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-card border border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Approvers Input */}
              <div className="space-y-2 pt-2 border-t border-primary/10">
                {Array.from({ length: approvalLevels }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-16 font-semibold text-foreground shrink-0 text-xs">
                      Cấp {idx + 1}:
                    </span>
                    <input
                      type="text"
                      value={approvers[idx] || ''}
                      onChange={(e) => handleApproverChange(idx, e.target.value)}
                      placeholder={`VD: ${
                        idx === 0
                          ? 'Trưởng bộ phận'
                          : idx === 1
                          ? 'Kế toán trưởng'
                          : idx === 2
                          ? 'Giám đốc điều hành'
                          : 'Hội đồng quản trị'
                      }`}
                      className="flex-1 h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Scopes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Nghiệp vụ áp dụng</label>
                <select
                  value={appliesTo}
                  onChange={(e) => setAppliesTo(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">Tất cả nghiệp vụ</option>
                  <option value="proposal">Chỉ Đề xuất chi phí</option>
                  <option value="expense">Chỉ Phiếu chi tiền</option>
                  <option value="advance">Chỉ Tạm ứng / hoàn ứng</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Phòng ban áp dụng</label>
                <input
                  type="text"
                  list="threshold-depts-list"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Tất cả hoặc chọn phòng ban"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <datalist id="threshold-depts-list">
                  <option value="Tất cả">Áp dụng tất cả phòng ban</option>
                  {departmentsList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Khoản mục áp dụng</label>
                <input
                  type="text"
                  list="threshold-cats-list"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Tất cả hoặc chọn khoản mục"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <datalist id="threshold-cats-list">
                  <option value="Tất cả">Áp dụng tất cả khoản mục</option>
                  {masterCategories.map((c) => (
                    <option key={c.id} value={`${c.code} - ${c.name}`}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            {/* 5. Status & Note */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Trạng thái hiệu lực</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MasterStatus)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="active">Đang hiệu lực (Active)</option>
                  <option value="inactive">Tạm ngưng (Inactive)</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-semibold text-foreground">Ghi chú quy trình</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú các trường hợp ngoại lệ hoặc yêu cầu kèm theo..."
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-3">
            <div className="text-[11px] text-muted-foreground hidden sm:block">
              Phím tắt: <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">Ctrl+S</kbd> để lưu
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
              >
                Huỷ
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{mode === 'create' ? 'Tạo ngưỡng duyệt' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </div>
        </form>
    </>
  );
};
