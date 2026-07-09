import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import { fmt, initials, platformColor, platformInitial } from '../lib/utils';
import LinkPreview, { PreviewLink } from '../components/LinkPreview';

const PLATFORMS = ['Facebook', 'YouTube', 'TikTok', 'Instagram'];

export default function Dashboard() {
  const { lang } = useAppStore();
  const navigate = useNavigate();
  const t2 = (th: string, en: string) => (lang === 'th' ? th : en);

  const [overview, setOverview] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [byProgram, setByProgram] = useState<any[]>([]);
  const [byCreator, setByCreator] = useState<any[]>([]);
  const [byPlatform, setByPlatform] = useState<any[]>([]);
  const [selectedProg, setSelectedProg] = useState<number | null>(null);
  const [leaderMetric, setLeaderMetric] = useState<'views' | 'engagement'>('views');
  const [cmpMode, setCmpMode] = useState<'program' | 'creator'>('program');
  const [preview, setPreview] = useState<PreviewLink | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.analytics.overview(),
      api.programs.list(),
      api.contents.list({ limit: 300 }),
      api.audit.list({ limit: 4 }),
      api.analytics.byProgram(),
      api.analytics.byCreator(),
      api.analytics.byPlatform(),
    ]).then(([ov, progs, ct, au, bp, bc, bpl]) => {
      setOverview(ov); setPrograms(progs); setContents(ct);
      setAudit((au as any).items || au);
      setByProgram(bp); setByCreator(bc); setByPlatform(bpl);
      setLoading(false);
    });
  }, []);

  const progContents = useMemo(
    () => contents.filter(c => !selectedProg || c.program_id === selectedProg),
    [contents, selectedProg]);
  const progCreators = useMemo(
    () => {
      const list = selectedProg ? byCreator.filter((c: any) => {
        const prog = programs.find(p => p.id === selectedProg);
        return prog && c.program_name === prog.name;
      }) : byCreator;
      return [...list].sort((a: any, b: any) =>
        (b[`total_${leaderMetric}`] || 0) - (a[`total_${leaderMetric}`] || 0));
    }, [byCreator, selectedProg, programs, leaderMetric]);

  const totalViews = byPlatform.reduce((s: number, p: any) => s + (p.total_views || 0), 0);
  const activeCreators = byCreator.filter((c: any) => (c.total_views || 0) > 0).length;

  if (loading) return <div style={{ padding: 40, color: 'var(--text2)' }}>{t2('กำลังโหลด...', 'Loading...')}</div>;

  return (
    <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ===== Updates strip ===== */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
          <span style={{ fontWeight: 700, fontSize: 13.5 }}>{t2('อัปเดตล่าสุด', 'Latest Updates')}</span>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{t2('รายการใหม่อยู่บนสุด', 'Newest first')}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {audit.map((a: any) => (
            <div key={a.id} style={{ background: '#fbfbfc', border: '1px solid #f0f0f2', borderRadius: 10, padding: '10px 13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                {a.tag && <span className="tag" style={{ background: (a.color || '#888') + '18', color: a.color }}>{a.tag}</span>}
                <span style={{ fontSize: 11, color: 'var(--text2)' }}>{(a.created_at || '').slice(5, 16)}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.action}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text2)' }}>{a.user}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Program pills ===== */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setSelectedProg(null)} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px',
          borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: selectedProg === null ? '#1c1c1f' : '#fff',
          color: selectedProg === null ? '#fff' : '#52525b',
          border: '1px solid ' + (selectedProg === null ? '#1c1c1f' : 'var(--border)'),
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: selectedProg === null ? '#fff' : '#8e8e96' }} />
          {t2('ทั้งหมด', 'All')}
        </button>
        {programs.map(p => (
          <button key={p.id} onClick={() => setSelectedProg(p.id)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px',
            borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: selectedProg === p.id ? '#1c1c1f' : '#fff',
            color: selectedProg === p.id ? '#fff' : '#52525b',
            border: '1px solid ' + (selectedProg === p.id ? '#1c1c1f' : 'var(--border)'),
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />
            {p.name}
          </button>
        ))}
        <button onClick={() => navigate('/programs')} style={{
          padding: '8px 15px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: '#fff', color: 'var(--accent)', border: '1px dashed var(--accent)',
        }}>+ {t2('สร้างโปรแกรม', 'New Program')}</button>
      </div>

      {/* ===== Stat cards ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label={t2('จำนวนครีเอเตอร์', 'Creators')} value={fmt(overview?.total_creators)}
          sub={<span style={{ color: '#16a34a', fontWeight: 600 }}>▲ {activeCreators} active</span>}
          icon="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" tint="#eeeefb" />
        <StatCard label="Total Views" value={fmt(overview?.total_views)}
          sub={t2('รวมทุกแพลตฟอร์ม', 'All platforms')}
          icon="M3 3v18h18 M7 14l4-5 3 3 4-7" tint="#e0f2fe" />
        <StatCard label="Total Engagement" value={fmt(overview?.total_engagement)}
          sub="Like · Comment · Share · Save"
          icon="M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" tint="#dcfce7" />
        <StatCard label="Total Contents" value={fmt(overview?.total_episodes)}
          sub={t2('คลิปทั้งหมดในระบบ', 'All clips in system')}
          icon="M12 2 2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" tint="#fce7f3" />
      </div>

      {/* ===== Leaderboard by creator ===== */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>{t2('ยอดวิวแยกตามครีเอเตอร์', 'Views by Creator')}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{t2('จัดอันดับครีเอเตอร์ตามผลงาน', 'Ranked by performance')}</div>
          </div>
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 9, padding: 3 }}>
            {([['views', t2('ยอดวิว', 'Views')], ['engagement', 'Engagement']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setLeaderMetric(key as any)} style={{
                padding: '5px 13px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                background: leaderMetric === key ? '#fff' : 'transparent',
                color: leaderMetric === key ? '#1c1c1f' : '#8e8e96',
                boxShadow: leaderMetric === key ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
              }}>{label}</button>
            ))}
          </div>
        </div>
        <div>
          {progCreators.slice(0, 8).map((c: any, i: number) => {
            const val = c[`total_${leaderMetric}`] || 0;
            const max = progCreators[0]?.[`total_${leaderMetric}`] || 1;
            return (
              <div key={c.id} onClick={() => navigate(`/creators/${c.id}`)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px',
                borderTop: '1px solid #f0f0f2', cursor: 'pointer',
              }}>
                <span className="num" style={{ width: 18, color: 'var(--text2)', fontWeight: 600, fontSize: 12 }}>{i + 1}</span>
                <div className="avatar" style={{ background: c.avatar_color, width: 30, height: 30, fontSize: 11 }}>{initials(c.name)}</div>
                <div style={{ width: 170, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{c.program_name}</div>
                </div>
                <div style={{ flex: 1, height: 7, background: 'var(--surface2)', borderRadius: 4 }}>
                  <div style={{ height: '100%', width: (val / max * 100) + '%', background: c.avatar_color, borderRadius: 4 }} />
                </div>
                <span className="num" style={{ fontWeight: 700, fontSize: 13.5, minWidth: 90, textAlign: 'right' }}>{fmt(val)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== Clips table ===== */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px' }}>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{t2('วิวแต่ละคลิปในโปรแกรม', 'Views per Clip')}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>{t2('กดแถวเพื่อดูตัวอย่างและลิงก์', 'Click a row to preview and open the link')}</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr>
              <th>#</th><th>{t2('ชื่อ', 'Name')}</th><th>{t2('แพลตฟอร์ม', 'Platform')}</th>
              <th style={{ textAlign: 'right' }}>{t2('วิว', 'Views')}</th>
              <th style={{ textAlign: 'right' }}>Engagement</th>
              <th style={{ textAlign: 'center' }}>{t2('ลิงก์', 'Link')}</th>
            </tr></thead>
            <tbody>
              {progContents.slice(0, 10).map((c, i) => (
                <tr key={c.id} style={{ cursor: 'pointer' }}
                  onClick={() => setPreview({ platform: c.platform, url: c.url, title: c.title, creator_name: c.creator_name, views: c.views, engagement: c.engagement, uv: c.uv, video_views: c.video_views })}>
                  <td className="num" style={{ color: 'var(--text2)', fontWeight: 600 }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ background: c.avatar_color, width: 28, height: 28, fontSize: 11 }}>{initials(c.creator_name)}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)' }}>{c.creator_name}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="platform-icon" style={{ background: platformColor(c.platform) }}>{platformInitial(c.platform)}</span></td>
                  <td className="num" style={{ textAlign: 'right' }}>{fmt(c.views)}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{fmt(c.engagement)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {c.url ? <span className="link-chip">🔗 Preview</span> : <span style={{ color: 'var(--text2)', fontSize: 12 }}>-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Platform stats ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {PLATFORMS.map(name => {
          const p = byPlatform.find((x: any) => x.platform === name) || {};
          const share = totalViews > 0 ? Math.round((p.total_views || 0) / totalViews * 100) : 0;
          return (
            <div key={name} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="platform-icon" style={{ background: platformColor(name), width: 22, height: 22 }}>{name[0]}</span>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{name}</span>
                </div>
                <span className="num" style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>{share}%</span>
              </div>
              {[['Contents', p.link_count], ['Views', p.total_views], ['Engagement', p.total_engagement]].map(([label, val]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text2)' }}>{label}</span>
                  <span className="num" style={{ fontWeight: 600 }}>{fmt(val as number)}</span>
                </div>
              ))}
              <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 3, marginTop: 6 }}>
                <div style={{ height: '100%', width: share + '%', background: platformColor(name), borderRadius: 3 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== Comparison + Platform distribution ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 18 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{t2('เปรียบเทียบผลงาน', 'Performance Comparison')}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{t2('เลือกมุมมองที่ต้องการเทียบ', 'Choose a comparison view')}</div>
            </div>
            <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 9, padding: 3 }}>
              {([['program', t2('ยอดวิวรวมแต่ละโปรแกรม', 'Views by program')], ['creator', t2('ยอดวิวของครีเอเตอร์', 'Views by creator')]] as const).map(([key, label]) => (
                <button key={key} onClick={() => setCmpMode(key as any)} style={{
                  padding: '5px 13px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  background: cmpMode === key ? '#fff' : 'transparent',
                  color: cmpMode === key ? '#1c1c1f' : '#8e8e96',
                  boxShadow: cmpMode === key ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
                }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {(cmpMode === 'program' ? byProgram : byCreator.slice(0, 8)).map((d: any) => {
              const list = cmpMode === 'program' ? byProgram : byCreator.slice(0, 8);
              const max = Math.max(...list.map((x: any) => x.total_views || 0), 1);
              const color = d.color || d.avatar_color || 'var(--accent)';
              return (
                <div key={d.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 7 }} />
                      {d.name}
                      {d.program_name && cmpMode === 'creator' && <span style={{ color: 'var(--text2)', fontWeight: 500 }}> · {d.program_name}</span>}
                    </span>
                    <span className="num" style={{ fontWeight: 700, fontSize: 12.5 }}>{fmt(d.total_views)}</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 4 }}>
                    <div style={{ height: '100%', width: ((d.total_views || 0) / max * 100) + '%', background: color, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Donut */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{t2('การกระจายแพลตฟอร์ม', 'Platform Distribution')}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>Platform Distribution</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Donut data={PLATFORMS.map(name => {
              const p = byPlatform.find((x: any) => x.platform === name) || {};
              return { name, value: p.total_views || 0, color: platformColor(name) };
            })} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PLATFORMS.map(name => {
                const p = byPlatform.find((x: any) => x.platform === name) || {};
                const share = totalViews > 0 ? Math.round((p.total_views || 0) / totalViews * 100) : 0;
                return (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: platformColor(name) }} />
                    <span style={{ flex: 1, fontWeight: 600 }}>{name}</span>
                    <span className="num" style={{ fontWeight: 700 }}>{share}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Program manager ===== */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>{t2('จัดการโปรแกรม', 'Manage Programs')}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{t2('แต่ละโปรแกรมเก็บข้อมูลแยกกัน', 'Each program collects data separately')}</div>
          </div>
          <button onClick={() => navigate('/programs')} style={{ background: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>
            + {t2('สร้างโปรแกรม', 'New Program')}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {byProgram.map((p: any) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 4px',
              borderTop: '1px solid #f0f0f2',
            }}>
              <span style={{ width: 4, height: 30, borderRadius: 2, background: p.color }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.name}</div>
                <div className="num" style={{ fontSize: 11.5, color: 'var(--text2)' }}>
                  {p.creator_count} creators · {p.episode_count} content · {fmt(p.total_views)} views
                </div>
              </div>
              <button className="btn btn-secondary" style={{ fontSize: 12, color: 'var(--accent)' }}
                onClick={() => navigate('/collect')}>↑ {t2('เก็บข้อมูล', 'Collect')}</button>
            </div>
          ))}
        </div>
      </div>

      {preview && <LinkPreview link={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function StatCard({ label, value, sub, icon, tint }: any) {
  return (
    <div className="card" style={{ padding: '15px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12.5, color: 'var(--text2)', fontWeight: 600 }}>{label}</div>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: tint,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5b5bd6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {icon.split(' M').map((p: string, i: number) => <path key={i} d={(i === 0 ? '' : 'M') + p} />)}
          </svg>
        </div>
      </div>
      <div className="num" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', margin: '2px 0' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{sub}</div>
    </div>
  );
}

function Donut({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 52, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <g transform="rotate(-90 70 70)">
        {data.map(d => {
          const frac = d.value / total;
          const seg = (
            <circle key={d.name} cx="70" cy="70" r={R} fill="none"
              stroke={d.color} strokeWidth="22"
              strokeDasharray={`${frac * C} ${C}`}
              strokeDashoffset={-offset * C} />
          );
          offset += frac;
          return seg;
        })}
      </g>
    </svg>
  );
}
