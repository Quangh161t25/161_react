import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  KeyRound,
  Search,
  Plus,
  Layers,
  Lock,
  Unlock,
  ShieldCheck,
  Sparkles,
  Star,
  Copy,
  Check,
  LayoutGrid,
  Eye,
  EyeOff,
  SquarePen,
  Trash2,
  Building2,
  Mail,
  Globe,
  Share2,
  Server,
  Wallet,
  Cpu,
  ArrowLeft,
  ChartColumn,
  Printer,
  Download,
  ChevronDown,
  CircleCheck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Tag,
  RotateCcw,
} from 'lucide-react';
import {
  PasswordItem,
  PasswordCategory,
  PasswordVaultSettings,
} from '../../types/password';
import { PASSWORD_CATEGORIES } from '../../data/passwords';
import { passwordService } from '../../services/passwordService';
import { PasswordFormDrawer } from './PasswordFormDrawer';
import { PasswordDetailDrawer } from './PasswordDetailDrawer';
import { PasswordGeneratorModal } from './PasswordGeneratorModal';
import { ExtensionSyncModal } from './ExtensionSyncModal';
import { MasterPinModal } from './MasterPinModal';
import { PasswordStatsTab } from './PasswordStatsTab';
import { useAutoSync } from '../../hooks/useAutoSync';
import { RealtimeSyncBadge } from '../common/RealtimeSyncBadge';
import { useSettings } from '../../context/SettingsContext';
import { TablePagination } from '../common/TablePagination';
import {
  ColumnCustomizerPopover,
  ColumnItem,
  TableDensity,
} from '../common/ColumnCustomizerPopover';

export const DEFAULT_PASSWORD_COLUMNS: ColumnItem[] = [
  { id: 'favorite', label: '★', visible: true, width: 44, align: 'center', locked: true },
  { id: 'code', label: 'Mã tài khoản', visible: true, width: 100, align: 'center' },
  { id: 'title', label: 'Tên dịch vụ / URL', visible: true, width: 220, align: 'left', wrap: 'truncate' },
  { id: 'username', label: 'Tên đăng nhập / Email', visible: true, width: 190, align: 'left', wrap: 'truncate' },
  { id: 'password', label: 'Mật khẩu', visible: true, width: 170, align: 'left' },
  { id: 'category', label: 'Danh mục', visible: true, width: 140, align: 'left' },
  { id: 'securityScore', label: 'Độ mạnh', visible: true, width: 90, align: 'center' },
  { id: 'pinOr2FA', label: '2FA / PIN', visible: true, width: 90, align: 'center' },
  { id: 'tags', label: 'Thẻ phân loại', visible: false, width: 140, align: 'left' },
  { id: 'note', label: 'Ghi chú', visible: false, width: 180, align: 'left', wrap: 'wrap' },
  { id: 'lastChangedDate', label: 'Ngày đổi MK', visible: false, width: 110, align: 'center' },
  { id: 'createdAt', label: 'Ngày tạo', visible: false, width: 110, align: 'center' },
  { id: 'updatedAt', label: 'Cập nhật', visible: false, width: 110, align: 'center' },
];

interface PasswordPageProps {
  onBack?: () => void;
}

