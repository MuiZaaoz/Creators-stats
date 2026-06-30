import { Router } from 'express';
import { db } from '../db.js';

export const aiRouter = Router();

const REFRESH_INTERVAL_HOURS = 6;

function nextRun(): string {
  const now = new Date();
  const next = new Date(now);
  const h = now.getUTCHours();
  const nextSlot = (Math.floor(h / REFRESH_INTERVAL_HOURS) + 1) * REFRESH_INTERVAL_HOURS;
  next.setUTCHours(nextSlot, 0, 0, 0);
  return next.toISOString();
}

function total(c: any): number {
  return (c.yt_followers || 0) + (c.fb_followers || 0) + (c.tt_followers || 0) + (c.ig_followers || 0);
}

async function listWithRefresh() {
  const creators = await db.all(`
    SELECT c.*, p.name as program_name, p.color as program_color
    FROM creators c LEFT JOIN programs p ON c.program_id = p.id
    ORDER BY c.name
  `);
  return (creators as any[]).map((c) => {
    const current = total(c);
    const prev = c.prev_followers || current;
    return {
      id: c.id,
      name: c.name,
      avatar_color: c.avatar_color,
      program_name: c.program_name,
      old_followers: prev,
      new_followers: current,
      diff: current - prev,
      last_refreshed: c.last_refreshed,
      status: c.last_refreshed ? 'updated' : 'idle',
    };
  });
}

aiRouter.get('/status', async (_req, res) => {
  const list = await listWithRefresh();
  const refreshed = list.filter((c) => c.last_refreshed).length;
  const successRate = list.length ? (refreshed / list.length) * 100 : 0;
  res.json({
    online: true,
    interval_hours: REFRESH_INTERVAL_HOURS,
    next_run: nextRun(),
    success_rate: successRate,
    creators: list,
  });
});

async function refreshCreator(id: number) {
  const c: any = await db.get('SELECT * FROM creators WHERE id=?', [id]);
  if (!c) return;
  const oldTotal = total(c);
  // Simulate an AI-fetched growth: +0.5%..+3% per platform.
  const bump = (n: number) => Math.round((n || 0) * (1 + (Math.random() * 0.025 + 0.005)));
  const yt = bump(c.yt_followers), fb = bump(c.fb_followers), tt = bump(c.tt_followers), ig = bump(c.ig_followers);
  await db.run(
    'UPDATE creators SET yt_followers=?, fb_followers=?, tt_followers=?, ig_followers=?, prev_followers=?, last_refreshed=datetime(\'now\') WHERE id=?',
    [yt, fb, tt, ig, oldTotal, id]
  );
}

aiRouter.post('/refresh', async (req, res) => {
  const { id } = req.body || {};
  if (id) {
    await refreshCreator(Number(id));
    await db.run('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)',
      ['AI Agent', 'อัปเดตข้อมูลครีเอเตอร์ (AI)', 'AI Refresh', '#7c5cff', `Creator ID ${id}`]);
  } else {
    const creators = await db.all('SELECT id FROM creators');
    for (const c of creators as any[]) await refreshCreator(c.id);
    await db.run('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)',
      ['AI Agent', 'อัปเดตข้อมูลทั้งหมด (AI Refresh)', 'AI Refresh', '#7c5cff', `${(creators as any[]).length} creators`]);
  }
  res.json({ ok: true, creators: await listWithRefresh() });
});
