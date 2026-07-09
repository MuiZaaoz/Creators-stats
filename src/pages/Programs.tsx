import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import { fmt, initials, platformColor, platformInitial, relDate, typeColor } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import LinkPreview, { PreviewLink } from '../components/LinkPreview';

export default function Programs() {
  const { lang } = useAppStore();
  const t = useT(lang);
  const [programs, setPrograms] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState<any>(null);
  const [preview, setPreview] = useState<PreviewLink | null>(null);

  const load = async () => {
    const [progs, gs] = await Promise.all([api.programs.list(), api.games.list()]);
    setPrograms(progs);
    setGames(gs);
    const first = progs[0];
    if (first) selectProgram(first, progs);
  };

  const selectProgram = async (prog: any, progs?: any[]) => {
    const list = progs || programs;
    const p = list.find((x: any) => x.id === prog.id) || prog;
    setSelected(p);
    const [st, td] = await Promise.all([api.programs.stats(p.id), api.programs.table(p.id)]);
    setStats(st);
    setTableData(td);
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: '20px 28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title={t('programs')}
        actions={
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ {t('add')}</button>
        }
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {programs.map(p => (
          <button key={p.id}
            onClick={() => selectProgram(p)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: selected?.id === p.id ? p.color : 'var(--surface2)',
              color: selected?.id === p.id ? '#fff' : 'var(--text2)',
              border: '1px solid ' + (selected?.id === p.id ? p.color : 'var(--border)'),
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: selected?.id === p.id ? '#ffffff88' : p.color,
            }} />
            {p.name}
            <span style={{ fontSize: 11, opacity: 0.7 }}>({p.creator_count})</span>
          </button>
        ))}
      </div>

      {selected && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: selected.color }}>{selected.name}</h2>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{selected.game_name || '-'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setEditModal(selected)}>{t('edit')}</button>
              <button className="btn btn-danger" onClick={async () => {
                if (!confirm('ลบโปรแกรมนี้?')) return;
                await api.programs.delete(selected.id);
                load();
              }}>{t('delete')}</button>
            </div>
          </div>

          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              <StatCard label={t('views')} value={stats.total_views} color={selected.color} />
              <StatCard label={t('engagement')} value={stats.total_engagement} />
              <StatCard label={t('episodes')} value={stats.total_episodes} />
              <StatCard label={t('creators')} value={stats.creators} />
            </div>
          )}

          {/* Creator Table */}
          <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: 800 }}>
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                    <th>{t('type')}</th>
                    <th style={{ textAlign: 'right' }}>{t('views')}</th>
                    <th style={{ textAlign: 'right' }}>{t('engagement')}</th>
                    <th style={{ textAlign: 'right' }}>{t('episodes')}</th>
                    <th>{lang === 'th' ? 'คอนเทนต์ล่าสุด' : 'Latest Content'}</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((c: any) => (
                    <React.Fragment key={c.id}>
                      <tr style={{ background: 'var(--surface2)' }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="avatar" style={{ background: c.avatar_color }}>{initials(c.name)}</div>
                            <span style={{ fontWeight: 600 }}>{c.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{ background: typeColor(c.type) + '22', color: typeColor(c.type) }}>{c.type}</span>
                        </td>
                        <td style={{ textAlign: 'right' }} className="num">{fmt(c.total_views)}</td>
                        <td style={{ textAlign: 'right' }} className="num">{fmt(c.total_engagement)}</td>
                        <td style={{ textAlign: 'right' }} className="num">{c.clip_count}</td>
                        <td>
                          {c.episodes?.[0] && (
                            <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                              {c.episodes[0].title} · {relDate(c.episodes[0].published_at)}
                            </span>
                          )}
                        </td>
                      </tr>
                      {c.episodes?.map((ep: any) => (
                        <tr key={ep.id}>
                          <td colSpan={2} style={{ paddingLeft: 52 }}>
                            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                              <span className="badge" style={{ background: typeColor(ep.type) + '22', color: typeColor(ep.type), marginRight: 6 }}>{ep.type}</span>
                              {ep.title} · {relDate(ep.published_at)}
                            </div>
                          </td>
                          <td colSpan={4}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {ep.links?.map((lnk: any) => (
                                <div key={lnk.id} className="link-chip"
                                  title={lnk.url || undefined}
                                  onClick={() => setPreview({ platform: lnk.platform, url: lnk.url, title: ep.title, creator_name: c.name, views: lnk.views, engagement: lnk.engagement })}>
                                  <span className="platform-icon" style={{ background: platformColor(lnk.platform), width: 16, height: 16, fontSize: 8 }}>
                                    {platformInitial(lnk.platform)}
                                  </span>
                                  <span className="num" style={{ fontSize: 12, fontWeight: 600 }}>{fmt(lnk.views)}</span>
                                  {lnk.url && <span style={{ fontSize: 10, color: 'var(--accent)' }}>🔗</span>}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <ProgramModal games={games} t={t} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />
      )}
      {editModal && (
        <ProgramModal games={games} t={t} program={editModal}
          onClose={() => setEditModal(null)}
          onSave={() => { setEditModal(null); load(); }} />
      )}
      {preview && <LinkPreview link={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function ProgramModal({ games, t, program, onClose, onSave }: any) {
  const [form, setForm] = useState(program ? { ...program } : {
    name: '', game_id: games[0]?.id || '', color: '#5b5bd6',
    types: ['Long', 'Short'],
  });

  const toggleType = (type: string) => {
    const types = form.types || [];
    setForm({ ...form, types: types.includes(type) ? types.filter((x: string) => x !== type) : [...types, type] });
  };

  const save = async () => {
    if (!form.name) return;
    if (program) await api.programs.update(program.id, form);
    else await api.programs.create(form);
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>
          {program ? t('edit') : t('add')} {t('program')}
        </div>
        <div className="form-group">
          <label>{t('name')}</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>{t('game')}</label>
            <select value={form.game_id} onChange={e => setForm({ ...form, game_id: e.target.value })}>
              {games.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>สี / Color</label>
            <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>{t('type')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Long', 'Short', 'Streamer'].map(tp => (
              <button key={tp}
                onClick={() => toggleType(tp)}
                style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: (form.types || []).includes(tp) ? typeColor(tp) : 'var(--surface2)',
                  color: (form.types || []).includes(tp) ? '#fff' : 'var(--text2)',
                  border: '1px solid var(--border)',
                }}>{tp}</button>
            ))}
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
