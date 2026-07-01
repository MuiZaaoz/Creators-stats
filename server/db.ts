import { createClient, type Client, type InValue } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Use Turso (persistent cloud SQLite) when env vars are set, otherwise a local file.
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

let client: Client;
if (TURSO_URL) {
  client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
  console.log('Database: Turso (persistent)');
} else {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dataDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const file = path.join(dataDir, 'creator_platform.db');
  client = createClient({ url: 'file:' + file });
  console.log('Database: local file (' + file + ')');
}

// Thin async wrapper around libsql so route code stays close to before.
export const db = {
  async all(sql: string, params: InValue[] = []): Promise<any[]> {
    const r = await client.execute({ sql, args: params });
    return r.rows as any[];
  },
  async get(sql: string, params: InValue[] = []): Promise<any> {
    const r = await client.execute({ sql, args: params });
    return (r.rows[0] as any) ?? undefined;
  },
  async run(sql: string, params: InValue[] = []): Promise<{ lastInsertRowid: number; changes: number }> {
    const r = await client.execute({ sql, args: params });
    return {
      lastInsertRowid: r.lastInsertRowid != null ? Number(r.lastInsertRowid) : 0,
      changes: r.rowsAffected,
    };
  },
  async exec(sql: string): Promise<void> {
    await client.executeMultiple(sql);
  },
};

export async function initDb() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      game_id INTEGER REFERENCES games(id),
      color TEXT DEFAULT '#5b5bd6',
      types TEXT DEFAULT '["Long","Short"]',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS creators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('Long','Short','Streamer')) DEFAULT 'Long',
      program_id INTEGER REFERENCES programs(id),
      avatar_color TEXT DEFAULT '#5b5bd6',
      youtube_handle TEXT,
      facebook_handle TEXT,
      tiktok_handle TEXT,
      instagram_handle TEXT,
      yt_followers INTEGER DEFAULT 0,
      fb_followers INTEGER DEFAULT 0,
      tt_followers INTEGER DEFAULT 0,
      ig_followers INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER NOT NULL REFERENCES creators(id),
      title TEXT NOT NULL,
      type TEXT CHECK(type IN ('Long','Short','Streamer')) DEFAULT 'Long',
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS content_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      episode_id INTEGER NOT NULL REFERENCES episodes(id),
      platform TEXT CHECK(platform IN ('YouTube','Facebook','TikTok','Instagram')) NOT NULL,
      url TEXT NOT NULL,
      views INTEGER DEFAULT 0,
      engagement INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      saves INTEGER DEFAULT 0,
      uv INTEGER DEFAULT 0,
      video_views INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER NOT NULL REFERENCES creators(id),
      program_id INTEGER NOT NULL REFERENCES programs(id),
      amount REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(creator_id, program_id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'Editor',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      is_default INTEGER DEFAULT 0,
      permissions TEXT DEFAULT '{}',
      game_access TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT,
      tag TEXT,
      color TEXT DEFAULT '#6b6b72',
      ip TEXT DEFAULT '127.0.0.1',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS review_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_link_id INTEGER REFERENCES content_links(id),
      status TEXT DEFAULT 'pending',
      submitted_by TEXT,
      reviewed_by TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      reviewed_at TEXT
    );
  `);
}
