import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { initials, platformColor, platformInitial } from '../lib/utils';

const PLATFORMS = ['TikTok', 'YouTube', 'Facebook', 'Instagram'];
const EMPTY = { platform: 'TikTok', url: '', views: '', likes: '', comments: '', shares: '', saves: '' };

// Public submission page — reached via a shared /submit/<token> link (no login).
export default function SubmitPage() {
  const { token } = useParams();
  const [info, setInfo] = useState<any>(null);
  const [invalid, setInvalid] = useState(false);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<any>({ creator_id: '', title: '', type: 'Long', links: [{ ...EMPTY }] });

  useEffect(() => {
    api.submit.info(token!).then(d => {
      setInfo(d);
      if (!d.creator && d.creators?.length) setForm((f: any) => ({ ...f, creator_id: d.creators[0].id }));
    }).catch(() => setInvalid(true));
  }, [token]);

  const setLink = (i: number, k: string, v: any) => {
    const links = [...form.links]; links[i] = { ...links[i], [k]: v };
    setForm({ ...form, links });
  };

  const send = async () => {
    setError('');
    if (!form.title.trim()) return setError('กรุณากรอกชื่อคอนเทนต์');
    if (!form.links.some((l: any) => l.url.trim())) return setError('กรุณาใส่ลิงก์อย่างน้อย 1 อัน');
    setSending(true);
    try {
      await api.submit.entry(token!, {
        creator_id: info.creator?.id || form.creator_id,
        title: form.title, type: form.type,
        links: form.links.filter((l: any) => l.url.trim()),
      });
      setDone(true);
    } catch {
      setError('ส่งไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSending(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, justifyContent: 'center' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#fff', fontWeight: 700,
          }}>C</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.15 }}>CreatorHub</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>Web Submit</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );

  if (invalid) return shell(
    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 34, marginBottom: 8 }}>⚠️</div>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>ลิงก์ไม่ถูกต้องหรือถูกยกเลิกแล้ว</div>
      <div style={{ fontSize: 13, color: 'var(--text2)' }}>กรุณาติดต่อผู้ดูแลโปรแกรมเพื่อขอลิงก์ใหม่</div>
    </div>
  );

  if (!info) return shell(<div className="empty-state"><div className="spinner" /></div>);

  if (done) return shell(
    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', background: '#dcfce7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 14px', fontSize: 26, color: '#16a34a',
      }}>✓</div>
      <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>ส่งข้อมูลเรียบร้อย!</div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18 }}>
        ข้อมูลของคุณถูกส่งเข้าคิวตรวจสอบแล้ว ทีมงานจะตรวจสอบและอนุมัติต่อไป
      </div>
      <button className="btn btn-primary" onClick={() => { setDone(false); setForm({ creator_id: form.creator_id, title: '', type: form.type, links: [{ ...EMPTY }] }); }}>
        + ส่งคอนเทนต์เพิ่ม
      </button>
    </div>
  );

  return shell(
    <>
      {/* Who is submitting */}
      <div className="card" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        {info.creator ? (
          <>
            <div className="avatar" style={{ background: info.creator.avatar_color, width: 42, height: 42, fontSize: 15 }}>
              {initials(info.creator.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{info.creator.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                {info.creator.program_name || ''}
              </div>
            </div>
            <span className="badge" style={{ background: 'var(--accent-tint)', color: '#4646c6' }}>
              {info.program?.name || 'Program'}
            </span>
          </>
        ) : (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b6b72', marginBottom: 6 }}>คุณคือใคร?</div>
            <select value={form.creator_id} onChange={e => setForm({ ...form, creator_id: e.target.value })} style={{ width: '100%' }}>
              {info.creators.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Content info */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>ข้อมูลคอนเทนต์</div>
        <div className="form-group">
          <label>ชื่อคอนเทนต์ / คลิป</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="เช่น คลิปรีวิวเกมใหม่ EP.1" />
        </div>
        <div className="form-group">
          <label>ประเภท</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Long', 'Short', 'Streamer'].map(tp => (
              <button key={tp} onClick={() => setForm({ ...form, type: tp })} style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: form.type === tp ? 'var(--accent)' : '#fff',
                color: form.type === tp ? '#fff' : '#52525b',
                border: '1px solid ' + (form.type === tp ? 'var(--accent)' : 'var(--border)'),
              }}>{tp}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Platform links — same content across platforms counts once */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>ลิงก์แต่ละแพลตฟอร์ม</div>
        <button className="btn btn-secondary" style={{ fontSize: 12 }}
          onClick={() => setForm({ ...form, links: [...form.links, { ...EMPTY }] })}>
          + เพิ่มแพลตฟอร์ม
        </button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
        คอนเทนต์เดียวกันที่ลงหลายแพลตฟอร์ม ใส่รวมในฟอร์มเดียว — ระบบนับเป็น 1 คอนเทนต์
      </div>

      {form.links.map((lnk: any, i: number) => (
        <div key={i} className="card" style={{ marginBottom: 10, padding: 14 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
            <span className="platform-icon" style={{ background: platformColor(lnk.platform), width: 24, height: 24 }}>
              {platformInitial(lnk.platform)}
            </span>
            <select value={lnk.platform} onChange={e => setLink(i, 'platform', e.target.value)} style={{ width: 130 }}>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
            <input value={lnk.url} onChange={e => setLink(i, 'url', e.target.value)}
              placeholder="วางลิงก์คลิป https://..." style={{ flex: 1 }} />
            {form.links.length > 1 && (
              <button className="btn btn-ghost" style={{ color: 'var(--red)', padding: '4px 8px' }}
                onClick={() => setForm({ ...form, links: form.links.filter((_: any, x: number) => x !== i) })}>✕</button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {[['views', 'Views'], ['likes', 'Likes'], ['comments', 'Comments'], ['shares', 'Shares'], ['saves', 'Saves']].map(([k, label]) => (
              <div key={k} className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 11 }}>{label}</label>
                <input type="number" min="0" value={lnk[k]} onChange={e => setLink(i, k, e.target.value)} placeholder="0" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 9, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <button className="btn btn-primary" disabled={sending} onClick={send}
        style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: 14 }}>
        {sending ? 'กำลังส่ง...' : 'ส่งข้อมูล'}
      </button>
      <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text2)', marginTop: 10 }}>
        ข้อมูลจะเข้าสู่คิวตรวจสอบก่อนแสดงบนแดชบอร์ด
      </div>
    </>
  );
}
