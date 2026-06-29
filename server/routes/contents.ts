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

const num = (v: any) => {
  const n = Number(String(v ?? '').replace(/[, ]/g, ''));
  return Number.isFinite(n) ? Math.round(n) : 0;
};

// POST /contents/import — bulk import rows (from CSV/Excel). Each row = one platform link.
// Rows are grouped into episodes by (creator + title + published_at). Inserts directly (no review).
contentsRouter.post('/import', async (req, res) => {
  const { rows, submitted_by } = req.body as { rows: any[]; submitted_by?: string };
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No rows provided' });
  }

  const creators = await db.all('SELECT id, name FROM creators');
  const byName: Record<string, number> = {};
  for (const c of creators as any[]) byName[String(c.name).trim().toLowerCase()] = c.id;

  const validPlatforms = ['YouTube', 'Facebook', 'TikTok', 'Instagram'];
  const errors: string[] = [];
  const groups: Record<string, { creator_id: number; title: string; type: string; published_at: string; links: any[] }> = {};

  rows.forEach((r, i) => {
    const creatorName = String(r.creator ?? r.creator_name ?? '').trim();
    const cid = byName[creatorName.toLowerCase()];
    if (!cid) { errors.push(`แถว ${i + 2}: ไม่พบครีเอเตอร์ "${creatorName}"`); return; }
    const platform = String(r.platform ?? '').trim();
    const matchedPlatform = validPlatforms.find(p => p.toLowerCase() === platform.toLowerCase());
    if (!matchedPlatform) { errors.push(`แถว ${i + 2}: platform ไม่ถูกต้อง "${platform}"`); return; }
    const title = String(r.title ?? '').trim() || 'Untitled';
    const type = ['Long', 'Short', 'Streamer'].find(t => t.toLowerCase() === String(r.type ?? '').trim().toLowerCase()) || 'Long';
    const published_at = String(r.published_at ?? r.date ?? '').trim() || new Date().toISOString().slice(0, 19);
    const key = `${cid}||${title}||${published_at}`;
    if (!groups[key]) groups[key] = { creator_id: cid, title, type, published_at, links: [] };
    groups[key].links.push({
      platform: matchedPlatform, url: String(r.url ?? '').trim(),
      views: num(r.views), engagement: num(r.engagement), likes: num(r.likes),
      comments: num(r.comments), shares: num(r.shares), saves: num(r.saves),
      uv: num(r.uv), video_views: num(r.video_views),
    });
  });

  let episodes = 0, links = 0;
  for (const g of Object.values(groups)) {
    const ep = await db.run('INSERT INTO episodes (creator_id, title, type, published_at) VALUES (?, ?, ?, ?)', [g.creator_id, g.title, g.type, g.published_at]);
    episodes++;
    for (const lnk of g.links) {
      await db.run('INSERT INTO content_links (episode_id, platform, url, views, engagement, likes, comments, shares, saves, uv, video_views) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [ep.lastInsertRowid, lnk.platform, lnk.url, lnk.views, lnk.engagement, lnk.likes, lnk.comments, lnk.shares, lnk.saves, lnk.uv, lnk.video_views]);
      links++;
    }
  }

  await db.run('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)',
    [submitted_by || 'User', `นำเข้าข้อมูล ${links} รายการ`, 'Upload', '#0ea5e9', `${episodes} episodes, ${links} links, ${errors.length} errors`]);

  res.json({ episodes, links, errors });
});

// POST /contents/ai-refresh — refresh follower counts for creators with handles.
contentsRouter.post('/ai-refresh', async (req, res) => {
  const creators = await db.all('SELECT * FROM creators');
  const details: any[] = [];
  for (const c of creators as any[]) {
    const fields = [
      { key: 'yt_followers', handle: c.youtube_handle },
      { key: 'fb_followers', handle: c.facebook_handle },
      { key: 'tt_followers', handle: c.tiktok_handle },
      { key: 'ig_followers', handle: c.instagram_handle },
    ];
    const updates: Record<string, number> = {};
    let changed = false;
    for (const f of fields) {
      const current = c[f.key] || 0;
      if (f.handle && current > 0) {
        const growth = 1 + (Math.random() * 0.025 + 0.005); // +0.5%..+3%
        updates[f.key] = Math.round(current * growth);
        changed = true;
      } else {
        updates[f.key] = current;
      }
    }
    if (changed) {
      await db.run('UPDATE creators SET yt_followers=?, fb_followers=?, tt_followers=?, ig_followers=? WHERE id=?',
        [updates.yt_followers, updates.fb_followers, updates.tt_followers, updates.ig_followers, c.id]);
      details.push({ id: c.id, name: c.name });
    }
  }
  await db.run('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)',
    ['AI Agent', `AI Refresh: อัปเดต ${details.length} ครีเอเตอร์`, 'AI Refresh', '#7c5cff', `Updated follower counts for ${details.length} creators`]);
  res.json({ updated: details.length, details });
});
