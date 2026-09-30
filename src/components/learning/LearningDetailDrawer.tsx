import React, { useState } from 'react';
import {
  X,
  Edit,
  Trash2,
  Pin,
  ExternalLink,
  Calendar,
  Star,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Link2,
  Image as ImageIcon,
  Printer,
  Sparkles,
} from 'lucide-react';
import { LearningEntry } from '../../types/learning';
import { MASTERY_LEVEL_MAP } from '../../data/learning';
import { MarkdownRenderer } from '../notes/MarkdownRenderer';

interface LearningDetailDrawerProps {
  entry: LearningEntry | null;
  onClose: () => void;
  onEdit: (entry: LearningEntry) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const LearningDetailDrawer: React.FC<LearningDetailDrawerProps> = ({
  entry,
  onClose,
  onEdit,
  onDelete,
  onTogglePin,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);

  if (!entry) return null;

  const masteryMeta = MASTERY_LEVEL_MAP[entry.masteryLevel] || MASTERY_LEVEL_MAP.learning;

  const handleCopyContent = () => {
    const textToCopy = `# ${entry.title}\n\n${entry.summary ? `> ${entry.summary}\n\n` : ''}${entry.content}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-3xl bg-card border-l border-border shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 border-b border-border bg-card flex items-center justify-between shrink-0">
            {/* Left: Code, Pin, Navigation */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                {entry.code}
              </span>

              <button
                type="button"
                onClick={() => onTogglePin(entry.id)}
                title={entry.isPinned ? 'Đang ghim (Bấm để bỏ ghim)' : 'Ghim bài học này'}
                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                  entry.isPinned
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <Pin className={`w-3.5 h-3.5 ${entry.isPinned ? 'fill-current' : ''}`} />
              </button>

              {/* Prev / Next */}
              {(hasPrev || hasNext) && (
                <div className="flex items-center gap-0.5 border border-border rounded-lg p-0.5 ml-2">
                  <button
                    type="button"
                    disabled={!hasPrev}
                    onClick={onPrev}
                    title="Bài trước"
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!hasNext}
                    onClick={onNext}
                    title="Bài tiếp theo"
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyContent}
                title="Sao chép nội dung"
                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                title="In bài học"
                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onEdit(entry)}
                className="px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Sửa</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Bạn có chắc chắn muốn xóa bài học "${entry.title}"?`)) {
                    onDelete(entry.id);
                  }
                }}
                className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                title="Xóa bài học này"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Cover Banner */}
            {entry.coverUrl && (
              <div
                className="relative w-full h-44 sm:h-56 rounded-xl overflow-hidden border border-border cursor-pointer group shadow-xs"
                onClick={() => setActiveImageModal(entry.coverUrl || null)}
              >
                <img src={entry.coverUrl} alt={entry.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                  <span className="text-[11px] text-white/90 font-medium">Bấm để phóng to ảnh bìa</span>
                </div>
              </div>
            )}

            {/* Badges & Meta */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category */}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {entry.category}
              </span>

              {/* Mastery Level */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${masteryMeta.bgClass} ${masteryMeta.colorClass} border ${masteryMeta.borderClass}`}
              >
                <span>{masteryMeta.label}</span>
              </span>

              {/* Difficulty */}
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                Độ khó: {entry.difficulty === 'beginner' ? 'Cơ bản' : entry.difficulty === 'advanced' ? 'Nâng cao' : 'Trung bình'}
              </span>

              {/* Rating */}
              <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[11px] font-semibold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{entry.rating}/5</span>
              </div>

              {/* Date */}
              {entry.entryDate && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
                  <Calendar className="w-3 h-3" />
                  <span>Ngày học: {entry.entryDate}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-lg sm:text-xl font-bold text-foreground leading-snug tracking-tight">
              {entry.title}
            </h1>

            {/* Summary Box */}
            {entry.summary && (
              <div className="p-3.5 rounded-xl border border-violet-500/20 bg-violet-500/5 text-violet-950 dark:text-violet-200 text-xs sm:text-sm font-medium leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold text-violet-700 dark:text-violet-300 block mb-0.5">
                    Ý chính cốt lõi:
                  </span>
                  <p>{entry.summary}</p>
                </div>
              </div>
            )}

            {/* Source Reference & Links Card */}
            {(entry.sourceName || entry.sourceUrl || (entry.links && entry.links.length > 0)) && (
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Link2 className="w-3.5 h-3.5 text-primary" />
                  <span>Nguồn & Tài liệu tham khảo</span>
                </div>

                {entry.sourceName && (
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">Nguồn ({entry.sourceType}): </span>
                    <span>{entry.sourceName}</span>
                  </div>
                )}

                {entry.sourceUrl && (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="font-medium text-foreground">Đường dẫn gốc: </span>
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline font-medium inline-flex items-center gap-1 truncate max-w-md"
                    >
                      <span className="truncate">{entry.sourceUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}

                {entry.links && entry.links.length > 0 && (
                  <div className="pt-2 border-t border-border/60">
                    <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                      Các liên kết liên quan:
                    </span>
                    <div className="space-y-1">
                      {entry.links.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 p-1.5 rounded-lg bg-background border border-border hover:border-primary text-primary transition-colors font-medium truncate"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{link.title || link.url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Next Review Reminder Banner */}
            {entry.nextReviewDate && (
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Lịch ôn tập tiếp theo: <strong>{entry.nextReviewDate}</strong></span>
                </div>
              </div>
            )}

            {/* Rich Markdown Article Content */}
            <div className="border-t border-border pt-4">
              <MarkdownRenderer content={entry.content} onImageClick={(url) => setActiveImageModal(url)} />
            </div>

            {/* Attached Images Gallery */}
            {entry.images && entry.images.length > 0 && (
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <ImageIcon className="w-3.5 h-3.5 text-violet-500" />
                  <span>Bộ sưu tập hình ảnh ({entry.images.length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {entry.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveImageModal(imgUrl)}
                      className="relative h-28 rounded-lg overflow-hidden border border-border cursor-pointer group bg-muted"
                    >
                      <img src={imgUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[11px] text-white font-medium bg-black/60 px-2 py-0.5 rounded">Xem lớn</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="border-t border-border pt-4 flex flex-wrap items-center gap-1.5">
                {entry.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-size Image Viewer Modal */}
      {activeImageModal && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveImageModal(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={activeImageModal} alt="Enlarged" className="max-w-full max-h-[85vh] rounded-lg object-contain" />
            <button
              type="button"
              onClick={() => setActiveImageModal(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
