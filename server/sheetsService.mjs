import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SPREADSHEET_ID = '1Cx_84szeCGKoLhCSqumeCzKLCErXg1YStQeI_Lrq4nw';
const SERVICE_ACCOUNT_PATH = path.resolve(process.cwd(), 'service-account.json');

export async function getAccessToken() {
  let serviceAccount;
  if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    } catch (e) {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT JSON environment variable');
    }
  } else if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  } else {
    throw new Error('service-account.json not found and GOOGLE_SERVICE_ACCOUNT env not set');
  }

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

// ---------------------- SMART IN-MEMORY CACHE (TTL 5s) ----------------------
const serverCache = new Map();
const CACHE_TTL_MS = 5000; // 5 seconds cache to protect Google API quota

export function getCachedSheetData(key) {
  const item = serverCache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
    return item.data;
  }
  return null;
}

export function setCachedSheetData(key, data) {
  serverCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateSheetCache(keyPrefix) {
  if (!keyPrefix) {
    serverCache.clear();
  } else {
    for (const k of serverCache.keys()) {
      if (k.startsWith(keyPrefix)) {
        serverCache.delete(k);
      }
    }
  }
}

// ---------------------- COST PROPOSALS (DE XUAT CHI PHI) ----------------------

export const PROPOSALS_HEADERS = [
  'Mã đề xuất',
  'Tiêu đề',
  'Ngày đề xuất',
  'Hạn thanh toán',
  'Người đề xuất',
  'Phòng ban',
  'Tài khoản',
  'Đối tượng thụ hưởng',
  'Tổng tiền (VND)',
  'Vượt kế hoạch',
  'Lý do vượt',
  'Trạng thái duyệt',
  'Trạng thái',
  'Lý do đề xuất',
  'Chi tiết các dòng chi phí (JSON)',
];

export function proposalToRow(p) {
  const approvalText =
    p.approvalStatus === 'approved'
      ? 'Đã duyệt'
      : p.approvalStatus === 'rejected'
      ? 'Từ chối'
      : 'Chờ duyệt';
  const statusText = p.status === 'approved' ? 'Đã duyệt' : 'Nháp';
  const isOverText = p.isOverBudget ? 'Có' : 'Không';
  const lineItemsJson =
    typeof p.lineItems === 'string'
      ? p.lineItems
      : JSON.stringify(p.lineItems || []);

  return [
    p.code,
    p.title,
    p.proposalDate,
    p.dueDate,
    p.proposer,
    p.department,
    p.account,
    p.beneficiary || '',
    p.amount,
    isOverText,
    p.overBudgetReason || '',
    approvalText,
    statusText,
    p.reason || '',
    lineItemsJson,
  ];
}

export async function fetchProposalsFromSheet() {
  const cached = getCachedSheetData('proposals');
  if (cached) return cached;
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DeXuatChiPhi!A2:O`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch sheet data: ${errText}`);
  }

  const data = await res.json();
  const rows = data.values || [];

  const proposals = rows
    .filter((row) => row && row[0])
    .map((row, idx) => {
      let lineItems = [];
      try {
        if (row[14]) {
          lineItems = typeof row[14] === 'string' ? JSON.parse(row[14]) : row[14];
        }
      } catch {
        lineItems = [];
      }

      const rawApproval = (row[11] || '').trim().toLowerCase();
      let approvalStatus = 'pending';
      if (rawApproval.includes('đã duyệt') || rawApproval === 'approved') {
        approvalStatus = 'approved';
      } else if (rawApproval.includes('từ chối') || rawApproval === 'rejected') {
        approvalStatus = 'rejected';
      }

      return {
        id: String(idx + 1),
        code: row[0] || `DX-${idx + 1}`,
        title: row[1] || '',
        proposalDate: row[2] || '',
        dueDate: row[3] || '',
        proposer: row[4] || 'Lê Minh Công',
        department: row[5] || 'Ban Giám Đốc',
        account: row[6] || 'Vietcombank - Tài khoản chính',
        beneficiary: row[7] || '',
        amount: Number(row[8]) || 0,
        isOverBudget: row[9] === 'Có' || row[9] === true,
        overBudgetReason: row[10] || '',
        approvalStatus,
        status: row[12] === 'Đã duyệt' || row[12] === 'approved' ? 'approved' : 'draft',
        reason: row[13] || '',
        updatedAt: row[2] || '',
        lineItems,
      };
    });

  proposals.sort((a, b) => b.code.localeCompare(a.code));
  setCachedSheetData('proposals', proposals);
  return proposals;
}

export async function saveAllProposalsToSheet(proposals) {
  const token = await getAccessToken();
  const sortedForSheet = [...proposals].sort((a, b) => a.code.localeCompare(b.code));
  const proposalsRows = sortedForSheet.map((p) => proposalToRow(p));

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DeXuatChiPhi!A1:O1000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DeXuatChiPhi!A1:O${
      proposalsRows.length + 1
    }?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [PROPOSALS_HEADERS, ...proposalsRows],
      }),
    }
  );

  if (!writeRes.ok) {
    const err = await writeRes.text();
    throw new Error(`Write failed: ${err}`);
  }

  invalidateSheetCache('proposals');
  return { success: true, count: proposals.length };
}

export async function appendProposalToSheet(proposal) {
  const token = await getAccessToken();
  const row = proposalToRow(proposal);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DeXuatChiPhi!A:O:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Append failed: ${err}`);
  }

  invalidateSheetCache('proposals');
  return { success: true };
}

export async function updateProposalInSheet(proposal) {
  const token = await getAccessToken();
  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DeXuatChiPhi!A1:A`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await dataRes.json();
  const rows = data.values || [];

  let rowIndex = -1;
  rows.forEach((r, idx) => {
    if (idx === 0) return;
    if (r[0] === proposal.code) {
      rowIndex = idx + 1; // 1-based row number
    }
  });

  const rowData = proposalToRow(proposal);

  if (rowIndex > 0) {
    const putRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DeXuatChiPhi!A${rowIndex}:O${rowIndex}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [rowData] }),
      }
    );
    if (!putRes.ok) {
      const err = await putRes.text();
      throw new Error(`Update proposal failed: ${err}`);
    }
  } else {
    await appendProposalToSheet(proposal);
  }

  invalidateSheetCache('proposals');
  return { success: true };
}

export async function deleteProposalsFromSheet(codes) {
  const codeList = Array.isArray(codes) ? codes : [codes];
  if (codeList.length === 0) return { success: true, count: 0 };

  const token = await getAccessToken();
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meta = await metaRes.json();
  const deXuatSheet = (meta.sheets || []).find((s) => s.properties.title === 'DeXuatChiPhi');
  if (!deXuatSheet) throw new Error('Sheet DeXuatChiPhi not found');
  const sheetId = deXuatSheet.properties.sheetId;

  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DeXuatChiPhi!A1:A`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await dataRes.json();
  const rows = data.values || [];

  const indicesToDelete = [];
  rows.forEach((r, idx) => {
    if (idx === 0) return; // skip header
    const code = r[0];
    if (code && codeList.includes(code)) {
      indicesToDelete.push(idx); // 0-based index
    }
  });

  if (indicesToDelete.length === 0) {
    return { success: true, count: 0 };
  }

  // Sort descending so deletion doesn't shift earlier indices
  indicesToDelete.sort((a, b) => b - a);

  const requests = indicesToDelete.map((rowIdx) => ({
    deleteDimension: {
      range: {
        sheetId,
        dimension: 'ROWS',
        startIndex: rowIdx,
        endIndex: rowIdx + 1,
      },
    },
  }));

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    }
  );

  if (!batchRes.ok) {
    const err = await batchRes.text();
    throw new Error(`Delete proposals failed: ${err}`);
  }

  invalidateSheetCache('proposals');
  return { success: true, count: indicesToDelete.length };
}

// ---------------------- EMPLOYEES (NHAN VIEN - 52 COLUMNS) ----------------------

export const EMPLOYEE_HEADERS_52 = [
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
  'Tài khoản hoạt động',
  'Danh sách ngân hàng (JSON)',
  'Sở thích',
  'Không thích',
  'Mạng xã hội',
  'Ghi chú',
];

export const EMPLOYEE_HEADERS_47 = EMPLOYEE_HEADERS_52;
export const EMPLOYEE_HEADERS = EMPLOYEE_HEADERS_52;

export function employeeTo47Row(e) {
  const statusText =
    e.status === 'working'
      ? 'Đang làm việc'
      : e.status === 'probation'
      ? 'Thử việc'
      : e.status === 'resigned'
      ? 'Đã nghỉ việc'
      : 'Tạm hoãn';

  const isActiveText =
    e.isActiveAccount !== false && e.status !== 'resigned'
      ? 'Hoạt động'
      : 'Đã khoá';

  let bankAccountsList = e.bankAccounts;
  if (!Array.isArray(bankAccountsList) || bankAccountsList.length === 0) {
    if (e.bankAccount || e.bankName) {
      bankAccountsList = [
        {
          id: 'ba_1',
          bankName: e.bankName || '',
          accountNumber: e.bankAccount || '',
          accountHolder: e.bankAccountHolder || (e.name ? e.name.toUpperCase() : ''),
          branch: e.bankBranch || '',
          isPrimary: true,
        },
      ];
    } else {
      bankAccountsList = [];
    }
  }

  const primaryBank =
    bankAccountsList.find((b) => b.isPrimary) || bankAccountsList[0] || {};
  const bankAccount = primaryBank.accountNumber || e.bankAccount || '';
  const bankAccountHolder =
    primaryBank.accountHolder || e.bankAccountHolder || (e.name ? e.name.toUpperCase() : '');
  const bankName = primaryBank.bankName || e.bankName || '';
  const bankBranch = primaryBank.branch || e.bankBranch || '';

  const bankAccountsJson = bankAccountsList.length > 0 ? JSON.stringify(bankAccountsList) : '';
  const hobbies = e.hobbies || '';
  const dislikes = e.dislikes || '';
  const socialMedia = typeof e.socialMedia === 'string' ? e.socialMedia : JSON.stringify(e.socialMedia || '');
  const notes = e.notes || '';

  return [
    e.name || '',
    e.username || '',
    e.password || '',
    e.phone || '',
    e.role || '',
    e.department || '',
    e.subDepartment || '',
    e.email || '',
    e.gender || '',
    statusText,
    e.createdAt || '',
    e.updatedAt || '',
    e.code || '',
    e.avatarUrl || '',
    e.dob || '',
    e.maritalStatus || '',
    e.nationality || '',
    e.ethnicity || '',
    e.religion || '',
    e.hometown || '',
    e.role || '',
    e.department || '',
    e.rank || '',
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
    e.educationLevel || '',
    e.major || '',
    e.school || '',
    bankAccount,
    bankAccountHolder,
    bankName,
    bankBranch,
    e.socialInsuranceNumber || '',
    e.healthInsuranceNumber || '',
    e.taxCode || '',
    isActiveText,
    bankAccountsJson,
    hobbies,
    dislikes,
    socialMedia,
    notes,
  ];
}

export const employeeToRow = employeeTo47Row;

export function rowToEmployee(r, idx) {
  let bankAccounts = [];
  if (r[47]) {
    try {
      bankAccounts = typeof r[47] === 'string' ? JSON.parse(r[47]) : r[47];
    } catch {
      bankAccounts = [];
    }
  }

  let status = 'working';
  const rawStatus = (r[9] || '').toLowerCase();
  if (rawStatus.includes('thử việc') || rawStatus === 'probation') status = 'probation';
  else if (rawStatus.includes('nghỉ việc') || rawStatus === 'resigned') status = 'resigned';
  else if (rawStatus.includes('tạm hoãn') || rawStatus === 'suspended') status = 'suspended';

  const name = (r[0] || '').trim();
  const code = (r[12] || '').trim() || `emp-${String(idx + 1).padStart(3, '0')}`;
  const bankAccount = (r[39] || '').trim();
  const bankAccountHolder = (r[40] || '').trim() || (name ? name.toUpperCase() : '');
  const bankName = (r[41] || '').trim();
  const bankBranch = (r[42] || '').trim();

  if ((!bankAccounts || bankAccounts.length === 0) && (bankAccount || bankName)) {
    bankAccounts = [
      {
        id: 'ba_1',
        bankName,
        accountNumber: bankAccount,
        accountHolder: bankAccountHolder,
        branch: bankBranch,
        isPrimary: true,
      },
    ];
  }

  const rawGender = (r[8] || '').trim();
  let gender = '';
  if (rawGender.toLowerCase() === 'nữ' || rawGender.toLowerCase() === 'female') {
    gender = 'Nữ';
  } else if (rawGender.toLowerCase() === 'nam' || rawGender.toLowerCase() === 'male') {
    gender = 'Nam';
  } else if (rawGender) {
    gender = rawGender;
  }

  return {
    id: String(idx + 1),
    code,
    name,
    username: (r[1] || '').trim(),
    password: (r[2] || '').trim(),
    phone: (r[3] || '').trim(),
    role: (r[4] || '').trim(),
    department: (r[5] || '').trim(),
    subDepartment: (r[6] || '').trim(),
    email: (r[7] || '').trim(),
    gender,
    status,
    createdAt: (r[10] || '').trim(),
    updatedAt: (r[11] || '').trim(),
    avatarUrl: (r[13] || '').trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=1d4ed8&color=fff`,
    dob: (r[14] || '').trim(),
    maritalStatus: (r[15] || '').trim(),
    nationality: (r[16] || '').trim(),
    ethnicity: (r[17] || '').trim(),
    religion: (r[18] || '').trim(),
    hometown: (r[19] || '').trim(),
    rank: r[22] ? (Number(r[22]) || r[22]) : '',
    startDate: (r[23] || '').trim(),
    officialDate: (r[24] || '').trim(),
    resignationDate: (r[25] || '').trim(),
    resignationReason: (r[26] || '').trim(),
    idCardNumber: (r[27] || '').trim(),
    idCardDate: (r[28] || '').trim(),
    idCardPlace: (r[29] || '').trim(),
    permanentAddress: (r[30] || '').trim(),
    currentAddress: (r[31] || '').trim(),
    personalEmail: (r[32] || '').trim(),
    emergencyContactName: (r[33] || '').trim(),
    emergencyContactPhone: (r[34] || '').trim(),
    emergencyContactRelation: (r[35] || '').trim(),
    educationLevel: (r[36] || '').trim(),
    major: (r[37] || '').trim(),
    school: (r[38] || '').trim(),
    bankAccount,
    bankAccountHolder,
    bankName,
    bankBranch,
    socialInsuranceNumber: (r[43] || '').trim(),
    healthInsuranceNumber: (r[44] || '').trim(),
    taxCode: (r[45] || '').trim(),
    isActiveAccount: !r[46] || !(r[46] || '').toLowerCase().includes('khoá'),
    bankAccounts: Array.isArray(bankAccounts) ? bankAccounts : [],
    hobbies: (r[48] || '').trim(),
    dislikes: (r[49] || '').trim(),
    socialMedia: (r[50] || '').trim(),
    notes: (r[51] || '').trim(),
  };
}

