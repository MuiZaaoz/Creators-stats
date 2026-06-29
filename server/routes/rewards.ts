import { Router } from 'express';
import { db } from '../db.js';

export const rewardsRouter = Router();

rewardsRouter.get('/', async (_req, res) => {
  const rewards = await db.all(`
    SELECT r.*, c.name as creator_name, c.avatar_color, c.type as creator_type,
      p.name as program_name, p.color as program_color
    FROM rewards r
    JOIN creators c ON r.creator_id = c.id
    JOIN programs p ON r.program_id = p.id
    ORDER BY r.amount DESC
  `);
  res.json(rewards);
});

rewardsRouter.get('/by-program', async (_req, res) => {
  const programs = await db.all(`
    SELECT p.id, p.name, p.color,
      SUM(r.amount) as total_budget,
      COUNT(r.id) as creator_count
    FROM programs p
    LEFT JOIN rewards r ON r.program_id = p.id
    GROUP BY p.id
    ORDER BY total_budget DESC
  `);

  const result = [];
  for (const prog of programs as any[]) {
    const creators = await db.all(`
      SELECT r.*, c.name as creator_name, c.avatar_color, c.type as creator_type,
        COALESCE(SUM(cl.views), 0) as total_views,
        COALESCE(SUM(cl.engagement), 0) as total_engagement,
        COUNT(DISTINCT e.id) as episode_count
      FROM rewards r
      JOIN creators c ON r.creator_id = c.id
      LEFT JOIN episodes e ON e.creator_id = c.id
      LEFT JOIN content_links cl ON cl.episode_id = e.id
      WHERE r.program_id = ?
      GROUP BY r.id
      ORDER BY r.amount DESC
    `, [prog.id]);
    result.push({ ...prog, creators });
  }
  res.json(result);
});

rewardsRouter.get('/cpm', async (_req, res) => {
  const data = await db.all(`
    SELECT c.id as creator_id, c.name as creator_name, c.avatar_color, c.type,
      p.id as program_id, p.name as program_name, p.color as program_color,
      r.amount,
      COALESCE(SUM(cl.views), 0) as total_views,
      CASE WHEN SUM(cl.views) > 0 THEN (r.amount / SUM(cl.views) * 1000) ELSE 0 END as cpm
    FROM rewards r
    JOIN creators c ON r.creator_id = c.id
    JOIN programs p ON r.program_id = p.id
    LEFT JOIN episodes e ON e.creator_id = c.id
    LEFT JOIN content_links cl ON cl.episode_id = e.id
    GROUP BY r.id
    ORDER BY cpm ASC
  `);
  res.json(data);
});

rewardsRouter.post('/', async (req, res) => {
  const { creator_id, program_id, amount } = req.body;
  const r = await db.run('INSERT OR REPLACE INTO rewards (creator_id, program_id, amount) VALUES (?, ?, ?)', [creator_id, program_id, amount]);
  res.json({ id: r.lastInsertRowid });
});

rewardsRouter.put('/:id', async (req, res) => {
  const { amount } = req.body;
  await db.run('UPDATE rewards SET amount=? WHERE id=?', [amount, req.params.id]);
  res.json({ ok: true });
});
