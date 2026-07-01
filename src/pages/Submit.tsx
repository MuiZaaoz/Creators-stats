import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { platformColor, platformInitial } from '../lib/utils';

const PLATFORMS = ['YouTube', 'Facebook', 'TikTok', 'Instagram'];
const EMPTY_LINK = { platform: 'YouTube', url: '', views: 0, engagement: 0, likes: 0, comments: 0, shares: 0, saves: 0 };

// Public, standalone page (no sidebar/auth) for creators to self-submit content.
// Writes to the same database via POST /api/contents/episodes (goes to review queue).
export default function Submit() {
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
  const [error, setError] = useState('');

  useEffect(() => {
    api.creators.list().then(c => {
      setCreators(c);
      if (c.length > 0) setForm((f: any) => ({ ...f, creator_id: c[0].id }));
    }).catch(() => setError('ไม่สามารถโหลดรายชื่อครีเอเตอร์ได้'));
  }, []);

  const addLink = () => setForm({ ...form, links: [...form.links, { ...EMPTY_LINK }] });
  const removeLink = (i: number) => setForm({ ...form, links: form.links.filter((_: any, idx: number) => idx !== i) });
  const updateLink = (i: number, key: string, value: any) => {
    const links = [...form.links];
    links[i] = { ...links[i], [key]: value };
    setForm({ ...form, links });
  };

  const submit = async () => {
    setError('');
    if (!form.creator_id || !form.title.trim()) {
      setError('กรุณาเลือกครีเอเตอร์และกรอกชื่อคอนเทนต์');
      return;
    }
    const creator = creators.find(c => String(c.id) === String(form.creator_id));
    setSubmitting(true);
    try {
      await api.contents.createEpisode({
        ...form,
        submitted_by: creator ? creator.name : 'Web Submit',
      });
      setDone(true);
    } catch {
      setError('ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm({
      creator_id: creators[0]?.id || '',
      title: '', type: 'Long',
      published_at: new Date().toISOString().slice(0, 16),
      links: [{ ...EMPTY_LINK }],
    });
    setDone(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 680 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: '#fff', fontWeight: 700,
          }}>C</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Creator Hub</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>ส่งข้อมูลคอนเทนต์ / Submit your content</div>
          </div>
        </div>

        {done ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>ส่งข้อมูลสำเร็จ!</div>
            <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>
              ข้อมูลของคุณถูกส่งเข้าคิวตรวจสอบเรียบร้อยแล้ว ทีมงานจะตรวจสอบและอนุมัติต่อไป
            </div>
            <button className="btn btn-primary" onClick={reset}>ส่งอีกรายการ</button>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ background: '#7f1d1d22', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
                {error}
              </div>
            )}

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>ข้อมูลคอนเทนต์</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>ครีเอเตอร์</label>
                  <select value={form.creator_id} onChange={e => setForm({ ...form, creator_id: e.target.value })}>
                    {creators.length === 0 && <option value="">— ไม่มีครีเอเตอร์ —</option>}
                    {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>ประเภท</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option>Long</option>
                    <option>Short</option>
                    <option>Streamer</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>ชื่อคอนเทนต์</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="เช่น สอนเล่นโปร EP.5" />
                </div>
                <div className="form-group">
                  <label>วันที่เผยแพร่</label>
                  <input type="datetime-local" value={form.published_at} onChange={e => setForm({ ...form, published_at: e.target.value })} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}>ลิงก์ + ยอดแต่ละแพลตฟอร์ม</div>
                <button className="btn btn-secondary" onClick={addLink} style={{ fontSize: 12 }}>+ เพิ่มแพลตฟอร์ม</button>
              </div>
              {form.links.map((lnk: any, i: number) => (
                <div key={i} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span className="platform-icon" style={{ background: platformColor(lnk.platform) }}>{platformInitial(lnk.platform)}</span>
                    <select value={lnk.platform} onChange={e => updateLink(i, 'platform', e.target.value)} style={{ flex: 1 }}>
                      {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                    </select>
                    <input value={lnk.url} onChange={e => updateLink(i, 'url', e.target.value)} placeholder="URL คอนเทนต์" style={{ flex: 3 }} />
                    {form.links.length > 1 && (
                      <button className="btn btn-ghost" onClick={() => removeLink(i)} style={{ color: 'var(--red)' }}>✕</button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                    {[
                      { key: 'views', label: 'วิว' },
                      { key: 'engagement', label: 'Engagement' },
                      { key: 'likes', label: 'ไลค์' },
                      { key: 'comments', label: 'คอมเมนต์' },
                      { key: 'shares', label: 'แชร์' },
                    ].map(f => (
                      <div key={f.key} className="form-group" style={{ margin: 0 }}>
                        <label>{f.label}</label>
                        <input type="number" value={lnk[f.key] || 0} onChange={e => updateLink(i, f.key, Number(e.target.value))} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-primary" onClick={submit} disabled={submitting} style={{ padding: '11px 28px', fontSize: 14 }}>
              {submitting ? 'กำลังส่ง...' : 'ส่งข้อมูล'}
            </button>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 12 }}>
              ข้อมูลที่ส่งจะเข้าสู่คิวตรวจสอบก่อนแสดงผลในระบบ
            </div>
          </>
        )}
      </div>
    </div>
  );
}
