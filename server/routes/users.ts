import { Router } from 'express';
import { db } from '../db.js';

export const usersRouter = Router();

usersRouter.get('/', async (_req, res) => {
  const users = await db.all('SELECT id, name, username, email, role, status, created_at, last_login FROM users ORDER BY name');
  res.json(users);
});

usersRouter.get('/roles', async (_req, res) => {
  const roles = await db.all('SELECT * FROM roles ORDER BY name');
  res.json((roles as any[]).map(r => ({ ...r, permissions: JSON.parse(r.permissions || '{}') })));
});

usersRouter.post('/', async (req, res) => {
  const { name, username, email, role } = req.body;
  const r = await db.run('INSERT INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', [name, username, email, 'hashed_pw', role || 'Editor']);
  res.json({ id: r.lastInsertRowid });
});

usersRouter.put('/:id', async (req, res) => {
  const { name, email, role, status } = req.body;
  await db.run('UPDATE users SET name=?, email=?, role=?, status=? WHERE id=?', [name, email, role, status, req.params.id]);
  res.json({ ok: true });
});

usersRouter.delete('/:id', async (req, res) => {
  await db.run('DELETE FROM users WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

usersRouter.put('/roles/:id', async (req, res) => {
  const { permissions } = req.body;
  await db.run('UPDATE roles SET permissions=? WHERE id=?', [JSON.stringify(permissions), req.params.id]);
  res.json({ ok: true });
});

usersRouter.post('/roles', async (req, res) => {
  const { name, permissions } = req.body;
  const r = await db.run('INSERT INTO roles (name, permissions) VALUES (?, ?)', [name, JSON.stringify(permissions || {})]);
  res.json({ id: r.lastInsertRowid });
});
