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

// Public self-submission (no auth, no creator list exposed). The submitter
// types their own creator name; we find-or-create it, then queue for review.
contentsRouter.post('/submit', async (req, res) => {
  const { creator_name, title, type, published_at, links } = req.body;
  if (!creator_name || !String(creator_name).trim() || !title || !String(title).trim()) {
    return res.status(400).json({ error: 'creator_name and title are required' });
  }
  const name = String(creator_name).trim();

  let creator = await db.get('SELECT id FROM creators WHERE name = ?', [name]);
  let creatorId: number;
  if (creator) {
    creatorId = creator.id;
  } else {
    const prog = await db.get('SELECT id FROM programs ORDER BY id LIMIT 1');
    const palette = ['#7c5cff', '#5b5bd6', '#f97316', '#22c55e', '#06b6d4', '#ec4899', '#ef4444', '#eab308'];
    const color = palette[Math.floor(Math.random() * palette.length)];
    const r = await db.run('INSERT INTO creators (name, type, program_id, avatar_color) VALUES (?, ?, ?, ?)',
      [name, type || 'Long', prog ? prog.id : null, color]);
    creatorId = r.lastInsertRowid;
  }

  const ep = await db.run('INSERT INTO episodes (creator_id, title, type, published_at) VALUES (?, ?, ?, ?)',
    [creatorId, title, type || 'Long', published_at]);
  const epId = ep.lastInsertRowid;
  for (const lnk of (links || [])) {
    const linkRow = await db.run('INSERT INTO content_links (episode_id, platform, url, views, engagement, likes, comments, shares, saves) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [epId, lnk.platform, lnk.url || '', lnk.views || 0, lnk.engagement || 0, lnk.likes || 0, lnk.comments || 0, lnk.shares || 0, lnk.saves || 0]);
    await db.run('INSERT INTO review_queue (content_link_id, status, submitted_by) VALUES (?, ?, ?)', [linkRow.lastInsertRowid, 'pending', name]);
  }
  await db.run('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)',
    [name, `ส่งข้อมูลผ่าน Web Submit: ${title}`, 'Web Submit', '#7c5cff', `${(links || []).length} platforms`]);
  res.json({ ok: true, id: epId });
});

// Bulk import from an uploaded Excel/CSV (rows already parsed on the client).
// Each row = one content link; grouped into an episode per (creator + title).
contentsRouter.post('/import', async (req, res) => {
  const rows: any[] = req.body.rows || [];
  const submittedBy = req.body.submitted_by || 'Upload';
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No rows to import' });
  }

  const prog = await db.get('SELECT id FROM programs ORDER BY id LIMIT 1');
  const creatorCache: Record<string, number> = {};
  const episodeCache: Record<string, number> = {};
  let imported = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const name = String(r.creator_name || r.creator || '').trim();
    const title = String(r.title || '').trim();
    const platform = String(r.platform || '').trim();
    if (!name || !title || !platform) {
      errors.push(`แถว ${i + 1}: ขาด creator/title/platform`);
      continue;
    }

    // find-or-create creator
    let creatorId = creatorCache[name];
    if (!creatorId) {
      const existing = await db.get('SELECT id FROM creators WHERE name = ?', [name]);
      if (existing) creatorId = existing.id;
      else {
        const cr = await db.run('INSERT INTO creators (name, type, program_id, avatar_color) VALUES (?, ?, ?, ?)',
          [name, r.type || 'Long', prog ? prog.id : null, '#7c5cff']);
        creatorId = cr.lastInsertRowid;
      }
      creatorCache[name] = creatorId;
    }

    // find-or-create episode (per creator+title)
    const epKey = creatorId + '|' + title;
    let epId = episodeCache[epKey];
    if (!epId) {
      const ep = await db.run('INSERT INTO episodes (creator_id, title, type, published_at) VALUES (?, ?, ?, ?)',
        [creatorId, title, r.type || 'Long', r.published_at || new Date().toISOString()]);
      epId = ep.lastInsertRowid;
      episodeCache[epKey] = epId;
    }

    const link = await db.run('INSERT INTO content_links (episode_id, platform, url, views, engagement, likes, comments, shares, saves) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [epId, platform, r.url || '', Number(r.views) || 0, Number(r.engagement) || 0, Number(r.likes) || 0, Number(r.comments) || 0, Number(r.shares) || 0, Number(r.saves) || 0]);
    await db.run('INSERT INTO review_queue (content_link_id, status, submitted_by) VALUES (?, ?, ?)', [link.lastInsertRowid, 'pending', submittedBy]);
    imported++;
  }

  await db.run('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)',
    [submittedBy, `นำเข้าข้อมูล ${imported} รายการ`, 'Upload', '#0ea5e9', `${rows.length} rows, ${errors.length} errors`]);
  res.json({ imported, total: rows.length, errors });
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
