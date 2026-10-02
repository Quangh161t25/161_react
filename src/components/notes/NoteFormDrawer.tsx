import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getSafeAvatarUrl } from '../../utils/avatarUtils';
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
  Users,
  UserPlus,
  Sparkles,
  Search,
  Check,
  Loader2,
} from 'lucide-react';
import { catboxService } from '../../services/catboxService';
import { Note, NoteCategory, NoteStatus, NoteAttachment, NoteParticipant } from '../../types/note';
import { NOTE_CATEGORIES, NOTE_COLOR_THEMES, PRESET_TAGS } from '../../data/notes';
import { TimePickerInput } from '../common/TimePickerInput';
import { useAuth } from '../../context/AuthContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import { employeeService } from '../../services/employeeService';
import { Employee } from '../../types/employee';

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

  // Participants & Diary Activity
  const [participants, setParticipants] = useState<NoteParticipant[]>([]);
  const [activity, setActivity] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [customParticipantName, setCustomParticipantName] = useState('');
  const [allEmployees] = useState<Employee[]>(() =>
    employeeService.getInitialEmployees()
  );

  // Attachments & Images
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [pasteToast, setPasteToast] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // Validation
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Filtered employees for picker
  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.toLowerCase().trim();
    if (!q) return allEmployees;
    return allEmployees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        (emp.code && emp.code.toLowerCase().includes(q)) ||
        (emp.department && emp.department.toLowerCase().includes(q)) ||
        (emp.role && emp.role.toLowerCase().includes(q))
    );
  }, [allEmployees, employeeSearch]);

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

      setParticipants(initialData.participants || []);
      setActivity(initialData.activity || '');
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

      setParticipants([]);
      setActivity('');
      setEmployeeSearch('');
      setCustomParticipantName('');

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

  // Cover & Gallery Uploads via Catbox.moe
  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setPasteToast('☁️ Đang tải ảnh bìa lên Catbox...');
    try {
      const catboxUrl = await catboxService.uploadFile(file);
      setCoverUrl(catboxUrl);
      setPasteToast('☁️ Đã lưu ảnh bìa lên Catbox thành công!');
      setTimeout(() => setPasteToast(null), 3000);
    } catch (err) {
      console.warn('Catbox cover upload failed, fallback to local data URL:', err);
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setCoverUrl(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingGallery(true);
    setPasteToast('☁️ Đang tải ảnh lên Catbox...');
    try {
      const fileList = Array.from(files);
      for (const file of fileList) {
        try {
          const url = await catboxService.uploadFile(file);
          setImages((prev) => [...prev, url]);
          const newAttach: NoteAttachment = {
            id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: file.name,
            url,
            type: 'image',
            size: `${(file.size / 1024).toFixed(1)} KB`,
          };
          setAttachments((prev) => [...prev, newAttach]);
        } catch (fileErr) {
          console.warn('Catbox upload failed for file, fallback to local:', fileErr);
          const reader = new FileReader();
          reader.onload = (evt) => {
            if (evt.target?.result) {
              const localUrl = evt.target.result as string;
              setImages((prev) => [...prev, localUrl]);
              const newAttach: NoteAttachment = {
                id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                name: file.name,
                url: localUrl,
                type: 'image',
                size: `${(file.size / 1024).toFixed(1)} KB`,
              };
              setAttachments((prev) => [...prev, newAttach]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
      setPasteToast('✅ Đã lưu ảnh vào thư viện đính kèm (Catbox)!');
      setTimeout(() => setPasteToast(null), 3000);
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleRemoveAttachment = (id: string, url: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
    setImages(images.filter((img) => img !== url));
  };

  // Clipboard Paste Image Handler (Ctrl + V)
  const processPastedImage = async (file: File) => {
    setPasteToast('☁️ Đang tải ảnh Clipboard lên Catbox...');
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
      setImages((prev) => [...prev, url]);
      const newAttach: NoteAttachment = {
        id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: `Anh_dan_${Date.now().toString().slice(-4)}.png`,
        url,
        type: 'image',
        size: `${(file.size / 1024).toFixed(1)} KB`,
      };
      setAttachments((prev) => [...prev, newAttach]);

      // If cursor inside textarea, insert markdown
      const textarea = contentTextareaRef.current;
      if (textarea && document.activeElement === textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const imgMarkdown = `\n![Hình ảnh đính kèm](${url})\n`;
        const newContent = content.substring(0, start) + imgMarkdown + content.substring(end);
        setContent(newContent);
      }

      setPasteToast('✅ Đã tải ảnh lên Catbox & chèn vào bài viết (Ctrl + V)!');
      setTimeout(() => setPasteToast(null), 3500);
    }
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

  // Participant Handlers
  const handleToggleEmployeeParticipant = (emp: Employee) => {
    const isAlready = participants.some(
      (p) => (p.id && p.id === emp.id) || (p.code && p.code === emp.code) || p.name === emp.name
    );
    if (isAlready) {
      setParticipants((prev) =>
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
      setParticipants((prev) => [...prev, newPart]);
    }
  };

  const handleAddCustomParticipant = () => {
    const trimmed = customParticipantName.trim();
    if (!trimmed) return;
    if (!participants.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setParticipants((prev) => [
        ...prev,
        {
          id: 'custom_' + Date.now(),
          name: trimmed,
          role: 'Khách / Bạn bè',
        },
      ]);
    }
    setCustomParticipantName('');
  };

  const handleRemoveParticipant = (idOrName: string) => {
    setParticipants((prev) =>
      prev.filter((p) => (p.id || p.name) !== idOrName && p.name !== idOrName)
    );
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
      participants: participants.length > 0 ? participants : undefined,
      activity: activity.trim() || undefined,
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

            {/* 3. ĐỐI TƯỢNG NHÂN VIÊN & ĐI CÙNG AI (NHẬT KÝ) */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs transition-all hover:border-border hover:shadow-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    3. Đối tượng nhân viên & Đi cùng ai (Nhật ký)
                  </h4>
                  {participants.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                      {participants.length} người
                    </span>
                  )}
                </div>

                {/* Diary template button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!category) setCategory('Nhật ký & Hoạt động');
                    if (!activity) setActivity('Đi cà phê & Trò chuyện');
                    if (!title) setTitle(`Nhật ký ngày ${noteDate || new Date().toLocaleDateString('vi-VN')}`);
                    if (!content) {
                      const names = participants.map((p) => p.name).join(', ') || 'Bạn bè / Đồng nghiệp';
                      setContent(`## 📖 Nhật ký Hoạt động\n- **Thời gian:** ${noteTime || '09:00'}, ngày ${noteDate || new Date().toLocaleDateString('vi-VN')}\n- **Địa điểm:** ${location || 'Tại quán cà phê / Ngoài trời'}\n- **Đi cùng:** ${names}\n\n### 🌟 Hôm nay làm gì & Có gì vui:\n1. Gặp mặt trò chuyện và chia sẻ câu chuyện cùng mọi người.\n2. Cùng nhau thưởng thức đồ uống và thư giãn.\n3. Những kỷ niệm và khoảnh khắc đáng nhớ trong ngày.\n\n> [!NOTE]\n> Hãy ghi lại cảm xúc và trải nghiệm tuyệt vời cùng bạn bè!`);
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
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />

                {/* Activity suggestion chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-muted-foreground mr-1">Gợi ý nhanh:</span>
                  {[
                    '☕ Đi uống cà phê',
                    '🍜 Ăn uống liên hoan',
                    '⚽ Thể thao & Dã ngoại',
                    '💼 Họp nhóm & Trao đổi',
                    '🏢 Khảo sát / Gặp đối tác',
                    '🏖️ Du lịch / Nghỉ dưỡng',
                    '🎬 Đi xem phim / Giải trí',
                  ].map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setActivity(act)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        activity === act
                          ? 'bg-primary text-primary-foreground font-semibold border-primary'
                          : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Participants Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Danh sách nhân viên / người đi cùng ({participants.length})
                  </label>
                  {participants.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setParticipants([])}
                      className="text-[11px] text-rose-500 hover:underline"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>

                {participants.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-border bg-background/60 mb-3">
                    {participants.map((p, idx) => {
                      const avatar = getSafeAvatarUrl(p.avatarUrl, p.name);
                      return (
                        <div
                          key={p.id || p.code || idx}
                          className="inline-flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-foreground text-xs shadow-2xs group hover:border-primary/50 transition-all"
                        >
                          <img
                            src={avatar}
                            alt={p.name}
                            className="w-6 h-6 rounded-full object-cover border border-background shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-xs text-foreground truncate max-w-[140px] sm:max-w-[200px]">
                              {p.name}
                            </span>
                            {(p.role || p.department) && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[140px] sm:max-w-[200px]">
                                {p.role || p.department}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(p.id || p.name)}
                            className="p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
                            title="Bỏ chọn"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 text-center rounded-xl border border-dashed border-border bg-muted/20 text-xs text-muted-foreground mb-3">
                    Chưa chọn nhân sự nào đi cùng. Hãy chọn từ danh sách bên dưới hoặc nhập thêm người ngoài.
                  </div>
                )}

                {/* Add participant controls */}
                <div className="space-y-3">
                  {/* Search employee */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm nhân viên trong công ty để thêm..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Employee Picker List */}
                  <div className="rounded-xl border border-border bg-background overflow-hidden">
                    <div className="max-h-48 overflow-y-auto p-2 divide-y divide-border/40 space-y-1">
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp) => {
                          const isSelected = participants.some(
                            (p) =>
                              (p.id && p.id === emp.id) ||
                              (p.code && p.code === emp.code) ||
                              p.name === emp.name
                          );
                          const avatar = getSafeAvatarUrl(emp.avatarUrl, emp.name);

                          return (
                            <button
                              key={emp.id || emp.code}
                              type="button"
                              onClick={() => handleToggleEmployeeParticipant(emp)}
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
                          Không tìm thấy nhân viên phù hợp với từ khóa "{employeeSearch}".
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add External Friend / Guest */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Hoặc nhập tên người ngoài / bạn bè (Ví dụ: Anh Nam - Đối tác)..."
                      value={customParticipantName}
                      onChange={(e) => setCustomParticipantName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomParticipant();
                        }
                      }}
                      className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomParticipant}
                      disabled={!customParticipantName.trim()}
                      className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Thêm người ngoài
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. THỜI GIAN, VỊ TRÍ & ẢNH ĐÍNH KÈM */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs transition-all hover:border-border hover:shadow-md space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Calendar className="w-4 h-4 text-primary" />
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
                        disabled={isUploadingCover}
                        className="px-3 py-1.5 rounded-lg bg-white/90 text-foreground text-xs font-medium hover:bg-white flex items-center gap-1.5 shadow-md disabled:opacity-60"
                      >
                        {isUploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {isUploadingCover ? 'Đang tải lên...' : 'Thay ảnh'}
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
                      disabled={isUploadingCover}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-primary/5 text-xs text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isUploadingCover ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <ImageIcon className="w-4 h-4" />}
                      {isUploadingCover ? 'Đang tải lên Catbox...' : 'Tải ảnh bìa từ máy'}
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
                    disabled={isUploadingGallery}
                    className="px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all flex items-center gap-1 disabled:opacity-60"
                  >
                    {isUploadingGallery ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    {isUploadingGallery ? 'Đang tải lên Catbox...' : 'Tải thêm ảnh'}
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
