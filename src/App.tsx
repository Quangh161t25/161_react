import React, { useState, useEffect, useCallback } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { FinancePage } from './components/finance/FinancePage';
import { CostProposalPage } from './components/finance/CostProposalPage';
import { SystemPage } from './components/system/SystemPage';
import { EmployeePage } from './components/employee/EmployeePage';
import { SettingsPage } from './components/settings/SettingsPage';
import { LoginPage } from './components/auth/LoginPage';
import { GenericPage } from './components/pages/GenericPage';
import { DASHBOARD_MODULES, NAV_ITEMS, BOTTOM_NAV_ITEMS } from './data/navigation';
import { FINANCE_SECTIONS } from './data/finance';
import { SYSTEM_SECTIONS } from './data/system';

const AppContent: React.FC = () => {
  // Initialize current path from browser URL bar
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.pathname) {
      return window.location.pathname;
    }
    return '/';
  });

  // Navigate with browser History API pushState
  const handleNavigate = useCallback((path: string) => {
    if (path !== currentPath) {
      if (typeof window !== 'undefined') {
        window.history.pushState({ path }, '', path);
      }
      setCurrentPath(path);
    }
  }, [currentPath]);

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setCurrentPath(path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update document title based on current path
  useEffect(() => {
    if (currentPath === '/') {
      document.title = 'Trang chủ | ERP Doanh Nghiệp';
    } else if (currentPath === '/tai-chinh') {
      document.title = 'Tài chính | ERP Doanh Nghiệp';
    } else if (currentPath === '/tai-chinh/de-xuat-chi-phi') {
      document.title = 'Đề xuất chi phí | ERP Doanh Nghiệp';
    } else if (currentPath === '/he-thong') {
      document.title = 'Hệ thống | ERP Doanh Nghiệp';
    } else if (currentPath === '/he-thong/nhan-vien') {
      document.title = 'Nhân viên | Hệ thống | ERP Doanh Nghiệp';
    } else if (currentPath === '/cai-dat') {
      document.title = 'Cài đặt | ERP Doanh Nghiệp';
    } else if (currentPath === '/dang-nhap') {
      document.title = 'Đăng nhập | ERP Doanh Nghiệp';
    } else {
      const allSystemItems = SYSTEM_SECTIONS.flatMap((s) => s.items);
      const matchSys = allSystemItems.find((i) => i.href === currentPath.replace(/\/huong-dan$/, ''));
      if (matchSys) {
        document.title = `${matchSys.title} | Hệ thống | ERP`;
      } else {
        const allFinItems = FINANCE_SECTIONS.flatMap((s) => s.items);
        const matchFin = allFinItems.find((i) => i.href === currentPath);
        if (matchFin) {
          document.title = `${matchFin.title} | Tài chính | ERP`;
        }
      }
    }
  }, [currentPath]);

  // 1. Standalone Full-screen Login Page
  if (currentPath === '/dang-nhap') {
    return (
      <LoginPage
        onLoginSuccess={() => {
          handleNavigate('/');
        }}
      />
    );
  }

  const renderContent = () => {
    // 1. Trang chủ
    if (currentPath === '/') {
      return <DashboardHome onNavigate={(path) => handleNavigate(path)} />;
    }

    // 2. Phân hệ Tài chính
    if (currentPath === '/tai-chinh') {
      return <FinancePage onNavigate={(path) => handleNavigate(path)} />;
    }

    // 3. Trang chi tiết: Đề xuất chi phí
    if (currentPath === '/tai-chinh/de-xuat-chi-phi') {
      return <CostProposalPage onBack={() => handleNavigate('/tai-chinh')} />;
    }

    // 4. Phân hệ Hệ thống (Hub)
    if (currentPath === '/he-thong') {
      return <SystemPage onNavigate={(path) => handleNavigate(path)} />;
    }

    // 5. Trang chi tiết: Nhân viên
    if (currentPath === '/he-thong/nhan-vien') {
      return <EmployeePage onBack={() => handleNavigate('/he-thong')} />;
    }

    // 6. Các trang con khác của Hệ thống
    if (currentPath.startsWith('/he-thong/')) {
      const allSystemItems = SYSTEM_SECTIONS.flatMap((s) => s.items);
      const isGuide = currentPath.endsWith('/huong-dan');
      const baseHref = currentPath.replace(/\/huong-dan$/, '');
      const matchedSystemItem = allSystemItems.find((i) => i.href === baseHref);

      const title = isGuide
        ? `Hướng dẫn: ${matchedSystemItem ? matchedSystemItem.title : 'Hệ thống'}`
        : matchedSystemItem
        ? matchedSystemItem.title
        : 'Chi tiết hệ thống';

      const description = isGuide
        ? `Tài liệu hướng dẫn sử dụng và quy trình nghiệp vụ cho ${matchedSystemItem ? matchedSystemItem.title : 'chức năng'}.`
        : matchedSystemItem
        ? matchedSystemItem.description
        : 'Quản lý thông tin chi tiết của phân hệ hệ thống.';

      return (
        <GenericPage
          title={title}
          description={description}
          onBack={() => handleNavigate('/he-thong')}
        />
      );
    }

    // 7. Trang Cài đặt
    if (currentPath === '/cai-dat') {
      return <SettingsPage onBack={() => handleNavigate('/')} />;
    }

    // 8. Các trang con khác của Tài chính (ví dụ: /tai-chinh/thu-chi, /tai-chinh/ke-hoach-chi-phi, ...)
    if (currentPath.startsWith('/tai-chinh/')) {
      const allFinanceItems = FINANCE_SECTIONS.flatMap((s) => s.items);
      const matchedFinanceItem = allFinanceItems.find((i) => i.href === currentPath);

      return (
        <GenericPage
          title={matchedFinanceItem ? matchedFinanceItem.title : 'Chi tiết tài chính'}
          description={
            matchedFinanceItem
              ? matchedFinanceItem.description
              : 'Quản lý thông tin chi tiết của phân hệ tài chính.'
          }
          onBack={() => handleNavigate('/tai-chinh')}
        />
      );
    }

    // 9. Các phân hệ khác (Tổng quan, Thông tin bản quyền, Hồ sơ, ...)
    const allItems = [...DASHBOARD_MODULES, ...NAV_ITEMS, ...BOTTOM_NAV_ITEMS];
    const match = allItems.find((item) => item.href === currentPath);

    return (
      <GenericPage
        title={match ? ('title' in match ? match.title : match.label) : 'Trang'}
        description={
          match && 'description' in match
            ? match.description
            : 'Quản lý thông tin chi tiết của phân hệ.'
        }
        onBack={() => handleNavigate('/')}
      />
    );
  };

  return (
    <MainLayout
      activePath={currentPath}
      onNavigate={(path) => handleNavigate(path)}
    >
      {renderContent()}
    </MainLayout>
  );
};

export const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
};

export default App;
