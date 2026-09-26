import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  Pin,
  SlidersHorizontal,
  Printer,
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
  { id: 'name', label: 'Họ và tên', visible: true, pinned: true, width: 220, align: 'left', wrap: 'truncate' },
  { id: 'username', label: 'Tên đăng nhập', visible: true, pinned: false, width: 160, align: 'left', wrap: 'truncate' },
  { id: 'password', label: 'Mật khẩu', visible: true, width: 140, align: 'left', wrap: 'truncate' },
  { id: 'phone', label: 'SĐT', visible: true, width: 150, align: 'left', wrap: 'truncate' },
  { id: 'role', label: 'Chức vụ', visible: true, width: 200, align: 'left', wrap: 'truncate' },
  { id: 'department', label: 'Phòng ban', visible: true, width: 200, align: 'left', wrap: 'truncate' },
  { id: 'subDepartment', label: 'Bộ phận', visible: true, width: 180, align: 'left', wrap: 'truncate' },
  { id: 'email', label: 'Email', visible: true, width: 220, align: 'left', wrap: 'truncate' },
  { id: 'gender', label: 'Giới tính', visible: true, width: 110, align: 'center', wrap: 'truncate' },
  { id: 'status', label: 'Trạng thái', visible: true, width: 140, align: 'center', wrap: 'truncate' },
  { id: 'createdAt', label: 'Ngày tạo', visible: false, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'updatedAt', label: 'Cập nhật', visible: false, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'code', label: 'ID', visible: false, width: 110, align: 'center', wrap: 'truncate' },
  { id: 'avatarUrl', label: 'Ảnh đại diện', visible: false, width: 110, align: 'center', wrap: 'truncate' },
  { id: 'dob', label: 'Ngày sinh', visible: false, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'maritalStatus', label: 'Tình trạng hôn nhân', visible: false, width: 160, align: 'left', wrap: 'truncate' },
  { id: 'nationality', label: 'Quốc tịch', visible: false, width: 130, align: 'left', wrap: 'truncate' },
  { id: 'ethnicity', label: 'Dân tộc', visible: false, width: 120, align: 'left', wrap: 'truncate' },
  { id: 'religion', label: 'Tôn giáo', visible: false, width: 120, align: 'left', wrap: 'truncate' },
  { id: 'hometown', label: 'Quê quán', visible: false, width: 170, align: 'left', wrap: 'truncate' },
  { id: 'jobRole', label: 'Chức vụ (Công việc)', visible: false, width: 190, align: 'left', wrap: 'truncate' },
  { id: 'jobDepartment', label: 'Phòng ban (Công việc)', visible: false, width: 190, align: 'left', wrap: 'truncate' },
  { id: 'rank', label: 'Cấp bậc', visible: false, width: 110, align: 'center', wrap: 'truncate' },
  { id: 'startDate', label: 'Ngày vào làm', visible: false, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'officialDate', label: 'Ngày chính thức', visible: false, width: 140, align: 'center', wrap: 'truncate' },
  { id: 'resignationDate', label: 'Ngày nghỉ việc', visible: false, width: 140, align: 'center', wrap: 'truncate' },
  { id: 'resignationReason', label: 'Lý do nghỉ', visible: false, width: 200, align: 'left', wrap: 'truncate' },
  { id: 'idCardNumber', label: 'CMND/CCCD', visible: false, width: 160, align: 'center', wrap: 'truncate' },
  { id: 'idCardDate', label: 'Ngày cấp CCCD', visible: false, width: 130, align: 'center', wrap: 'truncate' },
  { id: 'idCardPlace', label: 'Nơi cấp', visible: false, width: 220, align: 'left', wrap: 'truncate' },
  { id: 'permanentAddress', label: 'Địa chỉ thường trú', visible: false, width: 240, align: 'left', wrap: 'truncate' },
  { id: 'currentAddress', label: 'Chỗ ở hiện tại', visible: false, width: 240, align: 'left', wrap: 'truncate' },
  { id: 'personalEmail', label: 'Email cá nhân', visible: false, width: 220, align: 'left', wrap: 'truncate' },
  { id: 'emergencyContactName', label: 'Người liên hệ khẩn cấp', visible: false, width: 190, align: 'left', wrap: 'truncate' },
  { id: 'emergencyContactPhone', label: 'SĐT khẩn cấp', visible: false, width: 150, align: 'center', wrap: 'truncate' },
  { id: 'emergencyContactRelation', label: 'Quan hệ', visible: false, width: 130, align: 'left', wrap: 'truncate' },
  { id: 'educationLevel', label: 'Trình độ học vấn', visible: false, width: 150, align: 'left', wrap: 'truncate' },
  { id: 'major', label: 'Chuyên ngành', visible: false, width: 180, align: 'left', wrap: 'truncate' },
  { id: 'school', label: 'Trường đào tạo', visible: false, width: 200, align: 'left', wrap: 'truncate' },
  { id: 'bankAccount', label: 'Số tài khoản', visible: false, width: 170, align: 'left', wrap: 'truncate' },
  { id: 'bankAccountHolder', label: 'Chủ tài khoản', visible: false, width: 190, align: 'left', wrap: 'truncate' },
  { id: 'bankName', label: 'Tên ngân hàng', visible: false, width: 170, align: 'left', wrap: 'truncate' },
  { id: 'bankBranch', label: 'Chi nhánh', visible: false, width: 170, align: 'left', wrap: 'truncate' },
  { id: 'socialInsuranceNumber', label: 'Số BHXH', visible: false, width: 150, align: 'center', wrap: 'truncate' },
  { id: 'healthInsuranceNumber', label: 'Số BHYT', visible: false, width: 150, align: 'center', wrap: 'truncate' },
  { id: 'taxCode', label: 'Mã số thuế cá nhân', visible: false, width: 160, align: 'center', wrap: 'truncate' },
  { id: 'isActiveAccount', label: 'Tài khoản hoạt động', visible: false, width: 160, align: 'center', wrap: 'truncate' },
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

  // Resizing state
  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const resizingRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);
  const lastSelectedIdRef = useRef<string | null>(null);

  // Column Customizer & Density State
  const [tableColumns, setTableColumns] = useState<ColumnItem[]>(() => {
    try {
      const saved = localStorage.getItem('erp_employee_columns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingMap = new Map(parsed.map((p: ColumnItem) => [p.id, p]));
          const merged: ColumnItem[] = [];
          parsed.forEach((p: ColumnItem) => {
            const def = DEFAULT_EMPLOYEE_COLUMNS.find((d) => d.id === p.id);
            if (def) {
              merged.push({
                ...def,
                ...p,
                width: p.width || def.width || 160,
                pinned: p.pinned !== undefined ? p.pinned : def.pinned,
                align: p.align || def.align || 'left',
                wrap: p.wrap || def.wrap || 'truncate',
              });
            }
          });
          DEFAULT_EMPLOYEE_COLUMNS.forEach((def) => {
            if (!existingMap.has(def.id)) {
              merged.push(def);
            }
          });
          return merged;
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

  // Interactive Column Resizing from Table Header
  const handleStartResize = useCallback(
    (columnId: string, startEvent: React.MouseEvent) => {
      startEvent.preventDefault();
      startEvent.stopPropagation();
      const col = tableColumns.find((c) => c.id === columnId);
      const currentWidth = col?.width || 160;

      setResizingColId(columnId);
      resizingRef.current = {
        colId: columnId,
        startX: startEvent.clientX,
        startWidth: currentWidth,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizingRef.current) return;
        const delta = moveEvent.clientX - resizingRef.current.startX;
        const nextWidth = Math.max(60, Math.min(1200, resizingRef.current.startWidth + delta));

        setTableColumns((prev) =>
          prev.map((c) => (c.id === resizingRef.current?.colId ? { ...c, width: nextWidth } : c))
        );
      };

      const handleMouseUp = () => {
        setResizingColId(null);
        resizingRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        setTableColumns((current) => {
          try {
            localStorage.setItem('erp_employee_columns', JSON.stringify(current));
          } catch {}
          return current;
        });
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [tableColumns]
  );

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

  const handleToggleSelect = (id: string, e?: React.MouseEvent | React.SyntheticEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();

    const isShiftKey = (e as React.MouseEvent)?.shiftKey;
    const currentIndex = filteredEmployees.findIndex((emp) => emp.id === id);

    if (isShiftKey && lastSelectedIdRef.current !== null && currentIndex !== -1) {
      const lastIndex = filteredEmployees.findIndex((emp) => emp.id === lastSelectedIdRef.current);
      if (lastIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = filteredEmployees.slice(start, end + 1).map((emp) => emp.id);

        setSelectedIds((prev) => {
          const isTargetSelected = prev.includes(id);
          if (isTargetSelected) {
            const rangeSet = new Set(rangeIds);
            return prev.filter((item) => !rangeSet.has(item));
          } else {
            const combined = new Set([...prev, ...rangeIds]);
            return Array.from(combined);
          }
        });
        lastSelectedIdRef.current = id;
        return;
      }
    }

    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    lastSelectedIdRef.current = id;
  };

  // Bulk Delete
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${count} nhân viên đã chọn?`)) return;

    const idSet = new Set(selectedIds);
    const toDelete = employees.filter((e) => idSet.has(e.id));
    const identifiersToDelete: string[] = [];
    toDelete.forEach((e) => {
      if (e.code) identifiersToDelete.push(e.code);
      if (e.username) identifiersToDelete.push(e.username);
      if (e.name) identifiersToDelete.push(e.name);
      if (e.id) identifiersToDelete.push(e.id);
    });

    const updatedList = employees.filter((e) => !idSet.has(e.id));
    setEmployees(updatedList);
    employeeService.saveToCache(updatedList);

    if (selectedEmployeeForDetail && idSet.has(selectedEmployeeForDetail.id)) {
      setSelectedEmployeeForDetail(null);
    }
    setSelectedIds([]);

    setIsSyncing(true);
    // Delete ONLY selected rows from Google Sheet
    const ok = await employeeService.deleteFromSheet(identifiersToDelete);
    setIsSyncing(false);
    if (ok) {
      showToast(`Đã xóa thành công ${count} nhân viên và đồng bộ Google Sheet!`);
    } else {
      showToast(`Đã xóa ${count} nhân viên khỏi bộ nhớ.`, true);
    }
  };

  // Create / Edit Submit
  const handleFormSubmit = async (formData: Partial<Employee>) => {
    if (editingEmployee) {
      // Update existing
      const updatedEmployee = {
        ...editingEmployee,
        ...formData,
        updatedAt: new Date().toLocaleDateString('vi-VN'),
      } as Employee;

      const updatedList = employees.map((e) =>
        e.id === editingEmployee.id ? updatedEmployee : e
      );
      setEmployees(updatedList);
      employeeService.saveToCache(updatedList);

      if (selectedEmployeeForDetail?.id === editingEmployee.id) {
        setSelectedEmployeeForDetail(updatedEmployee);
      }

      setIsFormDrawerOpen(false);
      setEditingEmployee(null);

      // Update ONLY this specific row on Google Sheet
      setIsSyncing(true);
      const ok = await employeeService.updateInSheet(updatedEmployee);
      setIsSyncing(false);
      if (ok) {
        showToast(`Đã cập nhật ${editingEmployee.name} trên Google Sheet!`);
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
        role: formData.role || '',
        department: formData.department || '',
        subDepartment: formData.subDepartment || '',
        gender: formData.gender || 'Nam',
        status: formData.status || 'working',
        createdAt: dateStr,
        updatedAt: dateStr,
        avatarUrl:
          formData.avatarUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=1d4ed8&color=fff`,
        dob: formData.dob || '',
        maritalStatus: formData.maritalStatus || '',
        nationality: formData.nationality || '',
        ethnicity: formData.ethnicity || '',
        religion: formData.religion || '',
        hometown: formData.hometown || '',
        rank: formData.rank || '',
        startDate: formData.startDate || '',
        officialDate: formData.officialDate || '',
        resignationDate: formData.resignationDate || '',
        resignationReason: formData.resignationReason || '',
        idCardNumber: formData.idCardNumber || '',
        idCardDate: formData.idCardDate || '',
        idCardPlace: formData.idCardPlace || '',
        permanentAddress: formData.permanentAddress || '',
        currentAddress: formData.currentAddress || '',
        personalEmail: formData.personalEmail || '',
        emergencyContactName: formData.emergencyContactName || '',
        emergencyContactPhone: formData.emergencyContactPhone || '',
        emergencyContactRelation: formData.emergencyContactRelation || '',
        educationLevel: formData.educationLevel || '',
        major: formData.major || '',
        school: formData.school || '',
        bankAccount: formData.bankAccount || '',
        bankAccountHolder: formData.bankAccountHolder || (formData.name ? formData.name.toUpperCase() : ''),
        bankName: formData.bankName || '',
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

      // Append ONLY 1 new row to Google Sheet
      setIsSyncing(true);
      const ok = await employeeService.appendToSheet(created);
      setIsSyncing(false);
      if (ok) {
        showToast(`Đã thêm nhân viên "${created.name}" vào Google Sheet thành công!`);
      } else {
        showToast('Đã thêm nhân viên vào bộ nhớ tạm.', true);
      }
    }
  };

  // Delete
  const handleDeleteEmployee = async (id: string) => {
    const deleted = employees.find((e) => e.id === id);
    if (!deleted) return;
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${deleted.name}"?`);
    if (!confirmDelete) return;

    const updatedList = employees.filter((e) => e.id !== id);
    setEmployees(updatedList);
    employeeService.saveToCache(updatedList);
    if (selectedEmployeeForDetail?.id === id) {
      setSelectedEmployeeForDetail(null);
    }
    setSelectedIds((prev) => prev.filter((i) => i !== id));

    setIsSyncing(true);
    // Delete ONLY this specific row from Google Sheet
    const ok = await employeeService.deleteFromSheet([
      deleted.code,
      deleted.username,
      deleted.name,
      deleted.id,
    ].filter(Boolean) as string[]);
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

  // Dynamic widths for sticky columns
    // Visible columns in order
  const visibleColumns = useMemo(() => {
    return tableColumns.filter((c) => c.visible);
  }, [tableColumns]);

  // Compute dynamic sticky offsets for pinned columns
  const columnOffsets = useMemo(() => {
    const offsets = new Map<string, { isPinned: boolean; left: number; isLastPinned: boolean }>();
    let currentLeft = 44; // Starts right after sticky Checkbox (width 44px)
    let lastPinnedId: string | null = null;

    for (let i = visibleColumns.length - 1; i >= 0; i--) {
      if (visibleColumns[i].pinned) {
        lastPinnedId = visibleColumns[i].id;
        break;
      }
    }

    for (const col of visibleColumns) {
      const colWidth = col.width || 160;
      if (col.pinned) {
        offsets.set(col.id, {
          isPinned: true,
          left: currentLeft,
          isLastPinned: col.id === lastPinnedId,
        });
        currentLeft += colWidth;
      } else {
        offsets.set(col.id, {
          isPinned: false,
          left: 0,
          isLastPinned: false,
        });
      }
    }
    return offsets;
  }, [visibleColumns]);

  const renderEmployeeCell = (col: ColumnItem, emp: Employee, stickyBgClass: string) => {
    const colId = col.id;
    const colWidth = col.width || 160;
    const colAlign = col.align || 'left';
    const isWrap = col.wrap === 'wrap';

    const alignClass =
      colAlign === 'center'
        ? 'text-center'
        : colAlign === 'right'
        ? 'text-right'
        : 'text-left';

    const justifyClass =
      colAlign === 'center'
        ? 'justify-center'
        : colAlign === 'right'
        ? 'justify-end'
        : 'justify-start';

    const textWrapClass = isWrap
      ? 'whitespace-normal break-words leading-relaxed'
      : 'whitespace-nowrap truncate';

    const offsetInfo = columnOffsets.get(col.id);
    const isPinned = !!offsetInfo?.isPinned;
    const pinnedLeft = offsetInfo?.left || 0;
    const isLastPinned = !!offsetInfo?.isLastPinned;

    const stickyTdClass = isPinned
      ? `sticky z-[10] ${stickyBgClass} ${isLastPinned ? 'shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)]' : ''}`
      : '';

    const colStyle: React.CSSProperties = {
      width: colWidth,
      minWidth: colWidth,
      maxWidth: colWidth,
      ...(isPinned ? { left: `${pinnedLeft}px` } : {}),
    };

    const tdBaseClass = `${cellPaddingClass} border-r border-border/40 ${alignClass} ${stickyTdClass}`;

    switch (colId) {
      case 'name':
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
            <div className={`flex items-center ${justifyClass} gap-2 min-w-0`}>
              <img
                src={emp.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=1d4ed8&color=fff`}
                alt={emp.name}
                className="w-6 h-6 rounded-full object-cover border border-border shrink-0"
              />
              <span className={`font-semibold text-foreground ${textWrapClass}`}>
                {emp.name}
              </span>
            </div>
          </td>
        );
      case 'username':
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
            <div className={`flex items-center ${justifyClass} gap-1 min-w-0`}>
              <span className={`font-mono text-primary font-medium ${textWrapClass}`}>{emp.username || '—'}</span>
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
        );

      case 'password':
        return (
          <td
            key={colId}
            style={colStyle}
            className={`${tdBaseClass} font-mono text-muted-foreground ${textWrapClass}`}
          >
            {emp.password ? emp.password : '••••••••'}
          </td>
        );
      case 'phone':
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
            <span className={`flex items-center ${justifyClass} gap-1 text-foreground ${textWrapClass}`}>
              <span className={textWrapClass}>{emp.phone}</span>
              <a
                href={`tel:${emp.phone.replace(/\s+/g, '')}`}
                onClick={(e) => e.stopPropagation()}
                className="text-primary hover:text-primary/80 p-0.5 shrink-0"
                title="Gọi"
              >
                <Phone className="w-3 h-3" />
              </a>
            </span>
          </td>
        );
      case 'role':
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
            {emp.role ? (
              <span className={`flex items-center ${justifyClass} gap-1.5 text-foreground font-medium ${textWrapClass}`}>
                <Briefcase className="w-3 h-3 text-primary/70 shrink-0" />
                <span className={textWrapClass}>{emp.role}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </td>
        );
      case 'department':
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
            {emp.department ? (
              <span className={`flex items-center ${justifyClass} gap-1.5 text-foreground ${textWrapClass}`}>
                <Building2 className="w-3 h-3 text-primary/70 shrink-0" />
                <span className={textWrapClass}>{emp.department}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </td>
        );
      case 'subDepartment':
        return (
          <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>
            {emp.subDepartment || '—'}
          </td>
        );
      case 'email':
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
            <span className={`flex items-center ${justifyClass} gap-1 text-foreground ${textWrapClass}`}>
              <span className={textWrapClass}>{emp.email}</span>
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
          <td key={colId} style={colStyle} className={tdBaseClass}>
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
          <td key={colId} style={colStyle} className={tdBaseClass}>
            <div className={`flex items-center ${justifyClass}`}>
              {renderStatusBadge(emp.status)}
            </div>
          </td>
        );
      case 'createdAt':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} tabular-nums text-muted-foreground ${textWrapClass}`}>{emp.createdAt}</td>;
      case 'updatedAt':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} tabular-nums text-muted-foreground ${textWrapClass}`}>{emp.updatedAt}</td>;
      case 'code':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} font-mono font-semibold text-foreground ${textWrapClass}`}>{emp.code}</td>;
      case 'avatarUrl':
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
            <div className={`flex items-center ${justifyClass}`}>
              <img
                src={emp.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`}
                alt=""
                className="w-7 h-7 rounded-md object-cover border border-border shrink-0"
              />
            </div>
          </td>
        );
      case 'dob':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} tabular-nums text-muted-foreground ${textWrapClass}`}>{emp.dob || '—'}</td>;
      case 'maritalStatus':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>{emp.maritalStatus || '—'}</td>;
      case 'nationality':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>{emp.nationality || '—'}</td>;
      case 'ethnicity':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>{emp.ethnicity || '—'}</td>;
      case 'religion':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>{emp.religion || '—'}</td>;
      case 'hometown':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>{emp.hometown || '—'}</td>;
      case 'jobRole':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-foreground ${textWrapClass}`}>{emp.role}</td>;
      case 'jobDepartment':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-foreground ${textWrapClass}`}>{emp.department}</td>;
      case 'rank':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>Bậc {emp.rank || 1}</td>;
      case 'startDate':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} tabular-nums text-muted-foreground ${textWrapClass}`}>{emp.startDate || '—'}</td>;
      case 'officialDate':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} tabular-nums text-muted-foreground ${textWrapClass}`}>{emp.officialDate || '—'}</td>;
      case 'resignationDate':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} tabular-nums text-destructive font-medium ${textWrapClass}`}>{emp.resignationDate || '—'}</td>;
      case 'resignationReason':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>{emp.resignationReason || '—'}</td>;
      case 'idCardNumber':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} font-mono text-foreground ${textWrapClass}`}>{emp.idCardNumber || '—'}</td>;
      case 'idCardDate':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} tabular-nums text-muted-foreground ${textWrapClass}`}>{emp.idCardDate || '—'}</td>;
      case 'idCardPlace':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>{emp.idCardPlace || '—'}</td>;
      case 'permanentAddress':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>{emp.permanentAddress || '—'}</td>;
      case 'currentAddress':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>{emp.currentAddress || '—'}</td>;
      case 'personalEmail':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>{emp.personalEmail || '—'}</td>;
      case 'emergencyContactName':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} font-medium text-foreground ${textWrapClass}`}>{emp.emergencyContactName || '—'}</td>;
      case 'emergencyContactPhone':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} font-mono text-primary ${textWrapClass}`}>{emp.emergencyContactPhone || '—'}</td>;
      case 'emergencyContactRelation':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>{emp.emergencyContactRelation || '—'}</td>;
      case 'educationLevel':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>{emp.educationLevel || '—'}</td>;
      case 'major':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>{emp.major || '—'}</td>;
      case 'school':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>{emp.school || '—'}</td>;
      case 'bankAccount':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} font-mono font-bold text-foreground ${textWrapClass}`}>{emp.bankAccount || '—'}</td>;
      case 'bankAccountHolder':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} font-semibold text-foreground uppercase ${textWrapClass}`}>{emp.bankAccountHolder || emp.name}</td>;
      case 'bankName':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>{emp.bankName || '—'}</td>;
      case 'bankBranch':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} text-muted-foreground ${textWrapClass}`}>{emp.bankBranch || '—'}</td>;
      case 'socialInsuranceNumber':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} font-mono text-muted-foreground ${textWrapClass}`}>{emp.socialInsuranceNumber || '—'}</td>;
      case 'healthInsuranceNumber':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} font-mono text-muted-foreground ${textWrapClass}`}>{emp.healthInsuranceNumber || '—'}</td>;
      case 'taxCode':
        return <td key={colId} style={colStyle} className={`${tdBaseClass} font-mono text-foreground ${textWrapClass}`}>{emp.taxCode || '—'}</td>;
      case 'isActiveAccount':
        return (
          <td key={colId} style={colStyle} className={tdBaseClass}>
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
        return <td key={colId} style={colStyle} className={tdBaseClass}>—</td>;
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* Top View Tabs: Danh sách / Thống kê */}
      <div className="flex items-center gap-1.5 mb-1.5 px-0.5 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTopTab('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'list'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Danh sách</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTopTab('stats')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'stats'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <ChartColumn className="w-3.5 h-3.5" />
          <span>Thống kê</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {/* Main Card Container */}
        <div className="flex-1 min-h-0 flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          {/* Header Bar Toolbar */}
          {activeTopTab === 'list' && (
            <div className="px-3 py-2 border-b border-border bg-card">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
                {/* Left: Back button, Search and Filters */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                  {/* Quay lại Button */}
                  <button
                    type="button"
                    onClick={onBack}
                    className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                    title="Quay lại Hệ thống"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">Quay lại</span>
                  </button>

                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[160px] max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-auto">
                  {/* Bulk Delete Button when items are selected */}
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      title={`Xóa ${selectedIds.length} nhân viên đã chọn`}
                      className="h-8 px-2.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa ({selectedIds.length})</span>
                    </button>
                  )}

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

                  {/* Print */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    title="In danh sách"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  {/* Bookmark */}
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
            </div>
          )}

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
                    <table className="text-left border-separate border-spacing-0 w-max min-w-full text-xs table-fixed">
                      <thead className="sticky top-0 z-[20] bg-muted">
                        <tr className="border-b border-border bg-muted">
                          {/* 1. Sticky Checkbox */}
                          <th
                            style={{ width: 44, minWidth: 44, maxWidth: 44 }}
                            className={`sticky left-0 z-[25] px-3 bg-muted border-b border-r border-border text-center ${headerPaddingClass} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]`}
                          >
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={handleSelectAll}
                              className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                            />
                          </th>

                          {/* Dynamic Columns (Fully customizable order, visibility & dynamic pinning) */}
                          {visibleColumns.map((col) => {
                            const colWidth = col.width || 160;
                            const colAlign = col.align || 'left';
                            const alignClass = colAlign === 'center' ? 'text-center' : colAlign === 'right' ? 'text-right' : 'text-left';
                            const justifyClass = colAlign === 'center' ? 'justify-center' : colAlign === 'right' ? 'justify-end' : 'justify-between';

                            const offsetInfo = columnOffsets.get(col.id);
                            const isPinned = !!offsetInfo?.isPinned;
                            const pinnedLeft = offsetInfo?.left || 0;
                            const isLastPinned = !!offsetInfo?.isLastPinned;

                            const stickyThClass = isPinned
                              ? `sticky z-[25] bg-muted ${isLastPinned ? 'shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)]' : ''}`
                              : 'bg-muted';

                            const thStyle: React.CSSProperties = {
                              width: colWidth,
                              minWidth: colWidth,
                              maxWidth: colWidth,
                              ...(isPinned ? { left: `${pinnedLeft}px` } : {}),
                            };

                            return (
                              <th
                                key={col.id}
                                style={thStyle}
                                className={`font-semibold text-foreground border-b border-r border-border whitespace-nowrap px-4 ${headerPaddingClass} ${alignClass} ${stickyThClass} relative group/th select-none`}
                              >
                                <div className={`flex items-center ${justifyClass} gap-1 pr-1`}>
                                  <span className="truncate">{col.label}</span>
                                  {isPinned && (
                                    <span title="Cột đang ghim cố định" className="inline-flex">
                                      <Pin className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 fill-current shrink-0" />
                                    </span>
                                  )}
                                  <SlidersHorizontal className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                                </div>
                                {/* Resizer Handle */}
                                <div
                                  className={`absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize select-none z-20 flex justify-center items-center group/resizer hover:bg-primary/20 ${
                                    resizingColId === col.id ? 'bg-primary/30' : ''
                                  }`}
                                  onMouseDown={(e) => handleStartResize(col.id, e)}
                                  title={`Kéo để chỉnh kích thước cột ${col.label}`}
                                >
                                  <div className="w-[2px] h-3.5 bg-border group-hover/resizer:bg-primary group-hover/resizer:h-full transition-all" />
                                </div>
                              </th>
                            );
                          })}

                          {/* Sticky Thao tác Action Header */}
                          <th
                            style={{ width: 76, minWidth: 76, maxWidth: 76 }}
                            className={`sticky right-0 z-[25] px-3 bg-muted border-b border-l border-border text-center font-semibold text-foreground ${headerPaddingClass} shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]`}
                          >
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.length === 0 ? (
                          <tr>
                            <td
                              colSpan={tableColumns.filter((c) => c.visible).length + 2}
                              className="py-12 text-center text-muted-foreground bg-card"
                            >
                              Không tìm thấy nhân viên nào phù hợp
                            </td>
                          </tr>
                        ) : (
                          filteredEmployees.map((emp, index) => {
                            const isSelected = selectedIds.includes(emp.id);
                            const isActiveDetail = selectedEmployeeForDetail?.id === emp.id;
                            const isEven = index % 2 === 1;

                            // 100% solid opaque background to completely prevent text bleed-through during horizontal scroll
                            const stickyBgClass = isActiveDetail
                              ? 'bg-blue-100 dark:bg-blue-950 text-foreground !bg-opacity-100'
                              : isSelected
                              ? 'bg-blue-50 dark:bg-blue-900 text-foreground group-hover:bg-blue-100 dark:group-hover:bg-blue-800 !bg-opacity-100'
                              : isEven
                              ? 'bg-slate-50 dark:bg-slate-900 text-foreground group-hover:bg-slate-100 dark:group-hover:bg-slate-850 !bg-opacity-100'
                              : 'bg-white dark:bg-card text-foreground group-hover:bg-slate-100 dark:group-hover:bg-slate-850 !bg-opacity-100';

                            const rowBgClass = isActiveDetail
                              ? 'bg-blue-100 dark:bg-blue-950'
                              : isSelected
                              ? 'bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800'
                              : isEven
                              ? 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                              : 'bg-white dark:bg-card hover:bg-slate-100 dark:hover:bg-slate-800';

                            return (
                              <tr
                                key={emp.id}
                                onClick={() => setSelectedEmployeeForDetail(emp)}
                                aria-current={isActiveDetail}
                                className={`group cursor-pointer transition-colors ${rowBgClass} [&>td]:border-b [&>td]:border-border`}
                              >
                                {/* 1. Sticky Checkbox */}
                                <td
                                  style={{ width: 44, minWidth: 44, maxWidth: 44 }}
                                  className={`sticky left-0 z-[10] px-3 ${cellPaddingClass.split(' ')[0]} border-r border-border text-center ${stickyBgClass} shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] cursor-pointer select-none`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSelect(emp.id, e);
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleSelect(emp.id, e);
                                    }}
                                    onChange={() => {}}
                                    className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer align-middle"
                                  />
                                </td>

                                {/* Dynamic Columns (Fully customizable order, visibility & pinning) */}
                                {visibleColumns.map((col) => renderEmployeeCell(col, emp, stickyBgClass))}

                                {/* Sticky Thao tác */}
                                <td
                                  style={{ width: 76, minWidth: 76, maxWidth: 76 }}
                                  className={`sticky right-0 z-[10] px-2 ${cellPaddingClass.split(' ')[0]} border-l border-border/50 text-center ${stickyBgClass} shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.08)]`}
                                >
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
                                        handleDeleteEmployee(emp.id);
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
                              handleDeleteEmployee(emp.id);
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span>
                    Hiển thị <span className="font-semibold text-foreground">{filteredEmployees.length}</span> / {employees.length} nhân viên
                  </span>
                  {selectedIds.length > 0 && (
                    <div className="inline-flex items-center gap-1.5">
                      <span className="font-medium text-primary">
                        (Đã chọn {selectedIds.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        className="px-2 py-0.5 rounded border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Xóa {selectedIds.length} mục đã chọn
                      </button>
                    </div>
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
