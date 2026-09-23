import React, { useState } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { FinancePage } from './components/finance/FinancePage';
import { CostProposalPage } from './components/finance/CostProposalPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { LoginPage } from './components/auth/LoginPage';
import { GenericPage } from './components/pages/GenericPage';
import { DASHBOARD_MODULES, NAV_ITEMS, BOTTOM_NAV_ITEMS } from './data/navigation';
import { FINANCE_SECTIONS } from './data/finance';

const AppContent: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>('/');

  // 1. Standalone Full-screen Login Page
  if (currentPath === '/dang-nhap') {
    return (
      <LoginPage
        onLoginSuccess={() => {
          setCurrentPath('/');
        }}
      />
    );
  }

  const renderContent = () => {
    // 1. Trang chủ
    if (currentPath === '/') {
      return <DashboardHome onNavigate={(path) => setCurrentPath(path)} />;
    }

    // 2. Phân hệ Tài chính
    if (currentPath === '/tai-chinh') {
      return <FinancePage onNavigate={(path) => setCurrentPath(path)} />;
    }

    // 3. Trang chi tiết: Đề xuất chi phí
    if (currentPath === '/tai-chinh/de-xuat-chi-phi') {
      return <CostProposalPage onBack={() => setCurrentPath('/tai-chinh')} />;
    }

    // 4. Trang Cài đặt
    if (currentPath === '/cai-dat') {
      return <SettingsPage onBack={() => setCurrentPath('/')} />;
    }

    // 5. Các trang con khác của Tài chính (ví dụ: /tai-chinh/thu-chi, /tai-chinh/ke-hoach-chi-phi, ...)
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
          onBack={() => setCurrentPath('/tai-chinh')}
        />
      );
    }

    // 6. Các phân hệ khác (Tổng quan, Hệ thống, Thông tin bản quyền, Hồ sơ, ...)
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
        onBack={() => setCurrentPath('/')}
      />
    );
  };

  return (
    <MainLayout
      activePath={currentPath}
      onNavigate={(path) => setCurrentPath(path)}
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
