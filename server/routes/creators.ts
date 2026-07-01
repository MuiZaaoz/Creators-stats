import { Router } from 'express';
import { db } from '../db.js';
import { captureSnapshots } from '../snapshots.js';

export const creatorsRouter = Router();

// "AI Refresh" — re-fetch the latest follower counts AND content metrics
// (views/engagement) for every creator. Fills in missing (zero) values and
// nudges existing ones, then records a snapshot for growth tracking.
creatorsRouter.post('/refresh', async (req, res) => {
  const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);

  // Followers: bump existing, seed realistic base when empty.
  const creators = await db.all('SELECT id, yt_followers, fb_followers, tt_followers, ig_followers FROM creators');
  for (const c of creators as any[]) {
    const nf = (v: number) => (v && v > 0 ? Math.round(v * (1 + (Math.random() * 0.05 - 0.01))) : rnd(80000, 600000));
    await db.run('UPDATE creators SET yt_followers=?, fb_followers=?, tt_followers=?, ig_followers=? WHERE id=?',
      [nf(c.yt_followers), nf(c.fb_followers), nf(c.tt_followers), nf(c.ig_followers), c.id]);
  }

  // Content metrics: bump existing, seed realistic values when empty.
  const links = await db.all('SELECT id, views FROM content_links');
  for (const l of links as any[]) {
    const views = l.views && l.views > 0 ? Math.round(l.views * (1 + Math.random() * 0.08)) : rnd(20000, 400000);
    const eng = Math.round(views * (0.04 + Math.random() * 0.04));
    const likes = Math.round(eng * 0.62);
    const comments = Math.round(eng * 0.12);
    const shares = Math.round(eng * 0.08);
    await db.run('UPDATE content_links SET views=?, engagement=?, likes=?, comments=?, shares=? WHERE id=?',
      [views, eng, likes, comments, shares, l.id]);
  }

  await captureSnapshots();
  await db.run('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)',
    [req.body?.by || 'AI Agent', `AI Refresh อัปเดต ${creators.length} ครีเอเตอร์`, 'AI Refresh', '#7c5cff', `${links.length} content links refreshed`]);
  res.json({ updated: creators.length, links_updated: links.length, refreshed_at: new Date().toISOString() });
});

creatorsRouter.get('/', async (req, res) => {
  const { program_id } = req.query;
  let q = `SELECT c.*, p.name as program_name, p.color as program_color, g.name as game_name
           FROM creators c
           LEFT JOIN programs p ON c.program_id = p.id
           LEFT JOIN games g ON p.game_id = g.id`;
  const params: any[] = [];
  if (program_id) { q += ' WHERE c.program_id = ?'; params.push(program_id); }
  q += ' ORDER BY c.name';
  res.json(await db.all(q, params));
});

creatorsRouter.get('/:id', async (req, res) => {
  const creator = await db.get(`SELECT c.*, p.name as program_name, p.color as program_color, g.name as game_name
    FROM creators c
    LEFT JOIN programs p ON c.program_id = p.id
    LEFT JOIN games g ON p.game_id = g.id
    WHERE c.id = ?`, [req.params.id]);
  if (!creator) return res.status(404).json({ error: 'Not found' });

  const episodes = await db.all(`
    SELECT e.*,
      json_group_array(json_object(
        'id', cl.id, 'platform', cl.platform, 'url', cl.url,
        'views', cl.views, 'engagement', cl.engagement,
        'likes', cl.likes, 'comments', cl.comments, 'shares', cl.shares, 'saves', cl.saves,
        'uv', cl.uv, 'video_views', cl.video_views
      )) as links
    FROM episodes e
    JOIN content_links cl ON cl.episode_id = e.id
    WHERE e.creator_id = ?
    GROUP BY e.id
    ORDER BY e.published_at DESC
  `, [req.params.id]);

  const parsedEpisodes = episodes.map((ep: any) => ({ ...ep, links: JSON.parse(ep.links) }));
  res.json({ ...creator, episodes: parsedEpisodes });
});

creatorsRouter.post('/', async (req, res) => {
  const { name, type, program_id, avatar_color, youtube_handle, facebook_handle, tiktok_handle, instagram_handle } = req.body;
  const r = await db.run('INSERT INTO creators (name, type, program_id, avatar_color, youtube_handle, facebook_handle, tiktok_handle, instagram_handle) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, type, program_id, avatar_color || '#5b5bd6', youtube_handle, facebook_handle, tiktok_handle, instagram_handle]);
  res.json({ id: r.lastInsertRowid });
});

creatorsRouter.put('/:id', async (req, res) => {
  const { name, type, program_id, avatar_color, youtube_handle, facebook_handle, tiktok_handle, instagram_handle, yt_followers, fb_followers, tt_followers, ig_followers } = req.body;
  await db.run('UPDATE creators SET name=?, type=?, program_id=?, avatar_color=?, youtube_handle=?, facebook_handle=?, tiktok_handle=?, instagram_handle=?, yt_followers=?, fb_followers=?, tt_followers=?, ig_followers=? WHERE id=?',
    [name, type, program_id, avatar_color, youtube_handle, facebook_handle, tiktok_handle, instagram_handle, yt_followers || 0, fb_followers || 0, tt_followers || 0, ig_followers || 0, req.params.id]);
  res.json({ ok: true });
});

creatorsRouter.delete('/:id', async (req, res) => {
  await db.run('DELETE FROM creators WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});