export async function ensureNhanVienTabExists() {
  const token = await getAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const existingSheets = (meta.sheets || []).map((s) => s.properties.title);

  if (!existingSheets.includes('NhanVien')) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: 'NhanVien' } } }],
        }),
      }
    );
  }
}

export async function fetchEmployeesFromSheet() {
  const cached = getCachedSheetData('employees');
  if (cached) return cached;

  await ensureNhanVienTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NhanVien!A2:AZ`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch employees: ${errText}`);
  }

  const data = await res.json();
  const rows = data.values || [];

  const employees = rows
    .filter((r) => r && (r[0] || r[11] || r[12]))
    .map((r, idx) => rowToEmployee(r, idx));

  // Sort descending for UI display
  employees.sort((a, b) => (b.code || '').localeCompare(a.code || ''));
  setCachedSheetData('employees', employees);
  return employees;
}

export async function saveAllEmployeesToSheet(employees) {
  await ensureNhanVienTabExists();
  const token = await getAccessToken();

  const sortedForSheet = [...employees].sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  const rows = sortedForSheet.map((e) => employeeTo47Row(e));

  // Clear existing
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NhanVien!A1:AZ1000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // Write new 52 columns
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NhanVien!A1:AZ${
      rows.length + 1
    }?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [EMPLOYEE_HEADERS, ...rows],
      }),
    }
  );

  if (!writeRes.ok) {
    const err = await writeRes.text();
    throw new Error(`Write failed: ${err}`);
  }

  invalidateSheetCache('employees');
  return { success: true, count: employees.length };
}

export async function appendEmployeeToSheet(employee) {
  await ensureNhanVienTabExists();
  const token = await getAccessToken();
  const row = employeeTo47Row(employee);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NhanVien!A:AZ:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Append employee failed: ${err}`);
  }

  invalidateSheetCache('employees');
  return { success: true };
}

export async function updateEmployeeInSheet(employee) {
  await ensureNhanVienTabExists();
  const token = await getAccessToken();
  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NhanVien!A1:AZ`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await dataRes.json();
  const rows = data.values || [];

  let rowIndex = -1;
  rows.forEach((r, idx) => {
    if (idx === 0) return;
    const code = r[12] || r[11] || '';
    const username = r[1] || '';
    const name = r[0] || '';
    if (
      (employee.code && (code === employee.code || r[0] === employee.code)) ||
      (employee.username && username === employee.username) ||
      (employee.name && name === employee.name)
    ) {
      rowIndex = idx + 1; // 1-based row index
    }
  });

  const rowData = employeeTo47Row(employee);

  if (rowIndex > 0) {
    const putRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NhanVien!A${rowIndex}:AZ${rowIndex}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [rowData] }),
      }
    );
    if (!putRes.ok) {
      const err = await putRes.text();
      throw new Error(`Update employee failed: ${err}`);
    }
  } else {
    await appendEmployeeToSheet(employee);
  }

  invalidateSheetCache('employees');
  return { success: true };
}

export async function deleteEmployeesFromSheet(identifiers) {
  const idList = Array.isArray(identifiers) ? identifiers : [identifiers];
  if (idList.length === 0) return { success: true, count: 0 };

  await ensureNhanVienTabExists();
  const token = await getAccessToken();
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meta = await metaRes.json();
  const nhanVienSheet = (meta.sheets || []).find((s) => s.properties.title === 'NhanVien');
  if (!nhanVienSheet) throw new Error('Sheet NhanVien not found');
  const sheetId = nhanVienSheet.properties.sheetId;

  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NhanVien!A1:AZ`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await dataRes.json();
  const rows = data.values || [];

  const cleanIdList = idList.map((id) => String(id || '').trim().toLowerCase()).filter(Boolean);

  const indicesToDelete = [];
  rows.forEach((r, idx) => {
    if (idx === 0) return; // skip header
    const name = String(r[0] || '').trim().toLowerCase();
    const username = String(r[1] || '').trim().toLowerCase();
    const code = String(r[12] || r[11] || (r[0] && r[0].startsWith('emp-') ? r[0] : '') || '').trim().toLowerCase();

    const isMatch = cleanIdList.some((cleanId) => {
      return (
        (code && cleanId === code) ||
        (username && cleanId === username) ||
        (name && cleanId === name)
      );
    });

    if (isMatch) {
      indicesToDelete.push(idx); // 0-based index
    }
  });

  if (indicesToDelete.length === 0) {
    return { success: true, count: 0 };
  }

  // Sort descending so deleting later rows does not shift index of earlier rows
  indicesToDelete.sort((a, b) => b - a);

  const requests = indicesToDelete.map((rowIdx) => ({
    deleteDimension: {
      range: {
        sheetId,
        dimension: 'ROWS',
        startIndex: rowIdx,
        endIndex: rowIdx + 1,
      },
    },
  }));

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    }
  );

  if (!batchRes.ok) {
    const err = await batchRes.text();
    throw new Error(`Delete employees failed: ${err}`);
  }

  invalidateSheetCache('employees');
  return { success: true, count: indicesToDelete.length };
}

// ---------------------- SYSTEM (HE THONG) ----------------------

export async function ensureHeThongTabExists() {
  const token = await getAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const existingSheets = (meta.sheets || []).map((s) => s.properties.title);

  if (!existingSheets.includes('HeThong')) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: 'HeThong' } } }],
        }),
      }
    );
  }
}

export async function fetchSystemFromSheet() {
  await ensureHeThongTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/HeThong!A2:F`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch system modules: ${errText}`);
  }

  const data = await res.json();
  const rows = data.values || [];

  return rows
    .filter((r) => r && r[0])
    .map((r) => ({
      group: r[0] || '',
      code: r[1] || '',
      title: r[2] || '',
      description: r[3] || '',
      href: r[4] || '',
      guideHref: r[5] || '',
    }));
}

// ---------------------- NOTES (GHI CHU & BAI VIET) ----------------------

export const NOTES_HEADERS = [
  'Mã ghi chú',
  'Tiêu đề',
  'Nội dung',
  'Tóm tắt',
  'Chuyên mục',
  'Thẻ phân loại',
  'Trạng thái',
  'Ghim',
  'Màu sắc',
  'Ngày thực hiện',
  'Giờ',
  'Địa điểm',
  'Tọa độ GPS',
  'Ảnh bìa',
  'Thư viện ảnh (JSON)',
  'Tệp đính kèm (JSON)',
  'Tác giả',
  'Ảnh tác giả',
  'Ngày tạo',
  'Cập nhật',
  'Đối tượng / Nhân viên tham gia (JSON)',
  'Hoạt động (Nhật ký)',
];

export function noteToRow(n) {
  const isPinnedText = n.isPinned ? 'Có' : 'Không';
  const tagsText = Array.isArray(n.tags) ? n.tags.join(', ') : n.tags || '';
  const imagesJson = Array.isArray(n.images) ? JSON.stringify(n.images) : n.images || '';
  const attachmentsJson = Array.isArray(n.attachments) ? JSON.stringify(n.attachments) : n.attachments || '';
  const participantsJson = Array.isArray(n.participants) ? JSON.stringify(n.participants) : n.participants || '';
  const activity = n.activity || '';

  return [
    n.code || n.id || '',
    n.title || '',
    n.content || '',
    n.summary || '',
    n.category || 'Biên bản cuộc họp',
    tagsText,
    n.status || 'published',
    isPinnedText,
    n.color || 'blue',
    n.noteDate || '',
    n.noteTime || '',
    n.location || '',
    n.coordinates || '',
    n.coverUrl || '',
    imagesJson,
    attachmentsJson,
    n.author || 'Lê Minh Công',
    n.authorAvatar || '',
    n.createdAt || '',
    n.updatedAt || '',
    participantsJson,
    activity,
  ];
}

export function rowToNote(r, idx) {
  const code = r[0] || `NOTE-${String(idx + 1).padStart(3, '0')}`;
  const id = code.startsWith('note_') || code.startsWith('note-') ? code : `note-${code}`;

  let tags = [];
  if (r[5]) {
    try {
      if (r[5].startsWith('[')) {
        tags = JSON.parse(r[5]);
      } else {
        tags = r[5].split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
      }
    } catch {
      tags = r[5].split(',').map((t) => t.trim()).filter(Boolean);
    }
  }

  let images = [];
  if (r[14]) {
    try {
      images = JSON.parse(r[14]);
    } catch {
      images = [r[14]];
    }
  }

  let attachments = [];
  if (r[15]) {
    try {
      attachments = JSON.parse(r[15]);
    } catch {
      attachments = [];
    }
  }

  let participants = [];
  if (r[20]) {
    try {
      participants = typeof r[20] === 'string' ? JSON.parse(r[20]) : r[20];
    } catch {
      participants = [];
    }
  }

  const activity = r[21] || undefined;
  const isPinned = r[7] === 'Có' || r[7] === 'true' || r[7] === true || r[7] === '1';

  return {
    id,
    code,
    title: r[1] || 'Ghi chú không tên',
    content: r[2] || '',
    summary: r[3] || undefined,
    category: r[4] || 'Biên bản cuộc họp',
    tags,
    status: r[6] === 'draft' ? 'draft' : r[6] === 'archived' ? 'archived' : 'published',
    isPinned,
    color: r[8] || 'blue',
    noteDate: r[9] || '',
    noteTime: r[10] || '',
    location: r[11] || '',
    coordinates: r[12] || '',
    coverUrl: r[13] || undefined,
    images: Array.isArray(images) ? images : [],
    attachments: Array.isArray(attachments) ? attachments : [],
    author: r[16] || 'Lê Minh Công',
    authorAvatar: r[17] || undefined,
    createdAt: r[18] || '',
    updatedAt: r[19] || '',
    participants: Array.isArray(participants) ? participants : [],
    activity,
  };
}

export async function ensureGhiChuTabExists() {
  const token = await getAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const existingSheets = (meta.sheets || []).map((s) => s.properties.title);

  if (!existingSheets.includes('GhiChu')) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: 'GhiChu' } } }],
        }),
      }
    );

    // Write header
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/GhiChu!A1:V1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [NOTES_HEADERS] }),
      }
    );
  }
}

export function getNoteDateTimeValue(note) {
  const dateStr = (note.noteDate || note.createdAt || note.updatedAt || '').trim();
  let y = 1970, m = 1, d = 1;
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const parts = dateStr.slice(0, 10).split('-');
    y = parseInt(parts[0], 10) || 1970;
    m = parseInt(parts[1], 10) || 1;
    d = parseInt(parts[2], 10) || 1;
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
    const parts = dateStr.split('/');
    d = parseInt(parts[0], 10) || 1;
    m = parseInt(parts[1], 10) || 1;
    y = parseInt(parts[2], 10) || 1970;
  } else if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      y = parsed.getFullYear();
      m = parsed.getMonth() + 1;
      d = parsed.getDate();
    }
  }

  let hour = 0, minute = 0;
  if (note.noteTime && /^\d{1,2}:\d{2}/.test(note.noteTime.trim())) {
    const timeParts = note.noteTime.trim().split(':');
    hour = parseInt(timeParts[0], 10) || 0;
    minute = parseInt(timeParts[1], 10) || 0;
  }

  const dt = new Date(y, m - 1, d, hour, minute, 0, 0);
  return isNaN(dt.getTime()) ? 0 : dt.getTime();
}

export async function fetchNotesFromSheet() {
  const cached = getCachedSheetData('notes');
  if (cached) return cached;

  await ensureGhiChuTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/GhiChu!A2:V`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch sheet data: ${errText}`);
  }

  const data = await res.json();
  const rows = data.values || [];

  const notes = rows
    .filter((r) => r && r[1]) // filter by title
    .map((r, idx) => rowToNote(r, idx));

  // Sort descending by Date & Time (lớn tới nhỏ)
  notes.sort((a, b) => getNoteDateTimeValue(b) - getNoteDateTimeValue(a));
  setCachedSheetData('notes', notes);
  return notes;
}

export async function saveAllNotesToSheet(notes) {
  await ensureGhiChuTabExists();
  const token = await getAccessToken();
  const sortedNotes = [...notes].sort((a, b) => getNoteDateTimeValue(b) - getNoteDateTimeValue(a));
  const rows = sortedNotes.map((n) => noteToRow(n));
  const values = [NOTES_HEADERS, ...rows];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/GhiChu!A1:V${values.length + 50}:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/GhiChu!A1:V${values.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to save notes: ${errText}`);
  }

  invalidateSheetCache('notes');
  return { success: true, count: notes.length };
}

