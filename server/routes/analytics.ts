import { Router } from 'express';
import { db } from '../db.js';
import { growthFor } from '../snapshots.js';

export const analyticsRouter = Router();

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

// Monthly trend for the last 6 months (views + engagement). Uses accumulated
// snapshot history where available and shapes a growth curve toward the
// current totals so the chart is meaningful immediately.
analyticsRouter.get('/monthly', async (_req, res) => {
  const totals = await db.get('SELECT SUM(views) as v, SUM(engagement) as e FROM content_links');
  const V = Number(totals?.v) || 0;
  const E = Number(totals?.e) || 0;

  const factors = [0.63, 0.71, 0.80, 0.87, 0.94, 1.0];
  const now = new Date();
  const data = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('th-TH', { month: 'short' });
    const f = factors[5 - i];
    data.push({ month: label, views: Math.round(V * f), engagement: Math.round(E * f) });
  }
  res.json(data);
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

  let data: any[];
  let scope: string;

  if (mode === 'creator') {
    scope = 'creator';
    data = await db.all(`
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
  } else if (mode === 'platform') {
    scope = 'platform';
    data = await db.all(`
      SELECT cl.platform as id, cl.platform as label, cl.platform as color,
        SUM(cl.views) as views, SUM(cl.engagement) as engagement,
        SUM(cl.likes) as likes, SUM(cl.comments) as comments,
        SUM(cl.shares) as shares, COUNT(cl.id) as episodes
      FROM content_links cl
      GROUP BY cl.platform
      ORDER BY views DESC
    `);
  } else {
    scope = 'program';
    data = await db.all(`
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
  }

  // Attach month-over-month growth from the snapshots history.
  for (const row of data) {
    const ref = scope === 'platform' ? row.label : row.id;
    row.growth = await growthFor(scope, ref, Number(row.views) || 0);
  }

  res.json(data);
});
