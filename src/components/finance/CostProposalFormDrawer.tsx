import React, { useState, useEffect } from 'react';
import {
  FileText,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  X,
  Calendar,
  CalendarClock,
  User,
  Building2,
  StickyNote,
  Landmark,
  Users,
  Check,
  GripVertical,
  Copy,
  Trash2,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { CostProposal, ProposalLineItem } from '../../types/cost-proposal';

interface CostProposalFormDrawerProps {
  initialData?: CostProposal | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (proposalData: Partial<CostProposal>) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide';

const USERS_LIST = [
  'Lê Minh Công',
  'Dương Thị Kim Oanh',
  'Trần Quang Huy',
  'Nguyễn Văn Thành',
  'Bùi Thị Lan',
  'Lê Hoàng Nam',
  'Trịnh Thị Ngọc',
  'Đinh Công Vinh',
];

const DEPARTMENTS_LIST = [
  'Ban Giám Đốc',
  'Phòng Marketing',
  'Phòng Hành chính',
  'Phòng Nhân sự',
  'Phòng Kỹ thuật',
  'Phòng Tài chính - Kế toán',
  'Phòng Kinh doanh',
];

const ACCOUNTS_LIST = [
  'Vietcombank - Tài khoản chính',
  'Techcombank - Chi lương',
  'Quỹ tiền mặt',
  'BIDV - Tài khoản chi phí dự án',
];

const BENEFICIARIES_LIST = [
  'Công ty TNHH In ấn Quảng cáo Sài Gòn',
  'DNTN Văn phòng phẩm Hồng Hà',
  'Công ty Điện Lực TP.HCM',
  'Công ty Cấp Nước Sài Gòn',
  'Bảo hiểm xã hội TP.HCM',
  'Công ty TNHH Giải pháp Phần mềm ABC',
];

const CATEGORIES_LIST = [
  'Quảng cáo',
  'Văn phòng phẩm',
  'Điện nước & Dịch vụ',
  'Bảo hiểm & Phúc lợi',
  'Lương & Thưởng',
  'Tiếp khách',
  'Công tác phí',
  'Chi phí khác',
];

export const CostProposalFormDrawer: React.FC<CostProposalFormDrawerProps> = ({
  initialData,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');

  // Form Fields
  const [proposalDate, setProposalDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [proposer, setProposer] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [account, setAccount] = useState<string>('');
  const [beneficiary, setBeneficiary] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Line items
  const [lineItems, setLineItems] = useState<ProposalLineItem[]>([
    {
      id: 'li-new-1',
      category: 'Quảng cáo',
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      note: '',
    },
  ]);

  // Dropdown states
  const [isProposerDropdownOpen, setIsProposerDropdownOpen] = useState(false);
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isBeneficiaryDropdownOpen, setIsBeneficiaryDropdownOpen] = useState(false);
  const [activeCategoryDropdownIndex, setActiveCategoryDropdownIndex] = useState<number | null>(null);

  // Populate data when editing or opening
  useEffect(() => {
    if (initialData) {
      // Date formatting for input[type="date"]
      const formatDateForInput = (dStr: string) => {
        if (!dStr) return '';
        if (dStr.includes('/')) {
          const parts = dStr.split('/');
          if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
        return dStr;
      };

      setProposalDate(formatDateForInput(initialData.proposalDate));
      setDueDate(formatDateForInput(initialData.dueDate));
      setProposer(initialData.proposer || '');
      setDepartment(initialData.department || '');
      setTitle(initialData.title || '');
      setReason(initialData.reason || '');
      setAccount(initialData.account || '');
      setBeneficiary(initialData.beneficiary || '');
      setNote(initialData.note || '');
      setIsActive(initialData.status === 'active');

      if (initialData.lineItems && initialData.lineItems.length > 0) {
        setLineItems(initialData.lineItems);
      } else {
        setLineItems([
          {
            id: 'li-edit-1',
            category: 'Quảng cáo',
            description: initialData.title || '',
            quantity: 1,
            unitPrice: initialData.amount || 0,
            amount: initialData.amount || 0,
            note: '',
          },
        ]);
      }
    } else {
      // Default to today
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayIso = `${yyyy}-${mm}-${dd}`;

      setProposalDate(todayIso);
      setDueDate(todayIso);
      setProposer('Lê Minh Công');
      setDepartment('Ban Giám Đốc');
      setTitle('');
      setReason('');
      setAccount('Vietcombank - Tài khoản chính');
      setBeneficiary('');
      setNote('');
      setIsActive(true);
      setLineItems([
        {
          id: 'li-init-1',
          category: 'Quảng cáo',
          description: '',
          quantity: 1,
          unitPrice: 0,
          amount: 0,
          note: '',
        },
      ]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Currency Formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Line item handlers
  const handleAddLineItem = () => {
    const newItem: ProposalLineItem = {
      id: `li-${Date.now()}`,
      category: 'Quảng cáo',
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      note: '',
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleDuplicateLineItem = (index: number) => {
    const item = lineItems[index];
    const duplicated: ProposalLineItem = {
      ...item,
      id: `li-${Date.now()}`,
    };
    const updated = [...lineItems];
    updated.splice(index + 1, 0, duplicated);
    setLineItems(updated);
  };

  const handleDeleteLineItem = (index: number) => {
    if (lineItems.length === 1) return; // Keep at least 1 row
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (
    index: number,
    field: keyof ProposalLineItem,
    value: string | number
  ) => {
    const updated = [...lineItems];
    const current = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(field === 'quantity' ? value : current.quantity) || 0;
      const p = Number(field === 'unitPrice' ? value : current.unitPrice) || 0;
      current.amount = q * p;
    }

    updated[index] = current;
    setLineItems(updated);
  };

  // Calculate total amount
  const totalCalculatedAmount = lineItems.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const formatDateForDisplay = (isoStr: string) => {
      if (!isoStr) return '';
      const parts = isoStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return isoStr;
    };

    const finalAmount = totalCalculatedAmount > 0 ? totalCalculatedAmount : 0;

    onSubmit({
      proposalDate: formatDateForDisplay(proposalDate),
      dueDate: formatDateForDisplay(dueDate),
      proposer,
      department,
      title,
      reason,
      amount: finalAmount,
      account,
      beneficiary: beneficiary || undefined,
      note: note || undefined,
      status: isActive ? 'active' : 'cancelled',
      lineItems,
    });

    onClose();
  };

  const getWidthClass = () => {
    switch (widthMode) {
      case 'narrow':
        return 'w-full max-w-xl';
      case 'wide':
        return 'w-full max-w-5xl';
      case 'normal':
      default:
        return 'w-full max-w-3xl';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 z-40 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 ${getWidthClass()} bg-card shadow-2xl flex flex-col h-[100dvh] border-l border-border/40 outline-none z-50 animate-in slide-in-from-right duration-200`}
        role="dialog"
        aria-modal="true"
        aria-label={initialData ? 'Chỉnh sửa đề xuất chi phí' : 'Thêm đề xuất chi phí'}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-4 border-b border-border/60 bg-card shrink-0 px-4 py-2.5 sm:px-5"
          style={{ paddingTop: 'max(0.6rem, env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground leading-tight truncate">
                {initialData ? 'Chỉnh sửa đề xuất chi phí' : 'Thêm đề xuất chi phí'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {initialData ? `Cập nhật phiếu: ${initialData.code}` : 'Lập phiếu đề xuất chi mới'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Width Adjustment */}
            <div
              role="group"
              aria-label="Bề rộng ngăn bên"
              className="flex items-center gap-0.5 shrink-0 rounded-xl border border-border/60 p-0.5"
            >
              <button
                type="button"
                onClick={() => setWidthMode('narrow')}
                aria-pressed={widthMode === 'narrow'}
                title="Hẹp"
                className={`p-1.5 rounded-lg transition-colors active:scale-90 ${
                  widthMode === 'narrow'
                    ? 'bg-muted text-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <PanelRightClose className="w-4 h-4 stroke-[2.25px]" />
              </button>
              <button
                type="button"
                onClick={() => setWidthMode('normal')}
                aria-pressed={widthMode === 'normal'}
                title="Chuẩn"
                className={`p-1.5 rounded-lg transition-colors active:scale-90 ${
                  widthMode === 'normal'
                    ? 'bg-muted text-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <PanelRight className="w-4 h-4 stroke-[2.25px]" />
              </button>
              <button
                type="button"
                onClick={() => setWidthMode('wide')}
                aria-pressed={widthMode === 'wide'}
                title="Rộng"
                className={`p-1.5 rounded-lg transition-colors active:scale-90 ${
                  widthMode === 'wide'
                    ? 'bg-muted text-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <PanelRightOpen className="w-4 h-4 stroke-[2.25px]" />
              </button>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors active:scale-90 shrink-0 ml-1"
            >
              <X className="w-5 h-5 stroke-[2.25px]" />
            </button>
          </div>
        </div>

        {/* Body Form */}
        <div className="flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-5 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            <form id="de-xuat-chi-phi-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Section: Thông tin phiếu */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate">Thông tin phiếu</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3.5">
                  {/* Ngày đề xuất */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      Ngày đề xuất<span className="text-destructive ml-0.5">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={proposalDate}
                      onChange={(e) => setProposalDate(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 tabular-nums"
                    />
                  </div>

                  {/* Ngày cần chi */}
                  <div>
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <CalendarClock className="w-3 h-3 text-muted-foreground" />
                      Ngày cần chi
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 tabular-nums"
                    />
                  </div>

                  {/* Người đề xuất */}
                  <div className="relative">
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <User className="w-3 h-3 text-muted-foreground" />
                      Người đề xuất<span className="text-destructive ml-0.5">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsProposerDropdownOpen(!isProposerDropdownOpen)}
                      className="relative w-full h-10 rounded-lg border border-border bg-background py-2 px-3 text-xs text-foreground flex items-center justify-between text-left hover:border-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <span className="truncate flex-1 min-w-0">
                        {proposer || <span className="text-muted-foreground italic">— Chưa chọn —</span>}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>

                    {isProposerDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg py-1 z-30 max-h-48 overflow-y-auto">
                        {USERS_LIST.map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => {
                              setProposer(u);
                              setIsProposerDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors ${
                              proposer === u ? 'font-semibold text-primary bg-primary/5' : 'text-foreground'
                            }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Phòng ban */}
                  <div className="relative">
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="w-3 h-3 text-muted-foreground" />
                      Phòng ban<span className="text-destructive ml-0.5">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDepartmentDropdownOpen(!isDepartmentDropdownOpen)}
                      className="relative w-full h-10 rounded-lg border border-border bg-background py-2 px-3 text-xs text-foreground flex items-center justify-between text-left hover:border-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <span className="truncate flex-1 min-w-0">
                        {department || <span className="text-muted-foreground italic">Chọn hoặc thêm mới</span>}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>

                    {isDepartmentDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg py-1 z-30 max-h-48 overflow-y-auto">
                        {DEPARTMENTS_LIST.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              setDepartment(d);
                              setIsDepartmentDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors ${
                              department === d ? 'font-semibold text-primary bg-primary/5' : 'text-foreground'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tiêu đề */}
                  <div className="sm:col-span-3">
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      Tiêu đề<span className="text-destructive ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Chạy quảng cáo Facebook & Google tháng 9"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground placeholder:italic focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                    />
                  </div>

                  {/* Lý do */}
                  <div className="sm:col-span-3">
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <StickyNote className="w-3 h-3 text-muted-foreground" />
                      Lý do
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Mô tả chi tiết mục đích chi..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="flex w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground placeholder:italic resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 min-h-[90px]"
                    />
                  </div>

                  {/* Tài khoản đề nghị chi */}
                  <div className="relative">
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Landmark className="w-3 h-3 text-muted-foreground" />
                      Tài khoản đề nghị chi
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                      className="relative w-full h-10 rounded-lg border border-border bg-background py-2 px-3 text-xs text-foreground flex items-center justify-between text-left hover:border-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <span className="truncate flex-1 min-w-0">
                        {account || <span className="text-muted-foreground italic">— Chưa chọn —</span>}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>

                    {isAccountDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg py-1 z-30 max-h-48 overflow-y-auto">
                        {ACCOUNTS_LIST.map((acc) => (
                          <button
                            key={acc}
                            type="button"
                            onClick={() => {
                              setAccount(acc);
                              setIsAccountDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors ${
                              account === acc ? 'font-semibold text-primary bg-primary/5' : 'text-foreground'
                            }`}
                          >
                            {acc}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Đối tượng thụ hưởng */}
                  <div className="relative">
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      Đối tượng thụ hưởng
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsBeneficiaryDropdownOpen(!isBeneficiaryDropdownOpen)}
                      className="relative w-full h-10 rounded-lg border border-border bg-background py-2 px-3 text-xs text-foreground flex items-center justify-between text-left hover:border-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <span className="truncate flex-1 min-w-0">
                        {beneficiary || <span className="text-muted-foreground italic">— Chưa chọn —</span>}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>

                    {isBeneficiaryDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg py-1 z-30 max-h-48 overflow-y-auto">
                        {BENEFICIARIES_LIST.map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              setBeneficiary(b);
                              setIsBeneficiaryDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors ${
                              beneficiary === b ? 'font-semibold text-primary bg-primary/5' : 'text-foreground'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ghi chú */}
                  <div className="sm:col-span-3">
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <StickyNote className="w-3 h-3 text-muted-foreground" />
                      Ghi chú
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ghi chú thêm nếu có..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="flex w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground placeholder:italic resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[70px]"
                    />
                  </div>

                  {/* Trạng thái Switch */}
                  <div className="col-span-1 sm:col-span-3">
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      Trạng thái<span className="text-destructive ml-0.5">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 h-10 text-xs transition-all ${
                        isActive
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted border-border text-muted-foreground'
                      }`}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        {isActive && <Check className="w-4 h-4 text-primary" />}
                        {isActive ? 'Đang hoạt động' : 'Đã huỷ'}
                      </span>
                      <div
                        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                          isActive ? 'bg-primary' : 'bg-muted-foreground/40'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                            isActive ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section: Dòng khoản mục */}
              <div id="de-xuat-chi-phi-line-items">
                <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2.5 border-b border-primary/20">
                    <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="truncate">Dòng khoản mục</span>
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full min-w-max border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            <th className="w-9 px-2 py-2 text-center text-muted-foreground font-medium">#</th>
                            <th className="px-2 py-2 font-medium text-foreground text-left min-w-[140px]">
                              Khoản mục<span className="text-destructive ml-0.5">*</span>
                            </th>
                            <th className="px-2 py-2 font-medium text-foreground text-left min-w-[160px]">
                              Diễn giải<span className="text-destructive ml-0.5">*</span>
                            </th>
                            <th className="px-2 py-2 font-medium text-foreground text-right w-[90px]">
                              Số lượng<span className="text-destructive ml-0.5">*</span>
                            </th>
                            <th className="px-2 py-2 font-medium text-foreground text-right w-[140px]">
                              Đơn giá<span className="text-destructive ml-0.5">*</span>
                            </th>
                            <th className="px-2 py-2 font-medium text-foreground text-right w-[130px]">
                              Thành tiền
                            </th>
                            <th className="px-2 py-2 font-medium text-foreground text-left w-[140px]">
                              Ghi chú
                            </th>
                            <th className="w-20 px-2 py-2 text-center" aria-label="Thao tác" />
                          </tr>
                        </thead>
                        <tbody>
                          {lineItems.map((item, idx) => (
                            <tr key={item.id} className="border-b border-border last:border-b-0">
                              <td className="px-2 py-1.5 text-center align-top text-muted-foreground">
                                <span className="inline-flex items-center gap-0.5 font-medium">
                                  <GripVertical className="h-3 w-3 opacity-30" />
                                  {idx + 1}
                                </span>
                              </td>

                              {/* Khoản mục */}
                              <td className="px-1.5 py-1 align-top relative">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveCategoryDropdownIndex(
                                      activeCategoryDropdownIndex === idx ? null : idx
                                    )
                                  }
                                  className="w-full h-9 rounded-lg border border-border bg-background py-1 px-2 text-xs text-foreground flex items-center justify-between text-left"
                                >
                                  <span className="truncate">{item.category}</span>
                                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                </button>

                                {activeCategoryDropdownIndex === idx && (
                                  <div className="absolute left-1.5 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-lg py-1 z-30 max-h-40 overflow-y-auto">
                                    {CATEGORIES_LIST.map((cat) => (
                                      <button
                                        key={cat}
                                        type="button"
                                        onClick={() => {
                                          handleUpdateLineItem(idx, 'category', cat);
                                          setActiveCategoryDropdownIndex(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                                      >
                                        {cat}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </td>

                              {/* Diễn giải */}
                              <td className="px-1.5 py-1 align-top">
                                <input
                                  type="text"
                                  placeholder="Mô tả khoản mục..."
                                  value={item.description}
                                  onChange={(e) =>
                                    handleUpdateLineItem(idx, 'description', e.target.value)
                                  }
                                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                                />
                              </td>

                              {/* Số lượng */}
                              <td className="px-1.5 py-1 align-top">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleUpdateLineItem(idx, 'quantity', Number(e.target.value))
                                  }
                                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/30"
                                />
                              </td>

                              {/* Đơn giá */}
                              <td className="px-1.5 py-1 align-top relative">
                                <div className="relative">
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={item.unitPrice || ''}
                                    onChange={(e) =>
                                      handleUpdateLineItem(idx, 'unitPrice', Number(e.target.value))
                                    }
                                    className="h-9 w-full rounded-lg border border-border bg-background pl-2.5 pr-11 py-1 text-xs text-foreground text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/30"
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium pointer-events-none">
                                    VND
                                  </span>
                                </div>
                              </td>

                              {/* Thành tiền */}
                              <td className="px-2 py-2.5 align-middle tabular-nums text-foreground font-semibold text-right">
                                {formatCurrency(item.amount)}
                              </td>

                              {/* Ghi chú */}
                              <td className="px-1.5 py-1 align-top">
                                <input
                                  type="text"
                                  placeholder="..."
                                  value={item.note || ''}
                                  onChange={(e) =>
                                    handleUpdateLineItem(idx, 'note', e.target.value)
                                  }
                                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                                />
                              </td>

                              {/* Actions */}
                              <td className="px-2 py-1.5 align-top">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateLineItem(idx)}
                                    title="Nhân bản dòng"
                                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLineItem(idx)}
                                    title="Xoá dòng"
                                    disabled={lineItems.length <= 1}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-border bg-muted/30 font-semibold text-xs">
                            <td className="px-2 py-2 text-center text-muted-foreground">Σ</td>
                            <td className="px-2 py-2 text-left">Tổng cộng</td>
                            <td className="px-2 py-2" />
                            <td className="px-2 py-2" />
                            <td className="px-2 py-2" />
                            <td className="px-2 py-2 tabular-nums text-right text-primary font-bold">
                              {formatCurrency(totalCalculatedAmount)}
                            </td>
                            <td className="px-2 py-2" />
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm dòng
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="bg-card border-t border-border/60 flex items-center justify-between shadow-sticky shrink-0 w-full px-4 py-2 sm:px-5"
          style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg font-medium border border-border bg-background hover:bg-muted h-8 px-3 text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            Hủy
          </button>

          <button
            type="submit"
            form="de-xuat-chi-phi-form"
            className="inline-flex items-center justify-center rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm h-8 px-3 text-xs transition-all active:scale-95 gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>{initialData ? 'Lưu thay đổi' : 'Thêm'}</span>
          </button>
        </div>
      </div>
    </>
  );
};
