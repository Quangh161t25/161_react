import React, { useState, useEffect } from 'react';
import { getSafeAvatarUrl } from '../../utils/avatarUtils';
import {
  X,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Trash2,
  Copy,
  Check,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  FileText,
  Pin,
  Calendar,
  MapPin,
  Tag,
  Image as ImageIcon,
  History,
  MessageSquare,
  Paperclip,
  FolderOpen,
  Users,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Globe,
  Send,
} from 'lucide-react';
import { Note, NoteComment } from '../../types/note';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { getGoogleMapsUrl } from '../../utils/mapUtils';
import { generateId } from '../../utils/idGenerator';
import { getNoteIconLabel } from '../../data/notes';
import { MarkdownRenderer } from './MarkdownRenderer';

interface NoteDetailDrawerProps {
  isOpen?: boolean;
  note: Note | null;
  allNotes?: Note[];
  currentIndex?: number;
  totalCount?: number;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onNavigate?: (note: Note) => void;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onAddComment?: (noteId: string, comment: NoteComment) => void;
  onDeleteComment?: (noteId: string, commentId: string) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';
type ActivityTab = 'history' | 'comments' | 'attachments';

export const NoteDetailDrawer: React.FC<NoteDetailDrawerProps> = ({
  isOpen,
  note,
  allNotes,
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
  onNavigate,
  onEdit,
  onDelete,
  onTogglePin,
  onAddComment,
  onDeleteComment,
}) => {
  const { currentUser } = useAuth();
  const { formatDate, formatTime } = useSettings();
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('normal');
  const [activityTab, setActivityTab] = useState<ActivityTab>('history');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);
  const [comments, setComments] = useState<NoteComment[]>([]);
  const [commentInput, setCommentInput] = useState('');

