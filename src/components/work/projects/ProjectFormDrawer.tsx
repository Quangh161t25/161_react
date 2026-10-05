import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  FolderKanban,
  Building2,
  User,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Project, ProjectPriority, ProjectStatus } from '../../../types/task';
import { Employee } from '../../../types/employee';
import { Counterparty } from '../../../types/financeMaster';
import { employeeService } from '../../../services/employeeService';
import { counterpartyService } from '../../../services/financeMasterService';

interface ProjectFormDrawerProps {
  mode: 'create' | 'edit';
  project?: Project | null;
  allProjects?: Project[];
  onClose: () => void;
  onSave: (project: Project) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

export const ProjectFormDrawer: React.FC<ProjectFormDrawerProps> = ({
  mode,
  project,
  allProjects = [],
  onClose,
  onSave,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('wide');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('wide');

  const [employees, setEmployees] = useState<Employee[]>(() => employeeService.getInitialEmployees());
  const [counterparties, setCounterparties] = useState<Counterparty[]>(() => counterpartyService.getInitialCounterparties());

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      employeeService.fetchFromSheet().catch(() => employeeService.getInitialEmployees()),
      counterpartyService.fetchFromSheet().catch(() => counterpartyService.getInitialCounterparties()),
    ]).then(([emps, cps]) => {
      if (isMounted) {
        if (emps?.length) setEmployees(emps);
        if (Array.isArray(cps)) setCounterparties(cps);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [managerId, setManagerId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState<number>(50000000);
  const [spentAmount, setSpentAmount] = useState<number>(0);
  const [status, setStatus] = useState<ProjectStatus>('planning');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [progress, setProgress] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isInitializedRef = useRef(false);
  const prevEditIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const currentEditId = mode === 'edit' && project ? (project.id || project.code) : null;
    const justMounted = !isInitializedRef.current;
    const editTargetChanged = currentEditId !== prevEditIdRef.current;

    // Only initialize when drawer is first mounted OR when switching editing project
    if (!justMounted && !editTargetChanged) {
      return;
    }

    isInitializedRef.current = true;
    prevEditIdRef.current = currentEditId;

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nextThreeMonths = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const endStr = `${nextThreeMonths.getFullYear()}-${String(nextThreeMonths.getMonth() + 1).padStart(2, '0')}-${String(nextThreeMonths.getDate()).padStart(2, '0')}`;

    if (mode === 'edit' && project) {
      setCode(project.code || '');
      setName(project.name || '');
      setDescription(project.description || '');
      setManagerId(project.managerId || project.managerCode || project.managerName || '');
      setCustomerId(project.customerId || project.customerCode || project.customerName || '');
      setDepartment(project.department || '');
      setStartDate(project.startDate || today);
      setEndDate(project.endDate || endStr);
      setBudget(project.budget || 0);
      setSpentAmount(project.spentAmount || 0);
      setStatus(project.status || 'in_progress');
      setPriority(project.priority || 'medium');
      setProgress(project.progress || 0);
      setTags(project.tags || []);
    } else {
      const nextNum = allProjects.length + 1;
      setCode(`DA-${String(nextNum).padStart(3, '0')}`);
      setName('');
      setDescription('');
      setManagerId(employees[0]?.id || '');
      setCustomerId('');
      setDepartment(employees[0]?.department || 'Phòng Kỹ thuật & CNTT');
      setStartDate(today);
      setEndDate(endStr);
      setBudget(50000000);
      setSpentAmount(0);
      setStatus('planning');
      setPriority('medium');
      setProgress(0);
      setTags(['Dự án mới']);
    }
  }, [mode, project, allProjects, employees]);

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

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Vui lòng nhập tên dự án';
    if (!endDate) errs.endDate = 'Vui lòng chọn ngày dự kiến kết thúc';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const matchedManager = employees.find(
      (emp) => emp.id === managerId || emp.code === managerId || emp.name === managerId
    );
    const matchedCustomer = counterparties.find(
      (cp) => cp.id === customerId || cp.code === customerId || cp.name === customerId
    );

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const payload: Project = {
      id: project?.id || 'proj_' + Date.now(),
      code: code.trim(),
      name: name.trim(),
      description: description.trim(),
      managerId: matchedManager ? matchedManager.id : undefined,
      managerCode: matchedManager ? matchedManager.code : undefined,
      managerName: matchedManager ? matchedManager.name : 'Chưa chỉ định',
      customerId: matchedCustomer ? matchedCustomer.id : undefined,
      customerCode: matchedCustomer ? matchedCustomer.code : undefined,
      customerName: matchedCustomer ? matchedCustomer.name : undefined,
      department: department || (matchedManager ? matchedManager.department : 'Chung'),
      startDate,
      endDate,
      budget: Number(budget) || 0,
      spentAmount: Number(spentAmount) || 0,
      status,
      priority,
      progress: status === 'completed' ? 100 : Number(progress) || 0,
      tags,
      createdAt: project?.createdAt || nowStr,
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
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground leading-tight">
                  {mode === 'create' ? 'Khởi tạo Dự án mới' : `Cập nhật Dự án: ${code}`}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Quản lý ngân sách, nhân sự chỉ đạo và thời hạn bàn giao
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
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar">
            {/* 1. Code & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Mã dự án <span className="text-rose-500">*</span>
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
                  Tên dự án <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Triển khai phần mềm ERP Giai đoạn 1..."
                  className={`w-full h-9 px-3 rounded-lg border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                    errors.name ? 'border-rose-500' : 'border-border'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Mục tiêu & Phạm vi dự án</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả phạm vi bàn giao, kết quả mong đợi..."
                className="w-full p-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* 2. Manager & Customer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-muted/20">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Quản trị dự án (PM) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Chọn nhân sự PM...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.code ? `(${emp.code})` : ''} - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  Khách hàng / Đối tác liên quan
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">(Nội bộ công ty)</option>
                  {counterparties.map((cp) => (
                    <option key={cp.id} value={cp.id}>
                      [{cp.code}] {cp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Status, Priority, Budget & Dates */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Trạng thái</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full h-9 px-2 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="planning">Lập kế hoạch</option>
                  <option value="in_progress">Đang triển khai</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="on_hold">Tạm dừng</option>
                  <option value="cancelled">Đã huỷ</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Mức ưu tiên</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                  className="w-full h-9 px-2 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="high">🟠 Cao</option>
                  <option value="medium">🔵 Trung bình</option>
                  <option value="low">⚪ Thấp</option>
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
                  Ngày kết thúc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* 4. Budget & Spending */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-card">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Ngân sách dự kiến (VNĐ)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Chi phí đã giải ngân (VNĐ)</label>
                <input
                  type="number"
                  value={spentAmount}
                  onChange={(e) => setSpentAmount(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* 5. Progress */}
            <div className="space-y-2 p-3.5 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Tiến độ tổng thể dự án:</span>
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

            {/* 6. Tags */}
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
                  placeholder="Nhập tag..."
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
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full border border-purple-500/20"
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
              <span>{mode === 'create' ? 'Tạo dự án' : 'Lưu thay đổi'}</span>
            </button>
          </div>
      </div>
    </>
  );
};
