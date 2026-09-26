import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function sheetsApiPlugin(): Plugin {
  return {
    name: 'vite-plugin-google-sheets-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api')) {
          return next();
        }

        // Add compatibility helpers for Vercel serverless function signature
        if (!res.status) {
          (res as any).status = function (statusCode: number) {
            this.statusCode = statusCode;
            return this;
          };
        }
        if (!res.json) {
          (res as any).json = function (data: any) {
            this.setHeader('Content-Type', 'application/json');
            this.end(JSON.stringify(data));
            return this;
          };
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            (req as any).body = body ? JSON.parse(body) : {};
          } catch {
            (req as any).body = body;
          }

          try {
            const sheetsHandler = (await import('./api/sheets.js')).default;
            await sheetsHandler(req as any, res as any);
          } catch (err: any) {
            console.error('API middleware error:', err);
            if (!res.writableEnded) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          }
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), sheetsApiPlugin()],
});
