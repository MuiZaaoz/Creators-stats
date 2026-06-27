import { Router } from 'express';
import { db } from '../db.js';

export const auditRouter = Router();

auditRouter.get('/', (req, res) => {
  const { search, tag, limit = 50, offset = 0 } = req.query;
  let q = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];
  if (search) { q += ' AND (user LIKE ? OR action LIKE ? OR detail LIKE ?)'; const s = `%${search}%`; params.push(s, s, s); }
  if (tag) { q += ' AND tag = ?'; params.push(tag); }
  q += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  const items = db.prepare(q).all(...params);
  const total = (db.prepare('SELECT COUNT(*) as n FROM audit_logs').get() as any).n;
  res.json({ items, total });
});

auditRouter.get('/tags', (_req, res) => {
  const tags = db.prepare('SELECT DISTINCT tag, color FROM audit_logs WHERE tag IS NOT NULL ORDER BY tag').all();
  res.json(tags);
});
