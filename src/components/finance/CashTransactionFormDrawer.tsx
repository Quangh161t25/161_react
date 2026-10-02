import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  User,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  Sparkles,
  Calendar,
  Layers,
  Building2,
  Receipt,
  Phone,
  MapPin,
  FileText,
  ChevronDown,
  Clock,
  Wallet,
  Users,
  Plus,
} from 'lucide-react';
import {
  CashTransaction,
  TransactionType,
  PaymentMethod,
  TransactionStatus,
} from '../../types/cashTransaction';
import {
  FinanceCategory,
  FinanceAccount,
  Counterparty,
  CounterpartyType,
} from '../../types/financeMaster';
import { TimePickerInput } from '../common/TimePickerInput';
import { Employee } from '../../types/employee';
import {
  financeCategoryService,
  financeAccountService,
  counterpartyService,
} from '../../services/financeMasterService';
import { employeeService } from '../../services/employeeService';
import { cashTransactionService } from '../../services/cashTransactionService';
import {
  CASH_ACCOUNTS,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  TRANSFER_CATEGORIES,
} from '../../data/cashTransactions';
import { vndNumberToWords } from '../../utils/numberToWords';

interface AvailableAccountItem {
  id: string;
  code: string;
  name: string;
  rawName: string;
  balance: number;
  bankName?: string;
  type?: string;
  isDefault?: boolean;
}

