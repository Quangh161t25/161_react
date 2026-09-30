import React from 'react';
import {
  FolderKanban,
  User,
  Calendar,
  Plus,
  CheckSquare,
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../../../types/task';

interface TaskKanbanViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onAddNewTask?: (defaultStatus?: TaskStatus) => void;
}

const KANBAN_COLUMNS: Array<{
  id: TaskStatus;
  label: string;
  color: string;
  bgLight: string;
  borderColor: string;
}> = [
  {
    id: 'todo',
    label: 'Chưa thực hiện',
    color: 'text-slate-600 dark:text-slate-400',
    bgLight: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
  },
  {
    id: 'in_progress',
    label: 'Đang thực hiện',
    color: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  {
    id: 'review',
    label: 'Chờ duyệt / Nghiệm thu',
    color: 'text-blue-600 dark:text-blue-400',
    bgLight: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    id: 'completed',
    label: 'Đã hoàn thành',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
];

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({
  tasks,
  onSelectTask,
  onStatusChange,
  onAddNewTask,
}) => {
  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            Khẩn cấp
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Ưu tiên cao
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
            Trung bình
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
            Thấp
          </span>
        );
    }
  };

  const isOverdue = (dueDate: string, status: TaskStatus) => {
    if (status === 'completed' || status === 'cancelled') return false;
    if (!dueDate) return false;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return dueDate < today;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start pb-6">
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            className="flex flex-col bg-muted/40 rounded-2xl border border-border/70 p-3 min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-1 pb-3 mb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.bgLight.replace('/10', '')} bg-current ${col.color}`} />
                <h3 className="text-xs font-bold text-foreground">{col.label}</h3>
                <span
                  className={`text-[11px] font-bold px-2 py-0.2 rounded-full ${col.bgLight} ${col.color} border ${col.borderColor}`}
                >
                  {colTasks.length}
                </span>
              </div>

              {onAddNewTask && (
                <button
                  type="button"
                  onClick={() => onAddNewTask(col.id)}
                  title={`Thêm công việc vào mục ${col.label}`}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Column Task Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {colTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/60 border border-dashed border-border/60 rounded-xl">
                  <CheckSquare className="w-6 h-6 mb-1 opacity-30" />
                  <p className="text-xs">Chưa có công việc</p>
                </div>
              ) : (
                colTasks.map((task) => {
                  const overdue = isOverdue(task.dueDate, task.status);
                  const completedSubtasks = (task.subtasks || []).filter((s) => s.completed).length;
                  const totalSubtasks = (task.subtasks || []).length;

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="group bg-card rounded-xl p-3.5 border border-border hover:border-primary/50 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3"
                    >
                      {/* Top: Code & Priority */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {task.code}
                        </span>
                        <div>{getPriorityBadge(task.priority)}</div>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {task.title}
                      </h4>

                      {/* Project badge if any */}
                      {task.projectName && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md truncate">
                          <FolderKanban className="w-3 h-3 text-purple-500 shrink-0" />
                          <span className="truncate">{task.projectName}</span>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Tiến độ</span>
                          <span className="font-semibold tabular-nums text-foreground">{task.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
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

                      {/* Bottom Meta */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                        {/* Assignee */}
                        <div className="flex items-center gap-1.5 truncate max-w-[145px]" title={task.assigneeName ? `${task.assigneeName} (${task.assigneeCode || ''})` : 'Chưa giao'}>
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                            {task.assigneeName ? task.assigneeName.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                          </div>
                          <span className="truncate text-foreground font-medium text-[11px]">{task.assigneeName || 'Chưa giao'}</span>
                          {task.assigneeCode && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-muted text-muted-foreground shrink-0">
                              {task.assigneeCode}
                            </span>
                          )}
                        </div>

                        {/* Due Date */}
                        <div
                          className={`flex items-center gap-1 shrink-0 ${
                            overdue ? 'text-rose-600 font-bold' : 'text-muted-foreground'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          <span className="tabular-nums">{task.dueDate}</span>
                        </div>
                      </div>

                      {/* Subtask Counter if any */}
                      {totalSubtasks > 0 && (
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                          <span>Nhiệm vụ con:</span>
                          <span className="font-semibold text-foreground tabular-nums">
                            {completedSubtasks}/{totalSubtasks}
                          </span>
                        </div>
                      )}

                      {/* Quick Move Status Buttons (Hover Actions) */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="pt-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity border-t border-border/40"
                      >
                        {col.id !== 'todo' && (
                          <button
                            type="button"
                            onClick={() => onStatusChange(task.id, 'todo')}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                          >
                            ← Chưa làm
                          </button>
                        )}
                        {col.id !== 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => onStatusChange(task.id, 'in_progress')}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                          >
                            Đang làm
                          </button>
                        )}
                        {col.id !== 'review' && (
                          <button
                            type="button"
                            onClick={() => onStatusChange(task.id, 'review')}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                          >
                            Duyệt
                          </button>
                        )}
                        {col.id !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => onStatusChange(task.id, 'completed')}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-semibold"
                          >
                            Xong ✓
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
