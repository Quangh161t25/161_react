import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Workflow,
  Plus,
  Trash2,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { WorkflowTemplate, WorkflowStep } from '../../../types/task';

interface WorkflowFormDrawerProps {
  mode: 'create' | 'edit';
  workflow?: WorkflowTemplate | null;
  allWorkflows?: WorkflowTemplate[];
  onClose: () => void;
  onSave: (workflow: WorkflowTemplate) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

export const WorkflowFormDrawer: React.FC<WorkflowFormDrawerProps> = ({
  mode,
  workflow,
  allWorkflows = [],
  onClose,
  onSave,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('wide');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('wide');

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Nhân sự');
  const [department, setDepartment] = useState('Phòng Nhân sự');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  // Step Add Sub-form
  const [stepTitle, setStepTitle] = useState('');
  const [stepRole, setStepRole] = useState('Trưởng bộ phận');
  const [stepDays, setStepDays] = useState<number>(1);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isInitializedRef = useRef(false);
  const prevEditIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const currentEditId = mode === 'edit' && workflow ? (workflow.id || workflow.code) : null;
    const justMounted = !isInitializedRef.current;
    const editTargetChanged = currentEditId !== prevEditIdRef.current;

    // Only initialize when drawer is first mounted OR when switching editing workflow
    if (!justMounted && !editTargetChanged) {
      return;
    }

    isInitializedRef.current = true;
    prevEditIdRef.current = currentEditId;

    if (mode === 'edit' && workflow) {
      setCode(workflow.code || '');
      setName(workflow.name || '');
      setDescription(workflow.description || '');
      setCategory(workflow.category || 'Nhân sự');
      setDepartment(workflow.department || 'Phòng Nhân sự');
      setStatus(workflow.status || 'active');
      setSteps(workflow.steps || []);
    } else {
      const nextNum = allWorkflows.length + 1;
      setCode(`QT-${String(nextNum).padStart(3, '0')}`);
      setName('');
      setDescription('');
      setCategory('Chung');
      setDepartment('Tất cả phòng ban');
      setStatus('active');
      setSteps([
        {
          stepNumber: 1,
          title: 'Khởi tạo & Soạn thảo yêu cầu',
          defaultAssigneeRole: 'Người đề xuất',
          estimatedDays: 1,
          checklist: ['Chuẩn bị hồ sơ chứng từ'],
          isRequired: true,
        },
        {
          stepNumber: 2,
          title: 'Xem xét & Phê duyệt',
          defaultAssigneeRole: 'Trưởng bộ phận',
          estimatedDays: 2,
          checklist: ['Kiểm tra tính hợp lệ', 'Ký duyệt'],
          isRequired: true,
        },
      ]);
    }
  }, [mode, workflow, allWorkflows]);

  const handleAddStep = () => {
    if (!stepTitle.trim()) return;
    setSteps([
      ...steps,
      {
        stepNumber: steps.length + 1,
        title: stepTitle.trim(),
        defaultAssigneeRole: stepRole.trim() || 'Người phụ trách',
        estimatedDays: Number(stepDays) || 1,
        isRequired: true,
      },
    ]);
    setStepTitle('');
  };

  const handleRemoveStep = (idx: number) => {
    const next = steps.filter((_, i) => i !== idx).map((st, i) => ({ ...st, stepNumber: i + 1 }));
    setSteps(next);
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
    if (!name.trim()) errs.name = 'Vui lòng nhập tên quy trình';
    if (steps.length === 0) errs.steps = 'Quy trình phải có ít nhất 1 bước thực hiện';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const payload: WorkflowTemplate = {
      id: workflow?.id || 'wf_' + Date.now(),
      code: code.trim(),
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      department: department.trim(),
      status,
      steps,
      usageCount: workflow?.usageCount || 0,
      createdAt: workflow?.createdAt || nowStr,
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
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <Workflow className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground leading-tight">
                  {mode === 'create' ? 'Tạo Mẫu Quy trình mới' : `Cập nhật Quy trình: ${code}`}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Định nghĩa các bước tuần tự, SLA hoàn thành và phân quyền phê duyệt
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Mã quy trình <span className="text-rose-500">*</span>
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
                  Tên quy trình chuẩn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Quy trình Onboarding Nhân viên mới..."
                  className={`w-full h-9 px-3 rounded-lg border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                    errors.name ? 'border-rose-500' : 'border-border'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Mô tả mục đích áp dụng</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả phạm vi áp dụng và tiêu chuẩn chất lượng..."
                className="w-full p-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Phân loại</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="VD: Nhân sự, Mua sắm..."
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Phòng ban áp dụng</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Tất cả hoặc phòng ban"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Trạng thái</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full h-9 px-2 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="active">🟢 Đang áp dụng</option>
                  <option value="inactive">⚪ Tạm ngưng</option>
                </select>
              </div>
            </div>

            {/* Step Builder */}
            <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Workflow className="w-4 h-4 text-primary" />
                  <span>Các bước thực hiện theo quy trình ({steps.length} bước)</span>
                </label>
              </div>

              {/* Add Step input row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                <input
                  type="text"
                  value={stepTitle}
                  onChange={(e) => setStepTitle(e.target.value)}
                  placeholder="Tên bước (VD: Khảo sát báo giá...)"
                  className="sm:col-span-2 h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="text"
                  value={stepRole}
                  onChange={(e) => setStepRole(e.target.value)}
                  placeholder="Chức danh thực hiện..."
                  className="h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    value={stepDays}
                    onChange={(e) => setStepDays(Number(e.target.value))}
                    placeholder="Số ngày"
                    title="Số ngày SLA"
                    className="w-16 h-9 px-2 text-center rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="flex-1 h-9 px-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>

              {/* Step list */}
              <div className="space-y-2 pt-2">
                {steps.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/80 bg-muted/20 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs shrink-0">
                        {st.stepNumber}
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-foreground block truncate">{st.title}</span>
                        <span className="text-muted-foreground text-[11px]">
                          Phụ trách: <strong>{st.defaultAssigneeRole}</strong> • Thời gian SLA: <strong>{st.estimatedDays} ngày</strong>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="p-1 rounded hover:bg-rose-50 text-muted-foreground hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-medium"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{mode === 'create' ? 'Tạo quy trình' : 'Lưu thay đổi'}</span>
            </button>
          </div>
      </div>
    </>
  );
};
