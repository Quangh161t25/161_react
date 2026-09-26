import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Trash2,
  Printer,
  Mail,
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
  Clock,
  MapPin,
  Tag,
  User,
  Image as ImageIcon,
  History,
  MessageSquare,
  Paperclip,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { Note } from '../../types/note';
import { useSettings } from '../../context/SettingsContext';
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
}) => {
  const { formatDate, formatTime } = useSettings();
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('normal');
  const [activityTab, setActivityTab] = useState<ActivityTab>('history');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);

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
    const lines = [
      `=== GHI CHÚ / WIKI: ${note.title} ===`,
      `Mã tài liệu: ${note.code || '—'}`,
      `Danh mục: ${note.category || '—'}`,
      `Người tạo: ${note.author || '—'}`,
      `Ngày giờ: ${note.noteTime ? `${formatTime(note.noteTime)} - ` : ''}${note.noteDate ? formatDate(note.noteDate) : (note.createdAt ? formatDate(note.createdAt) : '')}`,
      `Địa điểm: ${note.location || '—'}`,
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
        <div className="flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-5 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Cover Image Banner (if available) */}
            {note.coverUrl && (
              <div className="relative w-full h-44 sm:h-56 rounded-2xl overflow-hidden shadow-xs border border-border group">
                <img
                  src={note.coverUrl}
                  alt={note.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4 sm:p-5">
                  <div className="space-y-1.5 text-white">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary/90 text-white backdrop-blur-md">
                      <FolderOpen className="w-3 h-3" />
                      {note.category}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold leading-tight drop-shadow-md">
                      {note.title}
                    </h2>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Highlight Card */}
            <div className="bg-card p-4 rounded-xl border border-border/70 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    alt={note.author}
                    className="w-11 h-11 rounded-full border border-border shadow-xs object-cover"
                    src={
                      note.authorAvatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(note.author)}&background=1d4ed8&color=fff`
                    }
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
                  {note.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Pin className="w-3.5 h-3.5 fill-current" />
                      Đã ghim
                    </span>
                  )}
                </div>
              </div>

              {/* Tags & Location row */}
              {((note.tags && note.tags.filter((t) => t && t.trim()).length > 0) || note.location) && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-xs">
                  {note.location && (
                    <div className="inline-flex items-center gap-1.5 text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="font-medium text-foreground">{note.location}</span>
                    </div>
                  )}
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

            {/* Quick Actions Grid */}
            <div className="gap-2 sm:gap-3 p-2.5 sm:p-3.5 min-w-0 grid grid-cols-4 bg-card rounded-xl border border-border shadow-xs">
              {/* Ghim / Bỏ ghim */}
              <button
                type="button"
                onClick={() => onTogglePin?.(note.id)}
                className="flex flex-col items-center gap-1 sm:gap-1.5 transition-[transform,colors] duration-150 outline-none min-w-0 w-full hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors shadow-xs border ${
                    note.isPinned
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground'
                  }`}
                >
                  <Pin className="w-4 h-4" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-center truncate w-full px-0.5 leading-tight text-primary">
                  {note.isPinned ? 'Bỏ ghim' : 'Ghim bài'}
                </span>
              </button>

              {/* In */}
              <button
                type="button"
                onClick={() => window.print()}
                className="flex flex-col items-center gap-1 sm:gap-1.5 transition-[transform,colors] duration-150 outline-none min-w-0 w-full hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors shadow-xs border bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground">
                  <Printer className="w-4 h-4" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-center truncate w-full px-0.5 leading-tight text-muted-foreground">
                  In tài liệu
                </span>
              </button>

              {/* Gửi Email */}
              <button
                type="button"
                onClick={() => {
                  window.location.href = `mailto:?subject=${encodeURIComponent(note.title)}&body=${encodeURIComponent(
                    note.summary || note.content.replace(/<[^>]*>?/gm, '')
                  )}`;
                }}
                className="flex flex-col items-center gap-1 sm:gap-1.5 transition-[transform,colors] duration-150 outline-none min-w-0 w-full hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors shadow-xs border bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-center truncate w-full px-0.5 leading-tight text-muted-foreground">
                  Gửi Email
                </span>
              </button>

              {/* Sao chép liên kết */}
              <button
                type="button"
                onClick={handleCopyAll}
                className="flex flex-col items-center gap-1 sm:gap-1.5 transition-[transform,colors] duration-150 outline-none min-w-0 w-full hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors shadow-xs border bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground">
                  {copiedAll ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-center truncate w-full px-0.5 leading-tight text-muted-foreground">
                  {copiedAll ? 'Đã sao chép' : 'Sao chép'}
                </span>
              </button>
            </div>

            {/* Section Cards */}
            <div className="space-y-5">
              {/* Card 1: Tóm tắt & Nội dung bài viết */}
              <div className="w-full bg-card p-4 sm:p-5 rounded-xl border border-border shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-2 text-primary font-bold">
                    <FileText className="w-4 h-4" />
                    <span>Nội dung bài viết & Tài liệu</span>
                  </h4>
                </div>

                {note.summary && (
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground font-medium leading-relaxed italic">
                    💡 <strong>Tóm tắt:</strong> {note.summary}
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
                <div className="w-full bg-card p-4 sm:p-5 rounded-xl border border-border shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2.5 border-b border-primary/20">
                    <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-2 text-primary font-bold">
                      <ImageIcon className="w-4 h-4" />
                      <span>Hình ảnh đính kèm ({note.images.length})</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

              {/* Card 4: Thông tin hệ thống & Thời gian */}
              <div className="w-full bg-card p-4 sm:p-5 rounded-xl border border-border shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-2 text-primary font-bold">
                    <Clock className="w-4 h-4" />
                    <span>Thông tin hệ thống</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <User className="w-3 h-3" />
                      Tác giả
                    </span>
                    <p className="font-semibold text-foreground">{note.author}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3 h-3" />
                      Ngày tạo
                    </span>
                    <p className="text-foreground font-mono">{note.createdAt}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Clock className="w-3 h-3" />
                      Cập nhật lần cuối
                    </span>
                    <p className="text-foreground font-mono">{note.updatedAt || note.createdAt}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3 h-3" />
                      Tọa độ GPS
                    </span>
                    <p className="text-foreground font-mono">{note.coordinates || 'Chưa định vị'}</p>
                  </div>
                </div>
              </div>

              {/* Card 5: Nhật ký hoạt động */}
              <div className="w-full bg-card p-4 sm:p-5 rounded-xl border border-border shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2.5 border-b border-primary/20">
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
                      Trao đổi
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
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground px-6 py-8 bg-card rounded-xl border border-dashed border-border">
                    <MessageSquare className="w-9 h-9 mb-2 opacity-20" />
                    <p className="text-xs text-foreground font-semibold">Chưa có bình luận nào</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Trao đổi và ghi chú bổ sung sẽ hiển thị tại đây.</p>
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
