// -------------------------------------------------------------
// TYPES FOR FINANCE MASTER MODULES (DANH MỤC TÀI CHÍNH)
// -------------------------------------------------------------

// 1. DANH MỤC TÀI CHÍNH (Khoản mục thu chi 2 cấp)
export type CategoryType = 'income' | 'expense' | 'transfer';
export type MasterStatus = 'active' | 'inactive';

export interface FinanceCategory {
  id: string;
  code: string;
  name: string;
  type: CategoryType;
  parentCategory?: string; // Nhóm cha (Cấp 1)
  level: 1 | 2; // Cấp 1 hoặc Cấp 2
  description?: string;
  status: MasterStatus;
  isPinned?: boolean;
  order?: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// 2. TÀI KHOẢN (Quỹ tiền mặt, Tài khoản ngân hàng, Ví điện tử & Tồn đầu)
export type AccountType = 'bank' | 'cash' | 'wallet';

export interface FinanceAccount {
  id: string;
  code: string;
  accountName: string;
  type: AccountType;
  accountNumber?: string;
  bankName?: string;
  branch?: string;
  accountHolder?: string;
  initialBalance: number;
  currentBalance: number;
  totalIncome?: number;
  totalExpense?: number;
  transactionCount?: number;
  currency?: string; // VND, USD
  status: MasterStatus;
  isDefault?: boolean;
  isPinned?: boolean;
  note?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// 3. ĐỐI TƯỢNG THU CHI (Nhà cung cấp, khách hàng, nhân viên, đối tác)
export type CounterpartyType = 'customer' | 'vendor' | 'employee' | 'partner' | 'other';

export interface Counterparty {
  id: string;
  code: string;
  name: string;
  type: CounterpartyType;
  phone?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  bankAccount?: string;
  bankName?: string;
  bankBranch?: string;
  contactPerson?: string;
  contactPersonPhone?: string;
  status: MasterStatus;
  isPinned?: boolean;
  note?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// 4. NGƯỠNG DUYỆT (Hạn mức & Cấp độ phê duyệt chi phí)
export interface ApprovalStep {
  level: number; // Cấp 1, 2, 3
  role: string; // Trưởng bộ phận, Kế toán trưởng, Giám đốc điều hành
  approverName?: string;
  required: boolean;
}

export interface ApprovalThreshold {
  id: string;
  code: string;
  name: string;
  minAmount: number;
  maxAmount: number; // 0 = Không giới hạn
  approvalLevels: number; // Số cấp duyệt: 1, 2, 3, 4
  approvers: string[]; // Danh sách chức vụ / người duyệt
  department?: string; // Áp dụng cho phòng ban cụ thể hoặc Tất cả
  category?: string; // Áp dụng cho khoản mục cụ thể hoặc Tất cả
  appliesTo: 'all' | 'expense' | 'proposal' | 'advance';
  status: MasterStatus;
  isPinned?: boolean;
  note?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
