import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { ROWS_PER_PAGE_OPTIONS } from '../../types/settings';

export interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
  itemLabel?: string;
  leftExtra?: React.ReactNode;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemLabel = 'dòng',
  leftExtra,
  className = '',
}) => {
  const safeItemsPerPage = Math.max(1, itemsPerPage || 50);
  const totalPages = Math.max(1, Math.ceil(totalItems / safeItemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (validCurrentPage - 1) * safeItemsPerPage + 1;
  const endItem = Math.min(validCurrentPage * safeItemsPerPage, totalItems);

  // Merge default options with itemsPerPage if not already present
  const options = Array.from(new Set([...ROWS_PER_PAGE_OPTIONS, safeItemsPerPage])).sort((a, b) => a - b);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-border bg-card/60 text-xs text-muted-foreground shrink-0 select-none ${className}`}
    >
      {/* Left side: Page size & counts & extra */}
      <div className="flex items-center gap-2 flex-wrap">
        <span>Hiển thị</span>
        <select
          value={safeItemsPerPage}
          aria-label="Số dòng mỗi trang"
          onChange={(e) => {
            onItemsPerPageChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="h-7 px-2 rounded-md border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <span>
          {itemLabel} / tổng số <span className="font-semibold text-foreground">{totalItems}</span>
          {totalItems > 0 && ` (${startItem} - ${endItem})`}
        </span>
        {leftExtra}
      </div>

      {/* Right side: Page buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={validCurrentPage <= 1}
          className="p-1 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Trang đầu"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage - 1)}
          disabled={validCurrentPage <= 1}
          className="p-1 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Trang trước"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="px-2.5 py-1 bg-primary/10 text-primary font-semibold rounded-md text-xs">
          Trang {validCurrentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage + 1)}
          disabled={validCurrentPage >= totalPages}
          className="p-1 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Trang sau"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={validCurrentPage >= totalPages}
          className="p-1 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Trang cuối"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
