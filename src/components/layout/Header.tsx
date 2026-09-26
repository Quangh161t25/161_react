import React, { useState, useEffect } from 'react';
import {
  PanelLeftClose,
  PanelLeft,
  House,
  Clock,
  Bell,
  ChevronDown,
  ChevronRight,
  User,
  Settings,
  Key,
  LogOut,
} from 'lucide-react';
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from '../../data/navigation';
import { useAuth } from '../../context/AuthContext';
import { FINANCE_SECTIONS } from '../../data/finance';
import { SYSTEM_SECTIONS } from '../../data/system';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';

interface HeaderProps {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
  activePath: string;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isCollapsed,
  onToggleSidebar,
  activePath,
  onNavigate,
}) => {
  const { currentUser, logout } = useAuth();
  const [time, setTime] = useState<Date>(new Date());
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Vietnamese day and date
  const formatVietnameseDate = (date: Date) => {
    const days = [
      'Chủ Nhật',
      'Thứ 2',
      'Thứ 3',
      'Thứ 4',
      'Thứ 5',
      'Thứ 6',
      'Thứ 7',
    ];
    const dayName = days[date.getDay()];
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dayName}, ${dd}/${mm}/${yyyy}`;
  };

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  // Breadcrumb calculation
  const getBreadcrumbs = () => {
    if (activePath === '/') {
      return [{ label: 'Trang chủ', href: '/', isCurrent: true, isHome: true }];
    }

    const crumbs = [
      { label: 'Trang chủ', href: '/', isCurrent: false, isHome: true },
    ];

    if (activePath === '/tai-chinh') {
      crumbs.push({
        label: 'Tài chính',
        href: '/tai-chinh',
        isCurrent: true,
        isHome: false,
      });
      return crumbs;
    }

    if (activePath.startsWith('/tai-chinh/')) {
      crumbs.push({
        label: 'Tài chính',
        href: '/tai-chinh',
        isCurrent: false,
        isHome: false,
      });

      // Find subpage title
      const allFinanceItems = FINANCE_SECTIONS.flatMap((s) => s.items);
      const subItem = allFinanceItems.find((i) => i.href === activePath);
      crumbs.push({
        label: subItem ? subItem.title : 'Chi tiết',
        href: activePath,
        isCurrent: true,
        isHome: false,
      });
      return crumbs;
    }

    if (activePath === '/he-thong') {
      crumbs.push({
        label: 'Hệ thống',
        href: '/he-thong',
        isCurrent: true,
        isHome: false,
      });
      return crumbs;
    }

    if (activePath.startsWith('/he-thong/')) {
      crumbs.push({
        label: 'Hệ thống',
        href: '/he-thong',
        isCurrent: false,
        isHome: false,
      });

      const allSystemItems = SYSTEM_SECTIONS.flatMap((s) => s.items);
      const isGuide = activePath.endsWith('/huong-dan');
      const baseHref = activePath.replace(/\/huong-dan$/, '');
      const subItem = allSystemItems.find((i) => i.href === baseHref);

      if (isGuide && subItem) {
        crumbs.push({
          label: subItem.title,
          href: subItem.href,
          isCurrent: false,
          isHome: false,
        });
        crumbs.push({
          label: 'Hướng dẫn',
          href: activePath,
          isCurrent: true,
          isHome: false,
        });
      } else {
        crumbs.push({
          label: subItem ? subItem.title : 'Chi tiết',
          href: activePath,
          isCurrent: true,
          isHome: false,
        });
      }
      return crumbs;
    }

    const allNav = [...NAV_ITEMS, ...BOTTOM_NAV_ITEMS];
    const navItem = allNav.find((item) => item.href === activePath);
    if (navItem) {
      crumbs.push({
        label: navItem.label,
        href: navItem.href,
        isCurrent: true,
        isHome: false,
      });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-12 md:h-13 shrink-0 border-b border-border/50 bg-card sticky top-0 z-40 px-3 md:px-4 flex items-center justify-between gap-3 safe-area-top">
      {/* Left: Collapse Button & Breadcrumb */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          className="h-8 w-8 flex items-center justify-center rounded-lg bg-muted/60 border border-border/80 text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/20 transition-all active:scale-90 shrink-0"
        >
          {isCollapsed ? (
            <PanelLeft className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>

        {/* Dynamic Breadcrumbs */}
        <nav aria-label="Đường dẫn" className="flex-1 min-w-0">
          <ol className="flex items-center gap-1 flex-nowrap overflow-hidden">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;

              if (crumb.isHome && isLast) {
                return (
                  <li key={crumb.href} className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="flex items-center justify-center w-6 h-6 rounded-md text-primary"
                      aria-hidden="true"
                    >
                      <House className="w-3.5 h-3.5" />
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center whitespace-nowrap shadow-sm shadow-primary/20 selection:bg-white/35 selection:text-white"
                      aria-current="page"
                    >
                      Trang chủ
                    </span>
                  </li>
                );
              }

              if (crumb.isHome) {
                return (
                  <li key={crumb.href} className="flex items-center gap-1.5 shrink-0">
                    <a
                      href="/"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate('/');
                      }}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-normal whitespace-nowrap transition-colors text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                      title="Về trang chủ"
                    >
                      <House className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden md:inline">Trang chủ</span>
                    </a>
                  </li>
                );
              }

              return (
                <li key={crumb.href} className="flex items-center gap-1 shrink-0">
                  <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  {isLast ? (
                    <span
                      className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center whitespace-nowrap shadow-sm shadow-primary/20 selection:bg-white/35 selection:text-white"
                      aria-current="page"
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <a
                      href={crumb.href}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(crumb.href);
                      }}
                      className="px-2 py-0.5 rounded-md text-xs font-normal whitespace-nowrap transition-colors text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                    >
                      {crumb.label}
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Right: Clock, Notifications, User Profile */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Real-time Clock Widget */}
        <div
          className="hidden md:inline-flex items-center gap-2 h-8 pl-1.5 pr-1 rounded-lg bg-card border border-border/80 shadow-sm select-none"
          role="timer"
          aria-live="off"
          title={`${formatVietnameseDate(time)} · ${hours}:${minutes}:${seconds}`}
        >
          <div className="flex items-center gap-1.5 pl-0.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
              <Clock className="w-3 h-3 stroke-[2.25px]" aria-hidden="true" />
            </span>
            <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
              {formatVietnameseDate(time)}
            </span>
          </div>
          <span className="inline-flex items-center h-6 px-2 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold tabular-nums tracking-wider whitespace-nowrap">
            <span>{hours}</span>
            <span className="opacity-50 mx-px">:</span>
            <span>{minutes}</span>
            <span className="opacity-50 mx-px">:</span>
            <span>{seconds}</span>
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            aria-label="Thông báo"
            className="h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all relative active:scale-95"
          >
            <Bell className="w-5 h-5 shrink-0 stroke-[1.8px]" aria-hidden="true" />
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-semibold leading-none tabular-nums rounded-full shadow-sm ring-2 ring-card"
              aria-label="3 thông báo chưa đọc"
            >
              3
            </span>
          </button>
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="Menu người dùng"
            aria-expanded={userMenuOpen}
            className="min-h-[44px] flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-muted border border-transparent hover:border-border transition-colors group cursor-pointer"
          >
            <div className="relative shrink-0">
              <img
                alt="Avatar"
                className="h-7 w-7 rounded-lg ring-1 ring-border shadow-sm object-cover"
                src={currentUser.avatarUrl}
              />
              {currentUser.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-[1.5px] border-card rounded-full" />
              )}
            </div>
            <div className="hidden md:block text-left min-w-0 max-w-[11rem]">
              <p className="text-xs font-semibold text-foreground leading-tight truncate">
                {currentUser.name}
              </p>
              <p className="text-[10px] font-normal text-muted-foreground leading-tight truncate">
                {currentUser.title || currentUser.role}
              </p>
            </div>
            <ChevronDown
              className={`w-3 h-3 text-muted-foreground/50 hidden md:block transition-transform shrink-0 ${
                userMenuOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {/* User Profile Popup Dropdown Menu */}
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div
                className="absolute right-0 top-full mt-2 w-64 bg-card rounded-xl shadow-xl border border-border overflow-hidden z-50 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {/* Mobile-only user info header */}
                <div className="px-3 py-2.5 border-b border-border md:hidden">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-primary font-medium mt-0.5 truncate">
                    {currentUser.title || currentUser.role}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {currentUser.username || 'admin'}
                  </p>
                </div>

                <div className="space-y-0.5">
                  {/* Hồ sơ cá nhân */}
                  <a
                    className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary rounded-lg transition-colors group cursor-pointer"
                    href="/ho-so"
                    onClick={(e) => {
                      e.preventDefault();
                      setUserMenuOpen(false);
                      onNavigate('/ho-so');
                    }}
                  >
                    <User className="w-[15px] h-[15px] text-muted-foreground group-hover:text-primary transition-colors" />
                    Hồ sơ cá nhân
                  </a>

                  {/* Cài đặt */}
                  <a
                    className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary rounded-lg transition-colors group cursor-pointer"
                    href="/cai-dat"
                    onClick={(e) => {
                      e.preventDefault();
                      setUserMenuOpen(false);
                      onNavigate('/cai-dat');
                    }}
                  >
                    <Settings className="w-[15px] h-[15px] text-muted-foreground group-hover:text-primary transition-colors" />
                    Cài đặt
                  </a>

                  <div className="h-px bg-border my-0.5 mx-2" />

                  {/* Đổi mật khẩu */}
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary rounded-lg transition-colors group text-left cursor-pointer"
                  >
                    <Key className="w-[15px] h-[15px] text-muted-foreground group-hover:text-primary transition-colors" />
                    Đổi mật khẩu
                  </button>

                  <div className="h-px bg-border my-1 mx-2" />

                  {/* Đăng xuất */}
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
                        logout();
                        onNavigate('/dang-nhap');
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors group cursor-pointer"
                  >
                    <LogOut className="w-[15px] h-[15px] text-rose-300 group-hover:text-rose-500 transition-colors" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </header>
  );
};
