import { Router } from 'express';
import { db } from '../db.js';

export const gamesRouter = Router();

gamesRouter.get('/', async (_req, res) => {
  const games = await db.all(`
    SELECT g.*, COUNT(DISTINCT p.id) as program_count
    FROM games g
    LEFT JOIN programs p ON p.game_id = g.id
    GROUP BY g.id
    ORDER BY g.name
  `);
  res.json(games);
});

gamesRouter.get('/:id/contents', async (req, res) => {
  const contents = await db.all(`
    SELECT cl.*, e.title, e.type as content_type, e.published_at,
      c.id as creator_id, c.name as creator_name, c.avatar_color,
      p.id as program_id, p.name as program_name, p.color as program_color
    FROM content_links cl
    JOIN episodes e ON cl.episode_id = e.id
    JOIN creators c ON e.creator_id = c.id
    JOIN programs p ON c.program_id = p.id
    JOIN games g ON p.game_id = g.id
    WHERE g.id = ?
    ORDER BY cl.views DESC
    LIMIT 50
  `, [req.params.id]);
  res.json(contents);
});

gamesRouter.post('/', async (req, res) => {
  const { name } = req.body;
  const r = await db.run('INSERT INTO games (name) VALUES (?)', [name]);
  res.json({ id: r.lastInsertRowid });
});

gamesRouter.put('/:id', async (req, res) => {
  const { name } = req.body;
  await db.run('UPDATE games SET name=? WHERE id=?', [name, req.params.id]);
  res.json({ ok: true });
});

gamesRouter.delete('/:id', async (req, res) => {
  await db.run('DELETE FROM games WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});
