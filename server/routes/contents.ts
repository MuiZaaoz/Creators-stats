import { Router } from 'express';
import { db } from '../db.js';

export const contentsRouter = Router();

contentsRouter.get('/', async (req, res) => {
  const { program_id, creator_id, platform, type, limit = 30 } = req.query;
  let q = `
    SELECT cl.*, e.title, e.type as content_type, e.published_at,
      c.id as creator_id, c.name as creator_name, c.avatar_color,
      p.id as program_id, p.name as program_name, p.color as program_color
    FROM content_links cl
    JOIN episodes e ON cl.episode_id = e.id
    JOIN creators c ON e.creator_id = c.id
    JOIN programs p ON c.program_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (program_id) { q += ' AND p.id = ?'; params.push(program_id); }
  if (creator_id) { q += ' AND c.id = ?'; params.push(creator_id); }
  if (platform) { q += ' AND cl.platform = ?'; params.push(platform); }
  if (type) { q += ' AND e.type = ?'; params.push(type); }
  q += ' ORDER BY cl.views DESC LIMIT ?';
  params.push(Number(limit));
  res.json(await db.all(q, params));
});

contentsRouter.post('/episodes', async (req, res) => {
  const { creator_id, title, type, published_at, links } = req.body;
  const ep = await db.run('INSERT INTO episodes (creator_id, title, type, published_at) VALUES (?, ?, ?, ?)', [creator_id, title, type, published_at]);
  const epId = ep.lastInsertRowid;
  for (const lnk of (links || [])) {
    const linkRow = await db.run('INSERT INTO content_links (episode_id, platform, url, views, engagement, likes, comments, shares, saves, uv, video_views) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [epId, lnk.platform, lnk.url, lnk.views || 0, lnk.engagement || 0, lnk.likes || 0, lnk.comments || 0, lnk.shares || 0, lnk.saves || 0, lnk.uv || 0, lnk.video_views || 0]);
    await db.run('INSERT INTO review_queue (content_link_id, status, submitted_by) VALUES (?, ?, ?)', [linkRow.lastInsertRowid, 'pending', req.body.submitted_by || 'Unknown']);
  }
  await db.run('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)', [req.body.submitted_by || 'User', `ส่งข้อมูล ${title}`, 'Upload', '#0ea5e9', `Creator ID ${creator_id}, ${(links || []).length} platforms`]);
  res.json({ id: epId });
});

contentsRouter.put('/links/:id', async (req, res) => {
  const { url, views, engagement, likes, comments, shares, saves, uv, video_views } = req.body;
  await db.run('UPDATE content_links SET url=?, views=?, engagement=?, likes=?, comments=?, shares=?, saves=?, uv=?, video_views=? WHERE id=?',
    [url, views, engagement, likes, comments, shares, saves, uv, video_views, req.params.id]);
  await db.run('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)', [req.body.edited_by || 'User', 'แก้ไขข้อมูลคอนเทนต์', 'แก้ไข', '#f59e0b', `Link ID ${req.params.id}`]);
  res.json({ ok: true });
});

contentsRouter.get('/review', async (_req, res) => {
  const items = await db.all(`
    SELECT rq.*, cl.platform, cl.url, cl.views, cl.engagement, cl.likes, cl.comments, cl.shares, cl.saves, cl.uv, cl.video_views,
      e.title, e.type as content_type, e.published_at,
      c.name as creator_name, c.avatar_color,
      p.name as program_name
    FROM review_queue rq
    JOIN content_links cl ON rq.content_link_id = cl.id
    JOIN episodes e ON cl.episode_id = e.id
    JOIN creators c ON e.creator_id = c.id
    JOIN programs p ON c.program_id = p.id
    ORDER BY rq.created_at DESC
  `);
  res.json(items);
});

contentsRouter.put('/review/:id', async (req, res) => {
  const { status, reviewed_by, notes } = req.body;
  await db.run(`UPDATE review_queue SET status=?, reviewed_by=?, notes=?, reviewed_at=datetime('now') WHERE id=?`, [status, reviewed_by, notes, req.params.id]);
  const tag = status === 'approved' ? 'อนุมัติ' : 'ตีกลับ';
  const color = status === 'approved' ? '#16a34a' : '#ef4444';
  await db.run('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)', [reviewed_by || 'Editor', `${tag} รายการ #${req.params.id}`, tag, color, notes || '']);
  res.json({ ok: true });
});
