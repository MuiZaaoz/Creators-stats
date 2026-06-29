import { Router } from 'express';
import { db } from '../db.js';

export const programsRouter = Router();

programsRouter.get('/', async (_req, res) => {
  const programs = await db.all(`
    SELECT p.*, g.name as game_name,
      COUNT(DISTINCT c.id) as creator_count
    FROM programs p
    LEFT JOIN games g ON p.game_id = g.id
    LEFT JOIN creators c ON c.program_id = p.id
    GROUP BY p.id
    ORDER BY p.name
  `);
  res.json(programs);
});

programsRouter.get('/:id/stats', async (req, res) => {
  const stats = await db.get(`
    SELECT
      COUNT(DISTINCT c.id) as creators,
      SUM(cl.views) as total_views,
      SUM(cl.engagement) as total_engagement,
      COUNT(DISTINCT e.id) as total_episodes,
      COUNT(cl.id) as total_links
    FROM creators c
    JOIN episodes e ON e.creator_id = c.id
    JOIN content_links cl ON cl.episode_id = e.id
    WHERE c.program_id = ?
  `, [req.params.id]);
  res.json(stats);
});

programsRouter.get('/:id/table', async (req, res) => {
  const creators = await db.all(`
    SELECT c.*,
      COALESCE(SUM(cl.views), 0) as total_views,
      COALESCE(SUM(cl.engagement), 0) as total_engagement,
      COUNT(DISTINCT e.id) as clip_count
    FROM creators c
    LEFT JOIN episodes e ON e.creator_id = c.id
    LEFT JOIN content_links cl ON cl.episode_id = e.id
    WHERE c.program_id = ?
    GROUP BY c.id
    ORDER BY total_views DESC
  `, [req.params.id]);

  const result = [];
  for (const c of creators as any[]) {
    const episodes = await db.all(`
      SELECT e.*,
        json_group_array(json_object(
          'id', cl.id, 'platform', cl.platform, 'url', cl.url,
          'views', cl.views, 'engagement', cl.engagement,
          'likes', cl.likes, 'comments', cl.comments
        )) as links
      FROM episodes e
      JOIN content_links cl ON cl.episode_id = e.id
      WHERE e.creator_id = ?
      GROUP BY e.id
      ORDER BY e.published_at DESC
    `, [c.id]);
    result.push({ ...c, episodes: episodes.map((e: any) => ({ ...e, links: JSON.parse(e.links) })) });
  }
  res.json(result);
});

programsRouter.post('/', async (req, res) => {
  const { name, game_id, color, types } = req.body;
  const r = await db.run('INSERT INTO programs (name, game_id, color, types) VALUES (?, ?, ?, ?)', [name, game_id, color || '#5b5bd6', JSON.stringify(types || ['Long', 'Short'])]);
  res.json({ id: r.lastInsertRowid });
});

programsRouter.put('/:id', async (req, res) => {
  const { name, game_id, color, types } = req.body;
  await db.run('UPDATE programs SET name=?, game_id=?, color=?, types=? WHERE id=?', [name, game_id, color, JSON.stringify(types), req.params.id]);
  res.json({ ok: true });
});

programsRouter.delete('/:id', async (req, res) => {
  await db.run('DELETE FROM programs WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});
