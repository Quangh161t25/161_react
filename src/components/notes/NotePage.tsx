import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getSafeAvatarUrl } from '../../utils/avatarUtils';
import {
  ArrowLeft,
  Search,
  FolderOpen,
  Tag,
  Bookmark,
  LayoutGrid,
  Download,
  Plus,
  SquarePen,
  Trash2,
  List,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  CheckCircle2,
  AlertCircle,
  ChartColumn,
  Pin,
  Printer,
  MapPin,
  Calendar,
  ImageIcon,
  Sparkles,
  Users,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ArrowUpDown,
} from 'lucide-react';
import { Note, NoteCategory, NoteStatus } from '../../types/note';
import { NOTE_CATEGORIES } from '../../data/notes';
import { noteService } from '../../services/noteService';
import { useIsMobile } from '../../hooks/useIsMobile';
import { NoteDetailDrawer } from './NoteDetailDrawer';
import { NoteFormDrawer } from './NoteFormDrawer';
import { NoteStatsTab } from './NoteStatsTab';
import { NoteCalendarView } from './NoteCalendarView';
import {
  ColumnCustomizerPopover,
  ColumnItem,
  TableDensity,
} from '../common/ColumnCustomizerPopover';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { stripMarkdown } from './MarkdownRenderer';
import { useAutoSync } from '../../hooks/useAutoSync';
import { RealtimeSyncBadge } from '../common/RealtimeSyncBadge';

interface NotePageProps {
  onBack: () => void;
}

// Ordered columns: Tiêu đề -> Nội dung -> Chuyên mục -> Hoạt động -> Đi cùng ai -> Thẻ -> Trạng thái -> Ngày -> Giờ -> Vị trí -> Đính kèm -> Tác giả
export const DEFAULT_NOTE_COLUMNS: ColumnItem[] = [
  { id: 'title', label: 'Tiêu đề', visible: true, pinned: true, width: 260, align: 'left', wrap: 'truncate' },
  { id: 'content', label: 'Nội dung bài viết', visible: true, pinned: false, width: 360, align: 'left', wrap: 'truncate' },
  { id: 'category', label: 'Chuyên mục', visible: true, pinned: false, width: 160, align: 'center', wrap: 'truncate' },
  { id: 'activity', label: 'Hoạt động (Nhật ký)', visible: true, width: 160, align: 'left', wrap: 'truncate' },
  { id: 'participants', label: 'Đi cùng ai / Tham gia', visible: true, width: 200, align: 'left', wrap: 'truncate' },
  { id: 'tags', label: 'Thẻ (Tags)', visible: true, width: 180, align: 'left', wrap: 'truncate' },
  { id: 'status', label: 'Trạng thái', visible: true, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'noteDate', label: 'Ngày thực hiện', visible: true, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'noteTime', label: 'Giờ', visible: true, width: 90, align: 'center', wrap: 'truncate' },
  { id: 'location', label: 'Vị trí / Địa điểm', visible: true, width: 200, align: 'left', wrap: 'truncate' },
  { id: 'attachments', label: 'Hình ảnh / Đính kèm', visible: true, width: 140, align: 'center', wrap: 'truncate' },
  { id: 'author', label: 'Tác giả', visible: true, width: 150, align: 'left', wrap: 'truncate' },
  { id: 'summary', label: 'Tóm tắt ngắn', visible: false, width: 260, align: 'left', wrap: 'truncate' },
  { id: 'createdAt', label: 'Ngày tạo', visible: false, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'updatedAt', label: 'Cập nhật', visible: false, width: 130, align: 'center', wrap: 'truncate' },
];

// Helper to convert note date and time into a comparable timestamp (milliseconds)
export function getNoteDateTimeTimestamp(note: Note): number {
  const dateStr = (note.noteDate || note.createdAt || note.updatedAt || '').trim();
  let y = 1970, m = 1, d = 1;

  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const parts = dateStr.slice(0, 10).split('-');
    y = parseInt(parts[0], 10) || 1970;
    m = parseInt(parts[1], 10) || 1;
    d = parseInt(parts[2], 10) || 1;
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
    const parts = dateStr.split('/');
    d = parseInt(parts[0], 10) || 1;
    m = parseInt(parts[1], 10) || 1;
    y = parseInt(parts[2], 10) || 1970;
  } else if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      y = parsed.getFullYear();
      m = parsed.getMonth() + 1;
      d = parsed.getDate();
    }
  }

  let hour = 0, minute = 0;
  if (note.noteTime && /^\d{1,2}:\d{2}/.test(note.noteTime.trim())) {
    const timeParts = note.noteTime.trim().split(':');
    hour = parseInt(timeParts[0], 10) || 0;
    minute = parseInt(timeParts[1], 10) || 0;
  }

  const dt = new Date(y, m - 1, d, hour, minute, 0, 0);
  return isNaN(dt.getTime()) ? 0 : dt.getTime();
}

