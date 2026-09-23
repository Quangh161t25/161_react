import React from 'react';
import { Sparkles } from 'lucide-react';
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from '../../data/navigation';
import { NavItem } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  activePath: string;
  onNavigate: (path: string) => void;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed,
  activePath,
  onNavigate,
  onCloseMobile,
}) => {
  const renderNavItem = (item: NavItem) => {
    const isActive = activePath === item.href;
    const Icon = item.icon;

    return (
      <a
        key={item.id}
        href={item.href}
        onClick={(e) => {
          e.preventDefault();
          onNavigate(item.href);
          onCloseMobile();
        }}
        aria-label={item.label}
        title={item.label}
        className={`group flex items-center rounded-lg transition-colors relative min-h-[44px] h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
          isActive
            ? 'bg-primary/5 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-primary rounded-r-full z-10" />
        )}

        <div className="w-[60px] md:w-[56px] flex justify-center shrink-0">
          <div
            className={`flex items-center justify-center rounded-lg transition-colors duration-200 w-8 h-8 ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-transparent text-inherit group-hover:bg-card group-hover:shadow-sm'
            }`}
          >
            <Icon
              className={`w-4 h-4 transition-[stroke-width] ${
                isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'
              }`}
              aria-hidden="true"
            />
          </div>
        </div>

        {!isCollapsed && (
          <span
            className={`text-sm transition-colors whitespace-nowrap ${
              isActive ? 'text-primary font-bold' : 'font-medium text-inherit'
            }`}
          >
            {item.label}
          </span>
        )}
      </a>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Đóng overlay"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-card border-r border-border/40 flex flex-col overflow-hidden transition-all duration-300 md:relative ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-[72px]' : 'w-[240px]'}`}
      >
        {/* Header / Logo */}
        <div className="flex h-12 md:h-14 items-center px-3 shrink-0 overflow-hidden border-b border-border/50">
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="h-8 w-8 rounded-lg bg-primary shadow-sm flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity">
                <h2 className="text-xs font-bold text-foreground leading-tight truncate">
                  ERP
                </h2>
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  Phần mềm quản lý doanh nghiệp
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 min-h-0 flex flex-col py-3 relative">
          <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
            <nav className="px-2 space-y-1" aria-label="Điều hướng chính">
              {NAV_ITEMS.map(renderNavItem)}
            </nav>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none shrink-0"
            aria-hidden="true"
          />
        </div>

        {/* Footer Navigation (Settings) */}
        <div className="shrink-0 border-t border-border/50 px-2 py-2">
          {BOTTOM_NAV_ITEMS.map(renderNavItem)}
        </div>
      </aside>
    </>
  );
};
