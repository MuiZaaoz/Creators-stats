import { db } from './db.js';

// Real dataset ported from the original Claude Design prototype (Creator Platform.dc.html)

const GAMES = ['RoV (Arena of Valor)', 'Free Fire', 'PUBG Mobile', 'Valorant', 'Genshin Impact', 'Mobile Legends'];

const PROGRAMS = [
  { key: 'star', name: 'Star Player', game: 'RoV (Arena of Valor)', color: '#f97316', types: '["Long","Short"]' },
  { key: 'incubation', name: 'Creator Incubation', game: 'Free Fire', color: '#06b6d4', types: '["Long","Short"]' },
  { key: 'proclinic', name: 'Pro Clinic', game: 'PUBG Mobile', color: '#8b5cf6', types: '["Long","Short","Streamer"]' },
  { key: 'golden', name: 'Golden Space Gods', game: 'Valorant', color: '#ec4899', types: '["Long","Short","Streamer"]' },
];

// CREATORS array from the prototype (followers, total views/engagement, uv/videoViews for streamers)
const CREATORS = [
  { name: 'Napat Wong',  nick: 'Beam',  prog: 'star',       color: '#f97316', fb: 125000, yt: 89000,  tt: 340000, ig: 56000,  views: 4200000, eng: 312000, content: 48 },
  { name: 'Suchada Pim', nick: 'Pim',   prog: 'incubation', color: '#06b6d4', fb: 45000,  yt: 210000, tt: 98000,  ig: 120000, views: 2800000, eng: 198000, content: 36 },
  { name: 'Kittipong R.', nick: 'Kong', prog: 'proclinic',  color: '#8b5cf6', fb: 78000,  yt: 34000,  tt: 512000, ig: 41000,  views: 6100000, eng: 540000, content: 72 },
  { name: 'Arisa Tan',   nick: 'Mind',  prog: 'golden',     color: '#ec4899', fb: 230000, yt: 156000, tt: 220000, ig: 310000, views: 5400000, eng: 420000, content: 55, uv: 2100000, videoViews: 3300000 },
  { name: 'Thanawat S.', nick: 'Tee',   prog: 'star',       color: '#10b981', fb: 12000,  yt: 420000, tt: 67000,  ig: 23000,  views: 3100000, eng: 150000, content: 41 },
  { name: 'Pichaya L.',  nick: 'Fah',   prog: 'incubation', color: '#eab308', fb: 56000,  yt: 18000,  tt: 145000, ig: 89000,  views: 1500000, eng: 96000,  content: 22 },
  { name: 'Worawit M.',  nick: 'Earth', prog: 'proclinic',  color: '#ef4444', fb: 98000,  yt: 76000,  tt: 410000, ig: 52000,  views: 4800000, eng: 388000, content: 63, uv: 1800000, videoViews: 3000000 },
  { name: 'Nattaya K.',  nick: 'Ploy',  prog: 'golden',     color: '#3b82f6', fb: 340000, yt: 92000,  tt: 180000, ig: 420000, views: 5900000, eng: 510000, content: 58 },
];

// Rewards per creator, same order as CREATORS (from the prototype's export report)
const REWARDS = [446, 118, 500, 500, 350, 199, 500, 350];

// buildEpisodes() ported from the prototype — deterministic, reproduces the same numbers
const EP_TITLES = {
  long:  ['สอนเล่นโปร', 'รีวิวอุปกรณ์', 'Live ตอบคำถาม', 'ไฮไลต์ทัวร์', 'วิเคราะห์เมตา', 'สัมภาษณ์แชมป์'],
  short: ['โมเมนต์เด็ด', 'ท่าไม้ตาย 15 วิ', 'รีแอคชั่นสุดมันส์', 'ทิปสั้นๆ', 'โมเมนต์ฮา', 'ไฮไลต์ 1 นาที'],
};
const EP_DATES = ['2026-06-14T18:30:00', '2026-06-12T20:15:00', '2026-06-10T12:45:00', '2026-06-08T19:00:00', '2026-06-05T21:30:00', '2026-06-03T17:20:00', '2026-06-01T14:10:00'];
const PSET = [
  ['TikTok', 'YouTube', 'Facebook'],
  ['TikTok', 'Instagram'],
  ['YouTube', 'Facebook'],
  ['TikTok', 'YouTube', 'Facebook', 'Instagram'],
  ['Facebook', 'Instagram'],
  ['TikTok'],
  ['YouTube'],
];

