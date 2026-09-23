import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Trash2,
  ArrowLeft,
  Search,
  Tag,
  Bookmark,
  LayoutGrid,
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
import {
  ColumnCustomizerPopover,
  ColumnItem,
  TableDensity,
} from '../common/ColumnCustomizerPopover';

interface CostProposalPageProps {
  onBack: () => void;
}

export const DEFAULT_PROPOSAL_COLUMNS: ColumnItem[] = [
  { id: 'code', label: 'Số phiếu', visible: true, locked: true, width: 160 },
  { id: 'proposalDate', label: 'Ngày đề xuất', visible: true, width: 140 },
  { id: 'dueDate', label: 'Ngày cần chi', visible: true, width: 140 },
  { id: 'proposer', label: 'Người đề xuất', visible: true, width: 200 },
  { id: 'department', label: 'Phòng ban', visible: true, width: 200 },
  { id: 'title', label: 'Tiêu đề', visible: true, width: 260 },
  { id: 'reason', label: 'Lý do', visible: true, width: 280 },
  { id: 'amount', label: 'Tổng tiền', visible: true, width: 160 },
  { id: 'account', label: 'Tài khoản đề nghị chi', visible: true, width: 220 },
  { id: 'beneficiary', label: 'Đối tượng thụ hưởng', visible: true, width: 240 },
  { id: 'isOverBudget', label: 'Vượt kế hoạch', visible: true, width: 130 },
  { id: 'overBudgetReason', label: 'Lý do vượt kế hoạch', visible: true, width: 240 },
  { id: 'note', label: 'Ghi chú', visible: true, width: 240 },
  { id: 'approvalSteps', label: 'Số bậc duyệt', visible: true, width: 120 },
  { id: 'approvalStatus', label: 'Trạng thái duyệt', visible: true, width: 160 },
  { id: 'status', label: 'Trạng thái', visible: true, width: 140 },
  { id: 'updatedAt', label: 'Cập nhật', visible: true, width: 140 },
];

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

  // Resizing state
  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const resizingRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);

  // Column Customizer & Density State
  const [tableColumns, setTableColumns] = useState<ColumnItem[]>(() => {
    try {
      const saved = localStorage.getItem('erp_proposal_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingMap = new Map(parsed.map((p: ColumnItem) => [p.id, p]));
          const merged: ColumnItem[] = [];
          parsed.forEach((p: ColumnItem) => {
            const def = DEFAULT_PROPOSAL_COLUMNS.find((d) => d.id === p.id);
            if (def) {
              merged.push({
                ...def,
                ...p,
                width: p.width || def.width || 160,
              });
            }
          });
          DEFAULT_PROPOSAL_COLUMNS.forEach((def) => {
            if (!existingMap.has(def.id)) {
              merged.push(def);
            }
          });
          return merged;
        }
      }
    } catch {}
    return DEFAULT_PROPOSAL_COLUMNS;
  });

  const [tableDensity, setTableDensity] = useState<TableDensity>(() => {
    try {
      const saved = localStorage.getItem('erp_proposal_density');
      if (saved === 'compact' || saved === 'normal' || saved === 'relaxed') {
        return saved;
      }
    } catch {}
    return 'normal';
  });

  const handleSaveColumns = (newCols: ColumnItem[]) => {
    setTableColumns(newCols);
    try {
      localStorage.setItem('erp_proposal_columns', JSON.stringify(newCols));
    } catch {}
  };

  const handleSaveDensity = (newDensity: TableDensity) => {
    setTableDensity(newDensity);
    try {
      localStorage.setItem('erp_proposal_density', newDensity);
    } catch {}
  };

  const handleResetColumns = () => {
    setTableColumns(DEFAULT_PROPOSAL_COLUMNS);
    setTableDensity('normal');
    try {
      localStorage.removeItem('erp_proposal_columns');
      localStorage.removeItem('erp_proposal_density');
    } catch {}
  };

  // Interactive Column Resizing from Table Header
  const handleStartResize = useCallback(
    (columnId: string, startEvent: React.MouseEvent) => {
      startEvent.preventDefault();
      startEvent.stopPropagation();
      const col = tableColumns.find((c) => c.id === columnId);
      const currentWidth = col?.width || 160;

      setResizingColId(columnId);
      resizingRef.current = {
        colId: columnId,
        startX: startEvent.clientX,
        startWidth: currentWidth,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizingRef.current) return;
        const delta = moveEvent.clientX - resizingRef.current.startX;
        const nextWidth = Math.max(60, Math.min(1200, resizingRef.current.startWidth + delta));

        setTableColumns((prev) =>
          prev.map((c) => (c.id === resizingRef.current?.colId ? { ...c, width: nextWidth } : c))
        );
      };

      const handleMouseUp = () => {
        setResizingColId(null);
        resizingRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        setTableColumns((current) => {
          try {
            localStorage.setItem('erp_proposal_columns', JSON.stringify(current));
          } catch {}
          return current;
        });
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [tableColumns]
  );

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

  const handleToggleSelect = (id: string, e?: React.SyntheticEvent) => {
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
        } as CostProposal);
      }

      setIsFormDrawerOpen(false);
      setEditingProposal(null);

      // Sync to sheet
      setIsSyncing(true);
      const ok = await googleSheetsService.syncAllToSheet(updatedList);
      setIsSyncing(false);
      if (ok) {
        showToast(`Đã cập nhật ${editingProposal.code} và đồng bộ lên Google Sheet!`);
      } else {
        showToast('Đã lưu đề xuất nội bộ.', true);
      }
    } else {
      // Create new
      const maxNum = proposals.reduce((max, p) => {
        const match = p.code.match(/DX-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      const nextNum = maxNum + 1;
      const newCode = `DX-${String(nextNum).padStart(3, '0')}`;

      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const dateStr = `${dd}/${mm}/${yyyy}`;

      const newProposal: CostProposal = {
        id: String(Date.now()),
        code: newCode,
        title: formData.title || 'Chi phí mới',
        proposer: formData.proposer || currentUser?.name || 'Nguyễn Văn A',
        department: formData.department || 'Phòng Kỹ thuật',
        proposalDate: dateStr,
        dueDate: formData.dueDate || dateStr,
        account: formData.account || '642 - Chi phí quản lý doanh nghiệp',
        beneficiary: formData.beneficiary || '',
        amount: formData.amount || 0,
        isOverBudget: formData.isOverBudget || false,
        overBudgetReason: formData.overBudgetReason || '',
        note: formData.note || '',
        approvalSteps: 2,
        approvalStatus: 'draft',
        status: 'active',
        createdAt: dateStr,
        updatedAt: dateStr,
        reason: formData.reason || '',
        lineItems: formData.lineItems || [],
      };

      const updatedList = [newProposal, ...proposals];
      setProposals(updatedList);
      googleSheetsService.saveToCache(updatedList);

      setIsFormDrawerOpen(false);

      // Sync to sheet
      setIsSyncing(true);
      const ok = await googleSheetsService.syncAllToSheet(updatedList);
      setIsSyncing(false);
      if (ok) {
        showToast(`Đã tạo ${newCode} và đồng bộ lên Google Sheet!`);
      } else {
        showToast('Đã lưu đề xuất vào bộ nhớ tạm.', true);
      }
    }
  };

  // Delete proposal
    // Delete multiple selected proposals
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa ${count} đề xuất đã chọn?`);
    if (!confirmDelete) return;

    const toDelete = proposals.filter((p) => selectedIds.includes(p.id));
    const codesToDelete = toDelete.map((p) => p.code);

    const updatedList = proposals.filter((p) => !selectedIds.includes(p.id));
    setProposals(updatedList);
    googleSheetsService.saveToCache(updatedList);
    if (selectedProposalForDetail && selectedIds.includes(selectedProposalForDetail.id)) {
      setSelectedProposalForDetail(null);
    }
    setSelectedIds([]);

    setIsSyncing(true);
    // Delete ONLY selected rows from Google Sheet
    const ok = await googleSheetsService.deleteFromSheet(codesToDelete);
    setIsSyncing(false);
    if (ok) {
      showToast(`Đã xóa thành công ${count} đề xuất và đồng bộ Google Sheet!`);
    } else {
      showToast(`Đã xóa ${count} đề xuất khỏi bộ nhớ.`, true);
    }
  };

const handleDeleteProposal = async (id: string) => {
    const deleted = proposals.find((p) => p.id === id);
    const updatedList = proposals.filter((p) => p.id !== id);
    setProposals(updatedList);
    googleSheetsService.saveToCache(updatedList);
    if (selectedProposalForDetail?.id === id) {
      setSelectedProposalForDetail(null);
    }
    setSelectedIds((prev) => prev.filter((item) => item !== id));

    setIsSyncing(true);
    const ok = await googleSheetsService.syncAllToSheet(updatedList);
    setIsSyncing(false);
    if (ok) {
      showToast(`Đã xóa ${deleted?.code || 'đề xuất'} và đồng bộ Google Sheet!`);
    } else {
      showToast('Đã xóa đề xuất khỏi bộ nhớ.', true);
    }
  };

  // Duplicate / Copy Proposal
  const handleCopyProposal = async (item: CostProposal) => {
    const maxNum = proposals.reduce((max, p) => {
      const match = p.code.match(/DX-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const nextNum = maxNum + 1;
    const newCode = `DX-${String(nextNum).padStart(3, '0')}`;
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const dateStr = `${dd}/${mm}/${yyyy}`;

    const cloned: CostProposal = {
      ...item,
      id: String(Date.now()),
      code: newCode,
      title: `${item.title} (Bản sao)`,
      approvalStatus: 'draft',
      proposalDate: dateStr,
      dueDate: dateStr,
      createdAt: dateStr,
      updatedAt: dateStr,
    };

    const updatedList = [cloned, ...proposals];
    setProposals(updatedList);
    googleSheetsService.saveToCache(updatedList);

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

  const headerPaddingClass =
    tableDensity === 'compact' ? 'py-1.5' : tableDensity === 'relaxed' ? 'py-3.5' : 'py-2.5';
  const cellPaddingClass =
    tableDensity === 'compact'
      ? 'py-1.5 px-4'
      : tableDensity === 'relaxed'
      ? 'py-4 px-4'
      : 'py-3 px-4';

  const codeCol = tableColumns.find((c) => c.id === 'code');
  const codeWidth = codeCol?.width || 160;

  const renderProposalCell = (col: ColumnItem, item: CostProposal) => {
    const colId = col.id;
    const colWidth = col.width || 160;
    const colStyle: React.CSSProperties = {
      width: colWidth,
      minWidth: colWidth,
      maxWidth: colWidth,
    };

    switch (colId) {
      case 'proposalDate':
        return <td key={colId} style={colStyle} className={`${cellPaddingClass} tabular-nums text-foreground border-r border-border/40 truncate`}>{item.proposalDate}</td>;
      case 'dueDate':
        return <td key={colId} style={colStyle} className={`${cellPaddingClass} tabular-nums text-foreground border-r border-border/40 truncate`}>{item.dueDate}</td>;
      case 'proposer':
        return (
          <td key={colId} style={colStyle} className={`${cellPaddingClass} border-r border-border/40`}>
            <div className="inline-flex items-center gap-1 max-w-full">
              <span className="truncate text-foreground font-medium">{item.proposer}</span>
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
        );
      case 'department':
        return (
          <td key={colId} style={colStyle} className={`${cellPaddingClass} border-r border-border/40`}>
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
        );
      case 'title':
        return (
          <td key={colId} style={colStyle} className={`${cellPaddingClass} text-foreground truncate border-r border-border/40`} title={item.title}>
            {item.title}
          </td>
        );
      case 'reason':
        return (
          <td key={colId} style={colStyle} className={`${cellPaddingClass} text-foreground truncate border-r border-border/40`} title={item.reason}>
            {item.reason}
          </td>
        );
      case 'amount':
        return (
          <td key={colId} style={colStyle} className={`${cellPaddingClass} font-semibold tabular-nums text-foreground border-r border-border/40 truncate`}>
            {formatCurrency(item.amount)}
          </td>
        );
      case 'account':
        return (
          <td key={colId} style={colStyle} className={`${cellPaddingClass} border-r border-border/40`}>
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
        );
      case 'beneficiary':
        return (
          <td key={colId} style={colStyle} className={`${cellPaddingClass} text-muted-foreground truncate border-r border-border/40`}>
            {item.beneficiary || '—'}
          </td>
        );
      case 'isOverBudget':
        return <td key={colId} style={colStyle} className={`${cellPaddingClass} text-foreground border-r border-border/40 truncate`}>{item.isOverBudget ? 'Có' : 'Không'}</td>;
      case 'overBudgetReason':
        return (
          <td key={colId} style={colStyle} className={`${cellPaddingClass} text-muted-foreground truncate border-r border-border/40`}>
            {item.overBudgetReason || '—'}
          </td>
        );
      case 'note':
        return (
          <td key={colId} style={colStyle} className={`${cellPaddingClass} text-muted-foreground truncate border-r border-border/40`}>
            {item.note || '—'}
          </td>
        );
      case 'approvalSteps':
        return <td key={colId} style={colStyle} className={`${cellPaddingClass} tabular-nums text-foreground border-r border-border/40 truncate`}>{item.approvalSteps}</td>;
      case 'approvalStatus':
        return <td key={colId} style={colStyle} className={`${cellPaddingClass} border-r border-border/40`}>{renderApprovalBadge(item.approvalStatus)}</td>;
      case 'status':
        return (
          <td key={colId} style={colStyle} className={`${cellPaddingClass} border-r border-border/40`}>
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
        );
      case 'updatedAt':
        return <td key={colId} style={colStyle} className={`${cellPaddingClass} tabular-nums text-foreground border-r border-border/40 truncate`}>{item.updatedAt}</td>;
      default:
        return <td key={colId} style={colStyle} className={`${cellPaddingClass} border-r border-border/40`}>—</td>;
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
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive hover:text-white transition-all text-xs font-semibold shadow-sm active:scale-95 animate-in fade-in"
                      title="Xóa tất cả các mục đã chọn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa ({selectedIds.length})</span>
                    </button>
                  )}
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

                  {/* Column Customizer Popover */}
                  <ColumnCustomizerPopover
                    columns={tableColumns}
                    onChangeColumns={handleSaveColumns}
                    density={tableDensity}
                    onChangeDensity={handleSaveDensity}
                    onReset={handleResetColumns}
                    align="right"
                  />

                  {/* Grid / Table Toggle */}
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
                    <LayoutGrid className="w-3.5 h-3.5" />
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
                    <table className="text-left border-separate border-spacing-0 w-max min-w-full text-xs table-fixed">
                      <thead className="sticky top-0 z-[20] bg-muted">
                        <tr className="border-b border-border bg-muted">
                          {/* 1. Sticky Checkbox */}
                          <th
                            style={{ width: 44, minWidth: 44, maxWidth: 44 }}
                            className={`sticky left-0 z-[25] px-3 bg-muted border-b border-r border-border text-center ${headerPaddingClass} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]`}
                          >
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={handleSelectAll}
                              className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                            />
                          </th>

                          {/* 2. Sticky Số phiếu */}
                          <th
                            style={{ width: codeWidth, minWidth: codeWidth, maxWidth: codeWidth }}
                            className={`sticky left-[44px] z-[25] bg-muted font-semibold text-foreground border-b border-r border-border whitespace-nowrap px-4 ${headerPaddingClass} relative group/th select-none shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate">Số phiếu</span>
                              <SlidersHorizontal className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                            </div>
                            {/* Resizer Handle */}
                            <div
                              className={`absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize select-none z-20 flex justify-center items-center group/resizer hover:bg-primary/20 ${
                                resizingColId === 'code' ? 'bg-primary/30' : ''
                              }`}
                              onMouseDown={(e) => handleStartResize('code', e)}
                              title="Kéo để chỉnh kích thước cột Số phiếu"
                            >
                              <div className="w-[2px] h-3.5 bg-border group-hover/resizer:bg-primary group-hover/resizer:h-full transition-all" />
                            </div>
                          </th>

                          {/* Dynamic Columns */}
                          {tableColumns
                            .filter((c) => c.visible && c.id !== 'code')
                            .map((col) => {
                              const colWidth = col.width || 160;
                              return (
                                <th
                                  key={col.id}
                                  style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                                  className={`font-semibold text-foreground border-b border-r border-border whitespace-nowrap px-4 ${headerPaddingClass} relative group/th select-none`}
                                >
                                  <div className="flex items-center justify-between gap-1 pr-1">
                                    <span className="truncate">{col.label}</span>
                                    <SlidersHorizontal className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                                  </div>
                                  {/* Resizer Handle */}
                                  <div
                                    className={`absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize select-none z-20 flex justify-center items-center group/resizer hover:bg-primary/20 ${
                                      resizingColId === col.id ? 'bg-primary/30' : ''
                                    }`}
                                    onMouseDown={(e) => handleStartResize(col.id, e)}
                                    title={`Kéo để chỉnh kích thước cột ${col.label}`}
                                  >
                                    <div className="w-[2px] h-3.5 bg-border group-hover/resizer:bg-primary group-hover/resizer:h-full transition-all" />
                                  </div>
                                </th>
                              );
                            })}

                          {/* Sticky Thao tác */}
                          <th
                            style={{ width: 76, minWidth: 76, maxWidth: 76 }}
                            className={`sticky right-0 z-[25] px-3 bg-muted border-b border-l border-border text-center font-semibold text-foreground ${headerPaddingClass} shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)]`}
                          >
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProposals.length === 0 ? (
                          <tr>
                            <td
                              colSpan={tableColumns.filter((c) => c.visible).length + 2}
                              className="py-12 text-center text-muted-foreground"
                            >
                              Không tìm thấy đề xuất chi phí nào phù hợp
                            </td>
                          </tr>
                        ) : (
                          filteredProposals.map((item) => {
                            const isSelected = selectedIds.includes(item.id);
                            const isActiveDetail = selectedProposalForDetail?.id === item.id;
                            const stickyBgClass = isActiveDetail
                              ? 'bg-accent shadow-[inset_3px_0_0_var(--color-primary)]'
                              : isSelected
                              ? 'bg-primary/10 group-hover:bg-primary/15'
                              : 'bg-card group-hover:bg-muted/60';

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
                                  style={{ width: 44, minWidth: 44, maxWidth: 44 }}
                                  className={`sticky left-0 z-[10] px-3 ${cellPaddingClass.split(' ')[0]} border-r border-border text-center ${stickyBgClass} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]`}
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
                                <td
                                  style={{ width: codeWidth, minWidth: codeWidth, maxWidth: codeWidth }}
                                  className={`sticky left-[44px] z-[10] px-4 ${cellPaddingClass.split(' ')[0]} border-r border-border/50 font-semibold text-foreground ${stickyBgClass} shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                                    <span className="truncate text-sm">{item.code}</span>
                                  </div>
                                </td>

                                {/* Dynamic Columns */}
                                {tableColumns
                                  .filter((c) => c.visible && c.id !== 'code')
                                  .map((col) => renderProposalCell(col, item))}

                                {/* Sticky Thao tác */}
                                <td
                                  style={{ width: 76, minWidth: 76, maxWidth: 76 }}
                                  className={`sticky right-0 z-[10] px-2 ${cellPaddingClass.split(' ')[0]} border-l border-border/50 text-center ${stickyBgClass} shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)]`}
                                >
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
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {/* Mobile Card View */}
              {(viewMode === 'grid' || true) && (
                <div className="md:hidden flex-1 overflow-auto p-3 space-y-2.5">
                  {filteredProposals.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedProposalForDetail(item)}
                      className="p-3.5 rounded-xl border border-border bg-card shadow-xs active:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-primary">{item.code}</span>
                            <span className="text-[11px] text-muted-foreground">{item.proposalDate}</span>
                          </div>
                          <h4 className="font-medium text-xs text-foreground truncate mt-0.5">{item.title}</h4>
                        </div>
                        {renderApprovalBadge(item.approvalStatus)}
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{item.proposer}</span>
                        <span className="font-semibold text-foreground">{formatCurrency(item.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Grid View Desktop */}
              {viewMode === 'grid' && (
                <div className="hidden md:block flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProposals.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedProposalForDetail(item)}
                        className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-primary">{item.code}</span>
                            <h3 className="font-semibold text-sm text-foreground truncate mt-0.5">
                              {item.title}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.proposer} · {item.department}
                            </p>
                          </div>
                          {renderApprovalBadge(item.approvalStatus)}
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>Ngày cần chi:</span>
                            <span className="text-foreground">{item.dueDate}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Tổng tiền:</span>
                            <span className="font-semibold text-foreground">{formatCurrency(item.amount)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Tài khoản:</span>
                            <span className="truncate max-w-[140px] text-foreground">{item.account}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/40">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditDrawer(item, e)}
                            className="px-2.5 py-1 text-xs rounded-lg border border-border hover:bg-muted text-primary flex items-center gap-1 font-medium transition-colors"
                          >
                            <SquarePen className="w-3 h-3" />
                            Sửa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Table / Grid Footer Pagination */}
              <div className="p-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground shrink-0 bg-card">
                <div className="flex items-center gap-3">
                  <span>
                    Hiển thị <span className="font-semibold text-foreground">{filteredProposals.length}</span> / {proposals.length} đề xuất
                  </span>
                  {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Đã chọn {selectedIds.length}
                      </span>
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        className="px-2.5 py-1 flex items-center gap-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white transition-all text-xs font-semibold"
                        title="Xóa tất cả các mục đã chọn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa đã chọn</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled
                    className="p-1.5 rounded-lg border border-border opacity-50 cursor-not-allowed"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled
                    className="p-1.5 rounded-lg border border-border opacity-50 cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2.5 py-1 bg-primary text-primary-foreground font-semibold rounded-lg text-xs">
                    1
                  </span>
                  <button
                    type="button"
                    disabled
                    className="p-1.5 rounded-lg border border-border opacity-50 cursor-not-allowed"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled
                    className="p-1.5 rounded-lg border border-border opacity-50 cursor-not-allowed"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proposal Detail Drawer */}
      {selectedProposalForDetail && (
        <CostProposalDetailDrawer
          proposal={selectedProposalForDetail}
          currentIndex={currentDetailIndex}
          totalCount={filteredProposals.length}
          onClose={() => setSelectedProposalForDetail(null)}
          onEdit={(p: CostProposal) => {
            setSelectedProposalForDetail(null);
            handleOpenEditDrawer(p);
          }}
          onDelete={(id: string) => handleDeleteProposal(id)}
          onCopy={(p: CostProposal) => handleCopyProposal(p)}
          onSubmitForApproval={(id: string) => handleSubmitForApproval(id)}
          onNext={handleDrawerNext}
          onPrev={handleDrawerPrev}
        />
      )}

      {/* Proposal Form Drawer */}
      <CostProposalFormDrawer
        isOpen={isFormDrawerOpen}
        initialData={editingProposal}
        onClose={() => {
          setIsFormDrawerOpen(false);
          setEditingProposal(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Toast Notifications */}
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
