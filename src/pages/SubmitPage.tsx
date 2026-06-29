import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { platformColor, platformInitial } from '../lib/utils';

const PLATFORMS = ['YouTube', 'Facebook', 'TikTok', 'Instagram'];
const EMPTY_LINK = { platform: 'YouTube', url: '', views: 0, engagement: 0, likes: 0, comments: 0, shares: 0, saves: 0, uv: 0, video_views: 0 };

// Public, standalone submission form (no sidebar / auth) for creators to self-submit content data.
export default function SubmitPage() {
  const [creators, setCreators] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    creator_id: '',
    title: '',
    type: 'Long',
    published_at: new Date().toISOString().slice(0, 16),
    links: [{ ...EMPTY_LINK }],
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.creators.list().then((c) => {
      setCreators(c);
      if (c.length > 0) setForm((f: any) => ({ ...f, creator_id: c[0].id }));
    });
  }, []);

  const updateLink = (i: number, key: string, value: any) => {
    const links = [...form.links];
    links[i] = { ...links[i], [key]: value };
    setForm({ ...form, links });
  };
  const addLink = () => setForm({ ...form, links: [...form.links, { ...EMPTY_LINK }] });
  const removeLink = (i: number) => setForm({ ...form, links: form.links.filter((_: any, idx: number) => idx !== i) });

  const submit = async () => {
    if (!form.creator_id || !form.title) return;
    setSubmitting(true);
    try {
      await api.contents.createEpisode({ ...form, submitted_by: 'Web Submit' });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div style={wrap}>
        <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
          <h2 style={{ fontWeight: 700, marginBottom: 8 }}>ส่งข้อมูลสำเร็จ</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 20 }}>ข้อมูลของคุณถูกส่งเข้าคิวรอตรวจสอบแล้ว ขอบคุณครับ</p>
          <button className="btn btn-primary" onClick={() => { setDone(false); setForm({ creator_id: creators[0]?.id || '', title: '', type: 'Long', published_at: new Date().toISOString().slice(0, 16), links: [{ ...EMPTY_LINK }] }); }}>
            ส่งอีกรายการ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{ width: '100%', maxWidth: 680 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 700 }}>C</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>ส่งข้อมูลคอนเทนต์</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Creator Hub — Web Submit</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>ครีเอเตอร์</label>
              <select value={form.creator_id} onChange={(e) => setForm({ ...form, creator_id: e.target.value })}>
                {creators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>ประเภท</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option>Long</option><option>Short</option><option>Streamer</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>ชื่อคอนเทนต์</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="ชื่อวิดีโอหรือ EP" />
            </div>
            <div className="form-group">
              <label>วันที่เผยแพร่</label>
              <input type="datetime-local" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontWeight: 700 }}>ข้อมูลแต่ละแพลตฟอร์ม</div>
          <button className="btn btn-secondary" onClick={addLink} style={{ fontSize: 12 }}>+ เพิ่ม</button>
        </div>

        {form.links.map((lnk: any, i: number) => (
          <div key={i} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span className="platform-icon" style={{ background: platformColor(lnk.platform) }}>{platformInitial(lnk.platform)}</span>
              <select value={lnk.platform} onChange={(e) => updateLink(i, 'platform', e.target.value)} style={{ flex: 1 }}>
                {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
              </select>
              <input value={lnk.url} onChange={(e) => updateLink(i, 'url', e.target.value)} placeholder="URL" style={{ flex: 3 }} />
              {form.links.length > 1 && <button className="btn btn-ghost" onClick={() => removeLink(i)} style={{ color: 'var(--red)' }}>✕</button>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {['views', 'engagement', 'likes', 'comments', 'shares', 'saves', ...(form.type === 'Streamer' ? ['uv', 'video_views'] : [])].map((k) => (
                <div key={k} className="form-group" style={{ margin: 0 }}>
                  <label>{k}</label>
                  <input type="number" value={lnk[k] || 0} onChange={(e) => updateLink(i, k, Number(e.target.value))} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button className="btn btn-primary" onClick={submit} disabled={submitting} style={{ padding: '10px 24px', marginTop: 6 }}>
          {submitting ? '...' : 'ส่งข้อมูล'}
        </button>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '40px 20px',
  background: 'var(--bg)',
};