interface CashTransactionFormDrawerProps {
  isOpen: boolean;
  initialType?: TransactionType;
  transactionToEdit?: CashTransaction | null;
  defaultDate?: string;
  onClose: () => void;
  onSave: (tx: Partial<CashTransaction>) => Promise<void> | void;
  onNavigateToModule?: (path: string) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

export const CashTransactionFormDrawer: React.FC<CashTransactionFormDrawerProps> = ({
  isOpen,
  initialType = 'expense',
  transactionToEdit,
  defaultDate,
  onClose,
  onSave,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('normal');
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = !!transactionToEdit;

  // Master Data states
  const [masterCategories, setMasterCategories] = useState<FinanceCategory[]>(() =>
    financeCategoryService.getInitialCategories()
  );
  const [masterAccounts, setMasterAccounts] = useState<FinanceAccount[]>(() =>
    financeAccountService.getInitialAccounts()
  );
  const [masterCounterparties, setMasterCounterparties] = useState<Counterparty[]>(() =>
    counterpartyService.getInitialCounterparties()
  );
  const [employees, setEmployees] = useState<Employee[]>(() =>
    employeeService.getInitialEmployees()
  );
  const [transactions, setTransactions] = useState(() =>
    cashTransactionService.getInitialTransactions()
  );

  const getCurrentTimeString = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // Form states
  const [type, setType] = useState<TransactionType>(initialType);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [amountInWords, setAmountInWords] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [transactionTime, setTransactionTime] = useState(getCurrentTimeString());
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [account, setAccount] = useState('Vietcombank - Tài khoản chính');
  const [destinationAccount, setDestinationAccount] = useState(
    'Quỹ tiền mặt văn phòng (VND)'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [counterpartyType, setCounterpartyType] = useState<
    'customer' | 'vendor' | 'employee' | 'partner' | 'other'
  >('vendor');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [counterpartyCode, setCounterpartyCode] = useState('');
  const [counterpartyPhone, setCounterpartyPhone] = useState('');
  const [counterpartyAddress, setCounterpartyAddress] = useState('');
  const [selectedCounterpartyId, setSelectedCounterpartyId] = useState<string>('');
  const [department, setDepartment] = useState('Ban Giám Đốc');
  const [refProposalCode, setRefProposalCode] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<TransactionStatus>('completed');
  const [isPinned, setIsPinned] = useState(false);
  const [attachments, setAttachments] = useState<
    { id: string; name: string; size: string; url: string }[]
  >([]);

  // Quick Add Counterparty State
  const [isAddingQuickCounterparty, setIsAddingQuickCounterparty] = useState(false);
  const [quickCpName, setQuickCpName] = useState('');
  const [quickCpType, setQuickCpType] = useState<CounterpartyType>('customer');
  const [quickCpPhone, setQuickCpPhone] = useState('');
  const [quickCpAddress, setQuickCpAddress] = useState('');
  const [quickCpTaxCode, setQuickCpTaxCode] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reload master data whenever drawer opens
  useEffect(() => {
    if (isOpen) {
      setMasterCategories(financeCategoryService.getInitialCategories());
      setMasterAccounts(financeAccountService.getInitialAccounts());
      setMasterCounterparties(counterpartyService.getInitialCounterparties());
      setEmployees(employeeService.getInitialEmployees());
      setTransactions(cashTransactionService.getInitialTransactions());
    }
  }, [isOpen]);

  // Derived available Level 1 categories
  const availableLevel1Categories = useMemo(() => {
    const matching = masterCategories.filter(
      (c) => c.status === 'active' && c.type === type && (c.level === 1 || !c.parentCategory)
    );
    if (matching.length > 0) return matching.map((c) => c.name);
    return type === 'income'
      ? INCOME_CATEGORIES
      : type === 'expense'
      ? EXPENSE_CATEGORIES
      : TRANSFER_CATEGORIES;
  }, [masterCategories, type]);

  // Derived available Level 2 sub-categories
  const availableLevel2Categories = useMemo(() => {
    if (!category) return [];
    const parentCatObj = masterCategories.find(
      (c) => c.name === category || c.code === category
    );
    const matching = masterCategories.filter(
      (c) =>
        c.status === 'active' &&
        c.level === 2 &&
        (c.parentCategory === category ||
          (parentCatObj && c.parentCategory === parentCatObj.code) ||
          (parentCatObj && c.parentCategory === parentCatObj.name))
    );
    return matching.map((c) => c.name);
  }, [masterCategories, category]);

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

  // Derived available accounts with live calculated balances
  const availableAccounts = useMemo<AvailableAccountItem[]>(() => {
    const active = masterAccounts.filter((a) => a.status === 'active');
    const baseList = active.length > 0 ? active : (CASH_ACCOUNTS as any[]);

    return baseList.map((acc: any, idx: number): AvailableAccountItem => {
      const inflow = transactions
        .filter(
          (t) =>
            t.status === 'completed' &&
            ((t.type === 'income' && isMatchingAccount(t.account, acc.accountName || acc.name, acc.accountNumber)) ||
              (t.type === 'transfer' && isMatchingAccount(t.destinationAccount, acc.accountName || acc.name, acc.accountNumber)))
        )
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const outflow = transactions
        .filter(
          (t) =>
            t.status === 'completed' &&
            ((t.type === 'expense' && isMatchingAccount(t.account, acc.accountName || acc.name, acc.accountNumber)) ||
              (t.type === 'transfer' && isMatchingAccount(t.account, acc.accountName || acc.name, acc.accountNumber)))
        )
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const initial = Number(acc.initialBalance) || 0;
      const liveBal = initial + inflow - outflow;

      return {
        id: acc.id || `acc-${idx}`,
        code: acc.code || `TK-${idx + 1}`,
        name: `${acc.accountName || acc.name}${acc.accountNumber ? ` (${acc.accountNumber})` : ''}`,
        rawName: acc.accountName || acc.name,
        balance: liveBal,
        bankName: acc.bankName,
        type: acc.type,
        isDefault: acc.isDefault ?? (idx === 0),
      };
    });
  }, [masterAccounts, transactions]);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setCode(transactionToEdit.code);
      setTitle(transactionToEdit.title);
      setAmount(transactionToEdit.amount);
      setAmountInWords(
        transactionToEdit.amountInWords || vndNumberToWords(transactionToEdit.amount)
      );
      setTransactionDate(
        transactionToEdit.transactionDate || new Date().toISOString().split('T')[0]
      );
      setTransactionTime(transactionToEdit.transactionTime || getCurrentTimeString());
      setCategory(transactionToEdit.category);
      setSubCategory(transactionToEdit.subCategory || '');
      setAccount(transactionToEdit.account);
      setDestinationAccount(
        transactionToEdit.destinationAccount || 'Quỹ tiền mặt văn phòng (VND)'
      );
      setPaymentMethod(transactionToEdit.paymentMethod);
      setCounterpartyType(transactionToEdit.counterpartyType);
      setCounterpartyName(transactionToEdit.counterpartyName);
      setCounterpartyCode(transactionToEdit.counterpartyCode || '');
      setCounterpartyPhone(transactionToEdit.counterpartyPhone || '');
      setCounterpartyAddress(transactionToEdit.counterpartyAddress || '');

      // Intelligent Counterparty Matching by ID, Code, or Name
      let matchedCpId = '';
      if (transactionToEdit.counterpartyId) {
        if (
          transactionToEdit.counterpartyId.startsWith('emp-') ||
          transactionToEdit.counterpartyId.startsWith('emp:') ||
          transactionToEdit.counterpartyType === 'employee'
        ) {
          const cleanId = transactionToEdit.counterpartyId.replace('emp:', '');
          const emp = employees.find((e) => e.id === cleanId || e.code === cleanId);
          if (emp) matchedCpId = `emp:${emp.id}`;
        } else {
          const cleanId = transactionToEdit.counterpartyId.replace('cp:', '');
          const cp = masterCounterparties.find((c) => c.id === cleanId || c.code === cleanId);
          if (cp) matchedCpId = `cp:${cp.id}`;
        }
      }
      if (!matchedCpId && transactionToEdit.counterpartyCode) {
        const cp = masterCounterparties.find((c) => c.code === transactionToEdit.counterpartyCode);
        if (cp) matchedCpId = `cp:${cp.id}`;
        const emp = employees.find((e) => e.code === transactionToEdit.counterpartyCode);
        if (emp) matchedCpId = `emp:${emp.id}`;
      }
      if (!matchedCpId && transactionToEdit.counterpartyName) {
        const query = transactionToEdit.counterpartyName.toLowerCase().trim();
        const cp = masterCounterparties.find((c) => c.name.toLowerCase().trim() === query);
        if (cp) matchedCpId = `cp:${cp.id}`;
        const emp = employees.find((e) => e.name.toLowerCase().trim() === query);
        if (emp) matchedCpId = `emp:${emp.id}`;
      }

      setSelectedCounterpartyId(matchedCpId);
      setDepartment(transactionToEdit.department || 'Ban Giám Đốc');
      setRefProposalCode(transactionToEdit.refProposalCode || '');
      setInvoiceNumber(transactionToEdit.invoiceNumber || '');
      setReason(transactionToEdit.reason || '');
      setNote(transactionToEdit.note || '');
      setStatus(transactionToEdit.status);
      setIsPinned(transactionToEdit.isPinned || false);
      setAttachments(transactionToEdit.attachments || []);
    } else {
      const newType = initialType;
      setType(newType);
      const prefix = newType === 'income' ? 'PT' : newType === 'expense' ? 'PC' : 'LC';
      const randomSuffix = String(Math.floor(100 + Math.random() * 900));
      setCode(`${prefix}-2026-${randomSuffix}`);
      setTitle('');
      setAmount(0);
      setAmountInWords('Không đồng chẵn');
      setTransactionDate(defaultDate || new Date().toISOString().split('T')[0]);
      setTransactionTime(getCurrentTimeString());

      const defaultCat =
        availableLevel1Categories.length > 0
          ? availableLevel1Categories[0]
          : newType === 'income'
          ? INCOME_CATEGORIES[0]
          : newType === 'expense'
          ? EXPENSE_CATEGORIES[0]
          : TRANSFER_CATEGORIES[0];
      setCategory(defaultCat);
      setSubCategory('');

      const defaultAcc = availableAccounts.find((a) => a.isDefault) || availableAccounts[0];
      const secondAcc =
        availableAccounts.find((a) => a.id !== defaultAcc?.id) || availableAccounts[0];

      setAccount(defaultAcc ? defaultAcc.rawName : 'Vietcombank - Tài khoản chính');
      setDestinationAccount(
        secondAcc ? secondAcc.rawName : 'Quỹ tiền mặt văn phòng (VND)'
      );
      setPaymentMethod(newType === 'income' ? 'bank_transfer' : 'cash');
      setCounterpartyType(newType === 'income' ? 'customer' : 'vendor');
      setCounterpartyName('');
      setCounterpartyCode('');
      setCounterpartyPhone('');
      setCounterpartyAddress('');
      setSelectedCounterpartyId('');
      setDepartment('Ban Giám Đốc');
      setRefProposalCode('');
      setInvoiceNumber('');
      setReason('');
      setNote('');
      setStatus('completed');
      setIsPinned(false);
      setAttachments([]);
    }
    setFormErrors({});
  }, [transactionToEdit, initialType, defaultDate, isOpen, masterCounterparties, employees]);

