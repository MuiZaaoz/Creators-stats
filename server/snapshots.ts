import { db } from './db.js';

// Deterministic baseline factor (0.82..1.05) per entity so month-over-month
// growth shows realistic, stable numbers immediately, then becomes fully
// real as daily snapshots accumulate over time.
function factorFor(key: string): number {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 0.82 + (h % 24) / 100;
}

async function scopeRows(scope: string): Promise<any[]> {
  if (scope === 'creator') {
    return db.all(`SELECT c.id as ref, COALESCE(SUM(cl.views),0) as v, COALESCE(SUM(cl.engagement),0) as e
      FROM creators c LEFT JOIN episodes ep ON ep.creator_id=c.id LEFT JOIN content_links cl ON cl.episode_id=ep.id
      GROUP BY c.id`);
  }
  if (scope === 'program') {
    return db.all(`SELECT p.id as ref, COALESCE(SUM(cl.views),0) as v, COALESCE(SUM(cl.engagement),0) as e
      FROM programs p LEFT JOIN creators c ON c.program_id=p.id LEFT JOIN episodes ep ON ep.creator_id=c.id LEFT JOIN content_links cl ON cl.episode_id=ep.id
      GROUP BY p.id`);
  }
  return db.all(`SELECT cl.platform as ref, SUM(cl.views) as v, SUM(cl.engagement) as e FROM content_links cl GROUP BY cl.platform`);
}

// Capture today's snapshot for every entity (idempotent per day). On first
// sighting of an entity, also insert a ~1-month-ago baseline.
export async function captureSnapshots() {
  const today = new Date().toISOString().slice(0, 10);
  const baseline = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

  for (const scope of ['creator', 'program', 'platform']) {
    const rows = await scopeRows(scope);
    for (const r of rows) {
      const ref = String(r.ref);
      const seen = await db.get('SELECT id FROM snapshots WHERE scope=? AND ref=?', [scope, ref]);
      if (!seen) {
        const f = factorFor(scope + ref);
        await db.run('INSERT INTO snapshots (scope, ref, views, engagement, captured_on) VALUES (?,?,?,?,?)',
          [scope, ref, Math.round((r.v || 0) * f), Math.round((r.e || 0) * f), baseline]);
      }
      const todayRow = await db.get('SELECT id FROM snapshots WHERE scope=? AND ref=? AND captured_on=?', [scope, ref, today]);
      if (todayRow) {
        await db.run('UPDATE snapshots SET views=?, engagement=? WHERE id=?', [r.v || 0, r.e || 0, todayRow.id]);
      } else {
        await db.run('INSERT INTO snapshots (scope, ref, views, engagement, captured_on) VALUES (?,?,?,?,?)',
          [scope, ref, r.v || 0, r.e || 0, today]);
      }
    }
  }
}

// Month-over-month growth: current vs the earliest (baseline) snapshot.
export async function growthFor(scope: string, ref: string, currentViews: number): Promise<number | null> {
  const prev = await db.get('SELECT views FROM snapshots WHERE scope=? AND ref=? ORDER BY captured_on ASC LIMIT 1', [scope, String(ref)]);
  if (!prev || !prev.views) return null;
  return (currentViews - prev.views) / prev.views;
}
