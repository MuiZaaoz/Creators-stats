import React, { useState } from 'react';
import { api } from '../lib/api';

// Public self-submission page. Light theme matching the main design.
// External users type their own creator name (no existing names are shown),
// review a preview, then submit — data is stored via the review queue.

const PLATFORMS = ['YouTube', 'Facebook', 'TikTok', 'Instagram'];
const EMPTY_LINK = { platform: 'YouTube', url: '', views: 0, engagement: 0, likes: 0, comments: 0, shares: 0 };

const C = {
  bg: '#f6f6f7', card: '#ffffff', border: '#e5e5ea',
  text: '#1c1c1f', muted: '#6b6b72', accent: '#7c5cff',
  grad: 'linear-gradient(135deg,#7c5cff,#5b5bd6)', inputBorder: '#d9d9de',
  green: '#16a34a', red: '#ef4444', soft: '#f3f3f5',
};

const platformColor: Record<string, string> = { YouTube: '#ff0000', TikTok: '#111', Facebook: '#1877f2', Instagram: '#e1306c' };
const platformInitial: Record<string, string> = { YouTube: 'YT', TikTok: 'TT', Facebook: 'FB', Instagram: 'IG' };

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: `1px solid ${C.inputBorder}`, background: '#fff', color: C.text,
  fontSize: 14, outline: 'none', fontFamily: 'inherit',
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5, display: 'block' };

