import fs from 'fs';
import path from 'path';
import { fetchProposalsFromSheet, fetchEmployeesFromSheet } from '../server/sheetsService.mjs';

async function pullAll() {
  console.log('Fetching latest data from Google Sheets...');

  // 1. Cost Proposals
  const proposals = await fetchProposalsFromSheet();
  const sortedProposals = [...proposals].sort((a, b) => (b.code || '').localeCompare(a.code || ''));
  const proposalsTs = `import { CostProposal } from '../types/cost-proposal';\n\nexport const MOCK_COST_PROPOSALS: CostProposal[] = ${JSON.stringify(sortedProposals, null, 2)};\n`;
  fs.writeFileSync('./src/data/cost-proposals.ts', proposalsTs, 'utf8');
  console.log(`✓ Fetched ${proposals.length} cost proposals and updated src/data/cost-proposals.ts`);

  // 2. Employees
  const employees = await fetchEmployeesFromSheet();
  const sortedEmployees = [...employees].sort((a, b) => (b.code || '').localeCompare(a.code || ''));
  const employeesTs = `import { Employee, VIETNAM_BANKS } from '../types/employee';\nexport { VIETNAM_BANKS };\n\nexport const MOCK_EMPLOYEES: Employee[] = ${JSON.stringify(sortedEmployees, null, 2)};\n`;
  fs.writeFileSync('./src/data/employees.ts', employeesTs, 'utf8');
  console.log(`✓ Fetched ${employees.length} employees and updated src/data/employees.ts`);
}

pullAll().catch(console.error);

