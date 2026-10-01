import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  Users,
  Building,
  UserCheck,
  Briefcase,
  User,
} from 'lucide-react';
import { Counterparty, CounterpartyType, MasterStatus } from '../../../types/financeMaster';

interface CounterpartyFormDrawerProps {
  mode: 'create' | 'edit';
  counterparty?: Counterparty | null;
  allCounterparties?: Counterparty[];
  onClose: () => void;
  onSave: (counterparty: Counterparty) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

export const CounterpartyFormDrawer: React.FC<CounterpartyFormDrawerProps> = ({
  mode,
  counterparty,
  allCounterparties = [],
  onClose,
  onSave,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('normal');

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<CounterpartyType>('customer');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPersonPhone, setContactPersonPhone] = useState('');
  const [status, setStatus] = useState<MasterStatus>('active');
  const [note, setNote] = useState('');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === 'edit' && counterparty) {
      setCode(counterparty.code || '');
      setName(counterparty.name || '');
      setType(counterparty.type || 'customer');
      setPhone(counterparty.phone || '');
      setEmail(counterparty.email || '');
      setAddress(counterparty.address || '');
      setTaxCode(counterparty.taxCode || '');
      setBankAccount(counterparty.bankAccount || '');
      setBankName(counterparty.bankName || '');
      setBankBranch(counterparty.bankBranch || '');
      setContactPerson(counterparty.contactPerson || '');
      setContactPersonPhone(counterparty.contactPersonPhone || '');
      setStatus(counterparty.status || 'active');
      setNote(counterparty.note || '');
    } else {
      const prefix =
        type === 'customer'
          ? 'KH'
          : type === 'vendor'
          ? 'NCC'
          : type === 'employee'
          ? 'NV'
          : type === 'partner'
          ? 'DT'
          : 'OTHER';
      const count = allCounterparties.filter((c) => c.type === type).length + 1;
      setCode(`DT-${prefix}-${String(count).padStart(2, '0')}`);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setTaxCode('');
      setBankAccount('');
      setBankName('');
      setBankBranch('');
      setContactPerson('');
      setContactPersonPhone('');
      setStatus('active');
      setNote('');
    }
  }, [mode, counterparty, allCounterparties]);

  const handleTypeChange = (newType: CounterpartyType) => {
    setType(newType);
    if (mode === 'create') {
      const prefix =
        newType === 'customer'
          ? 'KH'
          : newType === 'vendor'
          ? 'NCC'
          : newType === 'employee'
          ? 'NV'
          : newType === 'partner'
          ? 'DT'
          : 'OTHER';
      const count = allCounterparties.filter((c) => c.type === newType).length + 1;
      setCode(`DT-${prefix}-${String(count).padStart(2, '0')}`);
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

    if (!name.trim()) newErrors.name = 'Vui lòng nhập tên đối tượng';
    if (!code.trim()) newErrors.code = 'Vui lòng nhập mã đối tượng';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: Counterparty = {
      id: counterparty?.id || `cp-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      type,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      taxCode: taxCode.trim(),
      bankAccount: bankAccount.trim(),
      bankName: bankName.trim(),
      bankBranch: bankBranch.trim(),
      contactPerson: contactPerson.trim(),
      contactPersonPhone: contactPersonPhone.trim(),
      status,
      note: note.trim(),
      createdBy: counterparty?.createdBy || 'Lê Minh Công',
      createdAt: counterparty?.createdAt || new Date().toISOString().split('T')[0],
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
    type,
    phone,
    email,
    address,
    taxCode,
    bankAccount,
    bankName,
    bankBranch,
    contactPerson,
    contactPersonPhone,
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
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">
                {mode === 'create' ? 'Thêm đối tượng thu chi mới' : `Chỉnh sửa: ${counterparty?.name}`}
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
            {/* 1. Type Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">
                Phân loại đối tượng <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('customer')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    type === 'customer'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 font-semibold shadow-sm'
                      : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Khách hàng</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('vendor')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    type === 'vendor'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 font-semibold shadow-sm'
                      : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Nhà cung cấp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('employee')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    type === 'employee'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-600 font-semibold shadow-sm'
                      : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Nhân viên</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('partner')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    type === 'partner'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-600 font-semibold shadow-sm'
                      : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Đối tác</span>
                </button>
              </div>
            </div>

            {/* 2. Code & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  Mã đối tượng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VD: DT-NCC-01"
                  className={`w-full h-9 px-3 font-mono rounded-lg border bg-card text-foreground text-xs uppercase focus:outline-none focus:ring-1 focus:ring-primary ${
                    errors.code ? 'border-rose-500' : 'border-border'
                  }`}
                />
                {errors.code && <p className="text-[11px] text-rose-500">{errors.code}</p>}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-semibold text-foreground">
                  Tên công ty / Tên đối tượng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Công ty TNHH Thiết bị Văn phòng ABC"
                  className={`w-full h-9 px-3 rounded-lg border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                    errors.name ? 'border-rose-500' : 'border-border'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
              </div>
            </div>

            {/* 3. Phone & Email & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Số điện thoại</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="VD: 0912 345 678"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="VD: contact@abc.com"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-semibold text-foreground">Địa chỉ trụ sở / Giao dịch</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="VD: Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* 4. Tax & Bank Info */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
              <div className="font-semibold text-foreground">Thông tin Hoá đơn & Ngân hàng</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Mã số thuế (MST)</label>
                  <input
                    type="text"
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    placeholder="VD: 0101234567"
                    className="w-full h-9 px-3 font-mono rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Số tài khoản ngân hàng</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="VD: 190312345678"
                    className="w-full h-9 px-3 font-mono rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Tên ngân hàng</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="VD: Techcombank, Vietcombank..."
                    className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Chi nhánh ngân hàng</label>
                  <input
                    type="text"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    placeholder="VD: CN Sài Gòn, CN Thăng Long..."
                    className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* 5. Contact Person */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Người liên hệ phụ trách</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="VD: Nguyễn Văn A (Kế toán)"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">SĐT người liên hệ</label>
                <input
                  type="text"
                  value={contactPersonPhone}
                  onChange={(e) => setContactPersonPhone(e.target.value)}
                  placeholder="VD: 0988 123 456"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* 6. Status & Note */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Trạng thái giao dịch</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MasterStatus)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="active">Đang giao dịch (Active)</option>
                  <option value="inactive">Tạm ngưng giao dịch (Inactive)</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-semibold text-foreground">Ghi chú</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú điều khoản thanh toán, chiết khấu..."
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
                <span>{mode === 'create' ? 'Tạo đối tượng' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </div>
        </form>
    </>
  );
};
