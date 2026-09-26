import {
  fetchProposalsFromSheet,
  saveAllProposalsToSheet,
  appendProposalToSheet,
  updateProposalInSheet,
  deleteProposalsFromSheet,
  fetchEmployeesFromSheet,
  saveAllEmployeesToSheet,
  appendEmployeeToSheet,
  updateEmployeeInSheet,
  deleteEmployeesFromSheet,
  fetchSystemFromSheet,
  fetchNotesFromSheet,
  saveAllNotesToSheet,
  appendNoteToSheet,
  updateNoteInSheet,
  deleteNotesFromSheet,
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

    // --- PROPOSALS ---
    if (action === 'proposals' && req.method === 'GET') {
      const proposals = await fetchProposalsFromSheet();
      return res.status(200).json({ success: true, data: proposals });
    }

    if ((action === 'proposals' || action === 'append-proposal') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const proposal = body.proposal || body;
      await appendProposalToSheet(proposal);
      return res.status(200).json({ success: true, proposal });
    }

    if ((action === 'proposals' && req.method === 'PUT') || (action === 'update-proposal' && req.method === 'POST')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const proposal = body.proposal || body;
      await updateProposalInSheet(proposal);
      return res.status(200).json({ success: true, proposal });
    }

    if ((action === 'proposals' && req.method === 'DELETE') || (action === 'delete-proposals' && (req.method === 'POST' || req.method === 'DELETE'))) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const codes = body.codes || (body.code ? [body.code] : []);
      const result = await deleteProposalsFromSheet(codes);
      return res.status(200).json({ success: true, count: result.count });
    }

    if (action === 'save-all' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const proposals = body.proposals || [];
      const result = await saveAllProposalsToSheet(proposals);
      return res.status(200).json({ success: true, count: result.count });
    }

    // --- EMPLOYEES ---
    if (action === 'employees' && req.method === 'GET') {
      const employees = await fetchEmployeesFromSheet();
      return res.status(200).json({ success: true, data: employees });
    }

    if ((action === 'employees' || action === 'append-employee') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const employee = body.employee || body;
      await appendEmployeeToSheet(employee);
      return res.status(200).json({ success: true, employee });
    }

    if ((action === 'employees' && req.method === 'PUT') || (action === 'update-employee' && req.method === 'POST')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const employee = body.employee || body;
      await updateEmployeeInSheet(employee);
      return res.status(200).json({ success: true, employee });
    }

    if ((action === 'employees' && req.method === 'DELETE') || (action === 'delete-employees' && (req.method === 'POST' || req.method === 'DELETE'))) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const codes = body.codes || (body.code ? [body.code] : (body.identifiers || []));
      const result = await deleteEmployeesFromSheet(codes);
      return res.status(200).json({ success: true, count: result.count });
    }

    if (action === 'save-employees' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const employees = body.employees || [];
      const result = await saveAllEmployeesToSheet(employees);
      return res.status(200).json({ success: true, count: result.count });
    }

    // --- NOTES ---
    if (action === 'notes' && req.method === 'GET') {
      const notes = await fetchNotesFromSheet();
      return res.status(200).json({ success: true, data: notes });
    }

    if ((action === 'notes' || action === 'append-note') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const note = body.note || body;
      await appendNoteToSheet(note);
      return res.status(200).json({ success: true, note });
    }

    if ((action === 'notes' && req.method === 'PUT') || (action === 'update-note' && req.method === 'POST')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const note = body.note || body;
      await updateNoteInSheet(note);
      return res.status(200).json({ success: true, note });
    }

    if ((action === 'notes' && req.method === 'DELETE') || (action === 'delete-notes' && (req.method === 'POST' || req.method === 'DELETE'))) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const codes = body.codes || (body.code ? [body.code] : (body.identifiers || []));
      const result = await deleteNotesFromSheet(codes);
      return res.status(200).json({ success: true, count: result.count });
    }

    if (action === 'save-notes' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const notes = body.notes || [];
      const result = await saveAllNotesToSheet(notes);
      return res.status(200).json({ success: true, count: result.count });
    }

    // --- SYSTEM ---
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
