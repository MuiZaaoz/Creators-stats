import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import { platformColor, platformInitial } from '../lib/utils';
import PageHeader from '../components/PageHeader';

const PLATFORMS = ['YouTube', 'Facebook', 'TikTok', 'Instagram'];

const EMPTY_LINK = { platform: 'YouTube', url: '', views: 0, engagement: 0, likes: 0, comments: 0, shares: 0, saves: 0, uv: 0, video_views: 0 };

export default function Collect() {
  const { lang } = useAppStore();
  const t = useT(lang);
  const [activeTab, setActiveTab] = useState<'manual' | 'upload' | 'ai' | 'web'>('manual');
  const [creators, setCreators] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    creator_id: '',
    title: '',
    type: 'Long',
    published_at: new Date().toISOString().slice(0, 16),
    submitted_by: 'Admin User',
    links: [{ ...EMPTY_LINK }],
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.creators.list().then(c => {
      setCreators(c);
      if (c.length > 0) setForm((f: any) => ({ ...f, creator_id: c[0].id }));
    });
  }, []);

  const addLink = () => setForm({ ...form, links: [...form.links, { ...EMPTY_LINK }] });
  const removeLink = (i: number) => setForm({ ...form, links: form.links.filter((_: any, idx: number) => idx !== i) });
  const updateLink = (i: number, key: string, value: any) => {
    const links = [...form.links];
    links[i] = { ...links[i], [key]: value };
    setForm({ ...form, links });
  };

  const save = async () => {
    if (!form.creator_id || !form.title) return;
    setSaving(true);
    try {
      await api.contents.createEpisode(form);
      setSuccess(true);
      setForm({
        creator_id: creators[0]?.id || '',
        title: '', type: 'Long',
        published_at: new Date().toISOString().slice(0, 16),
        submitted_by: 'Admin User',
        links: [{ ...EMPTY_LINK }],
      });
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { key: 'manual', label: lang === 'th' ? 'กรอกเอง' : 'Manual' },
    { key: 'upload', label: lang === 'th' ? 'อัปโหลด' : 'Upload' },
    { key: 'ai', label: 'AI Refresh' },
    { key: 'web', label: 'Web Submit' },
  ];

  return (
    <div style={{ padding: '20px 28px', flex: 1 }}>
      <PageHeader title={t('collect')} subtitle={lang === 'th' ? 'เพิ่มข้อมูลคอนเทนต์' : 'Add content data'} />

      <div className="tab-bar">
        {TABS.map(tab => (
          <button key={tab.key}
            className={'tab-btn' + (activeTab === tab.key ? ' active' : '')}
            onClick={() => setActiveTab(tab.key as any)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'manual' && (
        <div style={{ maxWidth: 720 }}>
          {success && (
            <div style={{
              background: '#14532d22', border: '1px solid var(--green)', color: 'var(--green)',
              borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
            }}>
              ✓ {lang === 'th' ? 'บันทึกสำเร็จ' : 'Saved successfully'}
            </div>
          )}

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>{lang === 'th' ? 'ข้อมูลคอนเทนต์' : 'Content Info'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>{lang === 'th' ? 'ครีเอเตอร์' : 'Creator'}</label>
                <select value={form.creator_id} onChange={e => setForm({ ...form, creator_id: e.target.value })}>
                  {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{t('type')}</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option>Long</option>
                  <option>Short</option>
                  <option>Streamer</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>{lang === 'th' ? 'ชื่อคอนเทนต์' : 'Title'}</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder={lang === 'th' ? 'ชื่อวิดีโอหรือ EP' : 'Video title or EP name'} />
              </div>
              <div className="form-group">
                <label>{t('publishedAt')}</label>
                <input type="datetime-local" value={form.published_at}
                  onChange={e => setForm({ ...form, published_at: e.target.value })} />
              </div>
              <div className="form-group">
                <label>{lang === 'th' ? 'ส่งโดย' : 'Submitted By'}</label>
                <input value={form.submitted_by} onChange={e => setForm({ ...form, submitted_by: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>{lang === 'th' ? 'ข้อมูลแต่ละแพลตฟอร์ม' : 'Platform Data'}</div>
              <button className="btn btn-secondary" onClick={addLink} style={{ fontSize: 12 }}>+ {lang === 'th' ? 'เพิ่ม' : 'Add'}</button>
            </div>
            {form.links.map((lnk: any, i: number) => (
              <div key={i} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span className="platform-icon" style={{ background: platformColor(lnk.platform) }}>
                    {platformInitial(lnk.platform)}
                  </span>
                  <select value={lnk.platform} onChange={e => updateLink(i, 'platform', e.target.value)} style={{ flex: 1 }}>
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                  <input value={lnk.url} onChange={e => updateLink(i, 'url', e.target.value)}
                    placeholder="URL" style={{ flex: 3 }} />
                  {form.links.length > 1 && (
                    <button className="btn btn-ghost" onClick={() => removeLink(i)} style={{ color: 'var(--red)' }}>✕</button>
                  )}
                </div>
                {lnk.platform === 'YouTube' || lnk.platform === 'Facebook' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                      { key: 'views', label: t('views') },
                      { key: 'engagement', label: t('engagement') },
                      { key: 'likes', label: t('likes') },
                      { key: 'comments', label: t('comments') },
                      { key: 'shares', label: t('shares') },
                      { key: 'saves', label: t('saves') },
                      ...(form.type === 'Streamer' ? [{ key: 'uv', label: 'UV' }, { key: 'video_views', label: 'Video Views' }] : []),
                    ].map(field => (
                      <div key={field.key} className="form-group" style={{ margin: 0 }}>
                        <label>{field.label}</label>
                        <input type="number" value={lnk[field.key] || 0}
                          onChange={e => updateLink(i, field.key, Number(e.target.value))} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                      { key: 'views', label: t('views') },
                      { key: 'engagement', label: t('engagement') },
                      { key: 'likes', label: t('likes') },
                      { key: 'comments', label: t('comments') },
                      { key: 'shares', label: t('shares') },
                      { key: 'saves', label: t('saves') },
                    ].map(field => (
                      <div key={field.key} className="form-group" style={{ margin: 0 }}>
                        <label>{field.label}</label>
                        <input type="number" value={lnk[field.key] || 0}
                          onChange={e => updateLink(i, field.key, Number(e.target.value))} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ padding: '10px 24px' }}>
            {saving ? '...' : (lang === 'th' ? 'ส่งข้อมูล' : 'Submit')}
          </button>
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="card empty-state" style={{ maxWidth: 500 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{lang === 'th' ? 'อัปโหลดไฟล์ Excel / CSV' : 'Upload Excel / CSV'}</div>
          <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 16 }}>
            {lang === 'th' ? 'รองรับรูปแบบ .xlsx และ .csv' : 'Supports .xlsx and .csv formats'}
          </div>
          <button className="btn btn-secondary">{lang === 'th' ? 'เลือกไฟล์' : 'Choose File'}</button>
        </div>
      )}

      {activeTab === 'ai' && <AiRefreshTab lang={lang} />}

      {activeTab === 'web' && <WebSubmitTab lang={lang} creators={creators} />}
    </div>
  );
}

/* ================= AI Refresh ================= */
function AiRefreshTab({ lang }: any) {
  const t2 = (th: string, en: string) => (lang === 'th' ? th : en);
  const [status, setStatus] = useState<any>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<Record<number, string>>({});

  const load = () => api.ai.status().then(setStatus);
  useEffect(() => { load(); }, []);

  const toggleAll = (on: boolean) => {
    const next: Record<number, boolean> = {};
    if (on) (status?.creators || []).forEach((c: any) => { if (c.linked > 0) next[c.id] = true; });
    setSelected(next);
  };

  const run = async () => {
    const ids = (status?.creators || []).filter((c: any) => selected[c.id]).map((c: any) => c.id);
    if (ids.length === 0) return;
    setRunning(true);
    for (const id of ids) {
      let remaining = 1, batches = 0, okTotal = 0, tried = 0;
      while (remaining > 0 && batches < 30) {
        setProgress(p => ({ ...p, [id]: t2(`กำลังเข้าดูคลิป... (ชุดที่ ${batches + 1})`, `Visiting clips... (batch ${batches + 1})`) }));
        try {
          const r = await api.ai.refresh(id);
          remaining = r.remaining || 0;
          batches++; okTotal += r.updated || 0; tried += r.batch || 0;
          setProgress(p => ({ ...p, [id]: t2(`อ่านได้ ${okTotal}/${tried} ลิงก์${remaining ? ` · เหลือ ${remaining}` : ' · เสร็จ ✓'}`, `Read ${okTotal}/${tried}${remaining ? ` · ${remaining} left` : ' · done ✓'}`) }));
        } catch {
          setProgress(p => ({ ...p, [id]: '✕ ' + t2('ผิดพลาด', 'failed') }));
          break;
        }
      }
      await load();
    }
    setRunning(false);
  };

  if (!status) return <div className="empty-state"><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{t2('เลือกครีเอเตอร์ที่ต้องการอัปเดต', 'Select creators to refresh')}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
              {t2('AI จะเข้าดูหน้าคลิปเหมือนคนดู (เว้นระยะ 3-7 วิ/ลิงก์) แล้วอ่าน Views + Engagement (Like·Comment·Share·Save) และ Followers — ไม่ใช้ API key', 'AI visits each clip page like a human (3-7s pause per link) and reads Views + Engagement (Like·Comment·Share·Save) and Followers — no API key')}
            </div>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => toggleAll(true)}>{t2('เลือกทั้งหมด', 'All')}</button>
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => toggleAll(false)}>{t2('ล้าง', 'None')}</button>
          <button className="btn btn-primary" disabled={running || !Object.values(selected).some(Boolean)} onClick={run}>
            {running ? t2('กำลังทำงาน...', 'Running...') : t2('เริ่ม AI Refresh', 'Start AI Refresh')}
          </button>
        </div>

        {(status.creators || []).map((c: any) => (
          <label key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
            borderBottom: '1px solid #f0f0f2', cursor: c.linked > 0 ? 'pointer' : 'default',
            opacity: c.linked > 0 ? 1 : 0.45,
          }}>
            <input type="checkbox" disabled={c.linked === 0 || running}
              checked={!!selected[c.id]}
              onChange={e => setSelected({ ...selected, [c.id]: e.target.checked })}
              style={{ width: 15, height: 15, accentColor: 'var(--accent)' }} />
            <div className="avatar" style={{ background: c.avatar_color, width: 30, height: 30, fontSize: 11 }}>{initialsOf(c.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text2)' }}>
                {c.linked} {t2('ลิงก์', 'links')} · {t2('อัปเดตโดย AI แล้ว', 'AI refreshed')} {c.refreshed}/{c.linked}
              </div>
            </div>
            {progress[c.id] && (
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{progress[c.id]}</span>
            )}
            <span className="num" style={{ fontSize: 11.5, color: c.ai_updated_at ? '#16a34a' : 'var(--text2)', whiteSpace: 'nowrap' }}>
              {c.ai_updated_at
                ? `🤖 ${t2('ล่าสุด', 'last')} ${c.ai_updated_at.slice(5, 16)}`
                : t2('ยังไม่เคยอัปเดต', 'never refreshed')}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* ================= Web Submit ================= */
function WebSubmitTab({ lang, creators }: any) {
  const t2 = (th: string, en: string) => (lang === 'th' ? th : en);
  const [tokens, setTokens] = useState<any[]>([]);
  const [creatorId, setCreatorId] = useState<string>('');
  const [copied, setCopied] = useState('');

  const load = () => api.submit.tokens().then(setTokens);
  useEffect(() => { load(); }, []);

  const linkOf = (token: string) => `${location.origin}/submit/${token}`;

  const create = async () => {
    await api.submit.createToken({ creator_id: creatorId || null });
    load();
  };

  const copy = (token: string) => {
    navigator.clipboard?.writeText(linkOf(token));
    setCopied(token);
    setTimeout(() => setCopied(''), 1800);
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Web Submit Link</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
          {t2('สร้างลิงก์ส่งให้ครีเอเตอร์กรอกข้อมูลเอง — ข้อมูลที่ส่งจะเข้าคิวตรวจสอบก่อนเสมอ', 'Create a link for creators to self-submit — entries always go to the review queue first')}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <label>{t2('สำหรับครีเอเตอร์', 'For creator')}</label>
            <select value={creatorId} onChange={e => setCreatorId(e.target.value)}>
              <option value="">{t2('— ทุกคน (ให้เลือกชื่อเองในฟอร์ม) —', '— Anyone (picks name in the form) —')}</option>
              {creators.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={create}>+ {t2('สร้างลิงก์', 'Create Link')}</button>
        </div>
      </div>

      {tokens.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>
            {t2('ลิงก์ที่ใช้งานอยู่', 'Active links')} ({tokens.length})
          </div>
          {tokens.map((tk: any) => (
            <div key={tk.token} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid #f0f0f2' }}>
              <span className="badge" style={{
                background: tk.creator_id ? 'var(--accent-tint)' : '#f3f3f5',
                color: tk.creator_id ? '#4646c6' : '#52525b', flexShrink: 0,
              }}>
                {tk.creator_name || t2('ทุกคน', 'Anyone')}
              </span>
              <a href={linkOf(tk.token)} target="_blank" rel="noopener noreferrer"
                className="num" style={{ flex: 1, fontSize: 12, color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {linkOf(tk.token)}
              </a>
              <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => copy(tk.token)}>
                {copied === tk.token ? '✓ ' + t2('คัดลอกแล้ว', 'Copied') : t2('คัดลอก', 'Copy')}
              </button>
              <button className="btn btn-ghost" style={{ color: 'var(--red)', fontSize: 12 }}
                onClick={async () => { await api.submit.deleteToken(tk.token); load(); }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function initialsOf(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
