import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { 
  initDataService, 
  getSummary, 
  getFilteredDashboardData, 
  queryTableData, 
  exportCsvData 
} from './server/dataService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize official DOSM data
  try {
    await initDataService();
  } catch (err: any) {
    console.error('Pemberitahuan inisialisasi data:', err.message);
  }

  // --- API Endpoints ---
  // 1. Data summary & schema
  app.get('/api/summary', (req: Request, res: Response) => {
    try {
      const summary = getSummary();
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal mendapatkan ringkasan data' });
    }
  });

  // 2. Filtered Dashboard Data (KPI, Trend, State Breakdown, Age Structure)
  app.get('/api/dashboard', (req: Request, res: Response) => {
    try {
      const { year, state, sex, age, ethnicity } = req.query;
      const data = getFilteredDashboardData({
        year: year ? Number(year) : undefined,
        state: state as string,
        sex: sex as string,
        age: age as string,
        ethnicity: ethnicity as string
      });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memproses data dashboard' });
    }
  });

  // 3. Paginated & Filtered Table Data
  app.get('/api/table', (req: Request, res: Response) => {
    try {
      const { year, state, sex, age, ethnicity, search, page, limit, sortBy, sortDir } = req.query;
      const tableData = queryTableData({
        year: year ? Number(year) : undefined,
        state: state as string,
        sex: sex as string,
        age: age as string,
        ethnicity: ethnicity as string,
        search: search as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sortBy: sortBy as string,
        sortDir: (sortDir as 'asc' | 'desc') || 'desc'
      });
      res.json(tableData);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memproses data jadual' });
    }
  });

  // 4. Download CSV endpoint
  app.get('/api/download-csv', (req: Request, res: Response) => {
    try {
      const { year, state, sex, age, ethnicity, full } = req.query;
      const isFull = full === 'true' || full === '1';
      const csv = exportCsvData({
        year: year ? Number(year) : undefined,
        state: state as string,
        sex: sex as string,
        age: age as string,
        ethnicity: ethnicity as string
      }, isFull);

      const filename = isFull 
        ? 'populasi_malaysia_penuh_dosm.csv' 
        : `populasi_malaysia_${state || 'semua'}_${year || 'terkini'}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat turun CSV' });
    }
  });

  // 5. Refresh dataset endpoint
  app.post('/api/refresh', async (req: Request, res: Response) => {
    try {
      await initDataService();
      res.json({ success: true, message: 'Dataset berjaya dikemas kini dari DOSM.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal mengemas kini dataset' });
    }
  });

  // --- Frontend Serving ---
  if (!isProd) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      // In dev fallback
      const vite = await createViteServer({
        server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pelayan beroperasi di http://0.0.0.0:${PORT}`);
  });
}

startServer();
