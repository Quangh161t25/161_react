import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Trash2,
  Printer,
  Copy,
  Check,
  CheckSquare,
  Clock,
  CircleCheck,
  User,
  Building2,
  FolderKanban,
  Calendar,
  MessageSquare,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  Tag,
  Send,
  Sparkles,
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../../../types/task';

interface TaskDetailDrawerProps {
  task: Task;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onAddComment?: (taskId: string, content: string) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';
type ActiveTab = 'overview' | 'subtasks' | 'comments' | 'print';

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
  onEdit,
  onDelete,
  onToggleSubtask,
  onStatusChange,
  onAddComment,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('normal');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [commentInput, setCommentInput] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);

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

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CircleCheck className="w-3.5 h-3.5" />
            <span>Đã hoàn thành</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Đang thực hiện</span>
          </span>
        );
      case 'review':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chờ duyệt / Nghiệm thu</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
            Tạm hoãn
          </span>
        );
      case 'todo':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            Chưa thực hiện
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            🔴 Khẩn cấp
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            🟠 Ưu tiên cao
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
            🔵 Trung bình
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border">
            ⚪ Thấp
          </span>
        );
    }
  };

  const handleCopyAll = () => {
    const text = `PHIẾU CÔNG VIỆC: ${task.title}
Mã: ${task.code}
Người thực hiện: ${task.assigneeName} (${task.assigneeCode || '—'})
Phòng ban: ${task.department}
Hạn chót: ${task.dueDate}
Tiến độ: ${task.progress}%
Trạng thái: ${task.status}
Nội dung: ${task.description || '—'}`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    if (onAddComment) {
      onAddComment(task.id, commentInput.trim());
    }
    setCommentInput('');
  };

  const completedSubtasks = (task.subtasks || []).filter((s) => s.completed).length;
  const totalSubtasks = (task.subtasks || []).length;

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
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                {task.code}
              </span>
              <h2 className="text-sm font-semibold truncate text-foreground">
                {task.title}
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

              {/* Prev / Next record navigation */}
              <div className="flex items-center border border-border rounded-lg bg-background p-0.5 mr-1">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={currentIndex <= 0}
                  className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Công việc trước"
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
                  title="Công việc tiếp theo"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Đóng (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-card text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'overview'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Tổng quan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('subtasks')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'subtasks'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>Nhiệm vụ con</span>
              {totalSubtasks > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-bold">
                  {completedSubtasks}/{totalSubtasks}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'comments'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>Trao đổi</span>
              {(task.comments?.length || 0) > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-bold">
                  {task.comments?.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('print')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'print'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In phiếu việc</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
            {activeTab === 'overview' && (
              <>
                {/* Hero Banner Card */}
                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-foreground">{task.title}</span>
                        {getPriorityBadge(task.priority)}
                        {getStatusBadge(task.status)}
                      </div>
                      {task.projectName && (
                        <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 mt-1">
                          <FolderKanban className="w-3.5 h-3.5" />
                          <span className="font-semibold">{task.projectName}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
                      >
                        {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedAll ? 'Đã sao chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Tiến độ thực hiện:</span>
                      <span className="font-bold text-primary tabular-nums">{task.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          task.progress === 100
                            ? 'bg-emerald-500'
                            : task.progress > 50
                            ? 'bg-primary'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Change Status Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs text-muted-foreground mr-1">Chuyển trạng thái:</span>
                    {(['todo', 'in_progress', 'review', 'completed'] as TaskStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => onStatusChange?.(task.id, st)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          task.status === st
                            ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                            : 'bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {st === 'todo'
                          ? 'Chưa làm'
                          : st === 'in_progress'
                          ? 'Đang làm'
                          : st === 'review'
                          ? 'Chờ duyệt'
                          : 'Hoàn thành ✓'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <span className="text-xs font-bold text-foreground block">Mô tả nội dung công việc:</span>
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                )}

                {/* Info Grid */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                    <User className="w-3.5 h-3.5" />
                    <span>Nhân sự & Thời hạn</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-border bg-card">
                      <span className="text-muted-foreground block mb-1">Người thực hiện chính</span>
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        <span>{task.assigneeName}</span>
                        {task.assigneeCode && (
                          <span className="text-[10px] font-mono bg-muted px-1 rounded border border-border/50 text-muted-foreground">
                            {task.assigneeCode}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-card">
                      <span className="text-muted-foreground block mb-1">Người giao việc</span>
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>{task.assignerName || 'Quản trị viên'}</span>
                        {task.assignerCode && (
                          <span className="text-[10px] font-mono bg-muted px-1 rounded border border-border/50 text-muted-foreground">
                            {task.assignerCode}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-card">
                      <span className="text-muted-foreground block mb-1">Phòng ban phụ trách</span>
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-500" />
                        <span>{task.department}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-card">
                      <span className="text-muted-foreground block mb-1">Hạn chót hoàn thành</span>
                      <div className="font-bold text-foreground flex items-center gap-1.5 tabular-nums">
                        <Calendar className="w-3.5 h-3.5 text-rose-500" />
                        <span>{task.dueDate}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-card">
                      <span className="text-muted-foreground block mb-1">Thời gian ước tính</span>
                      <div className="font-semibold text-foreground tabular-nums">
                        {task.estimatedHours ? `${task.estimatedHours} giờ làm việc` : '—'}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-card">
                      <span className="text-muted-foreground block mb-1">Điểm KPI đánh giá</span>
                      <div className="font-bold text-emerald-600 tabular-nums">
                        {task.kpiScore ? `${task.kpiScore} / 100 điểm` : 'Chưa chấm'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags & Note */}
                {(task.tags?.length || task.note) && (
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3 text-xs">
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Tag className="w-3.5 h-3.5 text-muted-foreground mr-1" />
                        {task.tags.map((t) => (
                          <span
                            key={t}
                            className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                    {task.note && (
                      <div className="pt-2 border-t border-border/50 text-muted-foreground italic">
                        💡 {task.note}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'subtasks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary" />
                    <span>Nhiệm vụ con & Checklist</span>
                  </h3>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {completedSubtasks} / {totalSubtasks} hoàn thành
                  </span>
                </div>

                <div className="space-y-2">
                  {task.subtasks && task.subtasks.length > 0 ? (
                    task.subtasks.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => onToggleSubtask?.(task.id, st.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          st.completed
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-muted-foreground'
                            : 'bg-card border-border hover:border-primary/50 text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={st.completed}
                            onChange={() => {}}
                            className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                          <span className={`text-xs font-medium truncate ${st.completed ? 'line-through opacity-75' : ''}`}>
                            {st.title}
                          </span>
                        </div>
                        {st.completed && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                            Xong
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-muted-foreground/60 border border-dashed border-border rounded-xl">
                      <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Chưa có nhiệm vụ con nào cho công việc này.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span>Trao đổi & Tiến độ công việc</span>
                  </h3>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  {(task.comments || []).length > 0 ? (
                    task.comments!.map((cm) => (
                      <div key={cm.id} className="p-3 rounded-xl bg-card border border-border space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{cm.author}</span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">{cm.createdAt}</span>
                        </div>
                        <p className="text-foreground leading-relaxed">{cm.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-muted-foreground/60 border border-dashed border-border rounded-xl">
                      <MessageSquare className="w-6 h-6 mx-auto mb-1 opacity-30" />
                      <p className="text-xs">Chưa có trao đổi nào.</p>
                    </div>
                  )}
                </div>

                {/* Comment Input */}
                <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Nhập phản hồi hoặc cập nhật tiến độ..."
                    className="flex-1 h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    className="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi</span>
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'print' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground">Bản in Phiếu Giao việc</h3>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In ngay</span>
                  </button>
                </div>

                {/* Printable Document Box */}
                <div className="p-6 rounded-xl border border-border bg-card text-foreground space-y-4 shadow-sm text-xs print:p-0 print:border-none">
                  <div className="text-center space-y-1 pb-4 border-b border-border">
                    <h2 className="text-base font-bold uppercase tracking-wider">PHIẾU GIAO VIỆC & THEO DÕI TIẾN ĐỘ</h2>
                    <p className="font-mono text-xs text-muted-foreground">Mã số: {task.code}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold block text-muted-foreground">Tiêu đề:</span>
                      <p className="font-bold text-sm text-foreground">{task.title}</p>
                    </div>
                    <div>
                      <span className="font-semibold block text-muted-foreground">Dự án:</span>
                      <p className="font-medium text-foreground">{task.projectName || '—'}</p>
                    </div>
                    <div>
                      <span className="font-semibold block text-muted-foreground">Người thực hiện:</span>
                      <p className="font-medium text-foreground">{task.assigneeName} ({task.assigneeCode || '—'})</p>
                    </div>
                    <div>
                      <span className="font-semibold block text-muted-foreground">Hạn hoàn thành:</span>
                      <p className="font-bold text-foreground tabular-nums">{task.dueDate}</p>
                    </div>
                  </div>

                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <span className="font-bold block">Danh mục hạng mục chi tiết:</span>
                      <table className="w-full border-collapse border border-border text-left">
                        <thead>
                          <tr className="bg-muted">
                            <th className="border border-border p-2 w-12 text-center">STT</th>
                            <th className="border border-border p-2">Nội dung nhiệm vụ</th>
                            <th className="border border-border p-2 w-24 text-center">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {task.subtasks.map((st, i) => (
                            <tr key={st.id}>
                              <td className="border border-border p-2 text-center tabular-nums">{i + 1}</td>
                              <td className="border border-border p-2">{st.title}</td>
                              <td className="border border-border p-2 text-center">{st.completed ? 'Đã xong' : 'Chưa'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-10 text-center">
                    <div className="space-y-12">
                      <span className="font-semibold block">NGƯỜI GIAO VIỆC</span>
                      <p className="font-bold">{task.assignerName || '—'}</p>
                    </div>
                    <div className="space-y-12">
                      <span className="font-semibold block">NGƯỜI NHẬN VIỆC</span>
                      <p className="font-bold">{task.assigneeName || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
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
                onClick={() => onEdit(task)}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <SquarePen className="w-3.5 h-3.5" />
                <span>Chỉnh sửa</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Xác nhận xoá công việc ${task.code} - "${task.title}"?`)) {
                    onDelete(task.id);
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
