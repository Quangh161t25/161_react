import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  LayoutTemplate,
  RotateCcw,
  GripVertical,
  Check,
} from 'lucide-react';

export interface ColumnItem {
  id: string;
  label: string;
  visible: boolean;
  locked?: boolean;
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image or default
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
        title="Tùy chọn cột"
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
          } top-full mt-2 bg-card backdrop-blur-xl rounded-xl shadow-xl border border-border z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150`}
          style={{ opacity: 1, transform: 'none' }}
        >
          <div className="w-64 overflow-hidden">
            {/* Header */}
            <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-medium text-muted-foreground">Cột hiển thị</h4>
                <span className="text-xs tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
                  {visibleCount}/{totalCount}
                </span>
              </div>
              <div className="relative inline-flex">
                <button
                  type="button"
                  onClick={onReset}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                  title="Khôi phục mặc định"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Density Selector */}
            <div className="px-3 py-2 border-b border-border flex items-center gap-1 bg-muted/10">
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
            <div className="px-2 py-2 border-b border-border bg-muted/10">
              <input
                placeholder="Tìm kiếm"
                aria-label="Tìm kiếm cột hiển thị"
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Columns List */}
            <div className="p-1.5 max-h-[320px] overflow-y-auto custom-scrollbar space-y-0.5">
              {filteredColumns.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
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
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg select-none transition-colors group cursor-pointer ${
                        isDragging ? 'opacity-40 bg-muted' : isOver ? 'bg-primary/10 border-t-2 border-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      {/* Drag Handle */}
                      <button
                        type="button"
                        className="shrink-0 cursor-grab active:cursor-grabbing touch-none p-0.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors"
                        aria-label="Kéo để đổi thứ tự cột"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="w-3 h-3" />
                      </button>

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
                          col.visible ? 'text-foreground font-medium' : 'text-muted-foreground'
                        }`}
                      >
                        {col.label}
                      </span>
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
