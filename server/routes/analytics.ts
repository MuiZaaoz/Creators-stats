import { Router } from 'express';
import { db } from '../db.js';

export const analyticsRouter = Router();

const PLATFORMS = ['YouTube', 'Facebook', 'TikTok', 'Instagram'];
const FOLLOWER_COL: Record<string, string> = {
  YouTube: 'yt_followers', Facebook: 'fb_followers', TikTok: 'tt_followers', Instagram: 'ig_followers',
};

// Everything the Dashboard needs, in one call. Optional ?program_id & ?platform filters.
analyticsRouter.get('/dashboard', async (req, res) => {
  const { program_id, platform } = req.query;
  const where: string[] = ['1=1'];
  const params: any[] = [];
  if (program_id) { where.push('c.program_id = ?'); params.push(program_id); }
  if (platform) { where.push('cl.platform = ?'); params.push(platform); }
  const w = where.join(' AND ');

  const totals = await db.get(`
    SELECT COALESCE(SUM(cl.views),0) as views, COALESCE(SUM(cl.engagement),0) as engagement,
      COALESCE(SUM(cl.likes),0) as likes, COALESCE(SUM(cl.comments),0) as comments,
      COALESCE(SUM(cl.shares),0) as shares, COALESCE(SUM(cl.saves),0) as saves,
      COALESCE(SUM(cl.uv),0) as uv, COALESCE(SUM(cl.video_views),0) as video_views,
      COUNT(DISTINCT e.id) as episodes, COUNT(DISTINCT c.id) as creators
    FROM content_links cl
    JOIN episodes e ON cl.episode_id = e.id
    JOIN creators c ON e.creator_id = c.id
    WHERE ${w}
  `, params);

  // Per-platform views/engagement + follower totals
  const byPlatform = await db.all(`
    SELECT cl.platform, SUM(cl.views) as views, SUM(cl.engagement) as engagement
    FROM content_links cl JOIN episodes e ON cl.episode_id = e.id JOIN creators c ON e.creator_id = c.id
    WHERE ${w} GROUP BY cl.platform
  `, params);

  const creatorWhere: string[] = ['1=1'];
  const cParams: any[] = [];
  if (program_id) { creatorWhere.push('program_id = ?'); cParams.push(program_id); }
  const followerRow: any = await db.get(`
    SELECT COALESCE(SUM(yt_followers),0) as YouTube, COALESCE(SUM(fb_followers),0) as Facebook,
      COALESCE(SUM(tt_followers),0) as TikTok, COALESCE(SUM(ig_followers),0) as Instagram
    FROM creators WHERE ${creatorWhere.join(' AND ')}
  `, cParams);

  const totalViews = Number((totals as any).views) || 0;
  const platform_stats = PLATFORMS.map((p) => {
    const row: any = (byPlatform as any[]).find((x) => x.platform === p) || {};
    const views = Number(row.views) || 0;
    return {
      platform: p,
      followers: Number(followerRow[p]) || 0,
      views,
      engagement: Number(row.engagement) || 0,
      pct: totalViews ? Math.round((views / totalViews) * 100) : 0,
    };
  });

  // Leaderboard (creators ranked, with all metrics)
  const leaderboard = await db.all(`
    SELECT c.id, c.name, c.avatar_color, c.type, p.name as program_name, p.color as program_color,
      COALESCE(SUM(cl.views),0) as views, COALESCE(SUM(cl.engagement),0) as engagement,
      COALESCE(SUM(cl.likes),0) as likes, COALESCE(SUM(cl.comments),0) as comments,
      COALESCE(SUM(cl.shares),0) as shares
    FROM creators c
    LEFT JOIN programs p ON c.program_id = p.id
    LEFT JOIN episodes e ON e.creator_id = c.id
    LEFT JOIN content_links cl ON cl.episode_id = e.id ${platform ? 'AND cl.platform = ?' : ''}
    ${program_id ? 'WHERE c.program_id = ?' : ''}
    GROUP BY c.id ORDER BY views DESC
  `, [...(platform ? [platform] : []), ...(program_id ? [program_id] : [])]);

  res.json({
    totals,
    platform_stats,
    donut: platform_stats.filter((p) => p.views > 0).map((p) => ({ label: p.platform, pct: p.pct, views: p.views })),
    engagement: {
      likes: Number((totals as any).likes) || 0,
      comments: Number((totals as any).comments) || 0,
      shares: Number((totals as any).shares) || 0,
      saves: Number((totals as any).saves) || 0,
    },
    leaderboard,
  });
});

analyticsRouter.get('/overview', async (_req, res) => {
  const totals = await db.get(`
    SELECT
      SUM(cl.views) as total_views,
      SUM(cl.engagement) as total_engagement,
      SUM(cl.likes) as total_likes,
      SUM(cl.comments) as total_comments,
      SUM(cl.shares) as total_shares,
      COUNT(DISTINCT e.id) as total_episodes,
      COUNT(DISTINCT c.id) as total_creators,
      COUNT(DISTINCT p.id) as total_programs
    FROM content_links cl
    JOIN episodes e ON cl.episode_id = e.id
    JOIN creators c ON e.creator_id = c.id
    JOIN programs p ON c.program_id = p.id
  `);
  res.json(totals);
});

