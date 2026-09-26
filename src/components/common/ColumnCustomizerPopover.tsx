import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  LayoutTemplate,
  RotateCcw,
  GripVertical,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  WrapText,
  Baseline,
  Pin,
} from 'lucide-react';

export type ColumnAlign = 'left' | 'center' | 'right';
export type ColumnWrap = 'truncate' | 'wrap';

export interface ColumnItem {
  id: string;
  label: string;
  visible: boolean;
  locked?: boolean;
  pinned?: boolean;
  width?: number;
  align?: ColumnAlign;
  wrap?: ColumnWrap;
}

export type TableDensity = 'compact' | 'normal' | 'relaxed';

interface ColumnCustomizerPopoverProps {
  columns: ColumnItem[];
  onChangeColumns: (columns: ColumnItem[]) => void;
  density: TableDensity;
  onChangeDensity: (density: TableDensity) => void;
  onReset: () => void;
  triggerClassName?: string;
  align?: 'left' | 'right';
}

export const ColumnCustomizerPopover: React.FC<ColumnCustomizerPopoverProps> = ({
  columns,
  onChangeColumns,
  density,
  onChangeDensity,
  onReset,
  triggerClassName,
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('touchstart', handlePointerDown);
    }
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen]);

  const visibleCount = useMemo(() => {
    return columns.filter((col) => col.visible).length;
  }, [columns]);

  const pinnedCount = useMemo(() => {
    return columns.filter((col) => col.visible && col.pinned).length;
  }, [columns]);

  const totalCount = columns.length;

  // Filter columns based on search
  const filteredColumns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return columns;
    return columns.filter((col) => col.label.toLowerCase().includes(q));
  }, [columns, searchQuery]);

  // Toggle single column visibility
  const handleToggleColumn = (id: string) => {
    const updated = columns.map((col) => {
      if (col.id === id) {
        return { ...col, visible: !col.visible };
      }
      return col;
    });
    onChangeColumns(updated);
  };

  // Toggle column pin/unpin
  const handleToggleColumnPin = (id: string) => {
    const updated = columns.map((col) => {
      if (col.id === id) {
        return { ...col, pinned: !col.pinned };
      }
      return col;
    });
    onChangeColumns(updated);
  };

  // Update column width
  const handleUpdateColumnWidth = (id: string, newWidth: number) => {
    const clamped = Math.max(50, Math.min(1200, newWidth));
    const updated = columns.map((col) =>
      col.id === id ? { ...col, width: clamped } : col
    );
    onChangeColumns(updated);
  };

  // Update column alignment (left | center | right)
  const handleUpdateColumnAlign = (id: string, alignVal: ColumnAlign) => {
    const updated = columns.map((col) =>
      col.id === id ? { ...col, align: alignVal } : col
    );
    onChangeColumns(updated);
  };

  // Update column text wrap mode (truncate | wrap)
  const handleToggleColumnWrap = (id: string) => {
    const updated = columns.map((col) => {
      if (col.id === id) {
        const nextWrap: ColumnWrap = col.wrap === 'wrap' ? 'truncate' : 'wrap';
        return { ...col, wrap: nextWrap };
      }
      return col;
    });
    onChangeColumns(updated);
  };

  // Global toggle wrap mode for all columns
  const handleSetGlobalWrap = (wrapVal: ColumnWrap) => {
    const updated = columns.map((col) => ({ ...col, wrap: wrapVal }));
    onChangeColumns(updated);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newCols = [...columns];
    const [draggedItem] = newCols.splice(draggedIndex, 1);
    newCols.splice(dropIndex, 0, draggedItem);

    onChangeColumns(newCols);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Check current global wrap state
  const isAllWrapped = useMemo(() => {
    return columns.every((c) => c.wrap === 'wrap');
  }, [columns]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Tùy chọn hiển thị, căn lề, ghim & kích thước cột"
        aria-label="Tùy chọn cột"
        aria-expanded={isOpen}
        className={
          triggerClassName ||
          `h-8 w-8 flex items-center justify-center border rounded-lg transition-all cursor-pointer ${
            isOpen
              ? 'bg-primary/10 border-primary text-primary shadow-sm'
              : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
          }`
        }
      >
        <LayoutTemplate className="w-3.5 h-3.5" />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Tùy chọn cột"
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } top-full mt-2 bg-card backdrop-blur-xl rounded-xl shadow-2xl border border-border z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150`}
          style={{ opacity: 1, transform: 'none' }}
        >
          <div className="w-[395px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-foreground">Cột hiển thị & Định dạng</h4>
                <div className="flex items-center gap-1">
                  <span className="text-xs tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium" title="Số cột đang hiển thị">
                    {visibleCount}/{totalCount}
                  </span>
                  {pinnedCount > 0 && (
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5" title="Số cột đang ghim cố định">
                      <Pin className="w-2.5 h-2.5 fill-current" />
                      {pinnedCount} ghim
                    </span>
                  )}
                </div>
              </div>
              <div className="relative inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={onReset}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                  title="Khôi phục cài đặt mặc định"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Density & Text Wrap Mode Controls */}
            <div className="px-3 py-2 border-b border-border bg-muted/10 space-y-2">
              {/* Density Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-muted-foreground w-16 shrink-0">Giãn dòng:</span>
                <div className="flex-1 grid grid-cols-3 gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40">
                  <button
                    type="button"
                    onClick={() => onChangeDensity('compact')}
                    className={`text-[11px] py-1 rounded-md transition-all font-medium cursor-pointer ${
                      density === 'compact'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Gọn
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeDensity('normal')}
                    className={`text-[11px] py-1 rounded-md transition-all font-medium cursor-pointer ${
                      density === 'normal'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Vừa
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeDensity('relaxed')}
                    className={`text-[11px] py-1 rounded-md transition-all font-medium cursor-pointer ${
                      density === 'relaxed'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Thoáng
                  </button>
                </div>
              </div>

              {/* Global Text Wrap Setting */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-muted-foreground w-16 shrink-0">Chữ dài:</span>
                <div className="flex-1 grid grid-cols-2 gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40">
                  <button
                    type="button"
                    onClick={() => handleSetGlobalWrap('truncate')}
                    className={`text-[11px] py-1 px-1.5 rounded-md transition-all font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                      !isAllWrapped
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Cắt gọn nội dung dài và hiển thị dấu ba chấm (...)"
                  >
                    <Baseline className="w-3 h-3" />
                    <span>Cắt gọn (...)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetGlobalWrap('wrap')}
                    className={`text-[11px] py-1 px-1.5 rounded-md transition-all font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                      isAllWrapped
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Tự động xuống dòng khi nội dung dài hơn độ rộng cột"
                  >
                    <WrapText className="w-3 h-3" />
                    <span>Xuống dòng</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="px-3 py-1.5 border-b border-border bg-muted/10">
              <input
                placeholder="Tìm kiếm cột..."
                aria-label="Tìm kiếm cột hiển thị"
                className="w-full rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Hint bar */}
            <div className="px-3 py-1 bg-muted/25 border-b border-border/60 flex items-center justify-between text-[10px] font-medium text-muted-foreground select-none">
              <span>Tên cột (Kéo thả)</span>
              <div className="flex items-center gap-2.5 pr-0.5">
                <span>Căn lề</span>
                <span>Dòng</span>
                <span>Ghim</span>
                <span>Độ rộng</span>
              </div>
            </div>

            {/* Columns List */}
            <div className="p-1.5 max-h-[350px] overflow-y-auto custom-scrollbar space-y-0.5">
              {filteredColumns.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Không tìm thấy cột phù hợp
                </div>
              ) : (
                filteredColumns.map((col) => {
                  const origIndex = columns.findIndex((c) => c.id === col.id);
                  const isOver = dragOverIndex === origIndex;
                  const isDragging = draggedIndex === origIndex;
                  const currentAlign = col.align || 'left';
                  const isWrapped = col.wrap === 'wrap';
                  const isPinned = !!col.pinned;

                  return (
                    <div
                      key={col.id}
                      draggable={!searchQuery}
                      onDragStart={(e) => handleDragStart(e, origIndex)}
                      onDragOver={(e) => handleDragOver(e, origIndex)}
                      onDrop={(e) => handleDrop(e, origIndex)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleToggleColumn(col.id)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg select-none transition-colors group cursor-pointer border border-transparent ${
                        isDragging
                          ? 'opacity-30 bg-muted border-dashed border-primary'
                          : isOver
                          ? 'bg-primary/10 border-t-2 border-primary'
                          : isPinned && col.visible
                          ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08]'
                          : 'hover:bg-muted/60'
                      }`}
                    >
                      {/* Drag Handle */}
                      <div
                        className="shrink-0 cursor-grab active:cursor-grabbing touch-none p-0.5 text-muted-foreground/50 group-hover:text-foreground hover:bg-muted rounded transition-colors"
                        title="Kéo thả để sắp xếp thứ tự cột"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      {/* Checkbox */}
                      <button
                        type="button"
                        aria-pressed={col.visible}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleColumn(col.id);
                        }}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                          col.visible
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border bg-background group-hover:border-primary/50'
                        }`}
                      >
                        {col.visible && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                      </button>

                      {/* Label */}
                      <span
                        className={`text-xs flex-1 truncate ${
                          col.visible ? 'text-foreground font-medium' : 'text-muted-foreground line-through opacity-75'
                        }`}
                        title={col.label}
                      >
                        {col.label}
                      </span>

                      {/* Controls Group: Align | Wrap | Pin | Width */}
                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Alignment Selector: Left | Center | Right */}
                        <div
                          className="flex items-center bg-muted/60 rounded p-0.5 border border-border/60"
                          title="Căn lề cột (Trái, Giữa, Phải)"
                        >
                          <button
                            type="button"
                            onClick={() => handleUpdateColumnAlign(col.id, 'left')}
                            className={`p-0.5 rounded transition-all cursor-pointer ${
                              currentAlign === 'left'
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            title="Căn trái"
                          >
                            <AlignLeft className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateColumnAlign(col.id, 'center')}
                            className={`p-0.5 rounded transition-all cursor-pointer ${
                              currentAlign === 'center'
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            title="Căn giữa"
                          >
                            <AlignCenter className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateColumnAlign(col.id, 'right')}
                            className={`p-0.5 rounded transition-all cursor-pointer ${
                              currentAlign === 'right'
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            title="Căn phải"
                          >
                            <AlignRight className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        {/* Text Wrap Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleColumnWrap(col.id)}
                          className={`p-1 rounded border transition-all cursor-pointer ${
                            isWrapped
                              ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
                              : 'bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                          title={isWrapped ? 'Đang bật: Tự động xuống dòng' : 'Đang bật: Cắt gọn 1 dòng (...)'}
                        >
                          <WrapText className="w-3 h-3" />
                        </button>

                        {/* Pin Column Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleColumnPin(col.id)}
                          className={`p-1 rounded border transition-all cursor-pointer ${
                            isPinned
                              ? 'bg-amber-500/15 border-amber-500/35 text-amber-700 dark:text-amber-400 font-semibold shadow-xs'
                              : 'bg-muted/40 border-border/60 text-muted-foreground/60 hover:text-foreground hover:bg-muted'
                          }`}
                          title={isPinned ? 'Đang ghim cố định bên trái (Bấm để bỏ ghim)' : 'Ghim cố định cột này bên trái khi cuộn'}
                        >
                          <Pin className={`w-3 h-3 ${isPinned ? 'fill-current' : ''}`} />
                        </button>

                        {/* Width Input */}
                        <div className="flex items-center gap-0.5 bg-background rounded border border-border/80 px-1 py-0.5">
                          <input
                            type="number"
                            min={50}
                            max={1000}
                            step={10}
                            value={col.width || 150}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) {
                                handleUpdateColumnWidth(col.id, val);
                              }
                            }}
                            className="w-10 h-4 text-[11px] text-center bg-transparent text-foreground font-mono focus:outline-none tabular-nums font-medium"
                            title="Độ rộng cột (px)"
                          />
                          <span className="text-[9px] text-muted-foreground select-none">px</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
