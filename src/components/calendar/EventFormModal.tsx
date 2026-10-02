import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  CheckSquare,
  BookOpen,
  Wallet,
  Save,
  User,
  Clock,
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
  GraduationCap,
  Link2,
  Star,
  BookMarked,
  Edit3,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Table,
  Info,
  Lightbulb,
  AlertTriangle,
  FolderOpen,
  Tag,
  Users,
  Sparkles,
  UserPlus,
  Search,
  Check,
  Calendar as CalendarIcon,
  MapPin,
  LocateFixed,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { CalendarEvent } from '../../types/calendar';
import { Task, TaskPriority, TaskStatus, TaskSubtask, Project } from '../../types/task';
import { Note, NoteCategory, NoteStatus, NoteAttachment, NoteParticipant } from '../../types/note';
import { LearningEntry, LearningSourceType, MasteryLevel, DifficultyLevel } from '../../types/learning';
import { CashTransaction } from '../../types/cashTransaction';
import { Employee } from '../../types/employee';

import { taskService, projectService } from '../../services/taskService';
import { noteService } from '../../services/noteService';
import { learningService } from '../../services/learningService';
import { cashTransactionService } from '../../services/cashTransactionService';
import { employeeService } from '../../services/employeeService';
import { catboxService } from '../../services/catboxService';
import { getSafeAvatarUrl } from '../../utils/avatarUtils';
import { useAuth } from '../../context/AuthContext';
import { MarkdownRenderer } from '../notes/MarkdownRenderer';
import { LEARNING_CATEGORIES, LEARNING_SOURCE_TYPES } from '../../data/learning';
import { NOTE_CATEGORIES, NOTE_COLOR_THEMES, PRESET_TAGS } from '../../data/notes';
import { TimePickerInput } from '../common/TimePickerInput';

