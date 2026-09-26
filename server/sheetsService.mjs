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

  try {
    const tsPath = path.resolve(process.cwd(), 'src/data/cost-proposals.ts');
    const sortedForUi = [...proposals].sort((a, b) => b.code.localeCompare(a.code));
    const tsContent = `import { CostProposal } from '../types/cost-proposal';\n\nexport const MOCK_COST_PROPOSALS: CostProposal[] = ${JSON.stringify(
      sortedForUi,
      null,
      2
    )};\n`;
    fs.writeFileSync(tsPath, tsContent, 'utf8');
  } catch (e) {
    console.error('Failed to update cost-proposals.ts cache:', e);
  }

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

  return { success: true, count: indicesToDelete.length };
}

// ---------------------- EMPLOYEES (NHAN VIEN - 47 COLUMNS) ----------------------

export const EMPLOYEE_HEADERS_47 = [
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
];

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
    statusText,
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
    isActiveText,
  ];
}

export function rowToEmployee(r, idx) {
  // 47-column format (has password at r[2])
  if (r.length >= 47) {
    let status = 'working';
    const rawStatus = (r[9] || '').toLowerCase();
    if (rawStatus.includes('thử việc') || rawStatus === 'probation') status = 'probation';
    else if (rawStatus.includes('nghỉ việc') || rawStatus === 'resigned') status = 'resigned';
    else if (rawStatus.includes('tạm hoãn') || rawStatus === 'suspended') status = 'suspended';

    const code = r[12] || `emp-${String(idx + 1).padStart(3, '0')}`;
    const name = r[0] || '';

    return {
      id: String(idx + 1),
      code,
      name,
      username: r[1] || '',
      password: r[2] || '123456',
      phone: r[3] || '',
      role: r[4] || 'Nhân viên',
      department: r[5] || 'Phòng Kỹ thuật',
      subDepartment: r[6] || '—',
      email: r[7] || '',
      gender: r[8] === 'Nữ' ? 'Nữ' : 'Nam',
      status,
      createdAt: r[10] || '',
      updatedAt: r[11] || '',
      avatarUrl: r[13] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=1d4ed8&color=fff`,
      dob: r[14] || '',
      maritalStatus: r[15] || 'Độc thân',
      nationality: r[16] || 'Việt Nam',
      ethnicity: r[17] || 'Kinh',
      religion: r[18] || 'Không',
      hometown: r[19] || '',
      rank: Number(r[22]) || 1,
      startDate: r[23] || '',
      officialDate: r[24] || '',
      resignationDate: r[25] || '',
      resignationReason: r[26] || '',
      idCardNumber: r[27] || '',
      idCardDate: r[28] || '',
      idCardPlace: r[29] || '',
      permanentAddress: r[30] || '',
      currentAddress: r[31] || '',
      personalEmail: r[32] || '',
      emergencyContactName: r[33] || '',
      emergencyContactPhone: r[34] || '',
      emergencyContactRelation: r[35] || '',
      educationLevel: r[36] || 'Đại học',
      major: r[37] || '',
      school: r[38] || '',
      bankAccount: r[39] || '',
      bankAccountHolder: r[40] || (name ? name.toUpperCase() : ''),
      bankName: r[41] || '',
      bankBranch: r[42] || '',
      socialInsuranceNumber: r[43] || '',
      healthInsuranceNumber: r[44] || '',
      taxCode: r[45] || '',
      isActiveAccount: !(r[46] || '').toLowerCase().includes('khoá'),
    };
  }

  // 46-column format (without password)
  let status = 'working';
  const rawStatus = (r[8] || '').toLowerCase();
  if (rawStatus.includes('thử việc') || rawStatus === 'probation') status = 'probation';
  else if (rawStatus.includes('nghỉ việc') || rawStatus === 'resigned') status = 'resigned';
  else if (rawStatus.includes('tạm hoãn') || rawStatus === 'suspended') status = 'suspended';

  const code = r[11] || `emp-${String(idx + 1).padStart(3, '0')}`;
  const name = r[0] || '';

  return {
    id: String(idx + 1),
    code,
    name,
    username: r[1] || '',
    password: '••••••••',
    phone: r[2] || '',
    role: r[3] || 'Nhân viên',
    department: r[4] || 'Phòng Kỹ thuật',
    subDepartment: r[5] || '—',
    email: r[6] || '',
    gender: r[7] === 'Nữ' ? 'Nữ' : 'Nam',
    status,
    createdAt: r[9] || '',
    updatedAt: r[10] || '',
    avatarUrl: r[12] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=1d4ed8&color=fff`,
    dob: r[13] || '',
    maritalStatus: r[14] || 'Độc thân',
    nationality: r[15] || 'Việt Nam',
    ethnicity: r[16] || 'Kinh',
    religion: r[17] || 'Không',
    hometown: r[18] || '',
    rank: Number(r[21]) || 1,
    startDate: r[22] || '',
    officialDate: r[23] || '',
    resignationDate: r[24] || '',
    resignationReason: r[25] || '',
    idCardNumber: r[26] || '',
    idCardDate: r[27] || '',
    idCardPlace: r[28] || '',
    permanentAddress: r[29] || '',
    currentAddress: r[30] || '',
    personalEmail: r[31] || '',
    emergencyContactName: r[32] || '',
    emergencyContactPhone: r[33] || '',
    emergencyContactRelation: r[34] || '',
    educationLevel: r[35] || 'Đại học',
    major: r[36] || '',
    school: r[37] || '',
    bankAccount: r[38] || '',
    bankAccountHolder: r[39] || (name ? name.toUpperCase() : ''),
    bankName: r[40] || '',
    bankBranch: r[41] || '',
    socialInsuranceNumber: r[42] || '',
    healthInsuranceNumber: r[43] || '',
    taxCode: r[44] || '',
    isActiveAccount: !(r[45] || '').toLowerCase().includes('khoá'),
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

  // Write new
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NhanVien!A1:AU${
      rows.length + 1
    }?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [EMPLOYEE_HEADERS_47, ...rows],
      }),
    }
  );

  if (!writeRes.ok) {
    const err = await writeRes.text();
    throw new Error(`Write failed: ${err}`);
  }

  try {
    const tsPath = path.resolve(process.cwd(), 'src/data/employees.ts');
    const sortedForUi = [...employees]
      .sort((a, b) => (b.code || '').localeCompare(a.code || ''))
      .map((e, idx) => ({ ...e, id: e.id || String(idx + 1) }));
    const tsContent = `import { Employee } from '../types/employee';\n\nexport const MOCK_EMPLOYEES: Employee[] = ${JSON.stringify(
      sortedForUi,
      null,
      2
    )};\n`;
    fs.writeFileSync(tsPath, tsContent, 'utf8');
  } catch (e) {
    console.error('Failed to update employees.ts cache:', e);
  }

  return { success: true, count: employees.length };
}

