import React, { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

interface MobileDetailsProps {
  label: string;
  className?: string;
  children: React.ReactNode;
}

// Trên điện thoại: ẩn các phần phụ của form sau một nút bấm. Trên máy tính: luôn hiện.
export const MobileDetails: React.FC<MobileDetailsProps> = ({ label, className = '', children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="md:hidden w-full h-11 px-3 rounded-xl border border-border bg-muted/30 text-sm font-medium text-foreground flex items-center justify-between gap-2"
      >
        <span className="truncate">{isOpen ? 'Ẩn bớt' : label}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`${isOpen ? 'block' : 'hidden'} md:block ${className}`}>{children}</div>
    </>
  );
};

interface MobileAddButtonProps {
  label: string;
  onClick: () => void;
}

// Nút thêm nhanh trong tầm ngón cái, chỉ hiện trên điện thoại
export const MobileAddButton: React.FC<MobileAddButtonProps> = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="md:hidden fixed right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform"
    style={{ bottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
  >
    <Plus className="w-6 h-6" />
  </button>
);
