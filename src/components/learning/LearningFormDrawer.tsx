import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Upload,
  Image as ImageIcon,
  Link2,
  Trash2,
  Plus,
  Star,
  Pin,
  ExternalLink,
  BookOpen,
  Edit3,
} from 'lucide-react';
import {
  LearningEntry,
  LearningLink,
  LearningSourceType,
  MasteryLevel,
  DifficultyLevel,
} from '../../types/learning';
import { LEARNING_CATEGORIES, LEARNING_SOURCE_TYPES } from '../../data/learning';
import { catboxService } from '../../services/catboxService';
import { MarkdownRenderer } from '../notes/MarkdownRenderer';

interface LearningFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: LearningEntry) => void;
  initialEntry?: LearningEntry | null;
}

export const LearningFormDrawer: React.FC<LearningFormDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEntry,
}) => {
  const isEditing = !!initialEntry;

  // Form states
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(LEARNING_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [sourceType, setSourceType] = useState<LearningSourceType>('Khóa học');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [links, setLinks] = useState<LearningLink[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [masteryLevel, setMasteryLevel] = useState<MasteryLevel>('learning');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [rating, setRating] = useState(5);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [nextReviewDate, setNextReviewDate] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [color, setColor] = useState('#8b5cf6');
  const [coverUrl, setCoverUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // UI tabs in editor
  const [editorMode, setEditorMode] = useState<'write' | 'preview' | 'split'>('write');
  const [isUploading, setIsUploading] = useState(false);
  const [pasteToast, setPasteToast] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize or reset form
  useEffect(() => {
    if (initialEntry) {
      setTitle(initialEntry.title || '');
      setSummary(initialEntry.summary || '');
      setContent(initialEntry.content || '');
      if (LEARNING_CATEGORIES.includes(initialEntry.category)) {
        setCategory(initialEntry.category);
        setCustomCategory('');
      } else {
        setCategory('Khác');
        setCustomCategory(initialEntry.category || '');
      }
      setTags(initialEntry.tags || []);
      setSourceType(initialEntry.sourceType || 'Khóa học');
      setSourceName(initialEntry.sourceName || '');
      setSourceUrl(initialEntry.sourceUrl || '');
      setLinks(initialEntry.links || []);
      setMasteryLevel(initialEntry.masteryLevel || 'learning');
      setDifficulty(initialEntry.difficulty || 'intermediate');
      setRating(initialEntry.rating ?? 5);
      setEntryDate(initialEntry.entryDate || new Date().toISOString().split('T')[0]);
      setNextReviewDate(initialEntry.nextReviewDate || '');
      setIsPinned(initialEntry.isPinned || false);
      setColor(initialEntry.color || '#8b5cf6');
      setCoverUrl(initialEntry.coverUrl || '');
      setImages(initialEntry.images || []);
    } else {
      setTitle('');
      setSummary('');
      setContent('');
      setCategory(LEARNING_CATEGORIES[0]);
      setCustomCategory('');
      setTags([]);
      setTagInput('');
      setSourceType('Khóa học');
      setSourceName('');
      setSourceUrl('');
      setLinks([]);
      setNewLinkTitle('');
      setNewLinkUrl('');
      setMasteryLevel('learning');
      setDifficulty('intermediate');
      setRating(5);
      setEntryDate(new Date().toISOString().split('T')[0]);
      setNextReviewDate('');
      setIsPinned(false);
      setColor('#8b5cf6');
      setCoverUrl('');
      setImages([]);
    }
    setEditorMode('write');
  }, [initialEntry, isOpen]);

  // Upload image to Catbox
  const uploadImageFile = async (file: File): Promise<string> => {
    try {
      return await catboxService.uploadFile(file);
    } catch (err) {
      console.warn('Catbox upload failed, fallback to data URL:', err);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.readAsDataURL(file);
      });
    }
  };

  // Clipboard Paste Image Handler (Ctrl + V)
  const processPastedImage = async (file: File) => {
    setIsUploading(true);
    setPasteToast('☁️ Đang tải ảnh Clipboard lên Catbox...');
    try {
      const url = await uploadImageFile(file);
      if (url) {
        setImages((prev) => [...prev, url]);
        // Insert markdown into cursor position
        const textarea = contentTextareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const imgMarkdown = `\n![Hình ảnh kiến thức](${url})\n`;
          const newContent = content.substring(0, start) + imgMarkdown + content.substring(end);
          setContent(newContent);
        } else {
          setContent((prev) => `${prev}\n![Hình ảnh kiến thức](${url})\n`);
        }
        setPasteToast('✅ Đã tải ảnh lên Catbox & chèn vào bài học (Ctrl+V)!');
      }
    } catch {
      setPasteToast('❌ Tải ảnh thất bại!');
    } finally {
      setIsUploading(false);
      setTimeout(() => setPasteToast(null), 3000);
    }
  };

  // Window-level Ctrl+V paste listener
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processPastedImage(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [isOpen, content]);

  // Handle Cover File Upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setPasteToast('☁️ Đang tải ảnh bìa lên Catbox...');
    try {
      const url = await uploadImageFile(file);
      setCoverUrl(url);
      setPasteToast('✅ Đã lưu ảnh bìa lên Catbox!');
    } catch {
      setPasteToast('❌ Lỗi tải ảnh bìa');
    } finally {
      setIsUploading(false);
      setTimeout(() => setPasteToast(null), 3000);
    }
  };

  // Add External Image URL
  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setImages((prev) => [...prev, trimmed]);
    const imgMarkdown = `\n![Hình ảnh tham khảo](${trimmed})\n`;
    setContent((prev) => prev + imgMarkdown);
    setImageUrlInput('');
    setShowImageUrlInput(false);
  };

  // Add Tag
  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  // Add Link
  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    const newLink: LearningLink = {
      id: 'link_' + Date.now(),
      title: newLinkTitle.trim() || newLinkUrl.trim(),
      url: newLinkUrl.trim().startsWith('http') ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`,
    };
    setLinks([...links, newLink]);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const handleRemoveLink = (id: string) => {
    setLinks(links.filter((l) => l.id !== id));
  };

  // Save
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề kiến thức / bài học.');
      return;
    }

    const finalCategory = category === 'Khác' && customCategory.trim() ? customCategory.trim() : category;
    const finalCode = initialEntry?.code || `HH-${String(Date.now()).slice(-4)}`;
    const finalId = initialEntry?.id || `learn_${finalCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const entryPayload: LearningEntry = {
      id: finalId,
      code: finalCode,
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      category: finalCategory,
      tags,
      sourceType,
      sourceName: sourceName.trim(),
      sourceUrl: sourceUrl.trim()
        ? sourceUrl.trim().startsWith('http')
          ? sourceUrl.trim()
          : `https://${sourceUrl.trim()}`
        : '',
      links,
      images,
      coverUrl,
      masteryLevel,
      difficulty,
      rating,
      entryDate,
      nextReviewDate: nextReviewDate || undefined,
      isPinned,
      color,
      createdAt: initialEntry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(entryPayload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-3xl bg-card border-l border-border shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-border bg-card flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  {isEditing ? `Chỉnh sửa: ${initialEntry.code}` : 'Thêm kiến thức / Bài học mới'}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Ghi chép kiến thức, đính kèm hình ảnh qua Catbox và liên kết tham khảo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                title={isPinned ? 'Đang ghim (Bấm để bỏ ghim)' : 'Ghim bài học này'}
                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                  isPinned
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Toast Notice */}
          {pasteToast && (
            <div className="bg-primary text-primary-foreground text-xs px-4 py-2 text-center animate-in fade-in duration-200 font-medium">
              {pasteToast}
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Tiêu đề kiến thức / Bài học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Nguyên lý Dependency Inversion trong Clean Architecture..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Ý chính cốt lõi / Tóm tắt ngắn (1-2 câu)
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="VD: Các module cấp cao không nên phụ thuộc vào module cấp thấp, cả hai nên phụ thuộc abstraction."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Category & Mastery Level & Difficulty & Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Chuyên mục</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                >
                  {LEARNING_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {category === 'Khác' && (
                  <input
                    type="text"
                    placeholder="Nhập chuyên mục riêng..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full mt-1.5 px-2.5 py-1 text-xs rounded-lg border border-border bg-background"
                  />
                )}
              </div>

              {/* Mastery Level */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Mức độ nắm vững</label>
                <select
                  value={masteryLevel}
                  onChange={(e) => setMasteryLevel(e.target.value as MasteryLevel)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="learning">📖 Đang học</option>
                  <option value="practicing">🛠️ Đang thực hành</option>
                  <option value="mastered">✅ Đã nắm vững</option>
                  <option value="review_needed">🔄 Cần ôn lại</option>
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Độ khó</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="beginner">🌱 Cơ bản</option>
                  <option value="intermediate">⚡ Trung bình</option>
                  <option value="advanced">🔥 Nâng cao</option>
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Độ hữu ích</label>
                <div className="flex items-center gap-1 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-0.5 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-1.5 font-semibold">({rating}/5)</span>
                </div>
              </div>
            </div>

            {/* Source Information */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Link2 className="w-3.5 h-3.5 text-primary" />
                <span>Nguồn tham khảo & Tài liệu gốc</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Loại nguồn</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as LearningSourceType)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background"
                  >
                    {LEARNING_SOURCE_TYPES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Tên nguồn / Tác giả</label>
                  <input
                    type="text"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="VD: Sách Pragmatic Programmer..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Link nguồn URL</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background"
                    />
                    {sourceUrl && (
                      <a
                        href={sourceUrl.startsWith('http') ? sourceUrl : `https://${sourceUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                        title="Mở link nguồn"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Extra Reference Links */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Các liên kết mở rộng khác:</span>
                </div>
                {links.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {links.map((lnk) => (
                      <div
                        key={lnk.id}
                        className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-background border border-border text-xs"
                      >
                        <a
                          href={lnk.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline truncate flex items-center gap-1 font-medium"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{lnk.title || lnk.url}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(lnk.id)}
                          className="text-muted-foreground hover:text-rose-500 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Tiêu đề link..."
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="w-1/3 px-2 py-1 text-xs rounded-lg border border-border bg-background"
                  />
                  <input
                    type="text"
                    placeholder="Đường dẫn URL (https://...)"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs rounded-lg border border-border bg-background"
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dates: Entry Date & Next Review Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Ngày ghi nhận kiến thức</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Ngày cần ôn lại (Spaced Repetition)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={nextReviewDate}
                    onChange={(e) => setNextReviewDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
                  />
                  {nextReviewDate && (
                    <button
                      type="button"
                      onClick={() => setNextReviewDate('')}
                      className="text-xs text-muted-foreground hover:text-foreground shrink-0 underline"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cover Image & Image Upload to Catbox */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-violet-500" />
                  <span>Hình ảnh & Ảnh bìa (Lưu trữ vĩnh viễn trên Catbox)</span>
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Mẹo: Bấm <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl + V</kbd> ở bất kỳ
                  đâu để dán ảnh trực tiếp!
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Upload Cover Button */}
                <label className="cursor-pointer px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3 h-3 text-muted-foreground" />
                  <span>Tải ảnh bìa (Catbox)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>

                {/* Paste / Enter URL */}
                <button
                  type="button"
                  onClick={() => setShowImageUrlInput(!showImageUrlInput)}
                  className="px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Link2 className="w-3 h-3 text-muted-foreground" />
                  <span>Chèn link ảnh</span>
                </button>

                {coverUrl && (
                  <button
                    type="button"
                    onClick={() => setCoverUrl('')}
                    className="text-xs text-rose-500 hover:underline"
                  >
                    Bỏ ảnh bìa
                  </button>
                )}
              </div>

              {showImageUrlInput && (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="Dán đường dẫn ảnh https://..."
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-border bg-background"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
                  >
                    Chèn
                  </button>
                </div>
              )}

              {/* Cover preview */}
              {coverUrl && (
                <div className="relative mt-2 w-full h-32 rounded-lg overflow-hidden border border-border group">
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setCoverUrl('')}
                      className="px-2 py-1 rounded bg-rose-600 text-white text-xs font-medium"
                    >
                      Xóa ảnh bìa
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Markdown Content Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-primary" />
                  <span>Nội dung ghi chép kiến thức (Markdown)</span>
                </label>

                {/* View toggles */}
                <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditorMode('write')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors ${
                      editorMode === 'write' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    Viết
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('preview')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors ${
                      editorMode === 'preview' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    Xem trước
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('split')}
                    className={`hidden sm:inline-block px-2 py-0.5 rounded font-medium transition-colors ${
                      editorMode === 'split' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    Chia đôi
                  </button>
                </div>
              </div>

              {/* Markdown Editor Controls */}
              {editorMode !== 'preview' && (
                <div className="flex flex-wrap items-center gap-1 p-1 bg-muted/40 border border-border border-b-0 rounded-t-lg text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => setContent((prev) => `${prev}\n### Tiêu đề phụ\n`)}
                    className="px-1.5 py-0.5 hover:bg-background rounded"
                    title="Tiêu đề H3"
                  >
                    H3
                  </button>
                  <button
                    type="button"
                    onClick={() => setContent((prev) => `${prev}**In đậm**`)}
                    className="px-1.5 py-0.5 font-bold hover:bg-background rounded"
                    title="In đậm"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => setContent((prev) => `${prev}*In nghiêng*`)}
                    className="px-1.5 py-0.5 italic hover:bg-background rounded"
                    title="In nghiêng"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => setContent((prev) => `${prev}\n- Mục 1\n- Mục 2\n`)}
                    className="px-1.5 py-0.5 hover:bg-background rounded"
                    title="Danh sách gạch đầu dòng"
                  >
                    • List
                  </button>
                  <button
                    type="button"
                    onClick={() => setContent((prev) => `${prev}\n> [!TIP]\n> Mẹo quan trọng ở đây...\n`)}
                    className="px-1.5 py-0.5 hover:bg-background rounded"
                    title="Callout Mẹo"
                  >
                    💡 Mẹo
                  </button>
                  <button
                    type="button"
                    onClick={() => setContent((prev) => `${prev}\n> [!NOTE]\n> Lưu ý ghi nhớ...\n`)}
                    className="px-1.5 py-0.5 hover:bg-background rounded"
                    title="Callout Lưu ý"
                  >
                    📌 Lưu ý
                  </button>
                  <button
                    type="button"
                    onClick={() => setContent((prev) => prev + '\n```ts\n// Code ví dụ minh họa\nconst example = true;\n```\n')}
                    className="px-1.5 py-0.5 font-mono hover:bg-background rounded"
                    title="Khối mã code"
                  >
                    {'</>'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setContent((prev) => `${prev}\n| Khái niệm | Ý nghĩa |\n| --- | --- |\n| Term A | Định nghĩa A |\n`)}
                    className="px-1.5 py-0.5 hover:bg-background rounded"
                    title="Bảng biểu"
                  >
                    📊 Bảng
                  </button>
                </div>
              )}

              {/* Editor Workspace */}
              <div
                className={`border border-border rounded-b-lg overflow-hidden bg-background ${
                  editorMode === 'write' ? 'rounded-t-none' : editorMode === 'preview' ? 'rounded-t-lg' : ''
                }`}
              >
                {editorMode === 'split' ? (
                  <div className="grid grid-cols-2 divide-x divide-border min-h-[300px]">
                    <textarea
                      ref={contentTextareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Nhập nội dung markdown tại đây hoặc bấm Ctrl+V để dán ảnh..."
                      rows={14}
                      className="w-full p-3 text-xs sm:text-sm font-mono bg-transparent focus:outline-none resize-none leading-relaxed"
                    />
                    <div className="p-3 overflow-y-auto max-h-[380px] bg-card">
                      <MarkdownRenderer content={content} />
                    </div>
                  </div>
                ) : editorMode === 'preview' ? (
                  <div className="p-4 overflow-y-auto min-h-[300px] max-h-[420px] bg-card">
                    <MarkdownRenderer content={content} />
                  </div>
                ) : (
                  <textarea
                    ref={contentTextareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Soạn thảo kiến thức với Markdown... Bấm Ctrl + V để dán ảnh lên Catbox!"
                    rows={12}
                    className="w-full p-3 text-xs sm:text-sm font-mono bg-transparent focus:outline-none resize-y leading-relaxed"
                  />
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Thẻ từ khóa (Tags) để tìm kiếm nhanh
              </label>
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-500 transition-colors ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhập thẻ rồi bấm Thêm (VD: React, CleanCode, Sales...)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-background"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 rounded-lg border border-border bg-muted hover:bg-muted/80 text-xs font-medium"
                >
                  Thêm thẻ
                </button>
              </div>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="px-4 sm:px-6 py-3 border-t border-border bg-card flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Lưu thay đổi' : 'Lưu kiến thức'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
