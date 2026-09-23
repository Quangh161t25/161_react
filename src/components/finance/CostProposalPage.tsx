import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Tag,
  Bookmark,
  LayoutGrid,
  LayoutTemplate,
  Download,
  Plus,
  SquarePen,
  EllipsisVertical,
  Link2,
  FileText,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  SlidersHorizontal,
  ArrowUp,
  Funnel,
  List,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { CostProposal, ApprovalStatus } from '../../types/cost-proposal';
import { CostProposalDetailDrawer } from './CostProposalDetailDrawer';
import { CostProposalFormDrawer } from './CostProposalFormDrawer';
import { googleSheetsService } from '../../services/googleSheetsService';
import { useAuth } from '../../context/AuthContext';

interface CostProposalPageProps {
  onBack: () => void;
}

export const CostProposalPage: React.FC<CostProposalPageProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [proposals, setProposals] = useState<CostProposal[]>(() =>
    googleSheetsService.getInitialProposals()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Drawer states
  const [selectedProposalForDetail, setSelectedProposalForDetail] = useState<CostProposal | null>(null);
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<CostProposal | null>(null);

  const showToast = (message: string, isErr = false) => {
    if (isErr) {
      setSyncError(message);
      setTimeout(() => setSyncError(null), 4000);
    } else {
      setSyncToastMessage(message);
      setTimeout(() => setSyncToastMessage(null), 3500);
    }
  };

  // Initial load from Google Sheets on mount
  useEffect(() => {
    let isMounted = true;
    const loadFromSheet = async () => {
      setIsSyncing(true);
      try {
        const liveData = await googleSheetsService.fetchFromSheet();
        if (isMounted && liveData && liveData.length > 0) {
          setProposals(liveData);
        }
      } catch (e) {
        console.warn('Initial sheet load failed:', e);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };
    loadFromSheet();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered list
  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchQuery =
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.proposer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === 'all' || p.approvalStatus === statusFilter;

      return matchQuery && matchStatus;
    });
  }, [proposals, searchQuery, statusFilter]);

  // Current index for detail drawer navigation
  const currentDetailIndex = useMemo(() => {
    if (!selectedProposalForDetail) return -1;
    return filteredProposals.findIndex((p) => p.id === selectedProposalForDetail.id);
  }, [selectedProposalForDetail, filteredProposals]);

  // Select all checkbox
  const isAllSelected =
    filteredProposals.length > 0 &&
    selectedIds.length === filteredProposals.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProposals.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Form Drawer for Create
  const handleOpenCreateDrawer = () => {
    setEditingProposal(null);
    setIsFormDrawerOpen(true);
  };

  // Open Form Drawer for Edit
  const handleOpenEditDrawer = (proposal: CostProposal, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProposal(proposal);
    setIsFormDrawerOpen(true);
  };

  // Save / Submit Create or Edit with live Google Sheets sync
  const handleFormSubmit = async (formData: Partial<CostProposal>) => {
    if (editingProposal) {
      // Update existing
      const updatedList = proposals.map((p) =>
        p.id === editingProposal.id
          ? {
              ...p,
              ...formData,
              updatedAt: new Date().toLocaleDateString('vi-VN'),
            }
          : p
      );
      setProposals(updatedList);
      googleSheetsService.saveToCache(updatedList);

      if (selectedProposalForDetail?.id === editingProposal.id) {
        setSelectedProposalForDetail({
          ...selectedProposalForDetail,
          ...formData,
          updatedAt: new Date().toLocaleDateString('vi-VN'),
        });
      }

      setIsFormDrawerOpen(false);
      setEditingProposal(null);

      // Trigger background sync to Google Sheet
      setIsSyncing(true);
      const ok = await googleSheetsService.syncAllToSheet(updatedList);
      setIsSyncing(false);
      if (ok) {
        showToast(`Đã cập nhật ${editingProposal.code} và đồng bộ lên Google Sheet!`);
      } else {
        showToast('Đã lưu nội bộ. Lỗi khi đồng bộ lên Google Sheet.', true);
      }
    } else {
      // Create new
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const dateStr = `${dd}/${mm}/${yyyy}`;

      const maxNum = proposals.reduce((max, p) => {
        const match = p.code.match(/DX\d+-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      const nextNum = maxNum + 1;
      const newCode = `DX2609-${String(nextNum).padStart(4, '0')}`;

      const created: CostProposal = {
        id: String(Date.now()),
        code: newCode,
        proposalDate: formData.proposalDate || dateStr,
        dueDate: formData.dueDate || dateStr,
        proposer: formData.proposer || currentUser.name || 'Lê Minh Công',
        department: formData.department || currentUser.department || 'Ban Giám Đốc',
        title: formData.title || '',
        reason: formData.reason || '',
        amount: formData.amount || 0,
        account: formData.account || 'Vietcombank - Tài khoản chính',
        beneficiary: formData.beneficiary || '',
        isOverBudget: formData.isOverBudget || false,
        overBudgetReason: formData.overBudgetReason || '',
        note: formData.note || '',
        approvalSteps: 1,
        approvalStatus: formData.approvalStatus || 'pending',
        status: formData.status || 'draft',
        updatedAt: dateStr,
        createdAt: `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')} - ${dateStr}`,
        lineItems: formData.lineItems || [],
      };

      const updatedList = [created, ...proposals];
      setProposals(updatedList);
      googleSheetsService.saveToCache(updatedList);

      setIsFormDrawerOpen(false);
      setEditingProposal(null);

      // Trigger background sync to Google Sheet
      setIsSyncing(true);
      const ok = await googleSheetsService.syncAllToSheet(updatedList);
      setIsSyncing(false);
      if (ok) {
        showToast(`Đã thêm đề xuất ${newCode} và đồng bộ lên Google Sheet thành công!`);
      } else {
        showToast('Đã lưu đề xuất nội bộ.', true);
      }
    }
  };

  // Delete proposal with live Google Sheets sync
  const handleDeleteProposal = async (id: string) => {
    const target = proposals.find((p) => p.id === id);
    const updatedList = proposals.filter((p) => p.id !== id);
    setProposals(updatedList);
    googleSheetsService.saveToCache(updatedList);

    if (selectedProposalForDetail?.id === id) {
      setSelectedProposalForDetail(null);
    }

    setIsSyncing(true);
    const ok = await googleSheetsService.syncAllToSheet(updatedList);
    setIsSyncing(false);
    if (ok) {
      showToast(`Đã xóa ${target?.code || 'đề xuất'} và cập nhật lên Google Sheet!`);
    }
  };

  // Copy proposal with live Google Sheets sync
  const handleCopyProposal = async (original: CostProposal) => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const dateStr = `${dd}/${mm}/${yyyy}`;

    const maxNum = proposals.reduce((max, p) => {
      const match = p.code.match(/DX\d+-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const nextNum = maxNum + 1;
    const newCode = `DX2609-${String(nextNum).padStart(4, '0')}`;

    const copied: CostProposal = {
      ...original,
      id: String(Date.now()),
      code: newCode,
      title: `${original.title} (Bản sao)`,
      proposalDate: dateStr,
      dueDate: dateStr,
      approvalStatus: 'draft',
      status: 'draft',
      updatedAt: dateStr,
      createdAt: `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')} - ${dateStr}`,
    };

    const updatedList = [copied, ...proposals];
    setProposals(updatedList);
    googleSheetsService.saveToCache(updatedList);
    setSelectedProposalForDetail(copied);

    setIsSyncing(true);
    const ok = await googleSheetsService.syncAllToSheet(updatedList);
    setIsSyncing(false);
    if (ok) {
      showToast(`Đã nhân bản ${newCode} và đồng bộ lên Google Sheet!`);
    }
  };

  // Submit for approval with live Google Sheets sync
  const handleSubmitForApproval = async (id: string) => {
    const updatedList = proposals.map((p) =>
      p.id === id ? { ...p, approvalStatus: 'pending' as ApprovalStatus } : p
    );
    setProposals(updatedList);
    googleSheetsService.saveToCache(updatedList);

    if (selectedProposalForDetail?.id === id) {
      setSelectedProposalForDetail({
        ...selectedProposalForDetail,
        approvalStatus: 'pending',
      });
    }

    setIsSyncing(true);
    const ok = await googleSheetsService.syncAllToSheet(updatedList);
    setIsSyncing(false);
    if (ok) {
      showToast('Đã gửi phê duyệt và cập nhật lên Google Sheet!');
    }
  };

  // Manual Sync trigger from Google Sheet
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const data = await googleSheetsService.fetchFromSheet();
      if (data && data.length > 0) {
        setProposals(data);
        showToast(`Đã đồng bộ ${data.length} đề xuất từ Google Sheet!`);
      } else {
        showToast('Google Sheet đã được đồng bộ mới nhất!');
      }
    } catch {
      showToast('Không thể kết nối với Google Sheet.', true);
    } finally {
      setIsSyncing(false);
    }
  };

  // Drawer Next/Prev Navigation
  const handleDrawerNext = () => {
    if (currentDetailIndex < filteredProposals.length - 1) {
      setSelectedProposalForDetail(filteredProposals[currentDetailIndex + 1]);
    }
  };

  const handleDrawerPrev = () => {
    if (currentDetailIndex > 0) {
      setSelectedProposalForDetail(filteredProposals[currentDetailIndex - 1]);
    }
  };

  // Currency formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Status badge renderer
  const renderApprovalBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border transition-colors rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            <span className="whitespace-nowrap">Đã duyệt</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border transition-colors rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            <span className="whitespace-nowrap">Chờ duyệt</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border transition-colors rounded-full bg-destructive/10 text-destructive border-destructive/20">
            <span className="whitespace-nowrap">Từ chối</span>
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border transition-colors rounded-full bg-muted text-muted-foreground border-border">
            <span className="whitespace-nowrap">Nháp</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex flex-col h-full relative">
          <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
            {/* Top Toolbar */}
            <div
              data-print="hide"
              className="sticky top-0 z-30 bg-card border-b border-border/40 px-3 sm:px-4 py-2 space-y-2 shrink-0"
            >
              {/* Mobile View Toolbar */}
              <div className="sm:hidden">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onBack}
                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground active:scale-95 transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <div className="relative flex-1 min-w-0 max-w-[21rem]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      placeholder="Tìm số phiếu, tiêu đề, người đề xuất"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-9 pl-8 pr-7 bg-muted/40 border border-border/60 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                      type="search"
                    />
                  </div>
                  <button
                    type="button"
                    title="Bộ lọc"
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border transition-all active:scale-95 relative bg-background border-border text-muted-foreground"
                  >
                    <Funnel className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Chuyển chế độ xem"
                    onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all active:scale-95"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCreateDrawer}
                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Desktop View Toolbar */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 min-w-0 flex-wrap">
                  <button
                    type="button"
                    onClick={onBack}
                    className="shrink-0 h-8 px-2 -ml-1 flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Quay lại</span>
                  </button>

                  <div className="relative w-64 max-w-[21rem] min-w-[10rem] shrink-0 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                    <input
                      placeholder="Tìm số phiếu, tiêu đề, người đề xuất"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-10 pr-8 bg-muted/40 hover:bg-muted/60 border border-border/60 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-background transition-all"
                      type="search"
                    />
                  </div>

                  {/* Status Dropdown */}
                  <div className="relative min-w-[130px]">
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className="w-full flex items-center justify-between px-2 text-xs border rounded-lg transition-all h-8 border-border bg-background hover:bg-muted/50 text-muted-foreground"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                        <Tag className="w-3 h-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                          {statusFilter === 'all'
                            ? 'Trạng thái'
                            : statusFilter === 'approved'
                            ? 'Đã duyệt'
                            : statusFilter === 'pending'
                            ? 'Chờ duyệt'
                            : statusFilter === 'rejected'
                            ? 'Từ chối'
                            : 'Nháp'}
                        </span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                    </button>

                    {isStatusDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-36 rounded-xl bg-card border border-border shadow-lg py-1 z-50">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted font-medium"
                          onClick={() => {
                            setStatusFilter('all');
                            setIsStatusDropdownOpen(false);
                          }}
                        >
                          Tất cả trạng thái
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-emerald-600"
                          onClick={() => {
                            setStatusFilter('approved');
                            setIsStatusDropdownOpen(false);
                          }}
                        >
                          Đã duyệt
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-amber-600"
                          onClick={() => {
                            setStatusFilter('pending');
                            setIsStatusDropdownOpen(false);
                          }}
                        >
                          Chờ duyệt
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-destructive"
                          onClick={() => {
                            setStatusFilter('rejected');
                            setIsStatusDropdownOpen(false);
                          }}
                        >
                          Từ chối
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-muted-foreground"
                          onClick={() => {
                            setStatusFilter('draft');
                            setIsStatusDropdownOpen(false);
                          }}
                        >
                          Nháp
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    title="Đồng bộ 2 chiều với Google Sheet: H161 react"
                    className="h-8 px-2 flex items-center gap-1.5 border rounded-lg transition-all bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
                    <span className="hidden md:inline">
                      {isSyncing ? 'Đang đồng bộ...' : 'Google Sheet'}
                    </span>
                  </button>

                  <button
                    type="button"
                    title="Ghim mục"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                    title={viewMode === 'table' ? 'Xem dạng thẻ' : 'Xem dạng bảng'}
                    className={`h-8 w-8 flex items-center justify-center border rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {viewMode === 'table' ? (
                      <LayoutGrid className="w-3.5 h-3.5" />
                    ) : (
                      <LayoutTemplate className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    title="Xuất file"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCreateDrawer}
                    className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm h-8 px-3 transition-colors gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">Thêm</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 flex flex-col">
              {viewMode === 'table' ? (
                /* Desktop Table View */
                <div className="hidden md:block flex-1 min-h-0 relative overflow-hidden">
                  <div className="h-full overflow-auto custom-scrollbar">
                    <table className="text-left border-separate border-spacing-0 w-full text-xs">
                      <colgroup>
                        <col style={{ width: '44px' }} />
                        <col style={{ width: '160px' }} />
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '220px' }} />
                        <col style={{ width: '220px' }} />
                        <col style={{ width: '260px' }} />
                        <col style={{ width: '280px' }} />
                        <col style={{ width: '150px' }} />
                        <col style={{ width: '220px' }} />
                        <col style={{ width: '260px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '260px' }} />
                        <col style={{ width: '260px' }} />
                        <col style={{ width: '110px' }} />
                        <col style={{ width: '160px' }} />
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '76px' }} />
                      </colgroup>
                      <thead className="sticky top-0 z-[10] bg-muted">
                        <tr className="border-b border-border bg-muted">
                          {/* Checkbox */}
                          <th className="sticky left-0 z-[12] px-3 bg-muted border-b border-r border-border text-center py-1.5 w-11">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={handleSelectAll}
                              className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                            />
                          </th>
                          {/* Số phiếu */}
                          <th className="sticky left-11 z-[12] bg-muted font-semibold text-foreground border-b border-r border-border whitespace-nowrap px-4 py-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span>Số phiếu</span>
                              <SlidersHorizontal className="w-3 h-3 text-muted-foreground/60" />
                            </div>
                          </th>
                          <th className="font-semibold text-foreground border-b border-border whitespace-nowrap px-4 py-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span>Ngày đề xuất</span>
                              <ArrowUp className="w-3 h-3 text-muted-foreground/40" />
                            </div>
                          </th>
                          <th className="font-semibold text-foreground border-b border-border whitespace-nowrap px-4 py-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span>Ngày cần chi</span>
                              <SlidersHorizontal className="w-3 h-3 text-muted-foreground/60" />
                            </div>
                          </th>
                          <th className="font-semibold text-foreground border-b border-border whitespace-nowrap px-4 py-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span>Người đề xuất</span>
                              <SlidersHorizontal className="w-3 h-3 text-muted-foreground/60" />
                            </div>
                          </th>
                          <th className="font-semibold text-foreground border-b border-border whitespace-nowrap px-4 py-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span>Phòng ban</span>
                              <SlidersHorizontal className="w-3 h-3 text-muted-foreground/60" />
                            </div>
                          </th>
                          <th className="font-semibold text-foreground border-b border-border whitespace-nowrap px-4 py-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span>Tiêu đề</span>
                              <SlidersHorizontal className="w-3 h-3 text-muted-foreground/60" />
                            </div>
                          </th>
                          <th className="font-semibold text-foreground border-b border-border whitespace-nowrap px-4 py-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span>Lý do</span>
                              <SlidersHorizontal className="w-3 h-3 text-muted-foreground/60" />
                            </div>
                          </th>
                          <th className="font-semibold text-foreground border-b border-border whitespace-nowrap px-4 py-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span>Tổng tiền</span>
                              <SlidersHorizontal className="w-3 h-3 text-muted-foreground/60" />
                            </div>
                          </th>
                          <th className="font-semibold text-foreground border-b border-border whitespace-nowrap px-4 py-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span>Tài khoản đề nghị chi</span>
                              <SlidersHorizontal className="w-3 h-3 text-muted-foreground/60" />
                            </div>
                          </th>
                          <th className="font-semibold text-foreground border-b border-border whitespace-nowrap px-4 py-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span>Đối tượng thụ hưởng</span>
                              <SlidersHorizontal className="w-3 h-3 text-muted-foreground/60" />
                            </div>
                          </th>
                          <th className="font-semibold text-foreground border-b border-border whitespace-nowrap px-4 py-1.5">
                            Vượt kế hoạch
                          </th>
                          <th className="font-semibold text-foreground border-b border-border whitespace-nowrap px-4 py-1.5">
                            Lý do vượt kế hoạch
                          </th>
                          <th className="font-semibold text-foreground border-b border-border whitespace-nowrap px-4 py-1.5">
                            Ghi chú
                          </th>
                          <th className="font-semibold text-foreground border-b border-border whitespace-nowrap px-4 py-1.5">
                            Số bậc duyệt
                          </th>
                          <th className="font-semibold text-foreground border-b border-border whitespace-nowrap px-4 py-1.5">
                            Trạng thái duyệt
                          </th>
                          <th className="font-semibold text-foreground border-b border-border whitespace-nowrap px-4 py-1.5">
                            Trạng thái
                          </th>
                          <th className="font-semibold text-foreground border-b border-border whitespace-nowrap px-4 py-1.5">
                            Cập nhật
                          </th>
                          {/* Sticky Thao tác */}
                          <th className="sticky right-0 z-[12] px-3 bg-muted border-b border-l border-border text-center font-semibold text-foreground">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProposals.map((item) => {
                          const isSelected = selectedIds.includes(item.id);
                          const isActiveDetail = selectedProposalForDetail?.id === item.id;

                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedProposalForDetail(item)}
                              aria-current={isActiveDetail}
                              className={`group cursor-pointer transition-colors ${
                                isActiveDetail
                                  ? 'bg-primary/[0.07] hover:bg-primary/[0.1]'
                                  : isSelected
                                  ? 'bg-primary/5 hover:bg-accent'
                                  : 'bg-card even:bg-muted/15 hover:bg-accent'
                              } [&>td]:border-b [&>td]:border-border`}
                            >
                              {/* Checkbox */}
                              <td
                                className={`sticky left-0 z-[2] px-3 py-1.5 border-r border-border text-center ${
                                  isActiveDetail
                                    ? 'bg-accent shadow-[inset_3px_0_0_var(--color-primary)]'
                                    : 'bg-inherit'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelect(item.id)}
                                  className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                                />
                              </td>
                              {/* Số phiếu */}
                              <td className="sticky left-11 z-[2] px-4 py-1.5 border-r border-border/50 bg-inherit font-semibold text-foreground">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                                  <span className="truncate text-sm">{item.code}</span>
                                </div>
                              </td>
                              <td className="px-4 py-1.5 tabular-nums text-foreground">{item.proposalDate}</td>
                              <td className="px-4 py-1.5 tabular-nums text-foreground">{item.dueDate}</td>
                              {/* Người đề xuất */}
                              <td className="px-4 py-1.5">
                                <div className="inline-flex items-center gap-1 max-w-full">
                                  <span className="truncate text-foreground">{item.proposer}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Mở Nhân viên"
                                    className="shrink-0 p-0.5 rounded text-primary hover:bg-primary/10"
                                  >
                                    <Link2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              {/* Phòng ban */}
                              <td className="px-4 py-1.5">
                                <div className="inline-flex items-center gap-1 max-w-full">
                                  <span className="truncate text-foreground">{item.department}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Mở Phòng ban"
                                    className="shrink-0 p-0.5 rounded text-primary hover:bg-primary/10"
                                  >
                                    <Link2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              {/* Tiêu đề */}
                              <td className="px-4 py-1.5 text-foreground truncate max-w-[260px]" title={item.title}>
                                {item.title}
                              </td>
                              {/* Lý do */}
                              <td className="px-4 py-1.5 text-foreground line-clamp-2 max-w-[280px]" title={item.reason}>
                                {item.reason}
                              </td>
                              {/* Tổng tiền */}
                              <td className="px-4 py-1.5 font-medium tabular-nums text-foreground">
                                {formatCurrency(item.amount)}
                              </td>
                              {/* Tài khoản */}
                              <td className="px-4 py-1.5">
                                <div className="inline-flex items-center gap-1 max-w-full">
                                  <span className="truncate text-foreground">{item.account}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Mở Tài khoản"
                                    className="shrink-0 p-0.5 rounded text-primary hover:bg-primary/10"
                                  >
                                    <Link2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              {/* Đối tượng thụ hưởng */}
                              <td className="px-4 py-1.5 text-muted-foreground truncate max-w-[260px]">
                                {item.beneficiary || '—'}
                              </td>
                              {/* Vượt kế hoạch */}
                              <td className="px-4 py-1.5 text-foreground">{item.isOverBudget ? 'Có' : 'Không'}</td>
                              <td className="px-4 py-1.5 text-muted-foreground line-clamp-2 max-w-[260px]">
                                {item.overBudgetReason || '—'}
                              </td>
                              <td className="px-4 py-1.5 text-muted-foreground line-clamp-2 max-w-[260px]">
                                {item.note || '—'}
                              </td>
                              <td className="px-4 py-1.5 tabular-nums text-foreground">{item.approvalSteps}</td>
                              <td className="px-4 py-1.5">{renderApprovalBadge(item.approvalStatus)}</td>
                              <td className="px-4 py-1.5">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border rounded-full ${
                                    item.status === 'active'
                                      ? 'bg-primary/10 text-primary border-primary/20'
                                      : 'bg-muted text-muted-foreground border-border'
                                  }`}
                                >
                                  {item.status === 'active' ? 'Hoạt động' : 'Đã huỷ'}
                                </span>
                              </td>
                              <td className="px-4 py-1.5 tabular-nums text-foreground">{item.updatedAt}</td>
                              {/* Sticky Thao tác */}
                              <td className="sticky right-0 z-[2] px-2 py-1.5 border-l border-border/50 text-center bg-inherit">
                                <div className="flex items-center justify-center gap-0.5">
                                  <button
                                    type="button"
                                    title="Sửa"
                                    onClick={(e) => handleOpenEditDrawer(item, e)}
                                    className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors"
                                  >
                                    <SquarePen className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Thao tác thêm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyProposal(item);
                                    }}
                                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                  >
                                    <EllipsisVertical className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {/* Mobile / Card Grid View */}
              <div
                className={`${
                  viewMode === 'grid' ? 'block' : 'md:hidden'
                } flex-1 min-h-0 space-y-3 overflow-y-auto pb-3 px-3 pt-1 custom-scrollbar`}
              >
                {filteredProposals.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedProposalForDetail(item)}
                    className="relative bg-card rounded-xl border border-border shadow-sm transition-all active:scale-[0.98] pt-3 px-3 pb-1.5 cursor-pointer hover:border-primary/40"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="h-14 w-14 shrink-0 rounded-xl border border-primary/20 bg-primary/15 flex items-center justify-center text-primary">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="truncate text-base font-semibold text-foreground">
                            {item.code}
                          </h4>
                          {renderApprovalBadge(item.approvalStatus)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs">
                          <div>
                            <p className="mb-0.5 text-muted-foreground text-[10px] uppercase font-medium">
                              Người đề xuất
                            </p>
                            <p className="truncate font-medium text-foreground">
                              {item.proposer}
                            </p>
                          </div>
                          <div>
                            <p className="mb-0.5 text-muted-foreground text-[10px] uppercase font-medium">
                              Tổng tiền
                            </p>
                            <p className="font-semibold text-foreground tabular-nums">
                              {formatCurrency(item.amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className="mt-3 flex min-h-9 items-center justify-between gap-2 border-t border-border pt-2 pb-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleToggleSelect(item.id)}
                          className="h-4 w-4 cursor-pointer rounded border-border text-primary accent-primary"
                        />
                      </label>
                      <div className="flex shrink-0 items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditDrawer(item, e)}
                          title="Sửa"
                          className="h-9 w-9 inline-flex items-center justify-center rounded-lg transition-all active:scale-95 text-primary hover:bg-primary/10"
                        >
                          <SquarePen className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyProposal(item);
                          }}
                          title="Thao tác thêm"
                          className="h-9 w-9 inline-flex items-center justify-center rounded-lg transition-all active:scale-95 text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <EllipsisVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Pagination Bar */}
              <div className="border-t border-border bg-card md:bg-muted/10 px-3 sm:px-4 py-1.5 items-center justify-between gap-2 shrink-0 flex">
                <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                  <span className="tabular-nums">
                    <span className="font-medium text-foreground">
                      1–{filteredProposals.length}
                    </span>
                    <span className="text-muted-foreground">/Tổng:</span>
                    <span className="font-semibold text-foreground">
                      {filteredProposals.length}
                    </span>
                  </span>

                  <div className="flex items-center border-l border-border pl-2">
                    <div className="items-center gap-1 inline-flex">
                      <button
                        type="button"
                        aria-label="Số bản ghi mỗi trang"
                        className="inline-flex items-center gap-0.5 tabular-nums font-medium border border-border rounded bg-card text-foreground hover:bg-muted/60 h-6 px-2 text-xs"
                      >
                        50
                        <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" />
                      </button>
                      <span className="text-muted-foreground text-xs whitespace-nowrap hidden sm:inline">
                        / trang
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center border bg-background h-6 w-6 p-0 border-border rounded text-muted-foreground opacity-50 cursor-not-allowed"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center border bg-background h-6 w-6 p-0 border-border rounded text-muted-foreground opacity-50 cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center gap-0.5 px-1">
                    <span className="h-6 min-w-[24px] flex items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold px-1 tabular-nums">
                      1
                    </span>
                    <span className="text-muted-foreground text-xs">/</span>
                    <span className="text-xs font-medium text-muted-foreground tabular-nums">
                      1
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center border bg-background h-6 w-6 p-0 border-border rounded text-muted-foreground opacity-50 cursor-not-allowed"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center border bg-background h-6 w-6 p-0 border-border rounded text-muted-foreground opacity-50 cursor-not-allowed"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Detail Drawer */}
      {selectedProposalForDetail && (
        <CostProposalDetailDrawer
          proposal={selectedProposalForDetail}
          currentIndex={currentDetailIndex}
          totalCount={filteredProposals.length}
          onClose={() => setSelectedProposalForDetail(null)}
          onPrev={handleDrawerPrev}
          onNext={handleDrawerNext}
          onEdit={(prop) => {
            setSelectedProposalForDetail(null);
            handleOpenEditDrawer(prop);
          }}
          onDelete={handleDeleteProposal}
          onCopy={handleCopyProposal}
          onSubmitForApproval={handleSubmitForApproval}
        />
      )}

      {/* Slide-over Form Drawer (Create & Edit) */}
      <CostProposalFormDrawer
        isOpen={isFormDrawerOpen}
        initialData={editingProposal}
        onClose={() => {
          setIsFormDrawerOpen(false);
          setEditingProposal(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Live Google Sheet Toast Notifications */}
      {syncToastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-card border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-xs font-semibold text-foreground">
            {syncToastMessage}
          </span>
        </div>
      )}

      {syncError && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-card border border-destructive/40 text-destructive rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <span className="text-xs font-semibold text-foreground">
            {syncError}
          </span>
        </div>
      )}
    </div>
  );
};
