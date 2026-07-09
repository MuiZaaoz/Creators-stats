import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb, db } from './db.js';
import { seed } from './seed.js';
import { programsRouter } from './routes/programs.js';
import { creatorsRouter } from './routes/creators.js';
import { contentsRouter } from './routes/contents.js';
import { gamesRouter } from './routes/games.js';
import { rewardsRouter } from './routes/rewards.js';
import { analyticsRouter } from './routes/analytics.js';
import { auditRouter } from './routes/audit.js';
import { usersRouter } from './routes/users.js';
import { exportRouter } from './routes/export.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/programs', programsRouter);
app.use('/api/creators', creatorsRouter);
app.use('/api/contents', contentsRouter);
app.use('/api/games', gamesRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/users', usersRouter);
app.use('/api/export', exportRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Serve the built frontend (production). Vite outputs to ../dist.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// One-time data import: when IMPORT_DATA=true, run import.sql (repo root) via the
// app's own libsql connection (handles multi-statement correctly, unlike the web console).
async function runImport() {
  const sqlPath = path.join(__dirname, '..', 'import.sql');
  if (!fs.existsSync(sqlPath)) {
    console.log('IMPORT_DATA=true but import.sql not found at ' + sqlPath);
    return;
  }
  console.log('Running import.sql ...');
  const raw = fs.readFileSync(sqlPath, 'utf8');
  // Drop transaction/PRAGMA wrapper lines; statements are already in FK-safe order.
  const statements = raw
    .split('\n')
    .filter((l) => {
      const t = l.trim().toUpperCase();
      return t && !t.startsWith('PRAGMA') && !t.startsWith('BEGIN') && !t.startsWith('COMMIT') && !t.startsWith('--');
    })
    .join('\n');
  await db.exec(statements);
  const n = await db.get('SELECT COUNT(*) as n FROM creators');
  console.log(`Import complete: ${n ? n.n : 0} creators loaded`);
}

const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback: serve index.html for any non-API GET route
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

const PORT = process.env.PORT || 3001;

async function start() {
  await initDb();
  // One-time real-data import from import.sql (set IMPORT_DATA=true, then remove after it runs).
  if (process.env.IMPORT_DATA === 'true') {
    await runImport();
  }
  // Sample data is only inserted when SEED_SAMPLE_DATA=true (off by default).
  if (process.env.SEED_SAMPLE_DATA === 'true') {
    await seed();
  }
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