export async function appendNoteToSheet(note) {
  await ensureGhiChuTabExists();
  const token = await getAccessToken();
  const row = noteToRow(note);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/GhiChu!A:V:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to append note: ${errText}`);
  }

  invalidateSheetCache('notes');
  return { success: true };
}

export async function updateNoteInSheet(note) {
  await ensureGhiChuTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/GhiChu!A1:V`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  const rows = data.values || [];

  const targetCode = String(note.code || '').trim().toLowerCase();
  const targetId = String(note.id || '').trim().toLowerCase();
  const cleanTargetCode = targetCode.replace(/[^a-z0-9]/g, '');
  const cleanTargetId = targetId.replace(/[^a-z0-9]/g, '');
  const targetTitle = String(note.title || '').trim().toLowerCase();

  let rowIndex = -1;
  // First pass: match by code or clean alphanumeric code/id
  for (let i = 1; i < rows.length; i++) {
    const rowCode = String(rows[i][0] || '').trim().toLowerCase();
    const cleanRowCode = rowCode.replace(/[^a-z0-9]/g, '');
    if (
      (cleanTargetCode && (rowCode === targetCode || cleanRowCode === cleanTargetCode)) ||
      (cleanTargetId && (rowCode === targetId || cleanRowCode === cleanTargetId))
    ) {
      rowIndex = i + 1;
      break;
    }
  }

  // Second pass: fallback to title match if code match wasn't found
  if (rowIndex === -1 && targetTitle) {
    for (let i = 1; i < rows.length; i++) {
      const rowTitle = String(rows[i][1] || '').trim().toLowerCase();
      if (rowTitle === targetTitle) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  if (rowIndex === -1) {
    return appendNoteToSheet(note);
  }

  const row = noteToRow(note);
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/GhiChu!A${rowIndex}:V${rowIndex}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Failed to update note: ${errText}`);
  }

  invalidateSheetCache('notes');
  return { success: true };
}

export async function deleteNotesFromSheet(identifiers) {
  await ensureGhiChuTabExists();
  const token = await getAccessToken();

  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meta = await metaRes.json();
  const ghiChuSheet = (meta.sheets || []).find((s) => s.properties.title === 'GhiChu');
  if (!ghiChuSheet) throw new Error('Sheet GhiChu not found');
  const sheetId = ghiChuSheet.properties.sheetId;

  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/GhiChu!A1:V`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await dataRes.json();
  const rows = data.values || [];

  const idList = Array.isArray(identifiers) ? identifiers : [identifiers];
  const cleanIdList = idList.map((id) => String(id || '').trim().toLowerCase()).filter(Boolean);

  const indicesToDelete = [];
  rows.forEach((r, idx) => {
    if (idx === 0) return; // skip header
    const code = String(r[0] || '').trim().toLowerCase();
    const title = String(r[1] || '').trim().toLowerCase();

    const isMatch = cleanIdList.some((cleanId) => {
      return (
        (code && cleanId === code) ||
        (title && cleanId === title) ||
        (code && `note-${code}` === cleanId)
      );
    });

    if (isMatch) {
      indicesToDelete.push(idx);
    }
  });

  if (indicesToDelete.length === 0) {
    return { success: true, count: 0 };
  }

  // Sort descending so deleting rows doesn't shift earlier indices
  indicesToDelete.sort((a, b) => b - a);

  const requests = indicesToDelete.map((rowIdx) => ({
    deleteDimension: {
      range: {
        sheetId,
        dimension: 'ROWS',
        startIndex: rowIdx,
        endIndex: rowIdx + 1,
      },
    },
  }));

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    }
  );

  if (!batchRes.ok) {
    const err = await batchRes.text();
    throw new Error(`Delete notes failed: ${err}`);
  }

  invalidateSheetCache('notes');
  return { success: true, count: indicesToDelete.length };
}

// ---------------------- THU CHI (CASH TRANSACTIONS - 28 COLUMNS) ----------------------

export const THUCHI_HEADERS = [
  'Mã phiếu',
  'Loại GD',
  'Tiêu đề',
  'Số tiền (VNĐ)',
  'Bằng chữ',
  'Ngày GD',
  'Giờ GD',
  'Khoản mục',
  'Hạng mục con',
  'Tài khoản nguồn',
  'Tài khoản đích',
  'Phương thức',
  'Loại đối tượng',
  'Tên đối tượng',
  'SĐT đối tượng',
  'Địa chỉ đối tượng',
  'Phòng ban',
  'Mã đề xuất liên kết',
  'Số hóa đơn/HĐ',
  'Lý do',
  'Ghi chú',
  'Đính kèm (JSON)',
  'Trạng thái',
  'Ghim',
  'Người lập',
  'Người duyệt',
  'Ngày tạo',
  'Cập nhật',
];

export function transactionToRow(t) {
  const typeText =
    t.type === 'income' ? 'Thu' : t.type === 'expense' ? 'Chi' : 'Luân chuyển';
  const methodText =
    t.paymentMethod === 'cash'
      ? 'Tiền mặt'
      : t.paymentMethod === 'bank_transfer'
      ? 'Chuyển khoản'
      : t.paymentMethod === 'credit_card'
      ? 'Thẻ tín dụng'
      : 'Ví điện tử';
  const statusText =
    t.status === 'completed'
      ? 'Đã hoàn thành'
      : t.status === 'pending'
      ? 'Chờ duyệt'
      : t.status === 'draft'
      ? 'Bản nháp'
      : 'Đã hủy';
  const counterpartyTypeText =
    t.counterpartyType === 'customer'
      ? 'Khách hàng'
      : t.counterpartyType === 'vendor'
      ? 'Nhà cung cấp'
      : t.counterpartyType === 'employee'
      ? 'Nhân viên'
      : t.counterpartyType === 'partner'
      ? 'Đối tác'
      : 'Khác';

  const attachmentsJson = JSON.stringify(t.attachments || []);

  return [
    t.code || '',
    typeText,
    t.title || '',
    t.amount || 0,
    t.amountInWords || '',
    t.transactionDate || '',
    t.transactionTime || '09:00',
    t.category || '',
    t.subCategory || '',
    t.account || '',
    t.destinationAccount || '',
    methodText,
    counterpartyTypeText,
    t.counterpartyName || '',
    t.counterpartyPhone || '',
    t.counterpartyAddress || '',
    t.department || '',
    t.refProposalCode || '',
    t.invoiceNumber || '',
    t.reason || '',
    t.note || '',
    attachmentsJson,
    statusText,
    t.isPinned ? 'Có' : 'Không',
    t.createdBy || '',
    t.approvedBy || '',
    t.createdAt || '',
    t.updatedAt || '',
  ];
}

