import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Trash2,
  FolderKanban,
  Building2,
  User,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  CheckSquare,
  Copy,
  Check,
} from 'lucide-react';
import { Project, Task, ProjectStatus } from '../../../types/task';

interface ProjectDetailDrawerProps {
  project: Project;
  allTasks?: Task[];
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onSelectTask?: (task: Task) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

export const ProjectDetailDrawer: React.FC<ProjectDetailDrawerProps> = ({
  project,
  allTasks = [],
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
  onEdit,
  onDelete,
  onSelectTask,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('normal');
  const [copiedAll, setCopiedAll] = useState(false);

  const formatMoney = (n: number) => (n ? n.toLocaleString('vi-VN') : '0');

  const linkedTasks = allTasks.filter(
    (t) => t.projectId === project.id || t.projectCode === project.code
  );

  const completedTasks = linkedTasks.filter((t) => t.status === 'completed').length;

  const toggleFullscreen = () => {
    if (widthMode === 'fullscreen') {
      setWidthMode(prevWidthMode);
    } else {
      setPrevWidthMode(widthMode);
      setWidthMode('fullscreen');
    }
  };

  const widthClasses: Record<DrawerWidthMode, string> = {
    narrow: 'w-full md:max-w-md',
    normal: 'w-full md:max-w-xl',
    wide: 'w-full md:max-w-3xl',
    fullscreen: 'w-full max-w-full',
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Đã hoàn thành
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
            Đang triển khai
          </span>
        );
      case 'on_hold':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Tạm dừng
          </span>
        );
      case 'planning':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 border border-slate-500/20">
            Lập kế hoạch
          </span>
        );
    }
  };

  const handleCopy = () => {
    const text = `DỰ ÁN: ${project.name} (${project.code})
Quản trị (PM): ${project.managerName}
Khách hàng: ${project.customerName || 'Nội bộ'}
Thời gian: ${project.startDate} đến ${project.endDate}
Ngân sách: ${formatMoney(project.budget)} VNĐ
Tiến độ: ${project.progress}%`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 md:pl-10">
        <div
          className={`${widthClasses[widthMode]} flex flex-col bg-card border-l border-border shadow-2xl transition-all duration-300 ease-in-out`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 border border-purple-500/20 shrink-0">
                {project.code}
              </span>
              <h2 className="text-sm font-semibold truncate text-foreground">
                {project.name}
              </h2>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Width Controls */}
              <div className="hidden md:flex items-center border border-border rounded-lg bg-background p-0.5 mr-1">
                <button
                  type="button"
                  title="Gọn"
                  onClick={() => setWidthMode('narrow')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'narrow' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Vừa"
                  onClick={() => setWidthMode('normal')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'normal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Rộng"
                  onClick={() => setWidthMode('wide')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'wide' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRightOpen className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title={widthMode === 'fullscreen' ? 'Thu nhỏ' : 'Toàn màn hình'}
                  onClick={toggleFullscreen}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'fullscreen' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {widthMode === 'fullscreen' ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Prev / Next */}
              <div className="flex items-center border border-border rounded-lg bg-background p-0.5 mr-1">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={currentIndex <= 0}
                  className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Dự án trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] px-1 font-mono text-muted-foreground">
                  {currentIndex + 1}/{totalCount}
                </span>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={currentIndex >= totalCount - 1}
                  className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Dự án tiếp theo"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
            {/* Hero Card */}
            <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-foreground">{project.name}</span>
                    {getStatusBadge(project.status)}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">Mã hệ thống: {project.code}</p>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors shrink-0"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>

              {/* Progress */}
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tiến độ tổng thể:</span>
                  <span className="font-bold text-primary tabular-nums">{project.progress}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            {project.description && (
              <div className="p-4 rounded-xl border border-border bg-card space-y-1.5 text-xs">
                <span className="font-bold text-foreground block">Mục tiêu & Phạm vi:</span>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{project.description}</p>
              </div>
            )}

            {/* General Info Grid */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                <FolderKanban className="w-3.5 h-3.5" />
                <span>Thông tin quản trị & Ngân sách</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Quản trị dự án (PM)</span>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>{project.managerName}</span>
                    {project.managerCode && (
                      <span className="text-[10px] font-mono bg-muted px-1 rounded border border-border/50 text-muted-foreground">
                        {project.managerCode}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Khách hàng / Đối tác</span>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>{project.customerName || 'Nội bộ doanh nghiệp'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Ngân sách dự kiến</span>
                  <div className="font-bold text-foreground tabular-nums">
                    {formatMoney(project.budget)} VNĐ
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Đã giải ngân chi phí</span>
                  <div className="font-bold text-amber-600 tabular-nums">
                    {formatMoney(project.spentAmount || 0)} VNĐ
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Thời gian triển khai</span>
                  <div className="font-semibold text-foreground tabular-nums">
                    {project.startDate} → {project.endDate}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Khối lượng đầu việc</span>
                  <div className="font-semibold text-foreground tabular-nums">
                    {completedTasks}/{linkedTasks.length} việc hoàn thành
                  </div>
                </div>
              </div>
            </div>

            {/* Linked Tasks List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-primary/20 pb-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Danh sách công việc trong dự án ({linkedTasks.length})</span>
                </div>
              </div>

              <div className="space-y-2">
                {linkedTasks.length > 0 ? (
                  linkedTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask?.(t)}
                      className="p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="font-mono font-bold text-primary shrink-0">{t.code}</span>
                        <span className="font-semibold text-foreground truncate">{t.title}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-muted-foreground">
                          {t.assigneeName} {t.assigneeCode ? `(${t.assigneeCode})` : ''}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            t.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}
                        >
                          {t.status === 'completed' ? 'Xong' : 'Đang làm'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">
                    Chưa có đầu việc nào được liên kết với dự án này.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors"
            >
              Đóng
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(project)}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <SquarePen className="w-3.5 h-3.5" />
                <span>Chỉnh sửa</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Xác nhận xoá dự án ${project.code} - "${project.name}"?`)) {
                    onDelete(project.id);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xoá</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
