import { CashTransaction, CashAccountBalance } from '../types/cashTransaction';

export const CASH_ACCOUNTS: CashAccountBalance[] = [
  {
    accountName: 'Vietcombank - Tài khoản chính',
    accountNumber: '0071001234567',
    bankName: 'Vietcombank (VCB)',
    type: 'bank',
    initialBalance: 1250000000,
    totalIncome: 0,
    totalExpense: 0,
    currentBalance: 1250000000,
  },
  {
    accountName: 'Techcombank - Tài khoản dự phòng',
    accountNumber: '190388889999',
    bankName: 'Techcombank (TCB)',
    type: 'bank',
    initialBalance: 680000000,
    totalIncome: 0,
    totalExpense: 0,
    currentBalance: 680000000,
  },
  {
    accountName: 'MB Bank - Tài khoản chi lương',
    accountNumber: '088812345678',
    bankName: 'MB Bank (MBB)',
    type: 'bank',
    initialBalance: 450000000,
    totalIncome: 0,
    totalExpense: 0,
    currentBalance: 450000000,
  },
  {
    accountName: 'Quỹ tiền mặt văn phòng (VND)',
    type: 'cash',
    initialBalance: 85000000,
    totalIncome: 0,
    totalExpense: 0,
    currentBalance: 85000000,
  },
  {
    accountName: 'Ví điện tử Momo Doanh nghiệp',
    accountNumber: '0908889999',
    type: 'wallet',
    initialBalance: 15000000,
    totalIncome: 0,
    totalExpense: 0,
    currentBalance: 15000000,
  },
];

export const INCOME_CATEGORIES: string[] = [
  'Doanh thu bán hàng & Dịch vụ',
  'Doanh thu hợp đồng phần mềm ERP',
  'Thu hoàn ứng nhân viên',
  'Thu hồi công nợ khách hàng',
  'Thu lãi tiền gửi ngân hàng',
  'Thu tiền cọc / ký quỹ',
  'Thu thanh lý tài sản cố định',
  'Doanh thu tài chính khác',
  'Thu khác',
];

export const EXPENSE_CATEGORIES: string[] = [
  'Chi lương & Phụ cấp nhân sự',
  'Chi thưởng hiệu quả & Dự án',
  'Chi thuê mặt bằng & văn phòng',
  'Chi điện nước, internet & dịch vụ tòa nhà',
  'Chi tiếp khách, hội thảo & ngoại giao',
  'Chi công tác phí & vé máy bay',
  'Chi mua sắm trang thiết bị & máy tính',
  'Chi bản quyền phần mềm & Cloud hosting',
  'Chi quảng cáo, marketing & sự kiện',
  'Chi thuế, phí & lệ phí nhà nước',
  'Chi tạm ứng công việc nhân viên',
  'Chi phí đào tạo & teambuilding',
  'Chi phí quản lý khác',
];

export const TRANSFER_CATEGORIES: string[] = [
  'Rút tiền gửi ngân hàng về nhập quỹ tiền mặt',
  'Nộp tiền mặt vào tài khoản ngân hàng',
  'Chuyển tiền giữa các ngân hàng nội bộ',
  'Nạp tiền vào ví điện tử doanh nghiệp',
];

export const ALL_TRANSACTION_CATEGORIES: string[] = [
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES,
  ...TRANSFER_CATEGORIES,
];

// Dữ liệu giao dịch được lấy trực tiếp từ Google Sheet (tab ThuChi)
export const MOCK_TRANSACTIONS: CashTransaction[] = [];

export const MOCK_CASH_TRANSACTIONS = MOCK_TRANSACTIONS;
