export type EmployeeStatus = 'working' | 'probation' | 'resigned' | 'suspended';
export type Gender = 'Nam' | 'Nữ' | 'Khác';

export interface EmployeeBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  isPrimary?: boolean;
}

export interface EmployeeSocialLinks {
  facebook?: string;
  zalo?: string;
  linkedin?: string;
  tiktok?: string;
  instagram?: string;
  twitter?: string;
  other?: string;
}

export interface Employee {
  id: string;
  code: string; // e.g., 'emp-001', 'emp-029'
  name: string;
  username?: string;
  phone: string;
  email: string;
  role: string;
  department: string;
  subDepartment?: string;
  gender: Gender;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  dob?: string;
  maritalStatus?: string;
  nationality?: string;
  ethnicity?: string;
  religion?: string;
  hometown?: string;
  rank?: number | string;
  startDate?: string;
  officialDate?: string;
  resignationDate?: string;
  resignationReason?: string;
  idCardNumber?: string;
  idCardDate?: string;
  idCardPlace?: string;
  permanentAddress?: string;
  currentAddress?: string;
  personalEmail?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  educationLevel?: string;
  major?: string;
  school?: string;

  // Banking
  bankAccount?: string;
  bankAccountHolder?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccounts?: EmployeeBankAccount[];

  // Insurance & Tax
  socialInsuranceNumber?: string;
  healthInsuranceNumber?: string;
  taxCode?: string;

  // Additional Fields
  hobbies?: string; // Sở thích (textarea)
  dislikes?: string; // Không thích (textarea)
  notes?: string; // Ghi chú (textarea)
  socialMedia?: string; // Mạng xã hội (dán link tự do)
  facebook?: string;
  zalo?: string;
  linkedin?: string;
  tiktok?: string;
  instagram?: string;
  twitter?: string;

  isActiveAccount?: boolean;
  password?: string;
}

