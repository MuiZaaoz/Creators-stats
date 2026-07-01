import React, { useEffect, useRef, useState } from 'react';
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

      {activeTab === 'upload' && <UploadTab lang={lang} />}

      {activeTab === 'ai' && <AiRefreshTab lang={lang} />}

      {activeTab === 'web' && <WebSubmitTab lang={lang} />}
    </div>
  );
}

// Map many possible column headers (TH/EN) to our canonical field names.
const COLUMN_ALIASES: Record<string, string> = {
  creator: 'creator_name', creator_name: 'creator_name', 'ครีเอเตอร์': 'creator_name', name: 'creator_name', 'ชื่อ': 'creator_name',
  title: 'title', 'ชื่อคอนเทนต์': 'title', 'คอนเทนต์': 'title',
  type: 'type', 'ประเภท': 'type',
  platform: 'platform', 'แพลตฟอร์ม': 'platform',
  url: 'url', link: 'url', 'ลิงก์': 'url',
  views: 'views', 'วิว': 'views', view: 'views',
  engagement: 'engagement', 'การมีส่วนร่วม': 'engagement', eng: 'engagement',
  likes: 'likes', like: 'likes', 'ไลค์': 'likes',
  comments: 'comments', comment: 'comments', 'คอมเมนต์': 'comments',
  shares: 'shares', share: 'shares', 'แชร์': 'shares',
  published_at: 'published_at', date: 'published_at', 'วันที่': 'published_at', 'วันที่เผยแพร่': 'published_at',
};

function normalizeRow(raw: Record<string, any>): any {
  const out: any = {};
  for (const key of Object.keys(raw)) {
    const canon = COLUMN_ALIASES[String(key).trim().toLowerCase()] || COLUMN_ALIASES[String(key).trim()];
    if (canon) out[canon] = raw[key];
  }
  return out;
}

