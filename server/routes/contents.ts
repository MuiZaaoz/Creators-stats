import { Router } from 'express';
import { db } from '../db.js';

export const contentsRouter = Router();

contentsRouter.get('/', (req, res) => {
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
  res.json(db.prepare(q).all(...params));
});

contentsRouter.post('/episodes', (req, res) => {
  const { creator_id, title, type, published_at, links } = req.body;
  const ep = db.prepare('INSERT INTO episodes (creator_id, title, type, published_at) VALUES (?, ?, ?, ?)').run(creator_id, title, type, published_at);
  const epId = ep.lastInsertRowid;
  for (const lnk of (links || [])) {
    db.prepare('INSERT INTO content_links (episode_id, platform, url, views, engagement, likes, comments, shares, saves, uv, video_views) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(epId, lnk.platform, lnk.url, lnk.views || 0, lnk.engagement || 0, lnk.likes || 0, lnk.comments || 0, lnk.shares || 0, lnk.saves || 0, lnk.uv || 0, lnk.video_views || 0);
    // Add to review queue
    const linkId = (db.prepare('SELECT last_insert_rowid() as id').get() as any).id;
    db.prepare('INSERT INTO review_queue (content_link_id, status, submitted_by) VALUES (?, ?, ?)').run(linkId, 'pending', req.body.submitted_by || 'Unknown');
  }
  // Log
  db.prepare('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)').run(req.body.submitted_by || 'User', `ส่งข้อมูล ${title}`, 'Upload', '#0ea5e9', `Creator ID ${creator_id}, ${(links || []).length} platforms`);
  res.json({ id: epId });
});

contentsRouter.put('/links/:id', (req, res) => {
  const { url, views, engagement, likes, comments, shares, saves, uv, video_views } = req.body;
  db.prepare('UPDATE content_links SET url=?, views=?, engagement=?, likes=?, comments=?, shares=?, saves=?, uv=?, video_views=? WHERE id=?').run(url, views, engagement, likes, comments, shares, saves, uv, video_views, req.params.id);
  db.prepare('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)').run(req.body.edited_by || 'User', 'แก้ไขข้อมูลคอนเทนต์', 'แก้ไข', '#f59e0b', `Link ID ${req.params.id}`);
  res.json({ ok: true });
});

contentsRouter.get('/review', (_req, res) => {
  const items = db.prepare(`
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
  `).all();
  res.json(items);
});

contentsRouter.put('/review/:id', (req, res) => {
  const { status, reviewed_by, notes } = req.body;
  db.prepare('UPDATE review_queue SET status=?, reviewed_by=?, notes=?, reviewed_at=datetime("now") WHERE id=?').run(status, reviewed_by, notes, req.params.id);
  const tag = status === 'approved' ? 'อนุมัติ' : 'ตีกลับ';
  const color = status === 'approved' ? '#16a34a' : '#ef4444';
  db.prepare('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)').run(reviewed_by || 'Editor', `${tag} รายการ #${req.params.id}`, tag, color, notes || '');
  res.json({ ok: true });
});
