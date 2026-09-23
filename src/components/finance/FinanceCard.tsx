import React, { useState } from 'react';
import { Pin, ChevronRight } from 'lucide-react';
import { FinanceItem } from '../../types/finance';

interface FinanceCardProps {
  item: FinanceItem;
  onClick: (href: string) => void;
  onPinToggle?: (id: string, isPinned: boolean) => void;
}

export const FinanceCard: React.FC<FinanceCardProps> = ({
  item,
  onClick,
  onPinToggle,
}) => {
  const [isPinned, setIsPinned] = useState(item.isPinned || false);
  const Icon = item.icon;

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    if (onPinToggle) {
      onPinToggle(item.id, newPinned);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(item.href)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(item.href);
        }
      }}
      className="group relative bg-card rounded-xl p-4 md:p-5 border border-border hover:border-primary/30 transition-all cursor-pointer flex items-start gap-3 md:gap-4 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* Colored Icon Container */}
      <div
        className="shrink-0 rounded-xl transition-transform duration-300 group-hover:scale-105 flex items-center justify-center w-11 h-11 md:w-12 md:h-12"
        style={{ backgroundColor: item.iconBgColor }}
      >
        <Icon
          className="w-6 h-6 shrink-0 stroke-[2.25px]"
          aria-hidden="true"
          style={{ color: item.iconColor }}
        />
      </div>

      {/* Text Info */}
      <div className="flex-1 min-w-0 pr-6">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm mb-0.5 md:mb-1 truncate">
          {item.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {item.description}
        </p>
      </div>

      {/* Pin Button */}
      <button
        type="button"
        aria-pressed={isPinned}
        aria-label={isPinned ? 'Bỏ ghim' : 'Ghim lên Tổng quan'}
        title={isPinned ? 'Bỏ ghim' : 'Ghim lên Tổng quan'}
        onClick={handlePinClick}
        className={`absolute right-3 top-3 z-10 rounded-lg p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          isPinned
            ? 'opacity-100 text-primary bg-primary/10'
            : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-primary/10 hover:text-primary'
        }`}
      >
        <Pin className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      {/* Hover Chevron */}
      <ChevronRight
        className="w-4 h-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all self-center hidden sm:block shrink-0"
        aria-hidden="true"
      />
    </div>
  );
};
