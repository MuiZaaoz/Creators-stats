import { Router } from 'express';
import { db } from '../db.js';

export const usersRouter = Router();

usersRouter.get('/', (_req, res) => {
  const users = db.prepare('SELECT id, name, username, email, role, status, created_at, last_login FROM users ORDER BY name').all();
  res.json(users);
});

usersRouter.get('/roles', (_req, res) => {
  const roles = db.prepare('SELECT * FROM roles ORDER BY name').all();
  res.json((roles as any[]).map(r => ({ ...r, permissions: JSON.parse(r.permissions || '{}') })));
});

usersRouter.post('/', (req, res) => {
  const { name, username, email, role } = req.body;
  const r = db.prepare('INSERT INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(name, username, email, 'hashed_pw', role || 'Editor');
  res.json({ id: r.lastInsertRowid });
});

usersRouter.put('/:id', (req, res) => {
  const { name, email, role, status } = req.body;
  db.prepare('UPDATE users SET name=?, email=?, role=?, status=? WHERE id=?').run(name, email, role, status, req.params.id);
  res.json({ ok: true });
});

usersRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

usersRouter.put('/roles/:id', (req, res) => {
  const { permissions } = req.body;
  db.prepare('UPDATE roles SET permissions=? WHERE id=?').run(JSON.stringify(permissions), req.params.id);
  res.json({ ok: true });
});

usersRouter.post('/roles', (req, res) => {
  const { name, permissions } = req.body;
  const r = db.prepare('INSERT INTO roles (name, permissions) VALUES (?, ?)').run(name, JSON.stringify(permissions || {}));
  res.json({ id: r.lastInsertRowid });
});
