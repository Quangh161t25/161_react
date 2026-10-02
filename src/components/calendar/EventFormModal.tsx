import React, { useState, useEffect, useMemo } from 'react';
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
  FolderKanban,
  Plus,
  Trash2,
  Pin,
  Palette,
} from 'lucide-react';
import { CalendarEvent, CalendarEventPriority } from '../../types/calendar';
import { Task, TaskPriority, TaskStatus, TaskSubtask, Project } from '../../types/task';
import { Note, NoteCategory } from '../../types/note';
import { CashTransaction } from '../../types/cashTransaction';
import { CostProposal } from '../../types/cost-proposal';
import { Employee } from '../../types/employee';

import { calendarService } from '../../services/calendarService';
import { taskService, projectService } from '../../services/taskService';
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

const NOTE_CATEGORIES: NoteCategory[] = [
  'Biên bản cuộc họp',
  'Nhật ký & Hoạt động',
  'Ghi chép cá nhân',
  'Kế hoạch công việc',
  'Tài liệu kỹ thuật',
  'Hướng dẫn quy trình',
  'Ý tưởng & Sáng kiến',
  'Báo cáo thị trường',
];

const NOTE_COLORS = [
  { id: 'blue', label: 'Xanh dương', bg: 'bg-blue-500' },
  { id: 'emerald', label: 'Xanh ngọc', bg: 'bg-emerald-500' },
  { id: 'amber', label: 'Vàng cam', bg: 'bg-amber-500' },
  { id: 'purple', label: 'Tím', bg: 'bg-purple-500' },
  { id: 'rose', label: 'Đỏ hồng', bg: 'bg-rose-500' },
  { id: 'slate', label: 'Xám thép', bg: 'bg-slate-500' },
];

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Drawer Width Mode
  type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('wide');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('wide');

  // Master Data
  const [employees, setEmployees] = useState<Employee[]>(() =>
    employeeService.getInitialEmployees()
  );
  const [projects, setProjects] = useState<Project[]>(() =>
    projectService.getInitialProjects()
  );

  const departmentsList = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));
  }, [employees]);

  // Load latest employees & projects
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      employeeService.fetchFromSheet().catch(() => employeeService.getInitialEmployees()),
      projectService.fetchFromSheet().catch(() => projectService.getInitialProjects()),
    ]).then(([emps, projs]) => {
      if (isMounted) {
        if (emps?.length) setEmployees(emps);
        if (Array.isArray(projs)) setProjects(projs);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Meeting States
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('09:00');
  const [meetingAssigneeId, setMeetingAssigneeId] = useState('');
  const [meetingCategory, setMeetingCategory] = useState('Lịch họp nội bộ');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingPriority, setMeetingPriority] = useState<CalendarEventPriority>('medium');
  const [meetingDescription, setMeetingDescription] = useState('');

  // 2. Task States (Matching TaskFormDrawer / Image 2)
  const [taskCode, setTaskCode] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskDepartment, setTaskDepartment] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskAssignerId, setTaskAssignerId] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('todo');
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskProgress, setTaskProgress] = useState<number>(0);
  const [taskEstimatedHours, setTaskEstimatedHours] = useState<number>(8);
  const [taskSubtasks, setTaskSubtasks] = useState<TaskSubtask[]>([]);
  const [taskSubtaskInput, setTaskSubtaskInput] = useState('');
  const [taskTags, setTaskTags] = useState<string[]>(['Công việc']);
  const [taskTagInput, setTaskTagInput] = useState('');
  const [taskNote, setTaskNote] = useState('');

  // 3. Note States
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSummary, setNoteSummary] = useState('');
  const [noteCategory, setNoteCategory] = useState<NoteCategory>('Kế hoạch công việc');
  const [noteColor, setNoteColor] = useState('blue');
  const [noteAuthorId, setNoteAuthorId] = useState('');
  const [noteDate, setNoteDate] = useState('');
  const [noteTime, setNoteTime] = useState('09:00');
  const [noteLocation, setNoteLocation] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>(['Kế hoạch']);
  const [noteTagInput, setNoteTagInput] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteIsPinned, setNoteIsPinned] = useState(false);

  // 4. Cash States
  const [cashType, setCashType] = useState<'income' | 'expense'>('expense');
  const [cashCode, setCashCode] = useState('');
  const [cashTitle, setCashTitle] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashAccount, setCashAccount] = useState('Quỹ tiền mặt');
  const [cashCategory, setCashCategory] = useState('Chi phí hoạt động');
  const [cashDate, setCashDate] = useState('');
  const [cashTime, setCashTime] = useState('09:00');
  const [cashCounterparty, setCashCounterparty] = useState('');
  const [cashAssigneeId, setCashAssigneeId] = useState('');
  const [cashDescription, setCashDescription] = useState('');

  // 5. Proposal States
  const [proposalCode, setProposalCode] = useState('');
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalAmount, setProposalAmount] = useState('');
  const [proposalDepartment, setProposalDepartment] = useState('');
  const [proposalAccount, setProposalAccount] = useState('Quỹ tiền mặt');
  const [proposalDate, setProposalDate] = useState('');
  const [proposalDueDate, setProposalDueDate] = useState('');
  const [proposalProposerId, setProposalProposerId] = useState('');
  const [proposalReason, setProposalReason] = useState('');
  const [proposalNote, setProposalNote] = useState('');

  // Initialize dates and codes on open or date change
  useEffect(() => {
    if (!isOpen) return;

    if (defaultModule) {
      setActiveModule(defaultModule);
    }

    const now = new Date();
    const today = defaultDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nextWeekDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextWeek = `${nextWeekDate.getFullYear()}-${String(nextWeekDate.getMonth() + 1).padStart(2, '0')}-${String(nextWeekDate.getDate()).padStart(2, '0')}`;

    // Common dates
    setMeetingDate(today);
    setTaskStartDate(today);
    setTaskDueDate(defaultDate || nextWeek);
    setNoteDate(today);
    setCashDate(today);
    setProposalDate(today);
    setProposalDueDate(defaultDate || nextWeek);

    // Initial Task Code
    const allTasks = taskService.getInitialTasks();
    setTaskCode(`CV-${String(allTasks.length + 1).padStart(3, '0')}`);

    // Initial Cash Code
    const allTxs = cashTransactionService.getInitialTransactions();
    setCashCode(`${cashType === 'income' ? 'PT' : 'PC'}-${String(allTxs.length + 1).padStart(3, '0')}`);

    // Initial Proposal Code
    const allProps = googleSheetsService.getInitialProposals();
    setProposalCode(`CP-${String(allProps.length + 1).padStart(3, '0')}`);

    // Initial defaults for employees
    if (employees.length > 0) {
      const defaultEmpId = employees[0].id;
      setMeetingAssigneeId(defaultEmpId);
      setTaskAssigneeId(defaultEmpId);
      setTaskAssignerId(defaultEmpId);
      setNoteAuthorId(defaultEmpId);
      setCashAssigneeId(defaultEmpId);
      setProposalProposerId(defaultEmpId);
      setTaskDepartment(employees[0].department || 'Phòng Kỹ thuật & CNTT');
      setProposalDepartment(employees[0].department || 'Phòng Kỹ thuật & CNTT');
    }
  }, [isOpen, defaultDate, defaultModule, employees]);

  // Update cash code when toggle Thu / Chi
  useEffect(() => {
    const allTxs = cashTransactionService.getInitialTransactions();
    setCashCode(`${cashType === 'income' ? 'PT' : 'PC'}-${String(allTxs.length + 1).padStart(3, '0')}`);
    setCashCategory(cashType === 'income' ? 'Doanh thu bán hàng' : 'Chi phí hoạt động');
  }, [cashType]);

  const toggleFullscreen = () => {
    if (widthMode === 'fullscreen') {
      setWidthMode(prevWidthMode || 'wide');
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
        return 'min(1080px, 100vw)';
    }
  };

  if (!isOpen) return null;

  // Task Subtasks handlers
  const handleAddTaskSubtask = () => {
    if (!taskSubtaskInput.trim()) return;
    setTaskSubtasks([
      ...taskSubtasks,
      {
        id: 'st_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        title: taskSubtaskInput.trim(),
        completed: false,
      },
    ]);
    setTaskSubtaskInput('');
  };

  const handleRemoveTaskSubtask = (id: string) => {
    setTaskSubtasks(taskSubtasks.filter((s) => s.id !== id));
  };

  const handleToggleTaskSubtask = (id: string) => {
    const updated = taskSubtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s));
    setTaskSubtasks(updated);
    if (updated.length > 0) {
      const doneCount = updated.filter((s) => s.completed).length;
      setTaskProgress(Math.round((doneCount / updated.length) * 100));
    }
  };

  // Task Tags handlers
  const handleAddTaskTag = () => {
    const trimmed = taskTagInput.trim().replace(/^#/, '');
    if (trimmed && !taskTags.includes(trimmed)) {
      setTaskTags([...taskTags, trimmed]);
    }
    setTaskTagInput('');
  };

  const handleRemoveTaskTag = (tag: string) => {
    setTaskTags(taskTags.filter((t) => t !== tag));
  };

  // Note Tags handlers
  const handleAddNoteTag = () => {
    const trimmed = noteTagInput.trim().replace(/^#/, '');
    if (trimmed && !noteTags.includes(trimmed)) {
      setNoteTags([...noteTags, trimmed]);
    }
    setNoteTagInput('');
  };

  const handleRemoveNoteTag = (tag: string) => {
    setNoteTags(noteTags.filter((t) => t !== tag));
  };

  // Handle Form Submit for Active Module
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      if (activeModule === 'meeting') {
        if (!meetingTitle.trim()) {
          setErrors({ meetingTitle: 'Vui lòng nhập tiêu đề cuộc họp / sự kiện' });
          setIsSubmitting(false);
          return;
        }
        const matchedEmp = employees.find((x) => x.id === meetingAssigneeId);
        const payload: CalendarEvent = {
          id: 'custom_evt_' + Date.now(),
          title: meetingTitle.trim(),
          startDate: meetingDate || new Date().toISOString().slice(0, 10),
          time: meetingTime || undefined,
          allDay: !meetingTime,
          source: 'custom',
          categoryName: meetingCategory || 'Lịch họp nội bộ',
          badgeBg: 'bg-amber-500/10',
          badgeColor: 'text-amber-600',
          badgeBorder: 'border-amber-500/20',
          location: meetingLocation.trim(),
          assigneeId: matchedEmp ? matchedEmp.id : undefined,
          assigneeCode: matchedEmp ? matchedEmp.code : undefined,
          assigneeName: matchedEmp ? matchedEmp.name : undefined,
          department: matchedEmp ? matchedEmp.department : undefined,
          priority: meetingPriority,
          description: meetingDescription.trim(),
        };
        calendarService.addCustomEvent(payload);
        if (onSave) onSave(payload);
        if (onSaveSuccess) onSaveSuccess(`Đã lưu lịch họp "${payload.title}"`);
      } else if (activeModule === 'task') {
        if (!taskTitle.trim()) {
          setErrors({ taskTitle: 'Vui lòng nhập tên / tiêu đề công việc' });
          setIsSubmitting(false);
          return;
        }
        const assignedEmp = employees.find((e) => e.id === taskAssigneeId);
        const assignerEmp = employees.find((e) => e.id === taskAssignerId);
        const newTask: Task = {
          id: 'task_' + Date.now(),
          code: taskCode.trim() || `CV-${Math.floor(1000 + Math.random() * 9000)}`,
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          projectId: taskProjectId || undefined,
          department: taskDepartment || assignedEmp?.department || 'Phòng Kỹ thuật & CNTT',
          assignerId: assignerEmp?.id,
          assignerCode: assignerEmp?.code,
          assignerName: assignerEmp?.name || 'Admin',
          assigneeId: assignedEmp?.id,
          assigneeCode: assignedEmp?.code,
          assigneeName: assignedEmp?.name || 'Chưa phân công',
          priority: taskPriority,
          status: taskStatus,
          startDate: taskStartDate || new Date().toISOString().slice(0, 10),
          dueDate: taskDueDate || new Date().toISOString().slice(0, 10),
          progress: taskProgress,
          estimatedHours: taskEstimatedHours,
          subtasks: taskSubtasks,
          tags: taskTags,
          note: taskNote,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const tasks = [newTask, ...taskService.getInitialTasks()];
        taskService.saveToCache(tasks);
        taskService.appendToSheet(newTask).catch(() => {});
        if (onSaveSuccess) onSaveSuccess(`Đã tạo Công việc mới: "${newTask.title}"`);
      } else if (activeModule === 'note') {
        if (!noteTitle.trim()) {
          setErrors({ noteTitle: 'Vui lòng nhập tiêu đề ghi chú' });
          setIsSubmitting(false);
          return;
        }
        const authorEmp = employees.find((e) => e.id === noteAuthorId);
        const newNote: Note = {
          id: 'note_' + Date.now(),
          code: 'GC-' + Math.floor(1000 + Math.random() * 9000),
          title: noteTitle.trim(),
          summary: noteSummary.trim(),
          content: noteContent.trim() || noteSummary.trim() || noteTitle.trim(),
          category: noteCategory,
          color: noteColor,
          isPinned: noteIsPinned,
          author: authorEmp?.name || 'Người dùng',
          authorId: authorEmp?.id,
          authorCode: authorEmp?.code,
          authorAvatar: authorEmp?.avatarUrl || '',
          noteDate: noteDate || new Date().toISOString().slice(0, 10),
          noteTime: noteTime || '09:00',
          location: noteLocation.trim(),
          tags: noteTags,
          status: 'published',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const notes = [newNote, ...noteService.getInitialNotes()];
        noteService.saveToLocalCache(notes);
        if (onSaveSuccess) onSaveSuccess(`Đã lưu Ghi chú: "${newNote.title}"`);
      } else if (activeModule === 'cash') {
        if (!cashTitle.trim()) {
          setErrors({ cashTitle: 'Vui lòng nhập nội dung khoản thu / chi' });
          setIsSubmitting(false);
          return;
        }
        const numAmount = Math.abs(Number(cashAmount)) || 0;
        if (numAmount <= 0) {
          setErrors({ cashAmount: 'Vui lòng nhập số tiền hợp lệ (> 0 đ)' });
          setIsSubmitting(false);
          return;
        }
        const creatorEmp = employees.find((e) => e.id === cashAssigneeId);
        const newTx: CashTransaction = {
          id: 'tx_' + Date.now(),
          code: cashCode.trim() || `${cashType === 'income' ? 'PT' : 'PC'}-${Math.floor(1000 + Math.random() * 9000)}`,
          type: cashType,
          title: cashTitle.trim(),
          amount: numAmount,
          transactionDate: cashDate || new Date().toISOString().slice(0, 10),
          transactionTime: cashTime || '09:00',
          category: cashCategory,
          account: cashAccount,
          paymentMethod: cashAccount.includes('Ngân hàng') ? 'bank_transfer' : 'cash',
          counterpartyType: 'customer',
          counterpartyName: cashCounterparty.trim() || 'Đối tác',
          reason: cashDescription.trim() || cashTitle.trim(),
          status: 'completed',
          createdBy: creatorEmp?.name || 'Admin',
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
        if (!proposalTitle.trim()) {
          setErrors({ proposalTitle: 'Vui lòng nhập tên đề xuất chi phí' });
          setIsSubmitting(false);
          return;
        }
        const numAmount = Math.abs(Number(proposalAmount)) || 0;
        if (numAmount <= 0) {
          setErrors({ proposalAmount: 'Vui lòng nhập số tiền đề xuất hợp lệ (> 0 đ)' });
          setIsSubmitting(false);
          return;
        }
        const proposerEmp = employees.find((e) => e.id === proposalProposerId);
        const newProposal: CostProposal = {
          id: 'prop_' + Date.now(),
          code: proposalCode.trim() || `CP-${Math.floor(1000 + Math.random() * 9000)}`,
          title: proposalTitle.trim(),
          amount: numAmount,
          proposalDate: proposalDate || new Date().toISOString().slice(0, 10),
          dueDate: proposalDueDate || new Date().toISOString().slice(0, 10),
          proposer: proposerEmp?.name || 'Người đề xuất',
          proposerId: proposerEmp?.id,
          proposerCode: proposerEmp?.code,
          department: proposalDepartment || proposerEmp?.department || 'Ban Giám Đốc',
          account: proposalAccount,
          reason: proposalReason.trim() || proposalTitle.trim(),
          approvalStatus: 'pending',
          status: 'active',
          isOverBudget: false,
          note: proposalNote.trim(),
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
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-hidden">
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
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      activeModule === 'task'
                        ? 'bg-blue-500/10 text-blue-600'
                        : activeModule === 'note'
                        ? 'bg-purple-500/10 text-purple-600'
                        : activeModule === 'cash'
                        ? cashType === 'income'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-rose-500/10 text-rose-600'
                        : activeModule === 'proposal'
                        ? 'bg-teal-500/10 text-teal-600'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    {activeModule === 'task'
                      ? 'Công việc'
                      : activeModule === 'note'
                      ? 'Ghi chú'
                      : activeModule === 'cash'
                      ? cashType === 'income'
                        ? 'Thu quỹ'
                        : 'Chi quỹ'
                      : activeModule === 'proposal'
                      ? 'Đề xuất CP'
                      : 'Lịch họp'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  Tạo nhanh cho ngày{' '}
                  {activeModule === 'task'
                    ? taskDueDate || taskStartDate
                    : activeModule === 'meeting'
                    ? meetingDate
                    : activeModule === 'note'
                    ? noteDate
                    : activeModule === 'cash'
                    ? cashDate
                    : proposalDate || defaultDate || new Date().toISOString().slice(0, 10)}
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
                    widthMode === 'narrow'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Vừa"
                  onClick={() => setWidthMode('normal')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'normal'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Rộng"
                  onClick={() => setWidthMode('wide')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'wide'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRightOpen className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={widthMode === 'fullscreen' ? 'Thu nhỏ' : 'Toàn màn hình'}
                  onClick={toggleFullscreen}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'fullscreen'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
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

          {/* Module Selector Tabs - Clicking simply switches the form below! */}
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

              {/* ============================================================== */}
              {/* 1. LỊCH HỌP & SỰ KIỆN                                         */}
              {/* ============================================================== */}
              {activeModule === 'meeting' && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  {/* Meeting Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">
                      Tiêu đề cuộc họp / Sự kiện <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={meetingTitle}
                      onChange={(e) => {
                        setMeetingTitle(e.target.value);
                        setErrors((prev) => ({ ...prev, meetingTitle: '' }));
                      }}
                      placeholder="VD: Họp giao ban, Hội thảo khách hàng..."
                      className={`w-full h-9 px-3 rounded-lg border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                        errors.meetingTitle ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border'
                      }`}
                    />
                    {errors.meetingTitle && (
                      <p className="text-[11px] text-rose-500">{errors.meetingTitle}</p>
                    )}
                  </div>

                  {/* Date & Time Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">
                        Ngày diễn ra <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Thời gian (Giờ):</label>
                      <div className="relative">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="time"
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Host & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" />
                        Người chủ trì / tham gia:
                      </label>
                      <select
                        value={meetingAssigneeId}
                        onChange={(e) => setMeetingAssigneeId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">-- Chọn nhân viên --</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} {emp.department ? `(${emp.department})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Phân loại cuộc họp:</label>
                      <select
                        value={meetingCategory}
                        onChange={(e) => setMeetingCategory(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="Lịch họp nội bộ">Lịch họp nội bộ</option>
                        <option value="Họp giao ban">Họp giao ban</option>
                        <option value="Đào tạo & Sự kiện">Đào tạo & Sự kiện</option>
                        <option value="Gặp khách hàng / Đối tác">Gặp khách hàng / Đối tác</option>
                      </select>
                    </div>
                  </div>

                  {/* Location & Priority */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        Địa điểm / Phòng họp:
                      </label>
                      <input
                        type="text"
                        value={meetingLocation}
                        onChange={(e) => setMeetingLocation(e.target.value)}
                        placeholder="Phòng họp A1, Google Meet, Zoom..."
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Mức độ ưu tiên:</label>
                      <select
                        value={meetingPriority}
                        onChange={(e) => setMeetingPriority(e.target.value as CalendarEventPriority)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="low">Thấp</option>
                        <option value="medium">Trung bình</option>
                        <option value="high">Cao</option>
                        <option value="urgent">Khẩn cấp</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Mô tả chi tiết / Ghi chú:</label>
                    <textarea
                      rows={3}
                      value={meetingDescription}
                      onChange={(e) => setMeetingDescription(e.target.value)}
                      placeholder="Nhập nội dung chi tiết hoặc hướng dẫn thực hiện..."
                      className="w-full p-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* 2. CÔNG VIỆC (TASK) - FULL RICH FIELDS EXACT MATCH IMAGE 2       */}
              {/* ============================================================== */}
              {activeModule === 'task' && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  {/* Row 1: Mã công việc & Tiêu đề */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">
                        Mã công việc <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={taskCode}
                        onChange={(e) => setTaskCode(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary font-bold text-primary"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-foreground">
                        Tên / Tiêu đề công việc <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={taskTitle}
                        onChange={(e) => {
                          setTaskTitle(e.target.value);
                          setErrors((prev) => ({ ...prev, taskTitle: '' }));
                        }}
                        placeholder="VD: Thiết kế giao diện báo cáo doanh thu..."
                        className={`w-full h-9 px-3 rounded-lg border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                          errors.taskTitle ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border'
                        }`}
                      />
                      {errors.taskTitle && (
                        <p className="text-[11px] text-rose-500">{errors.taskTitle}</p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">
                      Mô tả chi tiết nội dung công việc
                    </label>
                    <textarea
                      rows={3}
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder="Mô tả mục tiêu, yêu cầu đầu ra và tài liệu đính kèm..."
                      className="w-full p-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Row 3: Dự án & Phòng ban */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-muted/20">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <FolderKanban className="w-3.5 h-3.5 text-purple-500" />
                        Dự án trực thuộc
                      </label>
                      <select
                        value={taskProjectId}
                        onChange={(e) => setTaskProjectId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">(Không thuộc dự án nào)</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.code}] {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-500" />
                        Phòng ban phụ trách
                      </label>
                      <input
                        type="text"
                        list="task-dept-list-modal"
                        value={taskDepartment}
                        onChange={(e) => setTaskDepartment(e.target.value)}
                        placeholder="Chọn hoặc nhập phòng ban..."
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <datalist id="task-dept-list-modal">
                        {departmentsList.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Row 4: Người thực hiện & Người giao việc */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-muted/20">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" />
                        Người thực hiện chính <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={taskAssigneeId}
                        onChange={(e) => {
                          setTaskAssigneeId(e.target.value);
                          const emp = employees.find((x) => x.id === e.target.value);
                          if (emp?.department && !taskDepartment) {
                            setTaskDepartment(emp.department);
                          }
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Chọn nhân sự phụ trách...</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} {emp.code ? `(${emp.code})` : ''} - {emp.department}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        Người giao việc
                      </label>
                      <select
                        value={taskAssignerId}
                        onChange={(e) => setTaskAssignerId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Chọn người giao việc...</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} {emp.code ? `(${emp.code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 5: Priority, Status, Start Date, Deadline */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Mức độ ưu tiên</label>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                        className="w-full h-9 px-2 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="urgent">🔴 Khẩn cấp</option>
                        <option value="high">🟠 Ưu tiên cao</option>
                        <option value="medium">🔵 Trung bình</option>
                        <option value="low">⚪ Thấp</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Trạng thái</label>
                      <select
                        value={taskStatus}
                        onChange={(e) => {
                          const st = e.target.value as TaskStatus;
                          setTaskStatus(st);
                          if (st === 'completed') setTaskProgress(100);
                        }}
                        className="w-full h-9 px-2 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="todo">Chưa thực hiện</option>
                        <option value="in_progress">Đang thực hiện</option>
                        <option value="review">Chờ duyệt / Nghiệm thu</option>
                        <option value="completed">Đã hoàn thành</option>
                        <option value="cancelled">Tạm hoãn / Huỷ</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Ngày bắt đầu</label>
                      <input
                        type="date"
                        value={taskStartDate}
                        onChange={(e) => setTaskStartDate(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">
                        Hạn chót (Deadline) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 6: Progress Slider & Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl border border-border bg-card">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">Tiến độ hoàn thành:</span>
                        <span className="font-bold text-primary tabular-nums">{taskProgress}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={taskProgress}
                        onChange={(e) => setTaskProgress(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        Số giờ ước tính (Hours)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={taskEstimatedHours}
                        onChange={(e) => setTaskEstimatedHours(Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Row 7: Checklist Builder */}
                  <div className="space-y-3 p-3.5 rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-primary" />
                        <span>Danh sách nhiệm vụ con (Checklist)</span>
                      </label>
                      <span className="text-[11px] text-muted-foreground">
                        {taskSubtasks.filter((s) => s.completed).length}/{taskSubtasks.length} xong
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={taskSubtaskInput}
                        onChange={(e) => setTaskSubtaskInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTaskSubtask();
                          }
                        }}
                        placeholder="Nhập tên việc con và nhấn Enter..."
                        className="flex-1 h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddTaskSubtask}
                        className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm</span>
                      </button>
                    </div>

                    {taskSubtasks.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {taskSubtasks.map((st) => (
                          <div
                            key={st.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-xs"
                          >
                            <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                              <input
                                type="checkbox"
                                checked={st.completed}
                                onChange={() => handleToggleTaskSubtask(st.id)}
                                className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                              />
                              <span
                                className={`truncate ${
                                  st.completed ? 'line-through text-muted-foreground' : 'text-foreground font-medium'
                                }`}
                              >
                                {st.title}
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveTaskSubtask(st.id)}
                              className="text-muted-foreground hover:text-rose-500 p-1 rounded transition-colors"
                              title="Xoá việc con"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Row 8: Tags */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Nhãn phân loại (Tags)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={taskTagInput}
                        onChange={(e) => setTaskTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTaskTag();
                          }
                        }}
                        placeholder="VD: UI/UX, Báo cáo, Backend..."
                        className="flex-1 h-8 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddTaskTag}
                        className="h-8 px-2.5 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-semibold"
                      >
                        Thêm tag
                      </button>
                    </div>

                    {taskTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {taskTags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20"
                          >
                            #{t}
                            <button
                              type="button"
                              onClick={() => handleRemoveTaskTag(t)}
                              className="hover:text-rose-500 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Row 9: Ghi chú bổ sung */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Ghi chú bổ sung</label>
                    <input
                      type="text"
                      value={taskNote}
                      onChange={(e) => setTaskNote(e.target.value)}
                      placeholder="Ghi chú nội bộ hoặc yêu cầu nghiệm thu..."
                      className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* 3. GHI CHÚ (NOTE)                                             */}
              {/* ============================================================== */}
              {activeModule === 'note' && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">
                      Tiêu đề ghi chú <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => {
                        setNoteTitle(e.target.value);
                        setErrors((prev) => ({ ...prev, noteTitle: '' }));
                      }}
                      placeholder="VD: Biên bản cuộc họp ban giám đốc, Kế hoạch triển khai..."
                      className={`w-full h-9 px-3 rounded-lg border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                        errors.noteTitle ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border'
                      }`}
                    />
                    {errors.noteTitle && <p className="text-[11px] text-rose-500">{errors.noteTitle}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Tóm tắt ngắn gọn</label>
                    <input
                      type="text"
                      value={noteSummary}
                      onChange={(e) => setNoteSummary(e.target.value)}
                      placeholder="Tóm tắt ý chính của ghi chú..."
                      className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Danh mục ghi chú</label>
                      <select
                        value={noteCategory}
                        onChange={(e) => setNoteCategory(e.target.value as NoteCategory)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {NOTE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" />
                        Tác giả ghi chú
                      </label>
                      <select
                        value={noteAuthorId}
                        onChange={(e) => setNoteAuthorId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} {emp.department ? `(${emp.department})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Ngày ghi chú</label>
                      <input
                        type="date"
                        value={noteDate}
                        onChange={(e) => setNoteDate(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Thời gian</label>
                      <input
                        type="time"
                        value={noteTime}
                        onChange={(e) => setNoteTime(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Địa điểm</label>
                      <input
                        type="text"
                        value={noteLocation}
                        onChange={(e) => setNoteLocation(e.target.value)}
                        placeholder="Văn phòng, Phòng họp..."
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Note Color Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-purple-500" />
                      Màu sắc chủ đề
                    </label>
                    <div className="flex items-center gap-2">
                      {NOTE_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setNoteColor(c.id)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${c.bg} ${
                            noteColor === c.id ? 'ring-2 ring-primary ring-offset-2 scale-110 shadow-sm' : 'opacity-70 hover:opacity-100'
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Note Content */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Nội dung chi tiết ghi chú</label>
                    <textarea
                      rows={5}
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Nhập nội dung biên bản, nhật ký, hướng dẫn..."
                      className="w-full p-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary custom-scrollbar"
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Thẻ phân loại (Tags)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={noteTagInput}
                        onChange={(e) => setNoteTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNoteTag();
                          }
                        }}
                        placeholder="VD: ke-hoach, quan-trong..."
                        className="flex-1 h-8 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddNoteTag}
                        className="h-8 px-2.5 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-semibold"
                      >
                        Thêm tag
                      </button>
                    </div>
                    {noteTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {noteTags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 text-[11px] font-medium bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full border border-purple-500/20"
                          >
                            #{t}
                            <button
                              type="button"
                              onClick={() => handleRemoveNoteTag(t)}
                              className="hover:text-rose-500 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pin Option */}
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={noteIsPinned}
                      onChange={(e) => setNoteIsPinned(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-medium text-foreground flex items-center gap-1">
                      <Pin className="w-3.5 h-3.5 text-amber-500" />
                      Ghim lên đầu trang
                    </span>
                  </label>
                </div>
              )}

              {/* ============================================================== */}
              {/* 4. THU / CHI (CASH TRANSACTION)                               */}
              {/* ============================================================== */}
              {activeModule === 'cash' && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  {/* Toggle Thu vs Chi */}
                  <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-xl border border-border">
                    <button
                      type="button"
                      onClick={() => setCashType('income')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
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
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        cashType === 'expense'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      - Phiếu Chi tiền
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">
                        Mã phiếu <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cashCode}
                        onChange={(e) => setCashCode(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card font-mono text-xs font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-foreground">
                        {cashType === 'income' ? 'Nội dung khoản thu *' : 'Nội dung khoản chi *'}
                      </label>
                      <input
                        type="text"
                        value={cashTitle}
                        onChange={(e) => {
                          setCashTitle(e.target.value);
                          setErrors((prev) => ({ ...prev, cashTitle: '' }));
                        }}
                        placeholder={
                          cashType === 'income'
                            ? 'VD: Thu tiền tạm ứng hợp đồng A, Thu bán hàng...'
                            : 'VD: Chi tiền mua văn phòng phẩm, Chi tiếp khách...'
                        }
                        className={`w-full h-9 px-3 rounded-lg border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                          errors.cashTitle ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border'
                        }`}
                      />
                      {errors.cashTitle && <p className="text-[11px] text-rose-500">{errors.cashTitle}</p>}
                    </div>
                  </div>

                  {/* Amount & Account */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">
                        Số tiền (VND) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          value={cashAmount}
                          onChange={(e) => {
                            setCashAmount(e.target.value);
                            setErrors((prev) => ({ ...prev, cashAmount: '' }));
                          }}
                          placeholder="VD: 5000000"
                          className={`w-full h-9 pl-8 pr-3 rounded-lg border bg-card text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary ${
                            errors.cashAmount ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border'
                          }`}
                        />
                      </div>
                      {cashAmount && Number(cashAmount) > 0 && (
                        <p className="text-[11px] text-primary font-medium mt-1">
                          Bằng chữ: {Number(cashAmount).toLocaleString('vi-VN')} đ
                        </p>
                      )}
                      {errors.cashAmount && <p className="text-[11px] text-rose-500">{errors.cashAmount}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Tài khoản / Quỹ tiền:</label>
                      <select
                        value={cashAccount}
                        onChange={(e) => setCashAccount(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="Quỹ tiền mặt">Quỹ tiền mặt</option>
                        <option value="Ngân hàng MB Bank">Ngân hàng MB Bank</option>
                        <option value="Ngân hàng Vietcombank">Ngân hàng Vietcombank</option>
                        <option value="Ngân hàng Techcombank">Ngân hàng Techcombank</option>
                        <option value="Ngân hàng ACB">Ngân hàng ACB</option>
                      </select>
                    </div>
                  </div>

                  {/* Category & Counterparty */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Hạng mục thu / chi:</label>
                      <select
                        value={cashCategory}
                        onChange={(e) => setCashCategory(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {cashType === 'income' ? (
                          <>
                            <option value="Doanh thu bán hàng">Doanh thu bán hàng</option>
                            <option value="Thu tiền tạm ứng">Thu hoàn tạm ứng</option>
                            <option value="Thu công nợ khách hàng">Thu công nợ khách hàng</option>
                            <option value="Thu lãi tiền gửi">Thu lãi tiền gửi</option>
                            <option value="Thu khác">Thu khác</option>
                          </>
                        ) : (
                          <>
                            <option value="Chi phí hoạt động">Chi phí hoạt động</option>
                            <option value="Chi mua sắm trang thiết bị">Chi mua sắm trang thiết bị</option>
                            <option value="Chi tiếp khách & Công tác">Chi tiếp khách & Công tác</option>
                            <option value="Chi lương & Phúc lợi">Chi lương & Phúc lợi</option>
                            <option value="Chi trả nợ nhà cung cấp">Chi trả nợ nhà cung cấp</option>
                            <option value="Chi khác">Chi khác</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">
                        {cashType === 'income' ? 'Người nộp tiền / Đối tác:' : 'Người nhận tiền / Đối tác:'}
                      </label>
                      <input
                        type="text"
                        value={cashCounterparty}
                        onChange={(e) => setCashCounterparty(e.target.value)}
                        placeholder="Tên khách hàng, NCC hoặc nhân viên..."
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Date & Submitter */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Ngày & Giờ giao dịch</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={cashDate}
                          onChange={(e) => setCashDate(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <input
                          type="time"
                          value={cashTime}
                          onChange={(e) => setCashTime(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" />
                        Người lập phiếu
                      </label>
                      <select
                        value={cashAssigneeId}
                        onChange={(e) => setCashAssigneeId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} {emp.department ? `(${emp.department})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Diễn giải / Ghi chú chi tiết</label>
                    <textarea
                      rows={3}
                      value={cashDescription}
                      onChange={(e) => setCashDescription(e.target.value)}
                      placeholder="Mô tả lý do thu chi, số hóa đơn chứng từ..."
                      className="w-full p-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* 5. ĐỀ XUẤT CHI PHÍ (PROPOSAL)                                 */}
              {/* ============================================================== */}
              {activeModule === 'proposal' && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">
                        Mã đề xuất <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={proposalCode}
                        onChange={(e) => setProposalCode(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card font-mono text-xs font-bold text-teal-600 focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-foreground">
                        Tên đề xuất chi phí <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={proposalTitle}
                        onChange={(e) => {
                          setProposalTitle(e.target.value);
                          setErrors((prev) => ({ ...prev, proposalTitle: '' }));
                        }}
                        placeholder="VD: Mua bản quyền phần mềm thiết kế, Nâng cấp máy tính..."
                        className={`w-full h-9 px-3 rounded-lg border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                          errors.proposalTitle ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border'
                        }`}
                      />
                      {errors.proposalTitle && (
                        <p className="text-[11px] text-rose-500">{errors.proposalTitle}</p>
                      )}
                    </div>
                  </div>

                  {/* Amount & Account */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">
                        Số tiền đề xuất (VND) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          value={proposalAmount}
                          onChange={(e) => {
                            setProposalAmount(e.target.value);
                            setErrors((prev) => ({ ...prev, proposalAmount: '' }));
                          }}
                          placeholder="VD: 15000000"
                          className={`w-full h-9 pl-8 pr-3 rounded-lg border bg-card text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary ${
                            errors.proposalAmount ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border'
                          }`}
                        />
                      </div>
                      {proposalAmount && Number(proposalAmount) > 0 && (
                        <p className="text-[11px] text-teal-600 font-medium mt-1">
                          Bằng chữ: {Number(proposalAmount).toLocaleString('vi-VN')} đ
                        </p>
                      )}
                      {errors.proposalAmount && (
                        <p className="text-[11px] text-rose-500">{errors.proposalAmount}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Tài khoản dự kiến chi:</label>
                      <select
                        value={proposalAccount}
                        onChange={(e) => setProposalAccount(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="Quỹ tiền mặt">Quỹ tiền mặt</option>
                        <option value="Ngân hàng MB Bank">Ngân hàng MB Bank</option>
                        <option value="Ngân hàng Vietcombank">Ngân hàng Vietcombank</option>
                        <option value="Ngân hàng Techcombank">Ngân hàng Techcombank</option>
                      </select>
                    </div>
                  </div>

                  {/* Department & Proposer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-500" />
                        Phòng ban đề xuất
                      </label>
                      <input
                        type="text"
                        list="proposal-dept-list"
                        value={proposalDepartment}
                        onChange={(e) => setProposalDepartment(e.target.value)}
                        placeholder="Chọn hoặc nhập phòng ban..."
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <datalist id="proposal-dept-list">
                        {departmentsList.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" />
                        Người đề xuất
                      </label>
                      <select
                        value={proposalProposerId}
                        onChange={(e) => setProposalProposerId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} {emp.department ? `(${emp.department})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Ngày đề xuất</label>
                      <input
                        type="date"
                        value={proposalDate}
                        onChange={(e) => setProposalDate(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Hạn cần chi (Deadline)</label>
                      <input
                        type="date"
                        value={proposalDueDate}
                        onChange={(e) => setProposalDueDate(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">
                      Lý do / Giải trình nhu cầu chi phí <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={proposalReason}
                      onChange={(e) => setProposalReason(e.target.value)}
                      placeholder="Giải trình mục đích sử dụng chi phí, hiệu quả mang lại..."
                      className="w-full p-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Note */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Ghi chú thêm</label>
                    <input
                      type="text"
                      value={proposalNote}
                      onChange={(e) => setProposalNote(e.target.value)}
                      placeholder="Ghi chú thêm cho người phê duyệt..."
                      className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Footer with dynamic submit button text */}
            <div className="px-4 sm:px-6 py-3 border-t border-border bg-card flex items-center justify-end gap-2.5 shrink-0 shadow-xs">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-semibold transition-colors"
              >
                Hủy bỏ
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
                      {activeModule === 'task'
                        ? 'Tạo công việc'
                        : activeModule === 'note'
                        ? 'Lưu Ghi chú'
                        : activeModule === 'cash'
                        ? cashType === 'income'
                          ? 'Lưu Phiếu Thu'
                          : 'Lưu Phiếu Chi'
                        : activeModule === 'proposal'
                        ? 'Gửi Đề xuất chi phí'
                        : 'Lưu Sự kiện'}
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
