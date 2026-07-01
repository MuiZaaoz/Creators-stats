import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import { fmt, platformColor, typeColor } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';

type Mode = 'program' | 'creator' | 'platform';
type Metric = 'views' | 'engagement' | 'likes' | 'comments' | 'shares';

export default function Analytics() {
  const { lang } = useAppStore();
  const t = useT(lang);
  const [overview, setOverview] = useState<any>(null);
  const [mode, setMode] = useState<Mode>('program');
  const [metric, setMetric] = useState<Metric>('views');
  const [data, setData] = useState<any[]>([]);
  const [byPlatform, setByPlatform] = useState<any[]>([]);
  const [byType, setByType] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadComparison = async (m: Mode) => {
    const d = await api.analytics.comparison(m);
    setData(d);
  };

  useEffect(() => {
    Promise.all([
      api.analytics.overview(),
      api.analytics.byPlatform(),
      api.analytics.byType(),
      api.analytics.comparison('program'),
      api.analytics.monthly(),
    ]).then(([ov, bp, bt, comp, mon]) => {
      setOverview(ov);
      setByPlatform(bp);
      setByType(bt);
      setData(comp);
      setMonthly(mon);
      setLoading(false);
    });
  }, []);

  useEffect(() => { if (!loading) loadComparison(mode); }, [mode]);

  const maxVal = Math.max(...data.map(d => d[metric] || 0), 1);

  const MODES: { key: Mode; label: string }[] = [
    { key: 'program', label: t('program') },
    { key: 'creator', label: t('creators') },
    { key: 'platform', label: t('platform') },
  ];

  const METRICS: { key: Metric; label: string }[] = [
    { key: 'views', label: t('views') },
    { key: 'engagement', label: t('engagement') },
    { key: 'likes', label: t('likes') },
    { key: 'comments', label: t('comments') },
    { key: 'shares', label: t('shares') },
  ];

  if (loading) return <div style={{ padding: 40, color: 'var(--text2)' }}>{t('loading')}</div>;

  return (
    <div style={{ padding: '20px 28px', flex: 1 }}>
      <PageHeader title={t('analytics')} subtitle={lang === 'th' ? 'เปรียบเทียบและวิเคราะห์ข้อมูล' : 'Compare and analyze performance data'} />

      {/* Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label={t('views')} value={overview?.total_views} color="var(--accent2)" />
        <StatCard label={t('engagement')} value={overview?.total_engagement} color="var(--cyan)" />
        <StatCard label={t('likes')} value={overview?.total_likes} color="var(--red)" />
        <StatCard label={t('episodes')} value={overview?.total_episodes} />
      </div>

      {/* Monthly trend */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="section-title" style={{ margin: 0 }}>{lang === 'th' ? 'แนวโน้มรายเดือน' : 'Monthly Trend'}</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent)' }} /> {t('views')}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--cyan)' }} /> {t('engagement')}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 18, height: 180, padding: '0 4px' }}>
          {monthly.map((m: any, i: number) => {
            const maxV = Math.max(...monthly.map((x: any) => x.views || 0), 1);
            const vh = (m.views / maxV) * 100;
            const eh = (m.engagement / maxV) * 100;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 5 }}>
                  <div title={fmt(m.views)} style={{ width: '38%', background: 'var(--accent)', borderRadius: '4px 4px 0 0', height: vh + '%', minHeight: 3 }} />
                  <div title={fmt(m.engagement)} style={{ width: '38%', background: 'var(--cyan)', borderRadius: '4px 4px 0 0', height: eh + '%', minHeight: 3 }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{m.month}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginBottom: 20 }}>
        {/* By Platform */}
        <div className="card">
          <div className="section-title">{lang === 'th' ? 'แยกตามแพลตฟอร์ม' : 'By Platform'}</div>
          <table>
            <thead>
              <tr>
                <th>{t('platform')}</th>
                <th style={{ textAlign: 'right' }}>{t('views')}</th>
                <th style={{ textAlign: 'right' }}>{t('engagement')}</th>
                <th style={{ textAlign: 'right' }}>{t('likes')}</th>
                <th style={{ textAlign: 'right' }}>{t('comments')}</th>
              </tr>
            </thead>
            <tbody>
              {byPlatform.map((p: any) => (
                <tr key={p.platform}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="platform-icon" style={{ background: platformColor(p.platform), width: 22, height: 22, fontSize: 10 }}>
                        {p.platform.slice(0, 2).toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 600 }}>{p.platform}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }} className="num">{fmt(p.total_views)}</td>
                  <td style={{ textAlign: 'right' }} className="num">{fmt(p.total_engagement)}</td>
                  <td style={{ textAlign: 'right' }} className="num">{fmt(p.total_likes)}</td>
                  <td style={{ textAlign: 'right' }} className="num">{fmt(p.total_comments)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* By Type */}
        <div className="card">
          <div className="section-title">{lang === 'th' ? 'แยกตามประเภท' : 'By Type'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {byType.map((tp: any) => {
              const maxV = Math.max(...byType.map((x: any) => x.total_views || 0), 1);
              return (
                <div key={tp.type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: typeColor(tp.type), fontSize: 13 }}>{tp.type}</span>
                    <span className="num" style={{ fontSize: 12, color: 'var(--text2)' }}>{fmt(tp.total_views)}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: ((tp.total_views / maxV) * 100) + '%', background: typeColor(tp.type), borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                    {tp.episode_count} {lang === 'th' ? 'คอนเทนต์' : 'episodes'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="section-title" style={{ margin: 0 }}>{lang === 'th' ? 'เปรียบเทียบ' : 'Comparison'}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {MODES.map(m => (
                <button key={m.key}
                  onClick={() => setMode(m.key)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: mode === m.key ? 'var(--accent)' : 'var(--surface2)',
                    color: mode === m.key ? '#fff' : 'var(--text2)',
                    border: '1px solid var(--border)',
                  }}>{m.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {METRICS.map(m => (
                <button key={m.key}
                  onClick={() => setMetric(m.key)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: metric === m.key ? 'var(--surface2)' : 'transparent',
                    color: metric === m.key ? 'var(--text)' : 'var(--text2)',
                    border: '1px solid ' + (metric === m.key ? 'var(--border)' : 'transparent'),
                  }}>{m.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180, padding: '0 4px' }}>
            {data.map((d: any, i: number) => {
              const pct = (d[metric] || 0) / maxVal * 100;
              const color = d.color && d.color.startsWith('#') ? d.color : platformColor(d.label);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div className="num" style={{ fontSize: 10, color: 'var(--text2)', textAlign: 'center' }}>{fmt(d[metric])}</div>
                  <div style={{
                    width: '100%', background: color, borderRadius: '4px 4px 0 0',
                    height: pct + '%', minHeight: 4, transition: 'height 0.3s',
                  }} />
                  <div style={{ fontSize: 10, color: 'var(--text2)', textAlign: 'center', wordBreak: 'break-word', maxWidth: 60 }}>
                    {d.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <table>
          <thead>
            <tr>
              <th>{lang === 'th' ? 'รายการ' : 'Item'}</th>
              <th style={{ textAlign: 'right' }}>{t('views')}</th>
              <th style={{ textAlign: 'right' }}>{t('engagement')}</th>
              <th style={{ textAlign: 'right' }}>{t('likes')}</th>
              <th style={{ textAlign: 'right' }}>{t('comments')}</th>
              <th style={{ textAlign: 'right' }}>{t('shares')}</th>
              <th style={{ textAlign: 'right' }}>{t('episodes')}</th>
              <th style={{ textAlign: 'right' }}>{lang === 'th' ? 'เฉลี่ย/คลิป' : 'Avg/clip'}</th>
              <th style={{ textAlign: 'right' }}>{lang === 'th' ? 'การเติบโต MOM' : 'Growth MOM'}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d: any, i: number) => {
              const color = d.color && d.color.startsWith('#') ? d.color : platformColor(d.label);
              return (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                      <span style={{ fontWeight: 600 }}>{d.label}</span>
                      {d.group_name && <span style={{ fontSize: 11, color: 'var(--text2)' }}>· {d.group_name}</span>}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }} className="num">{fmt(d.views)}</td>
                  <td style={{ textAlign: 'right' }} className="num">{fmt(d.engagement)}</td>
                  <td style={{ textAlign: 'right' }} className="num">{fmt(d.likes)}</td>
                  <td style={{ textAlign: 'right' }} className="num">{fmt(d.comments)}</td>
                  <td style={{ textAlign: 'right' }} className="num">{fmt(d.shares)}</td>
                  <td style={{ textAlign: 'right' }} className="num">{fmt(d.episodes)}</td>
                  <td style={{ textAlign: 'right' }} className="num">{fmt(d.episodes > 0 ? d.views / d.episodes : 0)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {d.growth == null ? (
                      <span style={{ color: 'var(--text2)' }}>—</span>
                    ) : (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                        background: (d.growth >= 0 ? 'var(--green)' : 'var(--red)') + '22',
                        color: d.growth >= 0 ? 'var(--green)' : 'var(--red)',
                      }}>
                        {d.growth >= 0 ? '▲' : '▼'} {(Math.abs(d.growth) * 100).toFixed(1)}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
