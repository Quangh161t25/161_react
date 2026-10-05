import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  Landmark,
  Wallet,
  Smartphone,
} from 'lucide-react';
import { FinanceAccount, AccountType, MasterStatus } from '../../../types/financeMaster';

interface FinanceAccountFormDrawerProps {
  mode: 'create' | 'edit';
  account?: FinanceAccount | null;
  allAccounts?: FinanceAccount[];
  onClose: () => void;
  onSave: (account: FinanceAccount) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

export const FinanceAccountFormDrawer: React.FC<FinanceAccountFormDrawerProps> = ({
  mode,
  account,
  allAccounts = [],
  onClose,
  onSave,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('normal');

  // Form Fields
  const [code, setCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [branch, setBranch] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [currency, setCurrency] = useState('VND');
  const [status, setStatus] = useState<MasterStatus>('active');
  const [isDefault, setIsDefault] = useState(false);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isInitializedRef = useRef(false);
  const prevEditIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const currentEditId = mode === 'edit' && account ? (account.id || account.code) : null;
    const justMounted = !isInitializedRef.current;
    const editTargetChanged = currentEditId !== prevEditIdRef.current;

    // Only initialize when drawer is first mounted OR when switching editing account
    if (!justMounted && !editTargetChanged) {
      return;
    }

    isInitializedRef.current = true;
    prevEditIdRef.current = currentEditId;

    if (mode === 'edit' && account) {
      setCode(account.code || '');
      setAccountName(account.accountName || '');
      setType(account.type || 'bank');
      setAccountNumber(account.accountNumber || '');
      setBankName(account.bankName || '');
      setBranch(account.branch || '');
      setAccountHolder(account.accountHolder || '');
      setInitialBalance(account.initialBalance || 0);
      setCurrentBalance(account.currentBalance || 0);
      setCurrency(account.currency || 'VND');
      setStatus(account.status || 'active');
      setIsDefault(!!account.isDefault);
      setNote(account.note || '');
    } else {
      const prefix = type === 'bank' ? 'NH' : type === 'cash' ? 'TM' : 'VI';
      const count = allAccounts.filter((a) => a.type === type).length + 1;
      setCode(`TK-${prefix}-${String(count).padStart(2, '0')}`);
      setAccountName('');
      setAccountNumber('');
      setBankName('');
      setBranch('');
      setAccountHolder('');
      setInitialBalance(0);
      setCurrentBalance(0);
      setCurrency('VND');
      setStatus('active');
      setIsDefault(allAccounts.length === 0);
      setNote('');
    }
  }, [mode, account, allAccounts]);

  const handleTypeChange = (newType: AccountType) => {
    setType(newType);
    if (mode === 'create') {
      const prefix = newType === 'bank' ? 'NH' : newType === 'cash' ? 'TM' : 'VI';
      const count = allAccounts.filter((a) => a.type === newType).length + 1;
      setCode(`TK-${prefix}-${String(count).padStart(2, '0')}`);
    }
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

    if (!accountName.trim()) newErrors.accountName = 'Vui lòng nhập tên tài khoản';
    if (!code.trim()) newErrors.code = 'Vui lòng nhập mã tài khoản';
    if (type === 'bank' && !accountNumber.trim()) {
      newErrors.accountNumber = 'Vui lòng nhập số tài khoản ngân hàng';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: FinanceAccount = {
      id: account?.id || `acc-${Date.now()}`,
      code: code.trim().toUpperCase(),
      accountName: accountName.trim(),
      type,
      accountNumber: accountNumber.trim(),
      bankName: bankName.trim(),
      branch: branch.trim(),
      accountHolder: accountHolder.trim().toUpperCase(),
      initialBalance: Number(initialBalance) || 0,
      currentBalance: mode === 'create' ? Number(initialBalance) || 0 : Number(currentBalance) || 0,
      currency: currency || 'VND',
      status,
      isDefault,
      note: note.trim(),
      createdBy: account?.createdBy || 'Lê Minh Công',
      createdAt: account?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(payload);
    onClose();
  };

  // Keyboard shortcut Ctrl+S
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
    accountName,
    type,
    accountNumber,
    bankName,
    branch,
    accountHolder,
    initialBalance,
    currentBalance,
    currency,
    status,
    isDefault,
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
                <Landmark className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">
                {mode === 'create' ? 'Thêm tài khoản tài chính mới' : `Chỉnh sửa: ${account?.accountName}`}
              </h2>
            </div>

            <div className="flex items-center gap-1">
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
            {/* 1. Account Type Picker */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Loại tài khoản <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('bank')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    type === 'bank'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-600 font-semibold shadow-sm'
                      : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <Landmark className="w-5 h-5 mb-1" />
                  <span>Tài khoản Ngân hàng</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('cash')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    type === 'cash'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 font-semibold shadow-sm'
                      : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <Wallet className="w-5 h-5 mb-1" />
                  <span>Quỹ Tiền mặt</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('wallet')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    type === 'wallet'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-600 font-semibold shadow-sm'
                      : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mb-1" />
                  <span>Ví điện tử / Khác</span>
                </button>
              </div>
            </div>

            {/* 2. Code & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  Mã tài khoản <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VD: TK-NH-01"
                  className={`w-full h-9 px-3 font-mono rounded-lg border bg-card text-foreground text-xs uppercase focus:outline-none focus:ring-1 focus:ring-primary ${
                    errors.code ? 'border-rose-500' : 'border-border'
                  }`}
                />
                {errors.code && <p className="text-[11px] text-rose-500">{errors.code}</p>}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-semibold text-foreground">
                  Tên tài khoản / Tên quỹ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="VD: MB Bank - Tài khoản chính công ty"
                  className={`w-full h-9 px-3 rounded-lg border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                    errors.accountName ? 'border-rose-500' : 'border-border'
                  }`}
                />
                {errors.accountName && <p className="text-[11px] text-rose-500">{errors.accountName}</p>}
              </div>
            </div>

            {/* 3. Bank Specific Fields */}
            {type === 'bank' && (
              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-3">
                <div className="font-semibold text-blue-600 dark:text-blue-400">
                  Thông tin Ngân hàng
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Tên ngân hàng</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="VD: Vietcombank, MB Bank, Techcombank..."
                      className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">
                      Số tài khoản <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="VD: 0399123456"
                      className={`w-full h-9 px-3 font-mono rounded-lg border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                        errors.accountNumber ? 'border-rose-500' : 'border-border'
                      }`}
                    />
                    {errors.accountNumber && <p className="text-[11px] text-rose-500">{errors.accountNumber}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Chủ tài khoản</label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                      placeholder="VD: CÔNG TY TNHH H161"
                      className="w-full h-9 px-3 uppercase rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Chi nhánh</label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="VD: CN Hà Nội, CN Ba Đình..."
                      className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. Cash / Wallet Custodian */}
            {type !== 'bank' && (
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Người quản lý / Thủ quỹ</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="VD: Lê Minh Công (Thủ quỹ)"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* 5. Balances & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Số dư ban đầu (Tồn đầu)</label>
                <input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(Number(e.target.value))}
                  placeholder="0"
                  className="w-full h-9 px-3 font-mono rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {mode === 'edit' && (
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Số dư hiện tại</label>
                  <input
                    type="number"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(Number(e.target.value))}
                    placeholder="0"
                    className="w-full h-9 px-3 font-mono font-bold rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Loại tiền tệ</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="VND">VND (Việt Nam Đồng)</option>
                  <option value="USD">USD (Đô la Mỹ)</option>
                </select>
              </div>
            </div>

            {/* 6. Options: Default & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-border bg-muted/20">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-foreground block">Tài khoản mặc định</span>
                  <span className="text-[11px] text-muted-foreground">Tự động chọn khi lập phiếu thu / chi</span>
                </div>
              </label>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Trạng thái</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MasterStatus)}
                  className="w-full h-8 px-2 rounded-md border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="active">Đang hoạt động (Active)</option>
                  <option value="inactive">Tạm khóa / Ngưng (Inactive)</option>
                </select>
              </div>
            </div>

            {/* 7. Note */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Ghi chú quản lý</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Ghi chú về hạn mức giao dịch, mục đích hoặc lưu ý đặc biệt..."
                className="w-full p-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
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
                <span>{mode === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </div>
        </form>
    </>
  );
};
