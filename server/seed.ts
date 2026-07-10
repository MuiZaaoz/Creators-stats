import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';

// Program 11.0 dataset imported from "11.0 Creators stats (With Link) Creators Summary.csv"
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, 'program11.json');

const PROGRAM_NAME = 'Creators Program 11.0';

const SEED_VERSION = 'p11-v2-grouped';

export async function migrateAndSeed() {
  // One-time cleanup: remove earlier datasets (old demo data, or the v1 Program 11.0
  // import where each platform post was counted as its own content).
  const oldDemo = await db.get(
    `SELECT id FROM creators WHERE name IN ('Napat Wong','Suchada Pim','Kittipong R.') LIMIT 1`
  );
  const currentVersion = await db.get(
    `SELECT id FROM audit_logs WHERE detail = ? LIMIT 1`, [SEED_VERSION]
  );
  const hasData = Number((await db.get('SELECT COUNT(*) as n FROM creators'))?.n || 0) > 0;

  if (hasData && (oldDemo || !currentVersion)) {
    console.log('Outdated dataset detected — clearing before seeding Program 11.0 (grouped)');
    await db.exec(`
      DELETE FROM review_queue;
      DELETE FROM content_links;
      DELETE FROM episodes;
      DELETE FROM rewards;
      DELETE FROM audit_logs;
      DELETE FROM creators;
      DELETE FROM programs;
      DELETE FROM games;
    `);
  }

  const row = await db.get('SELECT COUNT(*) as n FROM creators');
  if (row && Number(row.n) > 0) return; // Real data already present

  const creators: any[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

  // Roles + users (needed for Settings/RBAC screens)
  const roles = [
    { name: 'Admin',   perms: { dashboard: 'admin', creators: 'admin', programs: 'admin', games: 'admin', collect: 'admin', editor: 'admin', analytics: 'admin', export: 'admin', rewards: 'admin', settings: 'admin' } },
    { name: 'Manager', perms: { dashboard: 'view', creators: 'edit', programs: 'edit', games: 'edit', collect: 'view', editor: 'admin', analytics: 'view', export: 'edit', rewards: 'view', settings: 'off' } },
    { name: 'Editor',  perms: { dashboard: 'view', creators: 'edit', programs: 'view', games: 'edit', collect: 'edit', editor: 'edit', analytics: 'view', export: 'view', rewards: 'off', settings: 'off' } },
    { name: 'Viewer',  perms: { dashboard: 'view', creators: 'view', programs: 'view', games: 'view', collect: 'off', editor: 'off', analytics: 'view', export: 'off', rewards: 'off', settings: 'off' } },
  ];
  for (const r of roles) {
    await db.run('INSERT OR IGNORE INTO roles (name, is_default, permissions) VALUES (?, 1, ?)', [r.name, JSON.stringify(r.perms)]);
  }
  await db.run('INSERT OR IGNORE INTO users (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', ['Admin User', 'admin', 'admin@creatorhub.co', 'hashed_pw', 'Admin']);

  // Single program: 11.0
  const prog = await db.run('INSERT INTO programs (name, game_id, color, types) VALUES (?, NULL, ?, ?)', [PROGRAM_NAME, '#5b5bd6', '["Long","Short","Streamer"]']);
  const progId = prog.lastInsertRowid;

  for (const c of creators) {
    const r = await db.run(
      `INSERT INTO creators (name, type, program_id, avatar_color, tiktok_handle) VALUES (?, ?, ?, ?, ?)`,
      [c.name, c.type, progId, c.color, c.tiktok_handle || null]
    );
    const cid = r.lastInsertRowid;

    // One episode per content; the same content posted on several platforms
    // becomes multiple links under a single episode (counted once).
    for (const ep of c.episodes) {
      const epRow = await db.run('INSERT INTO episodes (creator_id, title, type, published_at) VALUES (?, ?, ?, NULL)', [cid, ep.title, ep.type]);
      for (const lnk of ep.links) {
        await db.run(
          'INSERT INTO content_links (episode_id, platform, url, views, engagement, likes, comments, shares, saves, uv, video_views) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, ?, ?)',
          [epRow.lastInsertRowid, lnk.platform, lnk.url || '', lnk.views, lnk.engagement, lnk.uv, lnk.video_views]
        );
      }
    }

    if (c.reward > 0) {
      await db.run('INSERT OR IGNORE INTO rewards (creator_id, program_id, amount) VALUES (?, ?, ?)', [cid, progId, c.reward]);
    }
  }

  await db.run('INSERT INTO audit_logs (user, action, tag, color, detail) VALUES (?, ?, ?, ?, ?)',
    ['System', 'นำเข้าข้อมูล Creators Program 11.0', 'IMPORT', '#5b5bd6', SEED_VERSION]);

  console.log(`Database seeded: Program 11.0 grouped (${creators.length} creators)`);
}
