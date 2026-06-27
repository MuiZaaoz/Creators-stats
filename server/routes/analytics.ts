import { Router } from 'express';
import { db } from '../db.js';

export const analyticsRouter = Router();

analyticsRouter.get('/overview', (_req, res) => {
  const totals = db.prepare(`
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
  `).get();
  res.json(totals);
});

analyticsRouter.get('/by-platform', (_req, res) => {
  const data = db.prepare(`
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
  `).all();
  res.json(data);
});

analyticsRouter.get('/by-program', (_req, res) => {
  const data = db.prepare(`
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
  `).all();
  res.json(data);
});

analyticsRouter.get('/by-creator', (req, res) => {
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
  res.json(db.prepare(q).all(...params));
});

analyticsRouter.get('/by-type', (_req, res) => {
  const data = db.prepare(`
    SELECT e.type,
      SUM(cl.views) as total_views,
      SUM(cl.engagement) as total_engagement,
      COUNT(DISTINCT e.id) as episode_count
    FROM episodes e
    JOIN content_links cl ON cl.episode_id = e.id
    GROUP BY e.type
    ORDER BY total_views DESC
  `).all();
  res.json(data);
});

analyticsRouter.get('/comparison', (req, res) => {
  const { mode = 'program' } = req.query;

  if (mode === 'creator') {
    const data = db.prepare(`
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
    `).all();
    return res.json(data);
  }

  if (mode === 'platform') {
    const data = db.prepare(`
      SELECT cl.platform as label, cl.platform as color,
        SUM(cl.views) as views, SUM(cl.engagement) as engagement,
        SUM(cl.likes) as likes, SUM(cl.comments) as comments,
        SUM(cl.shares) as shares, COUNT(cl.id) as episodes
      FROM content_links cl
      GROUP BY cl.platform
      ORDER BY views DESC
    `).all();
    return res.json(data);
  }

  // Default: by program
  const data = db.prepare(`
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
  `).all();
  res.json(data);
});
