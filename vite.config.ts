import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import {
  fetchProposalsFromSheet,
  saveAllProposalsToSheet,
  appendProposalToSheet,
  fetchEmployeesFromSheet,
  saveAllEmployeesToSheet,
  fetchSystemFromSheet,
} from './server/sheetsService.mjs';

function sheetsApiPlugin(): Plugin {
  return {
    name: 'vite-plugin-google-sheets-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/sheets')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        try {
          // 1. Status endpoint
          if (req.url === '/api/sheets/status' && req.method === 'GET') {
            res.statusCode = 200;
            return res.end(
              JSON.stringify({
                status: 'connected',
                spreadsheetId: '1Cx_84szeCGKoLhCSqumeCzKLCErXg1YStQeI_Lrq4nw',
                sheetTitle: 'H161 react',
                timestamp: new Date().toISOString(),
              })
            );
          }

          // 2. Cost Proposals Endpoints
          if (req.url === '/api/sheets/proposals' && req.method === 'GET') {
            const proposals = await fetchProposalsFromSheet();
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, data: proposals }));
          }

          if (req.url === '/api/sheets/save-all' && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const proposals = parsed.proposals || [];
                const result = await saveAllProposalsToSheet(proposals);
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, count: result.count }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
            return;
          }

          if (req.url === '/api/sheets/proposals' && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const proposal = parsed.proposal || parsed;
                await appendProposalToSheet(proposal);
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, proposal }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
            return;
          }

          // 3. Employees (NhanVien) Endpoints
          if (req.url === '/api/sheets/employees' && req.method === 'GET') {
            const employees = await fetchEmployeesFromSheet();
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, data: employees }));
          }

          if (req.url === '/api/sheets/save-employees' && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const employees = parsed.employees || [];
                const result = await saveAllEmployeesToSheet(employees);
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, count: result.count }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
            return;
          }

          // 4. System (HeThong) Endpoints
          if (req.url === '/api/sheets/system' && req.method === 'GET') {
            const systemModules = await fetchSystemFromSheet();
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, data: systemModules }));
          }

          // Fallthrough
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Endpoint not found' }));
        } catch (err: any) {
          console.error('Sheets API Error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), sheetsApiPlugin()],
});
