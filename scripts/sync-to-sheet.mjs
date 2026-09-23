import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SPREADSHEET_ID = '1Cx_84szeCGKoLhCSqumeCzKLCErXg1YStQeI_Lrq4nw';
const SERVICE_ACCOUNT_PATH = path.resolve(process.cwd(), 'service-account.json');

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: serviceAccount.token_uri,
    exp: now + 3600,
    iat: now,
  };

  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedClaim = Buffer.from(JSON.stringify(claim)).toString('base64url');
  const signInput = `${encodedHeader}.${encodedClaim}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signInput);
  const signature = sign.sign(serviceAccount.private_key, 'base64url');

  const jwt = `${signInput}.${signature}`;

  const res = await fetch(serviceAccount.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ---------------------- 1. DE XUAT CHI PHI (9 RECORDS) ----------------------
const COST_PROPOSALS = [
  {
    code: 'DX2609-0001',
    title: 'Mua quà tặng tri ân khách hàng thân thiết VIP',
    proposalDate: '05/09/2026',
    dueDate: '08/09/2026',
    proposer: 'Lê Minh Công',
    department: 'Ban Giám Đốc',
    account: '1121 - Tiền gửi ngân hàng Techcombank',
    beneficiary: 'Công ty Cổ phần Quà Tặng Doanh Nghiệp Việt',
    amount: 25000000,
    isOverBudget: 'Có',
    overBudgetReason: 'Số lượng khách hàng VIP nâng hạng trong tháng 8 tăng vượt dự kiến.',
    approvalStatus: 'Đã duyệt',
    status: 'Nháp',
    reason: 'Chuẩn bị 50 phần quà cao cấp gửi tặng đối tác dịp Trung Thu.',
    lineItems: JSON.stringify([
      { name: 'Hộp quà cao cấp đặc biệt', quantity: 50, unitPrice: 500000, total: 25000000 }
    ])
  },
  {
    code: 'DX2609-0002',
    title: 'Tạm ứng chi phí công tác Đà Nẵng khảo sát thị trường',
    proposalDate: '10/09/2026',
    dueDate: '12/09/2026',
    proposer: 'Lê Minh Công',
    department: 'Ban Giám Đốc',
    account: '1111 - Tiền mặt tại quỹ',
    beneficiary: 'Nguyễn Văn Hải (Trưởng phòng KD)',
    amount: 12000000,
    isOverBudget: 'Không',
    overBudgetReason: '',
    approvalStatus: 'Đã duyệt',
    status: 'Nháp',
    reason: 'Khảo sát mặt bằng và gặp gỡ đối tác mở chi nhánh miền Trung (3 ngày).',
    lineItems: JSON.stringify([
      { name: 'Vé máy bay khứ hồi (2 người)', quantity: 2, unitPrice: 3200000, total: 6400000 },
      { name: 'Khách sạn 3 đêm', quantity: 3, unitPrice: 1200000, total: 3600000 },
      { name: 'Phụ cấp công tác & đi lại', quantity: 2, unitPrice: 1000000, total: 2000000 }
    ])
  },
  {
    code: 'DX2609-0003',
    title: 'Chi phí tiếp khách đoàn đối tác Nhật Bản',
    proposalDate: '15/09/2026',
    dueDate: '16/09/2026',
    proposer: 'Lê Minh Công',
    department: 'Ban Giám Đốc',
    account: '1111 - Tiền mặt tại quỹ',
    beneficiary: 'Nhà hàng Tokyo Sushi Garden',
    amount: 6800000,
    isOverBudget: 'Không',
    overBudgetReason: '',
    approvalStatus: 'Đã duyệt',
    status: 'Nháp',
    reason: 'Tiếp đón và làm việc với Giám đốc công ty Sumitomo về dự án hợp tác.',
    lineItems: JSON.stringify([
      { name: 'Set ăn ngoại giao & phòng VIP', quantity: 1, unitPrice: 6800000, total: 6800000 }
    ])
  },
  {
    code: 'DX2609-0004',
    title: 'Tiền thuê văn phòng trụ sở chính tháng 10/2026',
    proposalDate: '18/09/2026',
    dueDate: '30/09/2026',
    proposer: 'Lê Minh Công',
    department: 'Ban Giám Đốc',
    account: '1121 - Tiền gửi ngân hàng Techcombank',
    beneficiary: 'Tòa nhà Landmark Building',
    amount: 85000000,
    isOverBudget: 'Không',
    overBudgetReason: '',
    approvalStatus: 'Đã duyệt',
    status: 'Nháp',
    reason: 'Thanh toán tiền thuê định kỳ theo hợp đồng thuê số HĐ-01/2024.',
    lineItems: JSON.stringify([
      { name: 'Tiền thuê sàn tầng 12 (350m2)', quantity: 1, unitPrice: 75000000, total: 75000000 },
      { name: 'Phí dịch vụ & quản lý tòa nhà', quantity: 1, unitPrice: 10000000, total: 10000000 }
    ])
  },
  {
    code: 'DX2609-0005',
    title: 'Chi phí gia hạn bản quyền phần mềm Microsoft 365 & Google Workspace',
    proposalDate: '20/09/2026',
    dueDate: '25/09/2026',
    proposer: 'Lê Minh Công',
    department: 'Ban Giám Đốc',
    account: '1122 - Tiền gửi ngân hàng Vietcombank',
    beneficiary: 'Công ty Cổ phần Mật Mã & Phần Mềm',
    amount: 18500000,
    isOverBudget: 'Không',
    overBudgetReason: '',
    approvalStatus: 'Đã duyệt',
    status: 'Nháp',
    reason: 'Gia hạn gói tài khoản cho 50 nhân sự trong 12 tháng tiếp theo.',
    lineItems: JSON.stringify([
      { name: 'Gói Microsoft 365 Business', quantity: 30, unitPrice: 350000, total: 10500000 },
      { name: 'Gói Google Workspace Business', quantity: 20, unitPrice: 400000, total: 8000000 }
    ])
  },
  {
    code: 'DX2609-0006',
    title: 'Thanh toán chi phí truyền thông & marketing Q3',
    proposalDate: '22/09/2026',
    dueDate: '28/09/2026',
    proposer: 'Lê Minh Công',
    department: 'Ban Giám Đốc',
    account: '1121 - Tiền gửi ngân hàng Techcombank',
    beneficiary: 'Meta Platforms Ireland',
    amount: 45000000,
    isOverBudget: 'Có',
    overBudgetReason: 'Bổ sung ngân sách chiến dịch khuyến mãi kỷ niệm 10 năm thành lập công ty.',
    approvalStatus: 'Chờ duyệt',
    status: 'Nháp',
    reason: 'Chạy quảng cáo Facebook Ads, Google Ads tăng nhận diện thương hiệu.',
    lineItems: JSON.stringify([
      { name: 'Facebook Ads', quantity: 1, unitPrice: 25000000, total: 25000000 },
      { name: 'Google Search Ads', quantity: 1, unitPrice: 20000000, total: 20000000 }
    ])
  },
  {
    code: 'DX2609-0007',
    title: 'Chi phí mua sắm bàn ghế làm việc đợt 3/2026',
    proposalDate: '23/09/2026',
    dueDate: '25/09/2026',
    proposer: 'Lê Minh Công',
    department: 'Ban Giám Đốc',
    account: '1121 - Tiền gửi ngân hàng Techcombank',
    beneficiary: 'Công ty TNHH Nội Thất Hòa Phát',
    amount: 15400000,
    isOverBudget: 'Không',
    overBudgetReason: '',
    approvalStatus: 'Chờ duyệt',
    status: 'Nháp',
    reason: 'Trang bị thêm 10 bộ bàn làm việc nhân viên phục vụ mở rộng văn phòng tầng 4.',
    lineItems: JSON.stringify([
      { name: 'Bàn làm việc cụm 4 chỗ', quantity: 2, unitPrice: 4200000, total: 8400000 },
      { name: 'Ghế xoay lưới công thái học', quantity: 10, unitPrice: 700000, total: 7000000 }
    ])
  },
  {
    code: 'DX2609-0008',
    title: 'Đề xuất chi phí tiếp khách',
    proposalDate: '23/09/2026',
    dueDate: '23/09/2026',
    proposer: 'Lê Minh Công',
    department: 'Ban Giám Đốc',
    account: 'Vietcombank - Tài khoản chính',
    beneficiary: 'Nhà hàng Hoàng Yến',
    amount: 3500000,
    isOverBudget: 'Không',
    overBudgetReason: '',
    approvalStatus: 'Chờ duyệt',
    status: 'Nháp',
    reason: 'Tiếp đối tác triển khai phần mềm CRM.',
    lineItems: JSON.stringify([
      { id: 'li-init-1', category: 'Tiếp khách', description: 'Tiếp khách đối tác CRM', quantity: 1, unitPrice: 3500000, amount: 3500000, note: '' }
    ])
  },
  {
    code: 'DX2609-0009',
    title: 'Chi phí quảng cáo số và tiếp thị trực tuyến',
    proposalDate: '23/09/2026',
    dueDate: '23/09/2026',
    proposer: 'Lê Minh Công',
    department: 'Ban Giám Đốc',
    account: 'Vietcombank - Tài khoản chính',
    beneficiary: 'Công ty CP Quảng Cáo Số 1',
    amount: 3560000,
    isOverBudget: 'Không',
    overBudgetReason: '',
    approvalStatus: 'Chờ duyệt',
    status: 'Nháp',
    reason: 'Chi phí chạy thử nghiệm chiến dịch marketing số.',
    lineItems: JSON.stringify([
      { id: 'li-init-1', category: 'Quảng cáo', description: 'Quảng cáo Facebook', quantity: 1, unitPrice: 1330000, amount: 1330000, note: '' },
      { id: 'li-1790145346620', category: 'Điện nước & Dịch vụ', description: 'Dịch vụ phụ trợ marketing', quantity: 1, unitPrice: 2230000, amount: 2230000, note: '' }
    ])
  }
];

// ---------------------- 2. TAI CHINH (10 MODULES) ----------------------
const FINANCE_MODULES = [
  { group: 'Đề xuất & Kế hoạch', code: 'DXCP', title: 'Đề xuất chi phí', desc: 'Lập phiếu đề xuất, trình duyệt và in phiếu.', href: '/tai-chinh/de-xuat-chi-phi' },
  { group: 'Đề xuất & Kế hoạch', code: 'KHCP', title: 'Kế hoạch chi phí', desc: 'Ngân sách cả năm theo khoản mục và phòng ban.', href: '/tai-chinh/ke-hoach-chi-phi' },
  { group: 'Đề xuất & Kế hoạch', code: 'TC', title: 'Thu chi', desc: 'Phiếu thu, phiếu chi và luân chuyển tài khoản.', href: '/tai-chinh/thu-chi' },
  { group: 'Đề xuất & Kế hoạch', code: 'TUHU', title: 'Tạm ứng / hoàn ứng', desc: 'Tạm ứng cho nhân viên và quyết toán chi tiêu.', href: '/tai-chinh/tam-ung-hoan-ung' },
  { group: 'Danh mục', code: 'DMTC', title: 'Danh mục tài chính', desc: 'Khoản mục thu chi hai cấp.', href: '/tai-chinh/danh-muc-tai-chinh' },
  { group: 'Danh mục', code: 'TK', title: 'Tài khoản', desc: 'Quỹ tiền mặt, tài khoản ngân hàng và tồn đầu.', href: '/tai-chinh/tai-khoan' },
  { group: 'Danh mục', code: 'DTTC', title: 'Đối tượng thu chi', desc: 'Nhà cung cấp, khách hàng và nhân viên.', href: '/tai-chinh/doi-tuong-thu-chi' },
  { group: 'Danh mục', code: 'ND', title: 'Ngưỡng duyệt', desc: 'Mức tiền nào cần mấy cấp duyệt.', href: '/tai-chinh/nguong-duyet' },
  { group: 'Báo cáo', code: 'BCTK', title: 'Báo cáo tài khoản', desc: 'Tồn đầu kỳ, thu chi trong kỳ và tồn cuối kỳ.', href: '/tai-chinh/bao-cao-tai-khoan' },
  { group: 'Báo cáo', code: 'BCTC', title: 'Báo cáo thu chi', desc: 'Thống kê theo khoản mục, phòng ban và kế hoạch.', href: '/tai-chinh/bao-cao-thu-chi' }
];

// ---------------------- 3. TRANG CHU (5 MODULES) ----------------------
const DASHBOARD_MODULES = [
  { code: 'TQ', title: 'Tổng quan', desc: 'Bảng điều khiển và thống kê tổng hợp hiệu quả vận hành', href: '/tong-quan' },
  { code: 'TC', title: 'Tài chính', desc: 'Thu chi, công nợ và báo cáo tài chính.', href: '/tai-chinh' },
  { code: 'HT', title: 'Hệ thống', desc: 'Cấu hình, phân quyền và nhân sự.', href: '/he-thong' },
  { code: 'TTBQ', title: 'Thông tin bản quyền', desc: 'Quản lý sở hữu trí tuệ và thông tin nhà phát triển.', href: '/thong-tin-ban-quyen' },
  { code: 'CD', title: 'Cài đặt', desc: 'Tuỳ chỉnh giao diện, màu sắc, phông chữ và định dạng hệ thống.', href: '/cai-dat' }
];

// ---------------------- 4. HE THONG (7 MODULES) ----------------------
const SYSTEM_MODULES = [
  { group: 'Sơ đồ', code: 'PB', title: 'Phòng ban', desc: 'Cơ cấu tổ chức đơn vị.', href: '/he-thong/phong-ban', guideHref: '/he-thong/phong-ban/huong-dan' },
  { group: 'Sơ đồ', code: 'CV', title: 'Chức vụ', desc: 'Quản lý các vị trí công việc.', href: '/he-thong/chuc-vu', guideHref: '/he-thong/chuc-vu/huong-dan' },
  { group: 'Sơ đồ', code: 'NV', title: 'Nhân viên', desc: 'Hồ sơ và thông tin nhân sự.', href: '/he-thong/nhan-vien', guideHref: '/he-thong/nhan-vien/huong-dan' },
  { group: 'Bảo mật & Cấu hình', code: 'TTC', title: 'Thông tin công ty', desc: 'Thiết lập thông tin pháp nhân.', href: '/he-thong/thong-tin-cong-ty', guideHref: '/he-thong/thong-tin-cong-ty/huong-dan' },
  { group: 'Bảo mật & Cấu hình', code: 'PQ', title: 'Phân quyền', desc: 'Vai trò và quyền hạn.', href: '/he-thong/phan-quyen', guideHref: '/he-thong/phan-quyen/huong-dan' },
  { group: 'Bảo mật & Cấu hình', code: 'NK', title: 'Nhật ký hệ thống', desc: 'Ai đã làm gì, lúc nào.', href: '/he-thong/nhat-ky', guideHref: '' },
  { group: 'Bảo mật & Cấu hình', code: 'SL', title: 'Sao lưu dữ liệu', desc: 'Xuất dữ liệu ra Excel và tải bản sao lưu.', href: '/he-thong/sao-luu', guideHref: '' }
];

// ---------------------- 5. NHAN VIEN (47 COLUMNS, 9 EMPLOYEES) ----------------------
const EMPLOYEE_HEADERS_47 = [
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
  'Ảnh đại diện',
  'Ngày sinh',
  'Tình trạng hôn nhân',
  'Quốc tịch',
  'Dân tộc',
  'Tôn giáo',
  'Quê quán',
  'Chức vụ (Công việc)',
  'Phòng ban (Công việc)',
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
  'Tài khoản hoạt động'
];

const EMPLOYEES_RAW = [
  {
    code: 'emp-001',
    name: 'Bùi Đức Thắng',
    username: 'thangbd',
    password: 'Password@123',
    phone: '0929 012 345',
    email: 'thang.bui@company.vn',
    role: 'Trưởng Nhóm Trợ lý',
    department: 'Phòng Kỹ thuật',
    subDepartment: '—',
    gender: 'Nam',
    status: 'Đang làm việc',
    createdAt: '01/01/2024',
    updatedAt: '15/01/2025',
    avatarUrl: 'https://ui-avatars.com/api/?name=B%C3%B9i%20%C4%90%E1%BB%A9c%20Th%E1%BA%AFng&background=1d4ed8&color=fff',
    dob: '12/05/1992',
    maritalStatus: 'Đã kết hôn',
    nationality: 'Việt Nam',
    ethnicity: 'Kinh',
    religion: 'Không',
    hometown: 'Hải Phòng',
    rank: 2,
    startDate: '01/01/2024',
    officialDate: '01/03/2024',
    resignationDate: '',
    resignationReason: '',
    idCardNumber: '001092008899',
    idCardDate: '10/06/2021',
    idCardPlace: 'Cục Cảnh sát QLHC về TTXH',
    permanentAddress: 'Số 12 Lê Hồng Phong, Hải Phòng',
    currentAddress: 'Số 88, Cầu Giấy, Hà Nội',
    personalEmail: 'thang.bui92@gmail.com',
    emergencyContactName: 'Bùi Đức Minh',
    emergencyContactPhone: '0912 345 678',
    emergencyContactRelation: 'Bố',
    educationLevel: 'Đại học',
    major: 'Kỹ thuật Phần mềm',
    school: 'Đại học Bách Khoa Hà Nội',
    bankAccount: '19034567890123',
    bankAccountHolder: 'BUI DUC THANG',
    bankName: 'Techcombank',
    bankBranch: 'Chi nhánh Cầu Giấy',
    socialInsuranceNumber: '7912345678',
    healthInsuranceNumber: 'DN40123456789',
    taxCode: '8392019283',
    isActiveAccount: 'Hoạt động'
  },
  {
    code: 'emp-002',
    name: 'Nguyễn Thị Minh Hạnh',
    username: 'hanhntm',
    password: 'Password@456',
    phone: '0988 123 456',
    email: 'hanh.nguyen@company.vn',
    role: 'Kế toán trưởng',
    department: 'Phòng Kế toán',
    subDepartment: 'Tài chính nội bộ',
    gender: 'Nữ',
    status: 'Đang làm việc',
    createdAt: '15/03/2023',
    updatedAt: '20/01/2025',
    avatarUrl: 'https://ui-avatars.com/api/?name=Nguy%E1%BB%85n%20Th%E1%BB%8B%20Minh%20H%E1%BA%A1nh&background=1d4ed8&color=fff',
    dob: '24/09/1988',
    maritalStatus: 'Đã kết hôn',
    nationality: 'Việt Nam',
    ethnicity: 'Kinh',
    religion: 'Không',
    hometown: 'Nam Định',
    rank: 3,
    startDate: '15/03/2023',
    officialDate: '15/05/2023',
    resignationDate: '',
    resignationReason: '',
    idCardNumber: '027188009988',
    idCardDate: '15/04/2020',
    idCardPlace: 'Cục Cảnh sát QLHC về TTXH',
    permanentAddress: 'Trần Phú, TP Nam Định',
    currentAddress: 'Chung cư Skylight, Minh Khai, Hà Nội',
    personalEmail: 'hanh.nguyen88@gmail.com',
    emergencyContactName: 'Nguyễn Văn Nam',
    emergencyContactPhone: '0987 654 321',
    emergencyContactRelation: 'Chồng',
    educationLevel: 'Thạc sĩ',
    major: 'Kế toán - Kiểm toán',
    school: 'Đại học Kinh tế Quốc dân',
    bankAccount: '0011004567890',
    bankAccountHolder: 'NGUYEN THI MINH HANH',
    bankName: 'Vietcombank',
    bankBranch: 'Sở Giao Dịch',
    socialInsuranceNumber: '0112345678',
    healthInsuranceNumber: 'DN40112345678',
    taxCode: '8129384756',
    isActiveAccount: 'Hoạt động'
  },
  {
    code: 'emp-003',
    name: 'Trần Hoàng Nam',
    username: 'namth',
    password: 'Password@789',
    phone: '0915 789 012',
    email: 'nam.tran@company.vn',
    role: 'Trưởng phòng Kinh doanh',
    department: 'Phòng Kinh doanh',
    subDepartment: 'Bán hàng Doanh nghiệp',
    gender: 'Nam',
    status: 'Đang làm việc',
    createdAt: '10/06/2022',
    updatedAt: '10/01/2025',
    avatarUrl: 'https://ui-avatars.com/api/?name=Tr%E1%BA%A7n%20Ho%C3%A0ng%20Nam&background=1d4ed8&color=fff',
    dob: '05/11/1990',
    maritalStatus: 'Độc thân',
    nationality: 'Việt Nam',
    ethnicity: 'Kinh',
    religion: 'Không',
    hometown: 'Thái Bình',
    rank: 3,
    startDate: '10/06/2022',
    officialDate: '10/08/2022',
    resignationDate: '',
    resignationReason: '',
    idCardNumber: '031090001234',
    idCardDate: '20/08/2021',
    idCardPlace: 'Cục Cảnh sát QLHC về TTXH',
    permanentAddress: 'Lý Thường Kiệt, TP Thái Bình',
    currentAddress: 'Vinhomes Smart City, Nam Từ Liêm, Hà Nội',
    personalEmail: 'nam.tran90@gmail.com',
    emergencyContactName: 'Trần Hoàng Long',
    emergencyContactPhone: '0912 999 888',
    emergencyContactRelation: 'Anh trai',
    educationLevel: 'Đại học',
    major: 'Quản trị Kinh doanh',
    school: 'Đại học Ngoại Thương',
    bankAccount: '102867543210',
    bankAccountHolder: 'TRAN HOANG NAM',
    bankName: 'MB Bank',
    bankBranch: 'Chi nhánh Ba Đình',
    socialInsuranceNumber: '0123456789',
    healthInsuranceNumber: 'DN40123456789',
    taxCode: '8574639201',
    isActiveAccount: 'Hoạt động'
  },
  {
    code: 'emp-004',
    name: 'Lê Thu Trang',
    username: 'tranglt',
    password: 'Password@321',
    phone: '0943 567 890',
    email: 'trang.le@company.vn',
    role: 'Chuyên viên Nhân sự',
    department: 'Phòng Hành chính Nhân sự',
    subDepartment: 'Tuyển dụng & Đào tạo',
    gender: 'Nữ',
    status: 'Đang làm việc',
    createdAt: '01/08/2024',
    updatedAt: '12/01/2025',
    avatarUrl: 'https://ui-avatars.com/api/?name=L%C3%AA%20Thu%20Trang&background=1d4ed8&color=fff',
    dob: '18/02/1996',
    maritalStatus: 'Độc thân',
    nationality: 'Việt Nam',
    ethnicity: 'Kinh',
    religion: 'Không',
    hometown: 'Hà Nội',
    rank: 1,
    startDate: '01/08/2024',
    officialDate: '01/10/2024',
    resignationDate: '',
    resignationReason: '',
    idCardNumber: '034196005544',
    idCardDate: '12/12/2020',
    idCardPlace: 'Cục Cảnh sát QLHC về TTXH',
    permanentAddress: 'Ngõ 20, Mỹ Đình 2, Nam Từ Liêm, Hà Nội',
    currentAddress: 'Ngõ 20, Mỹ Đình 2, Nam Từ Liêm, Hà Nội',
    personalEmail: 'trang.le96@gmail.com',
    emergencyContactName: 'Lê Văn An',
    emergencyContactPhone: '0944 332 211',
    emergencyContactRelation: 'Bố',
    educationLevel: 'Đại học',
    major: 'Quản trị Nhân lực',
    school: 'Đại học Thương Mại',
    bankAccount: '123456789098',
    bankAccountHolder: 'LE THU TRANG',
    bankName: 'VPBank',
    bankBranch: 'Chi nhánh Hà Nội',
    socialInsuranceNumber: '0134567890',
    healthInsuranceNumber: 'DN40134567890',
    taxCode: '8910293847',
    isActiveAccount: 'Hoạt động'
  },
  {
    code: 'emp-005',
    name: 'Hoàng Quốc Việt',
    username: 'viethq',
    password: 'Password@654',
    phone: '0962 334 455',
    email: 'viet.hoang@company.vn',
    role: 'Kỹ sư Phần mềm Senior',
    department: 'Phòng Kỹ thuật',
    subDepartment: 'Frontend Team',
    gender: 'Nam',
    status: 'Đang làm việc',
    createdAt: '15/02/2023',
    updatedAt: '18/01/2025',
    avatarUrl: 'https://ui-avatars.com/api/?name=Ho%C3%A0ng%20Qu%E1%BB%91c%20Vi%E1%BB%87t&background=1d4ed8&color=fff',
    dob: '30/07/1994',
    maritalStatus: 'Độc thân',
    nationality: 'Việt Nam',
    ethnicity: 'Kinh',
    religion: 'Không',
    hometown: 'Bắc Ninh',
    rank: 2,
    startDate: '15/02/2023',
    officialDate: '15/04/2023',
    resignationDate: '',
    resignationReason: '',
    idCardNumber: '036094007788',
    idCardDate: '25/03/2021',
    idCardPlace: 'Cục Cảnh sát QLHC về TTXH',
    permanentAddress: 'Kinh Dương Vương, TP Bắc Ninh',
    currentAddress: 'Chung cư Season Avenue, Hà Đông, Hà Nội',
    personalEmail: 'viet.hoang94@gmail.com',
    emergencyContactName: 'Hoàng Quốc Bình',
    emergencyContactPhone: '0963 888 777',
    emergencyContactRelation: 'Bố',
    educationLevel: 'Đại học',
    major: 'Công nghệ Thông tin',
    school: 'Đại học Bách Khoa Hà Nội',
    bankAccount: '1098273645',
    bankAccountHolder: 'HOANG QUOC VIET',
    bankName: 'VietinBank',
    bankBranch: 'Chi nhánh Tây Hà Nội',
    socialInsuranceNumber: '0145678901',
    healthInsuranceNumber: 'DN40145678901',
    taxCode: '8291039485',
    isActiveAccount: 'Hoạt động'
  },
  {
    code: 'emp-006',
    name: 'Phạm Hồng Nhung',
    username: 'nhungph',
    password: 'Password@987',
    phone: '0971 889 900',
    email: 'nhung.pham@company.vn',
    role: 'Chuyên viên Marketing',
    department: 'Phòng Kinh doanh',
    subDepartment: 'Digital Marketing',
    gender: 'Nữ',
    status: 'Thử việc',
    createdAt: '01/09/2026',
    updatedAt: '15/09/2026',
    avatarUrl: 'https://ui-avatars.com/api/?name=Ph%E1%BA%A1m%20H%E1%BB%93ng%20Nhung&background=1d4ed8&color=fff',
    dob: '14/12/1998',
    maritalStatus: 'Độc thân',
    nationality: 'Việt Nam',
    ethnicity: 'Kinh',
    religion: 'Không',
    hometown: 'Hưng Yên',
    rank: 1,
    startDate: '01/09/2026',
    officialDate: '01/11/2026',
    resignationDate: '',
    resignationReason: '',
    idCardNumber: '022198003322',
    idCardDate: '05/09/2022',
    idCardPlace: 'Cục Cảnh sát QLHC về TTXH',
    permanentAddress: 'Phố Nối, Mỹ Hào, Hưng Yên',
    currentAddress: 'Chùa Láng, Đống Đa, Hà Nội',
    personalEmail: 'nhung.pham98@gmail.com',
    emergencyContactName: 'Phạm Hồng Thái',
    emergencyContactPhone: '0972 555 444',
    emergencyContactRelation: 'Bố',
    educationLevel: 'Cử nhân',
    major: 'Marketing Quốc tế',
    school: 'Đại học Hà Nội',
    bankAccount: '098712345678',
    bankAccountHolder: 'PHAM HONG NHUNG',
    bankName: 'Techcombank',
    bankBranch: 'Chi nhánh Đống Đa',
    socialInsuranceNumber: '0156789012',
    healthInsuranceNumber: 'DN40156789012',
    taxCode: '8765432109',
    isActiveAccount: 'Hoạt động'
  },
  {
    code: 'emp-007',
    name: 'Đặng Tuấn Anh',
    username: 'anhdt',
    password: 'Password@2026',
    phone: '0936 112 244',
    email: 'anh.dang@company.vn',
    role: 'Trưởng phòng Kỹ thuật',
    department: 'Phòng Kỹ thuật',
    subDepartment: 'R&D',
    gender: 'Nam',
    status: 'Đang làm việc',
    createdAt: '01/01/2022',
    updatedAt: '10/01/2025',
    avatarUrl: 'https://ui-avatars.com/api/?name=%C4%90%E1%BA%B7ng%20Tu%E1%BA%A5n%20Anh&background=1d4ed8&color=fff',
    dob: '08/08/1987',
    maritalStatus: 'Đã kết hôn',
    nationality: 'Việt Nam',
    ethnicity: 'Kinh',
    religion: 'Không',
    hometown: 'Hà Nội',
    rank: 4,
    startDate: '01/01/2022',
    officialDate: '01/03/2022',
    resignationDate: '',
    resignationReason: '',
    idCardNumber: '042087001122',
    idCardDate: '10/10/2019',
    idCardPlace: 'Cục Cảnh sát QLHC về TTXH',
    permanentAddress: 'Khu Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội',
    currentAddress: 'Khu đô thị Ngoại Giao Đoàn, Bắc Từ Liêm, Hà Nội',
    personalEmail: 'anh.dang87@gmail.com',
    emergencyContactName: 'Nguyễn Thu Trang',
    emergencyContactPhone: '0938 777 666',
    emergencyContactRelation: 'Vợ',
    educationLevel: 'Thạc sĩ',
    major: 'Khoa học Máy tính',
    school: 'Đại học Bách Khoa Hà Nội',
    bankAccount: '112233445566',
    bankAccountHolder: 'DANG TUAN ANH',
    bankName: 'Vietcombank',
    bankBranch: 'Chi nhánh Thăng Long',
    socialInsuranceNumber: '0167890123',
    healthInsuranceNumber: 'DN40167890123',
    taxCode: '8192837465',
    isActiveAccount: 'Hoạt động'
  },
  {
    code: 'emp-008',
    name: 'Vũ Hải Đăng',
    username: 'dangvh',
    password: 'Password@2024',
    phone: '0902 334 556',
    email: 'dang.vu@company.vn',
    role: 'Nhân viên kinh doanh',
    department: 'Phòng Kinh doanh',
    subDepartment: 'Bán lẻ',
    gender: 'Nam',
    status: 'Đã nghỉ việc',
    createdAt: '15/05/2023',
    updatedAt: '30/08/2026',
    avatarUrl: 'https://ui-avatars.com/api/?name=V%C5%A9%20H%E1%BA%A3i%20%C4%90%C4%83ng&background=1d4ed8&color=fff',
    dob: '19/04/1997',
    maritalStatus: 'Độc thân',
    nationality: 'Việt Nam',
    ethnicity: 'Kinh',
    religion: 'Không',
    hometown: 'Quảng Ninh',
    rank: 1,
    startDate: '15/05/2023',
    officialDate: '15/07/2023',
    resignationDate: '30/08/2026',
    resignationReason: 'Chuyển định cư sang nước ngoài',
    idCardNumber: '033197004455',
    idCardDate: '22/01/2021',
    idCardPlace: 'Cục Cảnh sát QLHC về TTXH',
    permanentAddress: 'Lê Thánh Tông, TP Hạ Long, Quảng Ninh',
    currentAddress: 'Times City, Hai Bà Trưng, Hà Nội',
    personalEmail: 'dang.vu97@gmail.com',
    emergencyContactName: 'Vũ Văn Hùng',
    emergencyContactPhone: '0903 444 333',
    emergencyContactRelation: 'Bố',
    educationLevel: 'Đại học',
    major: 'Kinh tế Đối ngoại',
    school: 'Đại học Ngoại Thương',
    bankAccount: '190283746592',
    bankAccountHolder: 'VU HAI DANG',
    bankName: 'Techcombank',
    bankBranch: 'Chi nhánh Hai Bà Trưng',
    socialInsuranceNumber: '0178901234',
    healthInsuranceNumber: 'DN40178901234',
    taxCode: '8675493021',
    isActiveAccount: 'Đã khoá'
  },
  {
    code: 'emp-009',
    name: 'Nguyễn Văn Hoàng',
    username: 'hoangnv',
    password: 'Password@2026!',
    phone: '0909 112 334',
    email: 'hoang.nguyen@company.vn',
    role: 'Chuyên viên Phân tích Dữ liệu',
    department: 'Phòng Kỹ thuật',
    subDepartment: 'Data & AI',
    gender: 'Nam',
    status: 'Đang làm việc',
    createdAt: '23/09/2026',
    updatedAt: '23/09/2026',
    avatarUrl: 'https://ui-avatars.com/api/?name=Nguy%E1%BB%85n%20V%C4%83n%20Ho%C3%A0ng&background=1d4ed8&color=fff',
    dob: '11/11/1995',
    maritalStatus: 'Độc thân',
    nationality: 'Việt Nam',
    ethnicity: 'Kinh',
    religion: 'Không',
    hometown: 'Thanh Hóa',
    rank: 1,
    startDate: '23/09/2026',
    officialDate: '23/11/2026',
    resignationDate: '',
    resignationReason: '',
    idCardNumber: '038095001122',
    idCardDate: '10/10/2021',
    idCardPlace: 'Cục Cảnh sát QLHC về TTXH',
    permanentAddress: 'Quang Trung, TP Thanh Hóa',
    currentAddress: 'Mễ Trì, Nam Từ Liêm, Hà Nội',
    personalEmail: 'hoang.nguyen95@gmail.com',
    emergencyContactName: 'Nguyễn Văn Minh',
    emergencyContactPhone: '0908 223 344',
    emergencyContactRelation: 'Bố',
    educationLevel: 'Đại học',
    major: 'Khoa học Dữ liệu',
    school: 'Đại học Công nghệ - ĐHQGHN',
    bankAccount: '102938475610',
    bankAccountHolder: 'NGUYEN VAN HOANG',
    bankName: 'Vietcombank',
    bankBranch: 'Chi nhánh Nam Hà Nội',
    socialInsuranceNumber: '0189012345',
    healthInsuranceNumber: 'DN40189012345',
    taxCode: '8493021928',
    isActiveAccount: 'Hoạt động'
  }
];

function employeeTo47Row(e) {
  return [
    e.name || '',
    e.username || '',
    e.password || '123456',
    e.phone || '',
    e.role || '',
    e.department || '',
    e.subDepartment || '',
    e.email || '',
    e.gender || 'Nam',
    e.status || 'Đang làm việc',
    e.createdAt || '',
    e.updatedAt || '',
    e.code || '',
    e.avatarUrl || '',
    e.dob || '',
    e.maritalStatus || 'Độc thân',
    e.nationality || 'Việt Nam',
    e.ethnicity || 'Kinh',
    e.religion || 'Không',
    e.hometown || '',
    e.role || '',
    e.department || '',
    e.rank || 1,
    e.startDate || '',
    e.officialDate || '',
    e.resignationDate || '',
    e.resignationReason || '',
    e.idCardNumber || '',
    e.idCardDate || '',
    e.idCardPlace || '',
    e.permanentAddress || '',
    e.currentAddress || '',
    e.personalEmail || '',
    e.emergencyContactName || '',
    e.emergencyContactPhone || '',
    e.emergencyContactRelation || '',
    e.educationLevel || 'Đại học',
    e.major || '',
    e.school || '',
    e.bankAccount || '',
    e.bankAccountHolder || (e.name ? e.name.toUpperCase() : ''),
    e.bankName || '',
    e.bankBranch || '',
    e.socialInsuranceNumber || '',
    e.healthInsuranceNumber || '',
    e.taxCode || '',
    e.isActiveAccount || 'Hoạt động'
  ];
}

async function syncAll() {
  const creds = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  console.log('Authenticating with Google Sheets...');
  const token = await getAccessToken(creds);

  // 1. Ensure sheets exist: "DeXuatChiPhi", "TaiChinh", "TrangChu", "NhanVien", "HeThong"
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meta = await metaRes.json();
  const existingSheets = (meta.sheets || []).map(s => s.properties.title);
  console.log('Existing sheets:', existingSheets);

  const sheetsToCreate = ['DeXuatChiPhi', 'TaiChinh', 'TrangChu', 'NhanVien', 'HeThong'].filter(name => !existingSheets.includes(name));
  
  if (sheetsToCreate.length > 0) {
    console.log('Creating sheets:', sheetsToCreate);
    const requests = sheetsToCreate.map(name => ({
      addSheet: { properties: { title: name } }
    }));
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests })
    });
  }

  // 2. Populate "DeXuatChiPhi" (15 columns, 9 rows)
  const proposalsHeaders = [
    'Mã đề xuất', 'Tiêu đề', 'Ngày đề xuất', 'Hạn thanh toán', 'Người đề xuất',
    'Phòng ban', 'Tài khoản', 'Đối tượng thụ hưởng', 'Tổng tiền (VND)',
    'Vượt kế hoạch', 'Lý do vượt', 'Trạng thái duyệt', 'Trạng thái', 'Lý do đề xuất', 'Chi tiết các dòng chi phí (JSON)'
  ];
  const proposalsRows = COST_PROPOSALS.map(p => [
    p.code, p.title, p.proposalDate, p.dueDate, p.proposer,
    p.department, p.account, p.beneficiary || '', p.amount,
    p.isOverBudget, p.overBudgetReason || '', p.approvalStatus, p.status, p.reason, p.lineItems
  ]);

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DeXuatChiPhi!A1:O1000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DeXuatChiPhi!A1:O${proposalsRows.length + 1}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [proposalsHeaders, ...proposalsRows] })
  });
  console.log(`✓ Synced "DeXuatChiPhi" tab with ${proposalsRows.length} records (15 columns).`);

  // 3. Populate "TaiChinh" (5 columns, 10 rows)
  const financeHeaders = ['Nhóm phân hệ', 'Mã', 'Tiêu đề chức năng', 'Mô tả chi tiết', 'Đường dẫn liên kết'];
  const financeRows = FINANCE_MODULES.map(f => [f.group, f.code, f.title, f.desc, f.href]);

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/TaiChinh!A1:E1000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/TaiChinh!A1:E${financeRows.length + 1}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [financeHeaders, ...financeRows] })
  });
  console.log(`✓ Synced "TaiChinh" tab with ${financeRows.length} records (5 columns).`);

  // 4. Populate "TrangChu" (4 columns, 5 rows)
  const dashHeaders = ['Mã phân hệ', 'Tiêu đề', 'Mô tả tổng quan', 'Đường dẫn liên kết'];
  const dashRows = DASHBOARD_MODULES.map(d => [d.code, d.title, d.desc, d.href]);

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/TrangChu!A1:D1000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/TrangChu!A1:D${dashRows.length + 1}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [dashHeaders, ...dashRows] })
  });
  console.log(`✓ Synced "TrangChu" tab with ${dashRows.length} records (4 columns).`);

  // 5. Populate "HeThong" (6 columns, 7 rows)
  const systemHeaders = ['Nhóm phân hệ', 'Mã', 'Tiêu đề chức năng', 'Mô tả chi tiết', 'Đường dẫn liên kết', 'Đường dẫn hướng dẫn'];
  const systemRows = SYSTEM_MODULES.map(s => [s.group, s.code, s.title, s.desc, s.href, s.guideHref || '']);

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/HeThong!A1:F1000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/HeThong!A1:F${systemRows.length + 1}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [systemHeaders, ...systemRows] })
  });
  console.log(`✓ Synced "HeThong" tab with ${systemRows.length} records (6 columns).`);

  // 6. Populate "NhanVien" (47 columns, 9 rows)
  const empRows = EMPLOYEES_RAW.map(e => employeeTo47Row(e));

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NhanVien!A1:AZ1000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NhanVien!A1:AU${empRows.length + 1}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [EMPLOYEE_HEADERS_47, ...empRows] })
  });
  console.log(`✓ Synced "NhanVien" tab with ${empRows.length} records (47 columns including Mật khẩu).`);

  // Also update local mock data cache files
  const mockCostProposalsUi = [...COST_PROPOSALS].sort((a, b) => b.code.localeCompare(a.code)).map((p, idx) => ({
    ...p,
    id: String(COST_PROPOSALS.length - idx),
    isOverBudget: p.isOverBudget === 'Có',
    approvalStatus: p.approvalStatus === 'Đã duyệt' ? 'approved' : p.approvalStatus === 'Từ chối' ? 'rejected' : 'pending',
    status: p.status === 'Đã duyệt' ? 'approved' : 'draft',
    updatedAt: p.proposalDate,
    lineItems: typeof p.lineItems === 'string' ? JSON.parse(p.lineItems) : p.lineItems
  }));
  fs.writeFileSync('src/data/cost-proposals.ts', `import { CostProposal } from '../types/cost-proposal';\n\nexport const MOCK_COST_PROPOSALS: CostProposal[] = ${JSON.stringify(mockCostProposalsUi, null, 2)};\n`, 'utf8');

  const mockEmployeesUi = [...EMPLOYEES_RAW].sort((a, b) => b.code.localeCompare(a.code)).map((e, idx) => ({
    ...e,
    id: String(EMPLOYEES_RAW.length - idx),
    status: e.status === 'Đang làm việc' ? 'working' : e.status === 'Thử việc' ? 'probation' : e.status === 'Đã nghỉ việc' ? 'resigned' : 'suspended',
    isActiveAccount: e.isActiveAccount !== 'Đã khoá'
  }));
  fs.writeFileSync('src/data/employees.ts', `import { Employee } from '../types/employee';\n\nexport const MOCK_EMPLOYEES: Employee[] = ${JSON.stringify(mockEmployeesUi, null, 2)};\n`, 'utf8');

  console.log('\n🎉 TOÀN BỘ 5 TAB DỮ LIỆU ĐÃ ĐỒNG BỘ 100% VỚI GOOGLE SHEET!');
}

syncAll().catch(console.error);
