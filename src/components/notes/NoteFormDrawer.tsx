import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  FileText,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Save,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Tag,
  FolderOpen,
  Pin,
  Plus,
  Trash2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Eye,
  Edit3,
  Upload,
  LocateFixed,
  Info,
  AlertTriangle,
  Lightbulb,
  CheckSquare,
  User,
  Table,
} from 'lucide-react';
import { Note, NoteCategory, NoteStatus, NoteAttachment } from '../../types/note';
import { NOTE_CATEGORIES, NOTE_COLOR_THEMES, PRESET_TAGS } from '../../data/notes';
import { TimePickerInput } from '../common/TimePickerInput';
import { useAuth } from '../../context/AuthContext';
import { MarkdownRenderer } from './MarkdownRenderer';

interface NoteFormDrawerProps {
  isOpen: boolean;
  initialData?: Note | null;
  defaultDate?: string;
  existingTags?: string[];
  onClose: () => void;
  onSubmit: (formData: Partial<Note>) => void;
}

type WidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

export const NoteFormDrawer: React.FC<NoteFormDrawerProps> = ({
  isOpen,
  initialData,
  defaultDate,
  existingTags = [],
  onClose,
  onSubmit,
}) => {
  const { currentUser } = useAuth();
  const [widthMode, setWidthMode] = useState<WidthMode>('wide');
  const isEdit = !!initialData;
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [contentTab, setContentTab] = useState<'edit' | 'preview'>('edit');

  const [category, setCategory] = useState<NoteCategory | ''>('');
  const [status, setStatus] = useState<NoteStatus>('published');
  const [isPinned, setIsPinned] = useState(false);
  const [color, setColor] = useState('blue');
  const [coverUrl, setCoverUrl] = useState('');

  // Author
  const [author, setAuthor] = useState('');
  const [authorAvatar, setAuthorAvatar] = useState('');

  // Date & Time
  const [noteDate, setNoteDate] = useState('');
  const [noteTime, setNoteTime] = useState('');

  // Location
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Attachments & Images
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [pasteToast, setPasteToast] = useState<string | null>(null);

  // Validation
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Dynamic tags from existing notes + database
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    (existingTags || []).forEach((t) => {
      if (t && t.trim()) set.add(t.trim().replace(/^#/, ''));
    });
    // Add default fallbacks if none exist yet
    if (set.size === 0) {
      PRESET_TAGS.forEach((t) => set.add(t));
    }
    return Array.from(set);
  }, [existingTags]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setSummary(initialData.summary || '');
      setContent(initialData.content || '');
      setCategory(initialData.category || '');
      setStatus(initialData.status || 'published');
      setIsPinned(!!initialData.isPinned);
      setColor(initialData.color || 'blue');
      setCoverUrl(initialData.coverUrl || '');
      setAuthor(initialData.author || currentUser?.name || currentUser?.username || 'admin');
      setAuthorAvatar(initialData.authorAvatar || currentUser?.avatarUrl || '');

      setNoteDate(initialData.noteDate || '');
      setNoteTime(initialData.noteTime || '');

      setLocation(initialData.location || '');
      setCoordinates(initialData.coordinates || '');

      setTags(initialData.tags || []);
      setAttachments(initialData.attachments || []);
      setImages(initialData.images || []);
    } else {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      setTitle('');
      setSummary('');
      setContent('');
      setCategory('');
      setStatus('published');
      setIsPinned(false);
      setColor('blue');
      setCoverUrl('');
      setAuthor(currentUser?.name || currentUser?.username || 'admin');
      setAuthorAvatar(currentUser?.avatarUrl || '');

      setNoteDate(defaultDate || todayStr);
      setNoteTime(timeStr);

      setLocation('');
      setCoordinates('');

      setTags([]);
      setAttachments([]);
      setImages([]);

      // Auto fetch GPS location if creating new note
      if (isOpen && typeof navigator !== 'undefined' && navigator.geolocation) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            setIsLocating(false);
            const lat = pos.coords.latitude.toFixed(6);
            const lng = pos.coords.longitude.toFixed(6);
            setCoordinates(`${lat}° N, ${lng}° E`);

            // Try reverse geocoding to human readable address
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { headers: { 'Accept-Language': 'vi' } }
              );
              if (res.ok) {
                const data = await res.json();
                if (data && data.address) {
                  const addr = data.address;
                  const parts = [
                    addr.road || addr.suburb || addr.quarter || addr.neighbourhood,
                    addr.city_district || addr.district || addr.town || addr.city,
                    addr.state || addr.province,
                  ].filter(Boolean);
                  const readable = parts.length > 0 ? parts.join(', ') : data.display_name;
                  setLocation(readable);
                  return;
                }
              }
            } catch {}
            setLocation(`Vị trí hiện tại (${lat}, ${lng})`);
          },
          () => {
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    }
    setFormErrors({});
    setContentTab('edit');
  }, [initialData, isOpen]);

  const getWidthStyle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return '100vw';
    }
    switch (widthMode) {
      case 'narrow':
        return 'min(600px, 100vw)';
      case 'normal':
        return 'min(820px, -4rem + 100vw)';
      case 'wide':
        return 'min(1080px, 100vw)';
      case 'fullscreen':
      default:
        return '100vw';
    }
  };

  // Tag Handlers
  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  // Cover & Gallery Uploads
  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setCoverUrl(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (evt.target?.result) {
            const url = evt.target.result as string;
            setImages((prev) => [...prev, url]);
            const newAttach: NoteAttachment = {
              id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              name: file.name,
              url,
              type: 'image',
              size: `${(file.size / 1024).toFixed(1)} KB`,
            };
            setAttachments((prev) => [...prev, newAttach]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveAttachment = (id: string, url: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
    setImages(images.filter((img) => img !== url));
  };

  // Clipboard Paste Image Handler (Ctrl + V)
  const processPastedImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        const dataUrl = evt.target.result as string;
        
        // Add to images gallery
        setImages((prev) => [...prev, dataUrl]);

        // Add to attachments
        const newAttach: NoteAttachment = {
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: `Anh_dan_${Date.now().toString().slice(-4)}.png`,
          url: dataUrl,
          type: 'image',
          size: `${(file.size / 1024).toFixed(1)} KB`,
        };
        setAttachments((prev) => [...prev, newAttach]);

        // If cursor inside textarea, insert markdown
        const textarea = contentTextareaRef.current;
        if (textarea && document.activeElement === textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const imgMarkdown = `\n![Hình ảnh đính kèm](${dataUrl})\n`;
          const newContent = content.substring(0, start) + imgMarkdown + content.substring(end);
          setContent(newContent);
        }

        setPasteToast('✅ Đã dán ảnh từ Clipboard (Ctrl + V) thành công!');
        setTimeout(() => setPasteToast(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  // Window-level Ctrl+V listener when Drawer is open
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
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [isOpen, content]);

  // GPS Geolocation Handler with reverse geocoding
  const handleGetCurrentLocation = (silent: boolean = false) => {
    if (!navigator.geolocation) {
      if (!silent) alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setCoordinates(`${lat}° N, ${lng}° E`);

        // Try reverse geocoding to human readable address
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'vi' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
              const addr = data.address;
              const parts = [
                addr.road || addr.suburb || addr.quarter || addr.neighbourhood,
                addr.city_district || addr.district || addr.town || addr.city,
                addr.state || addr.province,
              ].filter(Boolean);
              const readable = parts.length > 0 ? parts.join(', ') : data.display_name;
              setLocation(readable);
              return;
            }
          }
        } catch {}
        setLocation((prev) => prev || `Vị trí hiện tại (${lat}, ${lng})`);
      },
      (err) => {
        setIsLocating(false);
        if (!silent) {
          alert(`Không thể lấy vị trí GPS: ${err.message}`);
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Content Toolbar Inserts
  const insertContentMarkup = (before: string, after: string = '', defaultPlaceholder: string = 'nội dung') => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const isBlock =
      before.startsWith('#') ||
      before.startsWith('>') ||
      before.startsWith('```') ||
      before.startsWith('- ') ||
      before.startsWith('1. ') ||
      before.startsWith('|');

    let prefix = before;
    if (isBlock && start > 0) {
      if (content[start - 1] !== '\n') {
        prefix = '\n\n' + before;
      } else if (start > 1 && content[start - 2] !== '\n') {
        prefix = '\n' + before;
      }
    }

    const placeholder = selectedText || defaultPlaceholder;
    const replacement = `${prefix}${placeholder}${after}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const selectStart = start + prefix.length;
      const selectEnd = selectStart + placeholder.length;
      textarea.setSelectionRange(selectStart, selectEnd);
    }, 50);
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!title.trim()) errors.title = 'Vui lòng nhập tiêu đề bài viết/ghi chú';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Partial<Note> = {
      title: title.trim(),
      summary: summary.trim() || undefined,
      content: content.trim() || '',
      category: (category || 'Ghi chú chung') as NoteCategory,
      status,
      isPinned,
      color,
      coverUrl: coverUrl.trim() || undefined,
      noteDate: noteDate || undefined,
      noteTime: noteTime || undefined,
      location: location.trim() || undefined,
      coordinates: coordinates.trim() || undefined,
      tags: tags.length > 0 ? tags : [],
      author: author.trim() || currentUser?.name || currentUser?.username || 'admin',
      authorAvatar: authorAvatar || currentUser?.avatarUrl || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      images: images.length > 0 ? images : undefined,
    };

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        className="fixed inset-y-0 right-0 w-full bg-card shadow-2xl flex flex-col h-[100dvh] border-l border-border outline-none transform-gpu z-50 transition-[width] duration-200"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Chỉnh sửa Ghi chú & Bài viết' : 'Tạo mới Ghi chú & Bài viết'}
        tabIndex={-1}
        style={{
          width: getWidthStyle(),
          transform: 'none',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-4 border-b border-border bg-card shrink-0"
          style={{
            paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
            paddingBottom: '0.5rem',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          }}
        >
          {/* Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground leading-tight truncate">
                {isEdit ? 'Chỉnh sửa Ghi chú' : 'Tạo mới Ghi chú & Bài viết'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {isEdit ? title || 'Biên tập nội dung tài liệu' : 'Soạn thảo tiêu đề, nội dung bài viết, ảnh và định vị GPS'}
              </p>
            </div>
          </div>

          {/* Width Controls & Close */}
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

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              title="Đóng"
              className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors active:scale-90 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paste Toast Notification */}
        {pasteToast && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between shadow-md transition-all animate-in slide-in-from-top duration-150">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" />
              {pasteToast}
            </span>
            <button
              type="button"
              onClick={() => setPasteToast(null)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <form id="note-form" onSubmit={handleSubmit} className="space-y-6">
            {/* 1. TIÊU ĐỀ & NỘI DUNG BÀI VIẾT (Được đưa lên đầu theo yêu cầu) */}
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
                    onClick={() => setContentTab('edit')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                      contentTab === 'edit'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Soạn thảo
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentTab('preview')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                      contentTab === 'preview'
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
                  Tiêu đề bài viết / Ghi chú <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Biên bản Cuộc họp Chiến lược Q4/2026..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full rounded-xl border ${
                    formErrors.title ? 'border-destructive' : 'border-border'
                  } bg-background px-3.5 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all`}
                />
                {formErrors.title && (
                  <p className="text-xs text-destructive mt-1">{formErrors.title}</p>
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
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>

              {/* Main Content Area */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Nội dung chi tiết (Markdown / Web Rich Content)
                </label>

                {contentTab === 'edit' ? (
                  <div className="space-y-2">
                    {/* Rich Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-xl border border-border bg-muted/20">
                      <button
                        type="button"
                        title="Tiêu đề H1"
                        onClick={() => insertContentMarkup('# ')}
                        className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                      >
                        <Heading1 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Tiêu đề H2"
                        onClick={() => insertContentMarkup('## ')}
                        className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                      >
                        <Heading2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Tiêu đề H3"
                        onClick={() => insertContentMarkup('### ')}
                        className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                      >
                        <Heading3 className="w-4 h-4" />
                      </button>
                      <div className="w-[1px] h-4 bg-border mx-1" />
                      <button
                        type="button"
                        title="Chữ đậm"
                        onClick={() => insertContentMarkup('**', '**')}
                        className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Chữ nghiêng"
                        onClick={() => insertContentMarkup('*', '*')}
                        className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                      <div className="w-[1px] h-4 bg-border mx-1" />
                      <button
                        type="button"
                        title="Danh sách gạch đầu dòng"
                        onClick={() => insertContentMarkup('- ')}
                        className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Danh sách đánh số"
                        onClick={() => insertContentMarkup('1. ')}
                        className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Checklist công việc"
                        onClick={() => insertContentMarkup('- [ ] ')}
                        className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                      <div className="w-[1px] h-4 bg-border mx-1" />
                      <button
                        type="button"
                        title="Trích dẫn"
                        onClick={() => insertContentMarkup('> ')}
                        className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                      >
                        <Quote className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="Khối mã nguồn (Code block)"
                        onClick={() => insertContentMarkup('```typescript\n', '\n```')}
                        className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                      >
                        <Code className="w-4 h-4" />
                      </button>
                      <div className="w-[1px] h-4 bg-border mx-1" />
                      <button
                        type="button"
                        title="Bảng dữ liệu Markdown"
                        onClick={() =>
                          insertContentMarkup(
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
                        onClick={() => insertContentMarkup('> [!NOTE]\n> ', '', 'Nhập nội dung lưu ý quan trọng tại đây...')}
                        className="p-1.5 rounded-lg hover:bg-muted text-primary transition-colors text-xs flex items-center gap-1"
                      >
                        <Info className="w-3.5 h-3.5" /> Note
                      </button>
                      <button
                        type="button"
                        title="Hộp mẹo hay (Tip callout)"
                        onClick={() => insertContentMarkup('> [!TIP]\n> ', '', 'Nhập mẹo hay hoặc hướng dẫn thực thi...')}
                        className="p-1.5 rounded-lg hover:bg-muted text-emerald-600 dark:text-emerald-400 transition-colors text-xs flex items-center gap-1"
                      >
                        <Lightbulb className="w-3.5 h-3.5" /> Mẹo
                      </button>
                      <button
                        type="button"
                        title="Hộp cảnh báo (Warning callout)"
                        onClick={() => insertContentMarkup('> [!WARNING]\n> ', '', 'Cảnh báo rủi ro hoặc lưu ý bắt buộc...')}
                        className="p-1.5 rounded-lg hover:bg-muted text-amber-600 dark:text-amber-400 transition-colors text-xs flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Cảnh báo
                      </button>
                    </div>

                    {/* Textarea */}
                    <textarea
                      ref={contentTextareaRef}
                      rows={12}
                      placeholder="Soạn thảo nội dung chi tiết bài viết, biên bản hoặc ghi nhớ..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background p-4 text-xs sm:text-sm font-mono leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-y"
                    />
                  </div>
                ) : (
                  /* Live Preview */
                  <div className="rounded-xl border border-border/80 bg-background/50 p-5 min-h-[220px]">
                    <MarkdownRenderer content={content} />
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

                {/* Theme Color Picker */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">Màu sắc:</span>
                  {NOTE_COLOR_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      title={theme.name}
                      onClick={() => setColor(theme.id)}
                      className={`w-5 h-5 rounded-full ${theme.badge} border transition-all ${
                        color === theme.id ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'
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
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NoteCategory)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Chưa phân loại / Chọn chuyên mục --</option>
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
                    value={status}
                    onChange={(e) => setStatus(e.target.value as NoteStatus)}
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
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Người tạo..."
                      className="w-full rounded-xl border border-border bg-background pl-8.5 pr-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Ghim ưu tiên
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPinned(!isPinned)}
                    className={`w-full h-[38px] rounded-xl border px-3 flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                      isPinned
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                    {isPinned ? 'Đang ghim lên đầu' : 'Không ghim'}
                  </button>
                </div>
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Thẻ phân loại (Tags) - Nhấn Enter hoặc dấu phẩy để thêm
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-border bg-background min-h-[42px]">
                  {tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                    >
                      <Tag className="w-3 h-3" />
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(idx)}
                        className="hover:text-destructive transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={tags.length === 0 ? 'Thêm thẻ (nhập rồi Enter)...' : 'Thêm tiếp...'}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => {
                      if (tagInput.trim()) handleAddTag(tagInput);
                    }}
                    className="flex-1 min-w-[120px] bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none px-1 py-0.5"
                  />
                </div>

                {/* Preset Tag Badges (dynamic from existing notes) */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-muted-foreground mr-1">Gợi ý nhanh từ ghi chú:</span>
                  {availableTags.map((pt: string) => {
                    const isSelected = tags.includes(pt);
                    return (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => (isSelected ? handleRemoveTag(tags.indexOf(pt)) : handleAddTag(pt))}
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

            {/* 3. THỜI GIAN, VỊ TRÍ & ẢNH ĐÍNH KÈM */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs transition-all hover:border-border hover:shadow-md space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  3. Thời gian, Vị trí & Ảnh đính kèm
                </h4>
              </div>

              {/* Event Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Ngày sự kiện / thực hiện
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
                    Giờ sự kiện / thực hiện
                  </label>
                  <TimePickerInput
                    value={noteTime}
                    onChange={(val) => setNoteTime(val)}
                    placeholder="Chọn hoặc nhập giờ..."
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
                    onClick={() => handleGetCurrentLocation(false)}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline disabled:opacity-50"
                  >
                    <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    {isLocating ? 'Đang xác định GPS...' : 'Lấy vị trí GPS hiện tại'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Tên địa điểm / Địa chỉ..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Tọa độ GPS (Ví dụ: 10.7951° N, 106.7218° E)"
                    value={coordinates}
                    onChange={(e) => setCoordinates(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              {/* Cover Banner */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Ảnh bìa bài viết (Cover Banner)
                </label>
                {coverUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border h-36 sm:h-44 group">
                    <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white/90 text-foreground text-xs font-medium hover:bg-white flex items-center gap-1.5 shadow-md"
                      >
                        <Upload className="w-3.5 h-3.5" /> Thay ảnh
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverUrl('')}
                        className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 flex items-center gap-1.5 shadow-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa bìa
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-primary/5 text-xs text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" /> Tải ảnh bìa từ máy
                    </button>
                    <div className="flex-1 w-full relative">
                      <input
                        type="url"
                        placeholder="Hoặc dán URL hình ảnh..."
                        value={coverUrl}
                        onChange={(e) => setCoverUrl(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileUpload}
                  className="hidden"
                />
              </div>

              {/* Photo Gallery Attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-muted-foreground">
                    Thư viện hình ảnh đính kèm ({images.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Tải thêm ảnh
                  </button>
                </div>

                {/* Ctrl+V Paste Helper Notice */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-primary/25 bg-primary/5 text-primary text-xs mb-3">
                  <ImageIcon className="w-4 h-4 shrink-0 text-primary" />
                  <span className="leading-snug">
                    <strong>Hỗ trợ dán ảnh nhanh:</strong> Bạn có thể chụp màn hình hoặc sao chép ảnh từ máy tính rồi nhấn <strong>Ctrl + V</strong> ở bất kỳ đâu trong form để đính kèm ảnh ngay!
                  </span>
                </div>

                <input
                  ref={galleryInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleGalleryUpload}
                  className="hidden"
                />

                {images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl overflow-hidden border border-border group bg-muted/40 aspect-video flex items-center justify-center"
                      >
                        <img src={imgUrl} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-between p-2">
                          <div className="w-full flex items-center justify-between">
                            <span className="text-[10px] text-white truncate max-w-[70%] font-medium">
                              Ảnh #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => setCoverUrl(imgUrl)}
                              className="px-1.5 py-0.5 rounded bg-white/90 text-[10px] text-foreground font-semibold hover:bg-white transition-all shadow-xs"
                              title="Đặt làm ảnh bìa"
                            >
                              Làm bìa
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(`img_${idx}`, imgUrl)}
                            className="p-1 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all self-end"
                            title="Xóa ảnh"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 border border-dashed border-border rounded-xl bg-muted/20">
                    <p className="text-xs text-muted-foreground">
                      Chưa có ảnh đính kèm. Bấm nút <strong>"Tải thêm ảnh"</strong> hoặc nhấn <strong>Ctrl + V</strong> để dán ảnh.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Sticky Footer */}
        <div
          className="border-t border-border bg-card shrink-0"
          style={{
            paddingTop: '0.75rem',
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
          }}
        >
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 text-xs border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="note-form"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-4 text-xs bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              {isEdit ? 'Lưu thay đổi' : 'Lưu ghi chú'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
