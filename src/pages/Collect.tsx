import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import { fmt, platformColor, platformInitial } from '../lib/utils';
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

  // ---- Upload (CSV/Excel) ----
  const [uploadRows, setUploadRows] = useState<any[]>([]);
  const [uploadName, setUploadName] = useState('');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadName(file.name);
    setUploadResult(null);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    setUploadRows(rows as any[]);
  };

  const doImport = async () => {
    if (uploadRows.length === 0) return;
    setImporting(true);
    try {
      const r = await api.contents.import({ rows: uploadRows, submitted_by: 'Admin User' });
      setUploadResult(r);
      setUploadRows([]);
      setUploadName('');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const header = 'creator,title,type,published_at,platform,url,views,engagement,likes,comments,shares,saves,uv,video_views';
    const example = creators[0]?.name
      ? `${creators[0].name},My Video EP.1,Long,2026-06-29,YouTube,https://youtu.be/xxx,10000,800,500,120,40,10,0,0`
      : 'Creator Name,My Video EP.1,Long,2026-06-29,YouTube,https://youtu.be/xxx,10000,800,500,120,40,10,0,0';
    const blob = new Blob([header + '\n' + example], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'import_template.csv';
    a.click();
  };

  // ---- AI Refresh ----
  const [aiRunning, setAiRunning] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const runAiRefresh = async () => {
    setAiRunning(true);
    setAiResult(null);
    try {
      const r = await api.contents.aiRefresh({});
      setAiResult(r);
    } finally {
      setAiRunning(false);
    }
  };

  // ---- Web Submit ----
  const submitUrl = `${window.location.origin}/submit`;
  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    navigator.clipboard?.writeText(submitUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <div style={{ maxWidth: 720 }}>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{lang === 'th' ? 'อัปโหลดไฟล์ Excel / CSV' : 'Upload Excel / CSV'}</div>
              <button className="btn btn-ghost" onClick={downloadTemplate} style={{ fontSize: 12 }}>
                ↓ {lang === 'th' ? 'ดาวน์โหลดเทมเพลต' : 'Download template'}
              </button>
            </div>
            <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 14 }}>
              {lang === 'th'
                ? 'คอลัมน์: creator, title, type, published_at, platform, url, views, engagement, likes, comments, shares, saves, uv, video_views (1 แถว = 1 แพลตฟอร์ม)'
                : 'Columns: creator, title, type, published_at, platform, url, views, engagement, likes, comments, shares, saves, uv, video_views (1 row = 1 platform)'}
            </div>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              {lang === 'th' ? 'เลือกไฟล์' : 'Choose File'}
              <input type="file" accept=".csv,.xlsx,.xls" onChange={onFile} style={{ display: 'none' }} />
            </label>
            {uploadName && <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--text2)' }}>{uploadName} · {uploadRows.length} {lang === 'th' ? 'แถว' : 'rows'}</span>}
          </div>

          {uploadRows.length > 0 && (
            <div className="card" style={{ marginBottom: 14, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)' }}>
                {lang === 'th' ? 'ตัวอย่าง 5 แถวแรก' : 'Preview (first 5 rows)'}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: 600 }}>
                  <thead><tr>{Object.keys(uploadRows[0]).slice(0, 7).map(k => <th key={k}>{k}</th>)}</tr></thead>
                  <tbody>
                    {uploadRows.slice(0, 5).map((r, i) => (
                      <tr key={i}>{Object.keys(uploadRows[0]).slice(0, 7).map(k => <td key={k} style={{ fontSize: 12 }}>{String(r[k])}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: 14 }}>
                <button className="btn btn-primary" onClick={doImport} disabled={importing}>
                  {importing ? '...' : (lang === 'th' ? `นำเข้า ${uploadRows.length} แถว` : `Import ${uploadRows.length} rows`)}
                </button>
              </div>
            </div>
          )}

          {uploadResult && (
            <div className="card">
              <div style={{ color: 'var(--green)', fontWeight: 700, marginBottom: 8 }}>
                ✓ {lang === 'th' ? 'นำเข้าสำเร็จ' : 'Imported'}: {uploadResult.episodes} {lang === 'th' ? 'คอนเทนต์' : 'episodes'}, {uploadResult.links} {lang === 'th' ? 'ลิงก์' : 'links'}
              </div>
              {uploadResult.errors?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    {uploadResult.errors.length} {lang === 'th' ? 'แถวมีปัญหา' : 'errors'}:
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', maxHeight: 160, overflowY: 'auto' }}>
                    {uploadResult.errors.map((e: string, i: number) => <div key={i}>• {e}</div>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="card" style={{ maxWidth: 540 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>AI Refresh</div>
          <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
            {lang === 'th' ? 'อัปเดตยอด Follower ของทุกครีเอเตอร์ที่มี handle ลงทะเบียนไว้ (ประมาณการการเติบโต) แล้วบันทึกลงฐานข้อมูล + Audit Log' : 'Refresh follower counts for all creators with registered handles and save to the database + Audit Log.'}
          </div>
          <button className="btn btn-primary" onClick={runAiRefresh} disabled={aiRunning}>
            {aiRunning ? (lang === 'th' ? 'กำลังประมวลผล...' : 'Running...') : (lang === 'th' ? 'เริ่ม AI Refresh' : 'Start AI Refresh')}
          </button>
          {aiResult && (
            <div style={{ marginTop: 16, padding: '12px 14px', background: '#7c5cff22', border: '1px solid var(--accent2)', borderRadius: 8 }}>
              <div style={{ color: 'var(--accent2)', fontWeight: 700, marginBottom: 6 }}>
                ✓ {lang === 'th' ? 'อัปเดตแล้ว' : 'Updated'} {aiResult.updated} {lang === 'th' ? 'ครีเอเตอร์' : 'creators'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                {aiResult.details?.map((d: any) => d.name).join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'web' && (
        <div className="card" style={{ maxWidth: 540 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Web Submit Link</div>
          <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
            {lang === 'th' ? 'ส่งลิงก์นี้ให้ครีเอเตอร์กรอกข้อมูลคอนเทนต์ด้วยตัวเอง ข้อมูลจะเข้าคิวรอ Editor ตรวจสอบ (หน้า Editor)' : 'Share this link so creators can submit their content data. Submissions go to the review queue (Editor page).'}
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, marginBottom: 12, color: 'var(--accent2)', wordBreak: 'break-all' }}>
            {submitUrl}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={copyLink}>{lang === 'th' ? 'คัดลอกลิงก์' : 'Copy Link'}</button>
            <a className="btn btn-ghost" href={submitUrl} target="_blank" rel="noreferrer">{lang === 'th' ? 'เปิดหน้าฟอร์ม' : 'Open form'} ↗</a>
            {copied && <span style={{ fontSize: 12, color: 'var(--green)' }}>✓ {lang === 'th' ? 'คัดลอกแล้ว' : 'Copied'}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