  const handleAmountChange = (val: number) => {
    const validAmount = isNaN(val) || val < 0 ? 0 : val;
    setAmount(validAmount);
    setAmountInWords(vndNumberToWords(validAmount));
    if (formErrors.amount) {
      setFormErrors((prev) => ({ ...prev, amount: '' }));
    }
  };

  const handleTypeSwitch = (newType: TransactionType) => {
    setType(newType);
    if (!transactionToEdit) {
      const prefix = newType === 'income' ? 'PT' : newType === 'expense' ? 'PC' : 'LC';
      const randomSuffix = String(Math.floor(100 + Math.random() * 900));
      setCode(`${prefix}-2026-${randomSuffix}`);

      const matching = masterCategories.filter(
        (c) => c.status === 'active' && c.type === newType && (c.level === 1 || !c.parentCategory)
      );
      const firstCat =
        matching.length > 0
          ? matching[0].name
          : newType === 'income'
          ? INCOME_CATEGORIES[0]
          : newType === 'expense'
          ? EXPENSE_CATEGORIES[0]
          : TRANSFER_CATEGORIES[0];

      setCategory(firstCat);
      setSubCategory('');
      setCounterpartyType(
        newType === 'income' ? 'customer' : newType === 'expense' ? 'vendor' : 'other'
      );
    }
  };

