import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import { fmt, initials, platformColor, platformInitial, relDate } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { usePreviewStore } from '../store/previewStore';

type Metric = 'views' | 'engagement' | 'likes';

export default function Dashboard() {
  const { lang } = useAppStore();
  const t = useT(lang);
  const navigate = useNavigate();
  const openPreview = usePreviewStore((s) => s.open);

  const [programs, setPrograms] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [dash, setDash] = useState<any>(null);
  const [selectedProg, setSelectedProg] = useState<number | null>(null);
  const [creatorFilter, setCreatorFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [metric, setMetric] = useState<Metric>('views');
  const [clipLimit, setClipLimit] = useState(8);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.programs.list(),
      api.creators.list(),
      api.contents.list({ limit: 50 }),
      api.audit.list({ limit: 8 }),
    ]).then(([progs, crs, ct, au]) => {
      setPrograms(progs);
      setCreators(crs);
      setContents(ct);
      setAudit((au as any).items || au);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const params: any = {};
    if (selectedProg) params.program_id = selectedProg;
    if (platformFilter) params.platform = platformFilter;
    api.analytics.dashboard(params).then(setDash);
  }, [selectedProg, platformFilter]);

  const filteredContents = contents.filter((c) => {
    if (selectedProg && c.program_id !== selectedProg) return false;
    if (platformFilter && c.platform !== platformFilter) return false;
    if (creatorFilter && String(c.creator_id) !== creatorFilter) return false;
    return true;
  });

  const previewOf = (c: any) => openPreview({
    title: c.title, creator: c.creator_name, avatar_color: c.avatar_color,
    platform: c.platform, type: c.content_type, views: c.views, engagement: c.engagement, url: c.url,
  });

  if (loading || !dash) return <div style={{ padding: 40, color: 'var(--text2)' }}>{t('loading')}</div>;

  const tot = dash.totals;
  const leaderboard = [...(dash.leaderboard || [])].sort((a, b) => (b[metric] || 0) - (a[metric] || 0));
  const maxLead = Math.max(...leaderboard.map((c) => c[metric] || 0), 1);
  const eng = dash.engagement;
  const engMax = Math.max(eng.likes, eng.comments, eng.shares, eng.saves, 1);
  const donut = dash.donut || [];

  // build donut stroke segments
  let acc = 0;
  const circ = 2 * Math.PI * 54;
  const segs = donut.map((d: any) => {
    const frac = d.pct / 100;
    const seg = { color: platformColor(d.label), dash: `${frac * circ} ${circ}`, offset: -acc * circ };
    acc += frac;
    return seg;
  });

  return (
    <div style={{ padding: '20px 28px', flex: 1 }}>
      <PageHeader title="Creator Hub" subtitle={lang === 'th' ? 'ภาพรวมระบบ' : 'Platform Overview'} />

      {/* Updates feed */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{lang === 'th' ? 'อัปเดตล่าสุด' : 'Latest Updates'}</span>
          <span style={{ fontSize: 11.5, color: 'var(--text2)' }}>{lang === 'th' ? 'รายการใหม่อยู่บนสุด' : 'Newest first'}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }}>
          {audit.map((u: any) => (
            <div key={u.id} style={{ flex: 'none', width: 248, border: '1px solid var(--border)', borderRadius: 11, padding: '11px 13px', background: 'var(--surface2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <span className="tag" style={{ background: (u.color || '#888') + '33', color: u.color || '#888' }}>{u.tag}</span>
                <span style={{ fontSize: 10.5, color: 'var(--text2)', fontFamily: 'monospace' }}>{relDate(u.created_at)}</span>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35, marginBottom: 3 }}>{u.action}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{u.user}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Program tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setSelectedProg(null)} style={tabStyle(selectedProg === null, 'var(--accent)')}>All</button>
        {programs.map((p) => (
          <button key={p.id} onClick={() => setSelectedProg(p.id)} style={tabStyle(selectedProg === p.id, p.color)}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            {p.name}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
        <select value={creatorFilter} onChange={(e) => setCreatorFilter(e.target.value)} style={{ minWidth: 180 }}>
          <option value="">{lang === 'th' ? 'ทุกครีเอเตอร์' : 'All creators'}</option>
          {creators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
          <option value="">{lang === 'th' ? 'ทุกแพลตฟอร์ม' : 'All platforms'}</option>
          {['YouTube', 'Facebook', 'TikTok', 'Instagram'].map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        <StatCard label={t('views')} value={tot.views} color="var(--accent2)" />
        <StatCard label={t('engagement')} value={tot.engagement} color="var(--cyan)" />
        <StatCard label={t('episodes')} value={tot.episodes} color="var(--yellow)" />
        <StatCard label={t('creators')} value={tot.creators} />
      </div>

      {/* Leaderboard */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>{lang === 'th' ? 'อันดับครีเอเตอร์' : 'Creator Leaderboard'}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{lang === 'th' ? 'จัดอันดับตามตัวชี้วัด' : 'Ranked by metric'}</div>
          </div>
          <div style={{ display: 'flex', gap: 2, background: 'var(--surface2)', borderRadius: 8, padding: 3 }}>
            {(['views', 'engagement', 'likes'] as Metric[]).map((m) => (
              <button key={m} onClick={() => setMetric(m)} style={metricStyle(metric === m)}>{t(m)}</button>
            ))}
          </div>
        </div>
        {leaderboard.slice(0, 6).map((c: any, i: number) => (
          <div key={c.id} onClick={() => navigate(`/creators/${c.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: i ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
            <div style={{ width: 20, fontWeight: 600, color: 'var(--text2)', fontSize: 12.5 }}>{i + 1}</div>
            <div className="avatar" style={{ background: c.avatar_color, width: 30, height: 30, fontSize: 12 }}>{initials(c.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{c.program_name}</div>
            </div>
            <div style={{ width: 140 }}>
              <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden', marginBottom: 3 }}>
                <div style={{ height: '100%', width: ((c[metric] || 0) / maxLead * 100) + '%', background: c.program_color || 'var(--accent)', borderRadius: 3 }} />
              </div>
              <div className="num" style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>{fmt(c[metric])}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Clips table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px' }}>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>{lang === 'th' ? 'คอนเทนต์ล่าสุด' : 'Recent Content'}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{lang === 'th' ? 'กดเพื่อดูตัวอย่าง' : 'Click to preview'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>{lang === 'th' ? 'แสดง' : 'Show'}</span>
            <div style={{ display: 'flex', gap: 2, background: 'var(--surface2)', borderRadius: 8, padding: 3 }}>
              {[8, 15, 30].map((n) => (
                <button key={n} onClick={() => setClipLimit(n)} style={metricStyle(clipLimit === n)}>{n}</button>
              ))}
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--text2)', fontFamily: 'monospace' }}>/ {filteredContents.length}</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>{lang === 'th' ? 'คอนเทนต์' : 'Content'}</th>
              <th>{t('platform')}</th>
              <th>{t('type')}</th>
              <th style={{ textAlign: 'right' }}>{t('views')}</th>
              <th style={{ textAlign: 'right' }}>{t('engagement')}</th>
              <th style={{ textAlign: 'right' }}>{lang === 'th' ? 'ตัวอย่าง' : 'Preview'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredContents.slice(0, clipLimit).map((c: any) => (
              <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => previewOf(c)}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 46, height: 30, borderRadius: 6, background: 'linear-gradient(135deg,#1c1c24,#2d2640)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{c.creator_name}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span className="platform-icon" style={{ background: platformColor(c.platform), width: 18, height: 18, fontSize: 9 }}>{platformInitial(c.platform)}</span>
                    <span style={{ fontSize: 12 }}>{c.platform}</span>
                  </span>
                </td>
                <td><span className="tag" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>{c.content_type}</span></td>
                <td style={{ textAlign: 'right' }} className="num">{fmt(c.views)}</td>
                <td style={{ textAlign: 'right' }} className="num">{fmt(c.engagement)}</td>
                <td style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent2)', fontWeight: 600 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
                    {lang === 'th' ? 'ดูตัวอย่าง' : 'preview'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Platform Stats */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 14 }}>{lang === 'th' ? 'สถิติแพลตฟอร์ม' : 'Platform Stats'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {dash.platform_stats.map((p: any) => (
            <div key={p.platform} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span className="platform-icon" style={{ background: platformColor(p.platform), width: 24, height: 24, fontSize: 11 }}>{platformInitial(p.platform)}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{p.platform}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 600, color: 'var(--text2)' }} className="num">{p.pct}%</span>
              </div>
              {[['Followers', p.followers], ['Views', p.views], ['Engagement', p.engagement]].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
                  <span style={{ color: 'var(--text2)' }}>{k}</span>
                  <span className="num" style={{ fontWeight: 600 }}>{fmt(v as number)}</span>
                </div>
              ))}
              <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 3, marginTop: 9, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: p.pct + '%', background: platformColor(p.platform), borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distribution donut + Engagement breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card">
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 2 }}>{lang === 'th' ? 'การกระจายแพลตฟอร์ม' : 'Platform Distribution'}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>Views distribution</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <svg width="132" height="132" viewBox="0 0 140 140" style={{ flex: 'none', transform: 'rotate(-90deg)' }}>
              <circle cx="70" cy="70" r="54" fill="none" stroke="var(--surface2)" strokeWidth="20" />
              {segs.map((s: any, i: number) => (
                <circle key={i} cx="70" cy="70" r="54" fill="none" stroke={s.color} strokeWidth="20" strokeDasharray={s.dash} strokeDashoffset={s.offset} />
              ))}
            </svg>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {donut.map((d: any) => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: platformColor(d.label) }} />
                  <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text2)' }}>{d.label}</span>
                  <span className="num" style={{ fontSize: 12.5, fontWeight: 600 }}>{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 2 }}>Engagement</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>{lang === 'th' ? 'การมีส่วนร่วมแยกประเภท' : 'By type'}</div>
          {[['Likes', eng.likes, 'var(--red)'], ['Comments', eng.comments, 'var(--cyan)'], ['Shares', eng.shares, 'var(--green)'], ['Saves', eng.saves, 'var(--yellow)']].map(([label, val, color]) => (
            <div key={label as string} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                <span style={{ color: 'var(--text2)' }}>{label}</span>
                <span className="num" style={{ fontWeight: 600 }}>{fmt(val as number)}</span>
              </div>
              <div style={{ height: 7, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: ((val as number) / engMax * 100) + '%', background: color as string, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function tabStyle(active: boolean, color: string): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10,
    fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flex: 'none', cursor: 'pointer',
    background: active ? color : 'var(--surface2)', color: active ? '#fff' : 'var(--text2)',
    border: '1px solid ' + (active ? color : 'var(--border)'),
  };
}

function metricStyle(active: boolean): React.CSSProperties {
  return {
    padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none',
    background: active ? 'var(--surface)' : 'transparent', color: active ? 'var(--text)' : 'var(--text2)',
    cursor: 'pointer',
  };
}
