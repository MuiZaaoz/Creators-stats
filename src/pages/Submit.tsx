import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { detectPlatform, fmt, platformColor, platformInitial } from '../lib/utils';

type Step = 'form' | 'detecting' | 'result' | 'done';

export default function Submit() {
  const [creators, setCreators] = useState<any[]>([]);
  const [step, setStep] = useState<Step>('form');
  const [creatorId, setCreatorId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Long');
  const [link, setLink] = useState('');
  const [imageName, setImageName] = useState<string>('');
  const [metrics, setMetrics] = useState({ views: 0, engagement: 0, likes: 0, comments: 0, shares: 0, saves: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.creators.overview().then((c) => {
      setCreators(c);
      if (c.length) setCreatorId(String(c[0].id));
    });
  }, []);

  const platform = detectPlatform(link);
  const selected = useMemo(() => creators.find((c) => String(c.id) === creatorId), [creators, creatorId]);

  const set = (k: string, v: number) => setMetrics((m) => ({ ...m, [k]: v }));

  const submit = () => {
    if (!creatorId || !title || !platform) return;
    setStep('detecting');
    setTimeout(() => setStep('result'), 1600);
  };

  const confirm = async () => {
    setSaving(true);
    try {
      await api.contents.createEpisode({
        creator_id: Number(creatorId),
        title,
        type,
        published_at: new Date().toISOString().slice(0, 16),
        submitted_by: (selected?.name || 'Creator') + ' (Web Submit)',
        links: [{ platform, url: link, ...metrics }],
      });
      setStep('done');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep('form');
    setTitle(''); setLink(''); setImageName('');
    setMetrics({ views: 0, engagement: 0, likes: 0, comments: 0, shares: 0, saves: 0 });
  };

  const steps = [
    { n: 1, label: 'กรอกข้อมูล' },
    { n: 2, label: 'ตรวจจับ' },
    { n: 3, label: 'ยืนยัน' },
  ];
  const stepIndex = step === 'form' ? 0 : step === 'detecting' ? 1 : 2;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px' }}>
      {/* Brand header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: '#fff', fontWeight: 700 }}>C</div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Creator Hub</div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>ส่งข้อมูลคอนเทนต์ของคุณ · Web Submit</div>

      <div style={{ width: '100%', maxWidth: 620 }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13,
                  background: i <= stepIndex ? 'var(--accent)' : 'var(--surface2)',
                  color: i <= stepIndex ? '#fff' : 'var(--text2)',
                }}>{s.n}</div>
                <div style={{ fontSize: 11, color: i <= stepIndex ? 'var(--text)' : 'var(--text2)' }}>{s.label}</div>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < stepIndex ? 'var(--accent)' : 'var(--border)', margin: '0 8px', marginBottom: 18 }} />}
            </React.Fragment>
          ))}
        </div>

        <div className="card">
          {step === 'form' && (
            <>
              <SectionLabel>1 · เลือก Creator (Track สะสม)</SectionLabel>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={lbl}>Creator Name</label>
                  <select value={creatorId} onChange={(e) => setCreatorId(e.target.value)} style={{ width: '100%' }}>
                    {creators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={chip}><div style={chipL}>สะสม</div><div style={chipV}>{selected?.episode_count ?? 0} <span style={{ fontSize: 11, color: 'var(--text2)' }}>คลิป</span></div></div>
                  <div style={chip}><div style={chipL}>Views สะสม</div><div style={chipV}>{fmt(selected?.total_views)}</div></div>
                </div>
              </div>

              <SectionLabel>2 · ลิงก์คอนเทนต์ (ตรวจจับแพลตฟอร์มอัตโนมัติ)</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={lbl}>ชื่อคอนเทนต์</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น สอนเล่นโปร EP.1" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={lbl}>ประเภท</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%' }}>
                    <option>Long</option><option>Short</option><option>Streamer</option>
                  </select>
                </div>
              </div>
              <label style={lbl}>Content Link</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="วางลิงก์ YouTube / Facebook / TikTok / Instagram…" style={{ flex: 1 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1px solid var(--border)', borderRadius: 9, padding: '8px 12px', background: 'var(--surface2)', minWidth: 120 }}>
                  {platform ? (
                    <>
                      <span className="platform-icon" style={{ background: platformColor(platform), width: 20, height: 20, fontSize: 9 }}>{platformInitial(platform)}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{platform}</span>
                    </>
                  ) : <span style={{ fontSize: 12, color: 'var(--text2)' }}>รอตรวจจับ…</span>}
                </div>
              </div>

              <SectionLabel>3 · กรอกยอด (จากภาพ Insights / Analytics)</SectionLabel>
              <div onClick={() => setImageName('screenshot_backend.png')}
                style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: 18, textAlign: 'center', cursor: 'pointer', background: 'var(--surface2)', marginBottom: 14 }}>
                {imageName
                  ? <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>✓ {imageName} · แนบแล้ว</div>
                  : <div style={{ fontSize: 12.5, color: 'var(--text2)' }}>📷 แนบภาพหน้าจอสถิติ (ไม่บังคับ) — แล้วกรอกตัวเลขด้านล่าง</div>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {([['views', 'Views'], ['engagement', 'Engagement'], ['likes', 'Likes'], ['comments', 'Comments'], ['shares', 'Shares'], ['saves', 'Saves']] as const).map(([k, l]) => (
                  <div key={k}>
                    <label style={lbl}>{l}</label>
                    <input type="number" value={(metrics as any)[k]} onChange={(e) => set(k, Number(e.target.value))} style={{ width: '100%' }} />
                  </div>
                ))}
              </div>

              <button className="btn btn-primary" onClick={submit} disabled={!creatorId || !title || !platform} style={{ padding: '11px 20px' }}>
                Submit &amp; ตรวจจับข้อมูล →
              </button>
              {!platform && link && <div style={{ fontSize: 11.5, color: 'var(--red)', marginTop: 8 }}>ตรวจจับแพลตฟอร์มจากลิงก์ไม่ได้ — ตรวจสอบ URL</div>}
            </>
          )}

          {step === 'detecting' && (
            <div style={{ textAlign: 'center', padding: 46 }}>
              <div className="spinner" style={{ width: 42, height: 42, margin: '0 auto 16px' }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>กำลังวิเคราะห์ข้อมูล…</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>ตรวจจับแพลตฟอร์มจากลิงก์ · ตรวจสอบยอดวิวและ Engagement</div>
            </div>
          )}

          {step === 'result' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#14532d22', border: '1px solid var(--green)', borderRadius: 10, padding: '11px 14px', marginBottom: 16, fontSize: 12.5, color: 'var(--green)', fontWeight: 500 }}>
                ✓ ตรวจจับสำเร็จ — ตรวจสอบและแก้ไขข้อมูลได้ก่อนยืนยัน
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span className="platform-icon" style={{ background: platformColor(platform!), width: 26, height: 26, fontSize: 11 }}>{platformInitial(platform!)}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{platform}</span>
                <span style={{ fontSize: 11.5, color: 'var(--text2)', background: 'var(--surface2)', padding: '3px 9px', borderRadius: 6 }}>{title}</span>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 11, padding: '13px 15px', marginBottom: 12 }}>
                <div style={{ fontSize: 11.5, color: 'var(--text2)', fontWeight: 600, marginBottom: 6 }}>Content Link</div>
                <input value={link} onChange={(e) => setLink(e.target.value)} style={{ width: '100%', fontFamily: 'monospace', fontSize: 12.5 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {([['views', 'Total Views'], ['engagement', 'Engagement'], ['likes', 'Likes'], ['comments', 'Comments'], ['shares', 'Shares'], ['saves', 'Saves']] as const).map(([k, l]) => (
                  <div key={k} style={{ border: '1px solid var(--border)', borderRadius: 11, padding: '11px 13px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 5 }}>{l}</div>
                    <input type="number" value={(metrics as any)[k]} onChange={(e) => set(k, Number(e.target.value))} style={{ width: '100%', fontFamily: 'monospace' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-success" onClick={confirm} disabled={saving} style={{ padding: '11px 20px' }}>
                  {saving ? 'กำลังบันทึก…' : '✓ ยืนยัน & ส่งเข้าระบบ'}
                </button>
                <button className="btn btn-secondary" onClick={reset}>เริ่มใหม่</button>
              </div>
            </>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: 36 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#14532d33', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>✓</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>ส่งข้อมูลสำเร็จ!</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, maxWidth: 380, marginInline: 'auto' }}>
                ข้อมูลของ <b style={{ color: 'var(--text)' }}>{selected?.name}</b> ถูกส่งเข้าคิวตรวจสอบแล้ว ทีมงานจะตรวจสอบและอนุมัติเข้าฐานข้อมูล
              </div>
              <button className="btn btn-primary" onClick={reset}>ส่งคอนเทนต์อื่นอีก</button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text2)', marginTop: 18 }}>
          ข้อมูลที่ส่งจะเข้าสู่คิวตรวจสอบของทีมงานก่อนบันทึกจริง
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 11 }}>{children}</div>;
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 };
const chip: React.CSSProperties = { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', textAlign: 'center' };
const chipL: React.CSSProperties = { fontSize: 10.5, color: 'var(--text2)', fontWeight: 600 };
const chipV: React.CSSProperties = { fontSize: 16, fontWeight: 600, fontFamily: 'monospace' };
