import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import { fmt, initials, platformColor, platformInitial, relDate, typeColor } from '../lib/utils';
import PageHeader from '../components/PageHeader';

export default function Creators() {
  const { lang } = useAppStore();
  const t = useT(lang);
  const navigate = useNavigate();
  const [creators, setCreators] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [filterProg, setFilterProg] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([api.creators.overview(), api.programs.list()]).then(([c, p]) => {
      setCreators(c);
      setPrograms(p);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const filtered = creators.filter((c) => {
    if (filterProg && c.program_id !== filterProg) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const platformsOf = (c: any) => [
    { name: 'YouTube', f: c.yt_followers },
    { name: 'TikTok', f: c.tt_followers },
    { name: 'Facebook', f: c.fb_followers },
    { name: 'Instagram', f: c.ig_followers },
  ].filter((p) => p.f > 0);

  const lastUpdate = (c: any) => c.last_refreshed || c.last_content;
  const isActive = (c: any) => {
    const d = lastUpdate(c);
    if (!d) return false;
    return (Date.now() - new Date(d.replace(' ', 'T')).getTime()) < 1000 * 60 * 60 * 24 * 30;
  };

  return (
    <div style={{ padding: '20px 28px', flex: 1 }}>
      <PageHeader
        title={t('creators')}
        subtitle={`${creators.length} ${lang === 'th' ? 'ครีเอเตอร์' : 'creators'}`}
        actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ {t('add')}</button>}
      />

      {/* search + program chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder={(lang === 'th' ? 'ค้นหาชื่อ' : 'Search name') + '…'} value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setFilterProg(null)} style={chipStyle(filterProg === null, 'var(--accent)')}>{lang === 'th' ? 'ทั้งหมด' : 'All'}</button>
          {programs.map((p) => (
            <button key={p.id} onClick={() => setFilterProg(p.id)} style={chipStyle(filterProg === p.id, p.color)}>{p.name}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner" /></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 880 }}>
              <thead>
                <tr>
                  <th>CREATOR</th>
                  <th>{t('program')}</th>
                  <th style={{ textAlign: 'right' }}>{t('followers')}</th>
                  <th style={{ textAlign: 'right' }}>{t('views')}</th>
                  <th style={{ textAlign: 'right' }}>{t('engagement')}</th>
                  <th>{lang === 'th' ? 'อัปเดตล่าสุด' : 'Last Update'}</th>
                  <th style={{ textAlign: 'right' }}>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/creators/${c.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div className="avatar" style={{ background: c.avatar_color, width: 34, height: 34, borderRadius: 9, fontSize: 14 }}>{initials(c.name)}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                            {platformsOf(c).map((p) => (
                              <span key={p.name} className="platform-icon" style={{ background: platformColor(p.name), width: 15, height: 15, fontSize: 8 }}>{platformInitial(p.name)}</span>
                            ))}
                            <span style={{ fontSize: 11, color: 'var(--text2)', marginLeft: 3 }}>@{c.tiktok_handle || c.youtube_handle || ''}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: (c.program_color || 'var(--accent)') + '22', color: c.program_color || 'var(--accent)' }}>{c.program_name}</span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="num">{fmt(c.followers)}</td>
                    <td style={{ textAlign: 'right' }} className="num">{fmt(c.total_views)}</td>
                    <td style={{ textAlign: 'right' }} className="num">{fmt(c.total_engagement)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{lastUpdate(c) ? relDate(lastUpdate(c)) : '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: isActive(c) ? 'var(--green)' : 'var(--text2)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive(c) ? 'var(--green)' : 'var(--text2)' }} />
                        {isActive(c) ? (lang === 'th' ? 'ใช้งาน' : 'Active') : (lang === 'th' ? 'รอ' : 'Idle')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <CreatorModal programs={programs} t={t} lang={lang}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load(); }} />
      )}
    </div>
  );
}

function chipStyle(active: boolean, color: string): React.CSSProperties {
  return {
    padding: '6px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
    background: active ? color : 'var(--surface2)', color: active ? '#fff' : 'var(--text2)',
    border: '1px solid ' + (active ? color : 'var(--border)'),
  };
}

function CreatorModal({ programs, t, lang, onClose, onSave }: any) {
  const [form, setForm] = useState<any>({
    name: '', type: 'Long', program_id: programs[0]?.id || '',
    avatar_color: '#5b5bd6',
    youtube_handle: '', facebook_handle: '', tiktok_handle: '', instagram_handle: '',
  });

  const save = async () => {
    if (!form.name) return;
    await api.creators.create(form);
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>{t('add')} {t('creators')}</div>
        <div className="form-group">
          <label>{t('name')}</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>{t('type')}</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option>Long</option><option>Short</option><option>Streamer</option>
            </select>
          </div>
          <div className="form-group">
            <label>{t('program')}</label>
            <select value={form.program_id} onChange={(e) => setForm({ ...form, program_id: e.target.value })}>
              {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group"><label>YouTube</label><input value={form.youtube_handle} onChange={(e) => setForm({ ...form, youtube_handle: e.target.value })} placeholder="@handle" /></div>
          <div className="form-group"><label>TikTok</label><input value={form.tiktok_handle} onChange={(e) => setForm({ ...form, tiktok_handle: e.target.value })} placeholder="@handle" /></div>
          <div className="form-group"><label>Facebook</label><input value={form.facebook_handle} onChange={(e) => setForm({ ...form, facebook_handle: e.target.value })} placeholder="@handle" /></div>
          <div className="form-group"><label>Instagram</label><input value={form.instagram_handle} onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })} placeholder="@handle" /></div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={save}>{t('save')}</button>
        </div>
      </div>
    </div>
  );
}