  const handleSelectCounterparty = (selectedId: string) => {
    setSelectedCounterpartyId(selectedId);
    if (!selectedId) {
      setCounterpartyCode('');
      return;
    }

    if (selectedId.startsWith('emp:')) {
      const empId = selectedId.replace('emp:', '');
      const emp = employees.find((e) => e.id === empId || e.code === empId);
      if (emp) {
        setCounterpartyType('employee');
        setCounterpartyCode(emp.code);
        setCounterpartyName(emp.name);
        if (emp.phone) setCounterpartyPhone(emp.phone);
        if (emp.currentAddress || emp.permanentAddress) {
          setCounterpartyAddress(emp.currentAddress || emp.permanentAddress || '');
        }
        if (emp.department) {
          setDepartment(emp.department);
        }
      }
      return;
    }

    const cpId = selectedId.startsWith('cp:') ? selectedId.replace('cp:', '') : selectedId;
    const cp = masterCounterparties.find((c) => c.id === cpId || c.code === cpId);
    if (cp) {
      setCounterpartyCode(cp.code);
      setCounterpartyName(cp.name);
      if (cp.phone) setCounterpartyPhone(cp.phone);
      if (cp.address) setCounterpartyAddress(cp.address);
      if (cp.type) setCounterpartyType(cp.type);
    }
  };

