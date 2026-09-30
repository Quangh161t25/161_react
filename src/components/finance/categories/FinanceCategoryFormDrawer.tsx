import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  FolderTree,
} from 'lucide-react';
import { FinanceCategory, CategoryType, MasterStatus } from '../../../types/financeMaster';

interface FinanceCategoryFormDrawerProps {
  mode: 'create' | 'edit';
  category?: FinanceCategory | null;
  allCategories?: FinanceCategory[];
  onClose: () => void;
  onSave: (category: FinanceCategory) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

export const FinanceCategoryFormDrawer: React.FC<FinanceCategoryFormDrawerProps> = ({
  mode,
  category,
  allCategories = [],
  onClose,
  onSave,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('normal');

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [level, setLevel] = useState<1 | 2>(1);
  const [parentCategory, setParentCategory] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<MasterStatus>('active');
  const [order, setOrder] = useState<number>(0);
  const [isPinned, setIsPinned] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate data when editing
  useEffect(() => {
    if (mode === 'edit' && category) {
      setCode(category.code || '');
      setName(category.name || '');
      setType(category.type || 'expense');
      setLevel(category.level || 1);
      setParentCategory(category.parentCategory || '');
      setDescription(category.description || '');
      setStatus(category.status || 'active');
      setOrder(category.order || 0);
      setIsPinned(!!category.isPinned);
    } else {
      // Auto-generate a new code
      const prefix = type === 'income' ? 'THU' : type === 'expense' ? 'CHI' : 'LC';
      const count = allCategories.filter((c) => c.type === type).length + 1;
      setCode(`DM-${prefix}-${String(count).padStart(2, '0')}`);
      setName('');
      setLevel(1);
      setParentCategory('');
      setDescription('');
      setStatus('active');
      setOrder((allCategories.length + 1) * 10);
      setIsPinned(false);
    }
  }, [mode, category, allCategories]);

  // Update code when type changes in create mode
  const handleTypeChange = (newType: CategoryType) => {
    setType(newType);
    if (mode === 'create') {
      const prefix = newType === 'income' ? 'THU' : newType === 'expense' ? 'CHI' : 'LC';
      const count = allCategories.filter((c) => c.type === newType).length + 1;
      setCode(`DM-${prefix}-${String(count).padStart(2, '0')}`);
      setParentCategory('');
    }
  };

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

  // Filter Level 1 categories for parent selection
  const parentOptions = allCategories.filter((c) => c.level === 1 && c.type === type);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Vui lòng nhập tên khoản mục';
    if (!code.trim()) newErrors.code = 'Vui lòng nhập mã khoản mục';
    if (level === 2 && !parentCategory.trim()) {
      newErrors.parentCategory = 'Vui lòng chọn nhóm cha cho khoản mục cấp 2';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: FinanceCategory = {
      id: category?.id || `cat-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      type,
      level,
      parentCategory: level === 2 ? parentCategory : '',
      description: description.trim(),
      status,
      order: Number(order) || 0,
      isPinned,
      createdBy: category?.createdBy || 'Lê Minh Công',
      createdAt: category?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(payload);
    onClose();
  };

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [name, code, type, level, parentCategory, description, status, order, isPinned]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 md:pl-10">
        <form
          onSubmit={handleSubmit}
          className={`${widthClasses[widthMode]} flex flex-col bg-card border-l border-border shadow-2xl transition-all duration-300 ease-in-out`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <FolderTree className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">
                {mode === 'create' ? 'Thêm khoản mục tài chính mới' : `Chỉnh sửa: ${category?.name}`}
              </h2>
            </div>

            <div className="flex items-center gap-1">
              {/* Width Controls */}
              <div className="hidden md:flex items-center border border-border rounded-lg bg-background p-0.5 mr-1">
                <button
                  type="button"
                  title="Gọn (440px)"
                  onClick={() => setWidthMode('narrow')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'narrow' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Vừa (580px)"
                  onClick={() => setWidthMode('normal')}
                  className={`p-1 rounded text-xs transition-colors ${
                    widthMode === 'normal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PanelRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Rộng (820px)"
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
                title="Đóng (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 text-xs">
            {/* 1. Category Type Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span>Loại khoản mục tài chính <span className="text-rose-500">*</span></span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    type === 'income'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 font-semibold shadow-sm'
                      : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <span className="text-sm">💰 Thu tiền</span>
                  <span className="text-[10px] opacity-75 mt-0.5">Doanh thu, tiền vào</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    type === 'expense'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-600 font-semibold shadow-sm'
                      : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <span className="text-sm">💸 Chi tiền</span>
                  <span className="text-[10px] opacity-75 mt-0.5">Chi phí, tiền ra</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('transfer')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    type === 'transfer'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-600 font-semibold shadow-sm'
                      : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <span className="text-sm">🔄 Luân chuyển</span>
                  <span className="text-[10px] opacity-75 mt-0.5">Nội bộ, nạp rút</span>
                </button>
              </div>
            </div>

            {/* 2. Level & Parent Hierarchy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border bg-muted/20">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  Cấp bậc danh mục <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLevel(1);
                      setParentCategory('');
                    }}
                    className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors ${
                      level === 1
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Cấp 1 (Nhóm cha)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLevel(2)}
                    className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors ${
                      level === 2
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Cấp 2 (Mục con)
                  </button>
                </div>
              </div>

              {level === 2 ? (
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">
                    Chọn nhóm cha (Cấp 1) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={parentCategory}
                    onChange={(e) => setParentCategory(e.target.value)}
                    className={`w-full h-9 px-3 rounded-lg border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                      errors.parentCategory ? 'border-rose-500' : 'border-border'
                    }`}
                  >
                    <option value="">-- Chọn nhóm danh mục cha --</option>
                    {parentOptions.map((opt) => (
                      <option key={opt.id} value={opt.name}>
                        {opt.name} ({opt.code})
                      </option>
                    ))}
                  </select>
                  {errors.parentCategory && (
                    <p className="text-[11px] text-rose-500">{errors.parentCategory}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5 flex flex-col justify-center">
                  <span className="text-muted-foreground">Phân cấp</span>
                  <div className="text-xs text-foreground font-medium p-2 rounded-lg bg-card border border-border">
                    Danh mục này là nhóm gốc cao nhất (Level 1).
                  </div>
                </div>
              )}
            </div>

            {/* 3. Code & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  Mã khoản mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VD: DM-CHI-01"
                  className={`w-full h-9 px-3 font-mono rounded-lg border bg-card text-foreground text-xs uppercase focus:outline-none focus:ring-1 focus:ring-primary ${
                    errors.code ? 'border-rose-500' : 'border-border'
                  }`}
                />
                {errors.code && <p className="text-[11px] text-rose-500">{errors.code}</p>}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="font-semibold text-foreground">
                  Tên khoản mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Chi phí lương & phụ cấp"
                  className={`w-full h-9 px-3 rounded-lg border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary ${
                    errors.name ? 'border-rose-500' : 'border-border'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
              </div>
            </div>

            {/* 4. Order & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Thứ tự sắp xếp</label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  placeholder="VD: 10, 20, 30"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Trạng thái sử dụng</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MasterStatus)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="active">Đang sử dụng (Active)</option>
                  <option value="inactive">Tạm ngưng sử dụng (Inactive)</option>
                </select>
              </div>
            </div>

            {/* 5. Description */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Mô tả / Hướng dẫn định khoản</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Ghi chú chi tiết mục đích sử dụng hoặc các chứng từ cần kèm theo..."
                className="w-full p-3 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-3">
            <div className="text-[11px] text-muted-foreground hidden sm:block">
              Phím tắt: <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">Ctrl+S</kbd> để lưu
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
              >
                Huỷ
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{mode === 'create' ? 'Tạo khoản mục' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
