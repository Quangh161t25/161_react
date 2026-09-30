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
  fetchTransactionsFromSheet,
  saveAllTransactionsToSheet,
  appendTransactionToSheet,
  updateTransactionInSheet,
  deleteTransactionsFromSheet,
  fetchFinanceCategoriesFromSheet,
  saveAllFinanceCategoriesToSheet,
  appendFinanceCategoryToSheet,
  updateFinanceCategoryInSheet,
  deleteFinanceCategoriesFromSheet,
  fetchFinanceAccountsFromSheet,
  saveAllFinanceAccountsToSheet,
  appendFinanceAccountToSheet,
  updateFinanceAccountInSheet,
  deleteFinanceAccountsFromSheet,
  fetchCounterpartiesFromSheet,
  saveAllCounterpartiesToSheet,
  appendCounterpartyToSheet,
  updateCounterpartyInSheet,
  deleteCounterpartiesFromSheet,
  fetchApprovalThresholdsFromSheet,
  saveAllApprovalThresholdsToSheet,
  appendApprovalThresholdToSheet,
  updateApprovalThresholdInSheet,
  deleteApprovalThresholdsFromSheet,
  fetchTasksFromSheet,
  saveAllTasksToSheet,
  appendTaskToSheet,
  updateTaskInSheet,
  deleteTasksFromSheet,
  fetchProjectsFromSheet,
  saveAllProjectsToSheet,
  appendProjectToSheet,
  updateProjectInSheet,
  deleteProjectsFromSheet,
  fetchWorkflowsFromSheet,
  saveAllWorkflowsToSheet,
  appendWorkflowToSheet,
  updateWorkflowInSheet,
  deleteWorkflowsFromSheet,
  fetchLearningEntriesFromSheet,
  saveAllLearningEntriesToSheet,
  appendLearningEntryToSheet,
  updateLearningEntryInSheet,
  deleteLearningEntriesFromSheet,
} from '../server/sheetsService.mjs';
import { uploadToCatbox } from '../server/catboxService.mjs';

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

    // --- TRANSACTIONS (THU CHI) ---
    if (action === 'transactions' && req.method === 'GET') {
      const transactions = await fetchTransactionsFromSheet();
      return res.status(200).json({ success: true, data: transactions });
    }

    if ((action === 'transactions' || action === 'append-transaction') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const transaction = body.transaction || body;
      await appendTransactionToSheet(transaction);
      return res.status(200).json({ success: true, transaction });
    }

    if ((action === 'transactions' && req.method === 'PUT') || (action === 'update-transaction' && req.method === 'POST')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const transaction = body.transaction || body;
      await updateTransactionInSheet(transaction);
      return res.status(200).json({ success: true, transaction });
    }

    if ((action === 'transactions' && req.method === 'DELETE') || (action === 'delete-transactions' && (req.method === 'POST' || req.method === 'DELETE'))) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const codes = body.codes || (body.code ? [body.code] : (body.identifiers || []));
      const result = await deleteTransactionsFromSheet(codes);
      return res.status(200).json({ success: true, count: result.count });
    }

    if (action === 'save-transactions' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const transactions = body.transactions || [];
      const result = await saveAllTransactionsToSheet(transactions);
      return res.status(200).json({ success: true, count: result.count });
    }

    // --- FINANCE CATEGORIES ---
    if (action === 'finance-categories' && req.method === 'GET') {
      const categories = await fetchFinanceCategoriesFromSheet();
      return res.status(200).json({ success: true, data: categories });
    }

    if ((action === 'finance-categories' || action === 'append-finance-category') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const category = body.category || body;
      await appendFinanceCategoryToSheet(category);
      return res.status(200).json({ success: true, category });
    }

    if ((action === 'finance-categories' && req.method === 'PUT') || (action === 'update-finance-category' && req.method === 'POST')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const category = body.category || body;
      await updateFinanceCategoryInSheet(category);
      return res.status(200).json({ success: true, category });
    }

    if ((action === 'finance-categories' && req.method === 'DELETE') || (action === 'delete-finance-categories' && (req.method === 'POST' || req.method === 'DELETE'))) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const codes = body.codes || (body.code ? [body.code] : (body.identifiers || []));
      const result = await deleteFinanceCategoriesFromSheet(codes);
      return res.status(200).json({ success: true, count: result.count });
    }

    if (action === 'save-finance-categories' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const categories = body.categories || [];
      const result = await saveAllFinanceCategoriesToSheet(categories);
      return res.status(200).json({ success: true, count: result.count });
    }

    // --- FINANCE ACCOUNTS ---
    if (action === 'finance-accounts' && req.method === 'GET') {
      const accounts = await fetchFinanceAccountsFromSheet();
      return res.status(200).json({ success: true, data: accounts });
    }

    if ((action === 'finance-accounts' || action === 'append-finance-account') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const account = body.account || body;
      await appendFinanceAccountToSheet(account);
      return res.status(200).json({ success: true, account });
    }

    if ((action === 'finance-accounts' && req.method === 'PUT') || (action === 'update-finance-account' && req.method === 'POST')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const account = body.account || body;
      await updateFinanceAccountInSheet(account);
      return res.status(200).json({ success: true, account });
    }

    if ((action === 'finance-accounts' && req.method === 'DELETE') || (action === 'delete-finance-accounts' && (req.method === 'POST' || req.method === 'DELETE'))) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const codes = body.codes || (body.code ? [body.code] : (body.identifiers || []));
      const result = await deleteFinanceAccountsFromSheet(codes);
      return res.status(200).json({ success: true, count: result.count });
    }

    if (action === 'save-finance-accounts' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const accounts = body.accounts || [];
      const result = await saveAllFinanceAccountsToSheet(accounts);
      return res.status(200).json({ success: true, count: result.count });
    }

    // --- COUNTERPARTIES ---
    if (action === 'counterparties' && req.method === 'GET') {
      const counterparties = await fetchCounterpartiesFromSheet();
      return res.status(200).json({ success: true, data: counterparties });
    }

    if ((action === 'counterparties' || action === 'append-counterparty') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const counterparty = body.counterparty || body;
      await appendCounterpartyToSheet(counterparty);
      return res.status(200).json({ success: true, counterparty });
    }

    if ((action === 'counterparties' && req.method === 'PUT') || (action === 'update-counterparty' && req.method === 'POST')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const counterparty = body.counterparty || body;
      await updateCounterpartyInSheet(counterparty);
      return res.status(200).json({ success: true, counterparty });
    }

    if ((action === 'counterparties' && req.method === 'DELETE') || (action === 'delete-counterparties' && (req.method === 'POST' || req.method === 'DELETE'))) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const codes = body.codes || (body.code ? [body.code] : (body.identifiers || []));
      const result = await deleteCounterpartiesFromSheet(codes);
      return res.status(200).json({ success: true, count: result.count });
    }

    if (action === 'save-counterparties' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const counterparties = body.counterparties || [];
      const result = await saveAllCounterpartiesToSheet(counterparties);
      return res.status(200).json({ success: true, count: result.count });
    }

    // --- APPROVAL THRESHOLDS ---
    if (action === 'approval-thresholds' && req.method === 'GET') {
      const thresholds = await fetchApprovalThresholdsFromSheet();
      return res.status(200).json({ success: true, data: thresholds });
    }

    if ((action === 'approval-thresholds' || action === 'append-approval-threshold') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const threshold = body.threshold || body;
      await appendApprovalThresholdToSheet(threshold);
      return res.status(200).json({ success: true, threshold });
    }

    if ((action === 'approval-thresholds' && req.method === 'PUT') || (action === 'update-approval-threshold' && req.method === 'POST')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const threshold = body.threshold || body;
      await updateApprovalThresholdInSheet(threshold);
      return res.status(200).json({ success: true, threshold });
    }

    if ((action === 'approval-thresholds' && req.method === 'DELETE') || (action === 'delete-approval-thresholds' && (req.method === 'POST' || req.method === 'DELETE'))) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const codes = body.codes || (body.code ? [body.code] : (body.identifiers || []));
      const result = await deleteApprovalThresholdsFromSheet(codes);
      return res.status(200).json({ success: true, count: result.count });
    }

    if (action === 'save-approval-thresholds' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const thresholds = body.thresholds || [];
      const result = await saveAllApprovalThresholdsToSheet(thresholds);
      return res.status(200).json({ success: true, count: result.count });
    }

    // --- TASKS (CONG VIEC) ---
    if (action === 'tasks' && req.method === 'GET') {
      const tasks = await fetchTasksFromSheet();
      return res.status(200).json({ success: true, data: tasks });
    }

    if ((action === 'tasks' || action === 'append-task') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const task = body.task || body;
      await appendTaskToSheet(task);
      return res.status(200).json({ success: true, task });
    }

    if ((action === 'tasks' && req.method === 'PUT') || (action === 'update-task' && req.method === 'POST')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const task = body.task || body;
      await updateTaskInSheet(task);
      return res.status(200).json({ success: true, task });
    }

    if ((action === 'tasks' && req.method === 'DELETE') || (action === 'delete-tasks' && (req.method === 'POST' || req.method === 'DELETE'))) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const codes = body.codes || (body.code ? [body.code] : (body.identifiers || []));
      const result = await deleteTasksFromSheet(codes);
      return res.status(200).json({ success: true, count: result.count });
    }

    if ((action === 'save-tasks' || action === 'sync-tasks') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const tasks = body.tasks || [];
      const result = await saveAllTasksToSheet(tasks);
      return res.status(200).json({ success: true, count: result.count });
    }

    // --- PROJECTS (DU AN) ---
    if (action === 'projects' && req.method === 'GET') {
      const projects = await fetchProjectsFromSheet();
      return res.status(200).json({ success: true, data: projects });
    }

    if ((action === 'projects' || action === 'append-project') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const project = body.project || body;
      await appendProjectToSheet(project);
      return res.status(200).json({ success: true, project });
    }

    if ((action === 'projects' && req.method === 'PUT') || (action === 'update-project' && req.method === 'POST')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const project = body.project || body;
      await updateProjectInSheet(project);
      return res.status(200).json({ success: true, project });
    }

    if ((action === 'projects' && req.method === 'DELETE') || (action === 'delete-projects' && (req.method === 'POST' || req.method === 'DELETE'))) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const codes = body.codes || (body.code ? [body.code] : (body.identifiers || []));
      const result = await deleteProjectsFromSheet(codes);
      return res.status(200).json({ success: true, count: result.count });
    }

    if ((action === 'save-projects' || action === 'sync-projects') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const projects = body.projects || [];
      const result = await saveAllProjectsToSheet(projects);
      return res.status(200).json({ success: true, count: result.count });
    }

    // --- WORKFLOWS (QUY TRINH) ---
    if (action === 'workflows' && req.method === 'GET') {
      const workflows = await fetchWorkflowsFromSheet();
      return res.status(200).json({ success: true, data: workflows });
    }

    if ((action === 'workflows' || action === 'append-workflow') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const workflow = body.workflow || body;
      await appendWorkflowToSheet(workflow);
      return res.status(200).json({ success: true, workflow });
    }

    if ((action === 'workflows' && req.method === 'PUT') || (action === 'update-workflow' && req.method === 'POST')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const workflow = body.workflow || body;
      await updateWorkflowInSheet(workflow);
      return res.status(200).json({ success: true, workflow });
    }

    if ((action === 'workflows' && req.method === 'DELETE') || (action === 'delete-workflows' && (req.method === 'POST' || req.method === 'DELETE'))) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const codes = body.codes || (body.code ? [body.code] : (body.identifiers || []));
      const result = await deleteWorkflowsFromSheet(codes);
      return res.status(200).json({ success: true, count: result.count });
    }

    if ((action === 'save-workflows' || action === 'sync-workflows') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const workflows = body.workflows || [];
      const result = await saveAllWorkflowsToSheet(workflows);
      return res.status(200).json({ success: true, count: result.count });
    }

    // --- LEARNING / KNOWLEDGE BASE (HOC HOI) ---
    if (action === 'learning' && req.method === 'GET') {
      const entries = await fetchLearningEntriesFromSheet();
      return res.status(200).json({ success: true, data: entries });
    }

    if ((action === 'learning' || action === 'append-learning') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const entry = body.entry || body;
      await appendLearningEntryToSheet(entry);
      return res.status(200).json({ success: true, entry });
    }

    if ((action === 'learning' && req.method === 'PUT') || (action === 'update-learning' && req.method === 'POST')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const entry = body.entry || body;
      await updateLearningEntryInSheet(entry);
      return res.status(200).json({ success: true, entry });
    }

    if ((action === 'learning' && req.method === 'DELETE') || (action === 'delete-learning' && (req.method === 'POST' || req.method === 'DELETE'))) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const codes = body.codes || (body.code ? [body.code] : (body.identifiers || []));
      const result = await deleteLearningEntriesFromSheet(codes);
      return res.status(200).json({ success: true, count: result.count });
    }

    if ((action === 'save-learning' || action === 'sync-learning') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const entries = body.entries || [];
      const result = await saveAllLearningEntriesToSheet(entries);
      return res.status(200).json({ success: true, count: result.count });
    }

    // --- SYSTEM ---
    if (action === 'system' && req.method === 'GET') {
      const systemModules = await fetchSystemFromSheet();
      return res.status(200).json({ success: true, data: systemModules });
    }

    // --- UPLOAD FILE / IMAGE TO CATBOX ---
    if ((action === 'upload' || action === 'upload-image') && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const { base64, filename, mimeType } = body;
      if (!base64) {
        return res.status(400).json({ success: false, error: 'Missing base64 data for upload' });
      }
      const url = await uploadToCatbox({ base64, filename, mimeType });
      return res.status(200).json({ success: true, url });
    }

    return res.status(404).json({ error: 'Endpoint not found: ' + action });
  } catch (err) {
    console.error('Vercel API error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
