import fs from 'fs';
import crypto from 'crypto';

const SPREADSHEET_ID = '1Cx_84szeCGKoLhCSqumeCzKLCErXg1YStQeI_Lrq4nw';

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
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

async function pullAll() {
  const creds = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));
  console.log('Fetching latest data from Google Sheets (ID:', SPREADSHEET_ID, ')...');
  const token = await getAccessToken(creds);

  // 1. Pull "DeXuatChiPhi"
  const dxRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/DeXuatChiPhi!A2:O`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const dxData = await dxRes.json();
  const proposals = (dxData.values || []).map((row, idx) => {
    let lineItems = [];
    try {
      if (row[14]) lineItems = JSON.parse(row[14]);
    } catch {
      lineItems = [];
    }

    const approvalStatus = row[11] === 'Đã duyệt' ? 'approved' : row[11] === 'Từ chối' ? 'rejected' : 'pending';

    return {
      id: String(idx + 1),
      code: row[0] || `DX-${idx + 1}`,
      title: row[1] || '',
      proposalDate: row[2] || '',
      dueDate: row[3] || '',
      proposer: row[4] || '',
      department: row[5] || '',
      account: row[6] || '',
      beneficiary: row[7] || '',
      amount: Number(row[8]) || 0,
      isOverBudget: row[9] === 'Có',
      overBudgetReason: row[10] || '',
      approvalStatus,
      status: row[12] === 'Đã duyệt' ? 'approved' : 'draft',
      reason: row[13] || '',
      updatedAt: row[2] || '',
      lineItems
    };
  });

  console.log(`✓ Fetched ${proposals.length} cost proposals from Google Sheets.`);

  // Write updated data to src/data/cost-proposals.ts
  const tsContent = `import { CostProposal } from '../types/cost-proposal';

export const MOCK_COST_PROPOSALS: CostProposal[] = ${JSON.stringify(proposals, null, 2)};
`;
  fs.writeFileSync('./src/data/cost-proposals.ts', tsContent, 'utf8');
  console.log('✓ Updated "src/data/cost-proposals.ts" with live Google Sheets data!');
}

pullAll().catch(console.error);
