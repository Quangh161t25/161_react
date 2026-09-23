import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Building2,
  Briefcase,
  Tag,
  Funnel,
  Printer,
  Bookmark,
  LayoutGrid,
  Download,
  Plus,
  SquarePen,
  Trash2,
  List,
  Phone,
  Mail,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChartColumn,
  Link2,
} from 'lucide-react';
import { Employee } from '../../types/employee';
import { EmployeeDetailDrawer } from './EmployeeDetailDrawer';
import { EmployeeFormDrawer } from './EmployeeFormDrawer';
import { EmployeeStatsTab } from './EmployeeStatsTab';
import { employeeService } from '../../services/employeeService';

interface EmployeePageProps {
  onBack: () => void;
}

export const EmployeePage: React.FC<EmployeePageProps> = ({ onBack }) => {
  const [employees, setEmployees] = useState<Employee[]>(() =>
    employeeService.getInitialEmployees()
  );
  const [activeTopTab, setActiveTopTab] = useState<'list' | 'stats'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Drawers state
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const showToast = (message: string, isErr = false) => {
    if (isErr) {
      setSyncError(message);
      setTimeout(() => setSyncError(null), 4000);
    } else {
      setSyncToastMessage(message);
      setTimeout(() => setSyncToastMessage(null), 3500);
    }
  };

  // Initial load from Google Sheets
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsSyncing(true);
      try {
        const liveData = await employeeService.fetchFromSheet();
        if (isMounted && liveData && liveData.length > 0) {
          setEmployees(liveData);
        }
      } catch (err) {
        console.warn('Initial sheet load failed:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered List
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.code.toLowerCase().includes(q) ||
        emp.phone.includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q);

      const matchDept = selectedDept === 'all' || emp.department === selectedDept;
      const matchRole = selectedRole === 'all' || emp.role === selectedRole;
      const matchStatus = selectedStatus === 'all' || emp.status === selectedStatus;

      return matchQuery && matchDept && matchRole && matchStatus;
    });
  }, [employees, searchQuery, selectedDept, selectedRole, selectedStatus]);

  // Unique filters lists
  const departmentsList = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);
  }, [employees]);

  const rolesList = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.role))).filter(Boolean);
  }, [employees]);

  // Select all checkbox
  const isAllSelected =
    filteredEmployees.length > 0 && selectedIds.length === filteredEmployees.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map((e) => e.id));
    }
  };

  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Create / Edit Submit
  const handleFormSubmit = async (formData: Partial<Employee>) => {
    if (editingEmployee) {
      // Update existing
      const updatedList = employees.map((e) =>
        e.id === editingEmployee.id
          ? {
              ...e,
              ...formData,
              updatedAt: new Date().toLocaleDateString('vi-VN'),
            }
          : e
      );
      setEmployees(updatedList);
      employeeService.saveToCache(updatedList);

      if (selectedEmployeeForDetail?.id === editingEmployee.id) {
        setSelectedEmployeeForDetail({
          ...selectedEmployeeForDetail,
          ...formData,
          updatedAt: new Date().toLocaleDateString('vi-VN'),
        } as Employee);
      }

      setIsFormDrawerOpen(false);
      setEditingEmployee(null);

      // Sync to sheet
      setIsSyncing(true);
      const ok = await employeeService.syncAllToSheet(updatedList);
      setIsSyncing(false);
      if (ok) {
        showToast(`Đã cập nhật ${editingEmployee.name} và đồng bộ lên Google Sheet!`);
      } else {
        showToast('Đã lưu thông tin nội bộ.', true);
      }
    } else {
      // Create new
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const dateStr = `${dd}/${mm}/${yyyy}`;

      const maxNum = employees.reduce((max, e) => {
        const match = e.code.match(/emp-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 0);
      const nextNum = maxNum + 1;
      const newCode = `emp-${String(nextNum).padStart(3, '0')}`;

      const created: Employee = {
        id: String(Date.now()),
        code: formData.code || newCode,
        name: formData.name || '',
        username: formData.username || formData.name?.toLowerCase().replace(/\s+/g, '') || '',
        phone: formData.phone || '',
        email: formData.email || '',
        role: formData.role || 'Nhân viên',
        department: formData.department || 'Phòng Kỹ thuật',
        subDepartment: formData.subDepartment || '—',
        gender: formData.gender || 'Nam',
        status: formData.status || 'working',
        createdAt: dateStr,
        updatedAt: dateStr,
        avatarUrl:
          formData.avatarUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=1d4ed8&color=fff`,
        dob: formData.dob || '',
        maritalStatus: formData.maritalStatus || 'Độc thân',
        nationality: formData.nationality || 'Việt Nam',
        ethnicity: formData.ethnicity || 'Kinh',
        religion: formData.religion || 'Không',
        hometown: formData.hometown || '',
        rank: formData.rank || 1,
        startDate: formData.startDate || dateStr,
        officialDate: formData.officialDate || '',
        resignationDate: formData.resignationDate || '',
        resignationReason: formData.resignationReason || '',
        idCardNumber: formData.idCardNumber || '',
        idCardDate: formData.idCardDate || '',
        idCardPlace: formData.idCardPlace || 'Cục Cảnh sát QLHC về TTXH',
        permanentAddress: formData.permanentAddress || '',
        currentAddress: formData.currentAddress || '',
        personalEmail: formData.personalEmail || '',
        emergencyContactName: formData.emergencyContactName || '',
        emergencyContactPhone: formData.emergencyContactPhone || '',
        emergencyContactRelation: formData.emergencyContactRelation || '',
        educationLevel: formData.educationLevel || 'Đại học',
        major: formData.major || '',
        school: formData.school || '',
        bankAccount: formData.bankAccount || '',
        bankAccountHolder: formData.bankAccountHolder || formData.name?.toUpperCase() || '',
        bankName: formData.bankName || 'Vietcombank',
        bankBranch: formData.bankBranch || '',
        socialInsuranceNumber: formData.socialInsuranceNumber || '',
        healthInsuranceNumber: formData.healthInsuranceNumber || '',
        taxCode: formData.taxCode || '',
        password: formData.password || '123456',
        isActiveAccount: formData.status !== 'resigned',
      };

      const updatedList = [created, ...employees];
      setEmployees(updatedList);
      employeeService.saveToCache(updatedList);

      setIsFormDrawerOpen(false);
      setEditingEmployee(null);

      // Sync to sheet
      setIsSyncing(true);
      const ok = await employeeService.syncAllToSheet(updatedList);
      setIsSyncing(false);
      if (ok) {
        showToast(`Đã thêm nhân viên ${created.name} (${created.code}) và đồng bộ lên Google Sheet!`);
      } else {
        showToast('Đã thêm nhân viên vào bộ nhớ tạm.', true);
      }
    }
  };

  // Delete
  const handleDeleteEmployee = async (id: string) => {
    const target = employees.find((e) => e.id === id);
    const updatedList = employees.filter((e) => e.id !== id);
    setEmployees(updatedList);
    employeeService.saveToCache(updatedList);

    if (selectedEmployeeForDetail?.id === id) {
      setSelectedEmployeeForDetail(null);
    }

    setIsSyncing(true);
    const ok = await employeeService.syncAllToSheet(updatedList);
    setIsSyncing(false);
    if (ok) {
      showToast(`Đã xóa hồ sơ nhân viên ${target?.name || ''} và cập nhật Google Sheet!`);
    }
  };

  // Manual Sheet Sync
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const data = await employeeService.fetchFromSheet();
      if (data && data.length > 0) {
        setEmployees(data);
        showToast(`Đã đồng bộ thành công ${data.length} nhân viên từ Google Sheet!`);
      } else {
        showToast('Google Sheet đã ở trạng thái mới nhất!');
      }
    } catch {
      showToast('Không thể kết nối với Google Sheet.', true);
    } finally {
      setIsSyncing(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Họ và tên',
      'Tên đăng nhập',
      'Mật khẩu',
      'SĐT',
      'Chức vụ',
      'Phòng ban',
      'Bộ phận',
      'Email',
      'Giới tính',
      'Trạng thái',
      'Ngày tạo',
      'Cập nhật',
      'Mã NV (ID)',
      'Ngày sinh',
      'Tình trạng hôn nhân',
      'Quốc tịch',
      'Dân tộc',
      'Tôn giáo',
      'Quê quán',
      'Cấp bậc',
      'Ngày vào làm',
      'Ngày chính thức',
      'Ngày nghỉ việc',
      'Lý do nghỉ',
      'CMND/CCCD',
      'Ngày cấp CCCD',
      'Nơi cấp',
      'Địa chỉ thường trú',
      'Chỗ ở hiện tại',
      'Email cá nhân',
      'Người liên hệ khẩn cấp',
      'SĐT khẩn cấp',
      'Quan hệ',
      'Trình độ học vấn',
      'Chuyên ngành',
      'Trường đào tạo',
      'Số tài khoản',
      'Chủ tài khoản',
      'Tên ngân hàng',
      'Chi nhánh',
      'Số BHXH',
      'Số BHYT',
      'Mã số thuế cá nhân',
      'Tài khoản hoạt động',
    ];

    const rows = filteredEmployees.map((e) => [
      `"${e.name}"`,
      e.username || '',
      `"${e.password || ''}"`,
      `"${e.phone}"`,
      `"${e.role}"`,
      `"${e.department}"`,
      `"${e.subDepartment || ''}"`,
      e.email,
      e.gender,
      e.status === 'working' ? 'Đang làm việc' : e.status === 'probation' ? 'Thử việc' : e.status === 'resigned' ? 'Đã nghỉ việc' : 'Tạm hoãn',
      e.createdAt,
      e.updatedAt,
      e.code,
      e.dob || '',
      `"${e.maritalStatus || 'Độc thân'}"`,
      `"${e.nationality || 'Việt Nam'}"`,
      `"${e.ethnicity || 'Kinh'}"`,
      `"${e.religion || 'Không'}"`,
      `"${e.hometown || ''}"`,
      e.rank || 1,
      e.startDate || '',
      e.officialDate || '',
      e.resignationDate || '',
      `"${e.resignationReason || ''}"`,
      `"${e.idCardNumber || ''}"`,
      e.idCardDate || '',
      `"${e.idCardPlace || ''}"`,
      `"${e.permanentAddress || ''}"`,
      `"${e.currentAddress || ''}"`,
      e.personalEmail || '',
      `"${e.emergencyContactName || ''}"`,
      `"${e.emergencyContactPhone || ''}"`,
      `"${e.emergencyContactRelation || ''}"`,
      `"${e.educationLevel || ''}"`,
      `"${e.major || ''}"`,
      `"${e.school || ''}"`,
      `"${e.bankAccount || ''}"`,
      `"${e.bankAccountHolder || e.name}"`,
      `"${e.bankName || ''}"`,
      `"${e.bankBranch || ''}"`,
      `"${e.socialInsuranceNumber || ''}"`,
      `"${e.healthInsuranceNumber || ''}"`,
      `"${e.taxCode || ''}"`,
      e.isActiveAccount !== false && e.status !== 'resigned' ? 'Hoạt động' : 'Vô hiệu hóa',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Danh_sach_nhan_vien_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV đầy đủ 46 cột nhân viên thành công!');
  };

  // Current Detail Index
  const currentDetailIndex = useMemo(() => {
    if (!selectedEmployeeForDetail) return -1;
    return filteredEmployees.findIndex((e) => e.id === selectedEmployeeForDetail.id);
  }, [selectedEmployeeForDetail, filteredEmployees]);

  const renderStatusBadge = (status: Employee['status']) => {
    switch (status) {
      case 'working':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            Đang làm việc
          </span>
        );
      case 'probation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
            Thử việc
          </span>
        );
      case 'resigned':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 whitespace-nowrap">
            Đã nghỉ việc
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-destructive/10 text-destructive border border-destructive/20 whitespace-nowrap">
            Tạm hoãn
          </span>
        );
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex flex-col h-full relative">
          {/* Top Segmented Tab Switcher: Danh sách / Thống kê */}
          <div className="shrink-0 relative z-0 mb-1.5">
            <div className="min-w-0 max-w-full overflow-x-auto">
              <div className="flex gap-0.5 p-0.5 bg-muted/50 rounded-lg border border-border/50 w-fit">
                <button
                  type="button"
                  onClick={() => setActiveTopTab('list')}
                  className={`flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all select-none whitespace-nowrap ${
                    activeTopTab === 'list'
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  Danh sách
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTopTab('stats')}
                  className={`flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all select-none whitespace-nowrap ${
                    activeTopTab === 'stats'
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  <ChartColumn className="w-3.5 h-3.5" />
                  Thống kê
                </button>
              </div>
            </div>
          </div>

          {/* Main Card Container */}
          <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
            {/* Toolbar */}
            <div
              data-print="hide"
              className="sticky top-0 z-30 bg-card border-b border-border/40 px-3 sm:px-4 py-2 space-y-2 shrink-0 [touch-action:manipulation]"
            >
              {/* Mobile View Toolbar */}
              <div className="sm:hidden">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onBack}
                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground active:scale-95 transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <div className="relative flex-1 min-w-0 max-w-[21rem]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      placeholder="Tìm kiếm nhân viên"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-9 pl-8 pr-7 bg-muted/40 border border-border/60 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                      type="search"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border transition-all active:scale-95 relative bg-background border-border text-muted-foreground"
                  >
                    <Funnel className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all active:scale-95"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEmployee(null);
                      setIsFormDrawerOpen(true);
                    }}
                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Desktop View Toolbar */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 min-w-0 flex-wrap">
                  <button
                    type="button"
                    onClick={onBack}
                    className="shrink-0 h-8 px-2 -ml-1 flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Quay lại</span>
                  </button>

                  <div className="relative w-64 max-w-[21rem] min-w-[10rem] shrink-0 group">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                    <input
                      placeholder="Tìm kiếm nhân viên"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-10 pr-8 bg-muted/40 hover:bg-muted/60 border border-border/60 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-background transition-all"
                      type="search"
                    />
                  </div>

                  {/* Filter Dropdown: Phòng ban */}
                  <div className="relative min-w-[140px]">
                    <button
                      type="button"
                      onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                      className="w-full flex items-center justify-between px-2 text-xs border rounded-lg transition-all h-8 border-border bg-background hover:bg-muted/50 text-muted-foreground"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                        <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {selectedDept === 'all' ? 'Phòng ban' : selectedDept}
                        </span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                    </button>

                    {isDeptDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-48 rounded-xl bg-card border border-border shadow-lg py-1 z-50">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted font-medium"
                          onClick={() => {
                            setSelectedDept('all');
                            setIsDeptDropdownOpen(false);
                          }}
                        >
                          Tất cả phòng ban
                        </button>
                        {departmentsList.map((dept) => (
                          <button
                            key={dept}
                            type="button"
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-foreground truncate"
                            onClick={() => {
                              setSelectedDept(dept);
                              setIsDeptDropdownOpen(false);
                            }}
                          >
                            {dept}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Filter Dropdown: Chức vụ */}
                  <div className="relative min-w-[136px]">
                    <button
                      type="button"
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                      className="w-full flex items-center justify-between px-2 text-xs border rounded-lg transition-all h-8 border-border bg-background hover:bg-muted/50 text-muted-foreground"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                        <Briefcase className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {selectedRole === 'all' ? 'Chức vụ' : selectedRole}
                        </span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                    </button>

                    {isRoleDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-48 rounded-xl bg-card border border-border shadow-lg py-1 z-50 max-h-60 overflow-y-auto">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted font-medium"
                          onClick={() => {
                            setSelectedRole('all');
                            setIsRoleDropdownOpen(false);
                          }}
                        >
                          Tất cả chức vụ
                        </button>
                        {rolesList.map((r) => (
                          <button
                            key={r}
                            type="button"
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-foreground truncate"
                            onClick={() => {
                              setSelectedRole(r);
                              setIsRoleDropdownOpen(false);
                            }}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Filter Dropdown: Trạng thái */}
                  <div className="relative min-w-[132px]">
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className="w-full flex items-center justify-between px-2 text-xs border rounded-lg transition-all h-8 border-border bg-background hover:bg-muted/50 text-muted-foreground"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                        <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {selectedStatus === 'all'
                            ? 'Trạng thái'
                            : selectedStatus === 'working'
                            ? 'Đang làm việc'
                            : selectedStatus === 'probation'
                            ? 'Thử việc'
                            : selectedStatus === 'resigned'
                            ? 'Đã nghỉ việc'
                            : 'Tạm hoãn'}
                        </span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                    </button>

                    {isStatusDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-40 rounded-xl bg-card border border-border shadow-lg py-1 z-50">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted font-medium"
                          onClick={() => {
                            setSelectedStatus('all');
                            setIsStatusDropdownOpen(false);
                          }}
                        >
                          Tất cả trạng thái
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-emerald-600"
                          onClick={() => {
                            setSelectedStatus('working');
                            setIsStatusDropdownOpen(false);
                          }}
                        >
                          Đang làm việc
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-amber-600"
                          onClick={() => {
                            setSelectedStatus('probation');
                            setIsStatusDropdownOpen(false);
                          }}
                        >
                          Thử việc
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-slate-500"
                          onClick={() => {
                            setSelectedStatus('resigned');
                            setIsStatusDropdownOpen(false);
                          }}
                        >
                          Đã nghỉ việc
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Google Sheet Live Sync Button */}
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    title="Đồng bộ 2 chiều với Google Sheet tab: NhanVien"
                    className="h-8 px-2 flex items-center gap-1.5 border rounded-lg transition-all bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
                    <span className="hidden md:inline">
                      {isSyncing ? 'Đang đồng bộ...' : 'Google Sheet'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    title="In danh sách"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    title="Ghim mục"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                    title={viewMode === 'table' ? 'Xem dạng thẻ' : 'Xem dạng bảng'}
                    className={`h-8 w-8 flex items-center justify-center border rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    title="Xuất file CSV"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingEmployee(null);
                      setIsFormDrawerOpen(true);
                    }}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm h-8 px-3 gap-1.5 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content: List or Stats Tab */}
            {activeTopTab === 'stats' ? (
              <EmployeeStatsTab employees={employees} />
            ) : viewMode === 'grid' ? (
              /* Grid Mode */
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployeeForDetail(emp)}
                      className="p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer space-y-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`}
                          alt={emp.name}
                          className="w-12 h-12 rounded-xl object-cover border border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {emp.name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">{emp.role}</p>
                          <span className="text-[10px] font-mono text-muted-foreground">{emp.code}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border">
                        <div className="flex items-center gap-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{emp.department}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{emp.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{emp.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {renderStatusBadge(emp.status)}
                        <span className="text-[11px] text-muted-foreground font-medium">
                          Bậc {emp.rank || 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Table Mode */
              <div className="flex-1 min-h-0 relative">
                <div className="h-full overflow-auto custom-scrollbar">
                  <table className="text-xs text-left border-separate border-spacing-0 w-full min-w-[4800px]">
                    <thead className="sticky top-0 z-[2]">
                      <tr className="bg-muted border-b border-border text-muted-foreground font-semibold">
                        {/* 0. Checkbox */}
                        <th className="sticky left-0 z-[3] px-3 bg-muted border-b border-r border-border text-center py-2.5 w-11">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={handleSelectAll}
                              className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                            />
                          </div>
                        </th>

                        {/* 1. Sticky Name */}
                        <th className="font-semibold text-foreground border-b text-xs whitespace-nowrap px-4 py-2.5 sticky left-11 z-[3] bg-muted border-r border-border min-w-[220px]">
                          Họ và tên
                        </th>

                        {/* 2. Sticky Username */}
                        <th className="font-semibold text-foreground border-b text-xs whitespace-nowrap px-4 py-2.5 sticky left-[264px] z-[3] bg-muted border-r border-border min-w-[150px]">
                          Tên đăng nhập
                        </th>

                        {/* Mật khẩu */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[140px]">
                          Mật khẩu
                        </th>

                        {/* 3. SĐT */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[150px]">
                          SĐT
                        </th>

                        {/* 4. Chức vụ */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[200px]">
                          Chức vụ
                        </th>

                        {/* 5. Phòng ban */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[200px]">
                          Phòng ban
                        </th>

                        {/* 6. Bộ phận */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[180px]">
                          Bộ phận
                        </th>

                        {/* 7. Email */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[220px]">
                          Email
                        </th>

                        {/* 8. Giới tính */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[100px]">
                          Giới tính
                        </th>

                        {/* 9. Trạng thái */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[140px]">
                          Trạng thái
                        </th>

                        {/* 10. Ngày tạo */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[120px]">
                          Ngày tạo
                        </th>

                        {/* 11. Cập nhật */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[120px]">
                          Cập nhật
                        </th>

                        {/* 12. ID (Mã NV) */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[110px]">
                          ID
                        </th>

                        {/* 13. Ảnh đại diện */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[110px]">
                          Ảnh đại diện
                        </th>

                        {/* 14. Ngày sinh */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[120px]">
                          Ngày sinh
                        </th>

                        {/* 15. Tình trạng hôn nhân */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[150px]">
                          Tình trạng hôn nhân
                        </th>

                        {/* 16. Quốc tịch */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[120px]">
                          Quốc tịch
                        </th>

                        {/* 17. Dân tộc */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[100px]">
                          Dân tộc
                        </th>

                        {/* 18. Tôn giáo */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[100px]">
                          Tôn giáo
                        </th>

                        {/* 19. Quê quán */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[160px]">
                          Quê quán
                        </th>

                        {/* 20. Chức vụ (Công việc) */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[200px]">
                          Chức vụ (Công việc)
                        </th>

                        {/* 21. Phòng ban (Công việc) */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[200px]">
                          Phòng ban (Công việc)
                        </th>

                        {/* 22. Cấp bậc */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[100px]">
                          Cấp bậc
                        </th>

                        {/* 23. Ngày vào làm */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[130px]">
                          Ngày vào làm
                        </th>

                        {/* 24. Ngày chính thức */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[130px]">
                          Ngày chính thức
                        </th>

                        {/* 25. Ngày nghỉ việc */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[130px]">
                          Ngày nghỉ việc
                        </th>

                        {/* 26. Lý do nghỉ */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[180px]">
                          Lý do nghỉ
                        </th>

                        {/* 27. CMND/CCCD */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[140px]">
                          CMND/CCCD
                        </th>

                        {/* 28. Ngày cấp CCCD */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[130px]">
                          Ngày cấp CCCD
                        </th>

                        {/* 29. Nơi cấp */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[200px]">
                          Nơi cấp
                        </th>

                        {/* 30. Địa chỉ thường trú */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[240px]">
                          Địa chỉ thường trú
                        </th>

                        {/* 31. Chỗ ở hiện tại */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[240px]">
                          Chỗ ở hiện tại
                        </th>

                        {/* 32. Email cá nhân */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[220px]">
                          Email cá nhân
                        </th>

                        {/* 33. Người liên hệ khẩn cấp */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[180px]">
                          Người liên hệ khẩn cấp
                        </th>

                        {/* 34. SĐT khẩn cấp */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[140px]">
                          SĐT khẩn cấp
                        </th>

                        {/* 35. Quan hệ */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[120px]">
                          Quan hệ
                        </th>

                        {/* 36. Trình độ học vấn */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[140px]">
                          Trình độ học vấn
                        </th>

                        {/* 37. Chuyên ngành */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[180px]">
                          Chuyên ngành
                        </th>

                        {/* 38. Trường đào tạo */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[200px]">
                          Trường đào tạo
                        </th>

                        {/* 39. Số tài khoản */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[160px]">
                          Số tài khoản
                        </th>

                        {/* 40. Chủ tài khoản */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[180px]">
                          Chủ tài khoản
                        </th>

                        {/* 41. Tên ngân hàng */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[160px]">
                          Tên ngân hàng
                        </th>

                        {/* 42. Chi nhánh */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[160px]">
                          Chi nhánh
                        </th>

                        {/* 43. Số BHXH */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[140px]">
                          Số BHXH
                        </th>

                        {/* 44. Số BHYT */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[140px]">
                          Số BHYT
                        </th>

                        {/* 45. Mã số thuế cá nhân */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[150px]">
                          Mã số thuế cá nhân
                        </th>

                        {/* 46. Tài khoản hoạt động */}
                        <th className="px-4 py-2.5 border-b border-r border-border whitespace-nowrap min-w-[160px]">
                          Tài khoản hoạt động
                        </th>

                        {/* Spacer */}
                        <th className="bg-muted border-b border-border py-2 w-4" aria-hidden="true" />

                        {/* Sticky Action */}
                        <th className="sticky right-0 z-[3] px-3 bg-muted border-b border-l border-border text-center font-semibold text-foreground text-xs py-2.5 w-24">
                          Thao tác
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredEmployees.map((emp) => (
                        <tr
                          key={emp.id}
                          onClick={() => setSelectedEmployeeForDetail(emp)}
                          className="group cursor-pointer bg-card even:bg-muted/15 hover:bg-muted/50 transition-colors [&>td]:border-b [&>td]:border-border text-xs"
                        >
                          {/* 0. Checkbox */}
                          <td
                            className="sticky left-0 z-[1] px-3 py-3 border-r border-border text-center bg-card group-hover:bg-muted transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(emp.id)}
                              onChange={(e) => handleToggleSelect(emp.id, e as any)}
                              className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                            />
                          </td>

                          {/* 1. Sticky Name */}
                          <td className="px-4 py-3 sticky left-11 z-[1] border-r border-border bg-card group-hover:bg-muted transition-colors">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                className="w-7 h-7 rounded-full border border-border object-cover shrink-0"
                                alt={emp.name}
                                src={
                                  emp.avatarUrl ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`
                                }
                              />
                              <span className="font-semibold text-foreground truncate">{emp.name}</span>
                            </div>
                          </td>

                          {/* 2. Sticky Username */}
                          <td className="px-4 py-3 sticky left-[264px] z-[1] border-r border-border bg-card group-hover:bg-muted transition-colors">
                            <span className="text-muted-foreground font-mono">{emp.username || '—'}</span>
                          </td>

                          {/* Mật khẩu */}
                          <td className="px-4 py-3 border-r border-border/40 font-mono text-muted-foreground">
                            {emp.password ? emp.password : '••••••••'}
                          </td>

                          {/* 3. Phone */}
                          <td className="px-4 py-3 border-r border-border/40">
                            <span className="flex items-center gap-1 text-foreground">
                              {emp.phone}
                              <a
                                href={`tel:${emp.phone.replace(/\s+/g, '')}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-primary hover:text-primary/80 p-0.5"
                                title="Gọi"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            </span>
                          </td>

                          {/* 4. Role */}
                          <td className="px-4 py-3 border-r border-border/40">
                            <span className="flex items-center gap-1.5 text-foreground font-medium">
                              <Briefcase className="w-3 h-3 text-primary/70 shrink-0" />
                              {emp.role}
                            </span>
                          </td>

                          {/* 5. Department */}
                          <td className="px-4 py-3 border-r border-border/40">
                            <span className="flex items-center gap-1.5 text-foreground">
                              <Building2 className="w-3 h-3 text-primary/70 shrink-0" />
                              {emp.department}
                            </span>
                          </td>

                          {/* 6. Sub Department */}
                          <td className="px-4 py-3 border-r border-border/40 text-muted-foreground">
                            {emp.subDepartment || '—'}
                          </td>

                          {/* 7. Email */}
                          <td className="px-4 py-3 border-r border-border/40">
                            <span className="flex items-center gap-1 text-foreground truncate">
                              <span className="truncate">{emp.email}</span>
                              <a
                                href={`mailto:${emp.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-primary hover:text-primary/80 p-0.5 shrink-0"
                                title="Gửi mail"
                              >
                                <Mail className="w-3 h-3" />
                              </a>
                            </span>
                          </td>

                          {/* 8. Gender */}
                          <td className="px-4 py-3 border-r border-border/40">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                emp.gender === 'Nam'
                                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                  : 'bg-pink-500/10 text-pink-600 border-pink-500/20'
                              }`}
                            >
                              {emp.gender}
                            </span>
                          </td>

                          {/* 9. Status */}
                          <td className="px-4 py-3 border-r border-border/40">
                            {renderStatusBadge(emp.status)}
                          </td>

                          {/* 10. Created */}
                          <td className="px-4 py-3 border-r border-border/40 tabular-nums text-muted-foreground">
                            {emp.createdAt}
                          </td>

                          {/* 11. Updated */}
                          <td className="px-4 py-3 border-r border-border/40 tabular-nums text-muted-foreground">
                            {emp.updatedAt}
                          </td>

                          {/* 12. ID (Code) */}
                          <td className="px-4 py-3 border-r border-border/40 font-mono font-semibold text-foreground">
                            {emp.code}
                          </td>

                          {/* 13. Avatar */}
                          <td className="px-4 py-3 border-r border-border/40">
                            <img
                              src={
                                emp.avatarUrl ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`
                              }
                              alt=""
                              className="w-7 h-7 rounded-md object-cover border border-border"
                            />
                          </td>

                          {/* 14. DOB */}
                          <td className="px-4 py-3 border-r border-border/40 tabular-nums text-muted-foreground">
                            {emp.dob || '—'}
                          </td>

                          {/* 15. Marital Status */}
                          <td className="px-4 py-3 border-r border-border/40 text-muted-foreground">
                            {emp.maritalStatus || '—'}
                          </td>

                          {/* 16. Nationality */}
                          <td className="px-4 py-3 border-r border-border/40 text-muted-foreground">
                            {emp.nationality || 'Việt Nam'}
                          </td>

                          {/* 17. Ethnicity */}
                          <td className="px-4 py-3 border-r border-border/40 text-muted-foreground">
                            {emp.ethnicity || 'Kinh'}
                          </td>

                          {/* 18. Religion */}
                          <td className="px-4 py-3 border-r border-border/40 text-muted-foreground">
                            {emp.religion || 'Không'}
                          </td>

                          {/* 19. Hometown */}
                          <td className="px-4 py-3 border-r border-border/40 text-muted-foreground">
                            {emp.hometown || '—'}
                          </td>

                          {/* 20. Chức vụ (Công việc) */}
                          <td className="px-4 py-3 border-r border-border/40">
                            <div className="flex items-center gap-1">
                              <span className="text-foreground truncate">{emp.role}</span>
                              <button
                                type="button"
                                title="Mở Chức vụ"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="shrink-0 p-0.5 rounded text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Link2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* 21. Phòng ban (Công việc) */}
                          <td className="px-4 py-3 border-r border-border/40">
                            <div className="flex items-center gap-1">
                              <span className="text-foreground truncate">{emp.department}</span>
                              <button
                                type="button"
                                title="Mở Phòng ban"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="shrink-0 p-0.5 rounded text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Link2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* 22. Rank */}
                          <td className="px-4 py-3 border-r border-border/40 text-center font-bold text-foreground">
                            {emp.rank || 1}
                          </td>

                          {/* 23. Start Date */}
                          <td className="px-4 py-3 border-r border-border/40 tabular-nums text-muted-foreground">
                            {emp.startDate || '—'}
                          </td>

                          {/* 24. Official Date */}
                          <td className="px-4 py-3 border-r border-border/40 tabular-nums text-muted-foreground">
                            {emp.officialDate || '—'}
                          </td>

                          {/* 25. Resignation Date */}
                          <td className="px-4 py-3 border-r border-border/40 tabular-nums text-muted-foreground">
                            {emp.resignationDate || '—'}
                          </td>

                          {/* 26. Resignation Reason */}
                          <td className="px-4 py-3 border-r border-border/40 text-muted-foreground truncate max-w-[180px]">
                            {emp.resignationReason || '—'}
                          </td>

                          {/* 27. ID Card Number */}
                          <td className="px-4 py-3 border-r border-border/40 font-mono text-muted-foreground">
                            {emp.idCardNumber || '—'}
                          </td>

                          {/* 28. ID Card Date */}
                          <td className="px-4 py-3 border-r border-border/40 tabular-nums text-muted-foreground">
                            {emp.idCardDate || '—'}
                          </td>

                          {/* 29. ID Card Place */}
                          <td className="px-4 py-3 border-r border-border/40 text-muted-foreground truncate max-w-[200px]">
                            {emp.idCardPlace || '—'}
                          </td>

                          {/* 30. Permanent Address */}
                          <td className="px-4 py-3 border-r border-border/40 text-muted-foreground truncate max-w-[240px]">
                            {emp.permanentAddress || '—'}
                          </td>

                          {/* 31. Current Address */}
                          <td className="px-4 py-3 border-r border-border/40 text-muted-foreground truncate max-w-[240px]">
                            {emp.currentAddress || '—'}
                          </td>

                          {/* 32. Personal Email */}
                          <td className="px-4 py-3 border-r border-border/40 font-mono text-muted-foreground truncate max-w-[220px]">
                            {emp.personalEmail || '—'}
                          </td>

                          {/* 33. Emergency Contact Name */}
                          <td className="px-4 py-3 border-r border-border/40 text-foreground font-medium truncate max-w-[180px]">
                            {emp.emergencyContactName || '—'}
                          </td>

                          {/* 34. Emergency Contact Phone */}
                          <td className="px-4 py-3 border-r border-border/40 font-mono text-muted-foreground">
                            {emp.emergencyContactPhone || '—'}
                          </td>

                          {/* 35. Emergency Contact Relation */}
                          <td className="px-4 py-3 border-r border-border/40 text-muted-foreground">
                            {emp.emergencyContactRelation || '—'}
                          </td>

                          {/* 36. Education Level */}
                          <td className="px-4 py-3 border-r border-border/40 text-foreground font-medium">
                            {emp.educationLevel || 'Đại học'}
                          </td>

                          {/* 37. Major */}
                          <td className="px-4 py-3 border-r border-border/40 text-muted-foreground truncate max-w-[180px]">
                            {emp.major || '—'}
                          </td>

                          {/* 38. School */}
                          <td className="px-4 py-3 border-r border-border/40 text-muted-foreground truncate max-w-[200px]">
                            {emp.school || '—'}
                          </td>

                          {/* 39. Bank Account */}
                          <td className="px-4 py-3 border-r border-border/40 font-mono font-semibold text-foreground">
                            {emp.bankAccount || '—'}
                          </td>

                          {/* 40. Bank Account Holder */}
                          <td className="px-4 py-3 border-r border-border/40 text-foreground font-medium uppercase truncate max-w-[180px]">
                            {emp.bankAccountHolder || emp.name}
                          </td>

                          {/* 41. Bank Name */}
                          <td className="px-4 py-3 border-r border-border/40 text-muted-foreground">
                            {emp.bankName || '—'}
                          </td>

                          {/* 42. Bank Branch */}
                          <td className="px-4 py-3 border-r border-border/40 text-muted-foreground truncate max-w-[160px]">
                            {emp.bankBranch || '—'}
                          </td>

                          {/* 43. Social Insurance Number */}
                          <td className="px-4 py-3 border-r border-border/40 font-mono text-muted-foreground">
                            {emp.socialInsuranceNumber || '—'}
                          </td>

                          {/* 44. Health Insurance Number */}
                          <td className="px-4 py-3 border-r border-border/40 font-mono text-muted-foreground">
                            {emp.healthInsuranceNumber || '—'}
                          </td>

                          {/* 45. Tax Code */}
                          <td className="px-4 py-3 border-r border-border/40 font-mono text-muted-foreground">
                            {emp.taxCode || '—'}
                          </td>

                          {/* 46. Is Active Account */}
                          <td className="px-4 py-3 border-r border-border/40">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                emp.isActiveAccount !== false && emp.status !== 'resigned'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                  : 'bg-muted text-muted-foreground border-border'
                              }`}
                            >
                              {emp.isActiveAccount !== false && emp.status !== 'resigned' ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Hoạt động
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                  Vô hiệu hóa
                                </>
                              )}
                            </span>
                          </td>

                          {/* 47. Spacer */}
                          <td className="border-r border-border/40 w-4" />

                          {/* 48. Sticky Action */}
                          <td
                            className="sticky right-0 z-[1] px-3 py-3 border-l border-border bg-card group-hover:bg-muted transition-colors text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingEmployee(emp);
                                  setIsFormDrawerOpen(true);
                                }}
                                className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                title="Sửa"
                              >
                                <SquarePen className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEmployee(emp.id)}
                                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination Footer */}
            <div
              data-print="hide"
              className="sticky bottom-0 z-20 bg-card border-t border-border px-3 py-2 flex items-center justify-between gap-3 shrink-0 text-xs text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <span>
                  Tổng cộng: <strong className="text-foreground">{filteredEmployees.length}</strong> nhân sự
                </span>
                {selectedIds.length > 0 && (
                  <span className="text-primary font-medium">
                    (Đã chọn {selectedIds.length})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled
                  className="p-1 rounded border border-border bg-background opacity-50 cursor-not-allowed"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled
                  className="p-1 rounded border border-border bg-background opacity-50 cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground font-bold tabular-nums">
                  1
                </span>
                <span className="text-muted-foreground">/ 1</span>
                <button
                  type="button"
                  disabled
                  className="p-1 rounded border border-border bg-background opacity-50 cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled
                  className="p-1 rounded border border-border bg-background opacity-50 cursor-not-allowed"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Detail Profile Drawer */}
      {selectedEmployeeForDetail && (
        <EmployeeDetailDrawer
          employee={selectedEmployeeForDetail}
          currentIndex={currentDetailIndex}
          totalCount={filteredEmployees.length}
          onClose={() => setSelectedEmployeeForDetail(null)}
          onPrev={() => {
            if (currentDetailIndex > 0) {
              setSelectedEmployeeForDetail(filteredEmployees[currentDetailIndex - 1]);
            }
          }}
          onNext={() => {
            if (currentDetailIndex < filteredEmployees.length - 1) {
              setSelectedEmployeeForDetail(filteredEmployees[currentDetailIndex + 1]);
            }
          }}
          onEdit={(emp) => {
            setSelectedEmployeeForDetail(null);
            setEditingEmployee(emp);
            setIsFormDrawerOpen(true);
          }}
          onDelete={handleDeleteEmployee}
        />
      )}

      {/* Slide-over Form Drawer (Create & Edit) */}
      <EmployeeFormDrawer
        isOpen={isFormDrawerOpen}
        initialData={editingEmployee}
        onClose={() => {
          setIsFormDrawerOpen(false);
          setEditingEmployee(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Toast Notifications */}
      {syncToastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-card border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-xs font-semibold text-foreground">
            {syncToastMessage}
          </span>
        </div>
      )}

      {syncError && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-card border border-destructive/40 text-destructive rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <span className="text-xs font-semibold text-foreground">
            {syncError}
          </span>
        </div>
      )}
    </div>
  );
};