export function rowToTransaction(r, idx) {
  let attachments = [];
  if (r[21]) {
    try {
      attachments = typeof r[21] === 'string' ? JSON.parse(r[21]) : r[21];
    } catch {
      attachments = [];
    }
  }

  const rawType = (r[1] || '').trim().toLowerCase();
  let type = 'expense';
  if (rawType.includes('thu') || rawType === 'income') type = 'income';
  else if (rawType.includes('luân') || rawType.includes('chuyển') || rawType === 'transfer') type = 'transfer';
  else if (rawType.includes('chi') || rawType === 'expense') type = 'expense';

  const rawMethod = (r[11] || '').trim().toLowerCase();
  let paymentMethod = 'bank_transfer';
  if (rawMethod.includes('tiền mặt') || rawMethod === 'cash') paymentMethod = 'cash';
  else if (rawMethod.includes('thẻ') || rawMethod === 'credit_card') paymentMethod = 'credit_card';
  else if (rawMethod.includes('ví') || rawMethod === 'e_wallet') paymentMethod = 'e_wallet';

  const rawCPType = (r[12] || '').trim().toLowerCase();
  let counterpartyType = 'customer';
  if (rawCPType.includes('nhà cung cấp') || rawCPType === 'vendor') counterpartyType = 'vendor';
  else if (rawCPType.includes('nhân viên') || rawCPType === 'employee') counterpartyType = 'employee';
  else if (rawCPType.includes('đối tác') || rawCPType === 'partner') counterpartyType = 'partner';
  else if (rawCPType.includes('khác') || rawCPType === 'other') counterpartyType = 'other';

  const rawStatus = (r[22] || '').trim().toLowerCase();
  let status = 'completed';
  if (rawStatus.includes('chờ') || rawStatus === 'pending') status = 'pending';
  else if (rawStatus.includes('nháp') || rawStatus === 'draft') status = 'draft';
  else if (rawStatus.includes('hủy') || rawStatus === 'cancelled') status = 'cancelled';

  const code = r[0] || `GD-${String(idx + 1).padStart(4, '0')}`;

  return {
    id: String(idx + 1),
    code,
    type,
    title: r[2] || '',
    amount: Number(r[3]) || 0,
    amountInWords: r[4] || '',
    transactionDate: r[5] || '',
    transactionTime: r[6] || '09:00',
    category: r[7] || '',
    subCategory: r[8] || '',
    account: r[9] || 'Vietcombank - TK Chính',
    destinationAccount: r[10] || '',
    paymentMethod,
    counterpartyType,
    counterpartyName: r[13] || '',
    counterpartyPhone: r[14] || '',
    counterpartyAddress: r[15] || '',
    department: r[16] || '',
    refProposalCode: r[17] || '',
    invoiceNumber: r[18] || '',
    reason: r[19] || '',
    note: r[20] || '',
    attachments: Array.isArray(attachments) ? attachments : [],
    status,
    isPinned: (r[23] || '').toLowerCase().includes('có') || r[23] === true || r[23] === 'TRUE',
    createdBy: r[24] || 'Lê Minh Công',
    approvedBy: r[25] || '',
    createdAt: r[26] || r[5] || '',
    updatedAt: r[27] || r[5] || '',
  };
}

export async function ensureThuChiTabExists() {
  const token = await getAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const existingSheets = (meta.sheets || []).map((s) => s.properties.title);

  if (!existingSheets.includes('ThuChi')) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: 'ThuChi' } } }],
        }),
      }
    );
  }
}

export async function fetchTransactionsFromSheet() {
  const cached = getCachedSheetData('transactions');
  if (cached) return cached;

  await ensureThuChiTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/ThuChi!A2:AB`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch transactions from sheet: ${errText}`);
  }

  const data = await res.json();
  const rows = data.values || [];

  const transactions = rows
    .filter((r) => r && r[0])
    .map((r, idx) => rowToTransaction(r, idx));

  // Sort descending by date and time
  transactions.sort((a, b) => {
    const dtA = `${a.transactionDate || ''} ${a.transactionTime || ''}`;
    const dtB = `${b.transactionDate || ''} ${b.transactionTime || ''}`;
    return dtB.localeCompare(dtA);
  });

  setCachedSheetData('transactions', transactions);
  return transactions;
}

export async function saveAllTransactionsToSheet(transactions) {
  await ensureThuChiTabExists();
  const token = await getAccessToken();

  const sortedForSheet = [...transactions].sort((a, b) => {
    const dtA = `${a.transactionDate || ''} ${a.transactionTime || ''}`;
    const dtB = `${b.transactionDate || ''} ${b.transactionTime || ''}`;
    return dtB.localeCompare(dtA);
  });
  const rows = sortedForSheet.map((t) => transactionToRow(t));

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/ThuChi!A1:AB1000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/ThuChi!A1:AB${
      rows.length + 1
    }?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [THUCHI_HEADERS, ...rows],
      }),
    }
  );

  if (!writeRes.ok) {
    const err = await writeRes.text();
    throw new Error(`Write failed: ${err}`);
  }

  invalidateSheetCache('transactions');
  return { success: true, count: transactions.length };
}

export async function appendTransactionToSheet(transaction) {
  await ensureThuChiTabExists();
  const token = await getAccessToken();
  const row = transactionToRow(transaction);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/ThuChi!A:AB:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to append transaction: ${errText}`);
  }

  invalidateSheetCache('transactions');
  return { success: true };
}

export async function updateTransactionInSheet(transaction) {
  await ensureThuChiTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/ThuChi!A1:AB`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  const rows = data.values || [];

  const targetCode = String(transaction.code || transaction.id || '').trim().toLowerCase();

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    const rowCode = String(rows[i][0] || '').trim().toLowerCase();
    if (targetCode && rowCode === targetCode) {
      rowIndex = i + 1; // 1-based index
      break;
    }
  }

  if (rowIndex === -1) {
    return appendTransactionToSheet(transaction);
  }

  const row = transactionToRow(transaction);
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/ThuChi!A${rowIndex}:AB${rowIndex}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Failed to update transaction: ${errText}`);
  }

  invalidateSheetCache('transactions');
  return { success: true };
}

export async function deleteTransactionsFromSheet(identifiers) {
  await ensureThuChiTabExists();
  const token = await getAccessToken();

  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meta = await metaRes.json();
  const thuChiSheet = (meta.sheets || []).find((s) => s.properties.title === 'ThuChi');
  if (!thuChiSheet) throw new Error('Sheet ThuChi not found');
  const sheetId = thuChiSheet.properties.sheetId;

  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/ThuChi!A1:A`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await dataRes.json();
  const rows = data.values || [];

  const idList = Array.isArray(identifiers) ? identifiers : [identifiers];
  const cleanIdList = idList.map((id) => String(id || '').trim().toLowerCase()).filter(Boolean);

  const indicesToDelete = [];
  rows.forEach((r, idx) => {
    if (idx === 0) return;
    const code = String(r[0] || '').trim().toLowerCase();
    if (code && cleanIdList.includes(code)) {
      indicesToDelete.push(idx);
    }
  });

  if (indicesToDelete.length === 0) {
    return { success: true, count: 0 };
  }

  indicesToDelete.sort((a, b) => b - a);

  const requests = indicesToDelete.map((rowIdx) => ({
    deleteDimension: {
      range: {
        sheetId,
        dimension: 'ROWS',
        startIndex: rowIdx,
        endIndex: rowIdx + 1,
      },
    },
  }));

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    }
  );

  if (!batchRes.ok) {
    const err = await batchRes.text();
    throw new Error(`Delete transactions failed: ${err}`);
  }

  invalidateSheetCache('transactions');
  return { success: true, count: indicesToDelete.length };
}

// =========================================================================================
// 1. DANH MỤC TÀI CHÍNH (FINANCE CATEGORIES)
// =========================================================================================

export const FINANCE_CATEGORY_HEADERS = [
  'Mã khoản mục',
  'Tên khoản mục',
  'Loại',
  'Nhóm cha',
  'Cấp',
  'Mô tả',
  'Trạng thái',
  'Ghim',
  'Thứ tự',
  'Người tạo',
  'Ngày tạo',
  'Cập nhật',
];

export function financeCategoryToRow(c) {
  const typeText = c.type === 'income' ? 'Thu' : c.type === 'expense' ? 'Chi' : 'Luân chuyển';
  const statusText = c.status === 'active' ? 'Đang dùng' : 'Tạm khóa';
  return [
    c.code || '',
    c.name || '',
    typeText,
    c.parentCategory || '',
    c.level || 1,
    c.description || '',
    statusText,
    c.isPinned ? 'Có' : 'Không',
    c.order || 0,
    c.createdBy || '',
    c.createdAt || '',
    c.updatedAt || '',
  ];
}

export function rowToFinanceCategory(r, idx) {
  const rawType = (r[2] || '').trim().toLowerCase();
  let type = 'expense';
  if (rawType.includes('thu') || rawType === 'income') type = 'income';
  else if (rawType.includes('luân') || rawType.includes('chuyển') || rawType === 'transfer') type = 'transfer';

  const rawStatus = (r[6] || '').trim().toLowerCase();
  const status = rawStatus.includes('khóa') || rawStatus === 'inactive' ? 'inactive' : 'active';
  const isPinned = (r[7] || '').toLowerCase().includes('có') || r[7] === true || r[7] === 'TRUE';

  return {
    id: String(idx + 1),
    code: r[0] || `KM-${String(idx + 1).padStart(3, '0')}`,
    name: r[1] || '',
    type,
    parentCategory: r[3] || undefined,
    level: Number(r[4]) === 2 ? 2 : 1,
    description: r[5] || '',
    status,
    isPinned,
    order: Number(r[8]) || idx + 1,
    createdBy: r[9] || 'Lê Minh Công',
    createdAt: r[10] || new Date().toISOString().split('T')[0],
    updatedAt: r[11] || new Date().toISOString().split('T')[0],
  };
}

export async function ensureFinanceCategoryTabExists() {
  const token = await getAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const existingSheets = (meta.sheets || []).map((s) => s.properties.title);

  if (!existingSheets.includes('DanhMucTaiChinh')) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: 'DanhMucTaiChinh' } } }],
        }),
      }
    );

    // Write header
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DanhMucTaiChinh!A1:L1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [FINANCE_CATEGORY_HEADERS] }),
      }
    );
  }
}

export async function fetchFinanceCategoriesFromSheet() {
  await ensureFinanceCategoryTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DanhMucTaiChinh!A2:L`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Fetch categories failed: ${await res.text()}`);
  const data = await res.json();
  const rows = data.values || [];
  return rows.filter((r) => r && r[0]).map((r, idx) => rowToFinanceCategory(r, idx));
}

export async function saveAllFinanceCategoriesToSheet(categories) {
  await ensureFinanceCategoryTabExists();
  const token = await getAccessToken();
  const rows = categories.map((c) => financeCategoryToRow(c));
  const values = [FINANCE_CATEGORY_HEADERS, ...rows];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DanhMucTaiChinh!A1:L1000:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }
  );

  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DanhMucTaiChinh!A1:L${values.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  );
  if (!writeRes.ok) throw new Error(`Write failed: ${await writeRes.text()}`);
  return { success: true, count: categories.length };
}

export async function appendFinanceCategoryToSheet(category) {
  await ensureFinanceCategoryTabExists();
  const token = await getAccessToken();
  const row = financeCategoryToRow(category);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DanhMucTaiChinh!A:L:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!res.ok) throw new Error(`Append failed: ${await res.text()}`);
  return { success: true };
}

export async function updateFinanceCategoryInSheet(category) {
  await ensureFinanceCategoryTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DanhMucTaiChinh!A1:L`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  const rows = data.values || [];
  const targetCode = String(category.code || category.id || '').trim().toLowerCase();

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim().toLowerCase() === targetCode) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) return appendFinanceCategoryToSheet(category);

  const row = financeCategoryToRow(category);
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DanhMucTaiChinh!A${rowIndex}:L${rowIndex}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!updateRes.ok) throw new Error(`Update failed: ${await updateRes.text()}`);
  return { success: true };
}

export async function deleteFinanceCategoriesFromSheet(identifiers) {
  await ensureFinanceCategoryTabExists();
  const token = await getAccessToken();
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meta = await metaRes.json();
  const sheet = (meta.sheets || []).find((s) => s.properties.title === 'DanhMucTaiChinh');
  if (!sheet) throw new Error('Sheet DanhMucTaiChinh not found');

  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DanhMucTaiChinh!A1:L`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await dataRes.json();
  const rows = data.values || [];
  const idList = Array.isArray(identifiers) ? identifiers : [identifiers];
  const cleanIdList = idList.map((id) => String(id || '').trim().toLowerCase()).filter(Boolean);

  const indicesToDelete = [];
  rows.forEach((r, idx) => {
    if (idx === 0) return;
    const code = String(r[0] || '').trim().toLowerCase();
    if (cleanIdList.includes(code)) indicesToDelete.push(idx);
  });

  if (indicesToDelete.length === 0) return { success: true, count: 0 };
  indicesToDelete.sort((a, b) => b - a);

  const requests = indicesToDelete.map((rowIdx) => ({
    deleteDimension: {
      range: {
        sheetId: sheet.properties.sheetId,
        dimension: 'ROWS',
        startIndex: rowIdx,
        endIndex: rowIdx + 1,
      },
    },
  }));

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    }
  );
  if (!batchRes.ok) throw new Error(`Delete failed: ${await batchRes.text()}`);
  return { success: true, count: indicesToDelete.length };
}