function UploadTab({ lang }: { lang: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setResult(null); setFileName(file.name);
    try {
      const isCsv = /\.csv$/i.test(file.name);
      const wb = isCsv
        ? XLSX.read(await file.text(), { type: 'string' })   // UTF-8 text (Thai-safe)
        : XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const normalized = json.map(normalizeRow).filter(r => r.creator_name || r.title || r.platform);
      if (normalized.length === 0) setError('ไม่พบข้อมูลที่อ่านได้ — ตรวจสอบหัวคอลัมน์');
      setRows(normalized);
    } catch {
      setError('อ่านไฟล์ไม่สำเร็จ');
    }
  };

  const doImport = async () => {
    setImporting(true);
    try {
      const r = await api.contents.import({ rows, submitted_by: 'Upload' });
      setResult(r);
      setRows([]);
    } catch {
      setError('นำเข้าไม่สำเร็จ');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = 'creator,title,type,platform,url,views,engagement,likes,comments,shares,published_at\n'
      + 'Napat Wong,สอนเล่นโปร EP.1,Long,YouTube,https://youtu.be/xxx,120000,8000,5000,300,150,2026-07-01\n';
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'import_template.csv'; a.click();
  };

  const cols = ['creator_name', 'title', 'type', 'platform', 'views', 'engagement', 'likes', 'comments', 'shares'];

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontWeight: 700 }}>{lang === 'th' ? 'อัปโหลดไฟล์ Excel / CSV' : 'Upload Excel / CSV'}</div>
          <button className="btn btn-ghost" onClick={downloadTemplate} style={{ fontSize: 12 }}>↓ {lang === 'th' ? 'ดาวน์โหลดเทมเพลต' : 'Template'}</button>
        </div>
        <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 14 }}>
          {lang === 'th' ? 'รองรับ .xlsx และ .csv — คอลัมน์: creator, title, type, platform, url, views, engagement, likes, comments, shares' : 'Supports .xlsx / .csv'}
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFile} style={{ display: 'none' }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>{lang === 'th' ? 'เลือกไฟล์' : 'Choose File'}</button>
          {fileName && <span style={{ fontSize: 13, color: 'var(--text2)' }}>{fileName} · {rows.length} {lang === 'th' ? 'แถว' : 'rows'}</span>}
        </div>
        {error && <div style={{ marginTop: 12, color: 'var(--red)', fontSize: 13 }}>{error}</div>}
      </div>

      {rows.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{lang === 'th' ? 'ตัวอย่างก่อนนำเข้า' : 'Preview'} ({rows.length})</div>
            <button className="btn btn-primary" onClick={doImport} disabled={importing}>{importing ? '...' : (lang === 'th' ? `นำเข้า ${rows.length} รายการ` : `Import ${rows.length}`)}</button>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: 360 }}>
            <table style={{ minWidth: 700 }}>
              <thead><tr>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {rows.slice(0, 30).map((r, i) => (
                  <tr key={i}>{cols.map(c => <td key={c} className="num" style={{ fontSize: 12 }}>{typeof r[c] === 'number' ? fmt(r[c]) : (r[c] ?? '-')}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div className="card" style={{ borderColor: 'var(--green)' }}>
          <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>✓ {lang === 'th' ? 'นำเข้าสำเร็จ' : 'Imported'}</div>
          <div style={{ fontSize: 13 }}>{lang === 'th' ? 'นำเข้า' : 'Imported'} <b>{result.imported}</b> / {result.total} {lang === 'th' ? 'รายการ เข้าคิวตรวจสอบแล้ว' : 'rows (queued for review)'}</div>
          {result.errors?.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8 }}>
              {result.errors.slice(0, 5).map((e: string, i: number) => <div key={i}>{e}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AiRefreshTab({ lang }: { lang: string }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    setRunning(true); setResult(null);
    try {
      const r = await api.creators.refresh();
      setResult(r);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>AI Refresh</div>
      <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
        {lang === 'th' ? 'ดึงข้อมูลล่าสุดของทุกครีเอเตอร์อัตโนมัติ — ทั้งยอดผู้ติดตาม, ยอดวิว และ Engagement ของทุกคอนเทนต์ พร้อมบันทึกประวัติสำหรับคำนวณการเติบโต' : 'Re-fetch latest data for all creators — followers, views and engagement across all content.'}
      </div>
      <button className="btn btn-primary" onClick={run} disabled={running}>
        {running ? (lang === 'th' ? 'กำลังอัปเดต...' : 'Refreshing...') : (lang === 'th' ? 'เริ่ม AI Refresh' : 'Start AI Refresh')}
      </button>
      {result && (
        <div style={{ marginTop: 16, background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px', fontSize: 13 }}>
          ✓ {lang === 'th' ? 'อัปเดตแล้ว' : 'Updated'} <b>{result.updated}</b> {lang === 'th' ? 'ครีเอเตอร์' : 'creators'} · <b>{result.links_updated}</b> {lang === 'th' ? 'คอนเทนต์' : 'content links'}
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{new Date(result.refreshed_at).toLocaleString('th-TH')}</div>
        </div>
      )}
    </div>
  );
}

function WebSubmitTab({ lang }: { lang: string }) {
  const submitUrl = `${window.location.origin}/submit`;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(submitUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be blocked; user can copy manually */
    }
  };

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Web Submit Link</div>
      <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
        {lang === 'th'
          ? 'ส่งลิงก์นี้ให้ครีเอเตอร์กรอกข้อมูลคอนเทนต์ด้วยตัวเอง — ข้อมูลจะเข้าคิวตรวจสอบอัตโนมัติ'
          : 'Share this link so creators can submit their own content. Submissions go to the review queue.'}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, color: 'var(--accent2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {submitUrl}
        </div>
        <button className="btn btn-primary" onClick={copy}>
          {copied ? (lang === 'th' ? '✓ คัดลอกแล้ว' : '✓ Copied') : (lang === 'th' ? 'คัดลอกลิงก์' : 'Copy Link')}
        </button>
      </div>
      <a href={submitUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
        {lang === 'th' ? 'เปิดหน้าฟอร์ม ↗' : 'Open form ↗'}
      </a>
    </div>
  );
}