analyticsRouter.get('/by-platform', async (_req, res) => {
  const data = await db.all(`
    SELECT cl.platform,
      SUM(cl.views) as total_views,
      SUM(cl.engagement) as total_engagement,
      SUM(cl.likes) as total_likes,
      SUM(cl.comments) as total_comments,
      SUM(cl.shares) as total_shares,
      COUNT(cl.id) as link_count
    FROM content_links cl
    GROUP BY cl.platform
    ORDER BY total_views DESC
  `);
  res.json(data);
});

analyticsRouter.get('/by-program', async (_req, res) => {
  const data = await db.all(`
    SELECT p.id, p.name, p.color,
      SUM(cl.views) as total_views,
      SUM(cl.engagement) as total_engagement,
      SUM(cl.likes) as total_likes,
      SUM(cl.comments) as total_comments,
      SUM(cl.shares) as total_shares,
      COUNT(DISTINCT e.id) as episode_count,
      COUNT(DISTINCT c.id) as creator_count
    FROM programs p
    LEFT JOIN creators c ON c.program_id = p.id
    LEFT JOIN episodes e ON e.creator_id = c.id
    LEFT JOIN content_links cl ON cl.episode_id = e.id
    GROUP BY p.id
    ORDER BY total_views DESC
  `);
  res.json(data);
});

analyticsRouter.get('/by-creator', async (req, res) => {
  const { program_id } = req.query;
  let q = `
    SELECT c.id, c.name, c.avatar_color, c.type,
      p.name as program_name, p.color as program_color,
      SUM(cl.views) as total_views,
      SUM(cl.engagement) as total_engagement,
      SUM(cl.likes) as total_likes,
      SUM(cl.comments) as total_comments,
      SUM(cl.shares) as total_shares,
      COUNT(DISTINCT e.id) as episode_count
    FROM creators c
    JOIN programs p ON c.program_id = p.id
    LEFT JOIN episodes e ON e.creator_id = c.id
    LEFT JOIN content_links cl ON cl.episode_id = e.id
  `;
  const params: any[] = [];
  if (program_id) { q += ' WHERE c.program_id = ?'; params.push(program_id); }
  q += ' GROUP BY c.id ORDER BY total_views DESC';
  res.json(await db.all(q, params));
});

analyticsRouter.get('/by-type', async (_req, res) => {
  const data = await db.all(`
    SELECT e.type,
      SUM(cl.views) as total_views,
      SUM(cl.engagement) as total_engagement,
      COUNT(DISTINCT e.id) as episode_count
    FROM episodes e
    JOIN content_links cl ON cl.episode_id = e.id
    GROUP BY e.type
    ORDER BY total_views DESC
  `);
  res.json(data);
});

analyticsRouter.get('/comparison', async (req, res) => {
  const { mode = 'program' } = req.query;

  if (mode === 'creator') {
    const data = await db.all(`
      SELECT c.id, c.name as label, c.avatar_color as color, c.type,
        p.name as group_name,
        SUM(cl.views) as views, SUM(cl.engagement) as engagement,
        SUM(cl.likes) as likes, SUM(cl.comments) as comments,
        SUM(cl.shares) as shares, COUNT(DISTINCT e.id) as episodes
      FROM creators c
      JOIN programs p ON c.program_id = p.id
      LEFT JOIN episodes e ON e.creator_id = c.id
      LEFT JOIN content_links cl ON cl.episode_id = e.id
      GROUP BY c.id
      ORDER BY views DESC
    `);
    return res.json(data);
  }

  if (mode === 'platform') {
    const data = await db.all(`
      SELECT cl.platform as label, cl.platform as color,
        SUM(cl.views) as views, SUM(cl.engagement) as engagement,
        SUM(cl.likes) as likes, SUM(cl.comments) as comments,
        SUM(cl.shares) as shares, COUNT(cl.id) as episodes
      FROM content_links cl
      GROUP BY cl.platform
      ORDER BY views DESC
    `);
    return res.json(data);
  }

  const data = await db.all(`
    SELECT p.id, p.name as label, p.color,
      SUM(cl.views) as views, SUM(cl.engagement) as engagement,
      SUM(cl.likes) as likes, SUM(cl.comments) as comments,
      SUM(cl.shares) as shares, COUNT(DISTINCT e.id) as episodes,
      COUNT(DISTINCT c.id) as creators
    FROM programs p
    LEFT JOIN creators c ON c.program_id = p.id
    LEFT JOIN episodes e ON e.creator_id = c.id
    LEFT JOIN content_links cl ON cl.episode_id = e.id
    GROUP BY p.id
    ORDER BY views DESC
  `);
  res.json(data);
});