// =========================================================================================
// 2. TÀI KHOẢN THANH TOÁN & QUỸ (FINANCE ACCOUNTS)
// =========================================================================================

export const FINANCE_ACCOUNT_HEADERS = [
  'Mã tài khoản',
  'Tên tài khoản',
  'Loại tài khoản',
  'Số tài khoản',
  'Ngân hàng',
  'Chi nhánh',
  'Chủ tài khoản',
  'Số dư ban đầu (VNĐ)',
  'Số dư hiện tại (VNĐ)',
  'Tiền tệ',
  'Mặc định',
  'Trạng thái',
  'Ghim',
  'Ghi chú',
  'Người tạo',
  'Ngày tạo',
  'Cập nhật',
];

export function financeAccountToRow(a) {
  const typeText = a.type === 'cash' ? 'Tiền mặt' : a.type === 'wallet' ? 'Ví điện tử' : 'Ngân hàng';
  const statusText = a.status === 'active' ? 'Hoạt động' : 'Tạm khóa';
  return [
    a.code || '',
    a.accountName || '',
    typeText,
    a.accountNumber || '',
    a.bankName || '',
    a.branch || '',
    a.accountHolder || '',
    a.initialBalance || 0,
    a.currentBalance || 0,
    a.currency || 'VND',
    a.isDefault ? 'Có' : 'Không',
    statusText,
    a.isPinned ? 'Có' : 'Không',
    a.note || '',
    a.createdBy || '',
    a.createdAt || '',
    a.updatedAt || '',
  ];
}

export function rowToFinanceAccount(r, idx) {
  const rawType = (r[2] || '').trim().toLowerCase();
  let type = 'bank';
  if (rawType.includes('tiền mặt') || rawType === 'cash') type = 'cash';
  else if (rawType.includes('ví') || rawType === 'wallet') type = 'wallet';

  const rawStatus = (r[11] || '').trim().toLowerCase();
  const status = rawStatus.includes('khóa') || rawStatus === 'inactive' ? 'inactive' : 'active';
  const isDefault = (r[10] || '').toLowerCase().includes('có') || r[10] === true || r[10] === 'TRUE';
  const isPinned = (r[12] || '').toLowerCase().includes('có') || r[12] === true || r[12] === 'TRUE';

  return {
    id: String(idx + 1),
    code: r[0] || `TK-${String(idx + 1).padStart(3, '0')}`,
    accountName: r[1] || '',
    type,
    accountNumber: r[3] || '',
    bankName: r[4] || '',
    branch: r[5] || '',
    accountHolder: r[6] || '',
    initialBalance: Number(r[7]) || 0,
    currentBalance: Number(r[8]) || Number(r[7]) || 0,
    currency: r[9] || 'VND',
    isDefault,
    status,
    isPinned,
    note: r[13] || '',
    createdBy: r[14] || 'Lê Minh Công',
    createdAt: r[15] || new Date().toISOString().split('T')[0],
    updatedAt: r[16] || new Date().toISOString().split('T')[0],
  };
}

export async function ensureFinanceAccountTabExists() {
  const token = await getAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const existingSheets = (meta.sheets || []).map((s) => s.properties.title);

  if (!existingSheets.includes('TaiKhoan')) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: 'TaiKhoan' } } }],
        }),
      }
    );

    // Write header
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/TaiKhoan!A1:Q1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [FINANCE_ACCOUNT_HEADERS] }),
      }
    );
  }
}

export async function fetchFinanceAccountsFromSheet() {
  await ensureFinanceAccountTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/TaiKhoan!A2:Q`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Fetch accounts failed: ${await res.text()}`);
  const data = await res.json();
  const rows = data.values || [];
  return rows.filter((r) => r && r[0]).map((r, idx) => rowToFinanceAccount(r, idx));
}

export async function saveAllFinanceAccountsToSheet(accounts) {
  await ensureFinanceAccountTabExists();
  const token = await getAccessToken();
  const rows = accounts.map((a) => financeAccountToRow(a));
  const values = [FINANCE_ACCOUNT_HEADERS, ...rows];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/TaiKhoan!A1:Q1000:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }
  );

  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/TaiKhoan!A1:Q${values.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  );
  if (!writeRes.ok) throw new Error(`Write failed: ${await writeRes.text()}`);
  return { success: true, count: accounts.length };
}

export async function appendFinanceAccountToSheet(account) {
  await ensureFinanceAccountTabExists();
  const token = await getAccessToken();
  const row = financeAccountToRow(account);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/TaiKhoan!A:Q:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!res.ok) throw new Error(`Append failed: ${await res.text()}`);
  return { success: true };
}

export async function updateFinanceAccountInSheet(account) {
  await ensureFinanceAccountTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/TaiKhoan!A1:Q`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  const rows = data.values || [];
  const targetCode = String(account.code || account.id || '').trim().toLowerCase();

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim().toLowerCase() === targetCode) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) return appendFinanceAccountToSheet(account);

  const row = financeAccountToRow(account);
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/TaiKhoan!A${rowIndex}:Q${rowIndex}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!updateRes.ok) throw new Error(`Update failed: ${await updateRes.text()}`);
  return { success: true };
}

export async function deleteFinanceAccountsFromSheet(identifiers) {
  await ensureFinanceAccountTabExists();
  const token = await getAccessToken();
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meta = await metaRes.json();
  const sheet = (meta.sheets || []).find((s) => s.properties.title === 'TaiKhoan');
  if (!sheet) throw new Error('Sheet TaiKhoan not found');

  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/TaiKhoan!A1:Q`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await dataRes.json();
  const rows = data.values || [];
  const idList = Array.isArray(identifiers) ? identifiers : [identifiers];
  const cleanIdList = idList.map((id) => String(id || '').trim().toLowerCase()).filter(Boolean);

  const indicesToDelete = [];
  rows.forEach((r, idx) => {
    if (idx === 0) return;
    const code = String(r[0] || '').trim().toLowerCase();
    if (cleanIdList.includes(code)) indicesToDelete.push(idx);
  });

  if (indicesToDelete.length === 0) return { success: true, count: 0 };
  indicesToDelete.sort((a, b) => b - a);

  const requests = indicesToDelete.map((rowIdx) => ({
    deleteDimension: {
      range: {
        sheetId: sheet.properties.sheetId,
        dimension: 'ROWS',
        startIndex: rowIdx,
        endIndex: rowIdx + 1,
      },
    },
  }));

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    }
  );
  if (!batchRes.ok) throw new Error(`Delete failed: ${await batchRes.text()}`);
  return { success: true, count: indicesToDelete.length };
}

// =========================================================================================
// 3. ĐỐI TƯỢNG THU CHI (COUNTERPARTIES)
// =========================================================================================

export const COUNTERPARTY_HEADERS = [
  'Mã đối tượng',
  'Tên đối tượng / Đơn vị',
  'Phân loại',
  'Số điện thoại',
  'Email',
  'Địa chỉ',
  'Mã số thuế',
  'Số tài khoản NH',
  'Ngân hàng',
  'Chi nhánh',
  'Người liên hệ',
  'SĐT liên hệ',
  'Trạng thái',
  'Ghim',
  'Ghi chú',
  'Người tạo',
  'Ngày tạo',
  'Cập nhật',
];

export function counterpartyToRow(cp) {
  const typeText =
    cp.type === 'customer'
      ? 'Khách hàng'
      : cp.type === 'vendor'
      ? 'Nhà cung cấp'
      : cp.type === 'employee'
      ? 'Nhân viên'
      : cp.type === 'partner'
      ? 'Đối tác'
      : 'Khác';
  const statusText = cp.status === 'active' ? 'Đang giao dịch' : 'Ngừng giao dịch';
  return [
    cp.code || '',
    cp.name || '',
    typeText,
    cp.phone || '',
    cp.email || '',
    cp.address || '',
    cp.taxCode || '',
    cp.bankAccount || '',
    cp.bankName || '',
    cp.bankBranch || '',
    cp.contactPerson || '',
    cp.contactPersonPhone || '',
    statusText,
    cp.isPinned ? 'Có' : 'Không',
    cp.note || '',
    cp.createdBy || '',
    cp.createdAt || '',
    cp.updatedAt || '',
  ];
}

export function rowToCounterparty(r, idx) {
  const rawType = (r[2] || '').trim().toLowerCase();
  let type = 'vendor';
  if (rawType.includes('khách') || rawType === 'customer') type = 'customer';
  else if (rawType.includes('nhà cung cấp') || rawType === 'vendor') type = 'vendor';
  else if (rawType.includes('nhân viên') || rawType === 'employee') type = 'employee';
  else if (rawType.includes('đối tác') || rawType === 'partner') type = 'partner';
  else if (rawType.includes('khác') || rawType === 'other') type = 'other';

  const rawStatus = (r[12] || '').trim().toLowerCase();
  const status = rawStatus.includes('ngừng') || rawStatus === 'inactive' ? 'inactive' : 'active';
  const isPinned = (r[13] || '').toLowerCase().includes('có') || r[13] === true || r[13] === 'TRUE';

  return {
    id: String(idx + 1),
    code: r[0] || `DT-${String(idx + 1).padStart(3, '0')}`,
    name: r[1] || '',
    type,
    phone: r[3] || '',
    email: r[4] || '',
    address: r[5] || '',
    taxCode: r[6] || '',
    bankAccount: r[7] || '',
    bankName: r[8] || '',
    bankBranch: r[9] || '',
    contactPerson: r[10] || '',
    contactPersonPhone: r[11] || '',
    status,
    isPinned,
    note: r[14] || '',
    createdBy: r[15] || 'Lê Minh Công',
    createdAt: r[16] || new Date().toISOString().split('T')[0],
    updatedAt: r[17] || new Date().toISOString().split('T')[0],
  };
}

export async function ensureCounterpartyTabExists() {
  const token = await getAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const existingSheets = (meta.sheets || []).map((s) => s.properties.title);

  if (!existingSheets.includes('DoiTuongThuChi')) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: 'DoiTuongThuChi' } } }],
        }),
      }
    );

    // Write header
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DoiTuongThuChi!A1:R1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [COUNTERPARTY_HEADERS] }),
      }
    );
  }
}

export async function fetchCounterpartiesFromSheet() {
  await ensureCounterpartyTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DoiTuongThuChi!A2:R`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Fetch counterparties failed: ${await res.text()}`);
  const data = await res.json();
  const rows = data.values || [];
  return rows.filter((r) => r && r[0]).map((r, idx) => rowToCounterparty(r, idx));
}

export async function saveAllCounterpartiesToSheet(counterparties) {
  await ensureCounterpartyTabExists();
  const token = await getAccessToken();
  const rows = counterparties.map((cp) => counterpartyToRow(cp));
  const values = [COUNTERPARTY_HEADERS, ...rows];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DoiTuongThuChi!A1:R1000:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }
  );

  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DoiTuongThuChi!A1:R${values.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  );
  if (!writeRes.ok) throw new Error(`Write failed: ${await writeRes.text()}`);
  return { success: true, count: counterparties.length };
}

export async function appendCounterpartyToSheet(counterparty) {
  await ensureCounterpartyTabExists();
  const token = await getAccessToken();
  const row = counterpartyToRow(counterparty);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DoiTuongThuChi!A:R:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!res.ok) throw new Error(`Append failed: ${await res.text()}`);
  return { success: true };
}

