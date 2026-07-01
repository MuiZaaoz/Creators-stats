// server.js — Express backend that SERVES the original design untouched
// and adds: public /submit page + API + background link-scraping.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initDb } from './db.js';
import { enqueueScrape, detectPlatform } from './scraper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// --- API: submit content links (creator self-submit) ---
app.post('/api/submit', async (req, res) => {
  const { creator_name, links } = req.body || {};
  if (!creator_name || !Array.isArray(links) || links.length === 0) {
    return res.status(400).json({ error: 'ต้องมีชื่อครีเอเตอร์และลิงก์อย่างน้อย 1 รายการ' });
  }
  const ids = [];
  for (const l of links) {
    const url = String(l.url || '').trim();
    if (!url) continue;
    const platform = detectPlatform(url);
    const r = await db.run(
      'INSERT INTO submissions (creator_name, platform, url, status) VALUES (?, ?, ?, ?)',
      [creator_name.trim(), platform, url, 'scraping']
    );
    const id = r.lastInsertRowid;
    ids.push(id);
    // background scrape (does not block the response) — one at a time, rate-limited
    enqueueScrape(url)
      .then(async (m) => {
        if (m && m.ok) {
          await db.run(
            'UPDATE submissions SET views=?, likes=?, comments=?, shares=?, engagement=?, status=?, scraped_at=? WHERE id=?',
            [m.views, m.likes, m.comments, m.shares, m.engagement, 'scraped', m.scraped_at || new Date().toISOString(), id]
          );
        } else {
          await db.run('UPDATE submissions SET status=?, error=? WHERE id=?', ['failed', (m && m.error) || 'no data found', id]);
        }
      })
      .catch(async (e) => { await db.run('UPDATE submissions SET status=?, error=? WHERE id=?', ['failed', String(e).slice(0, 150), id]); });
  }
  res.json({ ok: true, ids, message: 'ส่งข้อมูลแล้ว — ระบบกำลังตรวจจับยอดวิว/Engagement เบื้องหลัง' });
});

// --- API: review queue (see submissions + scrape results) ---
app.get('/api/review', async (_req, res) => {
  res.json(await db.all('SELECT * FROM submissions ORDER BY created_at DESC LIMIT 200'));
});

// --- API: approve/reject/edit a submission ---
app.put('/api/review/:id', async (req, res) => {
  const { status, views, likes, comments, shares } = req.body || {};
  const cur = await db.get('SELECT * FROM submissions WHERE id=?', [req.params.id]);
  if (!cur) return res.status(404).json({ error: 'not found' });
  const v = views ?? cur.views, li = likes ?? cur.likes, co = comments ?? cur.comments, sh = shares ?? cur.shares;
  const eng = (Number(li) || 0) + (Number(co) || 0) + (Number(sh) || 0);
  await db.run('UPDATE submissions SET status=?, views=?, likes=?, comments=?, shares=?, engagement=? WHERE id=?',
    [status || cur.status, v, li, co, sh, eng, req.params.id]);
  res.json({ ok: true });
});

// --- API: check status of specific submissions (polling from /submit page) ---
app.get('/api/status', async (req, res) => {
  const ids = String(req.query.ids || '').split(',').filter(Boolean);
  if (!ids.length) return res.json([]);
  const rows = await db.all(`SELECT id, platform, status, views, engagement FROM submissions WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
  res.json(rows);
});

// --- public pages (NEW — do not touch the original design) ---
app.get('/submit', (_req, res) => res.sendFile(path.join(__dirname, 'submit.html')));
app.get('/review', (_req, res) => res.sendFile(path.join(__dirname, 'review.html')));

// --- serve the ORIGINAL design (index.html, support.js, vendor/*) unchanged ---
app.use(express.static(__dirname, { index: 'index.html' }));

const PORT = process.env.PORT || 3000;
initDb().then(() => app.listen(PORT, '0.0.0.0', () => console.log(`CreatorHub running on http://localhost:${PORT}`)));
