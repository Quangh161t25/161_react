export type TransactionType = 'income' | 'expense' | 'transfer';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'e_wallet';

export type TransactionStatus = 'completed' | 'pending' | 'draft' | 'cancelled';

export interface TransactionAttachment {
  id: string;
  name: string;
  size: string;
  url: string;
  type?: string;
}

export interface CashTransaction {
  id: string;
  code: string; // PT-2026-001 (Thu), PC-2026-001 (Chi), LC-2026-001 (Luân chuyển)
  type: TransactionType;
  title: string;
  amount: number; // VND
  amountInWords?: string;
  transactionDate: string; // YYYY-MM-DD
  transactionTime?: string; // HH:mm
  category: string;
  subCategory?: string;
  account: string; // Quỹ tiền mặt, Vietcombank, Techcombank,...
  destinationAccount?: string; // Khi type === 'transfer'
  paymentMethod: PaymentMethod;
  counterpartyId?: string; // ID liên kết đối tượng hoặc nhân viên
  counterpartyType: 'customer' | 'vendor' | 'employee' | 'partner' | 'other';
  counterpartyName: string;
  counterpartyCode?: string;
  counterpartyPhone?: string;
  counterpartyAddress?: string;
  department?: string;
  refProposalCode?: string; // Liên kết đề xuất chi phí
  invoiceNumber?: string; // Số hóa đơn VAT / Hợp đồng
  reason: string;
  note?: string;
  attachments?: TransactionAttachment[];
  status: TransactionStatus;
  isPinned?: boolean;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashAccountBalance {
  accountName: string;
  accountNumber?: string;
  bankName?: string;
  type: 'cash' | 'bank' | 'wallet';
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
}
