import React, { useEffect, useRef, useState } from 'react';
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
  // AI Refresh simulation
  const [aiState, setAiState] = useState<'idle' | 'running' | 'done'>('idle');
  const [aiCount, setAiCount] = useState(0);
  // Upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<string | null>(null);
  const [uploadDone, setUploadDone] = useState(false);
  // Web submit
  const [copied, setCopied] = useState(false);

  const runAiRefresh = () => {
    setAiState('running'); setAiCount(0);
    const total = creators.length || 8;
    let n = 0;
    const timer = setInterval(() => {
      n += 1; setAiCount(n);
      if (n >= total) { clearInterval(timer); setAiState('done'); }
    }, 320);
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setUploadFile(f.name); setUploadDone(false); setTimeout(() => setUploadDone(true), 900); }
  };

  const copyLink = () => {
    navigator.clipboard?.writeText('https://hub.example.com/submit/abc123')
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

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
        <div className="card" style={{ maxWidth: 520 }}>
          <input ref={fileRef} type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={onPickFile} />
          <div onClick={() => fileRef.current?.click()} style={{
            border: '2px dashed var(--border2)', borderRadius: 12, padding: 36,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', textAlign: 'center',
          }}>
            <div style={{ fontSize: 38 }}>📄</div>
            <div style={{ fontWeight: 700 }}>{lang === 'th' ? 'อัปโหลดไฟล์ Excel / CSV' : 'Upload Excel / CSV'}</div>
            <div style={{ color: 'var(--text3)', fontSize: 12 }}>{lang === 'th' ? 'คลิกเพื่อเลือกไฟล์ · รองรับ .xlsx และ .csv' : 'Click to choose · .xlsx and .csv'}</div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 4 }}>{lang === 'th' ? 'เลือกไฟล์' : 'Choose File'}</button>
          </div>
          {uploadFile && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', borderRadius: 9, padding: '12px 14px' }}>
              <span style={{ fontSize: 20 }}>{uploadDone ? '✅' : '⏳'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{uploadFile}</div>
                <div style={{ fontSize: 12, color: uploadDone ? 'var(--green)' : 'var(--text2)' }}>
                  {uploadDone ? (lang === 'th' ? 'นำเข้าสำเร็จ · พร้อมตรวจสอบในหน้า Editor' : 'Imported · ready for review') : (lang === 'th' ? 'กำลังประมวลผล...' : 'Processing...')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="card" style={{ maxWidth: 520 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="tag" style={{ background: '#7c5cff1f', color: '#7c5cff' }}>AI Refresh</span>
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
            {lang === 'th' ? 'ใช้ AI อัปเดตข้อมูล Follower อัตโนมัติจาก handle ที่ลงทะเบียนไว้' : 'Use AI to auto-update follower counts from registered handles.'}
          </div>

          {aiState === 'running' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                <span style={{ color: 'var(--text2)' }}>{lang === 'th' ? 'กำลังดึงข้อมูล...' : 'Fetching...'}</span>
                <span className="num" style={{ fontWeight: 700 }}>{aiCount}/{creators.length || 8}</span>
              </div>
              <div style={{ height: 8, background: 'var(--surface3)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: (aiCount / (creators.length || 8) * 100) + '%', background: '#7c5cff', borderRadius: 5, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
          {aiState === 'done' && (
            <div style={{ marginBottom: 16, background: 'var(--green-soft)', border: '1px solid #b6e6c5', color: 'var(--green)', borderRadius: 9, padding: '11px 14px', fontSize: 13, fontWeight: 600 }}>
              ✓ {lang === 'th' ? `อัปเดตสำเร็จ ${creators.length || 8} ครีเอเตอร์` : `Updated ${creators.length || 8} creators`}
            </div>
          )}

          <button className="btn btn-primary" disabled={aiState === 'running'} onClick={runAiRefresh}>
            {aiState === 'running' ? (lang === 'th' ? 'กำลังทำงาน...' : 'Running...') : aiState === 'done' ? (lang === 'th' ? 'รันอีกครั้ง' : 'Run again') : (lang === 'th' ? 'เริ่ม AI Refresh' : 'Start AI Refresh')}
          </button>
        </div>
      )}

      {activeTab === 'web' && (
        <div className="card" style={{ maxWidth: 520 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Web Submit Link</div>
          <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
            {lang === 'th' ? 'สร้างลิงก์ให้ครีเอเตอร์กรอกข้อมูลด้วยตัวเอง' : 'Generate a link for creators to self-submit their data.'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--accent)' }}>
              https://hub.example.com/submit/abc123
            </div>
            <button className="btn btn-secondary" onClick={copyLink}>{copied ? (lang === 'th' ? 'คัดลอกแล้ว ✓' : 'Copied ✓') : (lang === 'th' ? 'คัดลอกลิงก์' : 'Copy Link')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
