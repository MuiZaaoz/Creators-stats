import { Router } from 'express';
import { db } from '../db.js';

export const aiRouter = Router();

const API_KEY = () => process.env.ANTHROPIC_API_KEY;
const MODEL = () => process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const BATCH = 8; // links refreshed per request (keeps each HTTP call short)

// Creators + their AI refresh status
aiRouter.get('/status', async (_req, res) => {
  const rows = await db.all(`
    SELECT c.id, c.name, c.avatar_color, c.type, c.ai_updated_at,
      c.tiktok_handle, c.youtube_handle,
      c.yt_followers, c.fb_followers, c.tt_followers, c.ig_followers,
      COUNT(cl.id) as total_links,
      SUM(CASE WHEN cl.url != '' THEN 1 ELSE 0 END) as linked,
      SUM(CASE WHEN cl.url != '' AND cl.ai_updated_at IS NOT NULL THEN 1 ELSE 0 END) as refreshed
    FROM creators c
    LEFT JOIN episodes e ON e.creator_id = c.id
    LEFT JOIN content_links cl ON cl.episode_id = e.id
    GROUP BY c.id
    ORDER BY c.name
  `);
  res.json({ configured: Boolean(API_KEY()), model: MODEL(), creators: rows });
});

// Refresh one batch of links for a creator. The frontend calls this
// repeatedly until remaining = 0.
aiRouter.post('/refresh/:creatorId', async (req, res) => {
  if (!API_KEY()) {
    return res.status(400).json({
      error: 'no_api_key',
      message: 'ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY — เพิ่ม env var ใน Render แล้ว redeploy',
    });
  }

  const creator = await db.get('SELECT * FROM creators WHERE id = ?', [req.params.creatorId]);
  if (!creator) return res.status(404).json({ error: 'creator_not_found' });

  // Oldest-refreshed (or never refreshed) links with real URLs first
  const links = await db.all(`
    SELECT cl.id, cl.url, cl.platform
    FROM content_links cl
    JOIN episodes e ON cl.episode_id = e.id
    WHERE e.creator_id = ? AND cl.url != ''
    ORDER BY cl.ai_updated_at IS NOT NULL, cl.ai_updated_at ASC, cl.id ASC
    LIMIT ?
  `, [creator.id, BATCH]);

  const remainingRow = await db.get(`
    SELECT COUNT(*) as n FROM content_links cl
    JOIN episodes e ON cl.episode_id = e.id
    WHERE e.creator_id = ? AND cl.url != '' AND cl.ai_updated_at IS NULL
  `, [creator.id]);

  if (links.length === 0) {
    return res.json({ updated: 0, remaining: 0, followers: null, note: 'no_links' });
  }

  // Ask for follower counts on the first pass only
  const wantFollowers = !creator.ai_updated_at;
  const profileUrls: Record<string, string> = {};
  if (wantFollowers) {
    if (creator.tiktok_handle) profileUrls.tiktok = `https://www.tiktok.com/@${creator.tiktok_handle}`;
    if (creator.youtube_handle) profileUrls.youtube = `https://www.youtube.com/@${creator.youtube_handle}`;
  }

  const prompt = `You are a social media data collector. Visit each URL below with the web fetch tool and read the CURRENT public stats of each video/post.

Content URLs:
${links.map((l: any, i: number) => `${i + 1}. [${l.platform}] ${l.url}`).join('\n')}
${Object.keys(profileUrls).length ? `\nProfile pages (get follower counts):\n${Object.entries(profileUrls).map(([k, v]) => `- ${k}: ${v}`).join('\n')}` : ''}

Rules:
- views = play/view count of the video
- likes, comments, shares, saves = the post's public counters (0 if not visible)
- If a page cannot be fetched or the stat is not visible, use null for that field
- Answer with ONLY this JSON, no other text:
{"results":[{"n":1,"views":123,"likes":1,"comments":2,"shares":3,"saves":4}, ...],"followers":{"tiktok":null,"youtube":null}}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY()!,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-fetch-2025-09-10',
      },
      body: JSON.stringify({
        model: MODEL(),
        max_tokens: 4000,
        tools: [
          { type: 'web_fetch_20250910', name: 'web_fetch', max_uses: BATCH + 3 },
          { type: 'web_search_20250305', name: 'web_search', max_uses: 3 },
        ],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      return res.status(502).json({ error: 'anthropic_error', status: resp.status, detail: detail.slice(0, 500) });
    }

    const data: any = await resp.json();
    const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(502).json({ error: 'no_json_in_response', raw: text.slice(0, 300) });

    const parsed = JSON.parse(jsonMatch[0]);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let updated = 0;

    for (const r of parsed.results || []) {
      const link = links[(r.n || 0) - 1];
      if (!link) continue;
      const likes = r.likes ?? 0, comments = r.comments ?? 0, shares = r.shares ?? 0, saves = r.saves ?? 0;
      const engagement = likes + comments + shares + saves;
      if (r.views != null) {
        await db.run(
          `UPDATE content_links SET views=?, likes=?, comments=?, shares=?, saves=?, engagement=?, ai_updated_at=? WHERE id=?`,
          [r.views, likes, comments, shares, saves, engagement, now, link.id]
        );
        updated++;
      } else {
        // Mark attempted so the batch loop moves forward
        await db.run(`UPDATE content_links SET ai_updated_at=? WHERE id=?`, [now, link.id]);
      }
    }

    const f = parsed.followers || {};
    if (wantFollowers && (f.tiktok != null || f.youtube != null)) {
      await db.run(
        `UPDATE creators SET tt_followers=COALESCE(?, tt_followers), yt_followers=COALESCE(?, yt_followers) WHERE id=?`,
        [f.tiktok ?? null, f.youtube ?? null, creator.id]
      );
    }
    await db.run(`UPDATE creators SET ai_updated_at=? WHERE id=?`, [now, creator.id]);
    await db.run(
      'INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)',
      ['AI Agent', `AI Refresh — ${creator.name} (${updated}/${links.length} ลิงก์)`, 'AI', '#7c5cff', `batch of ${links.length}`]
    );

    const remaining = Math.max(0, Number(remainingRow?.n || 0) - links.length);
    res.json({ updated, batch: links.length, remaining, followers: wantFollowers ? f : null, ai_updated_at: now });
  } catch (err: any) {
    res.status(500).json({ error: 'refresh_failed', message: String(err?.message || err).slice(0, 300) });
  }
});
