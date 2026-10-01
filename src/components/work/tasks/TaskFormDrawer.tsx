import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  CheckSquare,
  Plus,
  Trash2,
  User,
  Building2,
  FolderKanban,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  Clock,
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, TaskSubtask, Project } from '../../../types/task';
import { Employee } from '../../../types/employee';
import { employeeService } from '../../../services/employeeService';
import { projectService } from '../../../services/taskService';

interface TaskFormDrawerProps {
  mode: 'create' | 'edit';
  task?: Task | null;
  allTasks?: Task[];
  defaultStatus?: TaskStatus;
  defaultDate?: string;
  onClose: () => void;
  onSave: (task: Task) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

export const TaskFormDrawer: React.FC<TaskFormDrawerProps> = ({
  mode,
  task,
  allTasks = [],
  defaultStatus = 'todo',
  defaultDate,
  onClose,
  onSave,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('wide');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('wide');

  // Master Data
  const [employees, setEmployees] = useState<Employee[]>(() =>
    employeeService.getInitialEmployees()
  );
  const [projects, setProjects] = useState<Project[]>(() =>
    projectService.getInitialProjects()
  );

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      employeeService.fetchFromSheet().catch(() => employeeService.getInitialEmployees()),
      projectService.fetchFromSheet().catch(() => projectService.getInitialProjects()),
    ]).then(([emps, projs]) => {
      if (isMounted) {
        if (emps?.length) setEmployees(emps);
        if (Array.isArray(projs)) setProjects(projs);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const departmentsList = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));
  }, [employees]);

  // Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [department, setDepartment] = useState('');
  const [assignerId, setAssignerId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [progress, setProgress] = useState<number>(0);
  const [estimatedHours, setEstimatedHours] = useState<number>(8);
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nextWeekDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextWeek = `${nextWeekDate.getFullYear()}-${String(nextWeekDate.getMonth() + 1).padStart(2, '0')}-${String(nextWeekDate.getDate()).padStart(2, '0')}`;

    if (mode === 'edit' && task) {
      setCode(task.code || '');
      setTitle(task.title || '');
      setDescription(task.description || '');
      setProjectId(task.projectId || '');
      setDepartment(task.department || '');
      setAssignerId(task.assignerId || task.assignerCode || task.assignerName || '');
      setAssigneeId(task.assigneeId || task.assigneeCode || task.assigneeName || '');
      setCollaborators(task.collaborators || []);
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'todo');
      setStartDate(task.startDate || today);
      setDueDate(task.dueDate || nextWeek);
      setProgress(task.progress || 0);
      setEstimatedHours(task.estimatedHours || 8);
      setSubtasks(task.subtasks || []);
      setTags(task.tags || []);
      setNote(task.note || '');
    } else {
      const nextNum = allTasks.length + 1;
      setCode(`CV-${String(nextNum).padStart(3, '0')}`);
      setTitle('');
      setDescription('');
      setProjectId('');
      setDepartment(departmentsList[0] || 'Phòng Kỹ thuật & CNTT');
      setAssignerId(employees[0]?.id || '');
      setAssigneeId(employees[0]?.id || '');
      setCollaborators([]);
      setPriority('medium');
      setStatus(defaultStatus);
      setStartDate(today);
      setDueDate(defaultDate || nextWeek);
      setProgress(0);
      setEstimatedHours(8);
      setSubtasks([]);
      setTags(['Công việc']);
      setNote('');
    }
  }, [mode, task, allTasks, defaultStatus, defaultDate, employees, departmentsList]);

  // Subtasks handler
  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: 'st_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        title: subtaskInput.trim(),
        completed: false,
      },
    ]);
    setSubtaskInput('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleToggleSubtask = (id: string) => {
    const updated = subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s));
    setSubtasks(updated);
    // Auto update progress based on subtasks if any
    if (updated.length > 0) {
      const doneCount = updated.filter((s) => s.completed).length;
      setProgress(Math.round((doneCount / updated.length) * 100));
    }
  };

  // Tags handler
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const toggleFullscreen = () => {
    if (widthMode === 'fullscreen') {
      setWidthMode(prevWidthMode);
    } else {
      setPrevWidthMode(widthMode);
      setWidthMode('fullscreen');
    }
  };

  const getDrawerWidthStyle = () => {
    switch (widthMode) {
      case 'narrow':
        return 'min(540px, 100vw)';
      case 'normal':
        return 'min(768px, 100vw)';
      case 'wide':
        return 'min(1080px, 100vw)';
      case 'fullscreen':
        return '100vw';
      default:
        return 'min(1080px, 100vw)';
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Vui lòng nhập tên/tiêu đề công việc';
    if (!dueDate) errs.dueDate = 'Vui lòng chọn hạn chót hoàn thành';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const matchedProject = projects.find((p) => p.id === projectId || p.code === projectId);
    const matchedAssigner = employees.find(
      (emp) => emp.id === assignerId || emp.code === assignerId || emp.name === assignerId
    );
    const matchedAssignee = employees.find(
      (emp) => emp.id === assigneeId || emp.code === assigneeId || emp.name === assigneeId
    );

    const now = new Date();
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const payload: Task = {
      id: task?.id || 'task_' + Date.now(),
      code: code.trim(),
      title: title.trim(),
      description: description.trim(),
      projectId: matchedProject ? matchedProject.id : undefined,
      projectCode: matchedProject ? matchedProject.code : undefined,
      projectName: matchedProject ? matchedProject.name : undefined,
      department: department || (matchedAssignee ? matchedAssignee.department : 'Chung'),
      assignerId: matchedAssigner ? matchedAssigner.id : undefined,
      assignerCode: matchedAssigner ? matchedAssigner.code : undefined,
      assignerName: matchedAssigner ? matchedAssigner.name : 'Quản trị viên',
      assigneeId: matchedAssignee ? matchedAssignee.id : undefined,
      assigneeCode: matchedAssignee ? matchedAssignee.code : undefined,
      assigneeName: matchedAssignee ? matchedAssignee.name : 'Chưa phân công',
      collaborators,
      priority,
      status,
      startDate: startDate || nowStr.split(' ')[0],
      dueDate,
      completedAt: status === 'completed' ? (task?.completedAt || nowStr) : undefined,
      progress: status === 'completed' ? 100 : progress,
      estimatedHours: Number(estimatedHours) || 0,
      subtasks,
      tags,
      note: note.trim() || undefined,
      createdAt: task?.createdAt || nowStr,
      updatedAt: nowStr,
    };

    onSave(payload);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Main Drawer Container */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex flex-col bg-card border-l border-border shadow-2xl transition-[width] duration-300 ease-in-out"
        style={{
          width: getDrawerWidthStyle(),
          maxWidth: '100vw',
        }}
      >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground leading-tight">
                  {mode === 'create' ? 'Thêm công việc mới' : `Cập nhật công việc: ${code}`}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Phân công nhiệm vụ, thiết lập tiến độ và thời hạn hoàn thành
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
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

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar">
            {/* 1. Basic Info */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Mã công việc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-card font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary font-bold text-primary"
                    required
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Tên / Tiêu đề công việc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Thiết kế giao diện báo cáo doanh thu..."
                    className={`w-full h-9 px-3 rounded-lg border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                      errors.title ? 'border-rose-500' : 'border-border'
                    }`}
                  />
                  {errors.title && <p className="text-[11px] text-rose-500">{errors.title}</p>}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Mô tả chi tiết nội dung công việc</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả mục tiêu, yêu cầu đầu ra và tài liệu đính kèm..."
                  className="w-full p-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* 2. Project & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-muted/20">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-purple-500" />
                  Dự án trực thuộc
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">(Không thuộc dự án nào)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  Phòng ban phụ trách
                </label>
                <input
                  type="text"
                  list="task-dept-list"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Chọn hoặc nhập phòng ban..."
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <datalist id="task-dept-list">
                  {departmentsList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            {/* 3. Assignees & Collaborators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-muted/20">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Người thực hiện chính <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => {
                    setAssigneeId(e.target.value);
                    const emp = employees.find((x) => x.id === e.target.value);
                    if (emp?.department && !department) {
                      setDepartment(emp.department);
                    }
                  }}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Chọn nhân sự phụ trách...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.code ? `(${emp.code})` : ''} - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Người giao việc
                </label>
                <select
                  value={assignerId}
                  onChange={(e) => setAssignerId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Chọn người giao việc...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.code ? `(${emp.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Priority, Status, Dates & Hours */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Mức độ ưu tiên</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full h-9 px-2 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="urgent">🔴 Khẩn cấp</option>
                  <option value="high">🟠 Ưu tiên cao</option>
                  <option value="medium">🔵 Trung bình</option>
                  <option value="low">⚪ Thấp</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Trạng thái</label>
                <select
                  value={status}
                  onChange={(e) => {
                    const st = e.target.value as TaskStatus;
                    setStatus(st);
                    if (st === 'completed') setProgress(100);
                  }}
                  className="w-full h-9 px-2 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="todo">Chưa thực hiện</option>
                  <option value="in_progress">Đang thực hiện</option>
                  <option value="review">Chờ duyệt / Nghiệm thu</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="cancelled">Tạm hoãn / Huỷ</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Hạn chót (Deadline) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`w-full h-9 px-2 rounded-lg border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                    errors.dueDate ? 'border-rose-500' : 'border-border'
                  }`}
                />
              </div>
            </div>

            {/* 5. Progress Slider & Estimated Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl border border-border bg-card">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Tiến độ hoàn thành:</span>
                  <span className="font-bold text-primary tabular-nums">{progress}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  Số giờ ước tính (Hours)
                </label>
                <input
                  type="number"
                  min={0}
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
                />
              </div>
            </div>

            {/* 6. Subtasks Checklist Builder */}
            <div className="space-y-3 p-3.5 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-primary" />
                  <span>Danh sách nhiệm vụ con (Checklist)</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {subtasks.filter((s) => s.completed).length}/{subtasks.length} xong
                </span>
              </div>

              {/* Subtask Input Add */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Nhập tên việc con và nhấn Enter..."
                  className="flex-1 h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </div>

              {/* Subtask Items */}
              <div className="space-y-1.5 pt-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-xs"
                  >
                    <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(st.id)}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                      <span className={`truncate ${st.completed ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>
                        {st.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-muted-foreground hover:text-rose-500 p-1 rounded transition-colors"
                      title="Xoá việc con"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Tags & Note */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nhãn phân loại (Tags)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="VD: UI/UX, Báo cáo, Backend..."
                    className="flex-1 h-8 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="h-8 px-2.5 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-semibold"
                  >
                    Thêm tag
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-rose-500 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Ghi chú bổ sung</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú nội bộ hoặc yêu cầu nghiệm thu..."
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{mode === 'create' ? 'Tạo công việc' : 'Lưu thay đổi'}</span>
            </button>
          </div>
      </div>
    </>
  );
};
