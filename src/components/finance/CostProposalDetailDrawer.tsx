import React, { useState } from 'react';
import {
  FileText,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  ChevronLeft,
  ChevronRight,
  X,
  Printer,
  Calendar,
  CalendarClock,
  User,
  Building2,
  StickyNote,
  Banknote,
  Landmark,
  Users,
  TriangleAlert,
  Layers,
  CircleCheck,
  Link2,
  Clock,
  FilePen,
  Send,
  History,
  MessageSquare,
  Paperclip,
  Copy,
  SquarePen,
  Trash2,
} from 'lucide-react';
import { CostProposal, ApprovalStatus } from '../../types/cost-proposal';

interface CostProposalDetailDrawerProps {
  proposal: CostProposal;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onEdit: (proposal: CostProposal) => void;
  onDelete: (id: string) => void;
  onCopy: (proposal: CostProposal) => void;
  onSubmitForApproval: (id: string) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide';
type ActivityTab = 'changes' | 'approval' | 'discussion' | 'attachments';

export const CostProposalDetailDrawer: React.FC<CostProposalDetailDrawerProps> = ({
  proposal,
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
  onEdit,
  onDelete,
  onCopy,
  onSubmitForApproval,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [activeTab, setActiveTab] = useState<ActivityTab>('changes');

  // Currency Formatter
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

  const getWidthClass = () => {
    switch (widthMode) {
      case 'narrow':
        return 'w-full max-w-xl';
      case 'wide':
        return 'w-full max-w-5xl';
      case 'normal':
      default:
        return 'w-full max-w-3xl';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 z-40 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 ${getWidthClass()} bg-card shadow-2xl flex flex-col h-[100dvh] border-l border-border/40 outline-none z-50 animate-in slide-in-from-right duration-200`}
        role="dialog"
        aria-modal="true"
        aria-label="Chi tiết đề xuất chi phí"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-4 border-b border-border/60 bg-card shrink-0 px-4 py-2.5 sm:px-5"
          style={{ paddingTop: 'max(0.6rem, env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground leading-tight truncate">
                Chi tiết đề xuất chi phí
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                Phiếu: {proposal.code}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Width Adjustment */}
            <div
              role="group"
              aria-label="Bề rộng ngăn bên"
              className="flex items-center gap-0.5 shrink-0 rounded-xl border border-border/60 p-0.5"
            >
              <button
                type="button"
                onClick={() => setWidthMode('narrow')}
                aria-pressed={widthMode === 'narrow'}
                title="Hẹp"
                className={`p-1.5 rounded-lg transition-colors active:scale-90 ${
                  widthMode === 'narrow'
                    ? 'bg-muted text-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <PanelRightClose className="w-4 h-4 stroke-[2.25px]" />
              </button>
              <button
                type="button"
                onClick={() => setWidthMode('normal')}
                aria-pressed={widthMode === 'normal'}
                title="Chuẩn"
                className={`p-1.5 rounded-lg transition-colors active:scale-90 ${
                  widthMode === 'normal'
                    ? 'bg-muted text-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <PanelRight className="w-4 h-4 stroke-[2.25px]" />
              </button>
              <button
                type="button"
                onClick={() => setWidthMode('wide')}
                aria-pressed={widthMode === 'wide'}
                title="Rộng"
                className={`p-1.5 rounded-lg transition-colors active:scale-90 ${
                  widthMode === 'wide'
                    ? 'bg-muted text-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <PanelRightOpen className="w-4 h-4 stroke-[2.25px]" />
              </button>
            </div>

            {/* Prev / Next record navigation */}
            <div className="flex items-center gap-0.5 shrink-0 border-l border-border/60 pl-1 ml-1">
              <button
                type="button"
                disabled={currentIndex <= 0}
                onClick={onPrev}
                aria-label="Bản ghi trước"
                className="p-1.5 rounded-lg text-muted-foreground transition-colors active:scale-90 hover:bg-muted hover:text-foreground disabled:opacity-35 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.25px]" />
              </button>
              <span
                className="px-1 text-xs font-medium text-muted-foreground tabular-nums select-none whitespace-nowrap"
                aria-label={`Bản ghi ${currentIndex + 1} trên ${totalCount}`}
              >
                {currentIndex + 1}/{totalCount}
              </span>
              <button
                type="button"
                disabled={currentIndex >= totalCount - 1}
                onClick={onNext}
                aria-label="Bản ghi sau"
                className="p-1.5 rounded-lg text-muted-foreground transition-colors active:scale-90 hover:bg-muted hover:text-foreground disabled:opacity-35 disabled:pointer-events-none"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.25px]" />
              </button>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors active:scale-90 shrink-0 ml-1"
            >
              <X className="w-5 h-5 stroke-[2.25px]" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-5 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
            {/* Hero Card */}
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <h2 className="text-base font-bold text-foreground leading-tight truncate flex-1 min-w-0">
                    {proposal.code}
                  </h2>
                  <div className="shrink-0">{renderApprovalBadge(proposal.approvalStatus)}</div>
                </div>
                <p className="text-xs sm:text-sm text-foreground truncate">{proposal.title}</p>
                <p className="text-xs sm:text-sm font-semibold text-primary tabular-nums">
                  {formatCurrency(proposal.amount)}
                </p>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="p-3.5 min-w-0 flex flex-wrap justify-start gap-6 bg-card rounded-xl border border-border">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex flex-col items-center gap-1.5 transition-[transform,colors] duration-150 outline-none w-auto min-w-16 max-w-36 hover:-translate-y-0.5 active:scale-95"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm border bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground">
                  <Printer className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-center transition-colors break-words w-full px-1 leading-tight text-muted-foreground">
                  In phiếu
                </span>
              </button>
            </div>

            {/* Card: Thông tin phiếu */}
            <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2.5 border-b border-primary/20">
                <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="truncate">Thông tin phiếu</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full">
                {/* Số phiếu */}
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <FileText className="w-3 h-3 shrink-0" />
                    Số phiếu
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed font-semibold">
                    {proposal.code}
                  </p>
                </div>

                {/* Ngày đề xuất */}
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <Calendar className="w-3 h-3 shrink-0" />
                    Ngày đề xuất
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed tabular-nums">
                    {proposal.proposalDate}
                  </p>
                </div>

                {/* Ngày cần chi */}
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <CalendarClock className="w-3 h-3 shrink-0" />
                    Ngày cần chi
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed tabular-nums">
                    {proposal.dueDate}
                  </p>
                </div>

                {/* Người đề xuất */}
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <User className="w-3 h-3 shrink-0" />
                    Người đề xuất
                  </span>
                  <div className="text-xs sm:text-sm leading-relaxed min-w-0">
                    <span className="inline-flex items-center gap-1 min-w-0">
                      <span className="min-w-0 truncate font-medium">{proposal.proposer}</span>
                      <button
                        type="button"
                        title="Mở Nhân viên"
                        className="shrink-0 grid place-items-center h-4 w-4 rounded transition-colors text-primary hover:bg-primary/10"
                      >
                        <Link2 className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                </div>

                {/* Phòng ban */}
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <Building2 className="w-3 h-3 shrink-0" />
                    Phòng ban
                  </span>
                  <div className="text-xs sm:text-sm leading-relaxed min-w-0">
                    <span className="inline-flex items-center gap-1 min-w-0">
                      <span className="min-w-0 truncate font-medium">{proposal.department}</span>
                      <button
                        type="button"
                        title="Mở Phòng ban"
                        className="shrink-0 grid place-items-center h-4 w-4 rounded transition-colors text-primary hover:bg-primary/10"
                      >
                        <Link2 className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                </div>

                {/* Tiêu đề */}
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <FileText className="w-3 h-3 shrink-0" />
                    Tiêu đề
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed font-medium">
                    {proposal.title}
                  </p>
                </div>

                {/* Lý do */}
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <StickyNote className="w-3 h-3 shrink-0" />
                    Lý do
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                    {proposal.reason || '—'}
                  </p>
                </div>

                {/* Tổng tiền */}
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <Banknote className="w-3 h-3 shrink-0" />
                    Tổng tiền
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed font-bold tabular-nums">
                    {formatCurrency(proposal.amount)}
                  </p>
                </div>

                {/* Tài khoản đề nghị chi */}
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <Landmark className="w-3 h-3 shrink-0" />
                    Tài khoản đề nghị chi
                  </span>
                  <div className="text-xs sm:text-sm leading-relaxed min-w-0">
                    <span className="inline-flex items-center gap-1 min-w-0">
                      <span className="min-w-0 truncate">{proposal.account}</span>
                      <button
                        type="button"
                        title="Mở Tài khoản"
                        className="shrink-0 grid place-items-center h-4 w-4 rounded transition-colors text-primary hover:bg-primary/10"
                      >
                        <Link2 className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                </div>

                {/* Đối tượng thụ hưởng */}
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <Users className="w-3 h-3 shrink-0" />
                    Đối tượng thụ hưởng
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                    {proposal.beneficiary || <span className="italic text-muted-foreground">Chưa cập nhật</span>}
                  </p>
                </div>

                {/* Vượt kế hoạch */}
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <TriangleAlert className="w-3 h-3 shrink-0" />
                    Vượt kế hoạch
                  </span>
                  <div className="text-xs sm:text-sm leading-relaxed min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border rounded-full ${
                        proposal.isOverBudget
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      <span>{proposal.isOverBudget ? 'Có' : 'Không'}</span>
                    </span>
                  </div>
                </div>

                {/* Lý do vượt kế hoạch */}
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <TriangleAlert className="w-3 h-3 shrink-0" />
                    Lý do vượt kế hoạch
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                    {proposal.overBudgetReason || (
                      <span className="italic text-muted-foreground">Chưa cập nhật</span>
                    )}
                  </p>
                </div>

                {/* Ghi chú */}
                <div className="space-y-1 min-w-0 w-full sm:col-span-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <StickyNote className="w-3 h-3 shrink-0" />
                    Ghi chú
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                    {proposal.note || <span className="italic text-muted-foreground">—</span>}
                  </p>
                </div>

                {/* Số bậc duyệt */}
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <Layers className="w-3 h-3 shrink-0" />
                    Số bậc duyệt
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed tabular-nums">
                    {proposal.approvalSteps}
                  </p>
                </div>

                {/* Trạng thái duyệt */}
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <CircleCheck className="w-3 h-3 shrink-0" />
                    Trạng thái duyệt
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                    {proposal.approvalStatus === 'approved'
                      ? 'Đã duyệt'
                      : proposal.approvalStatus === 'pending'
                      ? 'Chờ duyệt'
                      : proposal.approvalStatus === 'rejected'
                      ? 'Từ chối'
                      : 'Nháp'}
                  </p>
                </div>

                {/* Trạng thái */}
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <FileText className="w-3 h-3 shrink-0" />
                    Trạng thái
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                    {proposal.status === 'active' ? 'Hoạt động' : 'Đã huỷ'}
                  </p>
                </div>
              </div>
            </div>

            {/* Card: Dòng khoản mục */}
            <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2.5 border-b border-primary/20">
                <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="truncate">Dòng khoản mục</span>
                </h4>
              </div>

              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full min-w-[520px] text-xs text-left border-separate border-spacing-0">
                    <thead className="bg-muted">
                      <tr>
                        <th className="sticky top-0 left-0 z-10 px-4 py-2 font-semibold text-foreground border-b border-border bg-muted min-w-[140px]">
                          Khoản mục
                        </th>
                        <th className="px-4 py-2 font-semibold text-foreground border-b border-border bg-muted min-w-[180px]">
                          Diễn giải
                        </th>
                        <th className="px-4 py-2 font-semibold text-foreground border-b border-border bg-muted text-right min-w-[80px]">
                          Số lượng
                        </th>
                        <th className="px-4 py-2 font-semibold text-foreground border-b border-border bg-muted text-right min-w-[110px]">
                          Đơn giá
                        </th>
                        <th className="px-4 py-2 font-semibold text-foreground border-b border-border bg-muted text-right min-w-[110px]">
                          Thành tiền
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                      {proposal.lineItems && proposal.lineItems.length > 0 ? (
                        proposal.lineItems.map((item) => (
                          <tr key={item.id} className="group hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-foreground bg-card group-hover:bg-muted/40">
                              {item.category || 'Chi phí hoạt động'}
                            </td>
                            <td className="px-4 py-2.5 text-foreground bg-card group-hover:bg-muted/40">
                              {item.description || item.name || 'Chi tiết chi phí'}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums text-right text-foreground bg-card group-hover:bg-muted/40">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums text-right text-foreground bg-card group-hover:bg-muted/40">
                              {formatCurrency(item.unitPrice || 0)}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums text-right font-semibold text-foreground bg-card group-hover:bg-muted/40">
                              {formatCurrency(item.amount ?? item.total ?? ((item.quantity || 0) * (item.unitPrice || 0)))}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="group hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-foreground bg-card">Chi phí hoạt động</td>
                          <td className="px-4 py-2.5 text-foreground bg-card">{proposal.title}</td>
                          <td className="px-4 py-2.5 tabular-nums text-right text-foreground bg-card">1</td>
                          <td className="px-4 py-2.5 tabular-nums text-right text-foreground bg-card">
                            {formatCurrency(proposal.amount)}
                          </td>
                          <td className="px-4 py-2.5 tabular-nums text-right font-semibold text-foreground bg-card">
                            {formatCurrency(proposal.amount)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Card: Thông tin hệ thống */}
            <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2.5 border-b border-primary/20">
                <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="truncate">Thông tin hệ thống</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full">
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <Calendar className="w-3 h-3 shrink-0" />
                    Được tạo lúc
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed tabular-nums">
                    {proposal.createdAt || `08:00 - ${proposal.proposalDate}`}
                  </p>
                </div>
                <div className="space-y-1 min-w-0 w-full">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <Calendar className="w-3 h-3 shrink-0" />
                    Cập nhật
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed tabular-nums">
                    {proposal.updatedAt}
                  </p>
                </div>
              </div>
            </div>

            {/* Trình duyệt Workflow Bar (if draft) */}
            {proposal.approvalStatus === 'draft' && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground">
                  <FilePen className="w-3.5 h-3.5" />
                  Nháp
                </span>
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={() => onSubmitForApproval(proposal.id)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 shadow-sm transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Trình duyệt
                </button>
              </div>
            )}

            {/* Card: Nhật ký hoạt động */}
            <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2.5 border-b border-primary/20">
                <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                  <History className="w-3.5 h-3.5" />
                  <span className="truncate">Nhật ký hoạt động</span>
                </h4>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <div className="flex gap-0.5 p-0.5 bg-muted/50 rounded-lg border border-border/50">
                    <button
                      type="button"
                      onClick={() => setActiveTab('changes')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        activeTab === 'changes'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      Thay đổi
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('approval')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        activeTab === 'approval'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <CircleCheck className="w-3.5 h-3.5" />
                      Duyệt
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('discussion')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        activeTab === 'discussion'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Trao đổi
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('attachments')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        activeTab === 'attachments'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      Tệp kèm
                    </button>
                  </div>
                </div>
              </div>

              {/* Empty state for Activity */}
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground px-6 py-10 bg-card rounded-xl border border-dashed border-border">
                <History className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm text-foreground font-semibold">Chưa có thao tác nào</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Mọi thay đổi trên bản ghi này sẽ được ghi lại tại đây.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="bg-card border-t border-border/60 flex items-center justify-between shadow-sticky shrink-0 w-full px-4 py-2 sm:px-5"
          style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg font-medium border border-border bg-background hover:bg-muted h-8 px-3 text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCopy(proposal)}
              className="inline-flex items-center justify-center rounded-lg font-medium border border-border bg-background hover:bg-muted h-8 px-3 text-xs text-muted-foreground hover:text-foreground transition-all"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              Sao chép
            </button>
            <button
              type="button"
              onClick={() => onEdit(proposal)}
              className="inline-flex items-center justify-center rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm h-8 px-3 text-xs transition-all active:scale-95"
            >
              <SquarePen className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              Sửa
            </button>
            <button
              type="button"
              onClick={() => onDelete(proposal.id)}
              className="inline-flex items-center justify-center rounded-lg font-medium border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-8 px-3 text-xs transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              Xóa
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
