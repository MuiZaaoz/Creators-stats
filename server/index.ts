import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';
import { migrateAndSeed } from './seed.js';
import { programsRouter } from './routes/programs.js';
import { creatorsRouter } from './routes/creators.js';
import { contentsRouter } from './routes/contents.js';
import { gamesRouter } from './routes/games.js';
import { rewardsRouter } from './routes/rewards.js';
import { analyticsRouter } from './routes/analytics.js';
import { auditRouter } from './routes/audit.js';
import { usersRouter } from './routes/users.js';
import { exportRouter } from './routes/export.js';
import { aiRouter } from './routes/ai.js';
import { submitRouter } from './routes/submit.js';

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
app.use('/api/ai', aiRouter);
app.use('/api/submit', submitRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Serve the built frontend (production). Vite outputs to ../dist.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
  await migrateAndSeed();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