export const PasswordPage: React.FC<PasswordPageProps> = ({ onBack }) => {
  // Top Tab: 'list' (Danh sách) | 'stats' (Thống kê)
  const [activeTopTab, setActiveTopTab] = useState<'list' | 'stats'>('list');

  // Data
  const [passwords, setPasswords] = useState<PasswordItem[]>(() =>
    passwordService.getInitialPasswords()
  );
  const [vaultSettings, setVaultSettings] = useState<PasswordVaultSettings>(() =>
    passwordService.getVaultSettings()
  );

  // Vault Lock State
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const s = passwordService.getVaultSettings();
    return !!s.isMasterPinEnabled;
  });

  // UI States
  const [selectedCategory, setSelectedCategory] = useState<PasswordCategory>('all');
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [selectedStrength, setSelectedStrength] = useState<'all' | 'strong' | 'weak'>('all');
  const [isStrengthDropdownOpen, setIsStrengthDropdownOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // All unique tags collected from all passwords
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    passwords.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          const trimmed = t.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [passwords]);

  // User global settings
  const { settings } = useSettings();

  // Table selection & pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(settings.rowsPerPage || 50);

  useEffect(() => {
    if (settings.rowsPerPage) {
      setItemsPerPage(settings.rowsPerPage);
      setCurrentPage(1);
    }
  }, [settings.rowsPerPage]);

  // Table Density & Dynamic Columns
  const [tableDensity, setTableDensity] = useState<TableDensity>(() => {
    try {
      const saved = localStorage.getItem('erp_password_density');
      if (saved === 'compact' || saved === 'normal' || saved === 'relaxed') return saved;
    } catch {}
    return 'normal';
  });

  const [tableColumns, setTableColumns] = useState<ColumnItem[]>(() => {
    try {
      const saved = localStorage.getItem('erp_password_columns');
      if (saved) {
        const parsed: ColumnItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map(parsed.map((c) => [c.id, c]));
          const merged = parsed
            .map((p) => {
              const def = DEFAULT_PASSWORD_COLUMNS.find((d) => d.id === p.id);
              if (!def) return null;
              return { ...def, ...p };
            })
            .filter(Boolean) as ColumnItem[];
          DEFAULT_PASSWORD_COLUMNS.forEach((def) => {
            if (!map.has(def.id)) merged.push(def);
          });
          return merged;
        }
      }
    } catch {}
    return DEFAULT_PASSWORD_COLUMNS;
  });

  const handleSaveColumns = (newCols: ColumnItem[]) => {
    setTableColumns(newCols);
    try {
      localStorage.setItem('erp_password_columns', JSON.stringify(newCols));
    } catch {}
  };

  const handleResetColumns = () => {
    setTableColumns(DEFAULT_PASSWORD_COLUMNS);
    try {
      localStorage.removeItem('erp_password_columns');
    } catch {}
  };

  const handleSaveDensity = (d: TableDensity) => {
    setTableDensity(d);
    try {
      localStorage.setItem('erp_password_density', d);
    } catch {}
  };

  // Interactive Column Resizing
  const resizingRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);

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
        const nextWidth = Math.max(40, Math.min(800, resizingRef.current.startWidth + delta));
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
            localStorage.setItem('erp_password_columns', JSON.stringify(current));
          } catch {}
          return current;
        });
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [tableColumns]
  );

  // Sorting
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSortColumn = (colId: string) => {
    if (colId === 'favorite') {
      if (sortField === 'favorite') {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField('favorite');
        setSortDirection('desc');
      }
      return;
    }
    if (sortField === colId) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(colId);
      setSortDirection(colId === 'createdAt' || colId === 'updatedAt' || colId === 'securityScore' ? 'desc' : 'asc');
    }
  };

  // Sync state & Smart Realtime Auto-Sync Hook (25s interval, focus refresh, instant badge)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { isSyncing, lastSyncTime, triggerManualSync } = useAutoSync<PasswordItem[]>({
    syncFn: () => passwordService.fetchFromSheet(),
    onDataReceived: (live) => {
      if (Array.isArray(live)) {
        setPasswords(live);
      }
    },
    intervalMs: 25000,
  });

  // Modals & Drawers
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [pinModalState, setPinModalState] = useState<{
    isOpen: boolean;
    mode: 'unlock' | 'setup' | 'change';
  }>({
    isOpen: false,
    mode: 'unlock',
  });

  const [selectedItemForDetail, setSelectedItemForDetail] = useState<PasswordItem | null>(null);
  const [formDrawerState, setFormDrawerState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    passwordItem?: PasswordItem | null;
  }>({
    isOpen: false,
    mode: 'create',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopy = (text: string, label: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id + '_' + label);
    showToast(`Đã sao chép ${label}!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleReveal = (id: string) => {
    if (isLocked) {
      setPinModalState({ isOpen: true, mode: 'unlock' });
      return;
    }
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleFavorite = (id: string) => {
    const updated = passwords.map((p) =>
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    );
    setPasswords(updated);
    passwordService.saveAllToSheet(updated);
    if (selectedItemForDetail?.id === id) {
      setSelectedItemForDetail((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  const handleDelete = (id: string) => {
    const updated = passwords.filter((p) => p.id !== id);
    setPasswords(updated);
    passwordService.saveAllToSheet(updated);
    if (selectedItemForDetail?.id === id) {
      setSelectedItemForDetail(null);
    }
    showToast('Đã xóa tài khoản.');
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} tài khoản đã chọn?`)) return;
    const set = new Set(selectedIds);
    const updated = passwords.filter((p) => !set.has(p.id));
    setPasswords(updated);
    passwordService.saveAllToSheet(updated);
    setSelectedIds([]);
    showToast(`Đã xóa ${selectedIds.length} tài khoản.`);
  };

  const handleSaveForm = (payload: PasswordItem) => {
    let updated: PasswordItem[];
    if (formDrawerState.mode === 'edit') {
      updated = passwords.map((p) => (p.id === payload.id ? payload : p));
    } else {
      updated = [payload, ...passwords];
    }
    setPasswords(updated);
    passwordService.saveAllToSheet(updated);
    setFormDrawerState({ isOpen: false, mode: 'create' });
    showToast(`Đã lưu tài khoản "${payload.title}"!`);
  };

  const handleManualSync = async () => {
    try {
      await triggerManualSync();
      showToast('Đã đồng bộ tài khoản từ Google Sheet!');
    } catch {
      showToast('Lỗi kết nối Google Sheet.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Mã', 'Tiêu đề', 'Tên đăng nhập', 'Mật khẩu', 'Website URL', 'Danh mục', 'Bảo mật 2FA', 'Ghi chú'];
    const rows = filteredPasswords.map((p) => [
      `"${p.code || ''}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.username.replace(/"/g, '""')}"`,
      `"${p.password.replace(/"/g, '""')}"`,
      `"${p.url || ''}"`,
      `"${p.category}"`,
      p.pinOr2FA ? `"${p.pinOr2FA.replace(/"/g, '""')}"` : 'Không',
      `"${(p.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `danh_sach_mat_khau_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV thành công!');
  };

  const getCategoryIcon = (cat: PasswordCategory) => {
    switch (cat) {
      case 'work': return <Building2 className="w-3.5 h-3.5" />;
      case 'email': return <Mail className="w-3.5 h-3.5" />;
      case 'social': return <Share2 className="w-3.5 h-3.5" />;
      case 'server': return <Server className="w-3.5 h-3.5" />;
      case 'finance': return <Wallet className="w-3.5 h-3.5" />;
      case 'software': return <Cpu className="w-3.5 h-3.5" />;
      default: return <Globe className="w-3.5 h-3.5" />;
    }
  };

  const filteredPasswords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return passwords.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (onlyFavorites && !item.isFavorite) return false;
      if (selectedStrength === 'strong' && (item.securityScore || 70) < 80) return false;
      if (selectedStrength === 'weak' && (item.securityScore || 70) >= 60) return false;
      if (
        selectedTag !== 'all' &&
        !(item.tags || []).some((t) => t.trim().toLowerCase() === selectedTag.toLowerCase())
      ) {
        return false;
      }

      if (q) {
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchUser = item.username.toLowerCase().includes(q);
        const matchUrl = (item.url || '').toLowerCase().includes(q);
        const matchNote = (item.note || '').toLowerCase().includes(q);
        const matchTags = (item.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchUser && !matchUrl && !matchNote && !matchTags) return false;
      }

      return true;
    });
  }, [passwords, selectedCategory, onlyFavorites, selectedStrength, selectedTag, searchQuery]);

  const sortedPasswords = useMemo(() => {
    const list = [...filteredPasswords];
    list.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortField) {
        case 'favorite':
          valA = a.isFavorite ? 1 : 0;
          valB = b.isFavorite ? 1 : 0;
          break;
        case 'code':
          valA = a.code || '';
          valB = b.code || '';
          break;
        case 'title':
          valA = a.title || '';
          valB = b.title || '';
          break;
        case 'username':
          valA = a.username || '';
          valB = b.username || '';
          break;
        case 'category':
          valA = a.category || '';
          valB = b.category || '';
          break;
        case 'securityScore':
          valA = a.securityScore || 0;
          valB = b.securityScore || 0;
          break;
        case 'pinOr2FA':
          valA = a.pinOr2FA || '';
          valB = b.pinOr2FA || '';
          break;
        case 'createdAt':
          valA = a.createdAt || '';
          valB = b.createdAt || '';
          break;
        case 'updatedAt':
          valA = a.updatedAt || '';
          valB = b.updatedAt || '';
          break;
        case 'lastChangedDate':
          valA = a.lastChangedDate || '';
          valB = b.lastChangedDate || '';
          break;
        default:
          return 0;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB), 'vi', { numeric: true })
        : String(valB).localeCompare(String(valA), 'vi', { numeric: true });
    });
    return list;
  }, [filteredPasswords, sortField, sortDirection]);

  // Pagination
  const paginatedPasswords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedPasswords.slice(start, start + itemsPerPage);
  }, [sortedPasswords, currentPage, itemsPerPage]);

  const renderTableCell = (col: ColumnItem, item: PasswordItem, density: TableDensity) => {
    const isRevealed = revealedIds.has(item.id);
    const strength = item.securityScore || 70;
    const isWrap = col.wrap === 'wrap';
    const textWrapClass = isWrap ? 'whitespace-normal break-words leading-relaxed' : 'truncate';
    const colAlign = col.align || 'left';
    const alignClass = colAlign === 'center' ? 'text-center' : colAlign === 'right' ? 'text-right' : 'text-left';
    const justifyClass = colAlign === 'center' ? 'justify-center' : colAlign === 'right' ? 'justify-end' : 'justify-start';
    const padding = density === 'compact' ? 'py-1 px-2.5 text-xs' : density === 'relaxed' ? 'py-3 px-3.5 text-sm' : 'py-2 px-3 text-xs';

    switch (col.id) {
      case 'favorite':
        return (
          <div onClick={(e) => e.stopPropagation()} className="flex justify-center">
            <button
              type="button"
              onClick={() => handleToggleFavorite(item.id)}
              className="p-1 text-muted-foreground hover:text-amber-500 transition-colors"
              title={item.isFavorite ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  item.isFavorite ? 'fill-amber-500 text-amber-500' : 'opacity-40'
                }`}
              />
            </button>
          </div>
        );

      case 'code':
        return (
          <div className={`${padding} ${alignClass}`}>
            <span className="px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold bg-muted text-muted-foreground border border-border/70">
              {item.code || '—'}
            </span>
          </div>
        );

      case 'title':
        return (
          <div className={`${padding} ${alignClass}`}>
            <div className={`font-semibold text-foreground ${textWrapClass}`}>
              {item.title}
            </div>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 truncate max-w-full"
              >
                <Globe className="w-3 h-3 shrink-0" />
                <span className="truncate">{item.url.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </div>
        );

      case 'username':
        return (
          <div className={`${padding} ${alignClass}`}>
            <div className={`flex items-center gap-1.5 font-mono text-foreground ${justifyClass}`}>
              <span className={textWrapClass}>{item.username}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(item.username, 'Tên đăng nhập', item.id);
                }}
                className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted shrink-0"
                title="Sao chép tên đăng nhập"
              >
                {copiedId === item.id + '_Tên đăng nhập' ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        );

      case 'password':
        return (
          <div className={`${padding} ${alignClass}`}>
            <div className={`flex items-center gap-1.5 font-mono text-muted-foreground ${justifyClass}`}>
              <span className="select-none">{isRevealed ? item.password : '••••••••••••'}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleReveal(item.id);
                }}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                title={isRevealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(item.password, 'Mật khẩu', item.id);
                }}
                className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted shrink-0"
                title="Sao chép mật khẩu"
              >
                {copiedId === item.id + '_Mật khẩu' ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        );

      case 'category':
        return (
          <div className={`${padding} ${alignClass}`}>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border/60">
              {getCategoryIcon(item.category)}
              <span>{PASSWORD_CATEGORIES.find((c) => c.id === item.category)?.name || item.category}</span>
            </span>
          </div>
        );

      case 'securityScore':
        return (
          <div className={`${padding} text-center`}>
            <span
              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                strength >= 80
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : strength >= 60
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-rose-500/10 text-rose-600'
              }`}
            >
              {strength}%
            </span>
          </div>
        );

      case 'pinOr2FA':
        return (
          <div className={`${padding} text-center`}>
            {item.pinOr2FA ? (
              <span className="text-[11px] font-semibold text-emerald-600 inline-flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>2FA</span>
              </span>
            ) : (
              <span className="text-muted-foreground/40">—</span>
            )}
          </div>
        );

      case 'tags':
        return (
          <div className={`${padding} ${alignClass}`}>
            {item.tags && item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag, tIdx) => (
                  <button
                    key={tIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTag(tag);
                      setCurrentPage(1);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                      selectedTag === tag
                        ? 'bg-primary text-primary-foreground border-primary font-semibold'
                        : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                    }`}
                    title={`Lọc theo thẻ #${tag}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground/40">—</span>
            )}
          </div>
        );

      case 'note':
        return (
          <div className={`${padding} ${alignClass}`}>
            {item.note ? (
              <p className={`text-muted-foreground ${textWrapClass}`}>{item.note}</p>
            ) : (
              <span className="text-muted-foreground/40">—</span>
            )}
          </div>
        );

      case 'lastChangedDate':
        return (
          <div className={`${padding} text-center text-muted-foreground`}>
            {item.lastChangedDate || '—'}
          </div>
        );

      case 'createdAt':
        return (
          <div className={`${padding} text-center text-muted-foreground`}>
            {item.createdAt ? (item.createdAt.includes('T') ? item.createdAt.split('T')[0] : item.createdAt) : '—'}
          </div>
        );

      case 'updatedAt':
        return (
          <div className={`${padding} text-center text-muted-foreground`}>
            {item.updatedAt ? (item.updatedAt.includes('T') ? item.updatedAt.split('T')[0] : item.updatedAt) : '—'}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-foreground text-background text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CircleCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top View Tabs: Danh sách tài khoản / Thống kê bảo mật */}
      <div className="flex items-center gap-1.5 mb-1.5 px-0.5 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTopTab('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'list'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Danh sách mật khẩu</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTopTab('stats')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'stats'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <ChartColumn className="w-3.5 h-3.5" />
          <span>Thống kê bảo mật</span>
        </button>
      </div>

      {/* Main Card Container */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          {/* Header Bar Toolbar */}
          {activeTopTab === 'list' && (
            <div className="px-3 py-2 border-b border-border bg-card">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
                {/* Left: Back button, Search and Dropdown Filters */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                  {onBack && (
                    <button
                      type="button"
                      onClick={onBack}
                      className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                      title="Quay lại"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline">Quay lại</span>
                    </button>
                  )}

                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[160px] max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm tài khoản, website..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Filter: Category */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedCategory !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>
                        {selectedCategory === 'all'
                          ? 'Danh mục'
                          : PASSWORD_CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'Danh mục'}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>

                    {isCatDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsCatDropdownOpen(false)} />
                        <div className="absolute left-0 top-full mt-1.5 w-52 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5 max-h-60 overflow-y-auto">
                          {PASSWORD_CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(cat.id);
                                setIsCatDropdownOpen(false);
                                setCurrentPage(1);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                                selectedCategory === cat.id
                                  ? 'bg-primary text-primary-foreground font-semibold'
                                  : 'hover:bg-muted text-foreground'
                              }`}
                            >
                              <span>{cat.name}</span>
                              <span className="text-[10px] opacity-70">
                                {cat.id === 'all'
                                  ? passwords.length
                                  : passwords.filter((p) => p.category === cat.id).length}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter: Security Strength */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStrengthDropdownOpen(!isStrengthDropdownOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedStrength !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {selectedStrength === 'all'
                          ? 'Độ bảo mật'
                          : selectedStrength === 'strong'
                          ? 'Mạnh (≥80%)'
                          : 'Cần đổi (<60%)'}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>

                    {isStrengthDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsStrengthDropdownOpen(false)} />
                        <div className="absolute left-0 top-full mt-1.5 w-44 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => { setSelectedStrength('all'); setIsStrengthDropdownOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selectedStrength === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-foreground'}`}
                          >
                            Tất cả độ mạnh
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedStrength('strong'); setIsStrengthDropdownOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-emerald-600 ${selectedStrength === 'strong' ? 'bg-emerald-500/10 font-semibold' : 'hover:bg-muted'}`}
                          >
                            Độ mạnh cao (&ge;80%)
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedStrength('weak'); setIsStrengthDropdownOpen(false); setCurrentPage(1); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-rose-600 ${selectedStrength === 'weak' ? 'bg-rose-500/10 font-semibold' : 'hover:bg-muted'}`}
                          >
                            Cần đổi (&lt;60%)
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter: Tags (Thẻ phân loại) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedTag !== 'all'
                          ? 'bg-primary/10 border-primary text-primary font-semibold'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>
                        {selectedTag === 'all' ? 'Thẻ phân loại' : `#${selectedTag}`}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>

                    {isTagDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsTagDropdownOpen(false)} />
                        <div className="absolute left-0 top-full mt-1.5 w-48 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTag('all');
                              setIsTagDropdownOpen(false);
                              setCurrentPage(1);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                              selectedTag === 'all'
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            <span>Tất cả thẻ</span>
                            <span className="text-[10px] opacity-70">{passwords.length}</span>
                          </button>
                          {allUniqueTags.length === 0 ? (
                            <div className="px-2.5 py-2 text-[11px] text-muted-foreground text-center">
                              Chưa có thẻ nào
                            </div>
                          ) : (
                            allUniqueTags.map((tg) => {
                              const count = passwords.filter((p) =>
                                (p.tags || []).some((t) => t.trim().toLowerCase() === tg.toLowerCase())
                              ).length;
                              return (
                                <button
                                  key={tg}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTag(tg);
                                    setIsTagDropdownOpen(false);
                                    setCurrentPage(1);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                                    selectedTag === tg
                                      ? 'bg-primary text-primary-foreground font-semibold'
                                      : 'hover:bg-muted text-foreground'
                                  }`}
                                >
                                  <span className="truncate">#{tg}</span>
                                  <span className="text-[10px] opacity-70 shrink-0 ml-1">{count}</span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter: Favorites Toggle */}
                  <button
                    type="button"
                    onClick={() => { setOnlyFavorites(!onlyFavorites); setCurrentPage(1); }}
                    className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      onlyFavorites
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-500 text-amber-500' : ''}`} />
                    <span className="hidden sm:inline">Yêu thích</span>
                  </button>

                  {/* Clear all active filters */}
                  {(selectedCategory !== 'all' || selectedStrength !== 'all' || selectedTag !== 'all' || onlyFavorites || searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedStrength('all');
                        setSelectedTag('all');
                        setOnlyFavorites(false);
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      className="h-8 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                      title="Xóa tất cả bộ lọc"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span className="hidden xl:inline">Xóa lọc</span>
                    </button>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-auto">
                  {/* Bulk Delete */}
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      className="h-8 px-2.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 animate-in fade-in"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa ({selectedIds.length})</span>
                    </button>
                  )}

                  {/* Master PIN status / lock button */}
                  {vaultSettings.isMasterPinEnabled ? (
                    <button
                      type="button"
                      onClick={() => setIsLocked(!isLocked)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isLocked
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                      }`}
                      title={isLocked ? 'Kho mật khẩu đang khóa. Bấm để mở' : 'Kho đang mở. Bấm để khóa'}
                    >
                      {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span className="hidden xl:inline">{isLocked ? 'Đang khóa' : 'Đã mở'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPinModalState({ isOpen: true, mode: 'setup' })}
                      className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title="Cài đặt PIN bảo vệ"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">Đặt PIN</span>
                    </button>
                  )}

                  {/* Generator Modal */}
                  <button
                    type="button"
                    onClick={() => setIsGeneratorOpen(true)}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                    title="Trình tạo mật khẩu ngẫu nhiên an toàn"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">Tạo mật khẩu</span>
                  </button>

                  {/* Extension Sync Bridge */}
                  <button
                    type="button"
                    onClick={() => setIsSyncModalOpen(true)}
                    className="h-8 px-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    title="Kết nối với Chrome Extension"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Extension</span>
                  </button>

                  {/* Google Sheets Realtime Badge */}
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

                  {/* Grid / Table Toggle */}
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                    title={viewMode === 'table' ? 'Xem dạng lưới thẻ' : 'Xem dạng danh sách bảng'}
                    className={`h-8 w-8 flex items-center justify-center border rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>

                  {/* Column Customizer Popover (only in table view) */}
                  {viewMode === 'table' && (
                    <ColumnCustomizerPopover
                      columns={tableColumns}
                      onChangeColumns={handleSaveColumns}
                      density={tableDensity}
                      onChangeDensity={handleSaveDensity}
                      onReset={handleResetColumns}
                    />
                  )}

                  {/* Export CSV */}
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    title="Xuất file CSV"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Add Button */}
                  <button
                    type="button"
                    onClick={() => setFormDrawerState({ isOpen: true, mode: 'create' })}
                    className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List View Content: Table / Grid */}
          {activeTopTab === 'list' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {viewMode === 'table' ? (
                <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/70 text-[11px] font-bold text-muted-foreground uppercase tracking-wider sticky top-0 z-10">
                        {/* Checkbox All */}
                        <th className="w-10 px-3 py-2.5 text-center bg-muted/95 border-r border-border/60">
                          <input
                            type="checkbox"
                            checked={
                              paginatedPasswords.length > 0 &&
                              selectedIds.length === paginatedPasswords.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds(paginatedPasswords.map((p) => p.id));
                              } else {
                                setSelectedIds([]);
                              }
                            }}
                            className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                          />
                        </th>

                        {/* Dynamic Columns */}
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
                                className="relative px-3 py-2.5 bg-muted/95 select-none font-semibold text-xs border-r border-border/60"
                              >
                                <div
                                  onClick={() => handleSortColumn(col.id)}
                                  className={`flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors ${justifyClass}`}
                                >
                                  <span className="truncate">{col.label}</span>
                                  {sortField === col.id ? (
                                    sortDirection === 'asc' ? (
                                      <ArrowUp className="w-3 h-3 text-primary shrink-0" />
                                    ) : (
                                      <ArrowDown className="w-3 h-3 text-primary shrink-0" />
                                    )
                                  ) : (
                                    <ArrowUpDown className="w-2.5 h-2.5 opacity-30 shrink-0" />
                                  )}
                                </div>

                                {/* Column Resize Handle */}
                                <div
                                  onMouseDown={(e) => handleStartResize(col.id, e)}
                                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 transition-colors"
                                />
                              </th>
                            );
                          })}

                        {/* Actions Sticky Column */}
                        <th className="w-20 px-3 py-2.5 text-center bg-muted/95 sticky right-0 shadow-[-1px_0_0_0_hsl(var(--border))]">
                          Thao tác
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border/60">
                      {paginatedPasswords.length === 0 ? (
                        <tr>
                          <td
                            colSpan={tableColumns.filter((c) => c.visible).length + 2}
                            className="py-12 text-center text-xs text-muted-foreground"
                          >
                            <KeyRound className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            Không tìm thấy tài khoản nào phù hợp.
                          </td>
                        </tr>
                      ) : (
                        paginatedPasswords.map((item) => {
                          const isSelected = selectedIds.includes(item.id);

                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedItemForDetail(item)}
                              className={`hover:bg-muted/40 transition-colors cursor-pointer ${
                                isSelected ? 'bg-primary/5' : ''
                              }`}
                            >
                              {/* Checkbox */}
                              <td
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 text-center border-r border-border/60"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedIds((prev) =>
                                      prev.includes(item.id)
                                        ? prev.filter((x) => x !== item.id)
                                        : [...prev, item.id]
                                    );
                                  }}
                                  className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                                />
                              </td>

                              {/* Dynamic Columns */}
                              {tableColumns
                                .filter((c) => c.visible)
                                .map((col) => (
                                  <td
                                    key={col.id}
                                    style={{ width: col.width, minWidth: col.width, maxWidth: col.width }}
                                    className={`border-r border-border/60 overflow-hidden max-w-0 ${
                                      col.wrap === 'wrap' ? 'align-top' : 'align-middle'
                                    }`}
                                  >
                                    {renderTableCell(col, item, tableDensity)}
                                  </td>
                                ))}

                              {/* Actions Sticky Column */}
                              <td
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 py-2 text-center sticky right-0 bg-card shadow-[-1px_0_0_0_hsl(var(--border))]"
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFormDrawerState({ isOpen: true, mode: 'edit', passwordItem: item })
                                    }
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    title="Sửa"
                                  >
                                    <SquarePen className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Xoá tài khoản "${item.title}"?`)) {
                                        handleDelete(item.id);
                                      }
                                    }}
                                    className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 text-muted-foreground hover:text-rose-600 transition-colors"
                                    title="Xoá"
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
              ) : (
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {paginatedPasswords.map((item) => {
                      const isRevealed = revealedIds.has(item.id);
                      const strength = item.securityScore || 70;

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItemForDetail(item)}
                          className="group bg-card rounded-xl p-4 border border-border hover:border-primary/50 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                                  {getCategoryIcon(item.category)}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                    {item.title}
                                  </h4>
                                  <span className="text-[11px] text-muted-foreground block truncate font-mono">
                                    {item.username}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(item.id);
                                }}
                                className="p-1 text-muted-foreground hover:text-amber-500 shrink-0"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    item.isFavorite ? 'fill-amber-500 text-amber-500' : 'opacity-40'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Password pill */}
                            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60 text-xs font-mono">
                              <span className="truncate mr-2 text-foreground">
                                {isRevealed ? item.password : '••••••••••••'}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleReveal(item.id);
                                  }}
                                  className="p-1 text-muted-foreground hover:text-foreground"
                                >
                                  {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(item.password, 'Mật khẩu', item.id);
                                  }}
                                  className="p-1 text-muted-foreground hover:text-primary"
                                >
                                  {copiedId === item.id + '_Mật khẩu' ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Tags pill list */}
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {item.tags.map((t, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTag(t);
                                      setCurrentPage(1);
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                                      selectedTag === t
                                        ? 'bg-primary text-primary-foreground border-primary font-semibold'
                                        : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                                    }`}
                                    title={`Lọc theo thẻ #${t}`}
                                  >
                                    #{t}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pt-2 border-t border-border/50 flex items-center justify-between text-xs"
                          >
                            <span
                              className={`font-bold ${
                                strength >= 80 ? 'text-emerald-600' : strength >= 60 ? 'text-amber-600' : 'text-rose-600'
                              }`}
                            >
                              Độ mạnh: {strength}%
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setFormDrawerState({ isOpen: true, mode: 'edit', passwordItem: item })}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                              >
                                <SquarePen className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Xoá tài khoản "${item.title}"?`)) {
                                    handleDelete(item.id);
                                  }
                                }}
                                className="p-1 rounded hover:bg-rose-50 text-muted-foreground hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Table Pagination Footer */}
              <TablePagination
                currentPage={currentPage}
                totalItems={filteredPasswords.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemLabel="mật khẩu"
              />
            </div>
          )}

          {/* Stats Tab */}
          {activeTopTab === 'stats' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <PasswordStatsTab
                passwords={passwords}
                onSelectPassword={(p) => setSelectedItemForDetail(p)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Form Drawer */}
      {formDrawerState.isOpen && (
        <PasswordFormDrawer
          mode={formDrawerState.mode}
          passwordItem={formDrawerState.passwordItem}
          allPasswords={passwords}
          onClose={() => setFormDrawerState({ isOpen: false, mode: 'create' })}
          onSave={handleSaveForm}
        />
      )}

      {/* Detail Drawer */}
      {selectedItemForDetail && (
        <PasswordDetailDrawer
          item={selectedItemForDetail}
          currentIndex={passwords.findIndex((p) => p.id === selectedItemForDetail.id)}
          totalCount={passwords.length}
          onClose={() => setSelectedItemForDetail(null)}
          onPrev={() => {
            const idx = passwords.findIndex((p) => p.id === selectedItemForDetail.id);
            if (idx > 0) setSelectedItemForDetail(passwords[idx - 1]);
          }}
          onNext={() => {
            const idx = passwords.findIndex((p) => p.id === selectedItemForDetail.id);
            if (idx < passwords.length - 1) setSelectedItemForDetail(passwords[idx + 1]);
          }}
          onEdit={(item) => {
            setSelectedItemForDetail(null);
            setFormDrawerState({ isOpen: true, mode: 'edit', passwordItem: item });
          }}
          onDelete={(id) => {
            handleDelete(id);
            setSelectedItemForDetail(null);
          }}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* Generator Modal */}
      <PasswordGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
      />

      {/* Extension Sync Bridge Modal */}
      <ExtensionSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        passwords={passwords}
      />

      {/* Master PIN Modal */}
      <MasterPinModal
        isOpen={pinModalState.isOpen}
        mode={pinModalState.mode}
        vaultSettings={vaultSettings}
        onClose={() => setPinModalState({ isOpen: false, mode: 'unlock' })}
        onSuccess={(updated) => {
          setIsLocked(false);
          setVaultSettings(updated);
          showToast('Đã mở khóa kho mật khẩu!');
        }}
      />
    </div>
  );
};
