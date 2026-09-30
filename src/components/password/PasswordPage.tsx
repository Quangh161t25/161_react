import React, { useState, useMemo, useEffect } from 'react';
import {
  KeyRound,
  Search,
  Plus,
  RefreshCw,
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
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Table selection & pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Load from Sheet on mount
  useEffect(() => {
    let isMounted = true;
    passwordService
      .fetchFromSheet()
      .then((live) => {
        if (isMounted && live && live.length > 0) {
          setPasswords(live);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleSyncWithSheet = async () => {
    setIsSyncing(true);
    try {
      const live = await passwordService.fetchFromSheet();
      if (live && live.length > 0) {
        setPasswords(live);
        showToast('Đã đồng bộ tài khoản từ Google Sheet!');
      } else {
        showToast('Dữ liệu đã ở trạng thái mới nhất!');
      }
    } catch {
      showToast('Đã tải từ bộ nhớ cục bộ');
    } finally {
      setIsSyncing(false);
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
  }, [passwords, selectedCategory, onlyFavorites, selectedStrength, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredPasswords.length / itemsPerPage) || 1;
  const paginatedPasswords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPasswords.slice(start, start + itemsPerPage);
  }, [filteredPasswords, currentPage, itemsPerPage]);

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

                  {/* Sync Live Sheet */}
                  <button
                    type="button"
                    onClick={handleSyncWithSheet}
                    disabled={isSyncing}
                    title="Đồng bộ Google Sheets"
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
                        <th className="w-10 px-3 py-2.5 text-center bg-muted/95">
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
                        <th className="w-8 px-2 py-2.5 text-center bg-muted/95">★</th>
                        <th className="px-4 py-2.5 bg-muted/95">Tên tài khoản / Dịch vụ</th>
                        <th className="px-4 py-2.5 bg-muted/95">Tên đăng nhập / Email</th>
                        <th className="px-4 py-2.5 bg-muted/95">Mật khẩu</th>
                        <th className="px-4 py-2.5 bg-muted/95">Danh mục</th>
                        <th className="px-4 py-2.5 text-center bg-muted/95">Độ mạnh</th>
                        <th className="px-4 py-2.5 text-center bg-muted/95">2FA</th>
                        <th className="px-4 py-2.5 text-center bg-muted/95 sticky right-0">Thao tác</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border/60">
                      {paginatedPasswords.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-xs text-muted-foreground">
                            <KeyRound className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            Không tìm thấy tài khoản nào phù hợp.
                          </td>
                        </tr>
                      ) : (
                        paginatedPasswords.map((item) => {
                          const isRevealed = revealedIds.has(item.id);
                          const isSelected = selectedIds.includes(item.id);
                          const strength = item.securityScore || 70;

                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedItemForDetail(item)}
                              className={`hover:bg-muted/40 transition-colors cursor-pointer ${
                                isSelected ? 'bg-primary/5' : ''
                              }`}
                            >
                              {/* Checkbox */}
                              <td onClick={(e) => e.stopPropagation()} className="px-3 text-center">
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

                              {/* Favorite */}
                              <td onClick={(e) => e.stopPropagation()} className="px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleFavorite(item.id)}
                                  className="p-1 text-muted-foreground hover:text-amber-500"
                                >
                                  <Star
                                    className={`w-3.5 h-3.5 ${
                                      item.isFavorite ? 'fill-amber-500 text-amber-500' : 'opacity-40'
                                    }`}
                                  />
                                </button>
                              </td>

                              {/* Title & Website */}
                              <td className="px-4 py-2.5">
                                <div className="font-semibold text-foreground truncate max-w-[220px]">
                                  {item.title}
                                </div>
                                {item.url && (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[11px] text-primary hover:underline flex items-center gap-1 truncate max-w-[220px]"
                                  >
                                    <Globe className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{item.url.replace(/^https?:\/\//, '')}</span>
                                  </a>
                                )}
                              </td>

                              {/* Username */}
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-1.5 font-mono text-foreground truncate max-w-[180px]">
                                  <span className="truncate">{item.username}</span>
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
                              </td>

                              {/* Password */}
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
                                  <span>{isRevealed ? item.password : '••••••••••••'}</span>
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
                              </td>

                              {/* Category */}
                              <td className="px-4 py-2.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border/60">
                                  {getCategoryIcon(item.category)}
                                  <span>{PASSWORD_CATEGORIES.find((c) => c.id === item.category)?.name || item.category}</span>
                                </span>
                              </td>

                              {/* Strength */}
                              <td className="px-4 py-2.5 text-center">
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
                              </td>

                              {/* 2FA */}
                              <td className="px-4 py-2.5 text-center">
                                {item.pinOr2FA ? (
                                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center justify-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>2FA</span>
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/40">—</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td
                                onClick={(e) => e.stopPropagation()}
                                className="px-4 py-2.5 text-center sticky right-0 bg-card shadow-[-1px_0_0_0_hsl(var(--border))]"
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-border bg-muted/20 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Hiển thị</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-7 px-2 rounded-md border border-border bg-background text-foreground text-xs"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                  </select>
                  <span>/ {filteredPasswords.length} dòng</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30"
                    title="Trang đầu"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30"
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-semibold text-foreground">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30"
                    title="Trang sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30"
                    title="Trang cuối"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
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
