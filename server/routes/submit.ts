import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';

export const submitRouter = Router();

// ---- Admin: manage submit links ----

submitRouter.get('/tokens', async (_req, res) => {
  const rows = await db.all(`
    SELECT st.token, st.label, st.created_at, st.creator_id,
      c.name as creator_name, c.avatar_color
    FROM submit_tokens st
    LEFT JOIN creators c ON st.creator_id = c.id
    ORDER BY st.created_at DESC
  `);
  res.json(rows);
});

submitRouter.post('/tokens', async (req, res) => {
  const { creator_id, label } = req.body;
  const token = crypto.randomBytes(6).toString('base64url');
  await db.run('INSERT INTO submit_tokens (token, creator_id, label) VALUES (?, ?, ?)',
    [token, creator_id || null, label || null]);
  res.json({ token });
});

submitRouter.delete('/tokens/:token', async (req, res) => {
  await db.run('DELETE FROM submit_tokens WHERE token = ?', [req.params.token]);
  res.json({ ok: true });
});

// ---- Public: the submit page uses these (no auth) ----

submitRouter.get('/info/:token', async (req, res) => {
  const t = await db.get('SELECT * FROM submit_tokens WHERE token = ?', [req.params.token]);
  if (!t) return res.status(404).json({ error: 'invalid_token' });
  let creator = null;
  if (t.creator_id) {
    creator = await db.get(`
      SELECT c.id, c.name, c.avatar_color, c.type, p.name as program_name, p.color as program_color
      FROM creators c LEFT JOIN programs p ON c.program_id = p.id WHERE c.id = ?`, [t.creator_id]);
  }
  const creators = t.creator_id ? [] : await db.all(`
    SELECT c.id, c.name FROM creators c ORDER BY c.name`);
  const program = await db.get('SELECT name, color FROM programs ORDER BY id LIMIT 1');
  res.json({ creator, creators, program, label: t.label });
});

submitRouter.post('/entry/:token', async (req, res) => {
  const t = await db.get('SELECT * FROM submit_tokens WHERE token = ?', [req.params.token]);
  if (!t) return res.status(404).json({ error: 'invalid_token' });

  const { creator_id, title, type, links } = req.body;
  const cid = t.creator_id || creator_id;
  if (!cid || !title || !Array.isArray(links) || links.length === 0) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  const creator = await db.get('SELECT id, name FROM creators WHERE id = ?', [cid]);
  if (!creator) return res.status(404).json({ error: 'creator_not_found' });

  const ep = await db.run('INSERT INTO episodes (creator_id, title, type, published_at) VALUES (?, ?, ?, ?)',
    [cid, String(title).slice(0, 200), ['Long', 'Short', 'Streamer'].includes(type) ? type : 'Long',
     new Date().toISOString().slice(0, 19)]);

  for (const lnk of links.slice(0, 8)) {
    if (!['YouTube', 'Facebook', 'TikTok', 'Instagram'].includes(lnk.platform)) continue;
    const likes = Number(lnk.likes) || 0, comments = Number(lnk.comments) || 0;
    const shares = Number(lnk.shares) || 0, saves = Number(lnk.saves) || 0;
    const engagement = likes + comments + shares + saves;
    const row = await db.run(
      `INSERT INTO content_links (episode_id, platform, url, views, engagement, likes, comments, shares, saves, uv, video_views)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [ep.lastInsertRowid, lnk.platform, String(lnk.url || '').slice(0, 500), Number(lnk.views) || 0,
       engagement, likes, comments, shares, saves]
    );
    await db.run('INSERT INTO review_queue (content_link_id, status, submitted_by) VALUES (?, ?, ?)',
      [row.lastInsertRowid, 'pending', `Web Submit — ${creator.name}`]);
  }

  await db.run('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)',
    [creator.name, `ส่งข้อมูลผ่าน Web Submit: ${title}`, 'UPLOAD', '#0ea5e9', `token ${t.token}`]);

  res.json({ ok: true });
});