export async function updateCounterpartyInSheet(counterparty) {
  await ensureCounterpartyTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DoiTuongThuChi!A1:R`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  const rows = data.values || [];
  const targetCode = String(counterparty.code || counterparty.id || '').trim().toLowerCase();

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim().toLowerCase() === targetCode) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) return appendCounterpartyToSheet(counterparty);

  const row = counterpartyToRow(counterparty);
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DoiTuongThuChi!A${rowIndex}:R${rowIndex}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!updateRes.ok) throw new Error(`Update failed: ${await updateRes.text()}`);
  return { success: true };
}

export async function deleteCounterpartiesFromSheet(identifiers) {
  await ensureCounterpartyTabExists();
  const token = await getAccessToken();
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meta = await metaRes.json();
  const sheet = (meta.sheets || []).find((s) => s.properties.title === 'DoiTuongThuChi');
  if (!sheet) throw new Error('Sheet DoiTuongThuChi not found');

  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DoiTuongThuChi!A1:R`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await dataRes.json();
  const rows = data.values || [];
  const idList = Array.isArray(identifiers) ? identifiers : [identifiers];
  const cleanIdList = idList.map((id) => String(id || '').trim().toLowerCase()).filter(Boolean);

  const indicesToDelete = [];
  rows.forEach((r, idx) => {
    if (idx === 0) return;
    const code = String(r[0] || '').trim().toLowerCase();
    if (cleanIdList.includes(code)) indicesToDelete.push(idx);
  });

  if (indicesToDelete.length === 0) return { success: true, count: 0 };
  indicesToDelete.sort((a, b) => b - a);

  const requests = indicesToDelete.map((rowIdx) => ({
    deleteDimension: {
      range: {
        sheetId: sheet.properties.sheetId,
        dimension: 'ROWS',
        startIndex: rowIdx,
        endIndex: rowIdx + 1,
      },
    },
  }));

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    }
  );
  if (!batchRes.ok) throw new Error(`Delete failed: ${await batchRes.text()}`);
  return { success: true, count: indicesToDelete.length };
}

// =========================================================================================
// 4. NGƯỠNG DUYỆT (APPROVAL THRESHOLDS)
// =========================================================================================

export const APPROVAL_THRESHOLD_HEADERS = [
  'Mã quy tắc',
  'Tên quy tắc',
  'Hạn mức từ (VNĐ)',
  'Hạn mức đến (VNĐ)',
  'Số cấp duyệt',
  'Danh sách người duyệt (JSON)',
  'Phòng ban',
  'Khoản mục',
  'Áp dụng cho',
  'Trạng thái',
  'Ghim',
  'Ghi chú',
  'Người tạo',
  'Ngày tạo',
  'Cập nhật',
];

export function approvalThresholdToRow(t) {
  const appliesText =
    t.appliesTo === 'all'
      ? 'Tất cả'
      : t.appliesTo === 'proposal'
      ? 'Đề xuất chi phí'
      : t.appliesTo === 'expense'
      ? 'Phiếu chi tiền'
      : 'Tạm ứng';
  const statusText = t.status === 'active' ? 'Đang áp dụng' : 'Tạm ngưng';
  const approversJson = JSON.stringify(t.approvers || []);

  return [
    t.code || '',
    t.name || '',
    t.minAmount || 0,
    t.maxAmount || 0,
    t.approvalLevels || 1,
    approversJson,
    t.department || 'Tất cả',
    t.category || 'Tất cả',
    appliesText,
    statusText,
    t.isPinned ? 'Có' : 'Không',
    t.note || '',
    t.createdBy || '',
    t.createdAt || '',
    t.updatedAt || '',
  ];
}

export function rowToApprovalThreshold(r, idx) {
  let approvers = [];
  if (r[5]) {
    try {
      approvers = typeof r[5] === 'string' ? JSON.parse(r[5]) : r[5];
    } catch {
      approvers = r[5].split(',').map((s) => s.trim());
    }
  }

  const rawStatus = (r[9] || '').trim().toLowerCase();
  const status = rawStatus.includes('ngưng') || rawStatus === 'inactive' ? 'inactive' : 'active';
  const isPinned = (r[10] || '').toLowerCase().includes('có') || r[10] === true || r[10] === 'TRUE';

  const rawApplies = (r[8] || '').trim().toLowerCase();
  let appliesTo = 'all';
  if (rawApplies.includes('đề xuất') || rawApplies === 'proposal') appliesTo = 'proposal';
  else if (rawApplies.includes('chi') || rawApplies === 'expense') appliesTo = 'expense';
  else if (rawApplies.includes('tạm ứng') || rawApplies === 'advance') appliesTo = 'advance';

  return {
    id: String(idx + 1),
    code: r[0] || `ND-${String(idx + 1).padStart(3, '0')}`,
    name: r[1] || '',
    minAmount: Number(r[2]) || 0,
    maxAmount: Number(r[3]) || 0,
    approvalLevels: Number(r[4]) || 1,
    approvers: Array.isArray(approvers) ? approvers : [],
    department: r[6] || 'Tất cả',
    category: r[7] || 'Tất cả',
    appliesTo,
    status,
    isPinned,
    note: r[11] || '',
    createdBy: r[12] || 'Lê Minh Công',
    createdAt: r[13] || new Date().toISOString().split('T')[0],
    updatedAt: r[14] || new Date().toISOString().split('T')[0],
  };
}

export async function ensureApprovalThresholdTabExists() {
  const token = await getAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const existingSheets = (meta.sheets || []).map((s) => s.properties.title);

  if (!existingSheets.includes('NguongDuyet')) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: 'NguongDuyet' } } }],
        }),
      }
    );

    // Write header
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NguongDuyet!A1:O1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [APPROVAL_THRESHOLD_HEADERS] }),
      }
    );
  }
}

export async function fetchApprovalThresholdsFromSheet() {
  await ensureApprovalThresholdTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NguongDuyet!A2:O`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Fetch thresholds failed: ${await res.text()}`);
  const data = await res.json();
  const rows = data.values || [];
  return rows.filter((r) => r && r[0]).map((r, idx) => rowToApprovalThreshold(r, idx));
}

export async function saveAllApprovalThresholdsToSheet(thresholds) {
  await ensureApprovalThresholdTabExists();
  const token = await getAccessToken();
  const rows = thresholds.map((t) => approvalThresholdToRow(t));
  const values = [APPROVAL_THRESHOLD_HEADERS, ...rows];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NguongDuyet!A1:O1000:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }
  );

  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NguongDuyet!A1:O${values.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  );
  if (!writeRes.ok) throw new Error(`Write failed: ${await writeRes.text()}`);
  return { success: true, count: thresholds.length };
}

export async function appendApprovalThresholdToSheet(threshold) {
  await ensureApprovalThresholdTabExists();
  const token = await getAccessToken();
  const row = approvalThresholdToRow(threshold);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NguongDuyet!A:O:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!res.ok) throw new Error(`Append failed: ${await res.text()}`);
  return { success: true };
}

export async function updateApprovalThresholdInSheet(threshold) {
  await ensureApprovalThresholdTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NguongDuyet!A1:O`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  const rows = data.values || [];
  const targetCode = String(threshold.code || threshold.id || '').trim().toLowerCase();

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim().toLowerCase() === targetCode) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) return appendApprovalThresholdToSheet(threshold);

  const row = approvalThresholdToRow(threshold);
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NguongDuyet!A${rowIndex}:O${rowIndex}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!updateRes.ok) throw new Error(`Update failed: ${await updateRes.text()}`);
  return { success: true };
}

export async function deleteApprovalThresholdsFromSheet(identifiers) {
  await ensureApprovalThresholdTabExists();
  const token = await getAccessToken();
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meta = await metaRes.json();
  const sheet = (meta.sheets || []).find((s) => s.properties.title === 'NguongDuyet');
  if (!sheet) throw new Error('Sheet NguongDuyet not found');

  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NguongDuyet!A1:O`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await dataRes.json();
  const rows = data.values || [];
  const idList = Array.isArray(identifiers) ? identifiers : [identifiers];
  const cleanIdList = idList.map((id) => String(id || '').trim().toLowerCase()).filter(Boolean);

  const indicesToDelete = [];
  rows.forEach((r, idx) => {
    if (idx === 0) return;
    const code = String(r[0] || '').trim().toLowerCase();
    if (cleanIdList.includes(code)) indicesToDelete.push(idx);
  });

  if (indicesToDelete.length === 0) return { success: true, count: 0 };
  indicesToDelete.sort((a, b) => b - a);

  const requests = indicesToDelete.map((rowIdx) => ({
    deleteDimension: {
      range: {
        sheetId: sheet.properties.sheetId,
        dimension: 'ROWS',
        startIndex: rowIdx,
        endIndex: rowIdx + 1,
      },
    },
  }));

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    }
  );
  if (!batchRes.ok) throw new Error(`Delete failed: ${await batchRes.text()}`);
  return { success: true, count: indicesToDelete.length };
}

// ---------------------- WORK: TASKS (CONG VIEC - NHIEM VU) ----------------------

export const TASKS_HEADERS = [
  'Mã công việc',
  'Tiêu đề',
  'Mô tả',
  'Mã dự án',
  'Tên dự án',
  'Phòng ban',
  'Mã người giao',
  'Người giao việc',
  'Mã người làm',
  'Người thực hiện',
  'Độ ưu tiên',
  'Trạng thái',
  'Ngày bắt đầu',
  'Hạn hoàn thành',
  'Tiến độ (%)',
  'Giờ ước tính',
  'Giờ thực tế',
  'Điểm KPI',
  'Ghi chú',
  'Ngày tạo',
  'Nhiệm vụ con (JSON)',
  'Thẻ phân loại',
  'Người phối hợp',
];

export function taskToRow(t) {
  return [
    t.code || '',
    t.title || '',
    t.description || '',
    t.projectCode || t.projectId || '',
    t.projectName || '',
    t.department || '',
    t.assignerCode || t.assignerId || '',
    t.assignerName || '',
    t.assigneeCode || t.assigneeId || '',
    t.assigneeName || '',
    t.priority || 'medium',
    t.status || 'todo',
    t.startDate || '',
    t.dueDate || '',
    t.progress ?? 0,
    t.estimatedHours ?? '',
    t.actualHours ?? '',
    t.kpiScore ?? '',
    t.note || '',
    t.createdAt || new Date().toISOString(),
    Array.isArray(t.subtasks) && t.subtasks.length > 0 ? JSON.stringify(t.subtasks) : '',
    Array.isArray(t.tags) && t.tags.length > 0 ? JSON.stringify(t.tags) : '',
    Array.isArray(t.collaborators) && t.collaborators.length > 0 ? JSON.stringify(t.collaborators) : '',
  ];
}

