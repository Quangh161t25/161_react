export type EmployeeStatus = 'working' | 'probation' | 'resigned' | 'suspended';
export type Gender = 'Nam' | 'Nữ' | 'Khác' | '';

export const VIETNAM_BANKS: string[] = [
  'Vietcombank (Ngân hàng Ngoại thương)',
  'Techcombank (Ngân hàng Kỹ thương)',
  'MB Bank (Ngân hàng Quân đội)',
  'BIDV (Ngân hàng Đầu tư và Phát triển)',
  'VietinBank (Ngân hàng Công thương)',
  'Agribank (Ngân hàng Nông nghiệp & PTNT)',
  'VPBank (Ngân hàng Việt Nam Thịnh vượng)',
  'ACB (Ngân hàng Á Châu)',
  'TPBank (Ngân hàng Tiên Phong)',
  'VIB (Ngân hàng Quốc tế)',
  'Sacombank (Ngân hàng Sài Gòn Thương Tín)',
  'HDBank (Ngân hàng Phát triển TP.HCM)',
  'SHB (Ngân hàng Sài Gòn - Hà Nội)',
  'OCB (Ngân hàng Phương Đông)',
  'MSB (Ngân hàng Hàng Hải)',
  'SeABank (Ngân hàng Đông Nam Á)',
  'LPBank (Ngân hàng Bưu điện Liên Việt)',
  'Timo Digital Bank',
  'Cake by VPBank',
  'Khác...',
];

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

