import { Router } from 'express';
import { db } from '../db.js';

export const exportRouter = Router();

exportRouter.post('/', (req, res) => {
  const { fields = [], program_id, creator_id, platform, type, limit = 1000 } = req.body;

  const allFields: Record<string, string> = {
    creator_name: 'c.name as creator_name',
    creator_type: 'c.type as creator_type',
    program_name: 'p.name as program_name',
    episode_title: 'e.title as episode_title',
    content_type: 'e.type as content_type',
    published_at: 'e.published_at',
    platform: 'cl.platform',
    url: 'cl.url',
    views: 'cl.views',
    engagement: 'cl.engagement',
    likes: 'cl.likes',
    comments: 'cl.comments',
    shares: 'cl.shares',
    saves: 'cl.saves',
    uv: 'cl.uv',
    video_views: 'cl.video_views',
    yt_followers: 'c.yt_followers',
    fb_followers: 'c.fb_followers',
    tt_followers: 'c.tt_followers',
    ig_followers: 'c.ig_followers',
  };

  const selectedFields = (fields as string[]).filter(f => allFields[f]);
  if (selectedFields.length === 0) {
    return res.status(400).json({ error: 'No valid fields selected' });
  }

  const selectClause = selectedFields.map(f => allFields[f]).join(', ');
  let q = `SELECT ${selectClause} FROM content_links cl
    JOIN episodes e ON cl.episode_id = e.id
    JOIN creators c ON e.creator_id = c.id
    JOIN programs p ON c.program_id = p.id
    WHERE 1=1`;
  const params: any[] = [];
  if (program_id) { q += ' AND p.id = ?'; params.push(program_id); }
  if (creator_id) { q += ' AND c.id = ?'; params.push(creator_id); }
  if (platform) { q += ' AND cl.platform = ?'; params.push(platform); }
  if (type) { q += ' AND e.type = ?'; params.push(type); }
  q += ' ORDER BY cl.views DESC LIMIT ?';
  params.push(Number(limit));

  const rows = db.prepare(q).all(...params);
  res.json({ rows, fields: selectedFields, count: rows.length });
});

exportRouter.get('/preview', (req, res) => {
  const { program_id, creator_id, platform, type } = req.query;
  let q = `SELECT COUNT(*) as count FROM content_links cl
    JOIN episodes e ON cl.episode_id = e.id
    JOIN creators c ON e.creator_id = c.id
    JOIN programs p ON c.program_id = p.id
    WHERE 1=1`;
  const params: any[] = [];
  if (program_id) { q += ' AND p.id = ?'; params.push(program_id); }
  if (creator_id) { q += ' AND c.id = ?'; params.push(creator_id); }
  if (platform) { q += ' AND cl.platform = ?'; params.push(platform); }
  if (type) { q += ' AND e.type = ?'; params.push(type); }
  res.json(db.prepare(q).get(...params));
});
