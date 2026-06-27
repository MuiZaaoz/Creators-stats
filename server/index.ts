import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
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

initDb();
seed();

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
