import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';
import { fmt, initials, platformColor, platformInitial, typeColor } from '../lib/utils';
import LinkPreview, { PreviewLink } from '../components/LinkPreview';

export default function Programs() {
  const { lang } = useAppStore();
  const t2 = (th: string, en: string) => (lang === 'th' ? th : en);

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
    if (progs[0]) selectProgram(progs[0]);
  };

  const selectProgram = async (p: any) => {
    setSelected(p);
    const [st, td] = await Promise.all([api.programs.stats(p.id), api.programs.table(p.id)]);
    setStats(st);
    setTableData(td);
  };

  useEffect(() => { load(); }, []);

  const shortUrl = (u: string) => u.replace(/^https?:\/\/(www\.|vt\.)?/, '').slice(0, 22) + '…';

  return (
    <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Program selector row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{t2('โปรแกรม', 'Program')}</span>
        <select
          value={selected?.id || ''}
          onChange={e => { const p = programs.find(x => String(x.id) === e.target.value); if (p) selectProgram(p); }}
          style={{ minWidth: 220, fontWeight: 600, fontSize: 13.5, padding: '9px 14px', borderRadius: 10 }}>
          {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {selected && <span style={{ width: 9, height: 9, borderRadius: '50%', background: selected.color }} />}
        {selected?.game_name && (
          <span className="badge" style={{ background: 'var(--accent-tint)', color: '#4646c6', padding: '5px 12px' }}>
            {selected.game_name}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {stats && (
          <div className="num" style={{ display: 'flex', gap: 18, fontSize: 12.5, color: 'var(--text2)', flexWrap: 'wrap' }}>
            <span>Creators <b style={{ color: 'var(--text)' }}>{stats.creators}</b></span>
            <span>Views <b style={{ color: 'var(--text)' }}>{fmt(stats.total_views)}</b></span>
            <span>Engagement <b style={{ color: 'var(--text)' }}>{fmt(stats.total_engagement)}</b></span>
            <span>Contents <b style={{ color: 'var(--text)' }}>{fmt(stats.total_episodes)}</b></span>
          </div>
        )}
        <button className="btn btn-secondary" onClick={() => setEditModal(selected)}>{t2('แก้ไข', 'Edit')}</button>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ {t2('สร้างโปรแกรม', 'New')}</button>
      </div>

      {/* Stat cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            ['Creators', stats.creators],
            ['Total Views', stats.total_views],
            ['Total Engagement', stats.total_engagement],
            ['Total Contents', stats.total_episodes],
          ].map(([label, val]) => (
            <div key={label as string} className="card" style={{ padding: '13px 18px' }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>{label}</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>{fmt(val as number)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Calc table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{t2('ตารางคำนวณโปรแกรม', 'Program Calculation Table')}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            CONTENTS · {t2('รวมทุกแพลตฟอร์มเป็น 1 คอนเทนต์ — เลื่อนขวา →', 'All platforms count as 1 content — scroll right →')}
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: '#fbfbfc' }}>
          <div style={{ width: 220, flexShrink: 0, padding: '9px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Creator</div>
          <div style={{ width: 110, flexShrink: 0, padding: '9px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', textAlign: 'right' }}>Total Views</div>
          <div style={{ width: 110, flexShrink: 0, padding: '9px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', textAlign: 'right', borderRight: '1px solid var(--border)' }}>Engagement</div>
          <div style={{ flex: 1, padding: '9px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase' }}>Contents</div>
        </div>

        {/* Creator rows */}
        {tableData.map((c: any) => {
          const totalViews = c.episodes?.reduce((s: number, ep: any) => s + ep.links.reduce((x: number, l: any) => x + (l.views || 0), 0), 0) || 0;
          const totalEng = c.episodes?.reduce((s: number, ep: any) => s + ep.links.reduce((x: number, l: any) => x + (l.engagement || 0), 0), 0) || 0;
          return (
            <div key={c.id} style={{ display: 'flex', borderBottom: '1px solid #f0f0f2' }}>
              {/* Left fixed columns */}
              <div style={{ width: 220, flexShrink: 0, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="avatar" style={{ background: c.avatar_color, width: 34, height: 34 }}>{initials(c.name)}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <span className="badge" style={{ background: typeColor(c.type) + '18', color: typeColor(c.type), fontSize: 10.5 }}>{c.type}</span>
                </div>
              </div>
              <div className="num" style={{ width: 110, flexShrink: 0, padding: '14px 10px', textAlign: 'right', fontWeight: 700, fontSize: 13.5, alignSelf: 'center' }}>{fmt(totalViews)}</div>
              <div className="num" style={{ width: 110, flexShrink: 0, padding: '14px 10px', textAlign: 'right', fontWeight: 700, fontSize: 13.5, color: 'var(--accent)', alignSelf: 'center', borderRight: '1px solid var(--border)' }}>{fmt(totalEng)}</div>

              {/* Scrollable content cards */}
              <div style={{ flex: 1, overflowX: 'auto', display: 'flex', gap: 10, padding: '12px 16px' }}>
                {(c.episodes || []).map((ep: any, ei: number) => {
                  const epViews = ep.links.reduce((s: number, l: any) => s + (l.views || 0), 0);
                  const epEng = ep.links.reduce((s: number, l: any) => s + (l.engagement || 0), 0);
                  return (
                    <div key={ep.id} style={{
                      width: 300, flexShrink: 0, border: '1px solid var(--border)',
                      borderRadius: 10, overflow: 'hidden', background: '#fff',
                    }}>
                      <div style={{ padding: '8px 12px', background: '#fbfbfc', borderBottom: '1px solid #f0f0f2', display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span className="badge" style={{ background: 'var(--accent-tint)', color: '#4646c6', fontSize: 10.5 }}>Content #{ei + 1}</span>
                        <span className="badge" style={{ background: typeColor(ep.type) + '18', color: typeColor(ep.type), fontSize: 10.5 }}>{ep.type}</span>
                      </div>
                      <div style={{ padding: '6px 12px' }}>
                        {ep.links.map((lnk: any) => (
                          <div key={lnk.id}
                            onClick={() => setPreview({ platform: lnk.platform, url: lnk.url, title: ep.title, creator_name: c.name, views: lnk.views, engagement: lnk.engagement })}
                            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0', cursor: lnk.url ? 'pointer' : 'default', fontSize: 12 }}>
                            <span className="platform-icon" style={{ background: platformColor(lnk.platform), width: 17, height: 17, fontSize: 8 }}>{platformInitial(lnk.platform)}</span>
                            <span style={{ flex: 1, color: lnk.url ? 'var(--accent)' : 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {lnk.url ? shortUrl(lnk.url) : t2('(ไม่มีลิงก์)', '(no link)')}
                            </span>
                            <span className="num" style={{ fontWeight: 600, minWidth: 58, textAlign: 'right' }}>{fmt(lnk.views)}</span>
                            <span className="num" style={{ color: 'var(--accent)', minWidth: 46, textAlign: 'right', fontSize: 11.5 }}>{fmt(lnk.engagement)}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '7px 12px', background: 'var(--accent-tint)', fontSize: 12 }}>
                        <span style={{ fontWeight: 700, color: '#4646c6', flex: 1, letterSpacing: '.04em' }}>TOTAL</span>
                        <span className="num" style={{ fontWeight: 700, minWidth: 58, textAlign: 'right' }}>{fmt(epViews)}</span>
                        <span className="num" style={{ fontWeight: 700, color: '#4646c6', minWidth: 46, textAlign: 'right', fontSize: 11.5 }}>{fmt(epEng)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {(showModal || editModal) && (
        <ProgramModal games={games} t2={t2} program={editModal}
          onClose={() => { setShowModal(false); setEditModal(null); }}
          onSave={() => { setShowModal(false); setEditModal(null); load(); }}
          onDelete={editModal ? async () => {
            if (!confirm(t2('ลบโปรแกรมนี้?', 'Delete this program?'))) return;
            await api.programs.delete(editModal.id);
            setEditModal(null); setSelected(null); load();
          } : undefined} />
      )}
      {preview && <LinkPreview link={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function ProgramModal({ games, t2, program, onClose, onSave, onDelete }: any) {
  const [form, setForm] = useState(program ? { ...form0(program) } : form0());
  function form0(p?: any) {
    return {
      name: p?.name || '',
      game_id: p?.game_id || games[0]?.id || null,
      color: p?.color || '#5b5bd6',
      types: p ? (typeof p.types === 'string' ? JSON.parse(p.types) : p.types) : ['Long', 'Short'],
    };
  }
  const toggleType = (tp: string) => {
    const ts = form.types || [];
    setForm({ ...form, types: ts.includes(tp) ? ts.filter((x: string) => x !== tp) : [...ts, tp] });
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
          {program ? t2('แก้ไขโปรแกรม', 'Edit Program') : t2('สร้างโปรแกรม', 'New Program')}
        </div>
        <div className="form-group">
          <label>{t2('ชื่อ', 'Name')}</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>{t2('เกม', 'Game')}</label>
            <select value={form.game_id || ''} onChange={e => setForm({ ...form, game_id: e.target.value || null })}>
              <option value="">-</option>
              {games.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>สี / Color</label>
            <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>{t2('ประเภท', 'Types')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Long', 'Short', 'Streamer'].map(tp => (
              <button key={tp} onClick={() => toggleType(tp)} style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                background: (form.types || []).includes(tp) ? typeColor(tp) : '#fff',
                color: (form.types || []).includes(tp) ? '#fff' : 'var(--text2)',
                border: '1px solid var(--border)',
              }}>{tp}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <div>{onDelete && <button className="btn btn-danger" onClick={onDelete}>{t2('ลบ', 'Delete')}</button>}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>{t2('ยกเลิก', 'Cancel')}</button>
            <button className="btn btn-primary" onClick={save}>{t2('บันทึก', 'Save')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
