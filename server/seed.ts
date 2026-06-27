import { db } from './db.js';

export function seed() {
  const count = (db.prepare('SELECT COUNT(*) as n FROM creators').get() as any).n;
  if (count > 0) return; // Already seeded

  // Games
  const games = ['RoV (Arena of Valor)', 'Free Fire', 'PUBG Mobile', 'Valorant', 'Minecraft', 'Genshin Impact'];
  const gameIds: Record<string, number> = {};
  for (const g of games) {
    const r = db.prepare('INSERT OR IGNORE INTO games (name) VALUES (?)').run(g);
    gameIds[g] = (r.lastInsertRowid as number) || (db.prepare('SELECT id FROM games WHERE name=?').get(g) as any).id;
  }

  // Roles
  const defaultRoles = [
    { name: 'Admin', is_default: 1, permissions: JSON.stringify({ dashboard: 'admin', creators: 'admin', programs: 'admin', collect: 'admin', editor: 'admin', analytics: 'admin', export: 'admin', games: 'admin', rewards: 'admin', settings: 'admin' }) },
    { name: 'Manager', is_default: 1, permissions: JSON.stringify({ dashboard: 'edit', creators: 'edit', programs: 'edit', collect: 'edit', editor: 'edit', analytics: 'view', export: 'edit', games: 'view', rewards: 'view', settings: 'off' }) },
    { name: 'Editor', is_default: 1, permissions: JSON.stringify({ dashboard: 'view', creators: 'view', programs: 'view', collect: 'edit', editor: 'edit', analytics: 'view', export: 'view', games: 'view', rewards: 'off', settings: 'off' }) },
    { name: 'Viewer', is_default: 1, permissions: JSON.stringify({ dashboard: 'view', creators: 'view', programs: 'view', collect: 'off', editor: 'off', analytics: 'view', export: 'view', games: 'view', rewards: 'off', settings: 'off' }) },
  ];
  for (const r of defaultRoles) {
    db.prepare('INSERT OR IGNORE INTO roles (name, is_default, permissions) VALUES (?, ?, ?)').run(r.name, r.is_default, r.permissions);
  }

  // Programs
  const programData = [
    { name: 'Star Player', game: 'RoV (Arena of Valor)', color: '#f97316', types: '["Long","Short"]' },
    { name: 'Creator Incubation', game: 'Free Fire', color: '#22c55e', types: '["Long","Short","Streamer"]' },
    { name: 'Pro Clinic', game: 'PUBG Mobile', color: '#8b5cf6', types: '["Long","Streamer"]' },
    { name: 'Golden Space Gods', game: 'Valorant', color: '#ec4899', types: '["Short","Streamer"]' },
  ];
  const progIds: Record<string, number> = {};
  for (const p of programData) {
    const r = db.prepare('INSERT INTO programs (name, game_id, color, types) VALUES (?, ?, ?, ?)').run(p.name, gameIds[p.game], p.color, p.types);
    progIds[p.name] = r.lastInsertRowid as number;
  }

  // Creators
  const creatorData = [
    { name: 'Napat Wong', type: 'Short', program: 'Star Player', color: '#f97316', tt: 'beam100', yt: 'bea100', fb: 'beam', ig: 'beam_ig', tt_f: 820000, yt_f: 650000, fb_f: 430000, ig_f: 290000 },
    { name: 'Thanawat S.', type: 'Long', program: 'Star Player', color: '#3b82f6', tt: 'tee100', yt: 'tee100', fb: 'tee', ig: 'tee_ig', tt_f: 610000, yt_f: 490000, fb_f: 320000, ig_f: 180000 },
    { name: 'Suchada Pim', type: 'Short', program: 'Creator Incubation', color: '#8b5cf6', tt: 'pim100', yt: 'pim100', fb: 'pimz', ig: 'pim_ig', tt_f: 920000, yt_f: 720000, fb_f: 480000, ig_f: 350000 },
    { name: 'Pichaya L.', type: 'Long', program: 'Creator Incubation', color: '#eab308', tt: 'fern100', yt: 'fern100', fb: 'fern', ig: 'fern_ig', tt_f: 530000, yt_f: 420000, fb_f: 280000, ig_f: 160000 },
    { name: 'Kittipong R.', type: 'Streamer', program: 'Pro Clinic', color: '#06b6d4', tt: 'kit100', yt: 'kit100', fb: 'kit', ig: 'kit_ig', tt_f: 1100000, yt_f: 890000, fb_f: 600000, ig_f: 410000 },
    { name: 'Worawit M.', type: 'Long', program: 'Pro Clinic', color: '#ef4444', tt: 'wor100', yt: 'wor100', fb: 'wor', ig: 'wor_ig', tt_f: 740000, yt_f: 580000, fb_f: 390000, ig_f: 220000 },
    { name: 'Arisa Tan', type: 'Short', program: 'Golden Space Gods', color: '#10b981', tt: 'arisa100', yt: 'arisa100', fb: 'arisa', ig: 'arisa_ig', tt_f: 980000, yt_f: 760000, fb_f: 510000, ig_f: 380000 },
    { name: 'Nattaya K.', type: 'Streamer', program: 'Golden Space Gods', color: '#f43f5e', tt: 'natt100', yt: 'natt100', fb: 'natt', ig: 'natt_ig', tt_f: 1050000, yt_f: 830000, fb_f: 560000, ig_f: 420000 },
  ];
  const creatorIds: Record<string, number> = {};
  for (const c of creatorData) {
    const r = db.prepare(`INSERT INTO creators (name, type, program_id, avatar_color, youtube_handle, facebook_handle, tiktok_handle, instagram_handle, yt_followers, fb_followers, tt_followers, ig_followers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      c.name, c.type, progIds[c.program], c.color, c.yt, c.fb, c.tt, c.ig, c.yt_f, c.fb_f, c.tt_f, c.ig_f
    );
    creatorIds[c.name] = r.lastInsertRowid as number;
  }

  // Episodes & Content Links
  const episodes = [
    { creator: 'Napat Wong', title: 'สอนเล่นโปร EP.1', type: 'Long', date: '2026-06-14T18:30:00', platforms: [
      { p: 'TikTok', url: 'tiktok.com/@beam/v/1', v: 469863, e: 34904, l: 21000, c: 8900, s: 4500, sv: 500 },
      { p: 'YouTube', url: 'youtu.be/bea100', v: 335616, e: 24932, l: 15000, c: 6200, s: 3200, sv: 532 },
      { p: 'Facebook', url: 'facebook.com/beam/1', v: 201370, e: 14959, l: 9000, c: 3700, s: 2000, sv: 259 },
    ]},
    { creator: 'Napat Wong', title: 'ทำไม้ตาย 15 ท่า EP.2', type: 'Short', date: '2026-06-12T20:15:00', platforms: [
      { p: 'TikTok', url: 'tiktok.com/@beam/v/2', v: 575343, e: 42000, l: 28000, c: 10000, s: 3500, sv: 500 },
      { p: 'Instagram', url: 'instagram.com/reel/1', v: 345206, e: 25000, l: 16000, c: 6000, s: 2800, sv: 200 },
    ]},
    { creator: 'Thanawat S.', title: 'สอนเล่นโปร EP.1', type: 'Long', date: '2026-06-14T18:30:00', platforms: [
      { p: 'TikTok', url: 'tiktok.com/@tee/v/1', v: 346804, e: 16781, l: 10000, c: 4200, s: 2100, sv: 481 },
      { p: 'YouTube', url: 'youtu.be/tee100', v: 247717, e: 11986, l: 7500, c: 3000, s: 1200, sv: 286 },
      { p: 'Facebook', url: 'facebook.com/tee/1', v: 148630, e: 7192, l: 4500, c: 1800, s: 700, sv: 192 },
    ]},
    { creator: 'Suchada Pim', title: 'Free Fire Ranked EP.1', type: 'Long', date: '2026-06-13T19:00:00', platforms: [
      { p: 'TikTok', url: 'tiktok.com/@pim/v/1', v: 612000, e: 45000, l: 28000, c: 11000, s: 5500, sv: 500 },
      { p: 'YouTube', url: 'youtu.be/pim100', v: 438000, e: 32000, l: 20000, c: 8000, s: 3800, sv: 200 },
    ]},
    { creator: 'Kittipong R.', title: 'PUBG Pro Match Stream', type: 'Streamer', date: '2026-06-11T21:00:00', platforms: [
      { p: 'YouTube', url: 'youtu.be/kit100_live', v: 1150000, e: 93000, l: 58000, c: 22000, s: 10000, sv: 3000, uv: 420000, video_views: 730000 },
      { p: 'Facebook', url: 'facebook.com/kit/live1', v: 821000, e: 66000, l: 41000, c: 16000, s: 8000, sv: 1000, uv: 310000, video_views: 511000 },
    ]},
    { creator: 'Arisa Tan', title: 'Valorant Highlights EP.1', type: 'Short', date: '2026-06-15T17:30:00', platforms: [
      { p: 'TikTok', url: 'tiktok.com/@arisa/v/1', v: 890000, e: 71200, l: 44000, c: 17000, s: 9000, sv: 1200 },
      { p: 'Instagram', url: 'instagram.com/reel/arisa1', v: 640000, e: 51000, l: 32000, c: 12000, s: 6500, sv: 500 },
    ]},
    { creator: 'Nattaya K.', title: 'Golden Cup Stream', type: 'Streamer', date: '2026-06-10T20:00:00', platforms: [
      { p: 'YouTube', url: 'youtu.be/natt100_live', v: 1050000, e: 85000, l: 53000, c: 20000, s: 9500, sv: 2500, uv: 380000, video_views: 670000 },
      { p: 'TikTok', url: 'tiktok.com/@natt/live1', v: 780000, e: 62000, l: 39000, c: 15000, s: 7500, sv: 500, uv: 290000, video_views: 490000 },
    ]},
    { creator: 'Worawit M.', title: 'Pro Tips PUBG EP.1', type: 'Long', date: '2026-06-12T19:00:00', platforms: [
      { p: 'YouTube', url: 'youtu.be/wor100', v: 520000, e: 38000, l: 24000, c: 9000, s: 4500, sv: 500 },
      { p: 'TikTok', url: 'tiktok.com/@wor/v/1', v: 380000, e: 28000, l: 17000, c: 7000, s: 3500, sv: 500 },
      { p: 'Facebook', url: 'facebook.com/wor/1', v: 220000, e: 16000, l: 10000, c: 4000, s: 2000, sv: 200 },
    ]},
    { creator: 'Pichaya L.', title: 'Free Fire Guide EP.1', type: 'Long', date: '2026-06-09T18:00:00', platforms: [
      { p: 'YouTube', url: 'youtu.be/fern100', v: 290000, e: 21000, l: 13000, c: 5000, s: 2500, sv: 500 },
      { p: 'TikTok', url: 'tiktok.com/@fern/v/1', v: 210000, e: 15000, l: 9500, c: 3700, s: 1500, sv: 300 },
    ]},
  ];

  for (const ep of episodes) {
    const cid = creatorIds[ep.creator];
    const epRow = db.prepare('INSERT INTO episodes (creator_id, title, type, published_at) VALUES (?, ?, ?, ?)').run(cid, ep.title, ep.type, ep.date);
    const epId = epRow.lastInsertRowid as number;
    for (const pl of ep.platforms) {
      db.prepare('INSERT INTO content_links (episode_id, platform, url, views, engagement, likes, comments, shares, saves, uv, video_views) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        epId, pl.p, pl.url, pl.v, pl.e, pl.l, pl.c, pl.s, pl.sv, (pl as any).uv || 0, (pl as any).video_views || 0
      );
    }
  }

  // Rewards
  for (const c of creatorData) {
    const cid = creatorIds[c.name];
    const pid = progIds[c.program];
    const amount = Math.round(Math.random() * 150000 + 50000);
    db.prepare('INSERT OR IGNORE INTO rewards (creator_id, program_id, amount) VALUES (?, ?, ?)').run(cid, pid, amount);
  }

  // Users
  db.prepare('INSERT OR IGNORE INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run('Admin User', 'admin', 'admin@creatorhub.th', 'hashed_pw', 'Admin');
  db.prepare('INSERT OR IGNORE INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run('Som Editor', 'som.editor', 'som@creatorhub.th', 'hashed_pw', 'Editor');
  db.prepare('INSERT OR IGNORE INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run('Ploy Manee', 'ploy.manee', 'ploy@creatorhub.th', 'hashed_pw', 'Manager');

  // Audit logs
  const auditEntries = [
    { user: 'Admin User', action: 'อนุมัติ Arisa Tan (Instagram)', tag: 'อนุมัติ', color: '#16a34a', detail: 'Approved content link' },
    { user: 'AI Agent', action: 'อัปเดตยอดวิว Napat Wong', tag: 'AI Refresh', color: '#7c5cff', detail: 'Updated follower counts via AI' },
    { user: 'Som Editor', action: 'นำเข้ารายงาน report_june.xlsx', tag: 'Upload', color: '#0ea5e9', detail: 'Imported 42 content rows' },
    { user: 'Admin User', action: 'สร้างโปรแกรม Golden Space Gods', tag: 'ระบบ', color: '#6b6b72', detail: 'Created new program' },
    { user: 'Ploy Manee', action: 'แก้ไขข้อมูล Kittipong R.', tag: 'แก้ไข', color: '#f59e0b', detail: 'Updated creator profile' },
  ];
  for (const a of auditEntries) {
    db.prepare('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)').run(a.user, a.action, a.tag, a.color, a.detail);
  }

  // Review queue
  const links = db.prepare('SELECT id FROM content_links LIMIT 5').all() as any[];
  for (const lnk of links) {
    db.prepare('INSERT INTO review_queue (content_link_id, status, submitted_by) VALUES (?, ?, ?)').run(lnk.id, 'pending', 'Som Editor');
  }

  console.log('Database seeded successfully');
}