export type EventModuleType = 'note' | 'task' | 'learning' | 'cash';

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
  defaultModule = 'note',
  onClose,
  onSaveSuccess,
}) => {
  const { currentUser } = useAuth();
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

  // =========================================================================
  // 1. GHI CHÚ STATES & REFS (NOTE - MATCHING NoteFormDrawer)
  // =========================================================================
  const noteCoverInputRef = useRef<HTMLInputElement>(null);
  const noteGalleryInputRef = useRef<HTMLInputElement>(null);
  const noteContentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [noteTitle, setNoteTitle] = useState('');
  const [noteSummary, setNoteSummary] = useState('');
  const [noteCategory, setNoteCategory] = useState<NoteCategory>('Kế hoạch công việc');
  const [noteStatus, setNoteStatus] = useState<NoteStatus>('published');
  const [noteColor, setNoteColor] = useState('purple');
  const [noteAuthorId, setNoteAuthorId] = useState('');
  const [noteDate, setNoteDate] = useState('');
  const [noteTime, setNoteTime] = useState('09:00');
  const [noteLocation, setNoteLocation] = useState('');
  const [noteCoordinates, setNoteCoordinates] = useState('');
  const [noteIsLocating, setNoteIsLocating] = useState(false);
  const [noteTags, setNoteTags] = useState<string[]>(['Kế hoạch']);
  const [noteTagInput, setNoteTagInput] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteContentTab, setNoteContentTab] = useState<'edit' | 'preview'>('edit');
  const [noteIsPinned, setNoteIsPinned] = useState(false);
  const [noteCoverUrl, setNoteCoverUrl] = useState('');
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const [noteAttachments, setNoteAttachments] = useState<NoteAttachment[]>([]);
  const [noteParticipants, setNoteParticipants] = useState<NoteParticipant[]>([]);
  const [noteActivity, setNoteActivity] = useState('');
  const [noteEmployeeSearch, setNoteEmployeeSearch] = useState('');
  const [noteCustomParticipantName, setNoteCustomParticipantName] = useState('');
  const [noteIsUploadingCover, setNoteIsUploadingCover] = useState(false);
  const [noteIsUploadingGallery, setNoteIsUploadingGallery] = useState(false);
  const [notePasteToast, setNotePasteToast] = useState<string | null>(null);

  // =========================================================================
  // 2. CÔNG VIỆC STATES (TASK - MATCHING IMAGE 2)
  // =========================================================================
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

  // =========================================================================
  // 3. HỌC HỎI STATES (LEARNING)
  // =========================================================================
  const [learningCode, setLearningCode] = useState('');
  const [learningTitle, setLearningTitle] = useState('');
  const [learningSummary, setLearningSummary] = useState('');
  const [learningCategory, setLearningCategory] = useState(LEARNING_CATEGORIES[0] || 'Lập trình & Kỹ thuật');
  const [learningSourceType, setSourceType] = useState<LearningSourceType>('Khóa học');
  const [learningSourceName, setLearningSourceName] = useState('');
  const [learningSourceUrl, setLearningSourceUrl] = useState('');
  const [learningMasteryLevel, setMasteryLevel] = useState<MasteryLevel>('learning');
  const [learningDifficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [learningRating, setRating] = useState(5);
  const [learningDate, setLearningDate] = useState('');
  const [learningReviewDate, setLearningReviewDate] = useState('');
  const [learningTags, setLearningTags] = useState<string[]>(['Kiến thức']);
  const [learningTagInput, setLearningTagInput] = useState('');
  const [learningContent, setLearningContent] = useState('');
  const [learningIsPinned, setLearningIsPinned] = useState(false);

  // =========================================================================
  // 4. THU / CHI STATES (CASH)
  // =========================================================================
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
    setNoteDate(today);
    setTaskStartDate(today);
    setTaskDueDate(defaultDate || nextWeek);
    setLearningDate(today);
    setLearningReviewDate(nextWeek);
    setCashDate(today);

    // Initial Task Code
    const allTasks = taskService.getInitialTasks();
    setTaskCode(`CV-${String(allTasks.length + 1).padStart(3, '0')}`);

    // Initial Learning Code
    const allLearnings = learningService.getInitialEntries();
    setLearningCode(`HH-${String(allLearnings.length + 1).padStart(3, '0')}`);

    // Initial Cash Code
    const allTxs = cashTransactionService.getInitialTransactions();
    setCashCode(`${cashType === 'income' ? 'PT' : 'PC'}-${String(allTxs.length + 1).padStart(3, '0')}`);

    // Initial defaults for employees
    if (employees.length > 0) {
      const defaultEmpId = employees[0].id;
      setNoteAuthorId(defaultEmpId);
      setTaskAssigneeId(defaultEmpId);
      setTaskAssignerId(defaultEmpId);
      setCashAssigneeId(defaultEmpId);
      setTaskDepartment(employees[0].department || 'Phòng Kỹ thuật & CNTT');
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

  // Filtered Note Employees for Search
  const filteredNoteEmployees = useMemo(() => {
    if (!noteEmployeeSearch.trim()) return employees;
    const q = noteEmployeeSearch.toLowerCase().trim();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.code && e.code.toLowerCase().includes(q)) ||
        (e.role && e.role.toLowerCase().includes(q)) ||
        (e.department && e.department.toLowerCase().includes(q))
    );
  }, [employees, noteEmployeeSearch]);

  // Note Tags handlers
  const handleAddNoteTag = (tagToAdd?: string) => {
    const val = (tagToAdd || noteTagInput).trim().replace(/^#/, '');
    if (!val) return;
    if (!noteTags.includes(val)) {
      setNoteTags([...noteTags, val]);
    }
    setNoteTagInput('');
  };

  const handleRemoveNoteTag = (tagToRemove: string) => {
    setNoteTags(noteTags.filter((t) => t !== tagToRemove));
  };

  // Note Markdown Markup Insertion
  const insertNoteContentMarkup = (before: string, after: string = '', defaultPlaceholder: string = 'nội dung') => {
    const textarea = noteContentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteContent.substring(start, end);
    const isBlock =
      before.startsWith('#') ||
      before.startsWith('>') ||
      before.startsWith('```') ||
      before.startsWith('- ') ||
      before.startsWith('1. ') ||
      before.startsWith('|');

    let prefix = before;
    if (isBlock && start > 0) {
      if (noteContent[start - 1] !== '\n') {
        prefix = '\n\n' + before;
      } else if (start > 1 && noteContent[start - 2] !== '\n') {
        prefix = '\n' + before;
      }
    }

    const placeholder = selectedText || defaultPlaceholder;
    const replacement = `${prefix}${placeholder}${after}`;

    const newContent = noteContent.substring(0, start) + replacement + noteContent.substring(end);
    setNoteContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const selectStart = start + prefix.length;
      const selectEnd = selectStart + placeholder.length;
      textarea.setSelectionRange(selectStart, selectEnd);
    }, 50);
  };

  // Note Participant Handlers
  const handleNoteToggleEmployeeParticipant = (emp: Employee) => {
    const isAlready = noteParticipants.some(
      (p) => (p.id && p.id === emp.id) || (p.code && p.code === emp.code) || p.name === emp.name
    );
    if (isAlready) {
      setNoteParticipants((prev) =>
        prev.filter(
          (p) =>
            !(
              (p.id && p.id === emp.id) ||
              (p.code && p.code === emp.code) ||
              p.name === emp.name
            )
        )
      );
    } else {
      const newPart: NoteParticipant = {
        id: emp.id,
        code: emp.code,
        name: emp.name,
        avatarUrl: emp.avatarUrl,
        role: emp.role,
        department: emp.department,
      };
      setNoteParticipants((prev) => [...prev, newPart]);
    }
  };

  const handleNoteAddCustomParticipant = () => {
    const trimmed = noteCustomParticipantName.trim();
    if (!trimmed) return;
    if (!noteParticipants.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setNoteParticipants((prev) => [
        ...prev,
        {
          id: 'custom_' + Date.now(),
          name: trimmed,
          role: 'Khách / Bạn bè',
        },
      ]);
    }
    setNoteCustomParticipantName('');
  };

  const handleNoteRemoveParticipant = (idOrName: string) => {
    setNoteParticipants((prev) =>
      prev.filter((p) => (p.id || p.name) !== idOrName && p.name !== idOrName)
    );
  };

  // Note GPS Geolocation Handler
  const handleNoteGetCurrentLocation = (silent: boolean = false) => {
    if (!navigator.geolocation) {
      if (!silent) alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    setNoteIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setNoteIsLocating(false);
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setNoteCoordinates(`${lat}° N, ${lng}° E`);

        // Reverse geocoding via OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'vi' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.display_name) {
              setNoteLocation(data.display_name);
            }
          }
        } catch (err) {
          console.warn('Reverse geocode failed:', err);
        }
      },
      (err) => {
        setNoteIsLocating(false);
        if (!silent) alert(`Không thể lấy vị trí GPS: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Note Image Upload Handlers
  const handleNoteCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNoteIsUploadingCover(true);
    setNotePasteToast('☁️ Đang tải ảnh bìa lên Catbox...');
    try {
      const url = await catboxService.uploadFile(file);
      setNoteCoverUrl(url);
      setNotePasteToast('☁️ Đã lưu ảnh bìa lên Catbox thành công!');
      setTimeout(() => setNotePasteToast(null), 3000);
    } catch (err) {
      console.warn('Catbox cover upload failed, fallback to local data URL:', err);
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setNoteCoverUrl(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setNoteIsUploadingCover(false);
    }
  };

  const handleNoteGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setNoteIsUploadingGallery(true);
    setNotePasteToast('☁️ Đang tải ảnh lên Catbox...');
    try {
      const fileList = Array.from(files);
      for (const file of fileList) {
        try {
          const url = await catboxService.uploadFile(file);
          setNoteImages((prev) => [...prev, url]);
          const newAttach: NoteAttachment = {
            id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: file.name,
            url,
            type: 'image',
            size: `${(file.size / 1024).toFixed(1)} KB`,
          };
          setNoteAttachments((prev) => [...prev, newAttach]);
        } catch (fileErr) {
          console.warn('Catbox upload failed for file, fallback to local:', fileErr);
          const reader = new FileReader();
          reader.onload = (evt) => {
            if (evt.target?.result) {
              const localUrl = evt.target.result as string;
              setNoteImages((prev) => [...prev, localUrl]);
              const newAttach: NoteAttachment = {
                id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                name: file.name,
                url: localUrl,
                type: 'image',
                size: `${(file.size / 1024).toFixed(1)} KB`,
              };
              setNoteAttachments((prev) => [...prev, newAttach]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
      setNotePasteToast('✅ Đã lưu ảnh vào thư viện đính kèm (Catbox)!');
      setTimeout(() => setNotePasteToast(null), 3000);
    } finally {
      setNoteIsUploadingGallery(false);
    }
  };

  // Clipboard Paste Image Handler (Ctrl + V) for Note
  const processNotePastedImage = async (file: File) => {
    setNotePasteToast('☁️ Đang tải ảnh Clipboard lên Catbox...');
    let url = '';
    try {
      url = await catboxService.uploadFile(file);
    } catch (err) {
      console.warn('Catbox upload failed for pasted image, fallback to local:', err);
      url = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => resolve((evt.target?.result as string) || '');
        reader.readAsDataURL(file);
      });
    }

    if (url) {
      setNoteImages((prev) => [...prev, url]);
      const newAttach: NoteAttachment = {
        id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: `Anh_dan_${Date.now().toString().slice(-4)}.png`,
        url,
        type: 'image',
        size: `${(file.size / 1024).toFixed(1)} KB`,
      };
      setNoteAttachments((prev) => [...prev, newAttach]);

      const textarea = noteContentTextareaRef.current;
      if (textarea && document.activeElement === textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const imgMarkdown = `\n![Hình ảnh đính kèm](${url})\n`;
        const newContent = noteContent.substring(0, start) + imgMarkdown + noteContent.substring(end);
        setNoteContent(newContent);
      }

      setNotePasteToast('✅ Đã tải ảnh lên Catbox & chèn vào bài viết (Ctrl + V)!');
      setTimeout(() => setNotePasteToast(null), 3500);
    }
  };

  // Window-level Ctrl+V listener when Note tab is active in Modal
  useEffect(() => {
    if (!isOpen || activeModule !== 'note') return;
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processNotePastedImage(file);
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [isOpen, activeModule, noteContent]);

  // Learning Tags handlers
  const handleAddLearningTag = () => {
    const trimmed = learningTagInput.trim().replace(/^#/, '');
    if (trimmed && !learningTags.includes(trimmed)) {
      setLearningTags([...learningTags, trimmed]);
    }
    setLearningTagInput('');
  };

  const handleRemoveLearningTag = (tag: string) => {
    setLearningTags(learningTags.filter((t) => t !== tag));
  };

  // Handle Form Submit for Active Module
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      if (activeModule === 'note') {
        if (!noteTitle.trim()) {
          setErrors({ noteTitle: 'Vui lòng nhập tiêu đề bài viết/ghi chú' });
          setIsSubmitting(false);
          return;
        }
        const authorEmp = employees.find((e) => e.id === noteAuthorId);
        const newNote: Note = {
          id: 'note_' + Date.now(),
          code: 'GC-' + Math.floor(1000 + Math.random() * 9000),
          title: noteTitle.trim(),
          summary: noteSummary.trim() || undefined,
          content: noteContent.trim() || noteSummary.trim() || noteTitle.trim(),
          category: (noteCategory || 'Ghi chép cá nhân') as NoteCategory,
          status: noteStatus,
          isPinned: noteIsPinned,
          color: noteColor,
          coverUrl: noteCoverUrl.trim() || undefined,
          noteDate: noteDate || new Date().toISOString().slice(0, 10),
          noteTime: noteTime || '09:00',
          location: noteLocation.trim() || undefined,
          coordinates: noteCoordinates.trim() || undefined,
          tags: noteTags.length > 0 ? noteTags : [],
          author: authorEmp?.name || currentUser?.name || currentUser?.username || 'Người dùng',
          authorId: authorEmp?.id,
          authorCode: authorEmp?.code,
          authorAvatar: authorEmp?.avatarUrl || currentUser?.avatarUrl || '',
          attachments: noteAttachments.length > 0 ? noteAttachments : undefined,
          images: noteImages.length > 0 ? noteImages : undefined,
          participants: noteParticipants.length > 0 ? noteParticipants : undefined,
          activity: noteActivity.trim() || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const notes = [newNote, ...noteService.getInitialNotes()];
        noteService.saveToLocalCache(notes);
        noteService.appendToSheet(newNote).catch(() => {});
        if (onSaveSuccess) onSaveSuccess(`Đã lưu Ghi chú: "${newNote.title}"`);
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
      } else if (activeModule === 'learning') {
        if (!learningTitle.trim()) {
          setErrors({ learningTitle: 'Vui lòng nhập tiêu đề bài học / kiến thức' });
          setIsSubmitting(false);
          return;
        }
        const newEntry: LearningEntry = {
          id: 'learn_' + Date.now(),
          code: learningCode.trim() || `HH-${Math.floor(1000 + Math.random() * 9000)}`,
          title: learningTitle.trim(),
          summary: learningSummary.trim(),
          content: learningContent.trim() || learningSummary.trim() || learningTitle.trim(),
          category: learningCategory,
          tags: learningTags,
          sourceType: learningSourceType,
          sourceName: learningSourceName.trim(),
          sourceUrl: learningSourceUrl.trim(),
          links: [],
          images: [],
          masteryLevel: learningMasteryLevel,
          difficulty: learningDifficulty,
          rating: learningRating,
          entryDate: learningDate || new Date().toISOString().slice(0, 10),
          nextReviewDate: learningReviewDate || undefined,
          isPinned: learningIsPinned,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const entries = [newEntry, ...learningService.getInitialEntries()];
        learningService.saveToCache(entries);
        learningService.appendToSheet(newEntry).catch(() => {});
        if (onSaveSuccess) onSaveSuccess(`Đã lưu bài học: "${newEntry.title}"`);
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
      }

      onClose();
    } catch (err) {
      console.error('Error saving item from calendar:', err);
      setErrors({ form: 'Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4 Tabs: Ghi chú lên đầu, Công việc, Học hỏi, Thu / Chi
  const MODULE_TABS: {
    id: EventModuleType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }[] = [
    { id: 'note', label: 'Ghi chú', icon: BookOpen, color: 'text-purple-500' },
    { id: 'task', label: 'Công việc', icon: CheckSquare, color: 'text-blue-500' },
    { id: 'learning', label: 'Học hỏi', icon: GraduationCap, color: 'text-indigo-500' },
    { id: 'cash', label: 'Thu / Chi', icon: Wallet, color: 'text-emerald-500' },
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
                {activeModule === 'note' ? (
                  <BookOpen className="w-5 h-5 text-purple-500" />
                ) : activeModule === 'task' ? (
                  <CheckSquare className="w-5 h-5 text-blue-500" />
                ) : activeModule === 'learning' ? (
                  <GraduationCap className="w-5 h-5 text-indigo-500" />
                ) : (
                  <Wallet className="w-5 h-5 text-emerald-500" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight truncate">
                    Thêm mới vào Lịch biểu
                  </h2>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      activeModule === 'note'
                        ? 'bg-purple-500/10 text-purple-600'
                        : activeModule === 'task'
                        ? 'bg-blue-500/10 text-blue-600'
                        : activeModule === 'learning'
                        ? 'bg-indigo-500/10 text-indigo-600'
                        : cashType === 'income'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-rose-500/10 text-rose-600'
                    }`}
                  >
                    {activeModule === 'note'
                      ? 'Ghi chú'
                      : activeModule === 'task'
                      ? 'Công việc'
                      : activeModule === 'learning'
                      ? 'Học hỏi'
                      : cashType === 'income'
                      ? 'Thu quỹ'
                      : 'Chi quỹ'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  Tạo nhanh cho ngày{' '}
                  {activeModule === 'note'
                    ? noteDate
                    : activeModule === 'task'
                    ? taskDueDate || taskStartDate
                    : activeModule === 'learning'
                    ? learningDate
                    : cashDate || defaultDate || new Date().toISOString().slice(0, 10)}
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

          {/* Module Selector Tabs: 4 tabs (Ghi chú, Công việc, Học hỏi, Thu / Chi) */}
          <div className="px-4 sm:px-6 py-2.5 border-b border-border/60 bg-muted/20 shrink-0">
            <div className="grid grid-cols-4 gap-2 p-1 bg-muted/60 rounded-xl border border-border/60">
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

              {/* Paste Toast Notification for Note */}
              {activeModule === 'note' && notePasteToast && (
                <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-between shadow-md transition-all animate-in slide-in-from-top duration-150">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    {notePasteToast}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNotePasteToast(null)}
                    className="text-white/80 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* ============================================================== */}
              {/* 1. GHI CHÚ (NOTE) - FULL 4 PHẦN CHUẨN THEO NoteFormDrawer     */}
              {/* ============================================================== */}
              {activeModule === 'note' && (
                <div className="space-y-5 animate-in fade-in-50 duration-200">
                  {/* 1. TIÊU ĐỀ & NỘI DUNG BÀI VIẾT */}
                  <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs transition-all hover:border-border hover:shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                          1. Tiêu đề & Nội dung bài viết
                        </h4>
                      </div>

                      {/* Editor / Preview Switcher */}
                      <div className="flex items-center rounded-xl border border-border p-0.5 bg-muted/30 text-xs">
                        <button
                          type="button"
                          onClick={() => setNoteContentTab('edit')}
                          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                            noteContentTab === 'edit'
                              ? 'bg-card text-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Soạn thảo
                        </button>
                        <button
                          type="button"
                          onClick={() => setNoteContentTab('preview')}
                          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                            noteContentTab === 'preview'
                              ? 'bg-card text-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" /> Xem trước
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Tiêu đề bài viết / Ghi chú <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Biên bản Cuộc họp Chiến lược Q4/2026..."
                        value={noteTitle}
                        onChange={(e) => {
                          setNoteTitle(e.target.value);
                          setErrors((prev) => ({ ...prev, noteTitle: '' }));
                        }}
                        className={`w-full rounded-xl border ${
                          errors.noteTitle ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border'
                        } bg-background px-3.5 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all`}
                      />
                      {errors.noteTitle && (
                        <p className="text-xs text-rose-500 mt-1">{errors.noteTitle}</p>
                      )}
                    </div>

                    {/* Summary */}
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        Tóm tắt nhanh (Lead / Summary)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Mô tả tóm tắt nội dung chính giúp người xem nắm bắt nhanh..."
                        value={noteSummary}
                        onChange={(e) => setNoteSummary(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                      />
                    </div>

                    {/* Main Content Area */}
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Nội dung chi tiết (Markdown / Web Rich Content)
                      </label>

                      {noteContentTab === 'edit' ? (
                        <div className="space-y-2">
                          {/* Rich Toolbar */}
                          <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-xl border border-border bg-muted/20">
                            <button
                              type="button"
                              title="Tiêu đề H1"
                              onClick={() => insertNoteContentMarkup('# ')}
                              className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                            >
                              <Heading1 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Tiêu đề H2"
                              onClick={() => insertNoteContentMarkup('## ')}
                              className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                            >
                              <Heading2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Tiêu đề H3"
                              onClick={() => insertNoteContentMarkup('### ')}
                              className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                            >
                              <Heading3 className="w-4 h-4" />
                            </button>
                            <div className="w-[1px] h-4 bg-border mx-1" />
                            <button
                              type="button"
                              title="Chữ đậm"
                              onClick={() => insertNoteContentMarkup('**', '**')}
                              className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                            >
                              <Bold className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Chữ nghiêng"
                              onClick={() => insertNoteContentMarkup('*', '*')}
                              className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                            >
                              <Italic className="w-4 h-4" />
                            </button>
                            <div className="w-[1px] h-4 bg-border mx-1" />
                            <button
                              type="button"
                              title="Danh sách gạch đầu dòng"
                              onClick={() => insertNoteContentMarkup('- ')}
                              className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                            >
                              <List className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Danh sách đánh số"
                              onClick={() => insertNoteContentMarkup('1. ')}
                              className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                            >
                              <ListOrdered className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Checklist công việc"
                              onClick={() => insertNoteContentMarkup('- [ ] ')}
                              className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                            >
                              <CheckSquare className="w-4 h-4" />
                            </button>
                            <div className="w-[1px] h-4 bg-border mx-1" />
                            <button
                              type="button"
                              title="Trích dẫn"
                              onClick={() => insertNoteContentMarkup('> ')}
                              className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                            >
                              <Quote className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Khối mã nguồn (Code block)"
                              onClick={() => insertNoteContentMarkup('```typescript\n', '\n```')}
                              className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                            >
                              <Code className="w-4 h-4" />
                            </button>
                            <div className="w-[1px] h-4 bg-border mx-1" />
                            <button
                              type="button"
                              title="Bảng dữ liệu Markdown"
                              onClick={() =>
                                insertNoteContentMarkup(
                                  '| Cột 1 | Cột 2 | Cột 3 |\n| --- | --- | --- |\n| Dữ liệu 1 | Dữ liệu 2 | Dữ liệu 3 |\n',
                                  '',
                                  ''
                                )
                              }
                              className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                            >
                              <Table className="w-4 h-4" />
                            </button>
                            <div className="w-[1px] h-4 bg-border mx-1" />
                            <button
                              type="button"
                              title="Hộp lưu ý (Note callout)"
                              onClick={() => insertNoteContentMarkup('> [!NOTE]\n> ', '', 'Nhập nội dung lưu ý quan trọng tại đây...')}
                              className="p-1.5 rounded-lg hover:bg-muted text-primary transition-colors text-xs flex items-center gap-1"
                            >
                              <Info className="w-3.5 h-3.5" /> Note
                            </button>
                            <button
                              type="button"
                              title="Hộp mẹo hay (Tip callout)"
                              onClick={() => insertNoteContentMarkup('> [!TIP]\n> ', '', 'Nhập mẹo hay hoặc hướng dẫn thực thi...')}
                              className="p-1.5 rounded-lg hover:bg-muted text-emerald-600 dark:text-emerald-400 transition-colors text-xs flex items-center gap-1"
                            >
                              <Lightbulb className="w-3.5 h-3.5" /> Mẹo
                            </button>
                            <button
                              type="button"
                              title="Hộp cảnh báo (Warning callout)"
                              onClick={() => insertNoteContentMarkup('> [!WARNING]\n> ', '', 'Cảnh báo rủi ro hoặc lưu ý bắt buộc...')}
                              className="p-1.5 rounded-lg hover:bg-muted text-amber-600 dark:text-amber-400 transition-colors text-xs flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Cảnh báo
                            </button>
                          </div>

                          {/* Textarea */}
                          <textarea
                            ref={noteContentTextareaRef}
                            rows={10}
                            placeholder="Soạn thảo nội dung chi tiết bài viết, biên bản hoặc ghi nhớ..."
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            className="w-full rounded-xl border border-border bg-background p-4 text-xs sm:text-sm font-mono leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-y"
                          />
                        </div>
                      ) : (
                        /* Live Preview */
                        <div className="rounded-xl border border-border/80 bg-background/50 p-5 min-h-[220px]">
                          <MarkdownRenderer content={noteContent} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. CHUYÊN MỤC, THẺ & TRẠNG THÁI */}
                  <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs transition-all hover:border-border hover:shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                          2. Chuyên mục, Thẻ & Trạng thái
                        </h4>
                      </div>

                      {/* Theme Color Picker - Tucked neatly into header as small dots */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">Màu sắc:</span>
                        {NOTE_COLOR_THEMES.map((theme) => (
                          <button
                            key={theme.id}
                            type="button"
                            title={theme.name}
                            onClick={() => setNoteColor(theme.id)}
                            className={`w-5 h-5 rounded-full ${theme.badge} border transition-all ${
                              noteColor === theme.id ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Category, Status, Author & Pin */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Chuyên mục
                        </label>
                        <select
                          value={noteCategory}
                          onChange={(e) => setNoteCategory(e.target.value as NoteCategory)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">-- Chọn chuyên mục --</option>
                          {NOTE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Trạng thái
                        </label>
                        <select
                          value={noteStatus}
                          onChange={(e) => setNoteStatus(e.target.value as NoteStatus)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="published">Đã công bố / Xuất bản</option>
                          <option value="draft">Bản nháp</option>
                          <option value="archived">Lưu trữ</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Tác giả ghi chép
                        </label>
                        <select
                          value={noteAuthorId}
                          onChange={(e) => setNoteAuthorId(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} {emp.department ? `(${emp.department})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Ghim ưu tiên
                        </label>
                        <button
                          type="button"
                          onClick={() => setNoteIsPinned(!noteIsPinned)}
                          className={`w-full h-[38px] rounded-xl border px-3 flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                            noteIsPinned
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold'
                              : 'border-border bg-background text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Pin className={`w-3.5 h-3.5 ${noteIsPinned ? 'fill-current' : ''}`} />
                          {noteIsPinned ? 'Đang ghim lên đầu' : 'Không ghim'}
                        </button>
                      </div>
                    </div>

                    {/* Tags Input */}
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Thẻ phân loại (Tags) - Nhấn Enter để thêm
                      </label>
                      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-border bg-background min-h-[42px]">
                        {noteTags.map((t, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                          >
                            <Tag className="w-3 h-3" />
                            #{t}
                            <button
                              type="button"
                              onClick={() => handleRemoveNoteTag(t)}
                              className="hover:text-rose-500 transition-colors ml-0.5 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          placeholder={noteTags.length === 0 ? 'Thêm thẻ (nhập rồi Enter)...' : 'Thêm tiếp...'}
                          value={noteTagInput}
                          onChange={(e) => setNoteTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddNoteTag();
                            }
                          }}
                          onBlur={() => {
                            if (noteTagInput.trim()) handleAddNoteTag();
                          }}
                          className="flex-1 min-w-[120px] bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none px-1 py-0.5"
                        />
                      </div>

                      {/* Preset Tag Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[11px] text-muted-foreground mr-1">Gợi ý nhanh:</span>
                        {PRESET_TAGS.slice(0, 8).map((pt) => {
                          const isSelected = noteTags.includes(pt);
                          return (
                            <button
                              key={pt}
                              type="button"
                              onClick={() => (isSelected ? handleRemoveNoteTag(pt) : handleAddNoteTag(pt))}
                              className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                                isSelected
                                  ? 'bg-primary/15 border-primary/30 text-primary font-medium'
                                  : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              +{pt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 3. ĐỐI TƯỢNG NHÂN VIÊN & ĐI CÙNG AI (NHẬT KÝ) */}
                  <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs transition-all hover:border-border hover:shadow-md space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                          3. Đối tượng nhân viên & Đi cùng ai (Nhật ký)
                        </h4>
                        {noteParticipants.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                            {noteParticipants.length} người
                          </span>
                        )}
                      </div>

                      {/* Diary template button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!noteCategory) setNoteCategory('Nhật ký & Hoạt động');
                          if (!noteActivity) setNoteActivity('Đi cà phê & Trò chuyện');
                          if (!noteTitle) setNoteTitle(`Nhật ký ngày ${noteDate || new Date().toLocaleDateString('vi-VN')}`);
                          if (!noteContent) {
                            const names = noteParticipants.map((p) => p.name).join(', ') || 'Bạn bè / Đồng nghiệp';
                            setNoteContent(`## 📖 Nhật ký Hoạt động\n- **Thời gian:** ${noteTime || '09:00'}, ngày ${noteDate || new Date().toLocaleDateString('vi-VN')}\n- **Địa điểm:** ${noteLocation || 'Tại quán cà phê / Ngoài trời'}\n- **Đi cùng:** ${names}\n\n### 🌟 Hôm nay làm gì & Có gì vui:\n1. Gặp mặt trò chuyện và chia sẻ câu chuyện cùng mọi người.\n2. Cùng nhau thưởng thức đồ uống và thư giãn.\n3. Những kỷ niệm và khoảnh khắc đáng nhớ trong ngày.\n\n> [!NOTE]\n> Hãy ghi lại cảm xúc và trải nghiệm tuyệt vời cùng bạn bè!`);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium border border-emerald-500/30 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Dùng mẫu Nhật ký đi chơi
                      </button>
                    </div>

                    {/* Activity input & suggestions */}
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Hoạt động / Đi đâu làm gì
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Đi uống cà phê cuối tuần, Ăn tối liên hoan, Khảo sát mặt bằng..."
                        value={noteActivity}
                        onChange={(e) => setNoteActivity(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[11px] text-muted-foreground mr-1">Gợi ý hoạt động:</span>
                        {['Đi cà phê', 'Ăn uống liên hoan', 'Khảo sát mặt bằng', 'Họp bàn chiến lược', 'Dã ngoại team-building', 'Đào tạo nội bộ'].map((act) => (
                          <button
                            key={act}
                            type="button"
                            onClick={() => setNoteActivity(act)}
                            className={`text-[11px] px-2.5 py-0.5 rounded-md border transition-all ${
                              noteActivity === act
                                ? 'bg-primary text-primary-foreground font-semibold border-primary'
                                : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {act}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selected Participants List */}
                    {noteParticipants.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                          Danh sách người tham gia đã chọn ({noteParticipants.length})
                        </label>
                        <div className="flex flex-wrap gap-2 p-2.5 rounded-xl border border-border bg-background">
                          {noteParticipants.map((p) => {
                            const avatar = getSafeAvatarUrl(p.avatarUrl, p.name);
                            return (
                              <span
                                key={p.id || p.name}
                                className="inline-flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium"
                              >
                                <img
                                  src={avatar}
                                  alt={p.name}
                                  className="w-5 h-5 rounded-full object-cover border border-primary/30"
                                />
                                <span className="max-w-[120px] truncate">{p.name}</span>
                                {p.role && <span className="text-[10px] text-muted-foreground hidden sm:inline">({p.role})</span>}
                                <button
                                  type="button"
                                  onClick={() => handleNoteRemoveParticipant(p.id || p.name)}
                                  className="hover:text-destructive transition-colors ml-0.5 text-xs font-bold"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Employee Picker */}
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Chọn nhân viên công ty tham gia
                      </label>
                      <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Tìm kiếm nhân viên trong công ty để thêm..."
                          value={noteEmployeeSearch}
                          onChange={(e) => setNoteEmployeeSearch(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="rounded-xl border border-border bg-background overflow-hidden">
                        <div className="max-h-44 overflow-y-auto p-2 divide-y divide-border/40 space-y-1 custom-scrollbar">
                          {filteredNoteEmployees.length > 0 ? (
                            filteredNoteEmployees.map((emp) => {
                              const isSelected = noteParticipants.some(
                                (p) => (p.id && p.id === emp.id) || (p.code && p.code === emp.code) || p.name === emp.name
                              );
                              const avatar = getSafeAvatarUrl(emp.avatarUrl, emp.name);

                              return (
                                <button
                                  key={emp.id || emp.code}
                                  type="button"
                                  onClick={() => handleNoteToggleEmployeeParticipant(emp)}
                                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                                    isSelected
                                      ? 'bg-primary/10 border border-primary/30 text-primary'
                                      : 'hover:bg-muted/60 text-foreground'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <img
                                      src={avatar}
                                      alt={emp.name}
                                      className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                                        <span>{emp.name}</span>
                                        {emp.code && (
                                          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                                            {emp.code}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground truncate">
                                        {emp.role} {emp.department ? `• ${emp.department}` : ''}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="shrink-0 ml-2">
                                    {isSelected ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                                        <Check className="w-3 h-3" /> Đã chọn
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full group-hover:text-foreground">
                                        <Plus className="w-3 h-3" /> Chọn
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="p-3 text-center text-xs text-muted-foreground">
                              Không tìm thấy nhân viên phù hợp với từ khóa "{noteEmployeeSearch}".
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Add External Friend / Guest */}
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          placeholder="Hoặc nhập tên người ngoài / bạn bè (Ví dụ: Anh Nam - Đối tác)..."
                          value={noteCustomParticipantName}
                          onChange={(e) => setNoteCustomParticipantName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleNoteAddCustomParticipant();
                            }
                          }}
                          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={handleNoteAddCustomParticipant}
                          disabled={!noteCustomParticipantName.trim()}
                          className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Thêm người ngoài
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4. THỜI GIAN, VỊ TRÍ & ẢNH ĐÍNH KÈM */}
                  <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs transition-all hover:border-border hover:shadow-md space-y-4">
                    <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                        4. Thời gian, Vị trí & Ảnh đính kèm
                      </h4>
                    </div>

                    {/* Event Date & Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Ngày sự kiện / thực hiện
                        </label>
                        <div className="relative">
                          <CalendarIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          <input
                            type="date"
                            value={noteDate}
                            onChange={(e) => setNoteDate(e.target.value)}
                            className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          Giờ sự kiện / thực hiện (24h)
                        </label>
                        <TimePickerInput
                          value={noteTime}
                          onChange={(val) => setNoteTime(val)}
                          placeholder="09:00"
                          force24h={true}
                        />
                      </div>
                    </div>

                    {/* Location with GPS */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-muted-foreground">
                          Vị trí / Địa điểm (GPS)
                        </label>
                        <button
                          type="button"
                          onClick={() => handleNoteGetCurrentLocation(false)}
                          disabled={noteIsLocating}
                          className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline disabled:opacity-50"
                        >
                          <LocateFixed className={`w-3.5 h-3.5 ${noteIsLocating ? 'animate-spin' : ''}`} />
                          {noteIsLocating ? 'Đang xác định GPS...' : 'Lấy vị trí GPS hiện tại'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                          <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Tên địa điểm / Địa chỉ..."
                            value={noteLocation}
                            onChange={(e) => setNoteLocation(e.target.value)}
                            className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Tọa độ GPS (Ví dụ: 10.7951° N, 106.7218° E)"
                          value={noteCoordinates}
                          onChange={(e) => setNoteCoordinates(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        />
                      </div>
                    </div>

                    {/* Cover Banner */}
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Ảnh bìa bài viết (Cover Banner)
                      </label>
                      {noteCoverUrl ? (
                        <div className="relative rounded-xl overflow-hidden border border-border h-36 sm:h-44 group">
                          <img src={noteCoverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => noteCoverInputRef.current?.click()}
                              disabled={noteIsUploadingCover}
                              className="px-3 py-1.5 rounded-lg bg-white/90 text-foreground text-xs font-medium hover:bg-white flex items-center gap-1.5 shadow-md disabled:opacity-60"
                            >
                              {noteIsUploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                              {noteIsUploadingCover ? 'Đang tải lên...' : 'Thay ảnh'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setNoteCoverUrl('')}
                              className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 flex items-center gap-1.5 shadow-md"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Xóa ảnh
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => noteCoverInputRef.current?.click()}
                          className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-4 sm:p-6 text-center cursor-pointer transition-colors bg-muted/10 hover:bg-muted/20"
                        >
                          <div className="mx-auto w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                            {noteIsUploadingCover ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                          </div>
                          <p className="text-xs font-semibold text-foreground">
                            {noteIsUploadingCover ? 'Đang tải ảnh bìa lên Catbox...' : 'Nhấn để tải lên ảnh bìa'}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Hỗ trợ định dạng JPG, PNG, WEBP (Lưu trực tiếp lên đám mây Catbox)
                          </p>
                        </div>
                      )}
                      <input
                        ref={noteCoverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleNoteCoverUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Image Gallery */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-muted-foreground">
                          Thư viện hình ảnh đính kèm (Catbox / Ctrl+V)
                        </label>
                        <button
                          type="button"
                          onClick={() => noteGalleryInputRef.current?.click()}
                          disabled={noteIsUploadingGallery}
                          className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline disabled:opacity-50"
                        >
                          {noteIsUploadingGallery ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          {noteIsUploadingGallery ? 'Đang tải...' : 'Thêm ảnh'}
                        </button>
                      </div>

                      {noteImages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {noteImages.map((img, idx) => (
                            <div key={idx} className="relative rounded-lg overflow-hidden border border-border group aspect-video">
                              <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setNoteImages(noteImages.filter((_, i) => i !== idx));
                                  setNoteAttachments(noteAttachments.filter((a) => a.url !== img));
                                }}
                                className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground italic">
                          Chưa có hình ảnh đính kèm nào. Bạn có thể nhấn Thêm ảnh hoặc bấm Ctrl+V để dán trực tiếp.
                        </p>
                      )}
                      <input
                        ref={noteGalleryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleNoteGalleryUpload}
                        className="hidden"
                      />
                    </div>
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
              {/* 3. HỌC HỎI (LEARNING)                                         */}
              {/* ============================================================== */}
              {activeModule === 'learning' && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">
                        Mã bài học <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={learningCode}
                        onChange={(e) => setLearningCode(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card font-mono text-xs font-bold text-indigo-600 focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-foreground">
                        Tiêu đề bài học / Kiến thức <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={learningTitle}
                        onChange={(e) => {
                          setLearningTitle(e.target.value);
                          setErrors((prev) => ({ ...prev, learningTitle: '' }));
                        }}
                        placeholder="VD: Kỹ thuật Prompt Engineering nâng cao, Quản trị thời gian..."
                        className={`w-full h-9 px-3 rounded-lg border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                          errors.learningTitle ? 'border-rose-500 ring-1 ring-rose-500' : 'border-border'
                        }`}
                      />
                      {errors.learningTitle && (
                        <p className="text-[11px] text-rose-500">{errors.learningTitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Tóm tắt ngắn gọn cốt lõi</label>
                    <input
                      type="text"
                      value={learningSummary}
                      onChange={(e) => setLearningSummary(e.target.value)}
                      placeholder="Tóm tắt 1-2 câu quan trọng nhất của bài học..."
                      className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Category & Source Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-muted/20">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <BookMarked className="w-3.5 h-3.5 text-indigo-500" />
                        Chủ đề / Lĩnh vực
                      </label>
                      <select
                        value={learningCategory}
                        onChange={(e) => setLearningCategory(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {LEARNING_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                        Nguồn tài liệu
                      </label>
                      <select
                        value={learningSourceType}
                        onChange={(e) => setSourceType(e.target.value as LearningSourceType)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {LEARNING_SOURCE_TYPES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Source Name & URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Tên nguồn / Tác giả</label>
                      <input
                        type="text"
                        value={learningSourceName}
                        onChange={(e) => setLearningSourceName(e.target.value)}
                        placeholder="VD: Sách Atomic Habits, Kênh Youtube..."
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                        Đường dẫn (Link URL)
                      </label>
                      <input
                        type="url"
                        value={learningSourceUrl}
                        onChange={(e) => setLearningSourceUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Mastery, Difficulty, Rating */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Mức độ nắm vững</label>
                      <select
                        value={learningMasteryLevel}
                        onChange={(e) => setMasteryLevel(e.target.value as MasteryLevel)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="learning">🔵 Đang học</option>
                        <option value="practicing">🟠 Đang thực hành</option>
                        <option value="mastered">🟢 Đã nắm vững</option>
                        <option value="review_needed">🔴 Cần ôn lại</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Độ khó</label>
                      <select
                        value={learningDifficulty}
                        onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="beginner">Cơ bản</option>
                        <option value="intermediate">Trung bình</option>
                        <option value="advanced">Nâng cao</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        Đánh giá độ hữu ích ({learningRating}/5)
                      </label>
                      <select
                        value={learningRating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                        <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                        <option value={3}>⭐⭐⭐ (3/5)</option>
                        <option value={2}>⭐⭐ (2/5)</option>
                        <option value={1}>⭐ (1/5)</option>
                      </select>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">
                        Ngày học <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={learningDate}
                        onChange={(e) => setLearningDate(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Lịch ôn tập lại (Spaced Repetition)</label>
                      <input
                        type="date"
                        value={learningReviewDate}
                        onChange={(e) => setLearningReviewDate(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Learning Content */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Nội dung ghi chép / Kiến thức chi tiết</label>
                    <textarea
                      rows={5}
                      value={learningContent}
                      onChange={(e) => setLearningContent(e.target.value)}
                      placeholder="Ghi chép các ý tưởng chính, câu trích dẫn, công thức, bài học rút ra..."
                      className="w-full p-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary custom-scrollbar"
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Thẻ phân loại (Tags)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={learningTagInput}
                        onChange={(e) => setLearningTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddLearningTag();
                          }
                        }}
                        placeholder="VD: React, Marketing, AI..."
                        className="flex-1 h-8 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddLearningTag}
                        className="h-8 px-2.5 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-semibold"
                      >
                        Thêm tag
                      </button>
                    </div>
                    {learningTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {learningTags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 text-[11px] font-medium bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-500/20"
                          >
                            #{t}
                            <button
                              type="button"
                              onClick={() => handleRemoveLearningTag(t)}
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
                      checked={learningIsPinned}
                      onChange={(e) => setLearningIsPinned(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-medium text-foreground flex items-center gap-1">
                      <Pin className="w-3.5 h-3.5 text-amber-500" />
                      Ghim bài học nổi bật
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
                      <label className="text-xs font-semibold text-foreground">Ngày & Giờ giao dịch (24h)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={cashDate}
                          onChange={(e) => setCashDate(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <TimePickerInput
                          value={cashTime}
                          onChange={(val) => setCashTime(val)}
                          placeholder="09:00"
                          force24h={true}
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
                      {activeModule === 'note'
                        ? 'Lưu Ghi chú'
                        : activeModule === 'task'
                        ? 'Tạo công việc'
                        : activeModule === 'learning'
                        ? 'Lưu Bài học'
                        : cashType === 'income'
                        ? 'Lưu Phiếu Thu'
                        : 'Lưu Phiếu Chi'}
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
