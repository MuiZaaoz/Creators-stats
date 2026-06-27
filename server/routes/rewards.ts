import { Router } from 'express';
import { db } from '../db.js';

export const rewardsRouter = Router();

rewardsRouter.get('/', (_req, res) => {
  const rewards = db.prepare(`
    SELECT r.*, c.name as creator_name, c.avatar_color, c.type as creator_type,
      p.name as program_name, p.color as program_color
    FROM rewards r
    JOIN creators c ON r.creator_id = c.id
    JOIN programs p ON r.program_id = p.id
    ORDER BY r.amount DESC
  `).all();
  res.json(rewards);
});

rewardsRouter.get('/by-program', (_req, res) => {
  const programs = db.prepare(`
    SELECT p.id, p.name, p.color,
      SUM(r.amount) as total_budget,
      COUNT(r.id) as creator_count
    FROM programs p
    LEFT JOIN rewards r ON r.program_id = p.id
    GROUP BY p.id
    ORDER BY total_budget DESC
  `).all();

  const result = (programs as any[]).map((prog) => {
    const creators = db.prepare(`
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
    `).all(prog.id);
    return { ...prog, creators };
  });
  res.json(result);
});

rewardsRouter.get('/cpm', (_req, res) => {
  const data = db.prepare(`
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
  `).all();
  res.json(data);
});

rewardsRouter.post('/', (req, res) => {
  const { creator_id, program_id, amount } = req.body;
  const r = db.prepare('INSERT OR REPLACE INTO rewards (creator_id, program_id, amount) VALUES (?, ?, ?)').run(creator_id, program_id, amount);
  res.json({ id: r.lastInsertRowid });
});

rewardsRouter.put('/:id', (req, res) => {
  const { amount } = req.body;
  db.prepare('UPDATE rewards SET amount=? WHERE id=?').run(amount, req.params.id);
  res.json({ ok: true });
});
