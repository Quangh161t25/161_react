import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  LayoutTemplate,
  RotateCcw,
  GripVertical,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export interface ColumnItem {
  id: string;
  label: string;
  visible: boolean;
  locked?: boolean;
  width?: number;
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

  const totalCount = columns.length;

  // Filter columns based on search
  const filteredColumns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return columns;
    return columns.filter((col) => col.label.toLowerCase().includes(q));
  }, [columns, searchQuery]);

  const handleToggleColumn = (id: string) => {
    const updated = columns.map((col) => {
      if (col.id === id) {
        if (col.locked) return col;
        return { ...col, visible: !col.visible };
      }
      return col;
    });
    onChangeColumns(updated);
  };

  const handleUpdateColumnWidth = (id: string, newWidth: number) => {
    const clamped = Math.max(50, Math.min(1200, newWidth));
    const updated = columns.map((col) =>
      col.id === id ? { ...col, width: clamped } : col
    );
    onChangeColumns(updated);
  };

  // Move column up or down
  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) return;

    const newCols = [...columns];
    const [movedItem] = newCols.splice(index, 1);
    newCols.splice(targetIndex, 0, movedItem);
    onChangeColumns(newCols);
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

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Tùy chọn hiển thị & kích thước cột"
        aria-label="Tùy chọn cột"
        aria-expanded={isOpen}
        className={
          triggerClassName ||
          `h-8 w-8 flex items-center justify-center border rounded-lg transition-all ${
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
          <div className="w-80 overflow-hidden">
            {/* Header */}
            <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-foreground">Cột hiển thị & Kích thước</h4>
                <span className="text-xs tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
                  {visibleCount}/{totalCount}
                </span>
              </div>
              <div className="relative inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={onReset}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                  title="Khôi phục mặc định"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Density Selector */}
            <div className="px-3 py-2 border-b border-border flex items-center gap-1 bg-muted/10">
              <span className="text-[11px] font-medium text-muted-foreground mr-1 shrink-0">Giãn dòng:</span>
              <button
                type="button"
                onClick={() => onChangeDensity('compact')}
                className={`flex-1 text-xs py-1 rounded-md transition-all font-medium cursor-pointer ${
                  density === 'compact'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Gọn
              </button>
              <button
                type="button"
                onClick={() => onChangeDensity('normal')}
                className={`flex-1 text-xs py-1 rounded-md transition-all font-medium cursor-pointer ${
                  density === 'normal'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Vừa
              </button>
              <button
                type="button"
                onClick={() => onChangeDensity('relaxed')}
                className={`flex-1 text-xs py-1 rounded-md transition-all font-medium cursor-pointer ${
                  density === 'relaxed'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Thoáng
              </button>
            </div>

            {/* Search Input */}
            <div className="px-3 py-2 border-b border-border bg-muted/10">
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
            <div className="px-3 py-1 bg-muted/20 border-b border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Tên cột (Kéo thả để xếp)</span>
              <span>Độ rộng (px)</span>
            </div>

            {/* Columns List */}
            <div className="p-1.5 max-h-[340px] overflow-y-auto custom-scrollbar space-y-0.5">
              {filteredColumns.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Không tìm thấy cột phù hợp
                </div>
              ) : (
                filteredColumns.map((col) => {
                  const origIndex = columns.findIndex((c) => c.id === col.id);
                  const isOver = dragOverIndex === origIndex;
                  const isDragging = draggedIndex === origIndex;

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
                          : 'hover:bg-muted/60'
                      }`}
                    >
                      {/* Drag Handle */}
                      <div
                        className="shrink-0 cursor-grab active:cursor-grabbing touch-none p-1 text-muted-foreground/50 group-hover:text-foreground hover:bg-muted rounded transition-colors"
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

                      {/* Quick Move Steppers (Hover) */}
                      <div
                        className="hidden group-hover:flex items-center gap-0.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={origIndex === 0}
                          onClick={() => handleMoveColumn(origIndex, 'up')}
                          className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20"
                          title="Di chuyển lên"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={origIndex === columns.length - 1}
                          onClick={() => handleMoveColumn(origIndex, 'down')}
                          className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20"
                          title="Di chuyển xuống"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Width Input */}
                      <div
                        className="flex items-center gap-1 shrink-0 bg-background/80 rounded border border-border/80 px-1 py-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                          className="w-11 h-4.5 text-[11px] text-center bg-transparent text-foreground font-mono focus:outline-none tabular-nums font-medium"
                          title="Độ rộng cột (px) - Tự động đồng bộ với kéo thả trên bảng"
                        />
                        <span className="text-[10px] text-muted-foreground select-none">px</span>
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
