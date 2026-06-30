import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { fmt, initials } from '../lib/utils';
import type { Lang } from '../lib/i18n';

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') || iso.includes('Z') ? iso : iso.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function AiRefresh({ lang }: { lang: Lang }) {
  const [status, setStatus] = useState<any>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);

  const load = () => api.ai.status().then(setStatus);
  useEffect(() => { load(); }, []);

  const refreshAll = async () => {
    setRefreshingAll(true);
    const r = await api.ai.refresh();
    setRefreshingAll(false);
    await load();
  };

  const refreshOne = async (id: number) => {
    setRefreshingId(id);
    await api.ai.refresh(id);
    setRefreshingId(null);
    await load();
  };

  if (!status) return <div style={{ color: 'var(--text2)' }}>{lang === 'th' ? 'กำลังโหลด...' : 'Loading...'}</div>;

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(120deg,#16121f 0%,#231a3d 55%,#2d1f52 100%)',
        borderRadius: 16, padding: '24px 26px', marginBottom: 16, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, background: 'radial-gradient(circle,rgba(124,92,255,.45),transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 20, padding: '5px 12px', marginBottom: 14 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#9d7bff', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#d6ccff', letterSpacing: '.02em' }}>AI AGENT · ONLINE</span>
          </div>
          <div style={{ fontSize: 21, fontWeight: 700, color: '#fff', letterSpacing: '-.02em', marginBottom: 6 }}>AI Data Refresh</div>
          <div style={{ fontSize: 13, color: '#b9b2cf', maxWidth: 560, lineHeight: 1.6 }}>
            {lang === 'th'
              ? 'ระบบ AI Agent ตรวจสอบลิงก์ที่เก็บไว้ของแต่ละครีเอเตอร์ แล้วดึง Followers · Views · Likes · Comments มาอัปเดตฐานข้อมูลอัตโนมัติ'
              : 'The AI Agent checks each creator\'s saved links and pulls Followers · Views · Likes · Comments to auto-update the database.'}
          </div>
          <div style={{ display: 'flex', gap: 26, marginTop: 18 }}>
            <div>
              <div style={{ fontSize: 11, color: '#8e85ab' }}>Auto Refresh</div>
              <div className="num" style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{lang === 'th' ? `ทุก ${status.interval_hours} ชั่วโมง` : `Every ${status.interval_hours}h`}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#8e85ab' }}>Next Run</div>
              <div className="num" style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{fmtDateTime(status.next_run)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#8e85ab' }}>Success Rate</div>
              <div className="num" style={{ fontSize: 14, fontWeight: 600, color: '#6ee7a8' }}>{status.success_rate.toFixed(1)}%</div>
            </div>
          </div>
          <button onClick={refreshAll} disabled={refreshingAll} style={{
            position: 'absolute', right: 0, bottom: 0, background: '#7c5cff', color: '#fff', border: 'none',
            borderRadius: 10, padding: '11px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.65 4.36A9 9 0 0 0 20.5 15" /></svg>
            {refreshingAll ? (lang === 'th' ? 'กำลังอัปเดต...' : 'Refreshing...') : (lang === 'th' ? 'Refresh ทั้งหมด' : 'Refresh All')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>CREATOR</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'right' }}>OLD FOLLOWERS</th>
              <th style={{ textAlign: 'right' }}>NEW FOLLOWERS</th>
              <th style={{ textAlign: 'right' }}>DIFF</th>
              <th>LAST REFRESH</th>
              <th style={{ textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {status.creators.map((c: any) => {
              const diffColor = c.diff > 0 ? 'var(--green)' : c.diff < 0 ? 'var(--red)' : 'var(--text2)';
              const statusColor = c.status === 'updated' ? 'var(--green)' : 'var(--text2)';
              return (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ background: c.avatar_color, width: 30, height: 30, fontSize: 12 }}>{initials(c.name)}</div>
                      <span style={{ fontWeight: 500 }}>{c.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: statusColor, fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
                      {c.status === 'updated' ? (lang === 'th' ? 'อัปเดตแล้ว' : 'Updated') : (lang === 'th' ? 'รอ' : 'Idle')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text2)' }} className="num">{fmt(c.old_followers)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }} className="num">{fmt(c.new_followers)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: diffColor }} className="num">{c.diff > 0 ? '+' : ''}{fmt(c.diff)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }} className="num">{fmtDateTime(c.last_refreshed)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 10px' }}
                      disabled={refreshingId === c.id}
                      onClick={() => refreshOne(c.id)}>
                      {refreshingId === c.id ? '...' : 'Refresh'}
                    </button>
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
