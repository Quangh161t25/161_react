import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CircleUser,
  Users,
  User,
  Heart,
  MapPin,
  Briefcase,
  Building2,
  Layers,
  CircleDot,
  IdCard,
  Mail,
  Phone,
  GraduationCap,
  School,
  CreditCard,
  Landmark,
  Shield,
  ShieldCheck,
  AtSign,
  KeyRound,
  ImagePlus,
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  UserPlus,
  ChevronDown,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Employee, EmployeeStatus, Gender } from '../../types/employee';

interface EmployeeFormDrawerProps {
  isOpen: boolean;
  initialData?: Employee | null;
  onClose: () => void;
  onSubmit: (formData: Partial<Employee>) => void;
}

type WidthMode = 'narrow' | 'normal' | 'wide';

// Helper date conversions for <input type="date">
const toInputDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  if (dateStr.includes('-') && dateStr.length === 10) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return dateStr;
};

const fromInputDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts;
      return `${dd}/${mm}/${yyyy}`;
    }
  }
  return dateStr;
};

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
};

export const EmployeeFormDrawer: React.FC<EmployeeFormDrawerProps> = ({
  isOpen,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [widthMode, setWidthMode] = useState<WidthMode>('normal');
  const isEdit = !!initialData;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  // Form State
  const [avatarUrl, setAvatarUrl] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [tempPassword, setTempPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<Gender>('Nam');
  const [dob, setDob] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [nationality, setNationality] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [religion, setReligion] = useState('');
  const [hometown, setHometown] = useState('');

  // Work State
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [subDepartment, setSubDepartment] = useState('');
  const [rank, setRank] = useState<string | number>('');
  const [status, setStatus] = useState<EmployeeStatus>('working');
  const [startDate, setStartDate] = useState('');
  const [officialDate, setOfficialDate] = useState('');
  const [resignationDate, setResignationDate] = useState('');
  const [resignationReason, setResignationReason] = useState('');

  // ID Card & Address
  const [idCardNumber, setIdCardNumber] = useState('');
  const [idCardDate, setIdCardDate] = useState('');
  const [idCardPlace, setIdCardPlace] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');

  // Contact
  const [email, setEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');

  // Education
  const [educationLevel, setEducationLevel] = useState('');
  const [major, setMajor] = useState('');
  const [school, setSchool] = useState('');

  // Bank
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');

  // Insurance & Tax
  const [socialInsuranceNumber, setSocialInsuranceNumber] = useState('');
  const [healthInsuranceNumber, setHealthInsuranceNumber] = useState('');
  const [taxCode, setTaxCode] = useState('');

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialData) {
      setAvatarUrl(initialData.avatarUrl || '');
      setName(initialData.name || '');
      setCode(initialData.code || '');
      setUsername(initialData.username || '');
      setTempPassword(initialData.password || '123456');
      setShowPassword(false);
      setGender(initialData.gender || 'Nam');
      setDob(toInputDate(initialData.dob));
      setMaritalStatus(initialData.maritalStatus || '');
      setNationality(initialData.nationality || '');
      setEthnicity(initialData.ethnicity || '');
      setReligion(initialData.religion || '');
      setHometown(initialData.hometown || '');

      setRole(initialData.role || '');
      setDepartment(initialData.department || '');
      setSubDepartment(initialData.subDepartment || '');
      setRank(initialData.rank || '');
      setStatus(initialData.status || 'working');
      setStartDate(toInputDate(initialData.startDate));
      setOfficialDate(toInputDate(initialData.officialDate));
      setResignationDate(toInputDate(initialData.resignationDate));
      setResignationReason(initialData.resignationReason || '');

      setIdCardNumber(initialData.idCardNumber || '');
      setIdCardDate(toInputDate(initialData.idCardDate));
      setIdCardPlace(initialData.idCardPlace || '');
      setPermanentAddress(initialData.permanentAddress || '');
      setCurrentAddress(initialData.currentAddress || '');

      setEmail(initialData.email || '');
      setPersonalEmail(initialData.personalEmail || '');
      setPhone(initialData.phone || '');
      setEmergencyContactName(initialData.emergencyContactName || '');
      setEmergencyContactPhone(initialData.emergencyContactPhone || '');
      setEmergencyContactRelation(initialData.emergencyContactRelation || '');

      setEducationLevel(initialData.educationLevel || '');
      setMajor(initialData.major || '');
      setSchool(initialData.school || '');

      setBankAccount(initialData.bankAccount || '');
      setBankAccountHolder(initialData.bankAccountHolder || '');
      setBankName(initialData.bankName || '');
      setBankBranch(initialData.bankBranch || '');

      setSocialInsuranceNumber(initialData.socialInsuranceNumber || '');
      setHealthInsuranceNumber(initialData.healthInsuranceNumber || '');
      setTaxCode(initialData.taxCode || '');
    } else {
      setAvatarUrl('');
      setName('');
      setCode('');
      setUsername('');
      setTempPassword('123456');
      setShowPassword(false);
      setGender('Nam');
      setDob('');
      setMaritalStatus('');
      setNationality('');
      setEthnicity('');
      setReligion('');
      setHometown('');

      setRole('');
      setDepartment('');
      setSubDepartment('');
      setRank('');
      setStatus('working');
      setStartDate('');
      setOfficialDate('');
      setResignationDate('');
      setResignationReason('');

      setIdCardNumber('');
      setIdCardDate('');
      setIdCardPlace('');
      setPermanentAddress('');
      setCurrentAddress('');

      setEmail('');
      setPersonalEmail('');
      setPhone('');
      setEmergencyContactName('');
      setEmergencyContactPhone('');
      setEmergencyContactRelation('');

      setEducationLevel('');
      setMajor('');
      setSchool('');

      setBankAccount('');
      setBankAccountHolder('');
      setBankName('');
      setBankBranch('');

      setSocialInsuranceNumber('');
      setHealthInsuranceNumber('');
      setTaxCode('');
    }
    setFormErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!name.trim()) {
      errors.name = 'Vui lòng nhập họ và tên';
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (formScrollRef.current) {
        formScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return false;
    }
    return true;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    const finalUsername = username.trim() || slugify(name) || `user_${Date.now().toString().slice(-4)}`;
    const finalPhone = phone.trim();
    const finalEmail = email.trim();

    const payload: Partial<Employee> = {
      name: name.trim(),
      code: code.trim() || undefined,
      username: finalUsername,
      phone: finalPhone,
      email: finalEmail,
      role,
      department,
      subDepartment: subDepartment.trim(),
      gender,
      status,
      dob: fromInputDate(dob),
      maritalStatus,
      nationality,
      ethnicity,
      religion,
      hometown: hometown.trim(),
      rank,
      startDate: fromInputDate(startDate),
      officialDate: fromInputDate(officialDate),
      resignationDate: status === 'resigned' ? fromInputDate(resignationDate) : undefined,
      resignationReason: status === 'resigned' ? resignationReason.trim() : undefined,
      idCardNumber: idCardNumber.trim(),
      idCardDate: fromInputDate(idCardDate),
      idCardPlace: idCardPlace.trim(),
      permanentAddress: permanentAddress.trim(),
      currentAddress: currentAddress.trim(),
      personalEmail: personalEmail.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      emergencyContactRelation: emergencyContactRelation.trim(),
      educationLevel,
      major: major.trim(),
      school: school.trim(),
      bankAccount: bankAccount.trim(),
      bankAccountHolder: (bankAccountHolder || name).trim().toUpperCase(),
      bankName,
      bankBranch: bankBranch.trim(),
      socialInsuranceNumber: socialInsuranceNumber.trim(),
      healthInsuranceNumber: healthInsuranceNumber.trim(),
      taxCode: taxCode.trim(),
      password: tempPassword.trim() || initialData?.password || '123456',
      isActiveAccount: status !== 'resigned',
      avatarUrl:
        avatarUrl ||
        initialData?.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=1d4ed8&color=fff`,
    };

    onSubmit(payload);
  };

  const getDrawerWidthStyle = () => {
    switch (widthMode) {
      case 'narrow':
        return 'min(540px, -2rem + 100vw)';
      case 'wide':
        return 'min(1024px, -4rem + 100vw)';
      case 'normal':
      default:
        return 'min(768px, -6rem + 100vw)';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        className="fixed inset-y-0 right-0 w-full bg-card shadow-ultra flex flex-col h-[100dvh] border-l border-border/40 outline-none transform-gpu animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Cập nhật nhân viên' : 'Thêm Nhân viên mới'}
        tabIndex={-1}
        style={{ zIndex: 61, width: getDrawerWidthStyle() }}
      >
        {/* Header Bar */}
        <div
          className="flex items-center justify-between gap-4 border-b border-border/60 bg-card shrink-0 px-4 py-2 sm:px-5"
          style={{
            paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
            paddingBottom: '0.5rem',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <CircleUser className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground leading-tight truncate">
                {isEdit ? `Cập nhật nhân viên: ${initialData?.name}` : 'Thêm Nhân viên mới'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {isEdit
                  ? 'Chỉnh sửa hồ sơ thông tin nhân viên'
                  : 'Thiết lập thông tin nhân sự mới vào hệ thống'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Width Controls */}
            <div
              role="group"
              aria-label="Bề rộng ngăn bên"
              className="flex items-center gap-0.5 shrink-0 rounded-xl border border-border/60 p-0.5"
            >
              <button
                type="button"
                onClick={() => setWidthMode('narrow')}
                aria-pressed={widthMode === 'narrow'}
                aria-label="Hẹp"
                title="Hẹp"
                className={`p-2 rounded-lg transition-colors active:scale-90 ${
                  widthMode === 'narrow'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <PanelRightClose className="w-4 h-4 stroke-[2.5px]" />
              </button>
              <button
                type="button"
                onClick={() => setWidthMode('normal')}
                aria-pressed={widthMode === 'normal'}
                aria-label="Chuẩn"
                title="Chuẩn"
                className={`p-2 rounded-lg transition-colors active:scale-90 ${
                  widthMode === 'normal'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <PanelRight className="w-4 h-4 stroke-[2.5px]" />
              </button>
              <button
                type="button"
                onClick={() => setWidthMode('wide')}
                aria-pressed={widthMode === 'wide'}
                aria-label="Rộng"
                title="Rộng"
                className={`p-2 rounded-lg transition-colors active:scale-90 ${
                  widthMode === 'wide'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <PanelRightOpen className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors active:scale-90 shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5px]" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div ref={formScrollRef} className="flex-1 overflow-y-auto bg-muted/50 p-4 sm:p-5 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            <form id="emp-form" onSubmit={handleSubmit} className="space-y-4">
              {/* ================= SECTION 1: THÔNG TIN CÁ NHÂN ================= */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <CircleUser className="w-3.5 h-3.5" />
                    <span className="truncate">Thông tin cá nhân</span>
                  </h4>
                </div>

                {/* Avatar Upload */}
                <div className="flex justify-center mb-4">
                  <div className="w-24">
                    <input
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      type="file"
                      onChange={handleAvatarUpload}
                    />
                    <div className="relative group/frame mx-auto" style={{ width: '100%' }}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => fileInputRef.current?.click()}
                        className="relative overflow-hidden border-2 transition-all duration-200 mx-auto rounded-full border-dashed cursor-pointer border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/50"
                        style={{ aspectRatio: '1 / 1' }}
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div
                            className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center"
                            style={{ opacity: 1 }}
                          >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-colors bg-muted text-muted-foreground">
                              <ImagePlus className="w-4.5 h-4.5" />
                            </div>
                            <p className="text-[11px] font-medium transition-colors leading-tight text-muted-foreground">
                              Ảnh đại diện
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* Họ tên */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_ho_ten"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <CircleUser className="w-3 h-3" />
                      </span>
                      Họ tên
                      <span
                        aria-hidden="true"
                        className="text-destructive ml-0.5 not-italic"
                        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                      >
                        *
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        id="emp_ho_ten"
                        aria-required="true"
                        name="ho_va_ten"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="VD: Bùi Đức Thắng"
                        className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-placeholder placeholder:italic ${
                          formErrors.name ? 'border-destructive' : 'border-border'
                        }`}
                      />
                    </div>
                    {formErrors.name && (
                      <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Giới tính */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground shrink-0">
                        <Users className="w-3 h-3" />
                      </span>
                      Giới tính
                    </label>
                    <div className="inline-flex flex-wrap rounded-lg border border-border bg-muted/30 p-0.5 w-full">
                      {(['Nam', 'Nữ', 'Khác'] as Gender[]).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`inline-flex items-center justify-center rounded-md transition-all duration-200 select-none border px-3.5 py-2 text-xs gap-2 flex-1 min-w-0 ${
                            gender === g
                              ? 'bg-background text-foreground shadow-sm border-border ring-1 ring-border/50 font-semibold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent font-medium'
                          }`}
                        >
                          <span className="truncate">{g}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ngày sinh */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_ngay_sinh"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <User className="w-3 h-3" />
                      </span>
                      Ngày sinh
                    </label>
                    <div className="relative">
                      <input
                        id="emp_ngay_sinh"
                        type="date"
                        name="ngay_sinh"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Tình trạng hôn nhân */}
                  <div className="w-full relative">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground shrink-0">
                        <Heart className="w-3 h-3" />
                      </span>
                      Tình trạng hôn nhân
                    </label>
                    <div className="relative">
                      <select
                        name="tinh_trang_hon_nhan"
                        value={maritalStatus}
                        onChange={(e) => setMaritalStatus(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      >
                        <option value="">-- Chọn tình trạng hôn nhân --</option>
                        <option value="Độc thân">Độc thân</option>
                        <option value="Đã kết hôn">Đã kết hôn</option>
                        <option value="Khác">Khác</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Quốc tịch */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_quoc_tich"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <MapPin className="w-3 h-3" />
                      </span>
                      Quốc tịch
                    </label>
                    <div className="relative">
                      <input
                        id="emp_quoc_tich"
                        name="quoc_tich"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Dân tộc */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_dan_toc"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <User className="w-3 h-3" />
                      </span>
                      Dân tộc
                    </label>
                    <div className="relative">
                      <input
                        id="emp_dan_toc"
                        name="dan_toc"
                        value={ethnicity}
                        onChange={(e) => setEthnicity(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Tôn giáo */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_ton_giao"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <User className="w-3 h-3" />
                      </span>
                      Tôn giáo
                    </label>
                    <div className="relative">
                      <input
                        id="emp_ton_giao"
                        name="ton_giao"
                        value={religion}
                        onChange={(e) => setReligion(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Quê quán */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_que_quan"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <MapPin className="w-3 h-3" />
                      </span>
                      Quê quán
                    </label>
                    <div className="relative">
                      <input
                        id="emp_que_quan"
                        name="que_quan"
                        value={hometown}
                        onChange={(e) => setHometown(e.target.value)}
                        placeholder="Tỉnh / Thành phố"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= SECTION 2: THÔNG TIN CÔNG VIỆC ================= */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span className="truncate">Thông tin công việc</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* Chức vụ */}
                  <div className="w-full relative">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground shrink-0">
                        <Briefcase className="w-3 h-3" />
                      </span>
                      Chức vụ
                      <span
                        aria-hidden="true"
                        className="text-destructive ml-0.5 not-italic"
                        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                      >
                        *
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list="roles-list"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Chọn hoặc thêm mới"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                      <datalist id="roles-list">
                        <option value="Giám đốc" />
                        <option value="Phó giám đốc" />
                        <option value="Trưởng phòng" />
                        <option value="Phó phòng" />
                        <option value="Kế toán trưởng" />
                        <option value="Chuyên viên" />
                        <option value="Nhân viên" />
                        <option value="Thực tập sinh" />
                      </datalist>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Phòng ban */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_phong_ban"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <Building2 className="w-3 h-3" />
                      </span>
                      Phòng ban
                    </label>
                    <div className="relative">
                      <select
                        id="emp_phong_ban"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      >
                        <option value="">-- Chọn phòng ban --</option>
                        <option value="Phòng Kỹ thuật">Phòng Kỹ thuật</option>
                        <option value="Phòng Kinh doanh">Phòng Kinh doanh</option>
                        <option value="Phòng Kế toán">Phòng Kế toán</option>
                        <option value="Phòng Hành chính Nhân sự">Phòng Hành chính Nhân sự</option>
                        <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                        <option value="Phòng Marketing">Phòng Marketing</option>
                        <option value="Phòng Chăm sóc Khách hàng">Phòng Chăm sóc Khách hàng</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Bộ phận */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_bo_phan"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <Building2 className="w-3 h-3" />
                      </span>
                      Bộ phận
                    </label>
                    <div className="relative">
                      <input
                        id="emp_bo_phan"
                        name="bo_phan"
                        value={subDepartment}
                        onChange={(e) => setSubDepartment(e.target.value)}
                        placeholder="—"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Cấp bậc */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_cap_bac"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <Layers className="w-3 h-3" />
                      </span>
                      Cấp bậc
                    </label>
                    <div className="relative">
                      <input
                        id="emp_cap_bac"
                        name="cap_bac"
                        type="number"
                        min="1"
                        max="10"
                        value={rank}
                        onChange={(e) => setRank(e.target.value)}
                        placeholder="1"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Trạng thái làm việc */}
                  <div className="w-full relative">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground shrink-0">
                        <CircleDot className="w-3 h-3" />
                      </span>
                      Trạng thái làm việc
                    </label>
                    <div className="relative">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      >
                        <option value="working">Đang làm việc</option>
                        <option value="probation">Thử việc</option>
                        <option value="resigned">Đã nghỉ việc</option>
                        <option value="suspended">Tạm hoãn</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Ngày vào làm */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_ngay_vao_lam"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <Briefcase className="w-3 h-3" />
                      </span>
                      Ngày vào làm
                    </label>
                    <div className="relative">
                      <input
                        id="emp_ngay_vao_lam"
                        type="date"
                        name="ngay_vao_lam"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Ngày chính thức */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_ngay_chinh_thuc"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <Briefcase className="w-3 h-3" />
                      </span>
                      Ngày chính thức
                    </label>
                    <div className="relative">
                      <input
                        id="emp_ngay_chinh_thuc"
                        type="date"
                        name="ngay_chinh_thuc"
                        value={officialDate}
                        onChange={(e) => setOfficialDate(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Ngày nghỉ việc */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_ngay_nghi_viec"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <Briefcase className="w-3 h-3" />
                      </span>
                      Ngày nghỉ việc
                    </label>
                    <div className="relative">
                      <input
                        id="emp_ngay_nghi_viec"
                        type="date"
                        name="ngay_nghi_viec"
                        value={resignationDate}
                        onChange={(e) => setResignationDate(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Lý do nghỉ */}
                  <div className="w-full relative">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground shrink-0">
                        <CircleDot className="w-3 h-3" />
                      </span>
                      Lý do nghỉ
                    </label>
                    <div className="relative">
                      <select
                        value={resignationReason}
                        onChange={(e) => setResignationReason(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      >
                        <option value="">Chọn lý do nghỉ</option>
                        <option value="Nghỉ việc theo nguyện vọng">Nghỉ việc theo nguyện vọng</option>
                        <option value="Hết hạn hợp đồng">Hết hạn hợp đồng</option>
                        <option value="Thay đổi định hướng nghề nghiệp">Thay đổi định hướng nghề nghiệp</option>
                        <option value="Chuyển nơi ở">Chuyển nơi ở</option>
                        <option value="Khác">Khác</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= SECTION 3: GIẤY TỜ & ĐỊA CHỈ ================= */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <IdCard className="w-3.5 h-3.5" />
                    <span className="truncate">Giấy tờ &amp; địa chỉ</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* CMND/CCCD */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_so_cccd"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <IdCard className="w-3 h-3" />
                      </span>
                      CMND/CCCD
                    </label>
                    <div className="relative">
                      <input
                        id="emp_so_cccd"
                        name="so_cccd"
                        value={idCardNumber}
                        onChange={(e) => setIdCardNumber(e.target.value)}
                        placeholder="VD: 012345678901"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Ngày cấp CCCD */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_ngay_cap_cccd"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <IdCard className="w-3 h-3" />
                      </span>
                      Ngày cấp CCCD
                    </label>
                    <div className="relative">
                      <input
                        id="emp_ngay_cap_cccd"
                        type="date"
                        name="ngay_cap_cccd"
                        value={idCardDate}
                        onChange={(e) => setIdCardDate(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Nơi cấp */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_noi_cap_cccd"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <IdCard className="w-3 h-3" />
                      </span>
                      Nơi cấp
                    </label>
                    <div className="relative">
                      <input
                        id="emp_noi_cap_cccd"
                        name="noi_cap_cccd"
                        value={idCardPlace}
                        onChange={(e) => setIdCardPlace(e.target.value)}
                        placeholder="VD: Cục Cảnh sát QLHC về TTXH"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Địa chỉ thường trú */}
                  <div className="col-span-full">
                    <div className="w-full">
                      <label
                        htmlFor="emp_dia_chi_thuong_tru"
                        className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                      >
                        <span className="text-muted-foreground shrink-0">
                          <MapPin className="w-3 h-3" />
                        </span>
                        Địa chỉ thường trú
                      </label>
                      <div className="relative">
                        <input
                          id="emp_dia_chi_thuong_tru"
                          name="dia_chi_thuong_tru"
                          value={permanentAddress}
                          onChange={(e) => setPermanentAddress(e.target.value)}
                          placeholder="Số nhà, đường, phường/xã, tỉnh/thành"
                          className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chỗ ở hiện tại */}
                  <div className="col-span-full">
                    <div className="w-full">
                      <label
                        htmlFor="emp_dia_chi_hien_tai"
                        className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                      >
                        <span className="text-muted-foreground shrink-0">
                          <MapPin className="w-3 h-3" />
                        </span>
                        Chỗ ở hiện tại
                      </label>
                      <div className="relative">
                        <input
                          id="emp_dia_chi_hien_tai"
                          name="dia_chi_hien_tai"
                          value={currentAddress}
                          onChange={(e) => setCurrentAddress(e.target.value)}
                          placeholder="Số nhà, đường, phường/xã, tỉnh/thành"
                          className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= SECTION 4: THÔNG TIN LIÊN HỆ ================= */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">Thông tin liên hệ</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* Email công việc */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_email"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <Mail className="w-3 h-3" />
                      </span>
                      Email công việc
                      <span
                        aria-hidden="true"
                        className="text-destructive ml-0.5 not-italic"
                        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                      >
                        *
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        id="emp_email"
                        aria-required="true"
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="VD: thang.bui@company.vn"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Email cá nhân */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_email_ca_nhan"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <Mail className="w-3 h-3" />
                      </span>
                      Email cá nhân
                    </label>
                    <div className="relative">
                      <input
                        id="emp_email_ca_nhan"
                        type="email"
                        name="email_ca_nhan"
                        value={personalEmail}
                        onChange={(e) => setPersonalEmail(e.target.value)}
                        placeholder="VD: ten@gmail.com"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Điện thoại */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_so_dien_thoai"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <Phone className="w-3 h-3" />
                      </span>
                      Điện thoại
                      <span
                        aria-hidden="true"
                        className="text-destructive ml-0.5 not-italic"
                        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                      >
                        *
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        id="emp_so_dien_thoai"
                        aria-required="true"
                        name="so_dien_thoai"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="VD: 0929 012 345"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Người liên hệ khẩn cấp */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_nguoi_lien_he_khan"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <User className="w-3 h-3" />
                      </span>
                      Người liên hệ khẩn cấp
                    </label>
                    <div className="relative">
                      <input
                        id="emp_nguoi_lien_he_khan"
                        name="nguoi_lien_he_khan"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* SĐT khẩn cấp */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_sdt_khan"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <Phone className="w-3 h-3" />
                      </span>
                      SĐT khẩn cấp
                    </label>
                    <div className="relative">
                      <input
                        id="emp_sdt_khan"
                        name="sdt_khan"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Quan hệ */}
                  <div className="w-full relative">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground shrink-0">
                        <Heart className="w-3 h-3" />
                      </span>
                      Quan hệ
                    </label>
                    <div className="relative">
                      <select
                        value={emergencyContactRelation}
                        onChange={(e) => setEmergencyContactRelation(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      >
                        <option value="">Chọn quan hệ</option>
                        <option value="Bố">Bố</option>
                        <option value="Mẹ">Mẹ</option>
                        <option value="Vợ">Vợ</option>
                        <option value="Chồng">Chồng</option>
                        <option value="Anh/Chị/Em">Anh/Chị/Em</option>
                        <option value="Con">Con</option>
                        <option value="Người thân">Người thân</option>
                        <option value="Khác">Khác</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= SECTION 5: HỌC VẤN & CHỨNG CHỈ ================= */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span className="truncate">Học vấn &amp; Chứng chỉ</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* Trình độ học vấn */}
                  <div className="w-full relative">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground shrink-0">
                        <GraduationCap className="w-3 h-3" />
                      </span>
                      Trình độ học vấn
                    </label>
                    <div className="relative">
                      <select
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      >
                        <option value="">-- Chọn trình độ học vấn --</option>
                        <option value="Đại học">Đại học</option>
                        <option value="Cao đẳng">Cao đẳng</option>
                        <option value="Thạc sĩ">Thạc sĩ</option>
                        <option value="Tiến sĩ">Tiến sĩ</option>
                        <option value="Trung cấp">Trung cấp</option>
                        <option value="THPT">THPT</option>
                        <option value="Khác">Khác</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Chuyên ngành */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_chuyen_nganh"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <Briefcase className="w-3 h-3" />
                      </span>
                      Chuyên ngành
                    </label>
                    <div className="relative">
                      <input
                        id="emp_chuyen_nganh"
                        name="chuyen_nganh"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        placeholder="VD: Công nghệ thông tin"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Trường đào tạo */}
                  <div className="col-span-full">
                    <div className="w-full">
                      <label
                        htmlFor="emp_truong"
                        className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                      >
                        <span className="text-muted-foreground shrink-0">
                          <School className="w-3 h-3" />
                        </span>
                        Trường đào tạo
                      </label>
                      <div className="relative">
                        <input
                          id="emp_truong"
                          name="truong"
                          value={school}
                          onChange={(e) => setSchool(e.target.value)}
                          placeholder="VD: Đại học Bách Khoa TP.HCM"
                          className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= SECTION 6: TÀI CHÍNH & NGÂN HÀNG ================= */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <Landmark className="w-3.5 h-3.5" />
                    <span className="truncate">Tài chính &amp; Ngân hàng</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* Số tài khoản */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_so_tai_khoan"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <CreditCard className="w-3 h-3" />
                      </span>
                      Số tài khoản
                    </label>
                    <div className="relative">
                      <input
                        id="emp_so_tai_khoan"
                        name="so_tai_khoan"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="VD: 0123456789"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Chủ tài khoản */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_ten_chu_tai_khoan"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <User className="w-3 h-3" />
                      </span>
                      Chủ tài khoản
                    </label>
                    <div className="relative">
                      <input
                        id="emp_ten_chu_tai_khoan"
                        name="ten_chu_tai_khoan"
                        value={bankAccountHolder}
                        onChange={(e) => setBankAccountHolder(e.target.value.toUpperCase())}
                        placeholder={name ? name.toUpperCase() : 'NGUYEN VAN A'}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground uppercase ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Tên ngân hàng */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_ngan_hang"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <Landmark className="w-3 h-3" />
                      </span>
                      Tên ngân hàng
                    </label>
                    <div className="relative">
                      <input
                        id="emp_ngan_hang"
                        list="bank-names-list"
                        name="ngan_hang"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="VD: Vietcombank, BIDV"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                      <datalist id="bank-names-list">
                        <option value="Vietcombank" />
                        <option value="Techcombank" />
                        <option value="MB Bank" />
                        <option value="BIDV" />
                        <option value="VietinBank" />
                        <option value="VPBank" />
                        <option value="ACB" />
                        <option value="TPBank" />
                        <option value="Sacombank" />
                        <option value="HDBank" />
                      </datalist>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Chi nhánh */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_chi_nhanh"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <Building2 className="w-3 h-3" />
                      </span>
                      Chi nhánh
                    </label>
                    <div className="relative">
                      <input
                        id="emp_chi_nhanh"
                        name="chi_nhanh"
                        value={bankBranch}
                        onChange={(e) => setBankBranch(e.target.value)}
                        placeholder="VD: Chi nhánh Sở Giao Dịch"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= SECTION 7: BẢO HIỂM ================= */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <Shield className="w-3.5 h-3.5" />
                    <span className="truncate">Bảo hiểm</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* Số BHXH */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_so_so_bhxh"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <Shield className="w-3 h-3" />
                      </span>
                      Số BHXH
                    </label>
                    <div className="relative">
                      <input
                        id="emp_so_so_bhxh"
                        name="so_so_bhxh"
                        value={socialInsuranceNumber}
                        onChange={(e) => setSocialInsuranceNumber(e.target.value)}
                        placeholder="VD: 0123456789"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Số BHYT */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_so_bhyt"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <ShieldCheck className="w-3 h-3" />
                      </span>
                      Số BHYT
                    </label>
                    <div className="relative">
                      <input
                        id="emp_so_bhyt"
                        name="so_bhyt"
                        value={healthInsuranceNumber}
                        onChange={(e) => setHealthInsuranceNumber(e.target.value)}
                        placeholder="VD: HS4010123456789"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Mã số thuế cá nhân */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_ma_so_thue_ca_nhan"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <IdCard className="w-3 h-3" />
                      </span>
                      Mã số thuế cá nhân
                    </label>
                    <div className="relative">
                      <input
                        id="emp_ma_so_thue_ca_nhan"
                        name="ma_so_thue_ca_nhan"
                        value={taxCode}
                        onChange={(e) => setTaxCode(e.target.value)}
                        placeholder="VD: 0123456789"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= SECTION 8: TÀI KHOẢN HỆ THỐNG ================= */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span className="truncate">Tài khoản hệ thống</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* Tên đăng nhập */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_tai_khoan"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <AtSign className="w-3 h-3" />
                      </span>
                      Tên đăng nhập
                    </label>
                    <div className="relative">
                      <input
                        id="emp_tai_khoan"
                        name="tai_khoan"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="VD: thang.bd"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic"
                      />
                    </div>
                  </div>

                  {/* Mật khẩu */}
                  <div className="w-full">
                    <label
                      htmlFor="emp_mat_khau_tam"
                      className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
                    >
                      <span className="text-muted-foreground shrink-0">
                        <KeyRound className="w-3 h-3" />
                      </span>
                      Mật khẩu đăng nhập
                    </label>
                    <div className="relative">
                      <input
                        id="emp_mat_khau_tam"
                        type={showPassword ? 'text' : 'password'}
                        name="mat_khau_tam"
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        placeholder={isEdit ? 'Nhập mật khẩu mới (hoặc giữ nguyên)' : 'Nhập mật khẩu (mặc định: 123456)'}
                        className="flex h-10 w-full rounded-lg border border-border bg-background pl-3 pr-10 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-placeholder placeholder:italic font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="bg-card border-t border-border/60 flex flex-col-reverse sm:flex-row items-center shadow-sticky shrink-0 w-full gap-2"
          style={{
            paddingTop: '0.5rem',
            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          }}
        >
          <div className="flex items-center justify-between w-full gap-2 flex-wrap">
            <button
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 text-xs border-border text-muted-foreground active:scale-95 cursor-pointer"
              type="button"
              onClick={onClose}
            >
              Hủy
            </button>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 text-xs bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95 cursor-pointer"
                type="button"
                onClick={() => handleSubmit()}
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                {isEdit ? 'Lưu thay đổi' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
