import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import { fmt, initials, platformColor, platformInitial, typeColor } from '../lib/utils';
import Header from '../components/Header';
import StatCard from '../components/StatCard';

type Metric = 'views' | 'engagement' | 'likes';

export default function Dashboard() {
  const { lang, openPreview } = useAppStore();
  const t = useT(lang);
  const [overview, setOverview] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [prog, setProg] = useState<number | null>(null);
  const [platform, setPlatform] = useState('');
  const [metric, setMetric] = useState<Metric>('views');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.analytics.overview(), api.programs.list(), api.contents.list({ limit: 40 }),
      api.audit.list({ limit: 8 }), api.analytics.byCreator(),
    ]).then(([ov, pr, ct, au, cr]) => {
      setOverview(ov); setPrograms(pr); setContents(ct);
      setAudit((au as any).items || au); setCreators(cr); setLoading(false);
    });
  }, []);

  const fContents = contents.filter(c =>
    (!prog || c.program_id === prog) && (!platform || c.platform === platform));
  const fCreators = creators.filter(c => !prog || c.program_id === prog);
  const metricKey = metric === 'views' ? 'total_views' : metric === 'engagement' ? 'total_engagement' : 'total_likes';
  const ranked = [...fCreators].sort((a, b) => (b[metricKey] || 0) - (a[metricKey] || 0)).slice(0, 6);
  const maxVal = Math.max(...ranked.map(c => c[metricKey] || 0), 1);

  if (loading) return (<><Header title="Creator Hub" /><div className="empty-state"><div className="spinner" /></div></>);

  return (
    <>
      <Header title={t('dashboard')} subtitle={lang === 'th' ? 'ภาพรวมทั้งหมดของโปรแกรมครีเอเตอร์' : 'Overview of all creator programs'} />
      <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Updates feed */}
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
            <span className="section-title">{lang === 'th' ? 'อัปเดตล่าสุด' : 'Latest Updates'}</span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{lang === 'th' ? 'รายการใหม่อยู่บนสุด · กดดูตัวอย่าง' : 'Newest first · click to preview'}</span>
          </div>
          <div className="scroll-x" style={{ display: 'flex', gap: 12, paddingBottom: 4 }}>
            {audit.map((a: any) => (
              <div key={a.id} style={{
                minWidth: 250, flexShrink: 0, background: 'var(--surface2)',
                border: '1px solid var(--border)', borderRadius: 11, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="tag" style={{ background: (a.color || '#888') + '1f', color: a.color || '#888' }}>{a.tag}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--text3)' }} className="num">{a.created_at?.slice(5, 16)}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{a.action}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text3)' }}>{a.user}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <EyeIcon /> preview
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter chips */}
        <div className="scroll-x">
          <div className="pill-tabs" style={{ flexWrap: 'nowrap' }}>
            <button className={'pill' + (prog === null ? ' active' : '')} onClick={() => setProg(null)}>
              {lang === 'th' ? 'ทั้งหมด' : 'All'}
            </button>
            {programs.map(p => (
              <button key={p.id} className={'pill' + (prog === p.id ? ' active' : '')} onClick={() => setProg(p.id)}>
                <span className="pill-dot" style={{ background: p.color }} />{p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ minWidth: 170 }}>
            <option value="">{lang === 'th' ? 'ทุกแพลตฟอร์ม' : 'All platforms'}</option>
            {['YouTube', 'TikTok', 'Facebook', 'Instagram'].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <StatCard label={lang === 'th' ? 'จำนวนครีเอเตอร์' : 'Creators'} value={overview?.total_creators} icon={<UsersMini />} />
          <StatCard label="Total Views" value={overview?.total_views} growth={12.6} growthLabel={lang === 'th' ? 'เดือนนี้' : 'this month'} />
          <StatCard label="Total Engagement" value={overview?.total_engagement} growth={8.1} growthLabel={lang === 'th' ? 'เดือนนี้' : 'this month'} />
          <StatCard label="Total Contents" value={overview?.total_episodes} growth={5.4} growthLabel={lang === 'th' ? 'เดือนนี้' : 'this month'} />
        </div>

        {/* Leaderboard */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div className="section-title">{lang === 'th' ? 'อันดับครีเอเตอร์' : 'Creator Leaderboard'}</div>
              <div className="section-sub">{lang === 'th' ? 'จัดอันดับตามตัวชี้วัด' : 'Ranked by metric'}</div>
            </div>
            <div className="seg">
              {([['views', t('views')], ['engagement', t('engagement')], ['likes', t('likes')]] as [Metric, string][]).map(([k, l]) => (
                <button key={k} className={metric === k ? 'active' : ''} onClick={() => setMetric(k)}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ranked.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 4px' }}>
                <span className="num" style={{ width: 18, fontWeight: 700, color: i < 3 ? 'var(--accent)' : 'var(--text3)', fontSize: 14 }}>{i + 1}</span>
                <div className="avatar" style={{ background: c.avatar_color, width: 34, height: 34 }}>{initials(c.name)}</div>
                <div style={{ minWidth: 150 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.program_name}</div>
                </div>
                <div style={{ flex: 1, height: 8, background: 'var(--surface3)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: ((c[metricKey] || 0) / maxVal * 100) + '%', background: c.program_color || 'var(--accent)', borderRadius: 5 }} />
                </div>
                <span className="num" style={{ width: 96, textAlign: 'right', fontWeight: 700, fontSize: 13.5 }}>{fmt(c[metricKey])}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Latest content table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="section-title">{lang === 'th' ? 'คอนเทนต์ล่าสุด' : 'Latest Content'}</span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{lang === 'th' ? 'กดเพื่อดูตัวอย่าง' : 'click to preview'}</span>
          </div>
          <div className="scroll-x">
            <table style={{ minWidth: 760 }}>
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
                {fContents.slice(0, 12).map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: c.avatar_color, width: 30, height: 30, fontSize: 11, borderRadius: 8 }}>{initials(c.creator_name)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.creator_name}</div>
                        </div>
                      </div>
                    </td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span className="platform-icon" style={{ background: platformColor(c.platform) }}>{platformInitial(c.platform)}</span><span style={{ fontSize: 12 }}>{c.platform}</span></div></td>
                    <td><span className="tag" style={{ background: typeColor(c.content_type) + '1f', color: typeColor(c.content_type) }}>{c.content_type}</span></td>
                    <td style={{ textAlign: 'right' }} className="num">{fmt(c.views)}</td>
                    <td style={{ textAlign: 'right' }} className="num">{fmt(c.engagement)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => openPreview({
                        title: c.title, creator: c.creator_name, avatar_color: c.avatar_color,
                        platform: c.platform, type: c.content_type, views: c.views, engagement: c.engagement,
                        likes: c.likes, comments: c.comments, url: c.url,
                      })}
                        style={{ background: 'transparent', color: 'var(--accent)', fontWeight: 600, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <EyeIcon /> {lang === 'th' ? 'ดูตัวอย่าง' : 'preview'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

const EyeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
);
const UsersMini = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0111 0M16 5.2a3 3 0 010 5.6" /></svg>
);
