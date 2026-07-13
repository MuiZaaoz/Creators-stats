import { Router } from 'express';
import { db } from '../db.js';
import { scrapeClip, scrapeFollowers, humanDelay, fbHandleFromUrl, igHandleFromUrl } from '../scrape.js';

export const aiRouter = Router();

const BATCH = 4; // links visited per request — with human-like delays each request stays short

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
  res.json({ configured: true, mode: 'web-visit', creators: rows });
});

// Visit one batch of links for a creator like a human would (random delay
// between pages). The frontend calls this repeatedly until remaining = 0.
aiRouter.post('/refresh/:creatorId', async (req, res) => {
  const creator = await db.get('SELECT * FROM creators WHERE id = ?', [req.params.creatorId]);
  if (!creator) return res.status(404).json({ error: 'creator_not_found' });

  const links = await db.all(`
    SELECT cl.id, cl.url, cl.platform, cl.views, cl.likes, cl.comments, cl.shares, cl.saves
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
    return res.json({ updated: 0, batch: 0, remaining: 0, note: 'no_links' });
  }

  const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
  let updated = 0;
  const details: any[] = [];

  // Learn FB page / IG account names from this creator's own links when not set
  let fbHandle = (creator.facebook_handle || '').replace(/^@/, '') || null;
  let igHandle = (creator.instagram_handle || '').replace(/^@/, '') || null;
  if (!fbHandle || !igHandle) {
    const allUrls = await db.all(`
      SELECT cl.url FROM content_links cl
      JOIN episodes e ON cl.episode_id = e.id
      WHERE e.creator_id = ? AND cl.url != ''`, [creator.id]);
    for (const r of allUrls as any[]) {
      if (!fbHandle) fbHandle = fbHandleFromUrl(r.url);
      if (!igHandle) igHandle = igHandleFromUrl(r.url);
    }
    if (fbHandle && !creator.facebook_handle) await db.run('UPDATE creators SET facebook_handle=? WHERE id=?', [fbHandle, creator.id]);
    if (igHandle && !creator.instagram_handle) await db.run('UPDATE creators SET instagram_handle=? WHERE id=?', [igHandle, creator.id]);
  }
  const ctx = { fbHandle, igHandle };

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    if (i > 0) await humanDelay(); // pause between pages, like a person browsing
    const s = await scrapeClip(link.platform, link.url, ctx);

    if (s.ok || s.likes != null) {
      // keep existing value when a field could not be read
      const views = s.views ?? link.views;
      const likes = s.likes ?? link.likes;
      const comments = s.comments ?? link.comments;
      const shares = s.shares ?? link.shares;
      const saves = s.saves ?? link.saves;
      const engagement = (likes || 0) + (comments || 0) + (shares || 0) + (saves || 0);
      await db.run(
        `UPDATE content_links SET views=?, likes=?, comments=?, shares=?, saves=?, engagement=?, ai_updated_at=? WHERE id=?`,
        [views, likes, comments, shares, saves, engagement, now(), link.id]
      );
      updated++;
      details.push({ id: link.id, platform: link.platform, ok: true, views });
    } else {
      // mark attempted so the loop advances; existing numbers are kept
      await db.run(`UPDATE content_links SET ai_updated_at=? WHERE id=?`, [now(), link.id]);
      details.push({ id: link.id, platform: link.platform, ok: false, note: s.note });
    }
  }

  // Follower counts — first pass for this creator only
  let followers: any = null;
  if (!creator.ai_updated_at) {
    followers = {};
    if (creator.tiktok_handle) {
      await humanDelay();
      followers.tiktok = await scrapeFollowers('tiktok', creator.tiktok_handle.replace(/^@/, ''));
    }
    if (creator.youtube_handle) {
      await humanDelay();
      followers.youtube = await scrapeFollowers('youtube', creator.youtube_handle.replace(/^@/, ''));
    }
    if (fbHandle) {
      await humanDelay();
      followers.facebook = await scrapeFollowers('facebook', fbHandle);
    }
    if (igHandle) {
      await humanDelay();
      followers.instagram = await scrapeFollowers('instagram', igHandle);
    }
    if (followers.tiktok != null || followers.youtube != null || followers.facebook != null || followers.instagram != null) {
      await db.run(
        `UPDATE creators SET tt_followers=COALESCE(?, tt_followers), yt_followers=COALESCE(?, yt_followers),
           fb_followers=COALESCE(?, fb_followers), ig_followers=COALESCE(?, ig_followers) WHERE id=?`,
        [followers.tiktok ?? null, followers.youtube ?? null, followers.facebook ?? null, followers.instagram ?? null, creator.id]
      );
    }
  }

  await db.run(`UPDATE creators SET ai_updated_at=? WHERE id=?`, [now(), creator.id]);
  await db.run(
    'INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)',
    ['AI Agent', `AI Refresh — ${creator.name} (${updated}/${links.length} ลิงก์)`, 'AI', '#7c5cff', `web-visit batch`]
  );

  const remaining = Math.max(0, Number(remainingRow?.n || 0) - links.length);
  res.json({ updated, batch: links.length, remaining, followers, details, ai_updated_at: now() });
});
