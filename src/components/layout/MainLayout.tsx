import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activePath,
  onNavigate,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="flex h-[100dvh] bg-background font-sans text-foreground selection:bg-primary/20 selection:text-primary overflow-x-hidden min-h-0">
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-medium"
      >
        Chuyển đến nội dung chính
      </a>

      {/* Sidebar Component */}
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        activePath={activePath}
        onNavigate={onNavigate}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main
        id="main-content"
        className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto overscroll-contain no-scrollbar bg-muted/30 relative"
      >
        {/* Header Component */}
        <Header
          isCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
          activePath={activePath}
          onNavigate={onNavigate}
        />

        {/* Dynamic Page Content */}
        <div className="flex-1 min-h-0 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};