export async function appendEmployeeToSheet(employee) {
  await ensureNhanVienTabExists();
  const token = await getAccessToken();
  const row = employeeTo47Row(employee);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NhanVien!A:AU:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
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

  try {
    const tsPath = path.resolve(process.cwd(), 'src/data/employees.ts');
    const emps = await fetchEmployeesFromSheet();
    const sortedForUi = [...emps]
      .sort((a, b) => (b.code || '').localeCompare(a.code || ''))
      .map((e, idx) => ({ ...e, id: e.id || String(idx + 1) }));
    const tsContent = `import { Employee } from '../types/employee';\n\nexport const MOCK_EMPLOYEES: Employee[] = ${JSON.stringify(
      sortedForUi,
      null,
      2
    )};\n`;
    fs.writeFileSync(tsPath, tsContent, 'utf8');
  } catch (e) {
    console.error('Failed to update employees.ts cache:', e);
  }

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
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NhanVien!A${rowIndex}:AU${rowIndex}?valueInputOption=USER_ENTERED`,
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
];

export function noteToRow(n) {
  const isPinnedText = n.isPinned ? 'Có' : 'Không';
  const tagsText = Array.isArray(n.tags) ? n.tags.join(', ') : n.tags || '';
  const imagesJson = Array.isArray(n.images) ? JSON.stringify(n.images) : n.images || '';
  const attachmentsJson = Array.isArray(n.attachments) ? JSON.stringify(n.attachments) : n.attachments || '';

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
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/GhiChu!A1:T1?valueInputOption=USER_ENTERED`,
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

export async function fetchNotesFromSheet() {
  await ensureGhiChuTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/GhiChu!A2:T`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch sheet data: ${errText}`);
  }

  const data = await res.json();
  const rows = data.values || [];

  return rows
    .filter((r) => r && r[1]) // filter by title
    .map((r, idx) => rowToNote(r, idx));
}

export async function saveAllNotesToSheet(notes) {
  await ensureGhiChuTabExists();
  const token = await getAccessToken();
  const rows = notes.map((n) => noteToRow(n));
  const values = [NOTES_HEADERS, ...rows];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/GhiChu!A1:T${values.length + 50}:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/GhiChu!A1:T${values.length}?valueInputOption=USER_ENTERED`,
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

  return { success: true, count: notes.length };
}

export async function appendNoteToSheet(note) {
  await ensureGhiChuTabExists();
  const token = await getAccessToken();
  const row = noteToRow(note);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/GhiChu!A:T:append?valueInputOption=USER_ENTERED`,
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

  return { success: true };
}

export async function updateNoteInSheet(note) {
  await ensureGhiChuTabExists();
  const token = await getAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/GhiChu!A1:T`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  const rows = data.values || [];

  const targetCode = String(note.code || note.id || '').trim().toLowerCase();
  const targetTitle = String(note.title || '').trim().toLowerCase();

  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    const rowCode = String(rows[i][0] || '').trim().toLowerCase();
    const rowTitle = String(rows[i][1] || '').trim().toLowerCase();
    if ((targetCode && rowCode === targetCode) || (targetTitle && rowTitle === targetTitle)) {
      rowIndex = i + 1; // 1-based index in sheets
      break;
    }
  }

  if (rowIndex === -1) {
    return appendNoteToSheet(note);
  }

  const row = noteToRow(note);
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/GhiChu!A${rowIndex}:T${rowIndex}?valueInputOption=USER_ENTERED`,
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
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/GhiChu!A1:T`,
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

  return { success: true, count: indicesToDelete.length };
}

