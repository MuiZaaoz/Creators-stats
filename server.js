// server.js — Express backend that SERVES the original design untouched
// and adds: public /submit page + API + background link-scraping.
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, initDb } from './db.js';
import { enqueueScrape, detectPlatform } from './scraper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ── Serve the ORIGINAL design, feeding it REAL data (no visual/layout change) ──
// Only "data-logic" is patched: real submissions are injected into the review
// array, and the metric cells use the real scraped numbers when present.
const RAW = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const TEMPLATE = RAW
  // real Engagement/Like/Comment/Share from scrape when an item carries metrics
  .replace(
    "const e=Math.round(it.new*0.085); const like=Math.round(e*0.68), comment=Math.round(e*0.09), share=Math.round(e*0.13), save=Math.max(0,e-like-comment-share);",
    "const e=it.metrics?it.metrics.eng:Math.round(it.new*0.085); const like=it.metrics?it.metrics.like:Math.round(e*0.68), comment=it.metrics?it.metrics.comment:Math.round(e*0.09), share=it.metrics?it.metrics.share:Math.round(e*0.13), save=it.metrics?it.metrics.save:Math.max(0,e-like-comment-share);"
  )
  // show the real content link
  .replace(
    "dv:this.shortLink(firstClip?firstClip.link:'—'), link:true",
    "dv:this.shortLink(it.link||(firstClip?firstClip.link:'—')), link:true"
  )
  // persist approve/reject to the DB for real items (id starts with 's')
  .replace(
    "{...i,status:'approved'}:i)}))",
    "{...i,status:'approved'}:i)})); try{if(String(id)[0]==='s')fetch('/api/review/'+String(id).slice(1),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'approved'})})}catch(_){}"
  )
  .replace(
    "{...i,status:'draft'}:i)}))",
    "{...i,status:'draft'}:i)})); try{if(String(id)[0]==='s')fetch('/api/review/'+String(id).slice(1),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'rejected'})})}catch(_){}"
  );

const PLATCOLOR = { YouTube: '#ff0000', TikTok: '#111111', Facebook: '#1877f2', Instagram: '#e1306c' };
function toReviewItem(s) {
  return {
    id: 's' + s.id, creator: s.creator_name, color: PLATCOLOR[s.platform] || '#7c5cff',
    platform: s.platform || 'YouTube', field: 'Web Submit', old: 0, new: Number(s.views) || 0,
    source: 'Web Submit · Link Scrape', time: String(s.created_at || '').slice(0, 16), status: 'review',
    link: s.url || '',
    metrics: { eng: Number(s.engagement) || 0, like: Number(s.likes) || 0, comment: Number(s.comments) || 0, share: Number(s.shares) || 0, save: 0 },
  };
}
async function renderIndex() {
  const pending = await db.all("SELECT * FROM submissions WHERE status IN ('scraped','failed') ORDER BY created_at DESC LIMIT 50");
  const inner = pending.map((s) => JSON.stringify(toReviewItem(s))).join(',');
  return TEMPLATE.replace('reviewItems: [', 'reviewItems: [' + (inner ? inner + ',' : ''));
}
app.get(['/', '/index.html'], async (_req, res) => { res.type('html').send(await renderIndex()); });

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

// --- serve the ORIGINAL static assets (support.js, vendor/*) unchanged ---
// index.html is served by the route above (with real data injected).
app.use(express.static(__dirname, { index: false }));

const PORT = process.env.PORT || 3000;
initDb().then(() => app.listen(PORT, '0.0.0.0', () => console.log(`CreatorHub running on http://localhost:${PORT}`)));
