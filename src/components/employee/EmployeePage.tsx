import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Building2,
  Briefcase,
  Tag,
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
import {
  ColumnCustomizerPopover,
  ColumnItem,
  TableDensity,
} from '../common/ColumnCustomizerPopover';

interface EmployeePageProps {
  onBack: () => void;
}

export const DEFAULT_EMPLOYEE_COLUMNS: ColumnItem[] = [
  { id: 'name', label: 'Họ và tên', visible: true, locked: true },
  { id: 'username', label: 'Tên đăng nhập', visible: true, locked: true },
  { id: 'password', label: 'Mật khẩu', visible: true },
  { id: 'phone', label: 'SĐT', visible: true },
  { id: 'role', label: 'Chức vụ', visible: true },
  { id: 'department', label: 'Phòng ban', visible: true },
  { id: 'subDepartment', label: 'Bộ phận', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'gender', label: 'Giới tính', visible: true },
  { id: 'status', label: 'Trạng thái', visible: true },
  { id: 'createdAt', label: 'Ngày tạo', visible: false },
  { id: 'updatedAt', label: 'Cập nhật', visible: false },
  { id: 'code', label: 'ID', visible: false },
  { id: 'avatarUrl', label: 'Ảnh đại diện', visible: false },
  { id: 'dob', label: 'Ngày sinh', visible: false },
  { id: 'maritalStatus', label: 'Tình trạng hôn nhân', visible: false },
  { id: 'nationality', label: 'Quốc tịch', visible: false },
  { id: 'ethnicity', label: 'Dân tộc', visible: false },
  { id: 'religion', label: 'Tôn giáo', visible: false },
  { id: 'hometown', label: 'Quê quán', visible: false },
  { id: 'jobRole', label: 'Chức vụ (Công việc)', visible: false },
  { id: 'jobDepartment', label: 'Phòng ban (Công việc)', visible: false },
  { id: 'rank', label: 'Cấp bậc', visible: false },
  { id: 'startDate', label: 'Ngày vào làm', visible: false },
  { id: 'officialDate', label: 'Ngày chính thức', visible: false },
  { id: 'resignationDate', label: 'Ngày nghỉ việc', visible: false },
  { id: 'resignationReason', label: 'Lý do nghỉ', visible: false },
  { id: 'idCardNumber', label: 'CMND/CCCD', visible: false },
  { id: 'idCardDate', label: 'Ngày cấp CCCD', visible: false },
  { id: 'idCardPlace', label: 'Nơi cấp', visible: false },
  { id: 'permanentAddress', label: 'Địa chỉ thường trú', visible: false },
  { id: 'currentAddress', label: 'Chỗ ở hiện tại', visible: false },
  { id: 'personalEmail', label: 'Email cá nhân', visible: false },
  { id: 'emergencyContactName', label: 'Người liên hệ khẩn cấp', visible: false },
  { id: 'emergencyContactPhone', label: 'SĐT khẩn cấp', visible: false },
  { id: 'emergencyContactRelation', label: 'Quan hệ', visible: false },
  { id: 'educationLevel', label: 'Trình độ học vấn', visible: false },
  { id: 'major', label: 'Chuyên ngành', visible: false },
  { id: 'school', label: 'Trường đào tạo', visible: false },
  { id: 'bankAccount', label: 'Số tài khoản', visible: false },
  { id: 'bankAccountHolder', label: 'Chủ tài khoản', visible: false },
  { id: 'bankName', label: 'Tên ngân hàng', visible: false },
  { id: 'bankBranch', label: 'Chi nhánh', visible: false },
  { id: 'socialInsuranceNumber', label: 'Số BHXH', visible: false },
  { id: 'healthInsuranceNumber', label: 'Số BHYT', visible: false },
  { id: 'taxCode', label: 'Mã số thuế cá nhân', visible: false },
  { id: 'isActiveAccount', label: 'Tài khoản hoạt động', visible: false },
];

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

  // Column Customizer & Density State
  const [tableColumns, setTableColumns] = useState<ColumnItem[]>(() => {
    try {
      const saved = localStorage.getItem('erp_employee_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p: ColumnItem) => p.id));
          const missing = DEFAULT_EMPLOYEE_COLUMNS.filter((d) => !existingIds.has(d.id));
          return [...parsed, ...missing];
        }
      }
    } catch {}
    return DEFAULT_EMPLOYEE_COLUMNS;
  });

  const [tableDensity, setTableDensity] = useState<TableDensity>(() => {
    try {
      const saved = localStorage.getItem('erp_employee_density');
      if (saved === 'compact' || saved === 'normal' || saved === 'relaxed') {
        return saved;
      }
    } catch {}
    return 'normal';
  });

  const handleSaveColumns = (newCols: ColumnItem[]) => {
    setTableColumns(newCols);
    try {
      localStorage.setItem('erp_employee_columns', JSON.stringify(newCols));
    } catch {}
  };

  const handleSaveDensity = (newDensity: TableDensity) => {
    setTableDensity(newDensity);
    try {
      localStorage.setItem('erp_employee_density', newDensity);
    } catch {}
  };

  const handleResetColumns = () => {
    setTableColumns(DEFAULT_EMPLOYEE_COLUMNS);
    setTableDensity('normal');
    try {
      localStorage.removeItem('erp_employee_columns');
      localStorage.removeItem('erp_employee_density');
    } catch {}
  };

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
        (emp.username && emp.username.toLowerCase().includes(q)) ||
        emp.email.toLowerCase().includes(q) ||
        emp.phone.includes(q) ||
        emp.role.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q);

      const matchDept = selectedDept === 'all' || emp.department === selectedDept;
      const matchRole = selectedRole === 'all' || emp.role === selectedRole;
      const matchStatus = selectedStatus === 'all' || emp.status === selectedStatus;

      return matchQuery && matchDept && matchRole && matchStatus;
    });
  }, [employees, searchQuery, selectedDept, selectedRole, selectedStatus]);

  // Unique Filter Options
  const departmentOptions = useMemo(() => {
    const set = new Set(employees.map((e) => e.department).filter(Boolean));
    return Array.from(set);
  }, [employees]);

  const roleOptions = useMemo(() => {
    const set = new Set(employees.map((e) => e.role).filter(Boolean));
    return Array.from(set);
  }, [employees]);

  // Bulk Selection
  const isAllSelected =
    filteredEmployees.length > 0 && selectedIds.length === filteredEmployees.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map((e) => e.id));
    }
  };

  const handleToggleSelect = (id: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
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
        showToast(`Đã thêm nhân viên ${created.name} và đồng bộ lên Google Sheet!`);
      } else {
        showToast('Đã thêm nhân viên vào bộ nhớ tạm.', true);
      }
    }
  };

  // Delete
  const handleDeleteEmployee = async (id: string) => {
    const deleted = employees.find((e) => e.id === id);
    const updatedList = employees.filter((e) => e.id !== id);
    setEmployees(updatedList);
    employeeService.saveToCache(updatedList);
    if (selectedEmployeeForDetail?.id === id) {
      setSelectedEmployeeForDetail(null);
    }
    setSelectedIds((prev) => prev.filter((i) => i !== id));

    setIsSyncing(true);
    const ok = await employeeService.syncAllToSheet(updatedList);
    setIsSyncing(false);
    if (ok) {
      showToast(`Đã xóa ${deleted?.name || 'nhân viên'} và đồng bộ Google Sheet!`);
    } else {
      showToast('Đã xóa nhân viên khỏi bộ nhớ.', true);
    }
  };

  // Manual Sync from Google Sheet
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
      e.educationLevel || '',
      `"${e.major || ''}"`,
      `"${e.school || ''}"`,
      `"${e.bankAccount || ''}"`,
      `"${e.bankAccountHolder || ''}"`,
      `"${e.bankName || ''}"`,
      `"${e.bankBranch || ''}"`,
      `"${e.socialInsuranceNumber || ''}"`,
      `"${e.healthInsuranceNumber || ''}"`,
      `"${e.taxCode || ''}"`,
      e.status !== 'resigned' ? 'Hoạt động' : 'Đã khoá',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `danh_sach_nhan_su_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV thành công!');
  };

  const renderStatusBadge = (status: Employee['status']) => {
    switch (status) {
      case 'working':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Đang làm việc
          </span>
        );
      case 'probation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Thử việc
          </span>
        );
      case 'resigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Đã nghỉ việc
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-destructive/10 text-destructive border border-destructive/20">
            Tạm hoãn
          </span>
        );
    }
  };

  const currentDetailIndex = useMemo(() => {
    if (!selectedEmployeeForDetail) return -1;
    return filteredEmployees.findIndex((e) => e.id === selectedEmployeeForDetail.id);
  }, [selectedEmployeeForDetail, filteredEmployees]);

  const headerPaddingClass =
    tableDensity === 'compact' ? 'py-1.5' : tableDensity === 'relaxed' ? 'py-3.5' : 'py-2.5';
  const cellPaddingClass =
    tableDensity === 'compact'
      ? 'py-1.5 px-4'
      : tableDensity === 'relaxed'
      ? 'py-4 px-4'
      : 'py-3 px-4';

  const renderEmployeeCell = (colId: string, emp: Employee) => {
    switch (colId) {
      case 'password':
        return (
          <td key={colId} className={`${cellPaddingClass} border-r border-border/40 font-mono text-muted-foreground`}>
            {emp.password ? emp.password : '••••••••'}
          </td>
        );
      case 'phone':
        return (
          <td key={colId} className={`${cellPaddingClass} border-r border-border/40`}>
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
        );
      case 'role':
        return (
          <td key={colId} className={`${cellPaddingClass} border-r border-border/40`}>
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <Briefcase className="w-3 h-3 text-primary/70 shrink-0" />
              {emp.role}
            </span>
          </td>
        );
      case 'department':
        return (
          <td key={colId} className={`${cellPaddingClass} border-r border-border/40`}>
            <span className="flex items-center gap-1.5 text-foreground">
              <Building2 className="w-3 h-3 text-primary/70 shrink-0" />
              {emp.department}
            </span>
          </td>
        );
      case 'subDepartment':
        return (
          <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>
            {emp.subDepartment || '—'}
          </td>
        );
      case 'email':
        return (
          <td key={colId} className={`${cellPaddingClass} border-r border-border/40`}>
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
        );
      case 'gender':
        return (
          <td key={colId} className={`${cellPaddingClass} border-r border-border/40`}>
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
        );
      case 'status':
        return (
          <td key={colId} className={`${cellPaddingClass} border-r border-border/40`}>
            {renderStatusBadge(emp.status)}
          </td>
        );
      case 'createdAt':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 tabular-nums text-muted-foreground`}>{emp.createdAt}</td>;
      case 'updatedAt':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 tabular-nums text-muted-foreground`}>{emp.updatedAt}</td>;
      case 'code':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 font-mono font-semibold text-foreground`}>{emp.code}</td>;
      case 'avatarUrl':
        return (
          <td key={colId} className={`${cellPaddingClass} border-r border-border/40`}>
            <img
              src={emp.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`}
              alt=""
              className="w-7 h-7 rounded-md object-cover border border-border"
            />
          </td>
        );
      case 'dob':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 tabular-nums text-muted-foreground`}>{emp.dob || '—'}</td>;
      case 'maritalStatus':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>{emp.maritalStatus || '—'}</td>;
      case 'nationality':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>{emp.nationality || '—'}</td>;
      case 'ethnicity':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>{emp.ethnicity || '—'}</td>;
      case 'religion':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>{emp.religion || '—'}</td>;
      case 'hometown':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>{emp.hometown || '—'}</td>;
      case 'jobRole':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-foreground`}>{emp.role}</td>;
      case 'jobDepartment':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-foreground`}>{emp.department}</td>;
      case 'rank':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>Bậc {emp.rank || 1}</td>;
      case 'startDate':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 tabular-nums text-muted-foreground`}>{emp.startDate || '—'}</td>;
      case 'officialDate':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 tabular-nums text-muted-foreground`}>{emp.officialDate || '—'}</td>;
      case 'resignationDate':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 tabular-nums text-destructive font-medium`}>{emp.resignationDate || '—'}</td>;
      case 'resignationReason':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>{emp.resignationReason || '—'}</td>;
      case 'idCardNumber':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 font-mono text-foreground`}>{emp.idCardNumber || '—'}</td>;
      case 'idCardDate':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 tabular-nums text-muted-foreground`}>{emp.idCardDate || '—'}</td>;
      case 'idCardPlace':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>{emp.idCardPlace || '—'}</td>;
      case 'permanentAddress':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>{emp.permanentAddress || '—'}</td>;
      case 'currentAddress':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>{emp.currentAddress || '—'}</td>;
      case 'personalEmail':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>{emp.personalEmail || '—'}</td>;
      case 'emergencyContactName':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 font-medium text-foreground`}>{emp.emergencyContactName || '—'}</td>;
      case 'emergencyContactPhone':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 font-mono text-primary`}>{emp.emergencyContactPhone || '—'}</td>;
      case 'emergencyContactRelation':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>{emp.emergencyContactRelation || '—'}</td>;
      case 'educationLevel':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>{emp.educationLevel || '—'}</td>;
      case 'major':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>{emp.major || '—'}</td>;
      case 'school':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>{emp.school || '—'}</td>;
      case 'bankAccount':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 font-mono font-bold text-foreground`}>{emp.bankAccount || '—'}</td>;
      case 'bankAccountHolder':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 font-semibold text-foreground uppercase`}>{emp.bankAccountHolder || emp.name}</td>;
      case 'bankName':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>{emp.bankName || '—'}</td>;
      case 'bankBranch':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 text-muted-foreground`}>{emp.bankBranch || '—'}</td>;
      case 'socialInsuranceNumber':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 font-mono text-muted-foreground`}>{emp.socialInsuranceNumber || '—'}</td>;
      case 'healthInsuranceNumber':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 font-mono text-muted-foreground`}>{emp.healthInsuranceNumber || '—'}</td>;
      case 'taxCode':
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40 font-mono text-foreground`}>{emp.taxCode || '—'}</td>;
      case 'isActiveAccount':
        return (
          <td key={colId} className={`${cellPaddingClass} border-r border-border/40`}>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                emp.status !== 'resigned'
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {emp.status !== 'resigned' ? 'Hoạt động' : 'Đã khoá'}
            </span>
          </td>
        );
      default:
        return <td key={colId} className={`${cellPaddingClass} border-r border-border/40`}>—</td>;
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Main Card Container */}
        <div className="flex-1 min-h-0 flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          {/* Header Bar */}
          <div className="p-4 border-b border-border space-y-4">
            {/* Top row: Back button, Title & Stats Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Quay lại Hệ thống"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base md:text-lg font-bold text-foreground">
                      Hồ sơ nhân sự
                    </h1>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-semibold">
                      {employees.length}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Quản lý danh sách, thông tin nhân viên, phòng ban và chức vụ
                  </p>
                </div>
              </div>

              {/* Top View Tabs: Danh sách / Thống kê */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTopTab('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTopTab === 'list'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  Danh sách
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTopTab('stats')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTopTab === 'stats'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ChartColumn className="w-3.5 h-3.5" />
                  Thống kê
                </button>
              </div>
            </div>

            {/* Bottom Row Filters and Actions */}
            {activeTopTab === 'list' && (
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
                {/* Search and Filters */}
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên, mã NV, username, SĐT, email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-9 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Filter: Department */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedDept !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>
                        {selectedDept === 'all' ? 'Phòng ban' : selectedDept}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>
                    {isDeptDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsDeptDropdownOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-1.5 w-48 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDept('all');
                              setIsDeptDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                              selectedDept === 'all'
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            Tất cả phòng ban
                          </button>
                          {departmentOptions.map((dept) => (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => {
                                setSelectedDept(dept);
                                setIsDeptDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate ${
                                selectedDept === dept
                                  ? 'bg-primary text-primary-foreground font-semibold'
                                  : 'hover:bg-muted text-foreground'
                              }`}
                            >
                              {dept}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter: Role */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedRole !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>
                        {selectedRole === 'all' ? 'Chức vụ' : selectedRole}
                      </span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>
                    {isRoleDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsRoleDropdownOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-1.5 w-48 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5 max-h-60 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRole('all');
                              setIsRoleDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                              selectedRole === 'all'
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            Tất cả chức vụ
                          </button>
                          {roleOptions.map((role) => (
                            <button
                              key={role}
                              type="button"
                              onClick={() => {
                                setSelectedRole(role);
                                setIsRoleDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate ${
                                selectedRole === role
                                  ? 'bg-primary text-primary-foreground font-semibold'
                                  : 'hover:bg-muted text-foreground'
                              }`}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter: Status */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedStatus !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>
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
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>
                    {isStatusDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsStatusDropdownOpen(false)}
                        />
                        <div className="absolute left-0 top-full mt-1.5 w-44 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatus('all');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                              selectedStatus === 'all'
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            Tất cả trạng thái
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatus('working');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-emerald-600 ${
                              selectedStatus === 'working' ? 'bg-emerald-500/10 font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Đang làm việc
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatus('probation');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-amber-600 ${
                              selectedStatus === 'probation' ? 'bg-amber-500/10 font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Thử việc
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatus('resigned');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-slate-600 ${
                              selectedStatus === 'resigned' ? 'bg-slate-500/10 font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Đã nghỉ việc
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatus('suspended');
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors text-destructive ${
                              selectedStatus === 'suspended' ? 'bg-destructive/10 font-semibold' : 'hover:bg-muted'
                            }`}
                          >
                            Tạm hoãn
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
                  {/* Google Sheets Live Sync */}
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    title="Đồng bộ 2 chiều với Google Sheet: H161 react (tab: Nhân viên)"
                    className="h-8 px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">
                      {isSyncing ? 'Đang đồng bộ...' : 'Google Sheet'}
                    </span>
                  </button>

                  <button
                    type="button"
                    title="Ghim mục"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>

                  {/* Column Customizer Popover */}
                  <ColumnCustomizerPopover
                    columns={tableColumns}
                    onChangeColumns={handleSaveColumns}
                    density={tableDensity}
                    onChangeDensity={handleSaveDensity}
                    onReset={handleResetColumns}
                    align="right"
                  />

                  {/* Grid / Table Toggle */}
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                    title={viewMode === 'table' ? 'Xem dạng lưới thẻ' : 'Xem dạng danh sách bảng'}
                    className={`h-8 w-8 flex items-center justify-center border rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>

                  {/* Export CSV */}
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    title="Xuất file CSV"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Add Employee */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEmployee(null);
                      setIsFormDrawerOpen(true);
                    }}
                    className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tab 2: Thống kê */}
          {activeTopTab === 'stats' && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <EmployeeStatsTab employees={employees} />
            </div>
          )}

          {/* Tab 1: Danh sách */}
          {activeTopTab === 'list' && (
            <div className="flex-1 min-h-0 flex flex-col">
              {viewMode === 'table' ? (
                /* Desktop Table View */
                <div className="flex-1 min-h-0 relative overflow-hidden">
                  <div className="h-full overflow-auto custom-scrollbar">
                    <table className="text-left border-separate border-spacing-0 w-full text-xs">
                      <thead className="sticky top-0 z-[10] bg-muted">
                        <tr className="border-b border-border bg-muted">
                          {/* 1. Sticky Checkbox */}
                          <th className={`sticky left-0 z-[12] px-3 bg-muted border-b border-r border-border text-center ${headerPaddingClass} w-11`}>
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={handleSelectAll}
                              className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                            />
                          </th>

                          {/* 2. Sticky Họ và tên */}
                          <th className={`sticky left-11 z-[12] bg-muted font-semibold text-foreground border-b border-r border-border whitespace-nowrap px-4 ${headerPaddingClass} min-w-[200px]`}>
                            Họ và tên
                          </th>

                          {/* 3. Sticky Tên đăng nhập */}
                          <th className={`sticky left-[244px] z-[12] bg-muted font-semibold text-foreground border-b border-r border-border whitespace-nowrap px-4 ${headerPaddingClass} min-w-[150px]`}>
                            Tên đăng nhập
                          </th>

                          {/* Dynamic Visible Columns */}
                          {tableColumns
                            .filter((c) => c.visible && c.id !== 'name' && c.id !== 'username')
                            .map((col) => (
                              <th
                                key={col.id}
                                className={`font-semibold text-foreground border-b border-r border-border whitespace-nowrap px-4 ${headerPaddingClass}`}
                              >
                                {col.label}
                              </th>
                            ))}

                          {/* Sticky Thao tác Action Header */}
                          <th className={`sticky right-0 z-[12] px-3 bg-muted border-b border-l border-border text-center font-semibold text-foreground ${headerPaddingClass} w-20`}>
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.length === 0 ? (
                          <tr>
                            <td
                              colSpan={tableColumns.filter((c) => c.visible).length + 2}
                              className="py-12 text-center text-muted-foreground"
                            >
                              Không tìm thấy nhân viên nào phù hợp
                            </td>
                          </tr>
                        ) : (
                          filteredEmployees.map((emp) => {
                            const isSelected = selectedIds.includes(emp.id);
                            const isActiveDetail = selectedEmployeeForDetail?.id === emp.id;

                            return (
                              <tr
                                key={emp.id}
                                onClick={() => setSelectedEmployeeForDetail(emp)}
                                aria-current={isActiveDetail}
                                className={`group cursor-pointer transition-colors ${
                                  isActiveDetail
                                    ? 'bg-primary/[0.07] hover:bg-primary/[0.1]'
                                    : isSelected
                                    ? 'bg-primary/5 hover:bg-accent'
                                    : 'bg-card even:bg-muted/15 hover:bg-accent'
                                } [&>td]:border-b [&>td]:border-border`}
                              >
                                {/* 1. Sticky Checkbox */}
                                <td
                                  className={`sticky left-0 z-[2] px-3 ${cellPaddingClass.split(' ')[0]} border-r border-border text-center ${
                                    isActiveDetail
                                      ? 'bg-accent shadow-[inset_3px_0_0_var(--color-primary)]'
                                      : 'bg-inherit'
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelect(emp.id)}
                                    className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                                  />
                                </td>

                                {/* 2. Sticky Họ và tên */}
                                <td
                                  className={`sticky left-11 z-[2] px-4 ${cellPaddingClass.split(' ')[0]} border-r border-border/60 bg-inherit font-medium text-foreground`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <img
                                      src={emp.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=1d4ed8&color=fff`}
                                      alt={emp.name}
                                      className="w-6 h-6 rounded-full object-cover border border-border shrink-0"
                                    />
                                    <span className="truncate font-semibold text-foreground">
                                      {emp.name}
                                    </span>
                                  </div>
                                </td>

                                {/* 3. Sticky Tên đăng nhập */}
                                <td
                                  className={`sticky left-[244px] z-[2] px-4 ${cellPaddingClass.split(' ')[0]} border-r border-border/60 bg-inherit font-mono text-primary`}
                                >
                                  <div className="flex items-center gap-1">
                                    <span className="truncate">{emp.username || '—'}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedEmployeeForDetail(emp);
                                      }}
                                      title="Xem chi tiết"
                                      className="shrink-0 p-0.5 rounded text-primary hover:bg-primary/10"
                                    >
                                      <Link2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>

                                {/* Dynamic Columns */}
                                {tableColumns
                                  .filter((c) => c.visible && c.id !== 'name' && c.id !== 'username')
                                  .map((col) => renderEmployeeCell(col.id, emp))}

                                {/* Sticky Thao tác */}
                                <td className={`sticky right-0 z-[2] px-2 ${cellPaddingClass.split(' ')[0]} border-l border-border/50 text-center bg-inherit`}>
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      title="Chỉnh sửa thông tin"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingEmployee(emp);
                                        setIsFormDrawerOpen(true);
                                      }}
                                      className="p-1 rounded-md text-primary hover:bg-primary/10 transition-colors"
                                    >
                                      <SquarePen className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Xóa nhân viên"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Bạn có chắc chắn muốn xóa nhân viên "${emp.name}"?`)) {
                                          handleDeleteEmployee(emp.id);
                                        }
                                      }}
                                      className="p-1 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Grid Cards View */
                <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => setSelectedEmployeeForDetail(emp)}
                        className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={emp.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=1d4ed8&color=fff`}
                              alt={emp.name}
                              className="w-11 h-11 rounded-xl object-cover border border-border shrink-0"
                            />
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm text-foreground truncate">
                                {emp.name}
                              </h3>
                              <p className="text-xs font-mono text-primary truncate">
                                @{emp.username || emp.code}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {emp.role}
                              </p>
                            </div>
                          </div>
                          {renderStatusBadge(emp.status)}
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-3 h-3 text-primary/70" />
                              Phòng ban:
                            </span>
                            <span className="font-medium text-foreground truncate max-w-[130px]">
                              {emp.department}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-primary/70" />
                              SĐT:
                            </span>
                            <span className="font-mono text-foreground">{emp.phone}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-primary/70" />
                              Email:
                            </span>
                            <span className="truncate max-w-[150px] text-foreground">{emp.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/40">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEmployee(emp);
                              setIsFormDrawerOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs rounded-lg border border-border hover:bg-muted text-primary flex items-center gap-1 font-medium transition-colors"
                          >
                            <SquarePen className="w-3 h-3" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Bạn có chắc chắn muốn xóa nhân viên "${emp.name}"?`)) {
                                handleDeleteEmployee(emp.id);
                              }
                            }}
                            className="px-2.5 py-1 text-xs rounded-lg border border-destructive/20 hover:bg-destructive/10 text-destructive flex items-center gap-1 font-medium transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Table / Grid Footer Pagination */}
              <div className="p-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground shrink-0 bg-card">
                <div>
                  Hiển thị <span className="font-semibold text-foreground">{filteredEmployees.length}</span> / {employees.length} nhân viên
                  {selectedIds.length > 0 && (
                    <span className="ml-2 font-medium text-primary">
                      (Đã chọn {selectedIds.length})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled
                    className="p-1.5 rounded-lg border border-border opacity-50 cursor-not-allowed"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled
                    className="p-1.5 rounded-lg border border-border opacity-50 cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2.5 py-1 bg-primary text-primary-foreground font-semibold rounded-lg text-xs">
                    1
                  </span>
                  <button
                    type="button"
                    disabled
                    className="p-1.5 rounded-lg border border-border opacity-50 cursor-not-allowed"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled
                    className="p-1.5 rounded-lg border border-border opacity-50 cursor-not-allowed"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedEmployeeForDetail && (
        <EmployeeDetailDrawer
          employee={selectedEmployeeForDetail}
          currentIndex={currentDetailIndex}
          totalCount={filteredEmployees.length}
          onClose={() => setSelectedEmployeeForDetail(null)}
          onEdit={(emp) => {
            setSelectedEmployeeForDetail(null);
            setEditingEmployee(emp);
            setIsFormDrawerOpen(true);
          }}
          onDelete={(id) => handleDeleteEmployee(id)}
          onNext={() => {
            if (currentDetailIndex < filteredEmployees.length - 1) {
              setSelectedEmployeeForDetail(filteredEmployees[currentDetailIndex + 1]);
            }
          }}
          onPrev={() => {
            if (currentDetailIndex > 0) {
              setSelectedEmployeeForDetail(filteredEmployees[currentDetailIndex - 1]);
            }
          }}
        />
      )}

      {/* Form Drawer (Create / Edit) */}
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