export const NotePage: React.FC<NotePageProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const { formatDate, formatTime, settings } = useSettings();
  const [notes, setNotes] = useState<Note[]>(() => noteService.getInitialNotes());
  const [activeTopTab, setActiveTopTab] = useState<'list' | 'calendar' | 'stats'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedParticipant, setSelectedParticipant] = useState('all');
  const [onlyPinned, setOnlyPinned] = useState(false);

  // Interactive Sorting State: Default to Date & Time Descending (Lớn tới Nhỏ)
  const [sortField, setSortField] = useState<string>('dateTime');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [isParticipantDropdownOpen, setIsParticipantDropdownOpen] = useState(false);

  const isMobile = useIsMobile();
  // Trên điện thoại: mặc định dạng thẻ Grid card, trên máy tính: dạng Bảng Table
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'table'
  );

  // Tự động đồng bộ kiểu xem tương thích khi chuyển đổi giữa điện thoại và máy tính
  useEffect(() => {
    setViewMode(isMobile ? 'grid' : 'table');
  }, [isMobile]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Smart Realtime Auto-Sync Hook (25s interval, focus refresh, instant badge)
  const { isSyncing, lastSyncTime, triggerManualSync } = useAutoSync<Note[]>({
    syncFn: () => noteService.fetchFromSheet(),
    onDataReceived: (liveNotes) => {
      if (Array.isArray(liveNotes)) {
        setNotes(liveNotes);
      }
    },
    intervalMs: 25000,
  });

  // Detail & Edit Drawers
  const [selectedNoteForDetail, setSelectedNoteForDetail] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [defaultFormDate, setDefaultFormDate] = useState<string | undefined>(undefined);
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(settings.rowsPerPage || 50);

  useEffect(() => {
    if (settings.rowsPerPage) {
      setPageSize(settings.rowsPerPage);
      setCurrentPage(1);
    }
  }, [settings.rowsPerPage]);

  // Resizing state
  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const resizingRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);
  const lastSelectedIdRef = useRef<string | null>(null);

  // Column Customizer & Density State
  const [tableColumns, setTableColumns] = useState<ColumnItem[]>(() => {
    try {
      const saved = localStorage.getItem('erp_note_columns_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingMap = new Map(parsed.map((p: ColumnItem) => [p.id, p]));
          const merged: ColumnItem[] = [];
          parsed.forEach((p: ColumnItem) => {
            const def = DEFAULT_NOTE_COLUMNS.find((d) => d.id === p.id);
            if (def) {
              merged.push({
                ...def,
                ...p,
                label: def.label,
                width: p.width || def.width || 160,
                pinned: p.pinned !== undefined ? p.pinned : def.pinned,
                align: p.align || def.align || 'left',
                wrap: p.wrap || def.wrap || 'truncate',
              });
            }
          });
          DEFAULT_NOTE_COLUMNS.forEach((def) => {
            if (!existingMap.has(def.id)) {
              merged.push(def);
            }
          });
          return merged;
        }
      }
    } catch {}
    return DEFAULT_NOTE_COLUMNS;
  });

  const [tableDensity, setTableDensity] = useState<TableDensity>(() => {
    try {
      const saved = localStorage.getItem('erp_note_density');
      if (saved === 'compact' || saved === 'normal' || saved === 'relaxed') {
        return saved;
      }
    } catch {}
    return 'normal';
  });

  const handleSaveColumns = (newCols: ColumnItem[]) => {
    setTableColumns(newCols);
    try {
      localStorage.setItem('erp_note_columns_v3', JSON.stringify(newCols));
    } catch {}
  };

  const handleSaveDensity = (newDensity: TableDensity) => {
    setTableDensity(newDensity);
    try {
      localStorage.setItem('erp_note_density', newDensity);
    } catch {}
  };

  const handleResetColumns = () => {
    setTableColumns(DEFAULT_NOTE_COLUMNS);
    setTableDensity('normal');
    try {
      localStorage.removeItem('erp_note_columns_v3');
      localStorage.removeItem('erp_note_columns_v2');
      localStorage.removeItem('erp_note_columns');
      localStorage.removeItem('erp_note_density');
    } catch {}
  };

  // Interactive Column Resizing
  const handleStartResize = useCallback(
    (columnId: string, startEvent: React.MouseEvent) => {
      startEvent.preventDefault();
      startEvent.stopPropagation();
      const col = tableColumns.find((c) => c.id === columnId);
      const currentWidth = col?.width || 160;

      setResizingColId(columnId);
      resizingRef.current = {
        colId: columnId,
        startX: startEvent.clientX,
        startWidth: currentWidth,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizingRef.current) return;
        const delta = moveEvent.clientX - resizingRef.current.startX;
        const newWidth = Math.max(60, resizingRef.current.startWidth + delta);

        setTableColumns((prev) =>
          prev.map((item) =>
            item.id === resizingRef.current?.colId ? { ...item, width: newWidth } : item
          )
        );
      };

      const handleMouseUp = () => {
        setResizingColId(null);
        if (resizingRef.current) {
          try {
            setTableColumns((currentCols) => {
              localStorage.setItem('erp_note_columns_v2', JSON.stringify(currentCols));
              return currentCols;
            });
          } catch {}
        }
        resizingRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [tableColumns]
  );

  // Manual Sync handler delegating to smart auto-sync
  const handleManualSync = async () => {
    setSyncToastMessage(null);
    setSyncError(null);
    try {
      const sheetNotes = await triggerManualSync();
      if (Array.isArray(sheetNotes)) {
        setNotes(sheetNotes);
        setSyncToastMessage(
          sheetNotes.length > 0
            ? `Đã đồng bộ thành công ${sheetNotes.length} bài viết ghi chú từ Google Sheet!`
            : 'Đã đồng bộ với Google Sheet (danh sách ghi chú trống).'
        );
      } else {
        setSyncToastMessage('Dữ liệu ghi chú đã cập nhật mới nhất!');
      }
    } catch (err: any) {
      setSyncError(err?.message || 'Lỗi đồng bộ với Google Sheets');
    } finally {
      setTimeout(() => {
        setSyncToastMessage(null);
        setSyncError(null);
      }, 4000);
    }
  };

  // Distinct tags list
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => (n.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [notes]);

  // Distinct participants list
  const allUniqueParticipants = useMemo(() => {
    const map = new Map<string, { name: string; avatarUrl?: string; role?: string }>();
    notes.forEach((n) => {
      (n.participants || []).forEach((p) => {
        if (p.name && !map.has(p.name)) {
          map.set(p.name, { name: p.name, avatarUrl: p.avatarUrl, role: p.role });
        }
      });
    });
    return Array.from(map.values());
  }, [notes]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title?.toLowerCase().includes(q);
        const matchSummary = n.summary?.toLowerCase().includes(q);
        const matchContent = n.content?.toLowerCase().includes(q);
        const matchTags = (n.tags || []).some((t) => t.toLowerCase().includes(q));
        const matchLoc = n.location?.toLowerCase().includes(q) || n.coordinates?.toLowerCase().includes(q);
        const matchAuthor = n.author?.toLowerCase().includes(q);
        const matchActivity = n.activity?.toLowerCase().includes(q);
        const matchParticipants = (n.participants || []).some(
          (p) => p.name?.toLowerCase().includes(q) || (p.role && p.role.toLowerCase().includes(q))
        );
        if (
          !matchTitle &&
          !matchSummary &&
          !matchContent &&
          !matchTags &&
          !matchLoc &&
          !matchAuthor &&
          !matchActivity &&
          !matchParticipants
        ) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'all' && n.category !== selectedCategory) {
        return false;
      }

      // Status
      if (selectedStatus !== 'all' && n.status !== selectedStatus) {
        return false;
      }

      // Tag
      if (selectedTag !== 'all' && !(n.tags || []).includes(selectedTag)) {
        return false;
      }

      // Participant Filter
      if (
        selectedParticipant !== 'all' &&
        !(n.participants || []).some((p) => p.name === selectedParticipant)
      ) {
        return false;
      }

      // Pinned
      if (onlyPinned && !n.isPinned) {
        return false;
      }

      return true;
    });
  }, [notes, searchQuery, selectedCategory, selectedStatus, selectedTag, selectedParticipant, onlyPinned]);

  // Handle Interactive Column Sorting
  const handleSortColumn = (colId: string) => {
    let targetField = colId;
    if (colId === 'noteDate' || colId === 'noteTime') {
      targetField = 'dateTime';
    }

    if (sortField === targetField) {
      // Toggle direction
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(targetField);
      // Default dateTime to desc (lớn tới nhỏ), other text columns to asc
      setSortDirection(targetField === 'dateTime' ? 'desc' : 'asc');
    }
  };

  // Sort notes: Strictly by selected field, default to Date & Time descending (lớn tới nhỏ)
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      let diff = 0;

      if (sortField === 'dateTime' || sortField === 'noteDate' || sortField === 'noteTime') {
        const timeA = getNoteDateTimeTimestamp(a);
        const timeB = getNoteDateTimeTimestamp(b);
        diff = sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
      } else if (sortField === 'title') {
        const titleA = a.title || '';
        const titleB = b.title || '';
        diff = sortDirection === 'desc' ? titleB.localeCompare(titleA) : titleA.localeCompare(titleB);
      } else if (sortField === 'category') {
        const catA = a.category || '';
        const catB = b.category || '';
        diff = sortDirection === 'desc' ? catB.localeCompare(catA) : catA.localeCompare(catB);
      } else if (sortField === 'author') {
        const authA = a.author || '';
        const authB = b.author || '';
        diff = sortDirection === 'desc' ? authB.localeCompare(authA) : authA.localeCompare(authB);
      } else if (sortField === 'status') {
        const stA = a.status || '';
        const stB = b.status || '';
        diff = sortDirection === 'desc' ? stB.localeCompare(stA) : stA.localeCompare(stB);
      } else if (sortField === 'location') {
        const locA = a.location || '';
        const locB = b.location || '';
        diff = sortDirection === 'desc' ? locB.localeCompare(locA) : locA.localeCompare(locB);
      } else if (sortField === 'activity') {
        const actA = a.activity || '';
        const actB = b.activity || '';
        diff = sortDirection === 'desc' ? actB.localeCompare(actA) : actA.localeCompare(actB);
      } else {
        // Fallback to code or id
        const idA = a.code || a.id || '';
        const idB = b.code || b.id || '';
        diff = sortDirection === 'desc' ? idB.localeCompare(idA) : idA.localeCompare(idB);
      }

      if (diff !== 0) return diff;

      // Fallback secondary sort: Date & Time descending
      const fallbackTimeDiff = getNoteDateTimeTimestamp(b) - getNoteDateTimeTimestamp(a);
      if (fallbackTimeDiff !== 0) return fallbackTimeDiff;

      return (b.id || '').localeCompare(a.id || '');
    });
  }, [filteredNotes, sortField, sortDirection]);

  // Paginated Notes
  const totalPages = Math.max(1, Math.ceil(sortedNotes.length / pageSize));
  const paginatedNotes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedNotes.slice(start, start + pageSize);
  }, [sortedNotes, currentPage, pageSize]);

  // Handle Form Submit (Create / Edit)
  const handleSaveNote = async (formData: Partial<Note>) => {
    if (editingNote) {
      // Update
      const matchId = editingNote.id;
      const matchCode = editingNote.code;
      const updatedList = notes.map((n) =>
        n.id === matchId || (matchCode && n.code === matchCode)
          ? ({ ...n, ...formData, code: matchCode || n.code, updatedAt: new Date().toISOString().split('T')[0] } as Note)
          : n
      );
      setNotes(updatedList);
      noteService.saveToLocalCache(updatedList);
      if (selectedNoteForDetail?.id === matchId || (matchCode && selectedNoteForDetail?.code === matchCode)) {
        setSelectedNoteForDetail(updatedList.find((n) => n.id === matchId || (matchCode && n.code === matchCode)) || null);
      }
      setIsFormDrawerOpen(false);
      setEditingNote(null);
      // Background sync
      const target = updatedList.find((n) => n.id === matchId || (matchCode && n.code === matchCode));
      if (target) {
        noteService.updateInSheet(target).catch((e) => console.warn('Sync update failed', e));
      }
    } else {
      // Create - find max existing NOTE-xxx number to avoid code collisions
      const maxNum = notes.reduce((max, n) => {
        const m = (n.code || '').match(/NOTE-(\d+)/i);
        return m ? Math.max(max, parseInt(m[1], 10)) : max;
      }, 0);
      const newCode = `NOTE-${String(maxNum + 1).padStart(3, '0')}`;

      const newNote: Note = {
        id: 'note_' + Date.now(),
        code: newCode,
        title: formData.title || 'Ghi chú mới',
        summary: formData.summary,
        content: formData.content || '',
        category: formData.category || 'Nhật ký & Hoạt động',
        status: formData.status || 'published',
        isPinned: formData.isPinned || false,
        color: formData.color || 'blue',
        coverUrl: formData.coverUrl,
        images: formData.images || [],
        noteDate: formData.noteDate || new Date().toISOString().split('T')[0],
        noteTime: formData.noteTime,
        location: formData.location,
        coordinates: formData.coordinates,
        activity: formData.activity || '',
        participants: formData.participants || [],
        tags: formData.tags || [],
        attachments: formData.attachments || [],
        author: formData.author || currentUser?.name || currentUser?.username || 'admin',
        authorAvatar: getSafeAvatarUrl(
          formData.authorAvatar || currentUser?.avatarUrl,
          formData.author || currentUser?.name || currentUser?.username || 'admin'
        ),
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      const updatedList = [newNote, ...notes];
      setNotes(updatedList);
      noteService.saveToLocalCache(updatedList);
      setIsFormDrawerOpen(false);
      // Background sync
      noteService.appendToSheet(newNote).catch((e) => console.warn('Sync append failed', e));
    }
  };

  // Delete Note
  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết ghi chú này?')) return;
    const updatedList = notes.filter((n) => n.id !== id);
    setNotes(updatedList);
    noteService.saveToLocalCache(updatedList);
    if (selectedNoteForDetail?.id === id) {
      setSelectedNoteForDetail(null);
    }
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    noteService.deleteFromSheet(id).catch((e) => console.warn('Sync delete failed', e));
  };

  // Bulk Delete
  const handleDeleteSelected = async () => {
    if (!window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} ghi chú đã chọn?`)) return;
    const updatedList = notes.filter((n) => !selectedIds.includes(n.id));
    setNotes(updatedList);
    noteService.saveToLocalCache(updatedList);
    if (selectedNoteForDetail && selectedIds.includes(selectedNoteForDetail.id)) {
      setSelectedNoteForDetail(null);
    }
    const idsToDelete = [...selectedIds];
    setSelectedIds([]);
    noteService.deleteFromSheet(idsToDelete).catch((e) => console.warn('Sync bulk delete failed', e));
  };

  // Toggle Pin
  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updatedList = notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    setNotes(updatedList);
    noteService.saveToLocalCache(updatedList);
    const target = updatedList.find((n) => n.id === id);
    if (selectedNoteForDetail?.id === id && target) {
      setSelectedNoteForDetail(target);
    }
    if (target) {
      noteService.updateInSheet(target).catch((err) => console.warn('Sync pin failed', err));
    }
  };

  // Shift-click Selection Handlers
  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey && lastSelectedIdRef.current) {
      const lastIndex = paginatedNotes.findIndex((n) => n.id === lastSelectedIdRef.current);
      const currentIndex = paginatedNotes.findIndex((n) => n.id === id);
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = paginatedNotes.slice(start, end + 1).map((n) => n.id);
        setSelectedIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
        lastSelectedIdRef.current = id;
        return;
      }
    }
    lastSelectedIdRef.current = id;
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const isAllSelected = paginatedNotes.length > 0 && paginatedNotes.every((n) => selectedIds.includes(n.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = new Set(paginatedNotes.map((n) => n.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedNotes.map((n) => n.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Mã',
      'Tiêu đề',
      'Nội dung',
      'Chuyên mục',
      'Hoạt động',
      'Đi cùng ai / Đối tượng',
      'Trạng thái',
      'Ghim',
      'Thẻ',
      'Ngày',
      'Giờ',
      'Địa điểm',
      'Số đính kèm',
      'Tác giả',
      'Ngày tạo',
    ];
    const rows = sortedNotes.map((n) => [
      n.code || n.id,
      `"${(n.title || '').replace(/"/g, '""')}"`,
      `"${stripMarkdown(n.content || '').replace(/"/g, '""')}"`,
      `"${n.category}"`,
      `"${(n.activity || '').replace(/"/g, '""')}"`,
      `"${(n.participants || []).map((p) => p.name).join('; ')}"`,
      `"${n.status}"`,
      n.isPinned ? 'Có' : 'Không',
      `"${(n.tags || []).join(', ')}"`,
      n.noteDate || '',
      n.noteTime || '',
      `"${(n.location || '').replace(/"/g, '""')}"`,
      (n.attachments?.length || 0) + (n.images?.length || 0),
      `"${n.author || ''}"`,
      n.createdAt || '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ghi_chu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Visible table columns and pinned offsets
  const visibleColumns = useMemo(() => tableColumns.filter((c) => c.visible), [tableColumns]);

  const columnOffsets = useMemo(() => {
    let currentLeft = 44; // Checkbox column width
    const map = new Map<string, { left: number; isPinned: boolean; isLastPinned: boolean }>();
    let lastPinnedIndex = -1;
    visibleColumns.forEach((col, idx) => {
      if (col.pinned) lastPinnedIndex = idx;
    });

    visibleColumns.forEach((col, idx) => {
      if (col.pinned) {
        map.set(col.id, {
          left: currentLeft,
          isPinned: true,
          isLastPinned: idx === lastPinnedIndex,
        });
        currentLeft += col.width || 160;
      } else {
        map.set(col.id, { left: 0, isPinned: false, isLastPinned: false });
      }
    });
    return map;
  }, [visibleColumns]);

  // Density styling
  const headerPaddingClass =
    tableDensity === 'compact' ? 'py-1.5' : tableDensity === 'relaxed' ? 'py-3' : 'py-2';
  const cellPaddingClass =
    tableDensity === 'compact' ? 'py-1 px-3' : tableDensity === 'relaxed' ? 'py-3.5 px-4' : 'py-2 px-3.5';

  // Render Category Badge
  const renderCategoryBadge = (cat?: NoteCategory | string | null) => {
    if (!cat || typeof cat !== 'string' || !cat.trim()) {
      return <span className="text-muted-foreground text-xs">—</span>;
    }
    const lower = cat.toLowerCase();
    let colorClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    if (lower.includes('nhật ký') || lower.includes('hoạt động') || lower.includes('đi chơi')) {
      colorClass = 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
    } else if (lower.includes('cuộc họp')) {
      colorClass = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    } else if (lower.includes('kỹ thuật')) {
      colorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    } else if (lower.includes('kế hoạch')) {
      colorClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    } else if (lower.includes('ý tưởng')) {
      colorClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    } else if (lower.includes('quy trình')) {
      colorClass = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    } else if (lower.includes('khảo sát')) {
      colorClass = 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${colorClass}`}>
        {cat}
      </span>
    );
  };

  // Render Status Badge
  const renderStatusBadge = (status: NoteStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Đã công bố
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Bản nháp
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
            Lưu trữ
          </span>
        );
      default:
        return null;
    }
  };

  // Render Cell by Column ID
  const renderNoteCell = (col: ColumnItem, note: Note, stickyBgClass: string) => {
    const colId = col.id;
    const colWidth = col.width || 160;
    const colAlign = col.align || 'left';
    const alignClass = colAlign === 'center' ? 'text-center' : colAlign === 'right' ? 'text-right' : 'text-left';
    const wrapMode = col.wrap || 'truncate';
    const isWrap = wrapMode === 'wrap';
    const textWrapClass = isWrap
      ? 'whitespace-normal break-words leading-relaxed'
      : 'whitespace-nowrap truncate overflow-hidden text-ellipsis block w-full max-w-full';

    const offsetInfo = columnOffsets.get(colId);
    const isPinned = !!offsetInfo?.isPinned;
    const pinnedLeft = offsetInfo?.left || 0;
    const isLastPinned = !!offsetInfo?.isLastPinned;

    const stickyTdClass = isPinned
      ? `sticky z-[10] ${stickyBgClass} ${isLastPinned ? 'shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)]' : ''}`
      : stickyBgClass;

    const tdStyle: React.CSSProperties = {
      width: colWidth,
      minWidth: colWidth,
      maxWidth: colWidth,
      ...(isPinned ? { left: `${pinnedLeft}px` } : {}),
    };

    const tdBaseClass = `${cellPaddingClass} border-r border-border ${alignClass} ${stickyTdClass} overflow-hidden max-w-0`;

    switch (colId) {
      case 'title':
        return (
          <td key={colId} style={tdStyle} className={`${tdBaseClass} text-foreground`}>
            <div className="flex items-center gap-2 min-w-0 w-full overflow-hidden">
              {note.isPinned && (
                <button
                  type="button"
                  title="Đang ghim - bấm để bỏ ghim"
                  onClick={(e) => handleTogglePin(note.id, e)}
                  className="shrink-0 text-amber-500 hover:scale-110 transition-transform"
                >
                  <Pin className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
              {note.coverUrl && (
                <img
                  src={note.coverUrl}
                  alt=""
                  className="w-7 h-7 rounded-lg object-cover border border-border shrink-0"
                />
              )}
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className={`font-semibold hover:text-primary transition-colors cursor-pointer ${textWrapClass}`}>
                  {note.title}
                </span>
                {note.summary && (
                  <p className="text-[11px] text-muted-foreground truncate leading-tight">
                    {note.summary}
                  </p>
                )}
              </div>
            </div>
          </td>
        );

      case 'content':
        const cleanContent = stripMarkdown(note.content || '');
        return (
          <td key={colId} style={tdStyle} className={`${tdBaseClass} text-foreground/80`}>
            <div className={`w-full min-w-0 ${textWrapClass}`} title={cleanContent}>
              {cleanContent || '—'}
            </div>
          </td>
        );

      case 'category':
        return (
          <td key={colId} style={tdStyle} className={tdBaseClass}>
            {renderCategoryBadge(note.category)}
          </td>
        );

      case 'activity':
        return (
          <td key={colId} style={tdStyle} className={tdBaseClass}>
            {note.activity ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 max-w-full truncate">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span className="truncate">{note.activity}</span>
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </td>
        );

      case 'participants': {
        const parts = note.participants || [];
        return (
          <td key={colId} style={tdStyle} className={tdBaseClass}>
            {parts.length > 0 ? (
              <div className="flex items-center gap-1.5 overflow-hidden">
                <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                  {parts.slice(0, 3).map((p, idx) => (
                    <img
                      key={p.id || idx}
                      src={getSafeAvatarUrl(p.avatarUrl, p.name, '#3b82f6')}
                      alt={p.name}
                      title={`${p.name}${p.role ? ` (${p.role})` : ''}`}
                      className="inline-block h-6 w-6 rounded-full ring-2 ring-background object-cover shrink-0"
                    />
                  ))}
                </div>
                <div
                  className="min-w-0 flex-1 truncate text-xs text-foreground font-medium"
                  title={parts.map((p) => p.name).join(', ')}
                >
                  {parts.map((p) => p.name).join(', ')}
                </div>
                {parts.length > 3 && (
                  <span className="text-[10px] font-semibold text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded-full">
                    +{parts.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </td>
        );
      }

      case 'status':
        return (
          <td key={colId} style={tdStyle} className={tdBaseClass}>
            {renderStatusBadge(note.status)}
          </td>
        );

      case 'tags': {
        const validTags = Array.isArray(note.tags)
          ? note.tags.map((t) => (typeof t === 'string' ? t.trim() : '')).filter((t) => t.length > 0)
          : [];
        return (
          <td key={colId} style={tdStyle} className={tdBaseClass}>
            {validTags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1 overflow-hidden max-w-full">
                {validTags.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-medium text-foreground border border-border shrink-0 max-w-full truncate"
                  >
                    #{t.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </td>
        );
      }

      case 'noteDate':
        return (
          <td key={colId} style={tdStyle} className={`${tdBaseClass} tabular-nums text-muted-foreground`}>
            <div className={`w-full min-w-0 ${textWrapClass}`}>
              {note.noteDate ? formatDate(note.noteDate) : '—'}
            </div>
          </td>
        );

      case 'noteTime':
        return (
          <td key={colId} style={tdStyle} className={`${tdBaseClass} tabular-nums font-mono text-muted-foreground`}>
            <div className={`w-full min-w-0 ${textWrapClass}`}>
              {note.noteTime ? formatTime(note.noteTime) : '—'}
            </div>
          </td>
        );

      case 'location':
        return (
          <td key={colId} style={tdStyle} className={tdBaseClass}>
            {note.location ? (
              <div className="flex items-center gap-1.5 text-xs text-foreground min-w-0 overflow-hidden">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className={textWrapClass}>{note.location}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </td>
        );

      case 'attachments':
        const attachCount = (note.attachments?.length || 0) + (note.images?.length || 0);
        return (
          <td key={colId} style={tdStyle} className={tdBaseClass}>
            {attachCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <ImageIcon className="w-3 h-3" /> {attachCount} ảnh/tệp
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </td>
        );

      case 'author':
        return (
          <td key={colId} style={tdStyle} className={`${tdBaseClass} font-medium text-foreground`}>
            <div className={`w-full min-w-0 ${textWrapClass}`}>
              {note.author || currentUser?.name || currentUser?.username || '—'}
            </div>
          </td>
        );

      case 'summary':
        return (
          <td key={colId} style={tdStyle} className={`${tdBaseClass} text-muted-foreground`}>
            <div className={`w-full min-w-0 ${textWrapClass}`} title={note.summary}>
              {note.summary || '—'}
            </div>
          </td>
        );

      case 'createdAt':
        return (
          <td key={colId} style={tdStyle} className={`${tdBaseClass} tabular-nums text-muted-foreground`}>
            <div className={`w-full min-w-0 ${textWrapClass}`}>
              {note.createdAt ? formatDate(note.createdAt) : '—'}
            </div>
          </td>
        );

      case 'updatedAt':
        return (
          <td key={colId} style={tdStyle} className={`${tdBaseClass} tabular-nums text-muted-foreground`}>
            <div className={`w-full min-w-0 ${textWrapClass}`}>
              {note.updatedAt ? formatDate(note.updatedAt) : '—'}
            </div>
          </td>
        );

      default:
        return (
          <td key={colId} style={tdStyle} className={tdBaseClass}>
            —
          </td>
        );
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* Top View Tabs: Danh sách / Lịch ghi chú / Thống kê */}
      <div className="flex items-center gap-1.5 mb-1.5 px-0.5 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTopTab('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'list'
              ? 'bg-primary text-primary-foreground shadow-xs shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Danh sách bài viết</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTopTab('calendar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'calendar'
              ? 'bg-primary text-primary-foreground shadow-xs shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Lịch ghi chú</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTopTab('stats')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'stats'
              ? 'bg-primary text-primary-foreground shadow-xs shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <ChartColumn className="w-3.5 h-3.5" />
          <span>Thống kê</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {/* Main Card Container */}
        <div className="flex-1 min-h-0 flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-xs">
          {/* Header Bar Toolbar */}
          {activeTopTab === 'list' && (
            <div className="px-3 py-2 border-b border-border bg-card">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
                {/* Left: Back button, Search and Filters */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                  {/* Quay lại Button */}
                  <button
                    type="button"
                    onClick={onBack}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                    title="Quay lại Hệ thống"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">Quay lại</span>
                  </button>

                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[160px] max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Tìm tiêu đề, nội dung, thẻ, vị trí..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Filter: Category */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedCategory !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>{selectedCategory === 'all' ? 'Chuyên mục' : selectedCategory}</span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>

                    {isCategoryDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setIsCategoryDropdownOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-border bg-card shadow-lg z-40 p-1.5 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory('all');
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                              selectedCategory === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Tất cả chuyên mục
                          </button>
                          {NOTE_CATEGORIES.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(cat);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                selectedCategory === cat ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter: Status */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedStatus !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <span>
                        {selectedStatus === 'all'
                          ? 'Trạng thái'
                          : selectedStatus === 'published'
                          ? 'Đã công bố'
                          : selectedStatus === 'draft'
                          ? 'Bản nháp'
                          : 'Lưu trữ'}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>

                    {isStatusDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setIsStatusDropdownOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-1 w-44 rounded-xl border border-border bg-card shadow-lg z-40 p-1.5 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatus('all');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                              selectedStatus === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Tất cả trạng thái
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatus('published');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-emerald-600 ${
                              selectedStatus === 'published' ? 'bg-emerald-500/10 font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Đã công bố
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatus('draft');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-amber-600 ${
                              selectedStatus === 'draft' ? 'bg-amber-500/10 font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Bản nháp
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatus('archived');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-muted-foreground ${
                              selectedStatus === 'archived' ? 'bg-muted font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Lưu trữ
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter: Tags */}
                  {allUniqueTags.length > 0 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                        className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          selectedTag !== 'all'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>{selectedTag === 'all' ? 'Thẻ (Tags)' : `#${selectedTag}`}</span>
                        <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                      </button>

                      {isTagDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setIsTagDropdownOpen(false)}
                          />
                          <div className="absolute left-0 top-full mt-1 w-48 max-h-60 overflow-y-auto rounded-xl border border-border bg-card shadow-lg z-40 p-1.5 space-y-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTag('all');
                                setIsTagDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                selectedTag === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                              }`}
                            >
                              Tất cả thẻ
                            </button>
                            {allUniqueTags.map((tg) => (
                              <button
                                key={tg}
                                type="button"
                                onClick={() => {
                                  setSelectedTag(tg);
                                  setIsTagDropdownOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                  selectedTag === tg ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                                }`}
                              >
                                #{tg}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Filter: Participant / Đi cùng ai */}
                  {allUniqueParticipants.length > 0 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsParticipantDropdownOpen(!isParticipantDropdownOpen)}
                        className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          selectedParticipant !== 'all'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {selectedParticipant === 'all'
                            ? 'Đi cùng ai'
                            : selectedParticipant}
                        </span>
                        <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                      </button>

                      {isParticipantDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setIsParticipantDropdownOpen(false)}
                          />
                          <div className="absolute left-0 top-full mt-1 w-56 max-h-60 overflow-y-auto rounded-xl border border-border bg-card shadow-lg z-40 p-1.5 space-y-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedParticipant('all');
                                setIsParticipantDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                selectedParticipant === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                              }`}
                            >
                              Tất cả người tham gia
                            </button>
                            {allUniqueParticipants.map((p) => (
                              <button
                                key={p.name}
                                type="button"
                                onClick={() => {
                                  setSelectedParticipant(p.name);
                                  setIsParticipantDropdownOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                  selectedParticipant === p.name ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                                }`}
                              >
                                <img
                                  src={getSafeAvatarUrl(p.avatarUrl, p.name, '#3b82f6')}
                                  alt=""
                                  className="w-5 h-5 rounded-full object-cover shrink-0"
                                />
                                <span className="truncate flex-1 text-left">{p.name}</span>
                                {p.role && <span className="text-[10px] text-muted-foreground truncate">{p.role}</span>}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Filter: Pinned Only */}
                  <button
                    type="button"
                    onClick={() => setOnlyPinned(!onlyPinned)}
                    className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      onlyPinned
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Pin className={`w-3.5 h-3.5 ${onlyPinned ? 'fill-current' : ''}`} />
                    <span>Ghim</span>
                  </button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-auto">
                  {/* Bulk Delete Button when items are selected */}
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      title={`Xóa ${selectedIds.length} ghi chú đã chọn`}
                      className="h-8 px-2.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa ({selectedIds.length})</span>
                    </button>
                  )}

                  {/* Google Sheets Realtime Smart Sync Badge */}
                  <RealtimeSyncBadge
                    isSyncing={isSyncing}
                    lastSyncTime={lastSyncTime}
                    onSync={handleManualSync}
                  />

                  {/* Print */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    title="In danh sách"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  {/* Bookmark */}
                  <button
                    type="button"
                    title="Ghim mục"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>

                  {/* Column Customizer Popover */}
                  <ColumnCustomizerPopover
                    columns={tableColumns}
                    onChangeColumns={handleSaveColumns}
                    density={tableDensity}
                    onChangeDensity={handleSaveDensity}
                    onReset={handleResetColumns}
                    align="right"
                  />

                  {/* Grid / Table Toggle */}
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                    title={viewMode === 'table' ? 'Xem dạng lưới thẻ' : 'Xem dạng bảng dữ liệu'}
                    className={`h-8 w-8 flex items-center justify-center border rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>

                  {/* Export CSV */}
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    title="Xuất file CSV"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Add Note Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNote(null);
                      setIsFormDrawerOpen(true);
                    }}
                    className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>

              {/* Toast Alerts */}
              {syncToastMessage && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{syncToastMessage}</span>
                </div>
              )}
              {syncError && (
                <div className="mt-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{syncError}</span>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Lịch ghi chú & sự kiện */}
          {activeTopTab === 'calendar' && (
            <div className="flex-1 min-h-0 flex flex-col">
              <NoteCalendarView
                notes={notes}
                onSelectNote={(note) => setSelectedNoteForDetail(note)}
                onAddNote={(defaultDate) => {
                  setEditingNote(null);
                  setDefaultFormDate(defaultDate);
                  setIsFormDrawerOpen(true);
                }}
                onEditNote={(note) => {
                  setEditingNote(note);
                  setIsFormDrawerOpen(true);
                }}
              />
            </div>
          )}

          {/* Tab 3: Thống kê */}
          {activeTopTab === 'stats' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <NoteStatsTab notes={notes} />
            </div>
          )}

          {/* Tab 1: Danh sách */}
          {activeTopTab === 'list' && (
            <div className="flex-1 min-h-0 flex flex-col">
              {viewMode === 'table' ? (
                /* Desktop Table View */
                <div className="flex-1 min-h-0 relative overflow-hidden">
                  <div className="h-full overflow-auto custom-scrollbar">
                    <table className="text-left border-separate border-spacing-0 w-max min-w-full text-xs table-fixed">
                      <thead className="sticky top-0 z-[20] bg-muted">
                        <tr className="border-b border-border bg-muted">
                          {/* Sticky Checkbox */}
                          <th
                            style={{ width: 44, minWidth: 44, maxWidth: 44 }}
                            className={`sticky left-0 z-[25] px-3 bg-muted border-b border-r border-border text-center ${headerPaddingClass} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]`}
                          >
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={handleSelectAll}
                              className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                            />
                          </th>

                          {/* Dynamic Columns */}
                          {visibleColumns.map((col) => {
                            const colWidth = col.width || 160;
                            const colAlign = col.align || 'left';
                            const alignClass = colAlign === 'center' ? 'text-center' : colAlign === 'right' ? 'text-right' : 'text-left';
                            const justifyClass = colAlign === 'center' ? 'justify-center' : colAlign === 'right' ? 'justify-end' : 'justify-between';

                            const offsetInfo = columnOffsets.get(col.id);
                            const isPinned = !!offsetInfo?.isPinned;
                            const pinnedLeft = offsetInfo?.left || 0;
                            const isLastPinned = !!offsetInfo?.isLastPinned;

                            const stickyThClass = isPinned
                              ? `sticky z-[25] bg-muted ${isLastPinned ? 'shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)]' : ''}`
                              : 'bg-muted';

                            const thStyle: React.CSSProperties = {
                              width: colWidth,
                              minWidth: colWidth,
                              maxWidth: colWidth,
                              ...(isPinned ? { left: `${pinnedLeft}px` } : {}),
                            };

                            const isCurrentSort =
                              sortField === col.id ||
                              ((col.id === 'noteDate' || col.id === 'noteTime') && sortField === 'dateTime');

                            return (
                              <th
                                key={col.id}
                                style={thStyle}
                                className={`font-semibold text-foreground border-b border-r border-border whitespace-nowrap px-3 ${headerPaddingClass} ${alignClass} ${stickyThClass} relative group/th select-none`}
                              >
                                <div
                                  onClick={() => handleSortColumn(col.id)}
                                  title={`Sắp xếp theo ${col.label} (Bấm để đổi chiều)`}
                                  className={`flex items-center ${justifyClass} gap-1 pr-1 cursor-pointer hover:text-primary transition-colors py-0.5 rounded ${
                                    isCurrentSort ? 'text-primary font-bold' : ''
                                  }`}
                                >
                                  <span className="truncate">{col.label}</span>
                                  {isCurrentSort ? (
                                    sortDirection === 'desc' ? (
                                      <ArrowDownWideNarrow className="w-3.5 h-3.5 text-primary shrink-0" />
                                    ) : (
                                      <ArrowUpNarrowWide className="w-3.5 h-3.5 text-primary shrink-0" />
                                    )
                                  ) : (
                                    <ArrowUpDown className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover/th:opacity-100 transition-opacity shrink-0" />
                                  )}
                                  {isPinned && (
                                    <span title="Cột đang ghim cố định" className="inline-flex">
                                      <Pin className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 fill-current shrink-0" />
                                    </span>
                                  )}
                                </div>
                                {/* Resizer Handle */}
                                <div
                                  className={`absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize select-none z-20 flex justify-center items-center group/resizer hover:bg-primary/20 ${
                                    resizingColId === col.id ? 'bg-primary/30' : ''
                                  }`}
                                  onMouseDown={(e) => handleStartResize(col.id, e)}
                                  title={`Kéo để chỉnh kích thước cột ${col.label}`}
                                >
                                  <div className="w-[2px] h-3.5 bg-border group-hover/resizer:bg-primary group-hover/resizer:h-full transition-all" />
                                </div>
                              </th>
                            );
                          })}

                          {/* Sticky Thao tác Action Header */}
                          <th
                            style={{ width: 76, minWidth: 76, maxWidth: 76 }}
                            className={`sticky right-0 z-[25] px-3 bg-muted border-b border-l border-border text-center font-semibold text-foreground ${headerPaddingClass} shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]`}
                          >
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedNotes.length === 0 ? (
                          <tr>
                            <td
                              colSpan={tableColumns.filter((c) => c.visible).length + 2}
                              className="py-12 text-center text-muted-foreground bg-card"
                            >
                              Không tìm thấy bài viết ghi chú nào phù hợp
                            </td>
                          </tr>
                        ) : (
                          paginatedNotes.map((note, index) => {
                            const isSelected = selectedIds.includes(note.id);
                            const isActiveDetail = selectedNoteForDetail?.id === note.id;
                            const isEven = index % 2 === 1;

                            // 100% solid opaque background to prevent bleed-through
                            const stickyBgClass = isActiveDetail
                              ? 'bg-blue-100 dark:bg-blue-950 text-foreground !bg-opacity-100'
                              : isSelected
                              ? 'bg-blue-50 dark:bg-blue-900 text-foreground group-hover:bg-blue-100 dark:group-hover:bg-blue-800 !bg-opacity-100'
                              : isEven
                              ? 'bg-slate-50 dark:bg-slate-900 text-foreground group-hover:bg-slate-100 dark:group-hover:bg-slate-850 !bg-opacity-100'
                              : 'bg-white dark:bg-card text-foreground group-hover:bg-slate-100 dark:group-hover:bg-slate-850 !bg-opacity-100';

                            const rowBgClass = isActiveDetail
                              ? 'bg-blue-100 dark:bg-blue-950'
                              : isSelected
                              ? 'bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800'
                              : isEven
                              ? 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850'
                              : 'bg-white dark:bg-card hover:bg-slate-100 dark:hover:bg-slate-850';

                            return (
                              <tr
                                key={note.id}
                                onClick={() => setSelectedNoteForDetail(note)}
                                aria-current={isActiveDetail}
                                className={`group cursor-pointer transition-colors ${rowBgClass} [&>td]:border-b [&>td]:border-border`}
                              >
                                {/* 1. Sticky Checkbox */}
                                <td
                                  style={{ width: 44, minWidth: 44, maxWidth: 44 }}
                                  className={`sticky left-0 z-[10] px-3 ${cellPaddingClass.split(' ')[0]} border-r border-border text-center ${stickyBgClass} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] cursor-pointer select-none`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSelect(note.id, e);
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleSelect(note.id, e);
                                    }}
                                    onChange={() => {}}
                                    className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer align-middle"
                                  />
                                </td>

                                {/* Dynamic Columns (Ordered: Tiêu đề -> Nội dung -> ...) */}
                                {visibleColumns.map((col) => renderNoteCell(col, note, stickyBgClass))}

                                {/* Sticky Thao tác */}
                                <td
                                  style={{ width: 76, minWidth: 76, maxWidth: 76 }}
                                  className={`sticky right-0 z-[10] px-2 ${cellPaddingClass.split(' ')[0]} border-l border-border/50 text-center ${stickyBgClass} shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]`}
                                >
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      title="Chỉnh sửa bài viết"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingNote(note);
                                        setIsFormDrawerOpen(true);
                                      }}
                                      className="p-1 rounded-md text-primary hover:bg-primary/10 transition-colors"
                                    >
                                      <SquarePen className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Xóa bài viết"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteNote(note.id);
                                      }}
                                      className="p-1 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Grid Cards View */
                <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedNotes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => setSelectedNoteForDetail(note)}
                        className="group rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between overflow-hidden relative"
                      >
                        {/* Cover Image */}
                        {note.coverUrl && (
                          <div className="h-36 w-full overflow-hidden bg-muted/40 relative">
                            <img
                              src={note.coverUrl}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2.5 left-2.5">
                              {renderCategoryBadge(note.category)}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleTogglePin(note.id, e)}
                              className={`absolute top-2.5 right-2.5 p-1.5 rounded-full shadow-md backdrop-blur-md transition-transform ${
                                note.isPinned
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-black/40 text-white hover:bg-black/60'
                              }`}
                              title={note.isPinned ? 'Bỏ ghim' : 'Ghim bài'}
                            >
                              <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        )}

                        {/* Card Body */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            {!note.coverUrl && (
                              <div className="flex items-center justify-between gap-2 mb-2">
                                {renderCategoryBadge(note.category)}
                                <button
                                  type="button"
                                  onClick={(e) => handleTogglePin(note.id, e)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    note.isPinned
                                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                  }`}
                                >
                                  <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
                                </button>
                              </div>
                            )}

                            <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                              {note.title}
                            </h3>

                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">
                              {note.summary || note.content.replace(/<[^>]*>?/gm, '').replace(/^[#>\-\*]+\s*/gm, '').trim()}
                            </p>
                          </div>

                          {/* Meta elements */}
                          <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
                            {/* Activity & Participants for Diary */}
                            {(note.activity || (note.participants && note.participants.length > 0)) && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {note.activity && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 max-w-full truncate">
                                    <Sparkles className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{note.activity}</span>
                                  </span>
                                )}
                                {note.participants && note.participants.length > 0 && (
                                  <div className="flex items-center gap-1 bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/60 text-[11px] text-muted-foreground">
                                    <Users className="w-3 h-3 text-primary shrink-0" />
                                    <div className="flex -space-x-1 overflow-hidden">
                                      {note.participants.slice(0, 3).map((p, idx) => (
                                        <img
                                          key={p.id || idx}
                                          src={getSafeAvatarUrl(p.avatarUrl, p.name, '#3b82f6')}
                                          alt={p.name}
                                          title={p.name}
                                          className="inline-block h-4 w-4 rounded-full ring-1 ring-background object-cover shrink-0"
                                        />
                                      ))}
                                    </div>
                                    <span className="truncate max-w-[110px]" title={note.participants.map((p) => p.name).join(', ')}>
                                      {note.participants.map((p) => p.name).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Tags */}
                            {note.tags && note.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {note.tags.slice(0, 3).map((tg, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] font-medium text-muted-foreground"
                                  >
                                    #{tg}
                                  </span>
                                ))}
                                {note.tags.length > 3 && (
                                  <span className="text-[10px] text-muted-foreground self-center">
                                    +{note.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Location & Time */}
                            <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-primary" />
                                {note.noteTime ? `${formatTime(note.noteTime)} · ` : ''}
                                {note.noteDate ? formatDate(note.noteDate) : (note.createdAt ? formatDate(note.createdAt) : '—')}
                              </span>
                              {note.location && (
                                <span className="flex items-center gap-1 truncate max-w-[120px]">
                                  <MapPin className="w-3 h-3 text-primary shrink-0" />
                                  <span className="truncate">{note.location}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Card Hover Actions */}
                        <div className="px-4 py-2 bg-muted/30 border-t border-border/60 flex items-center justify-between text-xs">
                          {renderStatusBadge(note.status)}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingNote(note);
                                setIsFormDrawerOpen(true);
                              }}
                              className="p-1 rounded-md text-primary hover:bg-primary/10 transition-colors"
                              title="Sửa bài viết"
                            >
                              <SquarePen className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNote(note.id);
                              }}
                              className="p-1 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                              title="Xóa bài viết"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sticky Footer: Selection stats & Pagination Controls */}
              <div className="px-3 py-2 border-t border-border bg-card flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    Tổng số: <strong className="text-foreground">{sortedNotes.length}</strong> bài viết
                  </span>
                  {selectedIds.length > 0 && (
                    <span className="text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                      Đã chọn {selectedIds.length} mục
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-1.5 text-muted-foreground mr-2">
                    <span className="hidden sm:inline">Hiển thị:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value={10}>10 / trang</option>
                      <option value={20}>20 / trang</option>
                      <option value={50}>50 / trang</option>
                      <option value={100}>100 / trang</option>
                      <option value={200}>200 / trang</option>
                      <option value={500}>500 / trang</option>
                    </select>
                  </div>

                  {/* Pagination Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(1)}
                      className="p-1 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
                      title="Trang đầu"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
                      title="Trang trước"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 font-medium text-foreground">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
                      title="Trang sau"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="p-1 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
                      title="Trang cuối"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      <NoteDetailDrawer
        isOpen={!!selectedNoteForDetail}
        note={selectedNoteForDetail}
        allNotes={sortedNotes}
        onClose={() => setSelectedNoteForDetail(null)}
        onNavigate={(nextNote) => setSelectedNoteForDetail(nextNote)}
        onEdit={(noteToEdit) => {
          setSelectedNoteForDetail(null);
          setEditingNote(noteToEdit);
          setIsFormDrawerOpen(true);
        }}
        onDelete={(noteId) => handleDeleteNote(noteId)}
        onTogglePin={(noteId) => handleTogglePin(noteId)}
      />

      {/* Form Drawer (Create / Edit) */}
      <NoteFormDrawer
        isOpen={isFormDrawerOpen}
        initialData={editingNote}
        defaultDate={defaultFormDate}
        existingTags={allUniqueTags}
        onClose={() => {
          setIsFormDrawerOpen(false);
          setEditingNote(null);
          setDefaultFormDate(undefined);
        }}
        onSubmit={handleSaveNote}
      />
    </div>
  );
};
