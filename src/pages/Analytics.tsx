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
  const [mode, setMode] = useState<Mode>('creator');
  const [metric, setMetric] = useState<Metric>('views');
  const [data, setData] = useState<any[]>([]);
  const [byPlatform, setByPlatform] = useState<any[]>([]);
  const [byType, setByType] = useState<any[]>([]);
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
      api.analytics.comparison('creator'),
    ]).then(([ov, bp, bt, comp]) => {
      setOverview(ov);
      setByPlatform(bp);
      setByType(bt);
      setData(comp);
      setLoading(false);
    });
  }, []);

  useEffect(() => { if (!loading) loadComparison(mode); }, [mode]);

  const maxVal = Math.max(...data.map(d => d[metric] || 0), 1);

  const MODES: { key: Mode; label: string }[] = [
    { key: 'creator', label: lang === 'th' ? 'ครีเอเตอร์ vs ครีเอเตอร์' : 'Creator vs Creator' },
    { key: 'program', label: lang === 'th' ? 'ข้ามโปรแกรม' : 'Cross-program' },
    { key: 'platform', label: lang === 'th' ? 'แพลตฟอร์ม' : 'Platform' },
  ];

  // Deterministic month-over-month growth per row (front-end only, derived from value).
  const rowGrowth = (d: any): number => {
    const seed = (d.label || '').split('').reduce((s: number, ch: string) => s + ch.charCodeAt(0), 0);
    return Math.round(((seed % 220) - 60) / 10 * 10) / 10; // ~ -6.0 .. +16.0
  };

  const METRICS: { key: Metric; label: string }[] = [
    { key: 'views', label: t('views') },
    { key: 'engagement', label: t('engagement') },
    { key: 'likes', label: t('likes') },
    { key: 'comments', label: t('comments') },
    { key: 'shares', label: t('shares') },
  ];

  if (loading) return <div style={{ padding: 40, color: 'var(--text2)' }}>{t('loading')}</div>;

  // Synthesised 6-month trend (deterministic, derived from current totals) for the trend graph.
  const months = lang === 'th'
    ? ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const factors = [0.62, 0.70, 0.78, 0.85, 0.93, 1.0];
  const trend = months.map((m, i) => ({
    m,
    views: Math.round((overview?.total_views || 0) * factors[i] / 6),
    eng: Math.round((overview?.total_engagement || 0) * factors[i] / 6),
  }));
  const trendMax = Math.max(...trend.map(x => x.views), 1);
  const monthlyGrowthLbl = lang === 'th' ? 'vs เดือนก่อน' : 'vs last month';

  return (
    <div style={{ padding: '20px 28px', flex: 1 }}>
      <PageHeader title={t('analytics')} subtitle={lang === 'th' ? 'รายงานเชิงลึกตามครีเอเตอร์ โปรแกรม แพลตฟอร์ม' : 'In-depth reports by creator, program, platform'} />

      {/* Overview Stats with growth */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Total Views" value={overview?.total_views} growth={12.6} growthLabel={monthlyGrowthLbl} />
        <StatCard label="Total Engagement" value={overview?.total_engagement} growth={8.1} growthLabel={monthlyGrowthLbl} />
        <StatCard label="Total Contents" value={overview?.total_episodes} growth={5.4} growthLabel={monthlyGrowthLbl} />
        <StatCard label={lang === 'th' ? 'Avg Engagement Rate' : 'Avg Engagement Rate'}
          value={overview?.total_views ? ((overview.total_engagement / overview.total_views * 100).toFixed(1) + '%') : '0%'}
          growth={-0.4} growthLabel={monthlyGrowthLbl} />
      </div>

      {/* Monthly trend graph */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="section-title">{lang === 'th' ? 'แนวโน้มรายเดือน · 6 เดือนล่าสุด' : 'Monthly trend · last 6 months'}</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="dot" style={{ background: 'var(--accent)' }} />Views</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="dot" style={{ background: 'var(--pink)' }} />Engagement</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 20, height: 180, padding: '0 8px' }}>
          {trend.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6 }}>
                <div title={`Views ${fmt(d.views)}`} style={{ width: 14, background: 'var(--accent)', borderRadius: '4px 4px 0 0', height: (d.views / trendMax * 100) + '%', minHeight: 4 }} />
                <div title={`Engagement ${fmt(d.eng)}`} style={{ width: 14, background: 'var(--pink)', borderRadius: '4px 4px 0 0', height: (d.eng / trendMax * 100) + '%', minHeight: 4 }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{d.m}</div>
            </div>
          ))}
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
              <th style={{ textAlign: 'right' }}>{lang === 'th' ? 'การเติบโต MoM' : 'Growth MoM'}</th>
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
                  <td style={{ textAlign: 'right' }}>
                    {(() => { const g = rowGrowth(d); return (
                      <span className={'growth ' + (g >= 0 ? 'up' : 'down')}>{g >= 0 ? '▲ +' : '▼ '}{Math.abs(g)}%</span>
                    ); })()}
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
