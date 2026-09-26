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
  PanelRightClose,
  PanelRight,
  PanelRightOpen,
  ChevronDown,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  ZoomIn,
  Save,
  Plus,
  Star,
  Globe,
  ThumbsDown,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Employee, EmployeeStatus, Gender, EmployeeBankAccount } from '../../types/employee';
import { VIETNAM_BANKS } from '../../data/employees';

interface EmployeeFormDrawerProps {
  isOpen: boolean;
  initialData?: Employee | null;
  onClose: () => void;
  onSubmit: (formData: Partial<Employee>) => void;
}

type WidthMode = 'narrow' | 'normal' | 'wide' | 'fullscreen';

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

export const EmployeeFormDrawer: React.FC<EmployeeFormDrawerProps> = ({
  isOpen,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [widthMode, setWidthMode] = useState<WidthMode>('normal');
  const isEdit = !!initialData;
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [nationality, setNationality] = useState('Việt Nam');
  const [ethnicity, setEthnicity] = useState('Kinh');
  const [religion, setReligion] = useState('Không');
  const [hometown, setHometown] = useState('');

  // Work State
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [subDepartment, setSubDepartment] = useState('');
  const [rank, setRank] = useState<string | number>('Cấp 2');
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
  const [educationLevel, setEducationLevel] = useState('Đại học');
  const [major, setMajor] = useState('');
  const [school, setSchool] = useState('');

  // Bank Accounts (Supports multiple)
  const [bankAccounts, setBankAccounts] = useState<EmployeeBankAccount[]>([]);

  // Preferences & Social Media & Notes
  const [hobbies, setHobbies] = useState('');
  const [dislikes, setDislikes] = useState('');
  const [notes, setNotes] = useState('');
  const [socialMedia, setSocialMedia] = useState('');

  // Insurance & Tax
  const [socialInsuranceNumber, setSocialInsuranceNumber] = useState('');
  const [healthInsuranceNumber, setHealthInsuranceNumber] = useState('');
  const [taxCode, setTaxCode] = useState('');

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isPreviewImageOpen, setIsPreviewImageOpen] = useState(false);

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
      setNationality(initialData.nationality || 'Việt Nam');
      setEthnicity(initialData.ethnicity || 'Kinh');
      setReligion(initialData.religion || 'Không');
      setHometown(initialData.hometown || '');

      setRole(initialData.role || '');
      setDepartment(initialData.department || '');
      setSubDepartment(initialData.subDepartment || '');
      setRank(initialData.rank || 'Cấp 2');
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

      setEducationLevel(initialData.educationLevel || 'Đại học');
      setMajor(initialData.major || '');
      setSchool(initialData.school || '');

      // Multi-bank accounts loading
      if (initialData.bankAccounts && initialData.bankAccounts.length > 0) {
        setBankAccounts(initialData.bankAccounts.map((ba) => ({ ...ba })));
      } else if (initialData.bankAccount || initialData.bankName) {
        setBankAccounts([
          {
            id: 'ba_1',
            bankName: initialData.bankName || '',
            accountNumber: initialData.bankAccount || '',
            accountHolder: initialData.bankAccountHolder || initialData.name || '',
            branch: initialData.bankBranch || '',
            isPrimary: true,
          },
        ]);
      } else {
        setBankAccounts([
          {
            id: 'ba_' + Date.now(),
            bankName: '',
            accountNumber: '',
            accountHolder: initialData.name ? initialData.name.toUpperCase() : '',
            branch: '',
            isPrimary: true,
          },
        ]);
      }

      // Preferences & Social Media & Notes
      setHobbies(initialData.hobbies || '');
      setDislikes(initialData.dislikes || '');
      setNotes(initialData.notes || '');

      if (typeof initialData.socialMedia === 'string') {
        setSocialMedia(initialData.socialMedia);
      } else if (initialData.socialMedia && typeof initialData.socialMedia === 'object') {
        const s = initialData.socialMedia as Record<string, string | undefined>;
        const links = [s.facebook, s.zalo, s.linkedin, s.tiktok, s.instagram, s.twitter, s.other].filter(Boolean);
        setSocialMedia(links.join('\n'));
      } else {
        const links = [
          initialData.facebook,
          initialData.zalo,
          initialData.linkedin,
          initialData.tiktok,
          initialData.instagram,
          initialData.twitter,
        ].filter(Boolean);
        setSocialMedia(links.join('\n'));
      }

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
      setNationality('Việt Nam');
      setEthnicity('Kinh');
      setReligion('Không');
      setHometown('');

      setRole('');
      setDepartment('');
      setSubDepartment('');
      setRank('Cấp 2');
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

      setEducationLevel('Đại học');
      setMajor('');
      setSchool('');

      setBankAccounts([
        {
          id: 'ba_' + Date.now(),
          bankName: '',
          accountNumber: '',
          accountHolder: '',
          branch: '',
          isPrimary: true,
        },
      ]);

      setHobbies('');
      setDislikes('');
      setNotes('');
      setSocialMedia('');

      setSocialInsuranceNumber('');
      setHealthInsuranceNumber('');
      setTaxCode('');
    }
    setFormErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setAvatarUrl(loadEvt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Bank Accounts Management
  const handleAddBankAccount = () => {
    setBankAccounts((prev) => [
      ...prev,
      {
        id: 'ba_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        bankName: '',
        accountNumber: '',
        accountHolder: name ? name.toUpperCase() : '',
        branch: '',
        isPrimary: prev.length === 0,
      },
    ]);
  };

  const handleRemoveBankAccount = (id: string) => {
    setBankAccounts((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      if (filtered.length > 0 && !filtered.some((a) => a.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleSetPrimaryBankAccount = (id: string) => {
    setBankAccounts((prev) =>
      prev.map((a) => ({
        ...a,
        isPrimary: a.id === id,
      }))
    );
  };

  const handleUpdateBankAccount = (
    id: string,
    field: keyof EmployeeBankAccount,
    value: any
  ) => {
    setBankAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!name.trim()) errors.name = 'Vui lòng nhập họ và tên';
    if (!role.trim()) errors.role = 'Vui lòng nhập/chọn chức vụ';
    if (!phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại';
    if (!email.trim()) errors.email = 'Vui lòng nhập email công việc';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const validBankAccounts = bankAccounts.filter(
      (ba) => ba.accountNumber.trim() || ba.bankName.trim()
    );
    const primaryBank =
      validBankAccounts.find((ba) => ba.isPrimary) || validBankAccounts[0];

    const payload: Partial<Employee> = {
      name: name.trim(),
      code: code.trim() || undefined,
      username: username.trim() || undefined,
      password: tempPassword.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
      gender,
      dob: fromInputDate(dob),
      maritalStatus: maritalStatus.trim() || undefined,
      nationality: nationality.trim() || undefined,
      ethnicity: ethnicity.trim() || undefined,
      religion: religion.trim() || undefined,
      hometown: hometown.trim() || undefined,

      role: role.trim(),
      department: department.trim(),
      subDepartment: subDepartment.trim() || undefined,
      rank: rank || undefined,
      status,
      startDate: fromInputDate(startDate),
      officialDate: fromInputDate(officialDate),
      resignationDate: fromInputDate(resignationDate),
      resignationReason: resignationReason.trim() || undefined,

      idCardNumber: idCardNumber.trim() || undefined,
      idCardDate: fromInputDate(idCardDate),
      idCardPlace: idCardPlace.trim() || undefined,
      permanentAddress: permanentAddress.trim() || undefined,
      currentAddress: currentAddress.trim() || undefined,

      email: email.trim(),
      personalEmail: personalEmail.trim() || undefined,
      phone: phone.trim(),
      emergencyContactName: emergencyContactName.trim() || undefined,
      emergencyContactPhone: emergencyContactPhone.trim() || undefined,
      emergencyContactRelation: emergencyContactRelation.trim() || undefined,

      educationLevel: educationLevel.trim() || undefined,
      major: major.trim() || undefined,
      school: school.trim() || undefined,

      bankAccounts: validBankAccounts.length > 0 ? validBankAccounts : undefined,
      bankAccount: primaryBank?.accountNumber?.trim() || undefined,
      bankAccountHolder:
        primaryBank?.accountHolder?.trim() || name.trim().toUpperCase() || undefined,
      bankName: primaryBank?.bankName?.trim() || undefined,
      hobbies: hobbies.trim() || undefined,
      dislikes: dislikes.trim() || undefined,
      notes: notes.trim() || undefined,
      socialMedia: socialMedia.trim() || undefined,

      socialInsuranceNumber: socialInsuranceNumber.trim() || undefined,
      healthInsuranceNumber: healthInsuranceNumber.trim() || undefined,
      taxCode: taxCode.trim() || undefined,
    };

    onSubmit(payload);
  };

  const getWidthStyle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return '100vw';
    }
    switch (widthMode) {
      case 'narrow':
        return 'min(540px, 100vw)';
      case 'wide':
        return 'min(1024px, 100vw)';
      case 'fullscreen':
        return '100vw';
      case 'normal':
      default:
        return 'min(768px, -6rem + 100vw)';
    }
  };

  const displayAvatar =
    avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=1d4ed8&color=fff`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        className="fixed inset-y-0 right-0 w-full bg-card shadow-2xl flex flex-col h-[100dvh] border-l border-border outline-none transform-gpu z-50 transition-[width] duration-200"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Chỉnh sửa Hồ sơ' : 'Thêm mới Nhân sự'}
        tabIndex={-1}
        style={{
          width: getWidthStyle(),
          transform: 'none',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-4 border-b border-border bg-card shrink-0"
          style={{
            paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
            paddingBottom: '0.5rem',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          }}
        >
          {/* Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <CircleUser className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground leading-tight truncate">
                {isEdit ? 'Chỉnh sửa Hồ sơ' : 'Thêm mới Nhân sự'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {isEdit ? name || 'Hồ sơ nhân viên' : 'Điền đầy đủ thông tin nhân sự mới'}
              </p>
            </div>
          </div>

          {/* Width Controls & Close */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Width Switcher (Tablet/Desktop) */}
            <div
              role="group"
              aria-label="Bề rộng ngăn bên"
              className="hidden sm:flex items-center gap-0.5 shrink-0 rounded-xl border border-border p-0.5"
            >
              <button
                type="button"
                aria-pressed={widthMode === 'narrow'}
                aria-label="Hẹp"
                title="Hẹp"
                onClick={() => setWidthMode('narrow')}
                className={`p-2 rounded-lg transition-colors active:scale-90 hover:bg-muted hover:text-foreground ${
                  widthMode === 'narrow'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <PanelRightClose className="w-4 h-4 stroke-[2.5px]" />
              </button>
              <button
                type="button"
                aria-pressed={widthMode === 'normal'}
                aria-label="Chuẩn"
                title="Chuẩn"
                onClick={() => setWidthMode('normal')}
                className={`p-2 rounded-lg transition-colors active:scale-90 hover:bg-muted hover:text-foreground ${
                  widthMode === 'normal'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <PanelRight className="w-4 h-4 stroke-[2.5px]" />
              </button>
              <button
                type="button"
                aria-pressed={widthMode === 'wide'}
                aria-label="Rộng"
                title="Rộng"
                onClick={() => setWidthMode('wide')}
                className={`p-2 rounded-lg transition-colors active:scale-90 hover:bg-muted hover:text-foreground ${
                  widthMode === 'wide'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <PanelRightOpen className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              title="Đóng"
              className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors active:scale-90 shrink-0"
            >
              <X className="w-5 h-5 stroke-[2.5px]" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-5 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            <form id="emp-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Section 1: Thông tin cá nhân */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <CircleUser className="w-3.5 h-3.5" />
                    <span className="truncate">Thông tin cá nhân</span>
                  </h4>
                </div>

                {/* Avatar Uploader */}
                <div className="flex justify-center mb-4">
                  <div className="w-24">
                    <input
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      type="file"
                      onChange={handleAvatarFileChange}
                    />
                    <div className="relative group/frame mx-auto" style={{ width: '100%' }}>
                      <div
                        tabIndex={-1}
                        className="relative overflow-hidden border-2 transition-all duration-200 mx-auto rounded-full border-border/80 shadow-xs"
                        style={{ aspectRatio: '1 / 1' }}
                      >
                        <div className="absolute inset-0">
                          <button
                            type="button"
                            onClick={() => setIsPreviewImageOpen(true)}
                            className="absolute inset-0 w-full h-full p-0 border-0 cursor-zoom-in group/preview rounded-full focus:outline-none"
                            title="Xem lớn"
                            aria-label="Xem lớn"
                          >
                            <img
                              alt="Preview"
                              className="w-full h-full rounded-full object-cover"
                              src={displayAvatar}
                            />
                            <span className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/30 transition-colors flex items-center justify-center">
                              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover/preview:opacity-100 transition-opacity drop-shadow" />
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Edit Avatar Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Đổi ảnh"
                        aria-label="Đổi ảnh"
                        className="absolute bottom-0 right-0 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Avatar Button */}
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          title="Xóa ảnh"
                          aria-label="Xóa ảnh"
                          className="absolute top-0 right-0 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-xs text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* Họ tên */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <CircleUser className="w-3 h-3 shrink-0" />
                      Họ tên
                      <span className="text-destructive ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <input
                        required
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                        }}
                        placeholder="VD: Bùi Đức Thắng"
                        className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60 ${
                          formErrors.name ? 'border-destructive' : 'border-border'
                        }`}
                      />
                    </div>
                    {formErrors.name && (
                      <span className="text-[11px] text-destructive mt-1 block">
                        {formErrors.name}
                      </span>
                    )}
                  </div>

                  {/* Giới tính */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Users className="w-3 h-3 shrink-0" />
                      Giới tính
                    </label>
                    <div className="inline-flex flex-wrap rounded-lg border border-border bg-muted/30 p-0.5 w-full">
                      {(['Nam', 'Nữ', 'Khác'] as Gender[]).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`inline-flex items-center justify-center rounded-md transition-all duration-200 select-none border px-3.5 py-2 text-xs gap-2 flex-1 min-w-0 cursor-pointer ${
                            gender === g
                              ? 'bg-background text-foreground shadow-xs border-border font-semibold'
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
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <User className="w-3 h-3 shrink-0" />
                      Ngày sinh
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      />
                    </div>
                  </div>

                  {/* Tình trạng hôn nhân */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Heart className="w-3 h-3 shrink-0" />
                      Tình trạng hôn nhân
                    </label>
                    <div className="relative">
                      <select
                        value={maritalStatus}
                        onChange={(e) => setMaritalStatus(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 appearance-none cursor-pointer"
                      >
                        <option value="">Chọn tình trạng hôn nhân</option>
                        <option value="Độc thân">Độc thân</option>
                        <option value="Đã kết hôn">Đã kết hôn</option>
                        <option value="Ly hôn">Ly hôn</option>
                        <option value="Khác">Khác</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Quốc tịch */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" />
                      Quốc tịch
                    </label>
                    <div className="relative">
                      <input
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        placeholder="VD: Việt Nam"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      />
                    </div>
                  </div>

                  {/* Dân tộc */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <User className="w-3 h-3 shrink-0" />
                      Dân tộc
                    </label>
                    <div className="relative">
                      <input
                        value={ethnicity}
                        onChange={(e) => setEthnicity(e.target.value)}
                        placeholder="VD: Kinh"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      />
                    </div>
                  </div>

                  {/* Tôn giáo */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <User className="w-3 h-3 shrink-0" />
                      Tôn giáo
                    </label>
                    <div className="relative">
                      <input
                        value={religion}
                        onChange={(e) => setReligion(e.target.value)}
                        placeholder="VD: Không"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      />
                    </div>
                  </div>

                  {/* Quê quán */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" />
                      Quê quán
                    </label>
                    <div className="relative">
                      <input
                        value={hometown}
                        onChange={(e) => setHometown(e.target.value)}
                        placeholder="VD: Hải Phòng"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Thông tin công việc */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span className="truncate">Thông tin công việc</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* Chức vụ */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Briefcase className="w-3 h-3 shrink-0" />
                      Chức vụ
                      <span className="text-destructive ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <input
                        required
                        value={role}
                        onChange={(e) => {
                          setRole(e.target.value);
                          if (formErrors.role) setFormErrors({ ...formErrors, role: '' });
                        }}
                        placeholder="VD: Trưởng Nhóm Trợ lý"
                        className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60 ${
                          formErrors.role ? 'border-destructive' : 'border-border'
                        }`}
                      />
                    </div>
                    {formErrors.role && (
                      <span className="text-[11px] text-destructive mt-1 block">
                        {formErrors.role}
                      </span>
                    )}
                  </div>

                  {/* Phòng ban */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="w-3 h-3 shrink-0" />
                      Phòng ban
                    </label>
                    <div className="relative">
                      <input
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="VD: Phòng Ban Giám đốc"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      />
                    </div>
                  </div>

                  {/* Bộ phận */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="w-3 h-3 shrink-0" />
                      Bộ phận
                    </label>
                    <div className="relative">
                      <input
                        value={subDepartment}
                        onChange={(e) => setSubDepartment(e.target.value)}
                        placeholder="VD: Nhóm trợ lý"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      />
                    </div>
                  </div>

                  {/* Cấp bậc */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Layers className="w-3 h-3 shrink-0" />
                      Cấp bậc
                    </label>
                    <div className="relative">
                      <input
                        value={rank}
                        onChange={(e) => setRank(e.target.value)}
                        placeholder="VD: Cấp 2"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      />
                    </div>
                  </div>

                  {/* Trạng thái làm việc */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <CircleDot className="w-3 h-3 shrink-0" />
                      Trạng thái làm việc
                    </label>
                    <div className="relative">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 appearance-none cursor-pointer"
                      >
                        <option value="working">Đang làm việc</option>
                        <option value="probation">Thử việc</option>
                        <option value="resigned">Đã nghỉ việc</option>
                        <option value="suspended">Tạm hoãn</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Ngày vào làm */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Briefcase className="w-3 h-3 shrink-0" />
                      Ngày vào làm
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      />
                    </div>
                  </div>

                  {/* Ngày chính thức */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Briefcase className="w-3 h-3 shrink-0" />
                      Ngày chính thức
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={officialDate}
                        onChange={(e) => setOfficialDate(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      />
                    </div>
                  </div>

                  {/* Ngày nghỉ việc */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Briefcase className="w-3 h-3 shrink-0" />
                      Ngày nghỉ việc
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={resignationDate}
                        onChange={(e) => setResignationDate(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      />
                    </div>
                  </div>

                  {/* Lý do nghỉ */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <CircleDot className="w-3 h-3 shrink-0" />
                      Lý do nghỉ
                    </label>
                    <div className="relative">
                      <input
                        value={resignationReason}
                        onChange={(e) => setResignationReason(e.target.value)}
                        placeholder="VD: Chuyển công tác, Lý do cá nhân..."
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Giấy tờ & địa chỉ */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <IdCard className="w-3.5 h-3.5" />
                    <span className="truncate">Giấy tờ & địa chỉ</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* CCCD */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <IdCard className="w-3 h-3 shrink-0" />
                      CMND/CCCD
                    </label>
                    <div className="relative">
                      <input
                        value={idCardNumber}
                        onChange={(e) => setIdCardNumber(e.target.value)}
                        placeholder="VD: 012345678901"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  {/* Ngày cấp CCCD */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <IdCard className="w-3 h-3 shrink-0" />
                      Ngày cấp CCCD
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={idCardDate}
                        onChange={(e) => setIdCardDate(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40"
                      />
                    </div>
                  </div>

                  {/* Nơi cấp */}
                  <div className="w-full sm:col-span-2">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <IdCard className="w-3 h-3 shrink-0" />
                      Nơi cấp
                    </label>
                    <div className="relative">
                      <input
                        value={idCardPlace}
                        onChange={(e) => setIdCardPlace(e.target.value)}
                        placeholder="VD: Cục Cảnh sát QLHC về TTXH"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  {/* Địa chỉ thường trú */}
                  <div className="w-full sm:col-span-2">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" />
                      Địa chỉ thường trú
                    </label>
                    <div className="relative">
                      <input
                        value={permanentAddress}
                        onChange={(e) => setPermanentAddress(e.target.value)}
                        placeholder="Số nhà, đường, phường/xã, tỉnh/thành"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  {/* Chỗ ở hiện tại */}
                  <div className="w-full sm:col-span-2">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" />
                      Chỗ ở hiện tại
                    </label>
                    <div className="relative">
                      <input
                        value={currentAddress}
                        onChange={(e) => setCurrentAddress(e.target.value)}
                        placeholder="Số nhà, đường, phường/xã, tỉnh/thành"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Thông tin liên hệ */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">Thông tin liên hệ</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* Email công việc */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="w-3 h-3 shrink-0" />
                      Email công việc
                      <span className="text-destructive ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                        }}
                        placeholder="VD: thang.bui@company.vn"
                        className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60 ${
                          formErrors.email ? 'border-destructive' : 'border-border'
                        }`}
                      />
                    </div>
                    {formErrors.email && (
                      <span className="text-[11px] text-destructive mt-1 block">
                        {formErrors.email}
                      </span>
                    )}
                  </div>

                  {/* Email cá nhân */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="w-3 h-3 shrink-0" />
                      Email cá nhân
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={personalEmail}
                        onChange={(e) => setPersonalEmail(e.target.value)}
                        placeholder="VD: ten@gmail.com"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  {/* Điện thoại */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="w-3 h-3 shrink-0" />
                      Điện thoại
                      <span className="text-destructive ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <input
                        required
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                        }}
                        placeholder="VD: 0929012345"
                        className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60 ${
                          formErrors.phone ? 'border-destructive' : 'border-border'
                        }`}
                      />
                    </div>
                    {formErrors.phone && (
                      <span className="text-[11px] text-destructive mt-1 block">
                        {formErrors.phone}
                      </span>
                    )}
                  </div>

                  {/* Người liên hệ khẩn cấp */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <User className="w-3 h-3 shrink-0" />
                      Người liên hệ khẩn cấp
                    </label>
                    <div className="relative">
                      <input
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        placeholder="VD: Nguyễn Văn A"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  {/* SĐT khẩn cấp */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="w-3 h-3 shrink-0" />
                      SĐT khẩn cấp
                    </label>
                    <div className="relative">
                      <input
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        placeholder="VD: 0987654321"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  {/* Quan hệ */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Heart className="w-3 h-3 shrink-0" />
                      Quan hệ
                    </label>
                    <div className="relative">
                      <select
                        value={emergencyContactRelation}
                        onChange={(e) => setEmergencyContactRelation(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 appearance-none cursor-pointer"
                      >
                        <option value="">Chọn quan hệ</option>
                        <option value="Bố/Mẹ">Bố/Mẹ</option>
                        <option value="Vợ/Chồng">Vợ/Chồng</option>
                        <option value="Anh/Chị/Em">Anh/Chị/Em</option>
                        <option value="Khác">Khác</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Học vấn & Chứng chỉ */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span className="truncate">Học vấn & Chứng chỉ</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* Trình độ học vấn */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <GraduationCap className="w-3 h-3 shrink-0" />
                      Trình độ học vấn
                    </label>
                    <div className="relative">
                      <select
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 appearance-none cursor-pointer"
                      >
                        <option value="Đại học">Đại học</option>
                        <option value="Cao đẳng">Cao đẳng</option>
                        <option value="Thạc sĩ">Thạc sĩ</option>
                        <option value="Tiến sĩ">Tiến sĩ</option>
                        <option value="Trung cấp">Trung cấp</option>
                        <option value="Phổ thông">Phổ thông</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Chuyên ngành */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Briefcase className="w-3 h-3 shrink-0" />
                      Chuyên ngành
                    </label>
                    <div className="relative">
                      <input
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        placeholder="VD: Công nghệ thông tin"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  {/* Trường đào tạo */}
                  <div className="w-full sm:col-span-2">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <School className="w-3 h-3 shrink-0" />
                      Trường đào tạo
                    </label>
                    <div className="relative">
                      <input
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        placeholder="VD: Đại học Bách Khoa TP.HCM"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 6: Tài chính & Ngân hàng (Hỗ trợ nhiều tài khoản) */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-3 sm:space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <Landmark className="w-3.5 h-3.5" />
                    <span className="truncate">Tài chính & Ngân hàng ({bankAccounts.length} tài khoản)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddBankAccount}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm tài khoản</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {bankAccounts.map((acc, index) => (
                    <div
                      key={acc.id}
                      className={`p-3.5 rounded-xl border transition-all space-y-3 ${
                        acc.isPrimary
                          ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20 shadow-xs'
                          : 'border-border bg-background/60 hover:border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                              acc.isPrimary
                                ? 'bg-primary text-primary-foreground shadow-2xs'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {acc.bankName ? acc.bankName : `Tài khoản ngân hàng #${index + 1}`}
                          </span>
                          {acc.isPrimary && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Star className="w-2.5 h-2.5 fill-current" /> Tài khoản chính (Nhận lương)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!acc.isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryBankAccount(acc.id)}
                              className="text-[11px] font-medium text-muted-foreground hover:text-amber-600 px-2 py-1 rounded-lg hover:bg-muted transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Star className="w-3 h-3" /> Đặt làm chính
                            </button>
                          )}
                          {bankAccounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBankAccount(acc.id)}
                              className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              title="Xóa tài khoản này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                        {/* Tên ngân hàng */}
                        <div className="w-full">
                          <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                            <Landmark className="w-3 h-3 shrink-0" />
                            Tên ngân hàng
                          </label>
                          <div className="relative">
                            <input
                              list={`bank-list-${acc.id}`}
                              value={acc.bankName}
                              onChange={(e) =>
                                handleUpdateBankAccount(acc.id, 'bankName', e.target.value)
                              }
                              placeholder="Chọn hoặc nhập tên ngân hàng..."
                              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60"
                            />
                            <datalist id={`bank-list-${acc.id}`}>
                              {VIETNAM_BANKS.map((b) => (
                                <option key={b} value={b} />
                              ))}
                            </datalist>
                          </div>
                        </div>

                        {/* Số tài khoản */}
                        <div className="w-full">
                          <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                            <CreditCard className="w-3 h-3 shrink-0" />
                            Số tài khoản
                          </label>
                          <div className="relative">
                            <input
                              value={acc.accountNumber}
                              onChange={(e) =>
                                handleUpdateBankAccount(acc.id, 'accountNumber', e.target.value)
                              }
                              placeholder="VD: 0123456789"
                              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60 font-mono"
                            />
                          </div>
                        </div>

                        {/* Chủ tài khoản */}
                        <div className="w-full">
                          <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                            <User className="w-3 h-3 shrink-0" />
                            Chủ tài khoản
                          </label>
                          <div className="relative">
                            <input
                              value={acc.accountHolder}
                              onChange={(e) =>
                                handleUpdateBankAccount(acc.id, 'accountHolder', e.target.value)
                              }
                              placeholder={name ? name.toUpperCase() : 'TÊN CHỦ TÀI KHOẢN'}
                              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60 uppercase"
                            />
                          </div>
                        </div>

                        {/* Chi nhánh */}
                        <div className="w-full">
                          <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                            <Building2 className="w-3 h-3 shrink-0" />
                            Chi nhánh
                          </label>
                          <div className="relative">
                            <input
                              value={acc.branch || ''}
                              onChange={(e) =>
                                handleUpdateBankAccount(acc.id, 'branch', e.target.value)
                              }
                              placeholder="VD: Chi nhánh Sở Giao Dịch TP.HCM"
                              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddBankAccount}
                    className="w-full py-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Thêm tài khoản ngân hàng khác</span>
                  </button>
                </div>
              </div>

              {/* Section: Sở thích, Không thích, Mạng xã hội & Ghi chú */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-3 sm:space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <Heart className="w-3.5 h-3.5" />
                    <span className="truncate">Sở thích, Thói quen, Mạng xã hội & Ghi chú</span>
                  </h4>
                </div>

                <div className="space-y-3.5">
                  {/* Sở thích */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Sparkles className="w-3 h-3 shrink-0 text-amber-500" />
                      Sở thích & Thói quen cá nhân
                    </label>
                    <textarea
                      rows={2}
                      value={hobbies}
                      onChange={(e) => setHobbies(e.target.value)}
                      placeholder="VD: Cà phê sáng không đường, đọc sách công nghệ, đá bóng chiều thứ 7, du lịch trải nghiệm..."
                      className="flex w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60 resize-y leading-relaxed"
                    />
                  </div>

                  {/* Không thích / Dị ứng */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <ThumbsDown className="w-3 h-3 shrink-0 text-rose-500" />
                      Không thích / Kiêng cữ / Dị ứng
                    </label>
                    <textarea
                      rows={2}
                      value={dislikes}
                      onChange={(e) => setDislikes(e.target.value)}
                      placeholder="VD: Dị ứng hải sản có vỏ, không thích tiếng ồn lớn khi tập trung, kiêng ăn đồ ngọt/cay..."
                      className="flex w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60 resize-y leading-relaxed"
                    />
                  </div>

                  {/* Mạng xã hội */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Globe className="w-3 h-3 shrink-0 text-blue-600" />
                      Mạng xã hội & Kênh liên kết (Dán link)
                    </label>
                    <textarea
                      rows={2}
                      value={socialMedia}
                      onChange={(e) => setSocialMedia(e.target.value)}
                      placeholder="Dán link Facebook, Zalo, TikTok, LinkedIn, Instagram... (mỗi link 1 dòng hoặc cách nhau bởi dấu phẩy)"
                      className="flex w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60 resize-y font-mono leading-relaxed"
                    />
                  </div>

                  {/* Ghi chú nhân sự */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <FileText className="w-3 h-3 shrink-0 text-primary" />
                      Ghi chú nhân sự & Lưu ý đặc biệt
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Nhập các ghi chú nội bộ, tính cách, hoàn cảnh gia đình hoặc lưu ý đặc thù..."
                      className="flex w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60 resize-y leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Section 7: Bảo hiểm */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <Shield className="w-3.5 h-3.5" />
                    <span className="truncate">Bảo hiểm</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* Số BHXH */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <Shield className="w-3 h-3 shrink-0" />
                      Số BHXH
                    </label>
                    <div className="relative">
                      <input
                        value={socialInsuranceNumber}
                        onChange={(e) => setSocialInsuranceNumber(e.target.value)}
                        placeholder="VD: 0123456789"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  {/* Số BHYT */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      Số BHYT
                    </label>
                    <div className="relative">
                      <input
                        value={healthInsuranceNumber}
                        onChange={(e) => setHealthInsuranceNumber(e.target.value)}
                        placeholder="VD: HS4010123456789"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  {/* Mã số thuế */}
                  <div className="w-full sm:col-span-2">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <IdCard className="w-3 h-3 shrink-0" />
                      Mã số thuế cá nhân
                    </label>
                    <div className="relative">
                      <input
                        value={taxCode}
                        onChange={(e) => setTaxCode(e.target.value)}
                        placeholder="VD: 0123456789"
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 8: Tài khoản hệ thống */}
              <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-xs space-y-2.5 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-2 sm:pb-2.5 border-b border-primary/20">
                  <h4 className="text-xs uppercase tracking-wider flex min-w-0 items-center gap-1.5 sm:gap-2 text-primary font-bold">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span className="truncate">Tài khoản hệ thống</span>
                  </h4>
                </div>

                <p className="text-xs text-muted-foreground mb-3">
                  {isEdit
                    ? 'Thông tin tài khoản dùng để đăng nhập hệ thống của nhân viên.'
                    : 'Nhân viên chưa có tài khoản — nhập tên đăng nhập và mật khẩu tạm để tạo.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  {/* Tên đăng nhập */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <AtSign className="w-3 h-3 shrink-0" />
                      Tên đăng nhập
                    </label>
                    <div className="relative">
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={code ? code : 'VD: thang.bui'}
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60 font-mono"
                      />
                    </div>
                  </div>

                  {/* Mật khẩu tạm */}
                  <div className="w-full">
                    <label className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                      <KeyRound className="w-3 h-3 shrink-0" />
                      {isEdit ? 'Mật khẩu' : 'Mật khẩu tạm'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        placeholder="Nhập mật khẩu..."
                        className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 placeholder:text-muted-foreground/60 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        title={showPassword ? 'Ẩn' : 'Hiện'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sticky Footer */}
        <div
          className="bg-card border-t border-border flex flex-col-reverse sm:flex-row items-center shrink-0 w-full gap-2 z-10"
          style={{
            paddingTop: '0.5rem',
            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          }}
        >
          <div className="flex items-center justify-between w-full gap-2 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background hover:bg-muted h-8 px-3 text-xs border-border text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Hủy
            </button>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                form="emp-form"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 text-xs bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                Lưu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {isPreviewImageOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsPreviewImageOpen(false)}
        >
          <div
            className="relative max-w-md w-full bg-card rounded-2xl overflow-hidden shadow-2xl border border-border p-4 flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 border-b border-border">
              <h4 className="text-sm font-bold text-foreground truncate">
                {name || 'Ảnh đại diện'}
              </h4>
              <button
                type="button"
                onClick={() => setIsPreviewImageOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={displayAvatar}
              alt="Avatar Full"
              className="w-64 h-64 sm:w-80 sm:h-80 object-cover rounded-xl shadow-md border border-border"
            />
          </div>
        </div>
      )}
    </>
  );
};