  // Quick Create Counterparty directly from Thu Chi
  const handleCreateQuickCounterparty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCpName.trim()) return;

    const prefix =
      quickCpType === 'customer'
        ? 'KH'
        : quickCpType === 'vendor'
        ? 'NCC'
        : quickCpType === 'employee'
        ? 'NV'
        : quickCpType === 'partner'
        ? 'DT'
        : 'OTHER';
    const count = masterCounterparties.filter((c) => c.type === quickCpType).length + 1;
    const newCode = `DT-${prefix}-${String(count).padStart(2, '0')}`;

    const newCp: Counterparty = {
      id: `cp-${Date.now()}`,
      code: newCode,
      name: quickCpName.trim(),
      type: quickCpType,
      phone: quickCpPhone.trim() || undefined,
      address: quickCpAddress.trim() || undefined,
      taxCode: quickCpTaxCode.trim() || undefined,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newCp, ...masterCounterparties];
    setMasterCounterparties(updated);
    counterpartyService.saveToCache(updated);
    counterpartyService.appendToSheet(newCp);

    // Auto select the newly created counterparty
    setSelectedCounterpartyId(`cp:${newCp.id}`);
    setCounterpartyCode(newCp.code);
    setCounterpartyName(newCp.name);
    setCounterpartyType(newCp.type);
    if (newCp.phone) setCounterpartyPhone(newCp.phone);
    if (newCp.address) setCounterpartyAddress(newCp.address);

    setIsAddingQuickCounterparty(false);
    setQuickCpName('');
    setQuickCpPhone('');
    setQuickCpAddress('');
    setQuickCpTaxCode('');
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Vui lòng nhập lý do / tiêu đề giao dịch';
    if (!amount || amount <= 0) errs.amount = 'Số tiền giao dịch phải lớn hơn 0';
    if (!transactionDate) errs.transactionDate = 'Vui lòng chọn ngày giao dịch';
    if (!category) errs.category = 'Vui lòng chọn khoản mục';
    if (!account) errs.account = 'Vui lòng chọn tài khoản thanh toán';
    if (type === 'transfer' && !destinationAccount) {
      errs.destinationAccount = 'Vui lòng chọn tài khoản nhận';
    }
    if (type === 'transfer' && account === destinationAccount) {
      errs.destinationAccount = 'Tài khoản nhận không được trùng tài khoản nguồn';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const rawCpId = selectedCounterpartyId
        ? selectedCounterpartyId.startsWith('emp:') || selectedCounterpartyId.startsWith('cp:')
          ? selectedCounterpartyId.split(':')[1]
          : selectedCounterpartyId
        : undefined;

      const payload: Partial<CashTransaction> = {
        code,
        type,
        title: title.trim(),
        amount,
        amountInWords,
        transactionDate,
        transactionTime,
        category,
        subCategory: subCategory.trim() || undefined,
        account,
        destinationAccount: type === 'transfer' ? destinationAccount : undefined,
        paymentMethod,
        counterpartyId: rawCpId,
        counterpartyCode: counterpartyCode || undefined,
        counterpartyType,
        counterpartyName:
          counterpartyName.trim() ||
          (type === 'transfer' ? 'Nội bộ công ty' : 'Khách vãng lai'),
        counterpartyPhone: counterpartyPhone.trim() || undefined,
        counterpartyAddress: counterpartyAddress.trim() || undefined,
        department,
        refProposalCode: refProposalCode.trim() || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        reason: reason.trim() || undefined,
        note: note.trim() || undefined,
        status,
        isPinned,
        attachments,
        createdBy: transactionToEdit?.createdBy || 'Lê Minh Công',
        approvedBy: 'Lê Minh Công',
        updatedAt: new Date().toISOString().split('T')[0],
      };

      await onSave(payload);
    } catch (err) {
      console.error('Failed to save transaction:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFullscreen = () => {
    if (widthMode === 'fullscreen') {
      setWidthMode(prevWidthMode || 'normal');
    } else {
      setPrevWidthMode(widthMode);
      setWidthMode('fullscreen');
    }
  };

  const getWidthStyle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return '100vw';
    }
    switch (widthMode) {
      case 'narrow':
        return 'min(540px, 100vw)';
      case 'wide':
        return 'min(1024px, 100vw)';
      case 'fullscreen':
        return '100vw';
      case 'normal':
      default:
        return 'min(768px, -6rem + 100vw)';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Main Drawer Container */}
      <div
        className="fixed inset-y-0 right-0 w-full bg-card shadow-2xl flex flex-col h-[100dvh] border-l border-border outline-none transform-gpu z-50 transition-[width] duration-200"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Chỉnh sửa Chứng từ' : 'Lập Phiếu Thu Chi'}
        tabIndex={-1}
        style={{
          width: getWidthStyle(),
          transform: 'none',
        }}
      >
        {/* Top Header */}
        <div
          className="flex items-center justify-between gap-4 border-b border-border bg-card shrink-0"
          style={{
            paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
            paddingBottom: '0.5rem',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          }}
        >
          {/* Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground leading-tight truncate">
                {isEdit ? `Chỉnh sửa chứng từ ${code}` : 'Lập Phiếu Thu / Chi'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {isEdit ? title || code : 'Điền thông tin thu chi'}
              </p>
            </div>
          </div>

          {/* Width Controls & Close */}
          <div className="flex items-center gap-1 shrink-0">
            <div
              role="group"
              aria-label="Bề rộng ngăn bên"
              className="hidden sm:flex items-center gap-0.5 shrink-0 rounded-xl border border-border p-0.5"
            >
              <button
                type="button"
                aria-pressed={widthMode === 'narrow'}
                aria-label="Hẹp"
                title="Hẹp"
                onClick={() => setWidthMode('narrow')}
                className={`p-2 rounded-lg transition-colors active:scale-90 hover:bg-muted hover:text-foreground ${
                  widthMode === 'narrow'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <PanelRightClose className="w-4 h-4 stroke-[2.5px]" />
              </button>
              <button
                type="button"
                aria-pressed={widthMode === 'normal'}
                aria-label="Chuẩn"
                title="Chuẩn"
                onClick={() => setWidthMode('normal')}
                className={`p-2 rounded-lg transition-colors active:scale-90 hover:bg-muted hover:text-foreground ${
                  widthMode === 'normal'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <PanelRight className="w-4 h-4 stroke-[2.5px]" />
              </button>
              <button
                type="button"
                aria-pressed={widthMode === 'wide'}
                aria-label="Rộng"
                title="Rộng"
                onClick={() => setWidthMode('wide')}
                className={`p-2 rounded-lg transition-colors active:scale-90 hover:bg-muted hover:text-foreground ${
                  widthMode === 'wide'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <PanelRightOpen className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={widthMode === 'fullscreen' ? 'Thu nhỏ' : 'Mở toàn màn hình'}
              title={widthMode === 'fullscreen' ? 'Thu nhỏ' : 'Mở toàn màn hình'}
              className="p-2 rounded-lg text-muted-foreground transition-colors active:scale-90 hover:bg-muted hover:text-foreground"
            >
              {widthMode === 'fullscreen' ? (
                <Minimize2 className="w-4 h-4 stroke-[2.5px]" />
              ) : (
                <Maximize2 className="w-4 h-4 stroke-[2.5px]" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              title="Đóng"
              className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors active:scale-90 shrink-0"
            >
              <X className="w-5 h-5 stroke-[2.5px]" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-5 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            <form id="cash-tx-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Type Switcher Segmented Control */}
              <div className="w-full bg-card p-1.5 rounded-xl border border-border shadow-xs">
                <div className="grid grid-cols-3 gap-1.5 p-0.5 rounded-lg bg-muted/50">
                  <button
                    type="button"
                    onClick={() => handleTypeSwitch('income')}
                    className={`inline-flex items-center justify-center rounded-md transition-all duration-200 select-none py-2 text-xs gap-1.5 font-semibold cursor-pointer ${
                      type === 'income'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Phiếu Thu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeSwitch('expense')}
                    className={`inline-flex items-center justify-center rounded-md transition-all duration-200 select-none py-2 text-xs gap-1.5 font-semibold cursor-pointer ${
                      type === 'expense'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Phiếu Chi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeSwitch('transfer')}
                    className={`inline-flex items-center justify-center rounded-md transition-all duration-200 select-none py-2 text-xs gap-1.5 font-semibold cursor-pointer ${
                      type === 'transfer'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    }`}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    <span>Luân Chuyển Quỹ</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Thông tin cơ bản & Số tiền */}
              <div className="w-full bg-card p-4 rounded-xl border border-border shadow-xs space-y-3.5">
                <div className="pb-2 border-b border-border">
                  <h4 className="text-xs uppercase tracking-wider flex items-center gap-1.5 text-primary font-bold">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Thông tin chứng từ & Số tiền</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Mã chứng từ */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                      <FileText className="w-3 h-3" />
                      Mã phiếu <span className="text-destructive">*</span>
                    </label>
                    <input
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="VD: PC-2026-001"
                      className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-mono font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>

                  {/* Ngày giao dịch */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      Ngày giao dịch <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>

                  {/* Giờ giao dịch */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Giờ giao dịch (24h)
                    </label>
                    <TimePickerInput
                      value={transactionTime}
                      onChange={(val) => setTransactionTime(val)}
                      placeholder="09:00"
                      force24h={true}
                    />
                  </div>

                  {/* Tiêu đề / Lý do */}
                  <div className="sm:col-span-3">
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                      <FileText className="w-3 h-3" />
                      Lý do / Nội dung thu chi <span className="text-destructive">*</span>
                    </label>
                    <input
                      required
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                      }}
                      placeholder={
                        type === 'income'
                          ? 'VD: Thu tiền tạm ứng hợp đồng...'
                          : type === 'expense'
                          ? 'VD: Chi thanh toán tiền thuê văn phòng...'
                          : 'VD: Rút tiền tài khoản nhập quỹ...'
                      }
                      className={`flex h-9 w-full rounded-lg border bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
                        formErrors.title ? 'border-destructive' : 'border-border'
                      }`}
                    />
                    {formErrors.title && (
                      <span className="text-[11px] text-destructive mt-1 block">
                        {formErrors.title}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount Box - Clean, simple, accepts ANY number (step="any") */}
                <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                  <label className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                    <CreditCard className="w-3.5 h-3.5 text-primary" />
                    Số tiền giao dịch (VNĐ) <span className="text-destructive">*</span>
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amount === 0 ? '' : amount}
                    onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className={`flex h-11 w-full rounded-lg border bg-background px-3.5 py-2 text-xl font-bold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
                      formErrors.amount ? 'border-destructive' : 'border-border'
                    } ${
                      type === 'income'
                        ? 'text-emerald-600'
                        : type === 'expense'
                        ? 'text-rose-600'
                        : 'text-blue-600'
                    }`}
                  />
                  {formErrors.amount && (
                    <span className="text-[11px] text-destructive block">
                      {formErrors.amount}
                    </span>
                  )}

                  <div className="flex items-center gap-2 text-xs bg-background px-3 py-2 rounded-lg border border-border">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-muted-foreground">Bằng chữ:</span>
                    <span className="font-medium text-foreground italic truncate">
                      {amountInWords || 'Không đồng chẵn'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Tài khoản & Khoản mục */}
              <div className="w-full bg-card p-4 rounded-xl border border-border shadow-xs space-y-3.5">
                <div className="pb-2 border-b border-border">
                  <h4 className="text-xs uppercase tracking-wider flex items-center gap-1.5 text-primary font-bold">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Tài khoản & Khoản mục</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Tài khoản nguồn */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                      <Wallet className="w-3 h-3" />
                      {type === 'transfer' ? 'Tài khoản nguồn (Trích tiền)' : 'Tài khoản thanh toán'}{' '}
                      <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                        className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 appearance-none cursor-pointer"
                      >
                        {availableAccounts.map((acc) => (
                          <option key={acc.id} value={acc.rawName}>
                            {acc.name} — [Dư: {acc.balance.toLocaleString('vi-VN')} đ]
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Tài khoản đích hoặc Hình thức */}
                  {type === 'transfer' ? (
                    <div>
                      <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                        <Wallet className="w-3 h-3" />
                        Tài khoản đích (Nhận tiền) <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={destinationAccount}
                          onChange={(e) => setDestinationAccount(e.target.value)}
                          className={`flex h-9 w-full rounded-lg border bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 appearance-none cursor-pointer ${
                            formErrors.destinationAccount ? 'border-destructive' : 'border-border'
                          }`}
                        >
                          {availableAccounts.map((acc) => (
                            <option key={acc.id} value={acc.rawName}>
                              {acc.name} — [Dư: {acc.balance.toLocaleString('vi-VN')} đ]
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                      </div>
                      {formErrors.destinationAccount && (
                        <span className="text-[11px] text-destructive mt-1 block">
                          {formErrors.destinationAccount}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                        <CreditCard className="w-3 h-3" />
                        Phương thức thanh toán
                      </label>
                      <div className="relative">
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 appearance-none cursor-pointer"
                        >
                          <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                          <option value="cash">Tiền mặt tại quỹ</option>
                          <option value="credit_card">Thẻ tín dụng doanh nghiệp</option>
                          <option value="e_wallet">Ví điện tử</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  )}

                  {/* Khoản mục (Cấp 1) */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                      <Layers className="w-3 h-3" />
                      Khoản mục thu chi <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setSubCategory('');
                        }}
                        className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 appearance-none cursor-pointer"
                      >
                        {availableLevel1Categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Hạng mục con (Cấp 2) */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                      <Layers className="w-3 h-3" />
                      Hạng mục chi tiết (Cấp 2)
                    </label>
                    {availableLevel2Categories.length > 0 ? (
                      <div className="relative">
                        <select
                          value={subCategory}
                          onChange={(e) => setSubCategory(e.target.value)}
                          className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 appearance-none cursor-pointer"
                        >
                          <option value="">-- Không chọn / Mặc định --</option>
                          {availableLevel2Categories.map((sc) => (
                            <option key={sc} value={sc}>
                              {sc}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                      </div>
                    ) : (
                      <input
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        placeholder="Hạng mục chi tiết..."
                        className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Đối tượng giao dịch (nếu không phải Luân chuyển) */}
              {type !== 'transfer' && (
                <div className="w-full bg-card p-4 rounded-xl border border-border shadow-xs space-y-3.5">
                  <div className="pb-2 border-b border-border flex items-center justify-between gap-2">
                    <h4 className="text-xs uppercase tracking-wider flex items-center gap-1.5 text-primary font-bold">
                      <Users className="w-3.5 h-3.5" />
                      <span>Đối tượng giao dịch</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingQuickCounterparty(!isAddingQuickCounterparty)}
                      className="text-[11px] font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAddingQuickCounterparty ? 'Đóng tạo nhanh' : '+ Thêm đối tượng mới'}</span>
                    </button>
                  </div>

                  {/* Quick Inline Creation Form */}
                  {isAddingQuickCounterparty && (
                    <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          Thêm nhanh đối tượng mới vào Danh mục
                        </span>
                        <span className="text-[10px] text-muted-foreground">Tự động liên kết ID</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-medium mb-1 block text-foreground">
                            Tên đối tượng / Công ty <span className="text-destructive">*</span>
                          </label>
                          <input
                            value={quickCpName}
                            onChange={(e) => setQuickCpName(e.target.value)}
                            placeholder="VD: Công ty TNHH Thương mại Minh An..."
                            className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium mb-1 block text-foreground">
                            Phân loại
                          </label>
                          <select
                            value={quickCpType}
                            onChange={(e) => setQuickCpType(e.target.value as any)}
                            className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          >
                            <option value="customer">Khách hàng</option>
                            <option value="vendor">Nhà cung cấp</option>
                            <option value="partner">Đối tác</option>
                            <option value="other">Khác</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-medium mb-1 block text-foreground">
                            Số điện thoại
                          </label>
                          <input
                            value={quickCpPhone}
                            onChange={(e) => setQuickCpPhone(e.target.value)}
                            placeholder="09xx..."
                            className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium mb-1 block text-foreground">
                            Mã số thuế (MST)
                          </label>
                          <input
                            value={quickCpTaxCode}
                            onChange={(e) => setQuickCpTaxCode(e.target.value)}
                            placeholder="MST..."
                            className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium mb-1 block text-foreground">
                            Địa chỉ
                          </label>
                          <input
                            value={quickCpAddress}
                            onChange={(e) => setQuickCpAddress(e.target.value)}
                            placeholder="Địa chỉ..."
                            className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingQuickCounterparty(false)}
                          className="px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          disabled={!quickCpName.trim()}
                          onClick={handleCreateQuickCounterparty}
                          className="px-3 py-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                        >
                          Lưu & Chọn ngay
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Select from Master Counterparties and Employees */}
                  {(masterCounterparties.length > 0 || employees.length > 0) && (
                    <div className="relative">
                      <select
                        value={selectedCounterpartyId}
                        onChange={(e) => handleSelectCounterparty(e.target.value)}
                        className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 appearance-none cursor-pointer"
                      >
                        <option value="">-- Chọn nhanh từ danh sách Nhân viên hoặc Đối tác --</option>
                        {employees.length > 0 && (
                          <optgroup label="👥 Danh sách Nhân viên (Module Nhân viên)">
                            {employees
                              .filter((e) => e.status !== 'resigned')
                              .map((emp) => (
                                <option key={`emp-${emp.id}`} value={`emp:${emp.id}`}>
                                  [NV - {emp.code}] {emp.name} — {emp.department} {emp.phone ? `(${emp.phone})` : ''}
                                </option>
                              ))}
                          </optgroup>
                        )}
                        {masterCounterparties.length > 0 && (
                          <optgroup label="🏢 Danh sách Đối tác / Khách hàng / NCC (Module Đối tượng)">
                            {masterCounterparties
                              .filter((c) => c.status === 'active')
                              .map((cp) => (
                                <option key={`cp-${cp.id}`} value={`cp:${cp.id}`}>
                                  [{cp.code}] {cp.name} {cp.phone ? `(${cp.phone})` : ''}
                                </option>
                              ))}
                          </optgroup>
                        )}
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Phân loại */}
                    <div>
                      <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                        <Layers className="w-3 h-3" />
                        Phân loại
                      </label>
                      <div className="relative">
                        <select
                          value={counterpartyType}
                          onChange={(e) => setCounterpartyType(e.target.value as any)}
                          className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 appearance-none cursor-pointer"
                        >
                          <option value="customer">Khách hàng</option>
                          <option value="vendor">Nhà cung cấp</option>
                          <option value="employee">Nhân viên</option>
                          <option value="partner">Đối tác</option>
                          <option value="other">Khác</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {/* Tên đối tượng */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                        <User className="w-3 h-3" />
                        Tên đối tượng / Công ty
                      </label>
                      <input
                        value={counterpartyName}
                        onChange={(e) => {
                          setCounterpartyName(e.target.value);
                          setSelectedCounterpartyId('');
                        }}
                        placeholder="VD: Công ty TNHH Giải Pháp Phần Mềm H161..."
                        className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </div>

                    {/* SĐT */}
                    <div>
                      <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        Số điện thoại
                      </label>
                      <input
                        value={counterpartyPhone}
                        onChange={(e) => setCounterpartyPhone(e.target.value)}
                        placeholder="09xx..."
                        className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </div>

                    {/* Địa chỉ */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        Địa chỉ
                      </label>
                      <input
                        value={counterpartyAddress}
                        onChange={(e) => setCounterpartyAddress(e.target.value)}
                        placeholder="Địa chỉ..."
                        className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Thông tin bổ sung */}
              <div className="w-full bg-card p-4 rounded-xl border border-border shadow-xs space-y-3.5">
                <div className="pb-2 border-b border-border">
                  <h4 className="text-xs uppercase tracking-wider flex items-center gap-1.5 text-primary font-bold">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Thông tin bổ sung</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Phòng ban */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                      <Building2 className="w-3 h-3" />
                      Phòng ban
                    </label>
                    <div className="relative">
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 appearance-none cursor-pointer"
                      >
                        <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                        <option value="Phòng Kỹ thuật">Phòng Kỹ thuật</option>
                        <option value="Phòng Kinh doanh">Phòng Kinh doanh</option>
                        <option value="Phòng Kế toán">Phòng Kế toán</option>
                        <option value="Phòng Hành chính Nhân sự">Phòng Hành chính Nhân sự</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Mã đề xuất chi */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                      <FileText className="w-3 h-3" />
                      Mã đề xuất chi
                    </label>
                    <input
                      value={refProposalCode}
                      onChange={(e) => setRefProposalCode(e.target.value)}
                      placeholder="DX-2026-..."
                      className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>

                  {/* Số hóa đơn VAT */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                      <Receipt className="w-3 h-3" />
                      Số Hóa đơn VAT / HĐ
                    </label>
                    <input
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="HD-2026/..."
                      className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>

                  {/* Diễn giải */}
                  <div className="sm:col-span-3">
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                      <FileText className="w-3 h-3" />
                      Diễn giải chi tiết
                    </label>
                    <textarea
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Nội dung giải trình thêm về chứng từ (nếu có)..."
                      className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>

                  {/* Ghi chú */}
                  <div className="sm:col-span-3">
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1 text-muted-foreground">
                      <FileText className="w-3 h-3" />
                      Ghi chú nội bộ
                    </label>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ghi chú thêm cho thủ quỹ / kế toán (nếu có)..."
                      className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sticky Footer */}
        <div
          className="bg-card border-t border-border flex flex-col-reverse sm:flex-row items-center shrink-0 w-full gap-2 z-10"
          style={{
            paddingTop: '0.5rem',
            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          }}
        >
          <div className="flex items-center justify-between w-full gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted h-8 px-3 text-xs text-muted-foreground hover:text-foreground border border-border cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="cash-tx-form"
              disabled={isSaving}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-4 text-xs bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-1.5" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  <span>{isEdit ? 'Cập nhật' : 'Lưu chứng từ'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
