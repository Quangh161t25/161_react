import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  BookOpen,
  Plus,
  Trash2,
  List,
  LayoutGrid,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Star,
  Pin,
  ExternalLink,
  Link2,
  Download,
  ChartColumn,
  RotateCcw,
  CheckCircle2,
  GraduationCap,
  X,
} from 'lucide-react';
import { LearningEntry, MasteryLevel } from '../../types/learning';
import { LEARNING_CATEGORIES, MASTERY_LEVEL_MAP } from '../../data/learning';
import { learningService } from '../../services/learningService';
import { LearningFormDrawer } from './LearningFormDrawer';
import { LearningDetailDrawer } from './LearningDetailDrawer';
import { LearningStatsTab } from './LearningStatsTab';
import {
  ColumnCustomizerPopover,
  ColumnItem,
  TableDensity,
} from '../common/ColumnCustomizerPopover';
import { stripMarkdown } from '../notes/MarkdownRenderer';
import { useAutoSync } from '../../hooks/useAutoSync';
import { RealtimeSyncBadge } from '../common/RealtimeSyncBadge';
import { useSettings } from '../../context/SettingsContext';

// Helper to extract all image URLs (cover, uploaded images array/string, and markdown images) from a learning entry
export function getLearningEntryImages(entry: LearningEntry): string[] {
  const list: string[] = [];
  const addUrl = (raw: string | undefined | null) => {
    if (!raw || typeof raw !== 'string') return;
    const clean = raw.trim();
    if (clean && !list.includes(clean)) {
      list.push(clean);
    }
  };

  addUrl(entry.coverUrl);

  if (Array.isArray(entry.images)) {
    entry.images.forEach((url) => addUrl(url));
  } else if (typeof entry.images === 'string') {
    try {
      const parsed = JSON.parse(entry.images);
      if (Array.isArray(parsed)) parsed.forEach((url) => addUrl(url));
      else addUrl(entry.images);
    } catch {
      (entry.images as string).split(/[\n,;]+/).forEach((url) => addUrl(url));
    }
  }

  if (entry.content) {
    const mdRegex = /!\[.*?\]\((https?:\/\/[^\)\s]+)\)/g;
    let match;
    while ((match = mdRegex.exec(entry.content)) !== null) {
      addUrl(match[1]);
    }
    const bareImgRegex = /(https?:\/\/[^\s<>"'\)]+\.(?:png|jpe?g|webp|gif|svg))/gi;
    let bareMatch;
    while ((bareMatch = bareImgRegex.exec(entry.content)) !== null) {
      addUrl(bareMatch[1]);
    }
  }

  return list;
}

interface LearningPageProps {
  onBack: () => void;
}

export const DEFAULT_LEARNING_COLUMNS: ColumnItem[] = [
  { id: 'code', label: 'Mã', visible: true, pinned: true, width: 110, align: 'left', wrap: 'truncate' },
  { id: 'image', label: 'Hình ảnh', visible: true, width: 130, align: 'center', wrap: 'wrap' },
  { id: 'title', label: 'Tiêu đề kiến thức', visible: true, pinned: true, width: 280, align: 'left', wrap: 'truncate' },
  { id: 'content', label: 'Nội dung', visible: true, width: 340, align: 'left', wrap: 'truncate' },
  { id: 'category', label: 'Chuyên mục', visible: true, width: 170, align: 'center', wrap: 'truncate' },
  { id: 'masteryLevel', label: 'Mức độ nắm vững', visible: true, width: 150, align: 'center', wrap: 'truncate' },
  { id: 'rating', label: 'Đánh giá', visible: true, width: 110, align: 'center', wrap: 'truncate' },
  { id: 'source', label: 'Nguồn & Tác giả', visible: true, width: 200, align: 'left', wrap: 'truncate' },
  { id: 'sourceUrl', label: 'Link tham khảo', visible: true, width: 180, align: 'left', wrap: 'truncate' },
  { id: 'tags', label: 'Thẻ (Tags)', visible: true, width: 180, align: 'left', wrap: 'truncate' },
  { id: 'summary', label: 'Ý chính cốt lõi', visible: true, width: 300, align: 'left', wrap: 'truncate' },
  { id: 'entryDate', label: 'Ngày học', visible: true, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'nextReviewDate', label: 'Ngày ôn lại', visible: true, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'difficulty', label: 'Độ khó', visible: false, width: 110, align: 'center', wrap: 'truncate' },
  { id: 'createdAt', label: 'Ngày tạo', visible: false, width: 130, align: 'center', wrap: 'truncate' },
];

export const LearningPage: React.FC<LearningPageProps> = ({ onBack }) => {
  const [entries, setEntries] = useState<LearningEntry[]>(() => learningService.getInitialEntries());
  const [activeTopTab, setActiveTopTab] = useState<'list' | 'stats'>('list');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMastery, setSelectedMastery] = useState<string>('all');
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [onlyDueForReview, setOnlyDueForReview] = useState(false);

  // Dropdowns
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isMasteryOpen, setIsMasteryOpen] = useState(false);

  // Selection & Drawers
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedEntryForDetail, setSelectedEntryForDetail] = useState<LearningEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<LearningEntry | null>(null);
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Lightbox Gallery Modal state
  const [galleryModal, setGalleryModal] = useState<{
    images: string[];
    currentIndex: number;
    title: string;
  } | null>(null);

  // Keyboard navigation for Lightbox Gallery (Esc: close, ArrowLeft: prev, ArrowRight: next)
  useEffect(() => {
    if (!galleryModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setGalleryModal(null);
      } else if (e.key === 'ArrowLeft') {
        setGalleryModal((prev) => {
          if (!prev || prev.images.length <= 1) return prev;
          const prevIdx = prev.currentIndex > 0 ? prev.currentIndex - 1 : prev.images.length - 1;
          return { ...prev, currentIndex: prevIdx };
        });
      } else if (e.key === 'ArrowRight') {
        setGalleryModal((prev) => {
          if (!prev || prev.images.length <= 1) return prev;
          const nextIdx = prev.currentIndex < prev.images.length - 1 ? prev.currentIndex + 1 : 0;
          return { ...prev, currentIndex: nextIdx };
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryModal]);

  // User global settings
  const { settings } = useSettings();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(settings.rowsPerPage || 50);

  useEffect(() => {
    if (settings.rowsPerPage) {
      setPageSize(settings.rowsPerPage);
      setCurrentPage(1);
    }
  }, [settings.rowsPerPage]);

  // Resizing state
  const resizingRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);

  // Column Customizer & Density State
  const [tableColumns, setTableColumns] = useState<ColumnItem[]>(() => {
    try {
      const saved = localStorage.getItem('erp_learning_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map(parsed.map((p: ColumnItem) => [p.id, p]));
          const merged: ColumnItem[] = [];
          parsed.forEach((p: ColumnItem) => {
            const def = DEFAULT_LEARNING_COLUMNS.find((d) => d.id === p.id);
            if (def) {
              merged.push({
                ...def,
                ...p,
                label: def.label,
                width: p.width || def.width || 150,
              });
            }
          });
          DEFAULT_LEARNING_COLUMNS.forEach((def, defIdx) => {
            if (!map.has(def.id)) {
              const prevDef = DEFAULT_LEARNING_COLUMNS[defIdx - 1];
              const prevIdx = prevDef ? merged.findIndex((c) => c.id === prevDef.id) : -1;
              if (prevIdx !== -1) {
                merged.splice(prevIdx + 1, 0, def);
              } else {
                merged.push(def);
              }
            }
          });
          if (merged.length !== parsed.length) {
            try {
              localStorage.setItem('erp_learning_columns', JSON.stringify(merged));
            } catch {}
          }
          return merged;
        }
      }
    } catch {}
    return DEFAULT_LEARNING_COLUMNS;
  });

  const [tableDensity, setTableDensity] = useState<TableDensity>(() => {
    try {
      const saved = localStorage.getItem('erp_learning_density');
      if (saved === 'compact' || saved === 'normal' || saved === 'relaxed') return saved;
    } catch {}
    return 'normal';
  });

  const handleSaveColumns = (newCols: ColumnItem[]) => {
    setTableColumns(newCols);
    try {
      localStorage.setItem('erp_learning_columns', JSON.stringify(newCols));
    } catch {}
  };

  const handleSaveDensity = (density: TableDensity) => {
    setTableDensity(density);
    try {
      localStorage.setItem('erp_learning_density', density);
    } catch {}
  };

  const handleResetColumns = () => {
    setTableColumns(DEFAULT_LEARNING_COLUMNS);
    setTableDensity('normal');
    try {
      localStorage.removeItem('erp_learning_columns');
      localStorage.removeItem('erp_learning_density');
    } catch {}
  };

  // Smart Realtime Auto-Sync Hook (25s interval, focus refresh, instant badge)
  const { isSyncing, lastSyncTime, triggerManualSync } = useAutoSync<LearningEntry[]>({
    syncFn: () => learningService.fetchFromSheet(),
    onDataReceived: (liveEntries) => {
      if (Array.isArray(liveEntries)) {
        setEntries(liveEntries);
      }
    },
    intervalMs: 25000,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Manual Sync trigger
  const handleManualSync = async () => {
    try {
      const live = await triggerManualSync();
      if (Array.isArray(live)) {
        setEntries(live);
        showToast(
          live.length > 0
            ? `Đã đồng bộ ${live.length} bài học từ Google Sheet!`
            : 'Đã đồng bộ với Google Sheet (chưa có bài học nào).'
        );
      }
    } catch {
      showToast('Lỗi đồng bộ Google Sheet.');
    }
  };

  // Column Resizing handlers
  const handleStartResize = useCallback(
    (colId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const col = tableColumns.find((c) => c.id === colId);
      const currentWidth = col?.width || 150;
      resizingRef.current = { colId, startX: e.clientX, startWidth: currentWidth };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizingRef.current) return;
        const delta = moveEvent.clientX - resizingRef.current.startX;
        const nextWidth = Math.max(60, Math.min(1000, resizingRef.current.startWidth + delta));
        setTableColumns((prev) =>
          prev.map((c) => (c.id === resizingRef.current?.colId ? { ...c, width: nextWidth } : c))
        );
      };

      const handleMouseUp = () => {
        resizingRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        setTableColumns((current) => {
          try {
            localStorage.setItem('erp_learning_columns', JSON.stringify(current));
          } catch {}
          return current;
        });
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [tableColumns]
  );

  // Save Entry (Create / Edit)
  const handleSaveEntry = (payload: LearningEntry) => {
    let updated: LearningEntry[];
    // Robust edit detection: check if editingEntry is set OR if matching code/id exists
    const matchCode = editingEntry?.code || payload.code;
    const matchId = editingEntry?.id || payload.id;
    const isEdit = !!editingEntry || entries.some((e) => (e.code && e.code === matchCode) || e.id === matchId);

    if (isEdit) {
      updated = entries.map((e) =>
        (e.code && e.code === matchCode) || e.id === matchId ? { ...e, ...payload } : e
      );
      learningService.updateInSheet(payload);
    } else {
      updated = [payload, ...entries];
      learningService.appendToSheet(payload);
    }
    setEntries(updated);
    learningService.saveToLocalCache(updated);
    setIsFormDrawerOpen(false);
    setEditingEntry(null);
    if (
      selectedEntryForDetail?.code === matchCode ||
      selectedEntryForDetail?.id === matchId ||
      selectedEntryForDetail?.id === payload.id
    ) {
      setSelectedEntryForDetail(payload);
    }
    showToast(`Đã lưu bài học "${payload.title}"!`);
  };

  // Delete Single
  const handleDeleteEntry = (id: string) => {
    const target = entries.find((e) => e.id === id);
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    learningService.saveToLocalCache(updated);
    if (target?.code) {
      learningService.deleteFromSheet([target.code]);
    }
    if (selectedEntryForDetail?.id === id) {
      setSelectedEntryForDetail(null);
    }
    showToast('Đã xóa bài học.');
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} bài học đã chọn?`)) return;
    const toDelete = entries.filter((e) => selectedIds.includes(e.id));
    const codes = toDelete.map((e) => e.code).filter(Boolean);
    const updated = entries.filter((e) => !selectedIds.includes(e.id));
    setEntries(updated);
    learningService.saveToLocalCache(updated);
    if (codes.length > 0) {
      learningService.deleteFromSheet(codes);
    }
    setSelectedIds([]);
    showToast(`Đã xóa ${toDelete.length} bài học.`);
  };

  // Toggle Pin
  const handleTogglePin = (id: string) => {
    const updated = entries.map((e) => (e.id === id ? { ...e, isPinned: !e.isPinned } : e));
    setEntries(updated);
    learningService.saveToLocalCache(updated);
    const target = updated.find((e) => e.id === id);
    if (target) {
      learningService.updateInSheet(target);
    }
    if (selectedEntryForDetail?.id === id && target) {
      setSelectedEntryForDetail(target);
    }
  };

  // Filtered Entries
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      // Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchSummary = (e.summary || '').toLowerCase().includes(q);
        const matchContent = e.content.toLowerCase().includes(q);
        const matchTags = (e.tags || []).some((t) => t.toLowerCase().includes(q));
        const matchSource = (e.sourceName || '').toLowerCase().includes(q);
        const matchCategory = e.category.toLowerCase().includes(q);
        if (!matchTitle && !matchSummary && !matchContent && !matchTags && !matchSource && !matchCategory) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;

      // Mastery
      if (selectedMastery !== 'all' && e.masteryLevel !== selectedMastery) return false;

      // Pinned
      if (onlyPinned && !e.isPinned) return false;

      // Due for review
      if (onlyDueForReview && (!e.nextReviewDate || e.nextReviewDate > todayStr)) return false;

      return true;
    });
  }, [entries, searchQuery, selectedCategory, selectedMastery, onlyPinned, onlyDueForReview, todayStr]);

  // Sorted: Pinned first, then date descending
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const dateA = a.entryDate || a.createdAt || '';
      const dateB = b.entryDate || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });
  }, [filteredEntries]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / pageSize));
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedEntries.slice(start, start + pageSize);
  }, [sortedEntries, currentPage, pageSize]);

  // Selection
  const isAllSelected = paginatedEntries.length > 0 && paginatedEntries.every((e) => selectedIds.includes(e.id));
  const handleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = new Set(paginatedEntries.map((e) => e.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedEntries.map((e) => e.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Next / Prev detail drawer
  const currentDetailIndex = selectedEntryForDetail
    ? sortedEntries.findIndex((e) => e.id === selectedEntryForDetail.id)
    : -1;

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Mã',
      'Tiêu đề',
      'Ý chính cốt lõi',
      'Nội dung',
      'Chuyên mục',
      'Mức độ nắm vững',
      'Độ khó',
      'Đánh giá',
      'Loại nguồn',
      'Tên nguồn',
      'Link nguồn',
      'Thẻ',
      'Ngày học',
      'Ngày ôn lại',
      'Ghim',
      'Ngày tạo',
    ];
    const rows = sortedEntries.map((e) => [
      e.code,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${(e.summary || '').replace(/"/g, '""')}"`,
      `"${stripMarkdown(e.content || '').replace(/"/g, '""')}"`,
      `"${e.category}"`,
      e.masteryLevel,
      e.difficulty,
      e.rating,
      e.sourceType,
      `"${(e.sourceName || '').replace(/"/g, '""')}"`,
      `"${(e.sourceUrl || '').replace(/"/g, '""')}"`,
      `"${(e.tags || []).join(', ')}"`,
      e.entryDate || '',
      e.nextReviewDate || '',
      e.isPinned ? 'Có' : 'Không',
      e.createdAt || '',
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hoc_hoi_kien_thuc_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Table Cell
  const renderTableCell = (col: ColumnItem, entry: LearningEntry, density: TableDensity) => {
    const colId = col.id;
    const isWrap = col.wrap === 'wrap';
    const textWrapClass = isWrap
      ? 'whitespace-normal break-words leading-relaxed'
      : 'truncate';
    const colAlign = col.align || 'left';
    const alignClass =
      colAlign === 'center' ? 'text-center' : colAlign === 'right' ? 'text-right' : 'text-left';
    const justifyClass =
      colAlign === 'center'
        ? 'justify-center'
        : colAlign === 'right'
        ? 'justify-end'
        : 'justify-start';

    const padding = density === 'compact' ? 'py-1.5 px-2.5 text-xs' : density === 'relaxed' ? 'py-3.5 px-4 text-sm' : 'py-2 px-3 text-xs';
    const masteryMeta = MASTERY_LEVEL_MAP[entry.masteryLevel] || MASTERY_LEVEL_MAP.learning;

    switch (colId) {
      case 'code':
        return (
          <div className={`${padding} font-mono font-semibold text-primary ${textWrapClass} flex items-center ${justifyClass} gap-1.5`}>
            {entry.isPinned && <Pin className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />}
            <span>{entry.code}</span>
          </div>
        );

      case 'image': {
        const entryImages = getLearningEntryImages(entry);
        if (entryImages.length === 0) {
          return (
            <div className={`${padding} flex items-center ${justifyClass}`}>
              <span className="text-muted-foreground/30 text-xs">—</span>
            </div>
          );
        }

        return (
          <div className={`${padding} flex items-center ${justifyClass}`}>
            <div className={`flex items-center gap-1.5 ${isWrap ? 'flex-wrap' : 'overflow-x-auto max-w-full'} py-0.5`}>
              {entryImages.map((imgUrl, imgIdx) => (
                <div
                  key={imgIdx}
                  className="relative group cursor-pointer inline-flex items-center justify-center shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGalleryModal({
                      images: entryImages,
                      currentIndex: imgIdx,
                      title: entry.title,
                    });
                  }}
                  title={`Ảnh ${imgIdx + 1}/${entryImages.length} (Bấm để phóng to)`}
                >
                  <img
                    src={imgUrl}
                    alt={`${entry.title} - ${imgIdx + 1}`}
                    className="w-10 h-10 rounded-lg object-cover border border-border shadow-2xs group-hover:scale-105 group-hover:ring-2 group-hover:ring-primary/50 transition-all shrink-0 bg-muted"
                    loading="lazy"
                  />
                  {entryImages.length > 1 && (
                    <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded-tl-md rounded-br-lg text-[8px] font-bold bg-black/60 text-white leading-none">
                      {imgIdx + 1}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'title':
        return (
          <div className={`${padding} ${textWrapClass} ${alignClass} font-semibold text-foreground hover:text-primary transition-colors cursor-pointer`}>
            {entry.title}
          </div>
        );

      case 'content': {
        const cleanContent = stripMarkdown(entry.content || '');
        return (
          <div className={`${padding} text-muted-foreground ${textWrapClass} ${alignClass}`} title={cleanContent}>
            {cleanContent || '—'}
          </div>
        );
      }

      case 'category':
        return (
          <div className={`${padding} text-center`}>
            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 truncate max-w-[150px]">
              {entry.category}
            </span>
          </div>
        );

      case 'masteryLevel':
        return (
          <div className={`${padding} text-center`}>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${masteryMeta.bgClass} ${masteryMeta.colorClass} border ${masteryMeta.borderClass}`}
            >
              <span>{masteryMeta.label}</span>
            </span>
          </div>
        );

      case 'rating':
        return (
          <div className={`${padding} flex items-center justify-center gap-0.5 text-amber-500`}>
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="font-semibold text-xs text-foreground">{entry.rating}</span>
          </div>
        );

      case 'source':
        return (
          <div className={`${padding} ${textWrapClass} ${alignClass} text-muted-foreground`}>
            {entry.sourceName ? (
              <span className="text-foreground font-medium">{entry.sourceName}</span>
            ) : (
              <span>{entry.sourceType}</span>
            )}
          </div>
        );

      case 'sourceUrl':
        return (
          <div className={`${padding} ${alignClass} ${isWrap ? 'break-all whitespace-normal' : 'truncate'}`}>
            {entry.sourceUrl ? (
              <a
                href={entry.sourceUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`text-primary hover:underline inline-flex items-center gap-1 ${isWrap ? 'break-all' : 'truncate max-w-[170px]'}`}
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className={isWrap ? 'break-all' : 'truncate'}>{entry.sourceUrl}</span>
              </a>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        );

      case 'tags':
        return (
          <div className={`${padding} flex items-center ${justifyClass} gap-1 overflow-hidden ${isWrap ? 'flex-wrap' : 'truncate'}`}>
            {(entry.tags || []).slice(0, isWrap ? undefined : 2).map((t) => (
              <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border shrink-0">
                #{t}
              </span>
            ))}
            {!isWrap && (entry.tags || []).length > 2 && (
              <span className="text-[10px] text-muted-foreground">+{entry.tags.length - 2}</span>
            )}
          </div>
        );

      case 'summary':
        return (
          <div className={`${padding} text-muted-foreground ${textWrapClass} ${alignClass}`} title={entry.summary}>
            {entry.summary || '—'}
          </div>
        );

      case 'entryDate':
        return <div className={`${padding} text-center tabular-nums text-muted-foreground`}>{entry.entryDate || '—'}</div>;

      case 'nextReviewDate':
        const isDue = entry.nextReviewDate && entry.nextReviewDate <= todayStr;
        return (
          <div className={`${padding} text-center tabular-nums`}>
            {entry.nextReviewDate ? (
              <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${isDue ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 'text-muted-foreground'}`}>
                {entry.nextReviewDate}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        );

      case 'difficulty':
        return (
          <div className={`${padding} text-center text-xs text-muted-foreground`}>
            {entry.difficulty === 'beginner' ? 'Cơ bản' : entry.difficulty === 'advanced' ? 'Nâng cao' : 'Trung bình'}
          </div>
        );

      case 'createdAt':
        return <div className={`${padding} text-center tabular-nums text-muted-foreground`}>{entry.createdAt ? entry.createdAt.slice(0, 10) : '—'}</div>;

      default:
        return <div className={`${padding} ${alignClass}`}>—</div>;
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* Top View Tabs */}
      <div className="flex items-center gap-1.5 mb-1.5 px-0.5 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTopTab('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'list'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Sổ tay kiến thức ({entries.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTopTab('stats')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'stats'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <ChartColumn className="w-3.5 h-3.5" />
          <span>Thống kê & Ôn tập</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 min-h-0 flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-xs">
        {activeTopTab === 'stats' ? (
          <LearningStatsTab
            entries={entries}
            onSelectEntry={(entry) => setSelectedEntryForDetail(entry)}
          />
        ) : (
          <>
            {/* Toolbar */}
            <div className="px-3 py-2 border-b border-border bg-card">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
                {/* Left: Back & Search & Filters */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={onBack}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                    title="Quay lại Hệ thống"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">Quay lại</span>
                  </button>

                  {/* Search input */}
                  <div className="relative flex-1 min-w-[160px] max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Tìm bài học, ý chính, thẻ, nguồn..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Filter: Category */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedCategory !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[120px]">
                        {selectedCategory === 'all' ? 'Chuyên mục' : selectedCategory}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>
                    {isCategoryOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsCategoryOpen(false)} />
                        <div className="absolute left-0 top-full mt-1 w-52 max-h-60 overflow-y-auto rounded-xl border border-border bg-card shadow-lg z-40 p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory('all');
                              setIsCategoryOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                              selectedCategory === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Tất cả chuyên mục
                          </button>
                          {LEARNING_CATEGORIES.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(c);
                                setIsCategoryOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate ${
                                selectedCategory === c ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter: Mastery */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsMasteryOpen(!isMasteryOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedMastery !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {selectedMastery === 'all'
                          ? 'Mức độ'
                          : MASTERY_LEVEL_MAP[selectedMastery as MasteryLevel]?.label || selectedMastery}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>
                    {isMasteryOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsMasteryOpen(false)} />
                        <div className="absolute left-0 top-full mt-1 w-44 rounded-xl border border-border bg-card shadow-lg z-40 p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMastery('all');
                              setIsMasteryOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs ${
                              selectedMastery === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Tất cả mức độ
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMastery('learning');
                              setIsMasteryOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-blue-600 hover:bg-muted"
                          >
                            📖 Đang học
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMastery('practicing');
                              setIsMasteryOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-amber-600 hover:bg-muted"
                          >
                            🛠️ Đang thực hành
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMastery('mastered');
                              setIsMasteryOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-emerald-600 hover:bg-muted"
                          >
                            ✅ Đã nắm vững
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMastery('review_needed');
                              setIsMasteryOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-muted"
                          >
                            🔄 Cần ôn lại
                          </button>
                        </div>
                      </>
                    )}
                  </div>

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

                  {/* Filter: Due for Review */}
                  <button
                    type="button"
                    onClick={() => setOnlyDueForReview(!onlyDueForReview)}
                    className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      onlyDueForReview
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cần ôn tập</span>
                  </button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-auto">
                  {/* Bulk Delete */}
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      className="h-8 px-2.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa ({selectedIds.length})</span>
                    </button>
                  )}

                  {/* Google Sheets Realtime Badge */}
                  <RealtimeSyncBadge
                    isSyncing={isSyncing}
                    lastSyncTime={lastSyncTime}
                    onSync={handleManualSync}
                  />

                  {/* Export CSV */}
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    title="Xuất file CSV"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Column Customizer */}
                  {viewMode === 'table' && (
                    <ColumnCustomizerPopover
                      columns={tableColumns}
                      onChangeColumns={handleSaveColumns}
                      density={tableDensity}
                      onChangeDensity={handleSaveDensity}
                      onReset={handleResetColumns}
                    />
                  )}

                  {/* View Mode Toggle: Table / Grid */}
                  <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      title="Xem dạng bảng chi tiết"
                      className={`p-1.5 rounded transition-colors ${
                        viewMode === 'table' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      title="Xem dạng thẻ card"
                      className={`p-1.5 rounded transition-colors ${
                        viewMode === 'grid' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Create New Entry Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEntry(null);
                      setIsFormDrawerOpen(true);
                    }}
                    className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm bài học</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Toast Notice */}
            {toastMessage && (
              <div className="bg-primary/10 border-b border-primary/20 text-primary text-xs px-4 py-1.5 text-center font-medium animate-in fade-in">
                {toastMessage}
              </div>
            )}

            {/* Content: Table or Grid */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {viewMode === 'grid' ? (
                /* Grid / Card View */
                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedEntries.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-muted-foreground">
                      <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-semibold">Chưa có bài học / kiến thức nào</p>
                      <p className="text-xs mt-1">Bấm "Thêm bài học" để bắt đầu ghi chép kiến thức của bạn.</p>
                    </div>
                  ) : (
                    paginatedEntries.map((entry) => {
                      const masteryMeta = MASTERY_LEVEL_MAP[entry.masteryLevel] || MASTERY_LEVEL_MAP.learning;
                      return (
                        <div
                          key={entry.id}
                          onClick={() => setSelectedEntryForDetail(entry)}
                          className="group rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col overflow-hidden cursor-pointer"
                        >
                          {/* Card Banner / Cover */}
                          {(() => {
                            const entryImages = getLearningEntryImages(entry);
                            const bannerUrl = entry.coverUrl || entryImages[0];
                            return bannerUrl ? (
                              <div className="h-32 w-full overflow-hidden bg-muted relative">
                                <img src={bannerUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                {entry.isPinned && (
                                  <div className="absolute top-2 right-2 p-1 rounded-md bg-amber-500 text-white shadow-xs">
                                    <Pin className="w-3 h-3 fill-current" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-3 bg-primary/20 relative">
                                {entry.isPinned && (
                                  <div className="absolute top-1.5 right-2 text-amber-500">
                                    <Pin className="w-3 h-3 fill-current" />
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          <div className="p-3.5 flex-1 flex flex-col space-y-2.5">
                            {/* Badges */}
                            <div className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="px-2 py-0.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20 truncate max-w-[130px]">
                                {entry.category}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full font-semibold ${masteryMeta.bgClass} ${masteryMeta.colorClass} border ${masteryMeta.borderClass}`}>
                                {masteryMeta.label}
                              </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                              {entry.title}
                            </h3>

                            {/* Summary */}
                            {entry.summary && (
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {entry.summary}
                              </p>
                            )}

                            {/* Source and Stars */}
                            <div className="mt-auto pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                              <div className="truncate max-w-[140px] flex items-center gap-1">
                                {entry.sourceUrl ? (
                                  <Link2 className="w-3 h-3 text-primary shrink-0" />
                                ) : (
                                  <BookOpen className="w-3 h-3 shrink-0" />
                                )}
                                <span className="truncate">{entry.sourceName || entry.sourceType}</span>
                              </div>

                              <div className="flex items-center gap-0.5 text-amber-500 font-semibold">
                                <Star className="w-3 h-3 fill-current" />
                                <span>{entry.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* Table View */
                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs">
                        <th className="w-10 px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                            className="rounded border-border"
                          />
                        </th>
                        {tableColumns
                          .filter((c) => c.visible)
                          .map((col) => {
                            const colAlign = col.align || 'left';
                            const justifyClass =
                              colAlign === 'center'
                                ? 'justify-center'
                                : colAlign === 'right'
                                ? 'justify-end'
                                : 'justify-between';
                            return (
                              <th
                                key={col.id}
                                style={{ width: col.width, minWidth: col.width }}
                                className={`px-3 py-2 border-r border-border relative select-none ${
                                  colAlign === 'center' ? 'text-center' : colAlign === 'right' ? 'text-right' : 'text-left'
                                }`}
                              >
                                <div className={`flex items-center ${justifyClass}`}>
                                  <span className="truncate">{col.label}</span>
                                  <div
                                    onMouseDown={(e) => handleStartResize(col.id, e)}
                                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 transition-colors"
                                  />
                                </div>
                              </th>
                            );
                          })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedEntries.length === 0 ? (
                        <tr>
                          <td colSpan={tableColumns.filter((c) => c.visible).length + 1} className="py-16 text-center text-muted-foreground text-xs">
                            Không tìm thấy kiến thức phù hợp.
                          </td>
                        </tr>
                      ) : (
                        paginatedEntries.map((entry) => {
                          const isSelected = selectedIds.includes(entry.id);
                          return (
                            <tr
                              key={entry.id}
                              onClick={() => setSelectedEntryForDetail(entry)}
                              className={`hover:bg-muted/40 transition-colors cursor-pointer ${
                                isSelected ? 'bg-primary/5' : ''
                              }`}
                            >
                              <td className="w-10 px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => handleToggleSelect(entry.id, e as any)}
                                  className="rounded border-border"
                                />
                              </td>
                              {tableColumns
                                .filter((c) => c.visible)
                                .map((col) => (
                                  <td
                                    key={col.id}
                                    style={{ width: col.width, minWidth: col.width, maxWidth: col.width }}
                                    className={`border-r border-border overflow-hidden max-w-0 ${
                                      col.wrap === 'wrap' ? 'align-top' : 'align-middle'
                                    }`}
                                  >
                                    {renderTableCell(col, entry, tableDensity)}
                                  </td>
                                ))}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination Toolbar */}
            <div className="px-3 py-2 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 text-xs">
              <div className="text-muted-foreground">
                Hiển thị <strong>{paginatedEntries.length}</strong> trên tổng số <strong>{sortedEntries.length}</strong> bài học
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-muted-foreground mr-2">
                  <span>Số hàng:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-1.5 py-0.5 rounded border border-border bg-background text-foreground"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                    className="p-1 rounded border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
                    title="Trang đầu"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="px-2 py-0.5 text-foreground font-semibold">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
                    title="Trang sau"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="p-1 rounded border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
                    title="Trang cuối"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Form Drawer (Create / Edit) */}
      <LearningFormDrawer
        isOpen={isFormDrawerOpen}
        onClose={() => {
          setIsFormDrawerOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
        initialEntry={editingEntry}
      />

      {/* Detail Drawer */}
      <LearningDetailDrawer
        entry={selectedEntryForDetail}
        onClose={() => setSelectedEntryForDetail(null)}
        onEdit={(entry) => {
          setSelectedEntryForDetail(null);
          setEditingEntry(entry);
          setIsFormDrawerOpen(true);
        }}
        onDelete={(id) => handleDeleteEntry(id)}
        onTogglePin={(id) => handleTogglePin(id)}
        hasNext={currentDetailIndex !== -1 && currentDetailIndex < sortedEntries.length - 1}
        hasPrev={currentDetailIndex > 0}
        onNext={() => {
          if (currentDetailIndex !== -1 && currentDetailIndex < sortedEntries.length - 1) {
            setSelectedEntryForDetail(sortedEntries[currentDetailIndex + 1]);
          }
        }}
        onPrev={() => {
          if (currentDetailIndex > 0) {
            setSelectedEntryForDetail(sortedEntries[currentDetailIndex - 1]);
          }
        }}
      />

      {/* Lightbox Gallery Modal with Full Multi-Image Navigation */}
      {galleryModal && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 select-none animate-in fade-in duration-150"
          onClick={() => setGalleryModal(null)}
        >
          {/* Header */}
          <div
            className="w-full max-w-5xl flex items-center justify-between text-white py-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-sm sm:text-base truncate max-w-md">
                {galleryModal.title}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white/90 shrink-0">
                {galleryModal.currentIndex + 1} / {galleryModal.images.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setGalleryModal(null)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content Area (Image + Left/Right Arrows) */}
          <div
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center min-h-0 my-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button */}
            {galleryModal.images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setGalleryModal((prev) => {
                    if (!prev) return null;
                    const prevIdx =
                      prev.currentIndex > 0
                        ? prev.currentIndex - 1
                        : prev.images.length - 1;
                    return { ...prev, currentIndex: prevIdx };
                  })
                }
                className="absolute left-2 sm:left-4 z-10 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/20 transition-all cursor-pointer backdrop-blur-xs"
                title="Ảnh trước (Mũi tên trái)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Enlarged Image */}
            <img
              key={galleryModal.currentIndex}
              src={galleryModal.images[galleryModal.currentIndex]}
              alt={`Ảnh ${galleryModal.currentIndex + 1}`}
              className="max-w-full max-h-full rounded-xl object-contain shadow-2xl animate-in zoom-in-95 duration-200"
            />

            {/* Next Button */}
            {galleryModal.images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setGalleryModal((prev) => {
                    if (!prev) return null;
                    const nextIdx =
                      prev.currentIndex < prev.images.length - 1
                        ? prev.currentIndex + 1
                        : 0;
                    return { ...prev, currentIndex: nextIdx };
                  })
                }
                className="absolute right-2 sm:right-4 z-10 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/20 transition-all cursor-pointer backdrop-blur-xs"
                title="Ảnh sau (Mũi tên phải)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          {galleryModal.images.length > 1 && (
            <div
              className="w-full max-w-3xl flex items-center justify-center gap-2 overflow-x-auto py-2 px-4 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {galleryModal.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    setGalleryModal((prev) => (prev ? { ...prev, currentIndex: idx } : null))
                  }
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    idx === galleryModal.currentIndex
                      ? 'border-primary ring-2 ring-primary/50 scale-105'
                      : 'border-white/20 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
