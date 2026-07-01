// db.js — persistent storage (Turso when env set, else local file)
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const TURSO_URL = process.env.TURSO_DATABASE_URL;
let client;
if (TURSO_URL) {
  client = createClient({ url: TURSO_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  console.log('DB: Turso (persistent)');
} else {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dir = path.join(__dirname, 'data');
  fs.mkdirSync(dir, { recursive: true });
  client = createClient({ url: 'file:' + path.join(dir, 'submissions.db') });
  console.log('DB: local file');
}

export const db = {
  async all(sql, args = []) { return (await client.execute({ sql, args })).rows; },
  async get(sql, args = []) { return (await client.execute({ sql, args })).rows[0]; },
  async run(sql, args = []) {
    const r = await client.execute({ sql, args });
    return { lastInsertRowid: r.lastInsertRowid != null ? Number(r.lastInsertRowid) : 0, changes: r.rowsAffected };
  },
  async exec(sql) { await client.executeMultiple(sql); },
};

export async function initDb() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT,                    -- links submitted together = one content
      creator_name TEXT NOT NULL,
      platform TEXT,
      url TEXT NOT NULL,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      engagement INTEGER DEFAULT 0,
      status TEXT DEFAULT 'scraping',   -- scraping | scraped | failed | approved | rejected
      error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      scraped_at TEXT
    );
  `);
  // migrate older DBs that predate group_id
  try { await db.run('ALTER TABLE submissions ADD COLUMN group_id TEXT'); } catch (_) { /* already exists */ }
}
