import {
  fetchProposalsFromSheet,
  saveAllProposalsToSheet,
  appendProposalToSheet,
  fetchEmployeesFromSheet,
  saveAllEmployeesToSheet,
  fetchSystemFromSheet,
} from '../server/sheetsService.mjs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const urlPath = req.url ? req.url.split('?')[0] : '';
  const action = urlPath.replace(/^\/api\/sheets\/?/, '').replace(/^\/api\/?/, '');

  try {
    if (action === 'status' || action === '') {
      return res.status(200).json({
        status: 'connected',
        spreadsheetId: '1Cx_84szeCGKoLhCSqumeCzKLCErXg1YStQeI_Lrq4nw',
        sheetTitle: 'H161 react',
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'proposals' && req.method === 'GET') {
      const proposals = await fetchProposalsFromSheet();
      return res.status(200).json({ success: true, data: proposals });
    }

    if (action === 'save-all' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const proposals = body.proposals || [];
      const result = await saveAllProposalsToSheet(proposals);
      return res.status(200).json({ success: true, count: result.count });
    }

    if (action === 'proposals' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const proposal = body.proposal || body;
      await appendProposalToSheet(proposal);
      return res.status(200).json({ success: true, proposal });
    }

    if (action === 'employees' && req.method === 'GET') {
      const employees = await fetchEmployeesFromSheet();
      return res.status(200).json({ success: true, data: employees });
    }

    if (action === 'save-employees' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const employees = body.employees || [];
      const result = await saveAllEmployeesToSheet(employees);
      return res.status(200).json({ success: true, count: result.count });
    }

    if (action === 'system' && req.method === 'GET') {
      const systemModules = await fetchSystemFromSheet();
      return res.status(200).json({ success: true, data: systemModules });
    }

    return res.status(404).json({ error: 'Endpoint not found: ' + action });
  } catch (err) {
    console.error('Vercel API error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
