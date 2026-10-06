import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  ListChecks,
  User,
  Calendar,
  CheckCircle2,
  FolderKanban,
  Search,
} from 'lucide-react';
import { Task, TaskSubtask } from '../../../types/task';
import { Employee } from '../../../types/employee';

interface SubtaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, subtask: TaskSubtask, isEdit: boolean) => void;
  tasks: Task[];
  defaultTaskId?: string;
  subtaskToEdit?: { taskId: string; subtask: TaskSubtask } | null;
  employees: Employee[];
}

export const SubtaskFormModal: React.FC<SubtaskFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tasks,
  defaultTaskId,
  subtaskToEdit,
  employees,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [completed, setCompleted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [taskSearch, setTaskSearch] = useState('');

  const isEdit = !!subtaskToEdit;
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = false;
      return;
    }

    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    if (subtaskToEdit) {
      setSelectedTaskId(subtaskToEdit.taskId);
      setTitle(subtaskToEdit.subtask.title || '');
      setAssignee(subtaskToEdit.subtask.assignee || '');
      setDueDate(subtaskToEdit.subtask.dueDate || '');
      setCompleted(!!subtaskToEdit.subtask.completed);
    } else {
      const initialTaskId = defaultTaskId || (tasks.length > 0 ? tasks[0].id : '');
      setSelectedTaskId(initialTaskId);
      setTitle('');
      const parentTask = tasks.find((t) => t.id === initialTaskId);
      setAssignee(parentTask?.assigneeName || employees[0]?.name || '');
      setDueDate(parentTask?.dueDate || new Date().toISOString().slice(0, 10));
      setCompleted(false);
    }
    setErrors({});
    setTaskSearch('');
  }, [isOpen, subtaskToEdit, defaultTaskId, tasks, employees]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!selectedTaskId) {
      newErrors.taskId = 'Vui lòng chọn công việc chính';
    }
    if (!title.trim()) {
      newErrors.title = 'Vui lòng nhập tên công việc con';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const subtaskPayload: TaskSubtask = {
      id: subtaskToEdit ? subtaskToEdit.subtask.id : `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      completed,
      assignee: assignee.trim() || undefined,
      dueDate: dueDate || undefined,
    };

    onSave(selectedTaskId, subtaskPayload, isEdit);
    onClose();
  };

  const filteredTasks = tasks.filter((t) => {
    if (!taskSearch.trim()) return true;
    const q = taskSearch.toLowerCase().trim();
    return (
      (t.title || '').toLowerCase().includes(q) ||
      (t.code || '').toLowerCase().includes(q) ||
      (t.projectName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-xs">
      <div
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
              <ListChecks className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isEdit ? 'Chỉnh sửa Công việc con' : 'Thêm mới Công việc con'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEdit ? 'Cập nhật nội dung và phân công đầu việc con' : 'Tạo mới một đầu việc con thuộc công việc chính'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4.5 custom-scrollbar">
          {/* Parent Task Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-primary" />
              <span>Thuộc công việc chính</span>
              <span className="text-destructive">*</span>
            </label>

            {isEdit ? (
              <div className="p-2.5 rounded-xl border border-border bg-muted/50 text-xs font-medium text-foreground">
                {(() => {
                  const t = tasks.find((x) => x.id === selectedTaskId);
                  return t ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-primary">[{t.code}] {t.title}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{t.projectName || t.department}</span>
                    </div>
                  ) : selectedTaskId;
                })()}
              </div>
            ) : (
              <div className="space-y-1.5">
                {tasks.length > 5 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm nhanh công việc chính..."
                      value={taskSearch}
                      onChange={(e) => setTaskSearch(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
                <select
                  value={selectedTaskId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedTaskId(nextId);
                    const chosen = tasks.find((t) => t.id === nextId);
                    if (chosen && !assignee) {
                      setAssignee(chosen.assigneeName || '');
                    }
                    if (chosen && !dueDate) {
                      setDueDate(chosen.dueDate || '');
                    }
                    if (errors.taskId) setErrors((prev) => ({ ...prev, taskId: '' }));
                  }}
                  className={`w-full h-9 px-3 text-xs rounded-xl border bg-background text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    errors.taskId ? 'border-destructive' : 'border-border'
                  }`}
                >
                  <option value="">-- Chọn công việc chính --</option>
                  {filteredTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.code}] {t.title} {t.projectName ? `(${t.projectName})` : ''}
                    </option>
                  ))}
                </select>
                {errors.taskId && <p className="text-[11px] text-destructive">{errors.taskId}</p>}
              </div>
            )}
          </div>

          {/* Subtask Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>Tên đầu việc con</span>
              <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Kiểm tra tính năng tạo hóa đơn, Soạn thảo hợp đồng..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              className={`w-full h-9 px-3 text-xs rounded-xl border bg-background text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.title ? 'border-destructive' : 'border-border'
              }`}
              autoFocus
            />
            {errors.title && <p className="text-[11px] text-destructive">{errors.title}</p>}
          </div>

          {/* Grid: Assignee & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Người thực hiện</span>
              </label>
              <input
                type="text"
                list="subtask-employees-list"
                placeholder="Nhập hoặc chọn nhân viên"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <datalist id="subtask-employees-list">
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.code ? `${emp.code} - ` : ''}{emp.department || ''}
                  </option>
                ))}
              </datalist>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Hạn chót</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Completed Checkbox */}
          <div className="pt-2">
            <label className="inline-flex items-center gap-2.5 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors w-full">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-border"
              />
              <div className="flex-1">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${completed ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                  <span>Đánh dấu đã hoàn thành</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Tiến độ công việc chính sẽ tự động được cập nhật tương ứng.
                </p>
              </div>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border bg-muted/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isEdit ? 'Cập nhật' : 'Thêm mới'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