function makeLink(platform: string, nick: string, i: number): string {
  const n = nick.toLowerCase();
  if (platform === 'TikTok') return 'https://www.tiktok.com/@' + n + '/video/74' + (1000000 + i * 137);
  if (platform === 'YouTube') return 'https://youtu.be/' + n.slice(0, 3) + (100 + i * 7);
  if (platform === 'Facebook') return 'https://www.facebook.com/' + n + '/videos/' + (900000 + i * 311);
  return 'https://www.instagram.com/reel/C' + n.slice(0, 2).toUpperCase() + (10 + i);
}

export async function seed() {
  const row = await db.get('SELECT COUNT(*) as n FROM creators');
  if (row && Number(row.n) > 0) return; // Already seeded

  // Games
  const gameIds: Record<string, number> = {};
  for (const g of GAMES) {
    const r = await db.run('INSERT OR IGNORE INTO games (name) VALUES (?)', [g]);
    gameIds[g] = r.lastInsertRowid || (await db.get('SELECT id FROM games WHERE name=?', [g])).id;
  }

  // Roles (perms from the prototype's roleDefs; 'none' mapped to 'off')
  const roles = [
    { name: 'Admin',   perms: { dashboard: 'admin', creators: 'admin', programs: 'admin', games: 'admin', collect: 'admin', editor: 'admin', analytics: 'admin', export: 'admin', rewards: 'admin', settings: 'admin' } },
    { name: 'Manager', perms: { dashboard: 'view', creators: 'edit', programs: 'edit', games: 'edit', collect: 'view', editor: 'admin', analytics: 'view', export: 'edit', rewards: 'view', settings: 'off' } },
    { name: 'Editor',  perms: { dashboard: 'view', creators: 'edit', programs: 'view', games: 'edit', collect: 'edit', editor: 'edit', analytics: 'view', export: 'view', rewards: 'off', settings: 'off' } },
    { name: 'Viewer',  perms: { dashboard: 'view', creators: 'view', programs: 'view', games: 'view', collect: 'off', editor: 'off', analytics: 'view', export: 'off', rewards: 'off', settings: 'off' } },
  ];
  for (const r of roles) {
    await db.run('INSERT OR IGNORE INTO roles (name, is_default, permissions) VALUES (?, 1, ?)', [r.name, JSON.stringify(r.perms)]);
  }

  // Programs
  const progIds: Record<string, number> = {};
  for (const p of PROGRAMS) {
    const r = await db.run('INSERT INTO programs (name, game_id, color, types) VALUES (?, ?, ?, ?)', [p.name, gameIds[p.game], p.color, p.types]);
    progIds[p.key] = r.lastInsertRowid;
  }

  // Creators — streamers are the ones with uv/videoViews in the prototype
  const creatorIds: number[] = [];
  for (const c of CREATORS) {
    const type = c.uv ? 'Streamer' : (c.tt >= c.yt && c.tt >= c.fb ? 'Short' : 'Long');
    const n = c.nick.toLowerCase();
    const r = await db.run(
      `INSERT INTO creators (name, type, program_id, avatar_color, youtube_handle, facebook_handle, tiktok_handle, instagram_handle, yt_followers, fb_followers, tt_followers, ig_followers)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.name, type, progIds[c.prog], c.color, n, n, n, n + '_ig', c.yt, c.fb, c.tt, c.ig]
    );
    creatorIds.push(r.lastInsertRowid);
  }

  // Episodes & content links — port of the prototype's buildEpisodes()
  for (let ci = 0; ci < CREATORS.length; ci++) {
    const c = CREATORS[ci];
    const cid = creatorIds[ci];
    const n = Math.max(3, Math.min(c.content, 7));
    const w: number[] = [];
    for (let i = 0; i < n; i++) w.push((n - i) + (i % 2 ? 0.4 : 0));
    const ws = w.reduce((a, b) => a + b, 0);

    for (let i = 0; i < n; i++) {
      const type = (i % 3 === 0) ? 'Long' : 'Short';
      const tl = EP_TITLES[type === 'Long' ? 'long' : 'short'];
      const title = tl[i % tl.length] + ' EP.' + (i + 1);
      const plats = PSET[i % PSET.length];
      const epViews = Math.round(c.views * w[i] / ws);
      const epEng = Math.round(c.eng * w[i] / ws);
      const pw = plats.map((_, j) => plats.length - j + 0.5);
      const pws = pw.reduce((a, b) => a + b, 0);

      const epRow = await db.run('INSERT INTO episodes (creator_id, title, type, published_at) VALUES (?, ?, ?, ?)', [cid, title, type, EP_DATES[i % EP_DATES.length]]);
      const epId = epRow.lastInsertRowid;

      for (let j = 0; j < plats.length; j++) {
        const views = Math.round(epViews * pw[j] / pws);
        const eng = Math.round(epEng * pw[j] / pws);
        // Engagement split into like/comment/share/save (prototype shows engagement as a single number)
        const likes = Math.round(eng * 0.62);
        const comments = Math.round(eng * 0.13);
        const shares = Math.round(eng * 0.15);
        const saves = eng - likes - comments - shares;
        // Streamer creators: distribute their UV / Video Views proportionally by view share
        const uv = c.uv ? Math.round(c.uv * views / c.views) : 0;
        const videoViews = c.videoViews ? Math.round(c.videoViews * views / c.views) : 0;
        await db.run(
          'INSERT INTO content_links (episode_id, platform, url, views, engagement, likes, comments, shares, saves, uv, video_views) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [epId, plats[j], makeLink(plats[j], c.nick, i), views, eng, likes, comments, shares, saves, uv, videoViews]
        );
      }
    }
  }

  // Rewards (real amounts from the prototype's export report)
  for (let i = 0; i < CREATORS.length; i++) {
    await db.run('INSERT OR IGNORE INTO rewards (creator_id, program_id, amount) VALUES (?, ?, ?)', [creatorIds[i], progIds[CREATORS[i].prog], REWARDS[i]]);
  }

  // Users (from the prototype's profile/log data)
  await db.run('INSERT OR IGNORE INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', ['Admin User', 'admin', 'admin@creatorhub.co', 'hashed_pw', 'Admin']);
  await db.run('INSERT OR IGNORE INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', ['Som', 'som.editor', 'som@creatorhub.co', 'hashed_pw', 'Editor']);
  await db.run('INSERT OR IGNORE INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', ['Ploy', 'ploy.manager', 'ploy@creatorhub.co', 'hashed_pw', 'Manager']);

  // System log entries from the prototype
  const logs = [
    { user: 'AI Agent', action: 'ดึงข้อมูล Followers ของ 8 ครีเอเตอร์', tag: 'AI', color: '#7c5cff', detail: 'AI Auto Refresh' },
    { user: 'Editor — Som', action: 'อัปโหลดรายงาน report_june.xlsx (4 แถว)', tag: 'UPLOAD', color: '#0ea5e9', detail: 'Report upload' },
    { user: 'Manager — Ploy', action: 'อนุมัติ Views ของ Arisa Tan (Instagram)', tag: 'APPROVE', color: '#16a34a', detail: 'Approved content data' },
    { user: 'Admin User', action: 'แก้ไข Engagement ของ Kittipong R. ด้วยตนเอง', tag: 'EDIT', color: '#d97706', detail: 'Manual edit' },
  ];
  for (const a of logs) {
    await db.run('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)', [a.user, a.action, a.tag, a.color, a.detail]);
  }

  // Review queue: a few pending items
  const links = await db.all('SELECT id FROM content_links ORDER BY id LIMIT 5');
  for (const lnk of links) {
    await db.run('INSERT INTO review_queue (content_link_id, status, submitted_by) VALUES (?, ?, ?)', [lnk.id, 'pending', 'Som']);
  }

  console.log('Database seeded successfully (real prototype data)');
}