  // Sync comments from localStorage or note.comments whenever note changes
  useEffect(() => {
    if (!note?.id) {
      setComments([]);
      setCommentInput('');
      return;
    }
    try {
      const raw = localStorage.getItem(`erp_note_comments_${note.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setComments(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load comments from storage', e);
    }
    setComments(note.comments || []);
  }, [note?.id, note?.comments]);

  if (!note || (isOpen !== undefined && !isOpen)) return null;

  const currentIdx =
    currentIndex !== undefined
      ? currentIndex
      : allNotes
      ? allNotes.findIndex((n) => n.id === note.id)
      : 0;
  const total = totalCount !== undefined ? totalCount : allNotes ? allNotes.length : 1;

  const handlePrev = () => {
    if (onPrev) return onPrev();
    if (allNotes && onNavigate && currentIdx > 0) {
      onNavigate(allNotes[currentIdx - 1]);
    }
  };

  const handleNext = () => {
    if (onNext) return onNext();
    if (allNotes && onNavigate && currentIdx < allNotes.length - 1) {
      onNavigate(allNotes[currentIdx + 1]);
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

  const getDrawerWidthStyle = () => {
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

  const handleCopyAll = () => {
    const participantsStr =
      note.participants && note.participants.length > 0
        ? note.participants.map((p) => `${p.name}${p.role ? ` (${p.role})` : ''}`).join(', ')
        : '—';

    const lines = [
      `=== GHI CHÚ: ${note.title} ===`,
      `Mã tài liệu: ${note.code || '—'}`,
      `Danh mục: ${note.category || '—'}`,
      `Người tạo: ${note.author || '—'}`,
      `Ngày giờ: ${note.noteTime ? `${formatTime(note.noteTime)} - ` : ''}${note.noteDate ? formatDate(note.noteDate) : (note.createdAt ? formatDate(note.createdAt) : '')}`,
      `Địa điểm: ${note.location || '—'}`,
      `Hoạt động: ${note.activity || '—'}`,
      `Đi cùng ai: ${participantsStr}`,
      `Thẻ tags: ${note.tags?.join(', ') || '—'}`,
      `\nTóm tắt:`,
      `${note.summary || '—'}`,
      `\nNội dung chi tiết:`,
      `${note.content.replace(/<[^>]*>?/gm, '')}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !note) return;

    const now = new Date();
    const dateStr = formatDate(now.toISOString().split('T')[0]);
    const timeStr = formatTime(now.toTimeString().slice(0, 5));

    const newComment: NoteComment = {
      id: generateId('cm'),
      author: currentUser?.name || currentUser?.username || 'Người dùng',
      authorAvatar: currentUser?.avatarUrl,
      content: commentInput.trim(),
      createdAt: `${dateStr} ${timeStr}`,
    };

    const updated = [...comments, newComment];
    setComments(updated);
    setCommentInput('');

    try {
      localStorage.setItem(`erp_note_comments_${note.id}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save comment to localStorage', err);
    }

    if (onAddComment) {
      onAddComment(note.id, newComment);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (!note) return;
    const updated = comments.filter((c) => c.id !== commentId);
    setComments(updated);
    try {
      localStorage.setItem(`erp_note_comments_${note.id}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to update comments in localStorage', err);
    }
    if (onDeleteComment) {
      onDeleteComment(note.id, commentId);
    }
  };

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
        aria-label="Chi tiết Ghi chú"
        tabIndex={-1}
        style={{
          width: getDrawerWidthStyle(),
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
          {/* Left Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground leading-tight truncate">
                  Tài liệu & Ghi chú
                </h3>
                {note.isPinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Pin className="w-3 h-3 fill-current" />
                    Đã ghim
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {note.title}
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Width Switcher (Tablet/Desktop) */}
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
                  widthMode === 'narrow' ? 'bg-muted text-foreground' : 'text-muted-foreground'
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
                  widthMode === 'normal' ? 'bg-muted text-foreground' : 'text-muted-foreground'
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
                  widthMode === 'wide' ? 'bg-muted text-foreground' : 'text-muted-foreground'
                }`}
              >
                <PanelRightOpen className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </div>

            {/* Navigation & Fullscreen */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                disabled={currentIdx <= 0}
                onClick={handlePrev}
                aria-label="Bản ghi trước"
                title="Bản ghi trước"
                className="p-2 rounded-lg text-muted-foreground transition-colors active:scale-90 hover:bg-muted hover:text-foreground disabled:opacity-35 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5px]" />
              </button>
              <span
                className="px-1 text-xs font-medium text-muted-foreground tabular-nums select-none whitespace-nowrap"
                aria-label={`Bản ghi ${currentIdx + 1} trên ${total}`}
              >
                {currentIdx + 1}/{total}
              </span>
              <button
                type="button"
                disabled={currentIdx >= total - 1}
                onClick={handleNext}
                aria-label="Bản ghi sau"
                title="Bản ghi sau"
                className="p-2 rounded-lg text-muted-foreground transition-colors active:scale-90 hover:bg-muted hover:text-foreground disabled:opacity-35 disabled:pointer-events-none"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5px]" />
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={widthMode === 'fullscreen' ? 'Thu nhỏ' : 'Mở toàn màn hình'}
                title={widthMode === 'fullscreen' ? 'Thu nhỏ' : 'Mở toàn màn hình'}
                className="p-2 rounded-lg text-muted-foreground transition-colors active:scale-90 hover:bg-muted hover:text-foreground ml-1 border-l border-border rounded-l-none pl-2"
              >
                {widthMode === 'fullscreen' ? (
                  <Minimize2 className="w-4 h-4 stroke-[2.5px]" />
                ) : (
                  <Maximize2 className="w-4 h-4 stroke-[2.5px]" />
                )}
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              title="Đóng"
              className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors active:scale-90 shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5px]" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto bg-muted/40 p-3 sm:p-4 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-2.5">
            {/* Cover Image Banner (if available) */}
            {note.coverUrl && (
              <div className="relative w-full h-40 sm:h-52 rounded-xl overflow-hidden shadow-xs border border-border group">
                <img
                  src={note.coverUrl}
                  alt={note.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3.5 sm:p-4">
                  <div className="space-y-1 text-white">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary/90 text-white backdrop-blur-md">
                      <FolderOpen className="w-3 h-3" />
                      {note.category}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold leading-tight drop-shadow-md">
                      {note.title}
                    </h2>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Highlight Card */}
            <div className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <img
                    alt={note.author}
                    className="w-10 h-10 rounded-full border border-border shadow-xs object-cover"
                    src={getSafeAvatarUrl(note.authorAvatar, note.author)}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{note.author}</h4>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {note.noteTime ? `${formatTime(note.noteTime)} · ` : ''}
                      {note.noteDate ? formatDate(note.noteDate) : (note.createdAt ? formatDate(note.createdAt) : '')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <FolderOpen className="w-3.5 h-3.5" />
                    {note.category}
                  </span>
                  {note.icons && note.icons.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {note.icons.map((ic, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground border border-border/80 shadow-2xs"
                          title={getNoteIconLabel(ic)}
                        >
                          <span className="text-sm">{ic}</span>
                          <span className="text-[11px] font-medium">{getNoteIconLabel(ic)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {onTogglePin ? (
                    <button
                      type="button"
                      onClick={() => onTogglePin(note.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                        note.isPinned
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-muted/60 text-muted-foreground hover:text-foreground border border-border'
                      }`}
                      title={note.isPinned ? 'Bỏ ghim bài' : 'Ghim bài lên đầu'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current text-amber-500' : ''}`} />
                      <span>{note.isPinned ? 'Đã ghim' : 'Ghim'}</span>
                    </button>
                  ) : note.isPinned ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Pin className="w-3.5 h-3.5 fill-current" />
                      Đã ghim
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Tags & Location row */}
              {((note.tags && note.tags.filter((t) => t && t.trim()).length > 0) || note.location || note.coordinates) && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-xs">
                  {(note.location || note.coordinates) && (() => {
                    const displayText = note.location || note.coordinates;
                    const mapUrl = getGoogleMapsUrl(note.location, note.coordinates);
                    return mapUrl ? (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-1.5 text-muted-foreground bg-muted/60 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 border border-transparent hover:border-rose-500/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-2xs"
                        title="Bấm để mở bản đồ Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="font-medium text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 underline-offset-2 group-hover:underline">
                          {displayText}
                        </span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-rose-500 shrink-0 opacity-60 group-hover:opacity-100" />
                      </a>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="font-medium text-foreground">{displayText}</span>
                      </div>
                    );
                  })()}
                  {note.tags
                    ?.filter((t) => t && t.trim())
                    .map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[11px] font-medium"
                      >
                        <Tag className="w-3 h-3 text-muted-foreground" />
                        #{t.replace(/^#/, '')}
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Section Cards */}
            <div className="space-y-2.5">
              {/* Card: Đối tượng nhân viên & Đi cùng ai (Nhật ký) */}
              {((note.participants && note.participants.length > 0) || note.activity) && (
                <div className="w-full bg-card p-3 sm:p-3.5 rounded-xl border border-border shadow-xs space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 border-b border-primary/20">
                    <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-2 text-primary font-bold">
                      <Users className="w-4 h-4" />
                      <span>Đối tượng nhân viên / Đi cùng ai</span>
                    </h4>
                    {note.participants && note.participants.length > 0 && (
                      <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                        {note.participants.length} người tham gia
                      </span>
                    )}
                  </div>

                  {/* Activity Badge if present */}
                  {note.activity && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                      <span>
                        <strong>Hoạt động:</strong> {note.activity}
                      </span>
                    </div>
                  )}

                  {/* Participants Grid */}
                  {note.participants && note.participants.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                      {note.participants.map((p, idx) => {
                        const avatar = getSafeAvatarUrl(p.avatarUrl, p.name);

                        return (
                          <div
                            key={p.id || p.code || idx}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors"
                          >
                            <img
                              src={avatar}
                              alt={p.name}
                              className="w-8 h-8 rounded-full object-cover border border-border shrink-0 shadow-2xs"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
                                <span>{p.name}</span>
                                {p.code && (
                                  <span className="text-[9px] font-mono text-muted-foreground bg-background px-1.5 py-0.2 rounded border border-border">
                                    {p.code}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate">
                                {p.role || p.department || 'Thành viên'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Card 1: Nội dung bài viết & Tài liệu */}
              <div className="w-full bg-card p-3 sm:p-3.5 rounded-xl border border-border shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-2 text-primary font-bold">
                    <FileText className="w-4 h-4" />
                    <span>Nội dung bài viết & Tài liệu</span>
                  </h4>
                  {note.link && (
                    <a
                      href={note.link.startsWith('http') ? note.link : `https://${note.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Truy cập liên kết</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}
                </div>

                {/* Dedicated Link Banner if present */}
                {note.link && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold text-muted-foreground block">
                          Đường dẫn liên kết đính kèm
                        </span>
                        <a
                          href={note.link.startsWith('http') ? note.link : `https://${note.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-primary hover:underline truncate block"
                          title={note.link}
                        >
                          {note.link}
                        </a>
                      </div>
                    </div>
                    <a
                      href={note.link.startsWith('http') ? note.link : `https://${note.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <span>Mở link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Rich Markdown / HTML Content Body */}
                <MarkdownRenderer
                  content={note.content}
                  onImageClick={(url) => setSelectedLightboxImage(url)}
                />
              </div>

              {/* Card 2: Bộ sưu tập hình ảnh (Gallery) */}
              {note.images && note.images.length > 0 && (
                <div className="w-full bg-card p-3 sm:p-3.5 rounded-xl border border-border shadow-xs space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 border-b border-primary/20">
                    <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-2 text-primary font-bold">
                      <ImageIcon className="w-4 h-4" />
                      <span>Hình ảnh đính kèm ({note.images.length})</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {note.images.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedLightboxImage(img)}
                        className="group relative aspect-4/3 rounded-xl overflow-hidden border border-border bg-muted cursor-zoom-in shadow-xs"
                      >
                        <img
                          src={img}
                          alt={`Attach ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="text-white text-xs opacity-0 group-hover:opacity-100 font-semibold drop-shadow">
                            Xem lớn
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card 5: Nhật ký hoạt động */}
              <div className="w-full bg-card p-3 sm:p-3.5 rounded-xl border border-border shadow-xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-2 text-primary font-bold">
                    <History className="w-4 h-4" />
                    <span>Nhật ký hoạt động</span>
                  </h4>

                  <div className="flex gap-0.5 p-0.5 bg-muted/50 rounded-lg border border-border/50">
                    <button
                      type="button"
                      onClick={() => setActivityTab('history')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        activityTab === 'history'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      Thay đổi
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivityTab('comments')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        activityTab === 'comments'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Trao đổi</span>
                      {comments.length > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-tight ${
                            activityTab === 'comments' ? 'bg-white/20 text-white' : 'bg-primary/15 text-primary'
                          }`}
                        >
                          {comments.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivityTab('attachments')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        activityTab === 'attachments'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      Tệp kèm
                    </button>
                  </div>
                </div>

                {activityTab === 'history' && (
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground px-6 py-8 bg-card rounded-xl border border-dashed border-border">
                    <History className="w-9 h-9 mb-2 opacity-20" />
                    <p className="text-xs text-foreground font-semibold">Chưa có thao tác nào</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Mọi chỉnh sửa trên ghi chú này sẽ được ghi nhận tại đây.</p>
                  </div>
                )}

                {activityTab === 'comments' && (
                  <div className="space-y-3">
                    {/* Danh sách bình luận */}
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {comments.length > 0 ? (
                        comments.map((cm) => (
                          <div
                            key={cm.id}
                            className="group relative p-2.5 sm:p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-xs space-y-1.5 shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {cm.authorAvatar ? (
                                  <img
                                    src={getSafeAvatarUrl(cm.authorAvatar)}
                                    alt={cm.author}
                                    className="w-5 h-5 rounded-full object-cover shrink-0 border border-border"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] shrink-0">
                                    {cm.author ? cm.author.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                )}
                                <span className="font-semibold text-foreground truncate">{cm.author}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] text-muted-foreground tabular-nums">{cm.createdAt}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(cm.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-600 rounded transition-all cursor-pointer"
                                  title="Xóa trao đổi này"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-foreground text-xs leading-relaxed whitespace-pre-wrap pl-7">
                              {cm.content}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground px-6 py-7 bg-card rounded-xl border border-dashed border-border">
                          <MessageSquare className="w-8 h-8 mb-1.5 opacity-20" />
                          <p className="text-xs text-foreground font-semibold">Chưa có trao đổi nào</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Nhập nội dung trao đổi, thảo luận hoặc ý kiến bổ sung bên dưới.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Ô nhập trao đổi / bình luận */}
                    <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-1 border-t border-border/50">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Nhập nội dung trao đổi / phản hồi tại đây..."
                          className="w-full h-9 pl-3 pr-3 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-2xs"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!commentInput.trim()}
                        className="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all shrink-0 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi</span>
                      </button>
                    </form>
                  </div>
                )}

                {activityTab === 'attachments' && (
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground px-6 py-8 bg-card rounded-xl border border-dashed border-border">
                    <Paperclip className="w-9 h-9 mb-2 opacity-20" />
                    <p className="text-xs text-foreground font-semibold">Chưa có tệp đính kèm</p>
                    <p className="text-xs text-muted-foreground mt-0.5">File PDF, Excel và tài liệu liên quan sẽ lưu tại đây.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div
          className="bg-card border-t border-border flex flex-col-reverse sm:flex-row items-center shrink-0 w-full gap-2 z-10"
          style={{
            paddingTop: '0.5rem',
            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          }}
        >
          {showDeleteConfirm ? (
            <div className="flex items-center justify-between w-full gap-2 animate-in fade-in duration-200">
              <span className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 truncate">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Xác nhận xóa ghi chú này?
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(note.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-xs cursor-pointer"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted h-8 px-3 text-xs text-muted-foreground hover:text-foreground border border-border cursor-pointer"
              >
                Đóng
              </button>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted h-8 px-2.5 sm:px-3 text-xs text-muted-foreground hover:text-foreground border border-border cursor-pointer"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-3.5 h-3.5 sm:mr-1.5 shrink-0 text-emerald-500" />
                      <span className="hidden xs:inline">Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 sm:mr-1.5 shrink-0" />
                      <span className="hidden xs:inline">Sao chép</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(note)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 text-xs bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer"
                >
                  <SquarePen className="w-3.5 h-3.5 sm:mr-1.5 shrink-0" />
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-2.5 sm:px-3 text-xs text-rose-600 hover:bg-rose-500/10 border border-rose-200 dark:border-rose-950 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:mr-1.5 shrink-0" />
                  Xóa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedLightboxImage && (
        <div
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedLightboxImage(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-card rounded-2xl overflow-hidden shadow-2xl border border-border p-3 flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 border-b border-border">
              <h4 className="text-xs font-bold text-foreground truncate">Xem hình ảnh</h4>
              <button
                type="button"
                onClick={() => setSelectedLightboxImage(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={selectedLightboxImage}
              alt="Lightbox"
              className="w-full max-h-[70vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
};