export function rowToTask(r, idx) {
  const code = String(r[0] || '').trim() || `CV-${String(idx + 1).padStart(3, '0')}`;

  let subtasks = [];
  if (r[20]) {
    try {
      subtasks = JSON.parse(r[20]);
    } catch {
      subtasks = [];
    }
  }

  let tags = [];
  if (r[21]) {
    try {
      if (r[21].startsWith('[')) {
        tags = JSON.parse(r[21]);
      } else {
        tags = r[21].split(',').map((t) => t.trim()).filter(Boolean);
      }
    } catch {
      tags = [];
    }
  }

  let collaborators = [];
  if (r[22]) {
    try {
      if (r[22].startsWith('[')) {
        collaborators = JSON.parse(r[22]);
      } else {
        collaborators = r[22].split(',').map((c) => c.trim()).filter(Boolean);
      }
    } catch {
      collaborators = [];
    }
  }

  return {
    id: `task_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    code,
    title: String(r[1] || '').trim(),
    description: String(r[2] || '').trim(),
    projectCode: String(r[3] || '').trim() || undefined,
    projectName: String(r[4] || '').trim() || undefined,
    department: String(r[5] || '').trim(),
    assignerCode: String(r[6] || '').trim() || undefined,
    assignerName: String(r[7] || '').trim(),
    assigneeCode: String(r[8] || '').trim() || undefined,
    assigneeName: String(r[9] || '').trim(),
    priority: String(r[10] || 'medium').trim(),
    status: String(r[11] || 'todo').trim(),
    startDate: String(r[12] || '').trim(),
    dueDate: String(r[13] || '').trim(),
    progress: parseInt(r[14], 10) || 0,
    estimatedHours: r[15] !== '' && r[15] !== undefined ? Number(r[15]) : undefined,
    actualHours: r[16] !== '' && r[16] !== undefined ? Number(r[16]) : undefined,
    kpiScore: r[17] !== '' && r[17] !== undefined ? Number(r[17]) : undefined,
    note: String(r[18] || '').trim() || undefined,
    createdAt: String(r[19] || '').trim() || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks,
    tags,
    collaborators,
  };
}

export async function ensureTaskTabExists() {
  const token = await getAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const existingSheets = (meta.sheets || []).map((s) => s.properties.title);

  if (!existingSheets.includes('CongViec_NhiemVu')) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: 'CongViec_NhiemVu' } } }],
        }),
      }
    );

    // Always make sure header row 1 has all latest columns
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_NhiemVu!A1:W1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [TASKS_HEADERS] }),
      }
    );
  } else {
    // If sheet exists, ensure header row 1 is updated with new columns (Nhiệm vụ con, Thẻ phân loại, Người phối hợp)
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_NhiemVu!A1:W1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [TASKS_HEADERS] }),
        }
      );
    } catch {}
  }
}

export async function fetchTasksFromSheet() {
  const cached = getCachedSheetData('tasks');
  if (cached) return cached;

  await ensureTaskTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_NhiemVu!A2:W`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Fetch tasks failed: ${await res.text()}`);
  const data = await res.json();
  const rows = data.values || [];
  const tasks = rows.filter((r) => r && r[0]).map((r, idx) => rowToTask(r, idx));
  setCachedSheetData('tasks', tasks);
  return tasks;
}

export async function saveAllTasksToSheet(tasks) {
  await ensureTaskTabExists();
  const token = await getAccessToken();
  const rows = tasks.map((t) => taskToRow(t));
  const values = [TASKS_HEADERS, ...rows];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_NhiemVu!A1:W1000:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }
  );

  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_NhiemVu!A1:W${values.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  );
  if (!writeRes.ok) throw new Error(`Write tasks failed: ${await writeRes.text()}`);
  invalidateSheetCache('tasks');
  return { success: true, count: tasks.length };
}

export async function appendTaskToSheet(task) {
  await ensureTaskTabExists();
  const token = await getAccessToken();
  const row = taskToRow(task);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_NhiemVu!A:W:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!res.ok) throw new Error(`Append task failed: ${await res.text()}`);
  invalidateSheetCache('tasks');
  return { success: true, task };
}

export async function updateTaskInSheet(task) {
  await ensureTaskTabExists();
  const token = await getAccessToken();
  const getRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_NhiemVu!A1:A`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await getRes.json();
  const rows = data.values || [];
  const targetCode = String(task.code || '').trim().toLowerCase();

  let targetRowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim().toLowerCase() === targetCode) {
      targetRowIndex = i + 1;
      break;
    }
  }

  if (targetRowIndex === -1) {
    return appendTaskToSheet(task);
  }

  const row = taskToRow(task);
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_NhiemVu!A${targetRowIndex}:W${targetRowIndex}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!updateRes.ok) throw new Error(`Update task failed: ${await updateRes.text()}`);
  invalidateSheetCache('tasks');
  return { success: true, task };
}

export async function deleteTasksFromSheet(identifiers) {
  await ensureTaskTabExists();
  const token = await getAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const sheet = (meta.sheets || []).find((s) => s.properties.title === 'CongViec_NhiemVu');
  if (!sheet) return { success: true, count: 0 };

  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_NhiemVu!A1:A`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await dataRes.json();
  const rows = data.values || [];
  const idList = Array.isArray(identifiers) ? identifiers : [identifiers];
  const cleanIdList = idList.map((id) => String(id || '').trim().toLowerCase()).filter(Boolean);

  const indicesToDelete = [];
  rows.forEach((r, idx) => {
    if (idx === 0) return;
    const code = String(r[0] || '').trim().toLowerCase();
    if (cleanIdList.includes(code)) indicesToDelete.push(idx);
  });

  if (indicesToDelete.length === 0) return { success: true, count: 0 };
  indicesToDelete.sort((a, b) => b - a);

  const requests = indicesToDelete.map((rowIdx) => ({
    deleteDimension: {
      range: {
        sheetId: sheet.properties.sheetId,
        dimension: 'ROWS',
        startIndex: rowIdx,
        endIndex: rowIdx + 1,
      },
    },
  }));

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    }
  );
  if (!batchRes.ok) throw new Error(`Delete tasks failed: ${await batchRes.text()}`);
  invalidateSheetCache('tasks');
  return { success: true, count: indicesToDelete.length };
}

// ---------------------- WORK: PROJECTS (CONG VIEC - DU AN) ----------------------

export const PROJECTS_HEADERS = [
  'Mã dự án',
  'Tên dự án',
  'Mô tả',
  'Mã GĐDA',
  'Giám đốc DA',
  'Mã khách hàng',
  'Khách hàng',
  'Phòng ban',
  'Ngày bắt đầu',
  'Ngày kết thúc',
  'Ngân sách (VND)',
  'Chi phí thực tế (VND)',
  'Trạng thái',
  'Độ ưu tiên',
  'Tiến độ (%)',
  'Màu sắc',
  'Ngày tạo',
];

export function projectToRow(p) {
  return [
    p.code || '',
    p.name || '',
    p.description || '',
    p.managerCode || p.managerId || '',
    p.managerName || '',
    p.customerCode || p.customerId || '',
    p.customerName || '',
    p.department || '',
    p.startDate || '',
    p.endDate || '',
    p.budget || 0,
    p.spentAmount || 0,
    p.status || 'planning',
    p.priority || 'medium',
    p.progress || 0,
    p.color || '#2563eb',
    p.createdAt || new Date().toISOString(),
  ];
}

export function rowToProject(r, idx) {
  const code = String(r[0] || '').trim() || `DA-${String(idx + 1).padStart(3, '0')}`;
  return {
    id: `proj_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    code,
    name: String(r[1] || '').trim(),
    description: String(r[2] || '').trim(),
    managerCode: String(r[3] || '').trim() || undefined,
    managerName: String(r[4] || '').trim(),
    customerCode: String(r[5] || '').trim() || undefined,
    customerName: String(r[6] || '').trim() || undefined,
    department: String(r[7] || '').trim(),
    startDate: String(r[8] || '').trim(),
    endDate: String(r[9] || '').trim(),
    budget: Number(r[10]) || 0,
    spentAmount: Number(r[11]) || 0,
    status: String(r[12] || 'planning').trim(),
    priority: String(r[13] || 'medium').trim(),
    progress: parseInt(r[14], 10) || 0,
    color: String(r[15] || '#2563eb').trim(),
    createdAt: String(r[16] || '').trim() || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function ensureProjectTabExists() {
  const token = await getAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const existingSheets = (meta.sheets || []).map((s) => s.properties.title);

  if (!existingSheets.includes('CongViec_DuAn')) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: 'CongViec_DuAn' } } }],
        }),
      }
    );

    // Write header
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_DuAn!A1:Q1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [PROJECTS_HEADERS] }),
      }
    );
  }
}

export async function fetchProjectsFromSheet() {
  const cached = getCachedSheetData('projects');
  if (cached) return cached;
  await ensureProjectTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_DuAn!A2:Q`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Fetch projects failed: ${await res.text()}`);
  const data = await res.json();
  const rows = data.values || [];
  const result = rows.filter((r) => r && r[0]).map((r, idx) => rowToProject(r, idx));
  setCachedSheetData('projects', result);
  return result;
}

export async function saveAllProjectsToSheet(projects) {
  await ensureProjectTabExists();
  const token = await getAccessToken();
  const rows = projects.map((p) => projectToRow(p));
  const values = [PROJECTS_HEADERS, ...rows];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_DuAn!A1:Q1000:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }
  );

  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_DuAn!A1:Q${values.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  );
  if (!writeRes.ok) throw new Error(`Write projects failed: ${await writeRes.text()}`);
  invalidateSheetCache('projects');
  return { success: true, count: projects.length };
}

export async function appendProjectToSheet(project) {
  await ensureProjectTabExists();
  const token = await getAccessToken();
  const row = projectToRow(project);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_DuAn!A:Q:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!res.ok) throw new Error(`Append project failed: ${await res.text()}`);
  invalidateSheetCache('projects');
  return { success: true, project };
}

export async function updateProjectInSheet(project) {
  await ensureProjectTabExists();
  const token = await getAccessToken();
  const getRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_DuAn!A1:A`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await getRes.json();
  const rows = data.values || [];
  const targetCode = String(project.code || '').trim().toLowerCase();

  let targetRowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim().toLowerCase() === targetCode) {
      targetRowIndex = i + 1;
      break;
    }
  }

  if (targetRowIndex === -1) {
    return appendProjectToSheet(project);
  }

  const row = projectToRow(project);
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_DuAn!A${targetRowIndex}:Q${targetRowIndex}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!updateRes.ok) throw new Error(`Update project failed: ${await updateRes.text()}`);
  invalidateSheetCache('projects');
  return { success: true, project };
}

export async function deleteProjectsFromSheet(identifiers) {
  await ensureProjectTabExists();
  const token = await getAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const sheet = (meta.sheets || []).find((s) => s.properties.title === 'CongViec_DuAn');
  if (!sheet) return { success: true, count: 0 };

  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_DuAn!A1:A`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await dataRes.json();
  const rows = data.values || [];
  const idList = Array.isArray(identifiers) ? identifiers : [identifiers];
  const cleanIdList = idList.map((id) => String(id || '').trim().toLowerCase()).filter(Boolean);

  const indicesToDelete = [];
  rows.forEach((r, idx) => {
    if (idx === 0) return;
    const code = String(r[0] || '').trim().toLowerCase();
    if (cleanIdList.includes(code)) indicesToDelete.push(idx);
  });

  if (indicesToDelete.length === 0) return { success: true, count: 0 };
  indicesToDelete.sort((a, b) => b - a);

  const requests = indicesToDelete.map((rowIdx) => ({
    deleteDimension: {
      range: {
        sheetId: sheet.properties.sheetId,
        dimension: 'ROWS',
        startIndex: rowIdx,
        endIndex: rowIdx + 1,
      },
    },
  }));

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    }
  );
  if (!batchRes.ok) throw new Error(`Delete projects failed: ${await batchRes.text()}`);
  invalidateSheetCache('projects');
  return { success: true, count: indicesToDelete.length };
}

// ---------------------- WORK: WORKFLOWS (CONG VIEC - QUY TRINH) ----------------------

export const WORKFLOWS_HEADERS = [
  'Mã quy trình',
  'Tên quy trình',
  'Mô tả',
  'Phân loại',
  'Phòng ban',
  'Các bước (JSON)',
  'Trạng thái',
  'Lượt sử dụng',
  'Ngày tạo',
];

export function workflowToRow(w) {
  return [
    w.code || '',
    w.name || '',
    w.description || '',
    w.category || '',
    w.department || '',
    typeof w.steps === 'string' ? w.steps : JSON.stringify(w.steps || []),
    w.status || 'active',
    w.usageCount ?? 0,
    w.createdAt || new Date().toISOString(),
  ];
}

