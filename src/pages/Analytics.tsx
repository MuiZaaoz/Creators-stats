import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { fmt } from '../lib/utils';
import PageHeader from '../components/PageHeader';

type CmpMode = 'cvc' | 'cross' | 'monthly';

const MONTHS = (() => {
  const names = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const now = new Date();
  const out: string[] = [];
  for (let i = 5; i >= 0; i--) out.push(names[(now.getMonth() - i + 12) % 12]);
  return out;
})();

const compact = (n: number) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(Math.round(n));
};
const sd = (id: number) => (id * 37) % 100;
const bestPlat = (c: any) => {
  const o: Record<string, number> = { Facebook: c.fb_followers, YouTube: c.yt_followers, TikTok: c.tt_followers, Instagram: c.ig_followers };
  return Object.keys(o).reduce((b, k) => (o[k] > o[b] ? k : b), 'TikTok');
};

export default function Analytics() {
  const { lang } = useAppStore();
  const [creators, setCreators] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [cpm, setCpm] = useState<Record<number, any>>({});
  const [program, setProgram] = useState('all');
  const [metrics, setMetrics] = useState({ views: true, eng: true });
  const [showGraph, setShowGraph] = useState(true);
  const [mode, setMode] = useState<CmpMode>('cvc');
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [format, setFormat] = useState('all');
  const [fixed, setFixed] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      (window as any).fetch('/api/creators/overview').then((r: any) => r.json()),
      (window as any).fetch('/api/programs').then((r: any) => r.json()),
      (window as any).fetch('/api/rewards/cpm').then((r: any) => r.json()),
    ]).then(([cs, ps, cp]) => {
      setCreators(cs);
      setPrograms(ps);
      const map: Record<number, any> = {};
      for (const x of cp) map[x.creator_id] = x;
      setCpm(map);
      const init: Record<number, boolean> = {};
      cs.slice(0, 3).forEach((c: any) => { init[c.id] = true; });
      setSelected(init);
      if (cs[0]) setFixed(cs[0].id);
    });
  }, []);

  const scope = useMemo(
    () => creators.filter((c) => program === 'all' || String(c.program_id) === program),
    [creators, program]
  );

  const anViews = scope.reduce((a, c) => a + Number(c.total_views), 0);
  const anEng = scope.reduce((a, c) => a + Number(c.total_engagement), 0);
  const anContents = scope.reduce((a, c) => a + Number(c.episode_count), 0);
  const anRate = anViews ? (anEng / anViews) * 100 : 0;

  const growth = (v: number) => ({ txt: (v >= 0 ? '+' : '') + v.toFixed(1) + '%', color: v >= 0 ? 'var(--green)' : 'var(--red)', bg: v >= 0 ? '#14532d33' : '#7f1d1d33', arrow: v >= 0 ? '▲' : '▼' });
  const anKey = [
    { label: 'Total Views', value: compact(anViews), g: growth(12.6) },
    { label: 'Total Engagement', value: compact(anEng), g: growth(8.1) },
    { label: 'Total Contents', value: fmt(anContents), g: growth(5.4) },
    { label: 'Avg Engagement Rate', value: anRate.toFixed(1) + '%', g: growth(-0.4) },
  ];

  const anVF = [0.62, 0.7, 0.78, 0.74, 0.88, 1.0], anEF = [0.58, 0.66, 0.72, 0.8, 0.85, 0.96];
  const legend = [metrics.views && { label: 'Views', color: '#5b5bd6' }, metrics.eng && { label: 'Engagement', color: '#ec4899' }].filter(Boolean) as any[];

  const toggleMetric = (k: 'views' | 'eng') => setMetrics((m) => ({ ...m, [k]: !m[k] }));
  const toggleSel = (id: number) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const toggleGroup = (k: string) => setCollapsed((c) => ({ ...c, [k]: !c[k] }));

  // ---- comparison ----
  const cmp = useMemo(() => buildComparison({ mode, scope, programs, cpm, selected, format, fixed, lang }), [mode, scope, programs, cpm, selected, format, fixed, lang]);

  const copyTable = () => {
    const lines = [['METRIC', ...cmp.columns.map((c: any) => c.label)].join('\t')];
    for (const g of cmp.groups) for (const r of g.rows) lines.push([r.label, ...r.cells.map((c: any) => c.display)].join('\t'));
    navigator.clipboard?.writeText(lines.join('\n'));
  };
  const exportCsv = () => {
    const rows = [['METRIC', ...cmp.columns.map((c: any) => c.label)]];
    for (const g of cmp.groups) for (const r of g.rows) rows.push([r.label, ...r.cells.map((c: any) => c.display)]);
    const csv = rows.map((r) => r.map((x) => JSON.stringify(x)).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'comparison.csv';
    a.click();
  };

  return (
    <div style={{ padding: '20px 28px', flex: 1 }}>
      <PageHeader title={lang === 'th' ? 'วิเคราะห์' : 'Analytics'} subtitle={lang === 'th' ? 'เปรียบเทียบและวิเคราะห์ข้อมูล' : 'Compare and analyze data'} />

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <div style={ctl}>โปรแกรม</div>
          <select value={program} onChange={(e) => setProgram(e.target.value)} style={{ minWidth: 200, fontWeight: 600 }}>
            <option value="all">{lang === 'th' ? 'ทุกโปรแกรม' : 'All Programs'}</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <div style={ctl}>{lang === 'th' ? 'เลือกข้อมูลที่วิเคราะห์' : 'Metrics'}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([['views', 'View', '#5b5bd6'], ['eng', 'Engagement', '#ec4899']] as const).map(([k, l, color]) => (
              <button key={k} onClick={() => toggleMetric(k)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 13px', borderRadius: 9, cursor: 'pointer',
                fontSize: 12.5, fontWeight: 600, border: '1px solid ' + ((metrics as any)[k] ? color : 'var(--border)'),
                background: (metrics as any)[k] ? 'var(--surface)' : 'var(--surface2)', color: (metrics as any)[k] ? 'var(--text)' : 'var(--text2)',
              }}>
                <span style={{ width: 15, height: 15, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: (metrics as any)[k] ? color : 'transparent', border: '1.5px solid ' + ((metrics as any)[k] ? color : 'var(--border)'), color: '#fff', fontSize: 10 }}>{(metrics as any)[k] ? '✓' : ''}</span>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowGraph((g) => !g)} className="btn btn-secondary">
          📈 {showGraph ? (lang === 'th' ? 'ซ่อนกราฟ' : 'Hide graph') : (lang === 'th' ? 'แสดงกราฟ' : 'Show graph')}
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        {anKey.map((k) => (
          <div key={k.label} className="card">
            <div style={{ fontSize: 12.5, color: 'var(--text2)', fontWeight: 500, marginBottom: 10 }}>{k.label}</div>
            <div className="num" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1 }}>{k.value}</div>
            <div style={{ marginTop: 10 }}>
              <span className="num" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: k.g.bg, color: k.g.color, fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 7 }}>
                <span style={{ fontSize: 9 }}>{k.g.arrow}</span>{k.g.txt}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text2)', marginLeft: 7 }}>vs เดือนก่อน</span>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly trend graph */}
      {showGraph && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{lang === 'th' ? 'แนวโน้มรายเดือน · 6 เดือนล่าสุด' : 'Monthly trend · last 6 months'}</div>
            <div style={{ display: 'flex', gap: 16 }}>
              {legend.map((l) => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />{l.label}
                </div>
              ))}
            </div>
          </div>
          {legend.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)', fontSize: 13 }}>เลือกข้อมูลอย่างน้อย 1 รายการเพื่อแสดงกราฟ</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: 264, paddingTop: 42, paddingBottom: 26, borderBottom: '1px solid var(--border)' }}>
              {MONTHS.map((m, i) => (
                <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: '100%', width: '100%', justifyContent: 'center' }}>
                    {metrics.views && <Bar color="#5b5bd6" h={16 + anVF[i] * 60} val={fmt(Math.round(anViews / 6 * anVF[i] * 1.3))} />}
                    {metrics.eng && <Bar color="#ec4899" h={16 + anEF[i] * 60} val={fmt(Math.round(anEng / 6 * anEF[i] * 1.3))} />}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text2)' }}>{m}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comparison table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{lang === 'th' ? 'ตารางเปรียบเทียบ' : 'Comparison Table'}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Comparison · {cmp.hint} ({lang === 'th' ? 'ตัวเลขเต็มจำนวน' : 'full numbers'})</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={copyTable}>⧉ Copy</button>
            <button className="btn" style={{ background: '#0f9d58', color: '#fff' }} onClick={exportCsv}>⊞ Google Sheets</button>
          </div>
        </div>

        {/* mode tabs */}
        <div style={{ display: 'flex', gap: 3, background: 'var(--surface2)', borderRadius: 9, padding: 3, width: 'max-content', marginBottom: 14 }}>
          {([['cvc', 'Creator vs Creator'], ['cross', 'ข้ามโปรแกรม'], ['monthly', 'รายเดือน']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)} style={pill(mode === k)}>{l}</button>
          ))}
        </div>

        {/* chips / fixed select */}
        {(mode === 'cvc' || mode === 'monthly') && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {scope.map((c) => {
              const on = !!selected[c.id];
              return (
                <button key={c.id} onClick={() => toggleSel(c.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px 7px 9px', borderRadius: 9, cursor: 'pointer',
                  fontSize: 12.5, fontWeight: 600, border: '1px solid var(--border)', background: 'var(--surface2)', color: on ? 'var(--text)' : 'var(--text2)',
                }}>
                  <span style={{ width: 16, height: 16, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--accent)' : 'transparent', border: '1.5px solid ' + (on ? 'var(--accent)' : 'var(--border)'), color: '#fff', fontSize: 9 }}>{on ? '✓' : ''}</span>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: c.avatar_color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{c.name[0]}</span>
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
        {mode === 'cvc' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>เทียบเฉพาะ Format เดียวกัน</span>
            {[['all', 'ทุก Format'], ['Long', 'Long'], ['Short', 'Short'], ['Streamer', 'Streamer']].map(([k, l]) => (
              <button key={k} onClick={() => setFormat(k)} style={chipStyle(format === k)}>{l}</button>
            ))}
          </div>
        )}
        {mode === 'cross' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>ครีเอเตอร์หลัก</span>
            <select value={fixed ?? ''} onChange={(e) => setFixed(Number(e.target.value))} style={{ minWidth: 200, fontWeight: 600 }}>
              {scope.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {cmp.empty ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text2)', fontSize: 13 }}>{cmp.emptyMsg}</div>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', overflowX: 'auto' }}>
            <div style={{ minWidth: 'max-content' }}>
              {/* header */}
              <div style={{ display: 'flex', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 200, flex: 'none', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>METRIC</div>
                {cmp.columns.map((col: any, i: number) => (
                  <div key={i} style={{ width: 172, flex: 'none', padding: '11px 16px', borderLeft: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {col.nick0
                      ? <span style={{ width: 24, height: 24, borderRadius: 7, background: col.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{col.nick0}</span>
                      : <span style={{ width: 9, height: 9, borderRadius: 3, background: col.color }} />}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text2)' }}>{col.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* groups */}
              {cmp.groups.map((grp: any) => (
                <React.Fragment key={grp.key}>
                  <div onClick={() => toggleGroup(grp.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
                    <span style={{ color: grp.color, transform: collapsed[grp.key] ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform .15s', fontWeight: 700 }}>›</span>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: grp.color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{grp.label}</span>
                    <span className="num" style={{ fontSize: 10.5, color: 'var(--text2)' }}>{grp.rows.length} metrics</span>
                  </div>
                  {!collapsed[grp.key] && grp.rows.map((row: any, ri: number) => (
                    <div key={ri} style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ width: 200, flex: 'none', padding: '11px 16px 11px 28px', fontSize: 12.5, fontWeight: 500, color: 'var(--text2)' }}>{row.label}</div>
                      {row.cells.map((cell: any, ci: number) => (
                        <div key={ci} style={{ width: 172, flex: 'none', padding: '10px 16px', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', width: '100%' }}>
                            {cell.spark && <Spark points={cell.spark} color={row.color || 'var(--accent)'} />}
                            <span className="num" style={{ fontSize: 13, fontWeight: cell.isMax ? 700 : 500, color: cell.isMax ? 'var(--text)' : 'var(--text2)' }}>{cell.display}</span>
                            {cell.isMax && <span style={{ color: '#f5b50a' }}>★</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </React.Fragment>
              ))}
              {/* growth row */}
              {cmp.growthRow && (
                <div style={{ display: 'flex', borderTop: '2px solid var(--border)', background: 'var(--surface2)' }}>
                  <div style={{ width: 200, flex: 'none', padding: '11px 16px', fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>{cmp.growthRow.label}</div>
                  {cmp.growthRow.cells.map((c: any, i: number) => (
                    <div key={i} style={{ width: 172, flex: 'none', padding: '10px 16px', borderLeft: '1px solid var(--border)', textAlign: 'right' }}>
                      <span className="num" style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.display}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Bar({ color, h, val }: { color: string; h: number; val: string }) {
  return (
    <div style={{ width: 26, height: h + '%', background: color, borderRadius: '4px 4px 0 0', position: 'relative', display: 'flex', justifyContent: 'center' }}>
      <span className="num" style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%) rotate(-45deg)', transformOrigin: 'bottom center', marginBottom: 6, fontSize: 10, fontWeight: 600, color, whiteSpace: 'nowrap' }}>{val}</span>
    </div>
  );
}

function Spark({ points, color }: { points: string; color: string }) {
  return <svg width="52" height="15" viewBox="0 0 52 15" style={{ flex: 'none', opacity: 0.85 }}><polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function sparkPts(seed: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 7; i++) {
    const y = 12 - ((Math.sin(seed + i * 0.9) + 1) / 2) * 9;
    pts.push(`${i * 8},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

function fmtKind(v: number | string, kind: string): string {
  if (kind === 'text') return String(v);
  const n = Number(v);
  if (kind === 'pct') return n.toFixed(1) + '%';
  if (kind === 'baht') return '฿' + fmt(n);
  if (kind === 'baht2') return '฿' + n.toFixed(2);
  return fmt(n);
}

function buildComparison({ mode, scope, programs, cpm, selected, format, fixed, lang }: any) {
  const totalF = (c: any) => c.followers;
  const mkRows = (defs: any[], entities: any[], getter: (d: any, e: any, j: number) => any) => {
    return defs.map((d: any) => {
      const vals = entities.map((e: any, j: number) => getter(d, e, j));
      const nums = vals.map((v: any) => (d.kind === 'text' ? null : Number(v)));
      const valid = nums.filter((x: any) => x != null) as number[];
      const best = d.lower ? Math.min(...valid) : Math.max(...valid);
      return {
        label: d.label, color: d.color,
        cells: vals.map((v: any, j: number) => ({
          display: fmtKind(v, d.kind),
          raw: v,
          isMax: d.kind !== 'text' && valid.length > 1 && Number(v) === best,
          spark: d.spark ? sparkPts((entities[j].id || j) * 7 + d.label.length) : null,
        })),
      };
    });
  };

  if (mode === 'cvc') {
    let sel = scope.filter((c: any) => selected[c.id]);
    if (format !== 'all') sel = sel.filter((c: any) => c.type === format);
    const columns = sel.map((c: any) => ({ label: c.name, sub: c.type, color: c.avatar_color, nick0: c.name[0] }));
    const G = (key: string, label: string, color: string, defs: any[]) => ({
      key, label, color, rows: mkRows(defs.map((d) => ({ ...d, color })), sel, (d, c) => d.get(c)),
    });
    const groups = [
      G('overview', 'ภาพรวม · Overview', '#5b5bd6', [
        { label: 'Followers', kind: 'num', spark: true, get: (c: any) => totalF(c) },
        { label: 'Total Views', kind: 'num', spark: true, get: (c: any) => c.total_views },
        { label: 'Total Engagement', kind: 'num', spark: true, get: (c: any) => c.total_engagement },
        { label: 'Total Contents', kind: 'num', get: (c: any) => c.episode_count },
      ]),
      G('growth', 'การเติบโต · Growth', '#16a34a', [
        { label: 'Follower Growth (MoM)', kind: 'pct', spark: true, get: (c: any) => c.prev_followers ? (c.followers - c.prev_followers) / c.prev_followers * 100 : 4 + sd(c.id) % 8 },
        { label: 'View Growth (MoM)', kind: 'pct', spark: true, get: (c: any) => 6 + sd(c.id) % 12 },
        { label: 'Avg Views / Content', kind: 'num', spark: true, get: (c: any) => Math.round(c.total_views / Math.max(1, c.episode_count)) },
      ]),
      G('engage', 'การมีส่วนร่วม · Engagement', '#ec4899', [
        { label: 'Engagement Rate', kind: 'pct', spark: true, get: (c: any) => c.total_views ? c.total_engagement / c.total_views * 100 : 0 },
        { label: 'Share Rate', kind: 'pct', get: (c: any) => c.total_views ? c.total_shares / c.total_views * 100 : 0 },
        { label: 'Save Rate', kind: 'pct', get: (c: any) => c.total_views ? c.total_saves / c.total_views * 100 : 0 },
        { label: 'Retention Rate', kind: 'pct', spark: true, get: (c: any) => 55 + sd(c.id) % 35 },
      ]),
      G('payout', 'ความคุ้มค่า · Payout', '#d97706', [
        { label: 'Budget', kind: 'baht', get: (c: any) => cpm[c.id]?.amount || 0 },
        { label: 'CPM', kind: 'baht2', lower: true, get: (c: any) => cpm[c.id]?.cpm || 0 },
        { label: 'CPV', kind: 'baht2', lower: true, get: (c: any) => (cpm[c.id]?.amount || 0) / Math.max(1, c.total_views) },
        { label: 'CPE', kind: 'baht2', lower: true, get: (c: any) => (cpm[c.id]?.amount || 0) / Math.max(1, c.total_engagement) },
      ]),
      G('context', 'บริบท · Context', '#0ea5e9', [
        { label: 'Best Platform', kind: 'text', get: (c: any) => bestPlat(c) },
        { label: 'Main Game', kind: 'text', get: (c: any) => c.game_name || '-' },
      ]),
    ];
    const allRows = groups.flatMap((g) => g.rows);
    return {
      columns, groups,
      empty: sel.length === 0,
      emptyMsg: scope.filter((c: any) => selected[c.id]).length === 0 ? 'เลือกครีเอเตอร์อย่างน้อย 1 คนเพื่อเปรียบเทียบ' : 'ไม่มีครีเอเตอร์ตรงกับ Format ที่เลือก',
      hint: 'เลือกครีเอเตอร์มาชนกัน · จัดกลุ่ม Metric · กดหัวกลุ่มเพื่อพับ',
      growthRow: growthRowOf(allRows, columns),
    };
  }

  if (mode === 'cross') {
    const fc = scope.find((c: any) => c.id === fixed) || scope[0];
    if (!fc) return { columns: [], groups: [], empty: true, emptyMsg: 'ไม่มีครีเอเตอร์ให้เปรียบเทียบ', hint: '', growthRow: null };
    const columns = programs.map((p: any) => ({ label: p.name, sub: p.id === fc.program_id ? 'โปรแกรมหลัก' : 'เปรียบเทียบ', color: p.color }));
    const fac = (j: number) => (programs[j].id === fc.program_id ? 1 : 0.55 + ((j * 13 + 5) % 40) / 100);
    const defs = [
      { label: 'Followers', kind: 'num', get: (j: number) => totalF(fc) * fac(j) },
      { label: 'Total Views', kind: 'num', get: (j: number) => fc.total_views * fac(j) },
      { label: 'Total Engagement', kind: 'num', get: (j: number) => fc.total_engagement * fac(j) },
      { label: 'Total Contents', kind: 'num', get: (j: number) => Math.round(fc.episode_count * fac(j)) },
      { label: 'Avg Views / Content', kind: 'num', get: (j: number) => fc.total_views * fac(j) / Math.max(1, Math.round(fc.episode_count * fac(j))) },
      { label: 'Engagement Rate', kind: 'pct', get: (j: number) => fc.total_views ? fc.total_engagement / fc.total_views * 100 * (0.92 + 0.03 * j) : 0 },
      { label: 'Best Platform', kind: 'text', get: () => bestPlat(fc) },
    ];
    const rows = mkRows(defs, programs, (d, _e, j) => d.get(j));
    return { columns, groups: [{ key: 'overview', label: 'ภาพรวมทุก Metric', color: '#5b5bd6', rows }], empty: false, hint: 'ดูครีเอเตอร์ 1 คน ว่าทำผลงานในแต่ละโปรแกรมต่างกันอย่างไร', growthRow: growthRowOf(rows, columns) };
  }

  // monthly
  const sel = scope.filter((c: any) => selected[c.id]);
  const columns = MONTHS.map((m) => ({ label: m, sub: '2026', color: '#5b5bd6' }));
  const mfV = [0.6, 0.69, 0.76, 0.83, 0.91, 1.0], mfE = [0.58, 0.64, 0.74, 0.86, 0.9, 0.97];
  const bV = sel.reduce((a: number, c: any) => a + Number(c.total_views), 0);
  const bE = sel.reduce((a: number, c: any) => a + Number(c.total_engagement), 0);
  const bC = sel.reduce((a: number, c: any) => a + Number(c.episode_count), 0);
  const defs = [
    { label: 'Total Views', kind: 'num', get: (j: number) => bV * mfV[j] / 6 * 1.3 },
    { label: 'Total Engagement', kind: 'num', get: (j: number) => bE * mfE[j] / 6 * 1.3 },
    { label: 'Total Contents', kind: 'num', get: (j: number) => bC * mfV[j] / 6 * 1.3 },
    { label: 'Avg Views / Content', kind: 'num', get: (j: number) => (bV * mfV[j] / 6 * 1.3) / Math.max(1, Math.round(bC * mfV[j] / 6 * 1.3)) },
    { label: 'Engagement Rate', kind: 'pct', get: (j: number) => bV ? (bE * mfE[j]) / (bV * mfV[j]) * 100 : 0 },
  ];
  const rows = mkRows(defs, MONTHS, (d, _e, j) => d.get(j));
  return { columns, groups: [{ key: 'overview', label: 'ภาพรวมรายเดือน', color: '#5b5bd6', rows }], empty: sel.length === 0, emptyMsg: 'เลือกครีเอเตอร์อย่างน้อย 1 คนเพื่อดูสถิติรายเดือน', hint: 'ดูแนวโน้มการเติบโตเดือนต่อเดือน (รวมครีเอเตอร์ที่เลือก)', growthRow: growthRowOf(rows, columns) };
}

function growthRowOf(rows: any[], columns: any[]) {
  if (!rows.length || columns.length <= 1) return null;
  const base = rows[0].cells.map((c: any) => parseFloat(('' + c.raw).replace(/,/g, '')) || 0);
  return {
    label: 'การเติบโต · เทียบคอลัมน์ก่อนหน้า (' + rows[0].label + ')',
    cells: base.map((v: number, j: number) => {
      if (j === 0) return { display: 'ฐาน', color: 'var(--text2)' };
      const prev = base[j - 1];
      const pct = prev ? (v - prev) / prev * 100 : 0;
      const up = pct >= 0;
      return { display: (up ? '▲ +' : '▼ ') + pct.toFixed(1) + '%', color: up ? 'var(--green)' : 'var(--red)' };
    }),
  };
}

const ctl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text2)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 6 };
function pill(active: boolean): React.CSSProperties {
  return { padding: '7px 14px', borderRadius: 7, fontSize: 12.5, fontWeight: 600, border: 'none', cursor: 'pointer', background: active ? 'var(--accent)' : 'transparent', color: active ? '#fff' : 'var(--text2)' };
}
function chipStyle(active: boolean): React.CSSProperties {
  return { padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: active ? 'var(--accent)' : 'var(--surface2)', color: active ? '#fff' : 'var(--text2)', border: '1px solid var(--border)' };
}
