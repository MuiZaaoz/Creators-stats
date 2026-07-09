import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import { fmt } from '../lib/utils';
import PageHeader from '../components/PageHeader';

const FIELD_GROUPS = [
  {
    group: 'Creator',
    fields: [
      { key: 'creator_name', label: 'ชื่อครีเอเตอร์' },
      { key: 'creator_type', label: 'ประเภท' },
      { key: 'yt_followers', label: 'YouTube Followers' },
      { key: 'fb_followers', label: 'Facebook Followers' },
      { key: 'tt_followers', label: 'TikTok Followers' },
      { key: 'ig_followers', label: 'Instagram Followers' },
    ],
  },
  {
    group: 'Program',
    fields: [{ key: 'program_name', label: 'ชื่อโปรแกรม' }],
  },
  {
    group: 'Content',
    fields: [
      { key: 'episode_title', label: 'ชื่อคอนเทนต์' },
      { key: 'content_type', label: 'ประเภทคอนเทนต์' },
      { key: 'published_at', label: 'วันที่เผยแพร่' },
      { key: 'platform', label: 'แพลตฟอร์ม' },
      { key: 'url', label: 'URL' },
    ],
  },
  {
    group: 'Metrics',
    fields: [
      { key: 'views', label: 'วิว' },
      { key: 'engagement', label: 'Engagement' },
      { key: 'likes', label: 'Likes' },
      { key: 'comments', label: 'Comments' },
      { key: 'shares', label: 'Shares' },
      { key: 'saves', label: 'Saves' },
      { key: 'uv', label: 'UV (Streamer)' },
      { key: 'video_views', label: 'Video Views (Streamer)' },
    ],
  },
];

export default function Export() {
  const { lang } = useAppStore();
  const t = useT(lang);
  const [selectedFields, setSelectedFields] = useState<string[]>(['creator_name', 'program_name', 'episode_title', 'platform', 'views', 'engagement']);
  const [programs, setPrograms] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({ program_id: '', platform: '', type: '' });
  const [preview, setPreview] = useState<any>(null);
  const [exportData, setExportData] = useState<any[] | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.programs.list().then(setPrograms);
    loadPreview();
  }, []);

  useEffect(() => { loadPreview(); }, [filters]);

  const loadPreview = async () => {
    const params: any = {};
    if (filters.program_id) params.program_id = filters.program_id;
    if (filters.platform) params.platform = filters.platform;
    if (filters.type) params.type = filters.type;
    const p = await api.export.preview(params);
    setPreview(p);
  };

  const toggleField = (key: string) => {
    setSelectedFields(prev => prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]);
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const body: any = { fields: selectedFields, ...filters };
      Object.keys(body).forEach(k => { if (!body[k]) delete body[k]; });
      const result = await api.export.export({ ...body, fields: selectedFields });
      setExportData(result.rows);
    } finally {
      setExporting(false);
    }
  };

  const downloadCSV = () => {
    if (!exportData) return;
    const header = selectedFields.join(',');
    const rows = exportData.map(row => selectedFields.map(f => JSON.stringify(row[f] ?? '')).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'creator_data.csv';
    a.click();
  };

  return (
    <div style={{ padding: '20px 28px', flex: 1 }}>
      <PageHeader title={t('export')} subtitle={lang === 'th' ? 'เลือกฟิลด์และส่งออกข้อมูล' : 'Select fields and export data'} />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* Left: Field Selection */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>{lang === 'th' ? 'ตัวกรอง' : 'Filters'}</div>
            <div className="form-group">
              <label>{t('program')}</label>
              <select value={filters.program_id} onChange={e => setFilters({ ...filters, program_id: e.target.value })}>
                <option value="">{lang === 'th' ? 'ทั้งหมด' : 'All'}</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{t('platform')}</label>
              <select value={filters.platform} onChange={e => setFilters({ ...filters, platform: e.target.value })}>
                <option value="">{lang === 'th' ? 'ทั้งหมด' : 'All'}</option>
                {['YouTube', 'TikTok', 'Facebook', 'Instagram'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{t('type')}</label>
              <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
                <option value="">{lang === 'th' ? 'ทั้งหมด' : 'All'}</option>
                {['Long', 'Short', 'Streamer'].map(tp => <option key={tp}>{tp}</option>)}
              </select>
            </div>
            {preview && (
              <div style={{ background: 'var(--surface2)', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: 'var(--text2)' }}>
                {lang === 'th' ? 'รายการที่จะส่งออก' : 'Records to export'}: <strong style={{ color: 'var(--text)' }}>{fmt(preview.count)}</strong>
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>{lang === 'th' ? 'เลือกฟิลด์' : 'Select Fields'}</div>
            {FIELD_GROUPS.map(group => (
              <div key={group.group} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  {group.group}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {group.fields.map(field => (
                    <label key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.key)}
                        onChange={() => toggleField(field.key)}
                        style={{ width: 14, height: 14 }}
                      />
                      {field.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Preview + Actions */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button className="btn btn-primary" onClick={doExport} disabled={exporting || selectedFields.length === 0}>
              {exporting ? '...' : (lang === 'th' ? 'แสดงตัวอย่าง' : 'Preview')}
            </button>
            {exportData && (
              <button className="btn btn-secondary" onClick={downloadCSV}>
                {lang === 'th' ? 'ดาวน์โหลด CSV' : 'Download CSV'}
              </button>
            )}
          </div>

          {exportData ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text2)' }}>
                {fmt(exportData.length)} {lang === 'th' ? 'รายการ' : 'records'}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: 600 }}>
                  <thead>
                    <tr>
                      {selectedFields.map(f => (
                        <th key={f}>{f.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exportData.slice(0, 50).map((row: any, i: number) => (
                      <tr key={i}>
                        {selectedFields.map(f => (
                          <td key={f} className="num" style={{ fontSize: 12 }}>
                            {typeof row[f] === 'number' ? fmt(row[f]) : row[f] ?? '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {exportData.length > 50 && (
                <div style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text2)', borderTop: '1px solid var(--border)' }}>
                  {lang === 'th' ? 'แสดง 50 จาก' : 'Showing 50 of'} {fmt(exportData.length)} {lang === 'th' ? 'รายการ' : 'records'}
                </div>
              )}
            </div>
          ) : (
            <div className="card empty-state">
              <div style={{ fontSize: 32 }}>📊</div>
              <div>{lang === 'th' ? 'กดแสดงตัวอย่างเพื่อดูข้อมูล' : 'Click Preview to see data'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