export function rowToWorkflow(r, idx) {
  const code = String(r[0] || '').trim() || `QT-${String(idx + 1).padStart(3, '0')}`;
  let steps = [];
  try {
    if (r[5]) steps = JSON.parse(r[5]);
  } catch {}

  return {
    id: `wf_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    code,
    name: String(r[1] || '').trim(),
    description: String(r[2] || '').trim(),
    category: String(r[3] || '').trim(),
    department: String(r[4] || '').trim(),
    steps,
    status: String(r[6] || 'active').trim(),
    usageCount: parseInt(r[7], 10) || 0,
    createdAt: String(r[8] || '').trim() || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function ensureWorkflowTabExists() {
  const token = await getAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const existingSheets = (meta.sheets || []).map((s) => s.properties.title);

  if (!existingSheets.includes('CongViec_QuyTrinh')) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: 'CongViec_QuyTrinh' } } }],
        }),
      }
    );

    // Write header
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_QuyTrinh!A1:I1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [WORKFLOWS_HEADERS] }),
      }
    );
  }
}

export async function fetchWorkflowsFromSheet() {
  await ensureWorkflowTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_QuyTrinh!A2:I`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Fetch workflows failed: ${await res.text()}`);
  const data = await res.json();
  const rows = data.values || [];
  return rows.filter((r) => r && r[0]).map((r, idx) => rowToWorkflow(r, idx));
}

export async function saveAllWorkflowsToSheet(workflows) {
  await ensureWorkflowTabExists();
  const token = await getAccessToken();
  const rows = workflows.map((w) => workflowToRow(w));
  const values = [WORKFLOWS_HEADERS, ...rows];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_QuyTrinh!A1:I1000:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }
  );

  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_QuyTrinh!A1:I${values.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  );
  if (!writeRes.ok) throw new Error(`Write workflows failed: ${await writeRes.text()}`);
  return { success: true, count: workflows.length };
}

export async function appendWorkflowToSheet(workflow) {
  await ensureWorkflowTabExists();
  const token = await getAccessToken();
  const row = workflowToRow(workflow);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_QuyTrinh!A:I:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!res.ok) throw new Error(`Append workflow failed: ${await res.text()}`);
  return { success: true, workflow };
}

export async function updateWorkflowInSheet(workflow) {
  await ensureWorkflowTabExists();
  const token = await getAccessToken();
  const getRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_QuyTrinh!A1:A`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await getRes.json();
  const rows = data.values || [];
  const targetCode = String(workflow.code || '').trim().toLowerCase();

  let targetRowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim().toLowerCase() === targetCode) {
      targetRowIndex = i + 1;
      break;
    }
  }

  if (targetRowIndex === -1) {
    return appendWorkflowToSheet(workflow);
  }

  const row = workflowToRow(workflow);
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_QuyTrinh!A${targetRowIndex}:I${targetRowIndex}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!updateRes.ok) throw new Error(`Update workflow failed: ${await updateRes.text()}`);
  return { success: true, workflow };
}

export async function deleteWorkflowsFromSheet(identifiers) {
  await ensureWorkflowTabExists();
  const token = await getAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const sheet = (meta.sheets || []).find((s) => s.properties.title === 'CongViec_QuyTrinh');
  if (!sheet) return { success: true, count: 0 };

  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/CongViec_QuyTrinh!A1:A`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await dataRes.json();
  const rows = data.values || [];
  const idList = Array.isArray(identifiers) ? identifiers : [identifiers];
  const cleanIdList = idList.map((id) => String(id || '').trim().toLowerCase()).filter(Boolean);

  const indicesToDelete = [];
  rows.forEach((r, idx) => {
    if (idx === 0) return;
    const code = String(r[0] || '').trim().toLowerCase();
    if (cleanIdList.includes(code)) indicesToDelete.push(idx);
  });

  if (indicesToDelete.length === 0) return { success: true, count: 0 };
  indicesToDelete.sort((a, b) => b - a);

  const requests = indicesToDelete.map((rowIdx) => ({
    deleteDimension: {
      range: {
        sheetId: sheet.properties.sheetId,
        dimension: 'ROWS',
        startIndex: rowIdx,
        endIndex: rowIdx + 1,
      },
    },
  }));

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    }
  );
  if (!batchRes.ok) throw new Error(`Delete workflows failed: ${await batchRes.text()}`);
  return { success: true, count: indicesToDelete.length };
}

// ---------------------- LEARNING / KNOWLEDGE BASE (HOC HOI - KIEN THUC) ----------------------

export const LEARNING_HEADERS = [
  'Mã',
  'Tiêu đề',
  'Nội dung',
  'Tóm tắt',
  'Chuyên mục',
  'Thẻ (Tags)',
  'Loại nguồn',
  'Tên nguồn',
  'Link nguồn',
  'Mức độ nắm vững',
  'Mức độ khó',
  'Đánh giá (Sao)',
  'Ngày học',
  'Ngày ôn lại',
  'Ghim',
  'Ảnh bìa',
  'Danh sách ảnh (JSON)',
  'Liên kết bổ sung (JSON)',
  'Màu sắc',
  'Tác giả',
  'Ngày tạo',
  'Ngày cập nhật',
];

export function learningEntryToRow(e) {
  return [
    e.code || '',
    e.title || '',
    e.content || '',
    e.summary || '',
    e.category || 'Khác',
    Array.isArray(e.tags) ? e.tags.join(', ') : e.tags || '',
    e.sourceType || 'Khác',
    e.sourceName || '',
    e.sourceUrl || '',
    e.masteryLevel || 'learning',
    e.difficulty || 'intermediate',
    e.rating ?? 5,
    e.entryDate || '',
    e.nextReviewDate || '',
    e.isPinned ? 'true' : 'false',
    e.coverUrl || '',
    JSON.stringify(Array.isArray(e.images) ? e.images : []),
    JSON.stringify(Array.isArray(e.links) ? e.links : []),
    e.color || '#8b5cf6',
    e.author || '',
    e.createdAt || new Date().toISOString(),
    e.updatedAt || new Date().toISOString(),
  ];
}

export function rowToLearningEntry(r, idx) {
  const code = String(r[0] || '').trim() || `HH-${String(idx + 1).padStart(3, '0')}`;
  let images = [];
  try {
    images = r[16] ? JSON.parse(r[16]) : [];
  } catch {
    images = [];
  }

  let links = [];
  try {
    links = r[17] ? JSON.parse(r[17]) : [];
  } catch {
    links = [];
  }

  return {
    id: `learn_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    code,
    title: String(r[1] || '').trim(),
    content: String(r[2] || '').trim(),
    summary: String(r[3] || '').trim(),
    category: String(r[4] || 'Khác').trim(),
    tags: r[5] ? String(r[5]).split(',').map((t) => t.trim()).filter(Boolean) : [],
    sourceType: String(r[6] || 'Khác').trim(),
    sourceName: String(r[7] || '').trim(),
    sourceUrl: String(r[8] || '').trim(),
    masteryLevel: String(r[9] || 'learning').trim(),
    difficulty: String(r[10] || 'intermediate').trim(),
    rating: Number(r[11]) || 5,
    entryDate: String(r[12] || '').trim(),
    nextReviewDate: String(r[13] || '').trim(),
    isPinned: String(r[14] || '').toLowerCase() === 'true',
    coverUrl: String(r[15] || '').trim(),
    images: Array.isArray(images) ? images : [],
    links: Array.isArray(links) ? links : [],
    color: String(r[18] || '#8b5cf6').trim(),
    author: String(r[19] || '').trim(),
    createdAt: String(r[20] || '').trim() || new Date().toISOString(),
    updatedAt: String(r[21] || '').trim() || new Date().toISOString(),
  };
}

export async function ensureHocHoiTabExists() {
  const token = await getAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const existingSheets = (meta.sheets || []).map((s) => s.properties.title);

  if (!existingSheets.includes('HocHoi')) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: 'HocHoi' } } }],
        }),
      }
    );

    // Write header
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/HocHoi!A1:V1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [LEARNING_HEADERS] }),
      }
    );
  }
}

export async function fetchLearningEntriesFromSheet() {
  const cached = getCachedSheetData('learning');
  if (cached) return cached;
  await ensureHocHoiTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/HocHoi!A2:V`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Fetch learning entries failed: ${await res.text()}`);
  const data = await res.json();
  const rows = data.values || [];
  const result = rows.filter((r) => r && r[0]).map((r, idx) => rowToLearningEntry(r, idx));
  setCachedSheetData('learning', result);
  return result;
}

export async function saveAllLearningEntriesToSheet(entries) {
  await ensureHocHoiTabExists();
  const token = await getAccessToken();
  const rows = entries.map((e) => learningEntryToRow(e));
  const values = [LEARNING_HEADERS, ...rows];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/HocHoi!A1:V1000:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }
  );

  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/HocHoi!A1:V${values.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  );
  if (!writeRes.ok) throw new Error(`Write learning entries failed: ${await writeRes.text()}`);
  invalidateSheetCache('learning');
  return { success: true, count: entries.length };
}

export async function appendLearningEntryToSheet(entry) {
  await ensureHocHoiTabExists();
  const token = await getAccessToken();
  const row = learningEntryToRow(entry);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/HocHoi!A:V:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!res.ok) throw new Error(`Append learning entry failed: ${await res.text()}`);
  invalidateSheetCache('learning');
  return { success: true, entry };
}

export async function updateLearningEntryInSheet(entry) {
  await ensureHocHoiTabExists();
  const token = await getAccessToken();
  const getRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/HocHoi!A1:B`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await getRes.json();
  const rows = data.values || [];
  const targetCode = String(entry.code || entry.id || '').trim().toLowerCase();
  const cleanTargetCode = targetCode.replace(/[^a-z0-9]/g, '');
  const targetTitle = String(entry.title || '').trim().toLowerCase();

  let targetRowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    const rowCode = String(rows[i][0] || '').trim().toLowerCase();
    const cleanRowCode = rowCode.replace(/[^a-z0-9]/g, '');
    const rowTitle = String(rows[i][1] || '').trim().toLowerCase();

    if (
      (cleanTargetCode && (rowCode === targetCode || cleanRowCode === cleanTargetCode)) ||
      (targetTitle && rowTitle === targetTitle)
    ) {
      targetRowIndex = i + 1;
      break;
    }
  }

  if (targetRowIndex === -1) {
    return appendLearningEntryToSheet(entry);
  }

  const row = learningEntryToRow(entry);
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/HocHoi!A${targetRowIndex}:V${targetRowIndex}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!updateRes.ok) throw new Error(`Update learning entry failed: ${await updateRes.text()}`);
  invalidateSheetCache('learning');
  return { success: true, entry };
}

export async function deleteLearningEntriesFromSheet(identifiers) {
  await ensureHocHoiTabExists();
  const token = await getAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const sheet = (meta.sheets || []).find((s) => s.properties.title === 'HocHoi');
  if (!sheet) return { success: true, count: 0 };

  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/HocHoi!A1:A`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await dataRes.json();
  const rows = data.values || [];
  const idList = Array.isArray(identifiers) ? identifiers : [identifiers];
  const cleanIdList = idList.map((id) => String(id || '').trim().toLowerCase()).filter(Boolean);

  const indicesToDelete = [];
  rows.forEach((r, idx) => {
    if (idx === 0) return;
    const code = String(r[0] || '').trim().toLowerCase();
    if (cleanIdList.includes(code)) indicesToDelete.push(idx);
  });

  if (indicesToDelete.length === 0) return { success: true, count: 0 };
  indicesToDelete.sort((a, b) => b - a);

  const requests = indicesToDelete.map((rowIdx) => ({
    deleteDimension: {
      range: {
        sheetId: sheet.properties.sheetId,
        dimension: 'ROWS',
        startIndex: rowIdx,
        endIndex: rowIdx + 1,
      },
    },
  }));

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    }
  );
  if (!batchRes.ok) throw new Error(`Delete learning entries failed: ${await batchRes.text()}`);
  invalidateSheetCache('learning');
  return { success: true, count: indicesToDelete.length };
}



