import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { DashboardModule } from '../../types';

interface ModuleCardProps {
  module: DashboardModule;
  onClick: (href: string) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, onClick }) => {
  const Icon = module.icon;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(module.href)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(module.href);
        }
      }}
      className="group relative rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer flex flex-col items-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* Top right hover badge */}
      <div className="absolute top-3 right-3 rounded-full bg-muted p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ArrowUpRight
          className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors"
          aria-hidden="true"
        />
      </div>

      {/* Gradient Icon Container */}
      <div
        className={`mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${module.gradientClass} shadow-sm group-hover:scale-105 transition-transform duration-200`}
      >
        <Icon className="w-7 h-7 text-white stroke-[1.8px]" aria-hidden="true" />
      </div>

      {/* Title */}
      <h2 className="text-base md:text-lg font-semibold text-foreground leading-tight mb-1.5 line-clamp-1">
        {module.title}
      </h2>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.5rem]">
        {module.description}
      </p>
    </div>
  );
};
