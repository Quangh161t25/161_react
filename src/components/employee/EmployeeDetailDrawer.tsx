import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Trash2,
  Printer,
  Phone,
  Mail,
  Building2,
  Briefcase,
  User,
  CreditCard,
  GraduationCap,
  FileBadge,
  MapPin,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Employee } from '../../types/employee';

interface EmployeeDetailDrawerProps {
  employee: Employee;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

export const EmployeeDetailDrawer: React.FC<EmployeeDetailDrawerProps> = ({
  employee,
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
  onEdit,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'job' | 'bank_insurance' | 'education'>('info');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = (status: Employee['status']) => {
    switch (status) {
      case 'working':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Đang làm việc
          </span>
        );
      case 'probation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Thử việc
          </span>
        );
      case 'resigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Đã nghỉ việc
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-destructive/10 text-destructive border border-destructive/20">
            Tạm hoãn
          </span>
        );
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">Hồ sơ nhân viên</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-muted text-muted-foreground border border-border">
                  {employee.code}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cập nhật lần cuối: {employee.updatedAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Navigation */}
            <div className="flex items-center gap-0.5 border border-border rounded-lg p-0.5 bg-background">
              <button
                type="button"
                onClick={onPrev}
                disabled={currentIndex <= 0}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Hồ sơ trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-medium px-1.5 text-muted-foreground tabular-nums">
                {currentIndex + 1} / {totalCount}
              </span>
              <button
                type="button"
                onClick={onNext}
                disabled={currentIndex >= totalCount - 1}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Hồ sơ kế tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              title="In hồ sơ"
              className="p-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onEdit(employee)}
              title="Chỉnh sửa"
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <SquarePen className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Highlight Card */}
        <div className="p-5 border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative">
              <img
                src={employee.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}`}
                alt={employee.name}
                className="w-16 h-16 rounded-2xl border-2 border-border shadow-md object-cover"
              />
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${
                  employee.status === 'working'
                    ? 'bg-emerald-500'
                    : employee.status === 'probation'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-base font-bold text-foreground truncate">
                  {employee.name}
                </h3>
                {getStatusBadge(employee.status)}
              </div>

              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                  <strong className="text-foreground font-medium">{employee.role}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  {employee.department}
                </span>
              </div>

              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <a
                  href={`tel:${employee.phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-background border border-border hover:bg-primary/10 hover:text-primary transition-colors text-foreground"
                >
                  <Phone className="w-3 h-3 text-primary" />
                  {employee.phone}
                </a>

                <a
                  href={`mailto:${employee.email}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-background border border-border hover:bg-primary/10 hover:text-primary transition-colors text-foreground"
                >
                  <Mail className="w-3 h-3 text-primary" />
                  {employee.email}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-2 border-b border-border bg-card overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Thông tin cá nhân
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('job')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'job'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Công việc & Chức vụ
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bank_insurance')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'bank_insurance'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Tài khoản & Bảo hiểm
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('education')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'education'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Học vấn & Bằng cấp
          </button>
        </div>

        {/* Drawer Body Tabs Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. Tab Thông tin cá nhân */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Giới tính</span>
                  <p className="text-xs font-semibold text-foreground">{employee.gender || '—'}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Ngày sinh</span>
                  <p className="text-xs font-semibold text-foreground">{employee.dob || '—'}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Tình trạng hôn nhân</span>
                  <p className="text-xs font-semibold text-foreground">{employee.maritalStatus || '—'}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Quê quán</span>
                  <p className="text-xs font-semibold text-foreground">{employee.hometown || '—'}</p>
                </div>
              </div>

              {/* Identity & Legal */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <FileBadge className="w-4 h-4 text-primary" />
                  Căn cước công dân / Hộ chiếu
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Số CMND/CCCD</span>
                    <span className="font-semibold text-foreground">{employee.idCardNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Ngày cấp</span>
                    <span className="font-semibold text-foreground">{employee.idCardDate || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Nơi cấp</span>
                    <span className="font-semibold text-foreground">{employee.idCardPlace || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Địa chỉ cư trú
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Địa chỉ thường trú</span>
                    <p className="font-medium text-foreground">{employee.permanentAddress || '—'}</p>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <span className="text-[11px] text-muted-foreground block">Chỗ ở hiện tại</span>
                    <p className="font-medium text-foreground">{employee.currentAddress || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Liên hệ khẩn cấp
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Người liên hệ</span>
                    <span className="font-semibold text-foreground">{employee.emergencyContactName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Mối quan hệ</span>
                    <span className="font-semibold text-foreground">{employee.emergencyContactRelation || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Số điện thoại</span>
                    <span className="font-semibold text-primary">{employee.emergencyContactPhone || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Tab Công việc & Chức vụ */}
          {activeTab === 'job' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Phòng ban</span>
                  <p className="text-xs font-semibold text-foreground">{employee.department}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Bộ phận</span>
                  <p className="text-xs font-semibold text-foreground">{employee.subDepartment || '—'}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Chức vụ</span>
                  <p className="text-xs font-semibold text-foreground">{employee.role}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Cấp bậc</span>
                  <p className="text-xs font-semibold text-foreground">Bậc {employee.rank || 1}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Mốc thời gian làm việc
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Ngày vào làm</span>
                    <span className="font-semibold text-foreground">{employee.startDate || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Ngày chính thức</span>
                    <span className="font-semibold text-foreground">{employee.officialDate || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Ngày nghỉ việc</span>
                    <span className="font-semibold text-destructive">{employee.resignationDate || '—'}</span>
                  </div>
                </div>
                {employee.resignationReason && (
                  <div className="pt-2 border-t border-border text-xs">
                    <span className="text-[11px] text-muted-foreground block">Lý do nghỉ việc:</span>
                    <p className="font-medium text-foreground mt-0.5">{employee.resignationReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Tab Tài khoản & Bảo hiểm */}
          {activeTab === 'bank_insurance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Tài khoản ngân hàng nhận lương
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Số tài khoản</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground text-sm">{employee.bankAccount || '—'}</span>
                      {employee.bankAccount && (
                        <button
                          type="button"
                          onClick={() => handleCopy(employee.bankAccount!, 'bankAccount')}
                          className="p-1 rounded text-muted-foreground hover:text-foreground"
                          title="Sao chép"
                        >
                          {copiedField === 'bankAccount' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Chủ tài khoản</span>
                    <span className="font-semibold text-foreground uppercase">{employee.bankAccountHolder || employee.name}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Ngân hàng</span>
                    <span className="font-semibold text-foreground">{employee.bankName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Chi nhánh</span>
                    <span className="font-semibold text-foreground">{employee.bankBranch || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Bảo hiểm & Mã số thuế
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Mã số thuế TNCN</span>
                    <span className="font-mono font-bold text-foreground">{employee.taxCode || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Số sổ BHXH</span>
                    <span className="font-mono font-bold text-foreground">{employee.socialInsuranceNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Mã thẻ BHYT</span>
                    <span className="font-mono font-bold text-foreground">{employee.healthInsuranceNumber || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Tab Học vấn & Bằng cấp */}
          {activeTab === 'education' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  Trình độ đào tạo
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Trình độ học vấn</span>
                      <span className="font-semibold text-foreground">{employee.educationLevel || 'Đại học'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Chuyên ngành đào tạo</span>
                      <span className="font-semibold text-foreground">{employee.major || '—'}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <span className="text-[11px] text-muted-foreground block">Trường đào tạo</span>
                    <span className="font-semibold text-foreground">{employee.school || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-3">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 w-full justify-end animate-in fade-in duration-200">
              <span className="text-xs font-medium text-destructive">Xác nhận xóa nhân viên này?</span>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => onDelete(employee.id || employee.code)}
                className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa hồ sơ
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(employee)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <SquarePen className="w-3.5 h-3.5" />
                  Chỉnh sửa
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
