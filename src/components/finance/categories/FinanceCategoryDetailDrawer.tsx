import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Trash2,
  FolderTree,
  Layers,
  Copy,
  Check,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  User,
  Clock,
  FileText,
} from 'lucide-react';
import { FinanceCategory } from '../../../types/financeMaster';

interface FinanceCategoryDetailDrawerProps {
  category: FinanceCategory;
  currentIndex: number;
  totalCount: number;
  allCategories?: FinanceCategory[];
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onEdit: (cat: FinanceCategory) => void;
  onDelete: (id: string) => void;
  onTogglePin?: (cat: FinanceCategory) => void;
}

type DrawerWidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

export const FinanceCategoryDetailDrawer: React.FC<FinanceCategoryDetailDrawerProps> = ({
  category,
  currentIndex,
  totalCount,
  allCategories = [],
  onClose,
  onPrev,
  onNext,
  onEdit,
  onDelete,
}) => {
  const [widthMode, setWidthMode] = useState<DrawerWidthMode>('normal');
  const [prevWidthMode, setPrevWidthMode] = useState<DrawerWidthMode>('normal');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = () => {
    const text = `DANH MỤC TÀI CHÍNH: ${category.name}
Mã: ${category.code}
Loại: ${category.type === 'income' ? 'Thu tiền' : category.type === 'expense' ? 'Chi tiền' : 'Luân chuyển'}
Cấp độ: Cấp ${category.level}
Nhóm cha: ${category.parentCategory || '—'}
Trạng thái: ${category.status === 'active' ? 'Đang hoạt động' : 'Tạm ngừng'}
Mô tả: ${category.description || '—'}
Người tạo: ${category.createdBy || '—'}
Ngày tạo: ${category.createdAt || '—'}`;

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
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

  // Find child categories if this is level 1
  const childCategories =
    category.level === 1
      ? allCategories.filter((c) => c.parentCategory === category.name || c.parentCategory === category.code)
      : [];

  const typeConfig = {
    income: { label: 'Khoản mục Thu', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    expense: { label: 'Khoản mục Chi', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
    transfer: { label: 'Luân chuyển nội bộ', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  }[category.type] || { label: category.type, color: 'bg-muted text-muted-foreground border-border' };

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
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                {category.code}
              </span>
              <h2 className="text-sm font-semibold truncate text-foreground">
                {category.name}
              </h2>
            </div>

            <div className="flex items-center gap-1 shrink-0">
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

              {/* Prev / Next */}
              <div className="flex items-center border border-border rounded-lg bg-background p-0.5 mr-1">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={currentIndex <= 0}
                  className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                  title="Khoản mục trước"
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
                  title="Khoản mục tiếp theo"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Close */}
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

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {/* Quick Hero Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  <FolderTree className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-foreground">{category.name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        category.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {category.status === 'active' ? 'Đang sử dụng' : 'Tạm ngưng'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    Mã hệ thống: {category.code}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? 'Đã sao chép' : 'Sao chép tất cả'}</span>
                </button>
              </div>
            </div>

            {/* General Info Grid */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Thông tin phân cấp & danh mục</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Cấp bậc danh mục</span>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span>{category.level === 1 ? 'Cấp 1 (Nhóm danh mục cha)' : 'Cấp 2 (Khoản mục chi tiết)'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Nhóm cha trực thuộc</span>
                  <div className="font-semibold text-foreground">
                    {category.level === 1 ? (
                      <span className="text-muted-foreground font-normal italic">— (Đây là danh mục Cấp 1)</span>
                    ) : (() => {
                      const parent = (allCategories || []).find(
                        (c) => c.code === category.parentCategory || c.name === category.parentCategory || c.id === category.parentCategory
                      );
                      return parent ? (
                        <div className="flex items-center gap-1.5">
                          <span>{parent.name}</span>
                          <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border/50">
                            {parent.code}
                          </span>
                        </div>
                      ) : (
                        category.parentCategory || '—'
                      );
                    })()}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Thứ tự hiển thị</span>
                  <div className="font-semibold text-foreground">
                    {category.order !== undefined ? category.order : '—'}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Người tạo / Cập nhật</span>
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{category.createdBy || 'Lê Minh Công'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Mô tả & Hướng dẫn hạch toán</span>
              </div>
              <div className="p-3.5 rounded-lg border border-border bg-card text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {category.description || 'Không có mô tả chi tiết cho khoản mục này.'}
              </div>
            </div>

            {/* Sub-categories List (If level 1) */}
            {category.level === 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-primary/20 pb-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>Khoản mục con trực thuộc ({childCategories.length})</span>
                  </div>
                </div>

                {childCategories.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 italic">Chưa có khoản mục cấp 2 nào trực thuộc nhóm này.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {childCategories.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span className="font-medium truncate text-foreground">{child.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground shrink-0">({child.code})</span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                            child.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {child.status === 'active' ? 'Bật' : 'Tắt'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Metadata & Audit */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Nhật ký khởi tạo</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <span className="text-muted-foreground block mb-1">Ngày tạo</span>
                  <span className="font-medium text-foreground">{category.createdAt || '—'}</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <span className="text-muted-foreground block mb-1">Cập nhật lần cuối</span>
                  <span className="font-medium text-foreground">{category.updatedAt || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-3">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 w-full justify-end animate-in fade-in-0">
                <span className="text-xs text-rose-600 font-medium mr-2">Xác nhận xoá khoản mục này?</span>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted text-foreground"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(category.code || category.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Xoá vĩnh viễn
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xoá</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(category)}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-all"
                  >
                    <SquarePen className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
