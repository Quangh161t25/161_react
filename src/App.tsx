import React, { useState, useEffect, useCallback } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { FinancePage } from './components/finance/FinancePage';
import { CostProposalPage } from './components/finance/CostProposalPage';
import { CashTransactionPage } from './components/finance/CashTransactionPage';
import { FinanceCategoryPage } from './components/finance/categories/FinanceCategoryPage';
import { FinanceAccountPage } from './components/finance/accounts/FinanceAccountPage';
import { CounterpartyPage } from './components/finance/counterparties/CounterpartyPage';
import { ApprovalThresholdPage } from './components/finance/thresholds/ApprovalThresholdPage';
import { SystemPage } from './components/system/SystemPage';
import { EmployeePage } from './components/employee/EmployeePage';
import { NotePage } from './components/notes/NotePage';
import { LearningPage } from './components/learning/LearningPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { LoginPage } from './components/auth/LoginPage';
import { GenericPage } from './components/pages/GenericPage';
import { WorkPage } from './components/work/WorkPage';
import { TaskListPage } from './components/work/tasks/TaskListPage';
import { ProjectListPage } from './components/work/projects/ProjectListPage';
import { WorkflowListPage } from './components/work/workflows/WorkflowListPage';
import { WorkReportPage } from './components/work/reports/WorkReportPage';
import { PasswordPage } from './components/password/PasswordPage';
import { CalendarPage } from './components/calendar/CalendarPage';
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
    } else if (currentPath === '/cong-viec') {
      document.title = 'Công việc & Dự án | ERP Doanh Nghiệp';
    } else if (currentPath.startsWith('/cong-viec/danh-sach')) {
      document.title = 'Danh sách công việc | ERP Doanh Nghiệp';
    } else if (currentPath.startsWith('/cong-viec/du-an')) {
      document.title = 'Quản lý Dự án | ERP Doanh Nghiệp';
    } else if (currentPath.startsWith('/cong-viec/quy-trinh')) {
      document.title = 'Quy trình công việc | ERP Doanh Nghiệp';
    } else if (currentPath.startsWith('/cong-viec/kpi-bao-cao')) {
      document.title = 'Báo cáo KPI & Hiệu suất | ERP Doanh Nghiệp';
    } else if (currentPath === '/lich') {
      document.title = 'Lịch & Sự kiện Toàn hệ thống | ERP Doanh Nghiệp';
    } else if (currentPath === '/mat-khau') {
      document.title = 'Quản lý Mật khẩu & Két Tài khoản | ERP Doanh Nghiệp';
    } else if (currentPath === '/ghi-chu' || currentPath === '/he-thong/ghi-chu') {
      document.title = 'Ghi chú | ERP Doanh Nghiệp';
    } else if (currentPath === '/hoc-hoi') {
      document.title = 'Học hỏi & Kiến thức | ERP Doanh Nghiệp';
    } else if (currentPath === '/tai-chinh') {
      document.title = 'Tài chính | ERP Doanh Nghiệp';
    } else if (currentPath === '/tai-chinh/thu-chi') {
      document.title = 'Thu chi & Dòng tiền | Tài chính | ERP Doanh Nghiệp';
    } else if (currentPath === '/tai-chinh/de-xuat-chi-phi') {
      document.title = 'Đề xuất chi phí | ERP Doanh Nghiệp';
    } else if (currentPath === '/tai-chinh/danh-muc-tai-chinh') {
      document.title = 'Danh mục tài chính | ERP Doanh Nghiệp';
    } else if (currentPath === '/tai-chinh/tai-khoan') {
      document.title = 'Tài khoản tài chính | ERP Doanh Nghiệp';
    } else if (currentPath === '/tai-chinh/doi-tuong-thu-chi') {
      document.title = 'Đối tượng thu chi | ERP Doanh Nghiệp';
    } else if (currentPath === '/tai-chinh/nguong-duyet') {
      document.title = 'Ngưỡng duyệt chi phí | ERP Doanh Nghiệp';
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

    // 1b. Phân hệ Công việc (Work Hub)
    if (currentPath === '/cong-viec') {
      return <WorkPage onNavigate={(path) => handleNavigate(path)} />;
    }

    // 1c. Công việc: Danh sách công việc
    if (currentPath.startsWith('/cong-viec/danh-sach')) {
      const isMyTasks = currentPath.includes('view=my_tasks');
      const isCalendar = currentPath.includes('view=calendar');
      return (
        <TaskListPage
          onBack={() => handleNavigate('/cong-viec')}
          initialViewMode={isCalendar ? 'calendar' : isMyTasks ? 'kanban' : 'table'}
        />
      );
    }

    // 1d. Công việc: Quản lý Dự án
    if (currentPath.startsWith('/cong-viec/du-an')) {
      return (
        <ProjectListPage
          onBack={() => handleNavigate('/cong-viec')}
          onSelectTask={() => handleNavigate('/cong-viec/danh-sach')}
        />
      );
    }

    // 1e. Công việc: Quy trình mẫu
    if (currentPath.startsWith('/cong-viec/quy-trinh')) {
      return <WorkflowListPage onBack={() => handleNavigate('/cong-viec')} />;
    }

    // 1f. Công việc: Báo cáo & KPI
    if (currentPath.startsWith('/cong-viec/kpi-bao-cao')) {
      return <WorkReportPage onBack={() => handleNavigate('/cong-viec')} />;
    }

    // 1b. Phân hệ Lịch toàn hệ thống
    if (currentPath === '/lich') {
      return (
        <CalendarPage
          onBack={() => handleNavigate('/')}
          onNavigate={(path) => handleNavigate(path)}
        />
      );
    }

    // 1g. Phân hệ Quản lý Mật khẩu
    if (currentPath === '/mat-khau') {
      return <PasswordPage onBack={() => handleNavigate('/')} />;
    }

    // 2. Phân hệ Ghi chú
    if (currentPath === '/ghi-chu') {
      return <NotePage onBack={() => handleNavigate('/')} />;
    }

    // 2b. Phân hệ Học hỏi & Kiến thức
    if (currentPath === '/hoc-hoi') {
      return <LearningPage onBack={() => handleNavigate('/')} />;
    }

    // 3. Phân hệ Tài chính
    if (currentPath === '/tai-chinh') {
      return <FinancePage onNavigate={(path) => handleNavigate(path)} />;
    }

    // 4. Trang chi tiết: Đề xuất chi phí
    if (currentPath === '/tai-chinh/de-xuat-chi-phi') {
      return <CostProposalPage onBack={() => handleNavigate('/tai-chinh')} />;
    }

    // 4b. Trang chi tiết: Thu chi
    if (currentPath === '/tai-chinh/thu-chi') {
      return (
        <CashTransactionPage
          onBack={() => handleNavigate('/tai-chinh')}
          onNavigateToModule={(path) => handleNavigate(path)}
        />
      );
    }

    // 4c. Trang chi tiết: Danh mục tài chính
    if (currentPath === '/tai-chinh/danh-muc-tai-chinh') {
      return <FinanceCategoryPage onBack={() => handleNavigate('/tai-chinh')} />;
    }

    // 4d. Trang chi tiết: Tài khoản
    if (currentPath === '/tai-chinh/tai-khoan') {
      return <FinanceAccountPage onBack={() => handleNavigate('/tai-chinh')} />;
    }

    // 4e. Trang chi tiết: Đối tượng thu chi
    if (currentPath === '/tai-chinh/doi-tuong-thu-chi') {
      return <CounterpartyPage onBack={() => handleNavigate('/tai-chinh')} />;
    }

    // 4f. Trang chi tiết: Ngưỡng duyệt
    if (currentPath === '/tai-chinh/nguong-duyet') {
      return <ApprovalThresholdPage onBack={() => handleNavigate('/tai-chinh')} />;
    }

    // 5. Phân hệ Hệ thống (Hub)
    if (currentPath === '/he-thong') {
      return <SystemPage onNavigate={(path) => handleNavigate(path)} />;
    }

    // 6. Trang chi tiết: Nhân viên
    if (currentPath === '/he-thong/nhan-vien') {
      return <EmployeePage onBack={() => handleNavigate('/he-thong')} />;
    }

    // 7. Trang chi tiết: Ghi chú trong Hệ thống
    if (currentPath === '/he-thong/ghi-chu') {
      return <NotePage onBack={() => handleNavigate('/he-thong')} />;
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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SettingsProvider>
  );
};

export default App;
