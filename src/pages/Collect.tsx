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

      {activeTab === 'ai' && (
        <div className="card" style={{ maxWidth: 500 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>AI Refresh</div>
          <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
            {lang === 'th' ? 'ใช้ AI อัปเดตข้อมูล Follower อัตโนมัติจาก handle ที่ลงทะเบียนไว้' : 'Use AI to auto-update follower counts from registered handles.'}
          </div>
          <button className="btn btn-primary">
            {lang === 'th' ? 'เริ่ม AI Refresh' : 'Start AI Refresh'}
          </button>
        </div>
      )}

      {activeTab === 'web' && (
        <div className="card" style={{ maxWidth: 500 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Web Submit Link</div>
          <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
            {lang === 'th' ? 'สร้างลิงก์ให้ครีเอเตอร์กรอกข้อมูลด้วยตัวเอง' : 'Generate a link for creators to self-submit their data.'}
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, marginBottom: 12, color: 'var(--accent2)' }}>
            https://hub.example.com/submit/abc123
          </div>
          <button className="btn btn-secondary">{lang === 'th' ? 'คัดลอกลิงก์' : 'Copy Link'}</button>
        </div>
      )}
    </div>
  );
}
