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

usersRouter.post('/change-password', async (req, res) => {
  const { username, current_password, new_password } = req.body;
  if (!new_password || String(new_password).length < 6) {
    return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 6 ตัวอักษร' });
  }
  const user = await db.get('SELECT id, password_hash FROM users WHERE username = ?', [username]);
  if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  // Placeholder-seeded accounts ('hashed_pw') accept any current password once.
  if (user.password_hash !== 'hashed_pw' && user.password_hash !== current_password) {
    return res.status(400).json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' });
  }
  await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [new_password, user.id]);
  await db.run('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)',
    [username, 'เปลี่ยนรหัสผ่าน', 'ระบบ', '#6b6b72', '']);
  res.json({ ok: true });
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