export default function Submit() {
  const [step, setStep] = useState<'form' | 'preview' | 'done'>('form');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<any>({
    creator_name: '',
    title: '',
    type: 'Long',
    published_at: new Date().toISOString().slice(0, 16),
    links: [{ ...EMPTY_LINK }],
  });

  const addLink = () => setForm({ ...form, links: [...form.links, { ...EMPTY_LINK }] });
  const removeLink = (i: number) => setForm({ ...form, links: form.links.filter((_: any, idx: number) => idx !== i) });
  const updateLink = (i: number, key: string, value: any) => {
    const links = [...form.links];
    links[i] = { ...links[i], [key]: value };
    setForm({ ...form, links });
  };

  const goPreview = () => {
    setError('');
    if (!form.creator_name.trim() || !form.title.trim()) {
      setError('กรุณากรอกชื่อครีเอเตอร์และชื่อคอนเทนต์');
      return;
    }
    setStep('preview');
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.contents.submit(form);
      setStep('done');
    } catch {
      setError('ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่');
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm({ creator_name: '', title: '', type: 'Long', published_at: new Date().toISOString().slice(0, 16), links: [{ ...EMPTY_LINK }] });
    setStep('form');
  };

  const fmt = (n: number) => (Number(n) || 0).toLocaleString('en-US');

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: '32px 16px', overflowY: 'auto', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', fontWeight: 700 }}>C</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>CreatorHub</div>
            <div style={{ fontSize: 12, color: C.muted }}>ส่งข้อมูลคอนเทนต์ / Submit your content</div>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fdecec', border: `1px solid ${C.red}`, color: C.red, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>{error}</div>
        )}

        {step === 'form' && (
          <>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>ข้อมูลคอนเทนต์</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>ชื่อครีเอเตอร์ *</label>
                  <input style={inputStyle} value={form.creator_name} placeholder="กรอกชื่อของคุณ"
                    onChange={e => setForm({ ...form, creator_name: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>ประเภท</label>
                  <select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option>Long</option><option>Short</option><option>Streamer</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>ชื่อคอนเทนต์ *</label>
                  <input style={inputStyle} value={form.title} placeholder="เช่น สอนเล่นโปร EP.5"
                    onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>วันที่เผยแพร่</label>
                  <input style={inputStyle} type="datetime-local" value={form.published_at}
                    onChange={e => setForm({ ...form, published_at: e.target.value })} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>ลิงก์ + ยอดแต่ละแพลตฟอร์ม</div>
                <button onClick={addLink} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ เพิ่มแพลตฟอร์ม</button>
              </div>
              {form.links.map((lnk: any, i: number) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 5, background: platformColor[lnk.platform], color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{platformInitial[lnk.platform]}</span>
                    <select style={{ ...inputStyle, flex: 1, width: 'auto' }} value={lnk.platform} onChange={e => updateLink(i, 'platform', e.target.value)}>
                      {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                    </select>
                    <input style={{ ...inputStyle, flex: 3, width: 'auto' }} value={lnk.url} placeholder="URL คอนเทนต์" onChange={e => updateLink(i, 'url', e.target.value)} />
                    {form.links.length > 1 && (
                      <button onClick={() => removeLink(i)} style={{ background: 'none', border: 'none', color: C.red, fontSize: 16, cursor: 'pointer', padding: 4 }}>✕</button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                    {[['views', 'วิว'], ['engagement', 'Engagement'], ['likes', 'ไลค์'], ['comments', 'คอมเมนต์'], ['shares', 'แชร์']].map(([key, label]) => (
                      <div key={key}>
                        <label style={{ ...labelStyle, fontSize: 11 }}>{label}</label>
                        <input style={inputStyle} type="number" value={lnk[key] || 0} onChange={e => updateLink(i, key, Number(e.target.value))} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={goPreview} style={{ padding: '11px 28px', borderRadius: 8, border: 'none', background: C.grad, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              ดูตัวอย่างก่อนส่ง →
            </button>
          </>
        )}

        {step === 'preview' && (
          <>
            <div style={{ background: '#f0edff', border: `1px solid ${C.accent}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: C.accent, fontSize: 14 }}>ตรวจสอบข้อมูลก่อนส่ง</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>นี่คือข้อมูลที่จะถูกส่ง กรุณาตรวจสอบความถูกต้องก่อนกดยืนยัน</div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <PreviewField label="ครีเอเตอร์" value={form.creator_name} />
                <PreviewField label="ประเภท" value={form.type} />
                <PreviewField label="ชื่อคอนเทนต์" value={form.title} span />
                <PreviewField label="วันที่เผยแพร่" value={new Date(form.published_at).toLocaleString('th-TH')} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: C.muted }}>ข้อมูลแต่ละแพลตฟอร์ม ({form.links.length})</div>
              {form.links.map((lnk: any, i: number) => (
                <div key={i} style={{ background: C.soft, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 5, background: platformColor[lnk.platform], color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{platformInitial[lnk.platform]}</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{lnk.platform}</span>
                    <span style={{ fontSize: 12, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lnk.url || '(ไม่มี URL)'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                    <span>วิว <b>{fmt(lnk.views)}</b></span>
                    <span>Eng. <b>{fmt(lnk.engagement)}</b></span>
                    <span>ไลค์ <b>{fmt(lnk.likes)}</b></span>
                    <span>คอมเมนต์ <b>{fmt(lnk.comments)}</b></span>
                    <span>แชร์ <b>{fmt(lnk.shares)}</b></span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('form')} style={{ padding: '11px 22px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', color: C.text, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← กลับไปแก้ไข</button>
              <button onClick={submit} disabled={submitting} style={{ padding: '11px 28px', borderRadius: 8, border: 'none', background: C.grad, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'กำลังส่ง...' : 'ยืนยันและส่งข้อมูล'}
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>ส่งข้อมูลสำเร็จ!</div>
            <div style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>ข้อมูลของคุณถูกส่งเข้าคิวตรวจสอบเรียบร้อยแล้ว ทีมงานจะตรวจสอบและอนุมัติต่อไป</div>
            <button onClick={reset} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: C.grad, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>ส่งอีกรายการ</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewField({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div style={{ gridColumn: span ? '1 / -1' : undefined }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6b72', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1c1c1f' }}>{value || '—'}</div>
    </div>
  );
}
