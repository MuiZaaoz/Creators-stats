import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import { fmt, initials, platformColor, platformInitial, typeColor } from '../lib/utils';
import PageHeader from '../components/PageHeader';

export default function Creators() {
  const { lang } = useAppStore();
  const t = useT(lang);
  const navigate = useNavigate();
  const [creators, setCreators] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [filterProg, setFilterProg] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([api.creators.list(), api.programs.list()]).then(([c, p]) => {
      setCreators(c);
      setPrograms(p);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const filtered = creators.filter(c => {
    if (filterProg && String(c.program_id) !== filterProg) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: '20px 28px', flex: 1 }}>
      <PageHeader
        title={t('creators')}
        subtitle={`${creators.length} ${lang === 'th' ? 'ครีเอเตอร์' : 'creators'}`}
        actions={
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ {t('add')}</button>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <input
          placeholder={t('search') + '...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 220 }}
        />
        <select value={filterProg} onChange={e => setFilterProg(e.target.value)} style={{ width: 180 }}>
          <option value="">{lang === 'th' ? 'ทุกโปรแกรม' : 'All Programs'}</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(c => (
            <CreatorCard key={c.id} creator={c} t={t} lang={lang} onRefresh={load}
              onClick={() => navigate(`/creators/${c.id}`)} />
          ))}
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

function CreatorCard({ creator: c, t, lang, onRefresh, onClick }: any) {
  const platforms = [
    { key: 'yt', name: 'YouTube', f: c.yt_followers },
    { key: 'tt', name: 'TikTok', f: c.tt_followers },
    { key: 'fb', name: 'Facebook', f: c.fb_followers },
    { key: 'ig', name: 'Instagram', f: c.ig_followers },
  ].filter(p => p.f > 0);

  return (
    <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
      onClick={onClick}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div className="avatar" style={{ background: c.avatar_color, width: 44, height: 44, fontSize: 16 }}>
          {initials(c.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{c.name}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="badge" style={{ background: typeColor(c.type) + '22', color: typeColor(c.type) }}>{c.type}</span>
            {c.program_name && (
              <span className="badge" style={{ background: (c.program_color || 'var(--accent)') + '22', color: c.program_color || 'var(--accent)' }}>
                {c.program_name}
              </span>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {platforms.map(p => (
          <div key={p.key} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--surface2)', borderRadius: 6, padding: '6px 8px',
          }}>
            <span className="platform-icon" style={{ background: platformColor(p.name), width: 18, height: 18, fontSize: 9 }}>
              {platformInitial(p.name)}
            </span>
            <span className="num" style={{ fontSize: 12, fontWeight: 600 }}>{fmt(p.f)}</span>
          </div>
        ))}
      </div>
    </div>
  );
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
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>
          {t('add')} {t('creators')}
        </div>
        <div className="form-group">
          <label>{t('name')}</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>{t('type')}</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option>Long</option>
              <option>Short</option>
              <option>Streamer</option>
            </select>
          </div>
          <div className="form-group">
            <label>{t('program')}</label>
            <select value={form.program_id} onChange={e => setForm({ ...form, program_id: e.target.value })}>
              {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>YouTube Handle</label>
            <input value={form.youtube_handle} onChange={e => setForm({ ...form, youtube_handle: e.target.value })} placeholder="@handle" />
          </div>
          <div className="form-group">
            <label>TikTok Handle</label>
            <input value={form.tiktok_handle} onChange={e => setForm({ ...form, tiktok_handle: e.target.value })} placeholder="@handle" />
          </div>
          <div className="form-group">
            <label>Facebook Handle</label>
            <input value={form.facebook_handle} onChange={e => setForm({ ...form, facebook_handle: e.target.value })} placeholder="@handle" />
          </div>
          <div className="form-group">
            <label>Instagram Handle</label>
            <input value={form.instagram_handle} onChange={e => setForm({ ...form, instagram_handle: e.target.value })} placeholder="@handle" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={save}>{t('save')}</button>
        </div>
      </div>
    </div>
  );
}
