import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import { fmt, initials, platformColor, platformInitial, relDate, typeColor } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import LinkPreview, { PreviewLink } from '../components/LinkPreview';

export default function Dashboard() {
  const { lang } = useAppStore();
  const t = useT(lang);
  const [overview, setOverview] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [byProgram, setByProgram] = useState<any[]>([]);
  const [selectedProg, setSelectedProg] = useState<number | null>(null);
  const [preview, setPreview] = useState<PreviewLink | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.analytics.overview(),
      api.programs.list(),
      api.contents.list({ limit: 200 }),
      api.audit.list({ limit: 8 }),
      api.analytics.byProgram(),
    ]).then(([ov, progs, ct, au, bp]) => {
      setOverview(ov);
      setPrograms(progs);
      setContents(ct);
      setAudit((au as any).items || au);
      setByProgram(bp);
      if (progs.length > 0) setSelectedProg(progs[0].id);
      setLoading(false);
    });
  }, []);

  const progContents = contents.filter(c => !selectedProg || c.program_id === selectedProg);

  if (loading) return <div style={{ padding: 40, color: 'var(--text2)' }}>{t('loading')}</div>;

  return (
    <div style={{ padding: '20px 28px', flex: 1 }}>
      <PageHeader title="Creator Hub" subtitle={lang === 'th' ? 'ภาพรวมระบบ' : 'Platform Overview'} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label={t('views')} value={overview?.total_views} color="var(--accent2)" />
        <StatCard label={t('engagement')} value={overview?.total_engagement} color="var(--cyan)" />
        <StatCard label={t('episodes')} value={overview?.total_episodes} color="var(--yellow)" />
        <StatCard label={t('creators')} value={overview?.total_creators} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 20 }}>
        {/* Program tabs + leaderboard */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, marginRight: 6 }}>{t('programs')}</span>
            {programs.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProg(p.id)}
                style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: selectedProg === p.id ? p.color : 'var(--surface2)',
                  color: selectedProg === p.id ? '#fff' : 'var(--text2)',
                  border: '1px solid ' + (selectedProg === p.id ? p.color : 'var(--border)'),
                }}
              >{p.name}</button>
            ))}
            <button onClick={() => setSelectedProg(null)} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: selectedProg === null ? 'var(--accent)' : 'var(--surface2)',
              color: selectedProg === null ? '#fff' : 'var(--text2)',
              border: '1px solid ' + (selectedProg === null ? 'var(--accent)' : 'var(--border)'),
            }}>All</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('name')}</th>
                  <th>{t('platform')}</th>
                  <th style={{ textAlign: 'right' }}>{t('views')}</th>
                  <th style={{ textAlign: 'right' }}>{t('engagement')}</th>
                  <th style={{ textAlign: 'center' }}>{lang === 'th' ? 'ลิงก์' : 'Link'}</th>
                </tr>
              </thead>
              <tbody>
                {progContents.slice(0, 10).map((c, i) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }}
                    onClick={() => setPreview({ platform: c.platform, url: c.url, title: c.title, creator_name: c.creator_name, views: c.views, engagement: c.engagement, uv: c.uv, video_views: c.video_views })}>
                    <td style={{ color: 'var(--text2)', fontWeight: 700 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ background: c.avatar_color, width: 28, height: 28, fontSize: 11 }}>{initials(c.creator_name)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{c.creator_name}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="platform-icon" style={{ background: platformColor(c.platform) }}>{platformInitial(c.platform)}</span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="num">{fmt(c.views)}</td>
                    <td style={{ textAlign: 'right' }} className="num">{fmt(c.engagement)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {c.url ? <span className="link-chip">🔗 Preview</span> : <span style={{ color: 'var(--text2)', fontSize: 12 }}>-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Program performance */}
        <div className="card">
          <div className="section-title">โปรแกรม Performance</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {byProgram.map((p: any) => {
              const maxViews = Math.max(...byProgram.map((x: any) => x.total_views || 0));
              const pct = maxViews > 0 ? (p.total_views / maxViews) * 100 : 0;
              return (
                <div key={p.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: p.color }}>{p.name}</span>
                    <span className="num" style={{ fontSize: 12, color: 'var(--text2)' }}>{fmt(p.total_views)}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: p.color, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="card">
        <div className="section-title">{lang === 'th' ? 'กิจกรรมล่าสุด' : 'Recent Activity'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {audit.map((a: any) => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 7,
              background: 'var(--surface2)',
            }}>
              {a.tag && (
                <span className="tag" style={{ background: a.color + '22', color: a.color }}>{a.tag}</span>
              )}
              <div style={{ flex: 1, fontSize: 13 }}>{a.action}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{a.user}</div>
            </div>
          ))}
        </div>
      </div>

      {preview && <LinkPreview link={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
