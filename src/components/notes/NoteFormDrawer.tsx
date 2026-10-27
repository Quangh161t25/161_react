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
  Clock,
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
  Loader2,
  Globe,
  ExternalLink,
  Smile,
  Map,
  Building2,
} from 'lucide-react';
import { catboxService } from '../../services/catboxService';
import { Note, NoteCategory, NoteStatus, NoteAttachment, NoteParticipant } from '../../types/note';
import { LocationPickerModal } from './LocationPickerModal';
import {
  NOTE_CATEGORIES,
  PRESET_TAGS,
  ALL_NOTE_ICONS,
  getNoteIconLabel,
} from '../../data/notes';
import { TimePickerInput } from '../common/TimePickerInput';
import { useAuth } from '../../context/AuthContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import { employeeService } from '../../services/employeeService';
import { Employee } from '../../types/employee';
import { generateId } from '../../utils/idGenerator';

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
  const [link, setLink] = useState('');
  const [content, setContent] = useState('');
  const [contentTab, setContentTab] = useState<'edit' | 'preview'>('edit');

  const [category, setCategory] = useState<NoteCategory | ''>('');
  const [status, setStatus] = useState<NoteStatus>('published');
  const [isPinned, setIsPinned] = useState(false);
  const [color, setColor] = useState('blue');
  const [icons, setIcons] = useState<string[]>([]);
  const [iconFilterGroup, setIconFilterGroup] = useState<'all' | 'mood' | 'weather' | 'activity'>('all');
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
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<any>(null);

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Participants & Diary Activity
  const [participants, setParticipants] = useState<NoteParticipant[]>([]);
  const [activity, setActivity] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [customParticipantName, setCustomParticipantName] = useState('');
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const participantInputRef = useRef<HTMLInputElement>(null);
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
    if (!q) return allEmployees.slice(0, 8);
    return allEmployees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        (emp.code && emp.code.toLowerCase().includes(q)) ||
        (emp.department && emp.department.toLowerCase().includes(q)) ||
        (emp.role && emp.role.toLowerCase().includes(q))
    ).slice(0, 15);
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

  const displayedIcons = useMemo(() => {
    if (iconFilterGroup === 'all') return ALL_NOTE_ICONS;
    return ALL_NOTE_ICONS.filter((item) => item.group === iconFilterGroup);
  }, [iconFilterGroup]);

  const handleToggleIcon = (emoji: string) => {
    setIcons((prev) =>
      prev.includes(emoji) ? prev.filter((e) => e !== emoji) : [...prev, emoji]
    );
  };

  const handleLocationInputChange = (val: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const q = val.trim();
    if (q.length < 2) {
      setLocationSuggestions([]);
      setIsSuggestionsOpen(false);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=vn&addressdetails=1&limit=5`,
          { headers: { 'Accept-Language': 'vi' } }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setLocationSuggestions(data);
            setIsSuggestionsOpen(data.length > 0);
          }
        }
      } catch (err) {
        console.warn('Location suggest error:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 400);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const prevIsOpenRef = useRef(false);
  const prevEditIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      return;
    }

    const currentEditId = initialData ? (initialData.id || initialData.code) : null;
    const justOpened = !prevIsOpenRef.current;
    const editTargetChanged = currentEditId !== prevEditIdRef.current;

    // Only initialize when drawer is freshly opened or editing note changed
    if (!justOpened && !editTargetChanged) {
      return;
    }

    prevIsOpenRef.current = true;
    prevEditIdRef.current = currentEditId;

    if (initialData) {
      setTitle(initialData.title || '');
      setSummary(initialData.summary || '');
      setLink(initialData.link || '');
      setContent(initialData.content || '');
      setCategory(initialData.category || '');
      setStatus(initialData.status || 'published');
      setIsPinned(!!initialData.isPinned);
      setColor(initialData.color || 'blue');
      setIcons(initialData.icons || []);
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
      setLink('');
      setContent('');
      setCategory('');
      setStatus('published');
      setIsPinned(false);
      setColor('blue');
      setIcons([]);
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
            id: generateId('att'),
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
                id: generateId('att'),
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
        id: generateId('att'),
        name: `Anh_dan_${generateId('img').replace('img_', '')}.png`,
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

  const handleAddCustomParticipant = (customName?: string) => {
    const trimmed = (customName !== undefined ? customName : customParticipantName).trim();
    if (!trimmed) return;
    if (!participants.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setParticipants((prev) => [
        ...prev,
        {
          id: generateId('custom'),
          name: trimmed,
          role: 'Khách / Đối tượng ngoài',
        },
      ]);
    }
    setCustomParticipantName('');
    setEmployeeSearch('');
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
      link: link.trim() || undefined,
      summary: summary.trim() || undefined,
      content: content.trim() || '',
      category: (category || 'Ghi chú chung') as NoteCategory,
      status,
      isPinned,
      color,
      icons: icons.length > 0 ? icons : undefined,
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
            {/* TIÊU ĐỀ BÀI VIẾT / GHI CHÚ */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs transition-all hover:border-border hover:shadow-md space-y-3">
              <label className="block text-xs font-semibold text-foreground">
                Tiêu đề bài viết / Ghi chú <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Biên bản Cuộc họp Chiến lược Q4/2026, Đi ăn cưới, Mua sắm..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full rounded-xl border ${
                  formErrors.title ? 'border-destructive' : 'border-border'
                } bg-background px-3.5 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all`}
                autoFocus
              />
              {formErrors.title && (
                <p className="text-xs text-destructive mt-1">{formErrors.title}</p>
              )}
            </div>

            {/* 1. NỘI DUNG & THỜI GIAN, ĐƯỜNG DẪN LIÊN KẾT */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs transition-all hover:border-border hover:shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Nội dung ghi chú & Thời gian
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
                      <button
                        type="button"
                        title="Chèn liên kết dạng >link : (click mở trực tiếp khi xem)"
                        onClick={() => insertContentMarkup('>link : https://', '', 'duong-dan-trang-web.com')}
                        className="p-1.5 rounded-lg hover:bg-muted text-sky-600 dark:text-sky-400 transition-colors text-xs flex items-center gap-1 font-semibold"
                      >
                        <Globe className="w-3.5 h-3.5" /> &gt;link :
                      </button>
                    </div>

                    {/* Textarea */}
                    <textarea
                      ref={contentTextareaRef}
                      rows={12}
                      placeholder="Soạn thảo nội dung chi tiết bài viết, biên bản hoặc ghi nhớ... Gõ >link : https://... để tạo liên kết có thể bấm mở trực tiếp!"
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

              {/* Đường dẫn liên kết (Link) bên dưới nội dung, Thời gian (tg) bên cạnh link luôn, Ngày thực hiện */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-3 border-t border-border/50">
                {/* Đường dẫn liên kết (Link / URL): 6 cols on lg */}
                <div className="lg:col-span-6">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    <span>Đường dẫn liên kết (Link / URL)</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      placeholder="Dán link web, shopee, video, tài liệu..."
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-[38px]"
                    />
                    {link.trim() && (
                      <a
                        href={link.startsWith('http') ? link : `https://${link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-[38px] px-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold inline-flex items-center gap-1 border border-primary/30 shrink-0 transition-colors"
                        title="Mở liên kết"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Giờ thực hiện (tg bên cạnh link luôn): 2 cols on lg */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>Giờ (tg)</span>
                  </label>
                  <TimePickerInput
                    value={noteTime}
                    onChange={(val) => setNoteTime(val)}
                    placeholder="00:00"
                  />
                </div>

                {/* Ngày thực hiện: 4 cols on lg */}
                <div className="lg:col-span-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>Ngày thực hiện</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                          setNoteDate(todayStr);
                        }}
                        className="px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium text-[10px]"
                      >
                        Hôm nay
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const yest = new Date();
                          yest.setDate(yest.getDate() - 1);
                          const yestStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;
                          setNoteDate(yestStr);
                        }}
                        className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors font-medium text-[10px]"
                      >
                        Hôm qua
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={noteDate}
                      onChange={(e) => setNoteDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-[38px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. ĐỐI TƯỢNG LIÊN QUAN & THẺ PHÂN LOẠI (TAGS) CẠNH NHAU */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CỘT 1: ĐỐI TƯỢNG LIÊN QUAN */}
              <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs transition-all hover:border-border hover:shadow-md space-y-2.5 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                        Đối tượng liên quan ({participants.length})
                      </h4>
                    </div>
                    {participants.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setParticipants([])}
                        className="text-[11px] text-rose-500 hover:underline font-medium"
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </div>

                  {/* 1 Dòng duy nhất: Chips + Input + Dropdown gợi ý */}
                  <div className="relative">
                    <div
                      onClick={() => participantInputRef.current?.focus()}
                      className="w-full min-h-[42px] rounded-xl border border-border bg-background px-2.5 py-1.5 flex flex-wrap items-center gap-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all cursor-text"
                    >
                      {/* Chips đối tượng đã chọn */}
                      {participants.map((p, idx) => {
                        const avatar = getSafeAvatarUrl(p.avatarUrl, p.name);
                        return (
                          <span
                            key={p.id || p.code || idx}
                            className="inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-xs text-foreground shrink-0 group hover:border-primary/50 transition-all"
                          >
                            <img
                              src={avatar}
                              alt={p.name}
                              className="w-5 h-5 rounded-full object-cover border border-background shrink-0"
                            />
                            <span className="font-semibold text-xs truncate max-w-[120px]">
                              {p.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveParticipant(p.id || p.name);
                              }}
                              className="p-0.5 rounded-full text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                              title="Bỏ chọn"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}

                      {/* Input nhập tên hoặc tìm nhân viên */}
                      <div className="flex-1 min-w-[140px] flex items-center">
                        <input
                          ref={participantInputRef}
                          type="text"
                          placeholder={
                            participants.length === 0
                              ? 'Gõ tên đối tượng hoặc chọn nhân viên...'
                              : 'Thêm tiếp...'
                          }
                          value={employeeSearch}
                          onChange={(e) => {
                            setEmployeeSearch(e.target.value);
                            setIsEmployeeDropdownOpen(true);
                          }}
                          onFocus={() => setIsEmployeeDropdownOpen(true)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (employeeSearch.trim()) {
                                const topMatch = filteredEmployees[0];
                                if (
                                  topMatch &&
                                  topMatch.name.toLowerCase() === employeeSearch.trim().toLowerCase()
                                ) {
                                  handleToggleEmployeeParticipant(topMatch);
                                  setEmployeeSearch('');
                                } else {
                                  handleAddCustomParticipant(employeeSearch.trim());
                                }
                                setIsEmployeeDropdownOpen(false);
                              }
                            } else if (e.key === 'Backspace' && !employeeSearch && participants.length > 0) {
                              const last = participants[participants.length - 1];
                              handleRemoveParticipant(last.id || last.name);
                            } else if (e.key === 'Escape') {
                              setIsEmployeeDropdownOpen(false);
                            }
                          }}
                          className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none py-1"
                        />
                      </div>
                    </div>

                    {/* Dropdown Gợi ý tự động từ danh sách nhân viên */}
                    {isEmployeeDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsEmployeeDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border bg-card shadow-xl max-h-56 overflow-y-auto p-1 divide-y divide-border/40 backdrop-blur-sm">
                          {/* Thêm nhanh đối tượng ngoài nếu đang gõ */}
                          {employeeSearch.trim() && (
                            <button
                              type="button"
                              onClick={() => {
                                handleAddCustomParticipant(employeeSearch.trim());
                                setIsEmployeeDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-2 p-2 rounded-lg text-left hover:bg-primary/10 text-primary transition-all text-xs font-semibold"
                            >
                              <UserPlus className="w-4 h-4 shrink-0 text-primary" />
                              <span className="truncate">
                                + Thêm đối tượng ngoài: <strong>"{employeeSearch.trim()}"</strong>
                              </span>
                            </button>
                          )}

                          {/* Danh sách gợi ý nhân viên */}
                          <div className="p-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Gợi ý từ danh sách nhân viên ({filteredEmployees.length})
                          </div>
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
                                  onClick={() => {
                                    handleToggleEmployeeParticipant(emp);
                                    setEmployeeSearch('');
                                    setIsEmployeeDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                                    isSelected
                                      ? 'bg-primary/10 border border-primary/20 text-primary'
                                      : 'hover:bg-muted/60 text-foreground'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <img
                                      src={avatar}
                                      alt={emp.name}
                                      className="w-6 h-6 rounded-full object-cover border border-border shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <span className="text-xs font-semibold truncate block">
                                        {emp.name} {emp.code ? `(${emp.code})` : ''}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground truncate block">
                                        {emp.role || emp.department || 'Nhân viên'}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-[11px] font-semibold shrink-0">
                                    {isSelected ? '✓ Đã chọn' : '+ Chọn'}
                                  </span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="p-3 text-center text-xs text-muted-foreground">
                              Không tìm thấy nhân viên. Nhấn Enter để thêm <strong>"{employeeSearch}"</strong> như đối tượng ngoài.
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* CỘT 2: THẺ PHÂN LOẠI (TAGS CẠNH ĐỐI TƯỢNG) */}
              <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs transition-all hover:border-border hover:shadow-md space-y-2.5 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                        Thẻ phân loại ({tags.length})
                      </h4>
                    </div>
                    {tags.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTags([])}
                        className="text-[11px] text-rose-500 hover:underline font-medium"
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </div>

                  {/* Tags Input Container */}
                  <div className="w-full min-h-[42px] rounded-xl border border-border bg-background px-2.5 py-1.5 flex flex-wrap items-center gap-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                    {tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/20 shrink-0"
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
                      className="flex-1 min-w-[120px] bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none py-1"
                    />
                  </div>
                </div>

                {/* Preset Tag Badges */}
                {availableTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground mr-1">Gợi ý:</span>
                    {availableTags.slice(0, 8).map((pt: string) => {
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
                )}
              </div>
            </div>

            {/* 3. PHÂN LOẠI & VỊ TRÍ */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs transition-all hover:border-border hover:shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Phân loại & Vị trí
                  </h4>
                </div>

                {/* Biểu tượng đã chọn tóm tắt */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">Biểu tượng:</span>
                  {icons.length > 0 ? (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/30 text-xs font-semibold text-primary">
                      <span className="flex items-center gap-0.5">
                        {icons.slice(0, 4).map((ic, i) => (
                          <span key={i} className="text-sm leading-none">{ic}</span>
                        ))}
                      </span>
                      {icons.length > 4 && <span className="text-[10px]">+{icons.length - 4}</span>}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">(chưa chọn)</span>
                  )}
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
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-[38px]"
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
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-[38px]"
                  >
                    <option value="published">Xuất bản</option>
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
                      className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-[38px]"
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

              {/* Biểu tượng / Cảm xúc & Thời tiết (Multi-select) */}
              <div className="space-y-2.5 pt-2 border-t border-border/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Smile className="w-4 h-4 text-primary shrink-0" />
                    <label className="text-xs font-semibold text-foreground">
                      Biểu tượng / Cảm xúc & Thời tiết
                    </label>
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">
                      (Bấm chọn nhiều icon)
                    </span>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-0.5 p-0.5 bg-muted/60 rounded-lg border border-border/50 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setIconFilterGroup('all')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                        iconFilterGroup === 'all'
                          ? 'bg-background text-foreground shadow-2xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => setIconFilterGroup('mood')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                        iconFilterGroup === 'mood'
                          ? 'bg-background text-foreground shadow-2xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      😊 Cảm xúc
                    </button>
                    <button
                      type="button"
                      onClick={() => setIconFilterGroup('weather')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                        iconFilterGroup === 'weather'
                          ? 'bg-background text-foreground shadow-2xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      ☀️ Thời tiết
                    </button>
                    <button
                      type="button"
                      onClick={() => setIconFilterGroup('activity')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                        iconFilterGroup === 'activity'
                          ? 'bg-background text-foreground shadow-2xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      ☕ Bối cảnh
                    </button>
                  </div>
                </div>

                {/* Selected icons row */}
                {icons.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in duration-200">
                    <span className="text-[11px] font-semibold text-primary mr-1">Đã chọn ({icons.length}):</span>
                    {icons.map((ic) => (
                      <span
                        key={ic}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-background border border-primary/30 text-xs shadow-2xs font-medium text-foreground"
                      >
                        <span className="text-sm">{ic}</span>
                        <span className="text-[11px] text-muted-foreground">{getNoteIconLabel(ic)}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleIcon(ic)}
                          className="text-muted-foreground hover:text-rose-500 transition-colors ml-0.5 p-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          title="Bỏ chọn icon này"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIcons([])}
                      className="text-[11px] text-muted-foreground hover:text-rose-600 transition-colors ml-auto underline cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                )}

                {/* Available icons to pick */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-muted/20 border border-border/60 max-h-[140px] overflow-y-auto">
                  {displayedIcons.map((item) => {
                    const isSelected = icons.includes(item.emoji);
                    return (
                      <button
                        key={item.emoji}
                        type="button"
                        onClick={() => handleToggleIcon(item.emoji)}
                        className={`group flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-primary-foreground font-semibold shadow-xs scale-105 ring-1 ring-primary'
                            : 'bg-background hover:bg-muted text-foreground border border-border/80 hover:border-primary/40'
                        }`}
                        title={`${item.name} (${item.emoji})`}
                      >
                        <span className="text-base group-hover:scale-120 transition-transform">{item.emoji}</span>
                        <span className={`text-[11px] ${isSelected ? 'text-primary-foreground font-semibold' : 'text-muted-foreground'}`}>
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location with GPS */}
              <div className="space-y-2.5 pt-2 border-t border-border/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <label className="text-xs font-semibold text-foreground">
                      Vị trí / Địa điểm cụ thể (GPS)
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-xs text-primary font-semibold border border-primary/30 transition-all cursor-pointer shadow-2xs"
                      title="Mở bản đồ để nhấp chọn điểm hoặc tìm kiếm địa điểm cụ thể"
                    >
                      <Map className="w-3.5 h-3.5" />
                      <span>Chọn trên bản đồ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGetCurrentLocation(false)}
                      disabled={isLocating}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-xs text-foreground font-medium border border-border transition-all cursor-pointer disabled:opacity-50"
                      title="Lấy tọa độ GPS thiết bị hiện tại của bạn"
                    >
                      <LocateFixed className={`w-3.5 h-3.5 text-rose-500 ${isLocating ? 'animate-spin' : ''}`} />
                      <span>{isLocating ? 'Đang lấy GPS...' : 'GPS hiện tại'}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets row */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
                  <span className="text-[11px] text-muted-foreground shrink-0 font-medium">Gợi ý nhanh:</span>
                  {[
                    { label: 'Văn phòng Hà Nội', coords: '21.028511° N, 105.854167° E' },
                    { label: 'Văn phòng TP.HCM', coords: '10.776889° N, 106.700806° E' },
                    { label: 'Chi nhánh Đà Nẵng', coords: '16.067780° N, 108.220830° E' },
                    { label: 'Gặp gỡ khách hàng', coords: coordinates },
                    { label: 'Đi công tác', coords: coordinates },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setLocation(p.label);
                        if (p.coords) setCoordinates(p.coords);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/80 hover:bg-secondary text-secondary-foreground text-[11px] font-medium shrink-0 transition-colors border border-border/50 cursor-pointer"
                    >
                      <Building2 className="w-2.5 h-2.5 text-primary" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>

                {/* Location Input & Coordinates with Autocomplete */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                  <div className="relative" ref={suggestionsRef}>
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Gõ tìm kiếm tên địa điểm / địa chỉ cụ thể..."
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        handleLocationInputChange(e.target.value);
                      }}
                      onFocus={() => {
                        if (locationSuggestions.length > 0) setIsSuggestionsOpen(true);
                      }}
                      className="w-full rounded-xl border border-border bg-background pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {isSearchingLocation && (
                      <Loader2 className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
                    )}

                    {/* Suggestions dropdown */}
                    {isSuggestionsOpen && locationSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-card border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto p-1 space-y-0.5">
                        {locationSuggestions.map((sug, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setLocation(sug.display_name);
                              const lat = parseFloat(sug.lat);
                              const lng = parseFloat(sug.lon);
                              if (!isNaN(lat) && !isNaN(lng)) {
                                setCoordinates(`${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E`);
                              }
                              setIsSuggestionsOpen(false);
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-muted text-xs text-foreground flex items-start gap-2 transition-colors cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed">{sug.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Tọa độ GPS (Ví dụ: 21.028300° N, 105.854000° E)"
                    value={coordinates}
                    onChange={(e) => setCoordinates(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 5. HÌNH ẢNH ĐÍNH KÈM (HÌNH ẢNH CUỐI CÙNG) */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs transition-all hover:border-border hover:shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Hình ảnh đính kèm ({images.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isUploadingGallery}
                  className="px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all flex items-center gap-1 disabled:opacity-60"
                >
                  {isUploadingGallery ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  <span>Tải ảnh lên</span>
                </button>
              </div>

              {/* Ctrl+V Paste Helper Notice */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-primary/25 bg-primary/5 text-primary text-xs">
                <ImageIcon className="w-4 h-4 shrink-0 text-primary" />
                <span className="leading-snug">
                  <strong>Dán ảnh nhanh:</strong> Bạn có thể chụp ảnh màn hình rồi bấm <strong>Ctrl + V</strong> bất kỳ lúc nào để đính kèm ảnh ngay lập tức!
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
                    Chưa có ảnh đính kèm. Bấm nút <strong>"Tải ảnh lên"</strong> hoặc nhấn <strong>Ctrl + V</strong> để dán ảnh.
                  </p>
                </div>
              )}

              {/* Cover Banner Preview & Input */}
              <div className="pt-2 border-t border-border/50">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Ảnh bìa bài viết (Cover Banner)
                </label>
                {coverUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border h-32 sm:h-40 group">
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
                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isUploadingCover}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-primary/5 text-xs text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 shrink-0"
                    >
                      {isUploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <ImageIcon className="w-3.5 h-3.5" />}
                      <span>Tải ảnh bìa</span>
                    </button>
                    <input
                      type="url"
                      placeholder="Hoặc dán URL hình ảnh làm bìa..."
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
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

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        initialLocation={location}
        initialCoordinates={coordinates}
        onSelectLocation={(newLocation, newCoordinates) => {
          setLocation(newLocation);
          setCoordinates(newCoordinates);
        }}
      />
    </>
  );
};
