import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChartColumn,
  Pin,
  SlidersHorizontal,
  Printer,
  MapPin,
  Calendar,
  ImageIcon,
} from 'lucide-react';
import { Note, NoteCategory, NoteStatus } from '../../types/note';
import { NOTE_CATEGORIES } from '../../data/notes';
import { noteService } from '../../services/noteService';
import { NoteDetailDrawer } from './NoteDetailDrawer';
import { NoteFormDrawer } from './NoteFormDrawer';
import { NoteStatsTab } from './NoteStatsTab';
import {
  ColumnCustomizerPopover,
  ColumnItem,
  TableDensity,
} from '../common/ColumnCustomizerPopover';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { stripMarkdown } from './MarkdownRenderer';

interface NotePageProps {
  onBack: () => void;
}

// Ordered columns: Tiêu đề -> Nội dung -> Chuyên mục -> Thẻ -> Trạng thái -> Ngày -> Giờ -> Vị trí -> Đính kèm -> Tác giả
export const DEFAULT_NOTE_COLUMNS: ColumnItem[] = [
  { id: 'title', label: 'Tiêu đề', visible: true, pinned: true, width: 260, align: 'left', wrap: 'truncate' },
  { id: 'content', label: 'Nội dung bài viết', visible: true, pinned: false, width: 380, align: 'left', wrap: 'truncate' },
  { id: 'category', label: 'Chuyên mục', visible: true, pinned: false, width: 160, align: 'center', wrap: 'truncate' },
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

export const NotePage: React.FC<NotePageProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const { formatDate, formatTime } = useSettings();
  const [notes, setNotes] = useState<Note[]>(() => noteService.getInitialNotes());
  const [activeTopTab, setActiveTopTab] = useState<'list' | 'stats'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [onlyPinned, setOnlyPinned] = useState(false);

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Detail & Edit Drawers
  const [selectedNoteForDetail, setSelectedNoteForDetail] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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

  // Background Sheets Sync on Load
  useEffect(() => {
    let isMounted = true;
    const loadFromSheet = async () => {
      try {
        const sheetNotes = await noteService.fetchFromSheet();
        if (isMounted && sheetNotes && sheetNotes.length > 0) {
          setNotes(sheetNotes);
        }
      } catch (err) {
        console.warn('Note background sync initial load notice:', err);
      }
    };
    loadFromSheet();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync handler
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncToastMessage(null);
    setSyncError(null);
    try {
      const sheetNotes = await noteService.fetchFromSheet();
      if (sheetNotes && sheetNotes.length > 0) {
        setNotes(sheetNotes);
        setSyncToastMessage(`Đã đồng bộ thành công ${sheetNotes.length} bài viết ghi chú từ Google Sheet!`);
      } else {
        setSyncToastMessage('Dữ liệu ghi chú đã cập nhật mới nhất!');
      }
    } catch (err: any) {
      setSyncError(err?.message || 'Lỗi đồng bộ với Google Sheets');
    } finally {
      setIsSyncing(false);
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
        if (!matchTitle && !matchSummary && !matchContent && !matchTags && !matchLoc && !matchAuthor) {
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

      // Pinned
      if (onlyPinned && !n.isPinned) {
        return false;
      }

      return true;
    });
  }, [notes, searchQuery, selectedCategory, selectedStatus, selectedTag, onlyPinned]);

  // Sort notes: pinned first, then newest
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '');
    });
  }, [filteredNotes]);

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
      const updatedList = notes.map((n) =>
        n.id === editingNote.id ? ({ ...n, ...formData, updatedAt: new Date().toISOString().split('T')[0] } as Note) : n
      );
      setNotes(updatedList);
      noteService.saveToLocalCache(updatedList);
      if (selectedNoteForDetail?.id === editingNote.id) {
        setSelectedNoteForDetail(updatedList.find((n) => n.id === editingNote.id) || null);
      }
      setIsFormDrawerOpen(false);
      setEditingNote(null);
      // Background sync
      const target = updatedList.find((n) => n.id === editingNote.id);
      if (target) {
        noteService.updateInSheet(target).catch((e) => console.warn('Sync update failed', e));
      }
    } else {
      // Create
      const newNote: Note = {
        id: 'note_' + Date.now(),
        code: `NOTE-${String(notes.length + 1).padStart(3, '0')}`,
        title: formData.title || 'Ghi chú mới',
        summary: formData.summary,
        content: formData.content || '',
        category: formData.category || 'Biên bản cuộc họp',
        status: formData.status || 'published',
        isPinned: formData.isPinned || false,
        color: formData.color || 'blue',
        coverUrl: formData.coverUrl,
        images: formData.images || [],
        noteDate: formData.noteDate || new Date().toISOString().split('T')[0],
        noteTime: formData.noteTime,
        location: formData.location,
        coordinates: formData.coordinates,
        tags: formData.tags || [],
        attachments: formData.attachments || [],
        author: formData.author || currentUser?.name || currentUser?.username || 'admin',
        authorAvatar:
          formData.authorAvatar ||
          currentUser?.avatarUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || currentUser?.username || 'admin')}&background=1d4ed8&color=fff`,
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
    const headers = ['Mã', 'Tiêu đề', 'Nội dung', 'Chuyên mục', 'Trạng thái', 'Ghim', 'Thẻ', 'Ngày', 'Giờ', 'Địa điểm', 'Số đính kèm', 'Tác giả', 'Ngày tạo'];
    const rows = sortedNotes.map((n) => [
      n.code || n.id,
      `"${(n.title || '').replace(/"/g, '""')}"`,
      `"${stripMarkdown(n.content || '').replace(/"/g, '""')}"`,
      `"${n.category}"`,
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
    if (lower.includes('cuộc họp')) colorClass = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    if (lower.includes('kỹ thuật')) colorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (lower.includes('kế hoạch')) colorClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    if (lower.includes('ý tưởng')) colorClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    if (lower.includes('quy trình')) colorClass = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    if (lower.includes('khảo sát')) colorClass = 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';

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
      {/* Top View Tabs: Danh sách / Thống kê */}
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

                  {/* Google Sheets Live Sync */}
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    title="Đồng bộ 2 chiều với Google Sheet"
                    className="h-8 px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">
                      {isSyncing ? 'Đang đồng bộ...' : 'Google Sheet'}
                    </span>
                  </button>

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

          {/* Tab 2: Thống kê */}
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

                            return (
                              <th
                                key={col.id}
                                style={thStyle}
                                className={`font-semibold text-foreground border-b border-r border-border whitespace-nowrap px-4 ${headerPaddingClass} ${alignClass} ${stickyThClass} relative group/th select-none`}
                              >
                                <div className={`flex items-center ${justifyClass} gap-1 pr-1`}>
                                  <span className="truncate">{col.label}</span>
                                  {isPinned && (
                                    <span title="Cột đang ghim cố định" className="inline-flex">
                                      <Pin className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 fill-current shrink-0" />
                                    </span>
                                  )}
                                  <SlidersHorizontal className="w-3 h-3 text-muted-foreground/50 shrink-0" />
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
        existingTags={allUniqueTags}
        onClose={() => {
          setIsFormDrawerOpen(false);
          setEditingNote(null);
        }}
        onSubmit={handleSaveNote}
      />
    </div>
  );
};
