import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  CheckSquare,
  BookOpen,
  Wallet,
  Layers,
  Save,
  User,
  Clock,
  MapPin,
  Building2,
  DollarSign,
  Loader2,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CalendarEvent, CalendarEventPriority } from '../../types/calendar';
import { Task } from '../../types/task';
import { Note } from '../../types/note';
import { CashTransaction } from '../../types/cashTransaction';
import { CostProposal } from '../../types/cost-proposal';
import { Employee } from '../../types/employee';

import { calendarService } from '../../services/calendarService';
import { taskService } from '../../services/taskService';
import { noteService } from '../../services/noteService';
import { cashTransactionService } from '../../services/cashTransactionService';
import { googleSheetsService } from '../../services/googleSheetsService';
import { employeeService } from '../../services/employeeService';

export type EventModuleType = 'meeting' | 'task' | 'note' | 'cash' | 'proposal';

interface EventFormModalProps {
  isOpen: boolean;
  defaultDate?: string;
  defaultModule?: EventModuleType;
  onClose: () => void;
  onSave?: (event: CalendarEvent) => void;
  onSaveSuccess?: (message: string) => void;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  defaultDate,
  defaultModule = 'meeting',
  onClose,
  onSave,
  onSaveSuccess,
}) => {
  const [activeModule, setActiveModule] = useState<EventModuleType>(defaultModule);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common fields
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(defaultDate || new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('09:00');
  const [assigneeId, setAssigneeId] = useState('');
  const [assigneeName, setAssigneeName] = useState('');
  const [department, setDepartment] = useState('');
  const [priority, setPriority] = useState<CalendarEventPriority>('medium');
  const [description, setDescription] = useState('');

  // Module specific: Meeting
  const [categoryName, setCategoryName] = useState('Lịch họp nội bộ');
  const [location, setLocation] = useState('');

  // Module specific: Cash / Proposal
  const [cashType, setCashType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [account, setAccount] = useState('Quỹ tiền mặt');
  const [counterpartyName, setCounterpartyName] = useState('');

  // Module specific: Note
  const [noteCategory, setNoteCategory] = useState('Kế hoạch công việc');
  const [noteTag, setNoteTag] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [employees, setEmployees] = useState<Employee[]>(() =>
    employeeService.getInitialEmployees()
  );

  type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('normal');

  const toggleFullscreen = () => {
    if (widthMode === 'fullscreen') {
      setWidthMode(prevWidthMode || 'normal');
    } else {
      setPrevWidthMode(widthMode);
      setWidthMode('fullscreen');
    }
  };

  const getDrawerWidthStyle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return '100vw';
    }
    switch (widthMode) {
      case 'narrow':
        return 'min(540px, 100vw)';
      case 'normal':
        return 'min(768px, 100vw)';
      case 'wide':
        return 'min(1080px, 100vw)';
      case 'fullscreen':
        return '100vw';
      default:
        return 'min(768px, 100vw)';
    }
  };

  useEffect(() => {
    if (defaultDate) {
      setStartDate(defaultDate);
    }
    if (defaultModule) {
      setActiveModule(defaultModule);
    }
  }, [defaultDate, defaultModule, isOpen]);

  useEffect(() => {
    employeeService
      .fetchFromSheet()
      .then((res) => {
        if (res?.length) setEmployees(res);
      })
      .catch(() => {});
  }, []);

  if (!isOpen) return null;

  const handleSelectEmployee = (val: string) => {
    setAssigneeId(val);
    const emp = employees.find((e) => e.id === val || e.code === val || e.name === val);
    if (emp) {
      setAssigneeName(emp.name);
      if (emp.department) setDepartment(emp.department);
    } else {
      setAssigneeName(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrors({ title: 'Vui lòng nhập tiêu đề' });
      return;
    }
    if (!startDate) {
      setErrors({ startDate: 'Vui lòng chọn ngày' });
      return;
    }
    if ((activeModule === 'cash' || activeModule === 'proposal') && (!amount || Number(amount) <= 0)) {
      setErrors({ amount: 'Vui lòng nhập số tiền hợp lệ (> 0 đ)' });
      return;
    }

    setIsSubmitting(true);
    const matchedEmp = employees.find(
      (emp) => emp.id === assigneeId || emp.code === assigneeId || emp.name === assigneeName
    );

    try {
      if (activeModule === 'meeting') {
        // 1. Lịch họp & Sự kiện
        const payload: CalendarEvent = {
          id: 'custom_evt_' + Date.now(),
          title: title.trim(),
          startDate,
          time: time || undefined,
          allDay: !time,
          source: 'custom',
          categoryName: categoryName || 'Lịch họp nội bộ',
          badgeBg: 'bg-amber-500/10',
          badgeColor: 'text-amber-600',
          badgeBorder: 'border-amber-500/20',
          location: location.trim(),
          assigneeId: matchedEmp ? matchedEmp.id : undefined,
          assigneeCode: matchedEmp ? matchedEmp.code : undefined,
          assigneeName: matchedEmp ? matchedEmp.name : assigneeName.trim(),
          department: matchedEmp ? matchedEmp.department : department || undefined,
          priority,
          description: description.trim(),
        };
        calendarService.addCustomEvent(payload);
        if (onSave) onSave(payload);
        if (onSaveSuccess) onSaveSuccess(`Đã lưu lịch họp "${payload.title}"`);
      } else if (activeModule === 'task') {
        // 2. Công việc (Task)
        const newTask: Task = {
          id: 'task_' + Date.now(),
          code: 'CV-' + Math.floor(1000 + Math.random() * 9000),
          title: title.trim(),
          description: description.trim(),
          department: matchedEmp?.department || department || 'Kinh doanh',
          assignerName: 'Admin',
          assigneeName: matchedEmp?.name || assigneeName.trim() || 'Chưa phân công',
          assigneeId: matchedEmp?.id,
          assigneeCode: matchedEmp?.code,
          status: 'in_progress',
          priority: priority as any,
          progress: 0,
          startDate,
          dueDate: startDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const tasks = [newTask, ...taskService.getInitialTasks()];
        taskService.saveToCache(tasks);
        taskService.appendToSheet(newTask).catch(() => {});
        if (onSaveSuccess) onSaveSuccess(`Đã tạo Công việc mới: "${newTask.title}"`);
      } else if (activeModule === 'note') {
        // 3. Ghi chú (Note)
        const newNote: Note = {
          id: 'note_' + Date.now(),
          code: 'GC-' + Math.floor(1000 + Math.random() * 9000),
          title: title.trim(),
          noteDate: startDate,
          noteTime: time || '09:00',
          category: (noteCategory as any) || 'Kế hoạch công việc',
          content: description.trim() || title.trim(),
          tags: noteTag.trim() ? [noteTag.trim(), 'Lịch trình'] : ['Lịch trình', 'Công tác'],
          isPinned: false,
          author: matchedEmp?.name || assigneeName.trim() || 'Quản trị viên',
          authorId: matchedEmp?.id,
          authorCode: matchedEmp?.code,
          status: 'published',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const notes = [newNote, ...noteService.getInitialNotes()];
        noteService.saveToCache(notes);
        if (onSaveSuccess) onSaveSuccess(`Đã lưu Ghi chú: "${newNote.title}"`);
      } else if (activeModule === 'cash') {
        // 4. Thu / Chi (Cash Transaction)
        const numAmount = Math.abs(Number(amount)) || 0;
        const newTx: CashTransaction = {
          id: 'tx_' + Date.now(),
          code: (cashType === 'income' ? 'PT-' : 'PC-') + Math.floor(1000 + Math.random() * 9000),
          type: cashType,
          title: title.trim(),
          amount: numAmount,
          transactionDate: startDate,
          transactionTime: time || '09:00',
          category: cashType === 'income' ? 'Doanh thu bán hàng' : 'Chi phí hoạt động',
          account: account || 'Quỹ tiền mặt',
          paymentMethod: account.includes('Ngân hàng') ? 'bank_transfer' : 'cash',
          counterpartyType: 'customer',
          counterpartyName: counterpartyName.trim() || matchedEmp?.name || 'Đối tác',
          reason: description.trim() || title.trim(),
          status: 'completed',
          createdBy: 'Admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const txs = [newTx, ...cashTransactionService.getInitialTransactions()];
        cashTransactionService.saveToCache(txs);
        cashTransactionService.appendToSheet(newTx).catch(() => {});
        if (onSaveSuccess) {
          onSaveSuccess(
            `Đã tạo phiếu ${cashType === 'income' ? 'Thu' : 'Chi'} ${numAmount.toLocaleString('vi-VN')} đ`
          );
        }
      } else if (activeModule === 'proposal') {
        // 5. Đề xuất chi phí (Cost Proposal)
        const numAmount = Math.abs(Number(amount)) || 0;
        const newProposal: CostProposal = {
          id: 'prop_' + Date.now(),
          code: 'DX-' + Math.floor(1000 + Math.random() * 9000),
          title: title.trim(),
          amount: numAmount,
          proposalDate: startDate,
          dueDate: startDate,
          proposer: matchedEmp?.name || assigneeName.trim() || 'Người đề xuất',
          proposerId: matchedEmp?.id,
          proposerCode: matchedEmp?.code,
          department: matchedEmp?.department || department || 'Hành chính',
          account: account || 'Quỹ tiền mặt',
          reason: description.trim() || title.trim(),
          approvalStatus: 'pending',
          status: 'active',
          isOverBudget: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const props = [newProposal, ...googleSheetsService.getInitialProposals()];
        googleSheetsService.saveToCache(props);
        googleSheetsService.appendToSheet(newProposal).catch(() => {});
        if (onSaveSuccess) {
          onSaveSuccess(`Đã tạo Đề xuất chi phí: "${newProposal.title}" (${numAmount.toLocaleString('vi-VN')} đ)`);
        }
      }

      onClose();
    } catch (err) {
      console.error('Error saving item from calendar:', err);
      setErrors({ form: 'Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const MODULE_TABS: {
    id: EventModuleType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }[] = [
    { id: 'meeting', label: 'Lịch họp', icon: CalendarIcon, color: 'text-amber-500' },
    { id: 'task', label: 'Công việc', icon: CheckSquare, color: 'text-blue-500' },
    { id: 'note', label: 'Ghi chú', icon: BookOpen, color: 'text-purple-500' },
    { id: 'cash', label: 'Thu / Chi', icon: Wallet, color: 'text-emerald-500' },
    { id: 'proposal', label: 'Đề xuất CP', icon: Layers, color: 'text-teal-500' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full">
        <div
          className="relative bg-card border-l border-border shadow-2xl flex flex-col h-full transform transition-all duration-300 ease-in-out animate-in slide-in-from-right"
          style={{ width: getDrawerWidthStyle() }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight truncate">
                    Thêm mới vào Lịch biểu
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary shrink-0">
                    {activeModule === 'task'
                      ? 'Công việc'
                      : activeModule === 'note'
                      ? 'Ghi chú'
                      : activeModule === 'cash'
                      ? (cashType === 'income' ? 'Thu quỹ' : 'Chi quỹ')
                      : activeModule === 'proposal'
                      ? 'Đề xuất CP'
                      : 'Lịch họp'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  Tạo nhanh cho ngày {startDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Width Controls */}
              <div className="hidden sm:flex items-center border border-border rounded-lg bg-background p-0.5 mr-1">
                <button
                  type="button"
                  title="Gọn"
                  onClick={() => setWidthMode('narrow')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'narrow' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Chuẩn"
                  onClick={() => setWidthMode('normal')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'normal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Rộng"
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
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Module Selector Tabs */}
          <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-muted/20 shrink-0">
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60">
              {MODULE_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeModule === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveModule(tab.id);
                      setErrors({});
                    }}
                    className={`py-2 px-1.5 rounded-lg text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-card text-foreground shadow-xs border border-border font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? tab.color : ''}`} />
                    <span className="truncate text-[10px] sm:text-xs">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Body - Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 text-xs custom-scrollbar">
          {errors.form && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
              {errors.form}
            </div>
          )}

          {/* Special Toggle for Cash: Thu vs Chi */}
          {activeModule === 'cash' && (
            <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setCashType('income')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  cashType === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                + Phiếu Thu tiền
              </button>
              <button
                type="button"
                onClick={() => setCashType('expense')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  cashType === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                - Phiếu Chi tiền
              </button>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-semibold text-foreground mb-1">
              {activeModule === 'meeting' && 'Tiêu đề cuộc họp / Sự kiện *'}
              {activeModule === 'task' && 'Tên công việc / Nhiệm vụ *'}
              {activeModule === 'note' && 'Tiêu đề ghi chú / Kế hoạch *'}
              {activeModule === 'cash' && (cashType === 'income' ? 'Nội dung khoản thu *' : 'Nội dung khoản chi *')}
              {activeModule === 'proposal' && 'Tên đề xuất chi phí *'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors({});
              }}
              placeholder={
                activeModule === 'meeting'
                  ? 'VD: Họp giao ban, Hội thảo khách hàng...'
                  : activeModule === 'task'
                  ? 'VD: Hoàn thiện báo cáo, Thiết kế giao diện...'
                  : activeModule === 'note'
                  ? 'VD: Biên bản làm việc với đối tác, Ghi chép kỹ thuật...'
                  : activeModule === 'cash'
                  ? cashType === 'income'
                    ? 'VD: Thu tiền tạm ứng hợp đồng A, Thu bán hàng...'
                    : 'VD: Chi tiền mua văn phòng phẩm, Chi tiếp khách...'
                  : 'VD: Đề xuất nâng cấp thiết bị máy tính, Mua bản quyền...'
              }
              className={`w-full h-8 px-3 rounded-xl border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 ${
                errors.title ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border focus:ring-primary'
              }`}
            />
            {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
          </div>

          {/* Amount field for Cash and Proposal */}
          {(activeModule === 'cash' || activeModule === 'proposal') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Số tiền (VND) <span className="text-rose-500">*</span>:
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setErrors({});
                    }}
                    placeholder="VD: 5000000"
                    className={`w-full h-8 pl-8 pr-3 rounded-xl border bg-background text-xs font-semibold focus:outline-none focus:ring-1 ${
                      errors.amount ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border focus:ring-primary'
                    }`}
                  />
                </div>
                {amount && Number(amount) > 0 && (
                  <p className="text-[11px] text-primary font-medium mt-1">
                    Bằng chữ: {Number(amount).toLocaleString('vi-VN')} đ
                  </p>
                )}
                {errors.amount && <p className="text-[11px] text-rose-500 mt-1">{errors.amount}</p>}
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Tài khoản / Quỹ:
                </label>
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Quỹ tiền mặt">Quỹ tiền mặt</option>
                  <option value="Ngân hàng MB Bank">Ngân hàng MB Bank</option>
                  <option value="Ngân hàng Vietcombank">Ngân hàng Vietcombank</option>
                  <option value="Ngân hàng Techcombank">Ngân hàng Techcombank</option>
                  <option value="Ngân hàng ACB">Ngân hàng ACB</option>
                </select>
              </div>
            </div>
          )}

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">
                {activeModule === 'task' ? 'Hạn chót hoàn thành *' : 'Ngày diễn ra *'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setErrors({});
                }}
                className={`w-full h-8 px-3 rounded-xl border bg-background text-xs focus:outline-none focus:ring-1 ${
                  errors.startDate ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border focus:ring-primary'
                }`}
              />
              {errors.startDate && <p className="text-[11px] text-rose-500 mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                Thời gian (Giờ):
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Assignee / Contact Person Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">
                {activeModule === 'task' && 'Người phụ trách:'}
                {activeModule === 'meeting' && 'Người chủ trì / tham gia:'}
                {activeModule === 'note' && 'Tác giả ghi chú:'}
                {activeModule === 'cash' && (cashType === 'income' ? 'Người nộp tiền:' : 'Người nhận tiền:')}
                {activeModule === 'proposal' && 'Người đề xuất:'}
              </label>
              {activeModule === 'cash' ? (
                <input
                  type="text"
                  value={counterpartyName}
                  onChange={(e) => setCounterpartyName(e.target.value)}
                  placeholder="Tên khách hàng, NCC hoặc nhân viên..."
                  className="w-full h-8 px-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={assigneeId}
                    onChange={(e) => handleSelectEmployee(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} {emp.department ? `(${emp.department})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              {activeModule === 'meeting' ? (
                <div>
                  <label className="block font-semibold text-foreground mb-1">Phân loại cuộc họp:</label>
                  <select
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Lịch họp nội bộ">Lịch họp nội bộ</option>
                    <option value="Họp giao ban">Họp giao ban</option>
                    <option value="Đào tạo & Sự kiện">Đào tạo & Sự kiện</option>
                    <option value="Gặp khách hàng / Đối tác">Gặp khách hàng / Đối tác</option>
                  </select>
                </div>
              ) : activeModule === 'note' ? (
                <div>
                  <label className="block font-semibold text-foreground mb-1">Danh mục ghi chú:</label>
                  <select
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Kế hoạch công việc">Kế hoạch công việc</option>
                    <option value="Biên bản cuộc họp">Biên bản cuộc họp</option>
                    <option value="Nhật ký & Hoạt động">Nhật ký & Hoạt động</option>
                    <option value="Ghi chép cá nhân">Ghi chép cá nhân</option>
                    <option value="Tài liệu kỹ thuật">Tài liệu kỹ thuật</option>
                    <option value="Ý tưởng & Sáng kiến">Ý tưởng & Sáng kiến</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    {activeModule === 'task' ? 'Mức độ ưu tiên:' : 'Phòng ban liên quan:'}
                  </label>
                  {activeModule === 'task' ? (
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as CalendarEventPriority)}
                      className="w-full h-8 px-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                      <option value="urgent">Khẩn cấp</option>
                    </select>
                  ) : (
                    <div className="relative">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="VD: Kinh doanh, Kỹ thuật..."
                        className="w-full h-8 pl-8 pr-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Module-specific extra row */}
          {activeModule === 'meeting' && (
            <div>
              <label className="block font-semibold text-foreground mb-1">Địa điểm / Phòng họp:</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Phòng họp A1, Google Meet, Zoom..."
                  className="w-full h-8 pl-8 pr-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {activeModule === 'note' && (
            <div>
              <label className="block font-semibold text-foreground mb-1">Thẻ nhãn (Tag):</label>
              <input
                type="text"
                value={noteTag}
                onChange={(e) => setNoteTag(e.target.value)}
                placeholder="VD: quan-trong, ke-hoach-t10..."
                className="w-full h-8 px-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block font-semibold text-foreground mb-1">
              {activeModule === 'note' ? 'Nội dung chi tiết ghi chú:' : 'Mô tả chi tiết / Ghi chú:'}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập nội dung chi tiết hoặc hướng dẫn thực hiện..."
              className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none custom-scrollbar"
            />
          </div>

            </div>

            {/* Sticky Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-border bg-card flex items-center justify-end gap-2.5 shrink-0 shadow-xs">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-semibold transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      Lưu {activeModule === 'task' ? 'Công việc' : activeModule === 'note' ? 'Ghi chú' : activeModule === 'cash' ? (cashType === 'income' ? 'Phiếu thu' : 'Phiếu chi') : activeModule === 'proposal' ? 'Đề xuất CP' : 'Sự kiện'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const EventFormDrawer = EventFormModal;
