import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import { fmt, initials, platformColor, typeColor } from '../lib/utils';

export default function Creators() {
  const { lang } = useAppStore();
  const t2 = (th: string, en: string) => (lang === 'th' ? th : en);
  const navigate = useNavigate();

  const [rows, setRows] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [filterProg, setFilterProg] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([api.analytics.byCreator(), api.creators.list(), api.programs.list()]).then(([bc, cs, ps]) => {
      setRows(bc);
      setCreators(cs);
      setPrograms(ps);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const handleOf = (id: number) => creators.find(c => c.id === id) || {};

  const filtered = rows.filter((r: any) => {
    if (filterProg) {
      const prog = programs.find(p => p.id === filterProg);
      if (!prog || r.program_name !== prog.name) return false;
    }
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: '20px 24px', flex: 1 }}>
      {/* Filters row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder={t2('ค้นหาชื่อ...', 'Search name...')}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: 220, borderRadius: 9 }}
        />
        <button onClick={() => setFilterProg(null)} style={{
          padding: '7px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 600,
          background: filterProg === null ? 'var(--accent-tint)' : '#fff',
          color: filterProg === null ? '#4646c6' : '#52525b',
          border: '1px solid ' + (filterProg === null ? 'var(--accent)' : 'var(--border)'),
        }}>{t2('ทั้งหมด', 'All')}</button>
        {programs.map(p => (
          <button key={p.id} onClick={() => setFilterProg(p.id)} style={{
            padding: '7px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 600,
            background: filterProg === p.id ? 'var(--accent-tint)' : '#fff',
            color: filterProg === p.id ? '#4646c6' : '#52525b',
            border: '1px solid ' + (filterProg === p.id ? 'var(--accent)' : 'var(--border)'),
          }}>{p.name}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ {t2('เพิ่มครีเอเตอร์', 'Add Creator')}</button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: 820 }}>
            <thead>
              <tr>
                <th>CREATOR</th>
                <th>PROGRAM</th>
                <th>{t2('ประเภท', 'TYPE')}</th>
                <th style={{ textAlign: 'right' }}>VIEWS</th>
                <th style={{ textAlign: 'right' }}>ENGAGEMENT</th>
                <th style={{ textAlign: 'right' }}>CONTENTS</th>
                <th style={{ textAlign: 'right' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="spinner" /></div></td></tr>
              ) : filtered.map((r: any) => {
                const c = handleOf(r.id);
                const active = (r.total_views || 0) > 0;
                return (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/creators/${r.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: r.avatar_color, width: 34, height: 34 }}>{initials(r.name)}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            {['Facebook', 'YouTube', 'TikTok', 'Instagram'].map(pl => (
                              <span key={pl} className="platform-icon" style={{ background: platformColor(pl), width: 14, height: 14, fontSize: 7, borderRadius: 3 }}>{pl[0]}</span>
                            ))}
                            {c.tiktok_handle && <span style={{ fontSize: 11, color: 'var(--text2)', marginLeft: 3 }}>@{c.tiktok_handle}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{r.program_name}</td>
                    <td>
                      <span className="badge" style={{ background: typeColor(r.type) + '18', color: typeColor(r.type) }}>{r.type}</span>
                    </td>
                    <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(r.total_views)}</td>
                    <td className="num" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>{fmt(r.total_engagement)}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{fmt(r.episode_count)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: active ? '#16a34a' : '#9a9aa2' }}>
                        ● {active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f0f2', fontSize: 12, color: 'var(--text2)' }}>
          {t2('แสดง', 'Showing')} <b>{filtered.length}</b> {t2('ครีเอเตอร์', 'creators')}
        </div>
      </div>

      {showModal && (
        <CreatorModal programs={programs} t2={t2}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load(); }} />
      )}
    </div>
  );
}

function CreatorModal({ programs, t2, onClose, onSave }: any) {
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
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>{t2('เพิ่มครีเอเตอร์', 'Add Creator')}</div>
        <div className="form-group">
          <label>{t2('ชื่อ', 'Name')}</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>{t2('ประเภท', 'Type')}</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option>Long</option><option>Short</option><option>Streamer</option>
            </select>
          </div>
          <div className="form-group">
            <label>{t2('โปรแกรม', 'Program')}</label>
            <select value={form.program_id} onChange={e => setForm({ ...form, program_id: e.target.value })}>
              {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>TikTok Handle</label>
            <input value={form.tiktok_handle} onChange={e => setForm({ ...form, tiktok_handle: e.target.value })} placeholder="@handle" />
          </div>
          <div className="form-group">
            <label>YouTube Handle</label>
            <input value={form.youtube_handle} onChange={e => setForm({ ...form, youtube_handle: e.target.value })} placeholder="@handle" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>{t2('ยกเลิก', 'Cancel')}</button>
          <button className="btn btn-primary" onClick={save}>{t2('บันทึก', 'Save')}</button>
        </div>
      </div>
    </div>
  );
}
