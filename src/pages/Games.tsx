import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import { fmt, platformColor, platformInitial, relDate, initials } from '../lib/utils';
import PageHeader from '../components/PageHeader';

export default function Games() {
  const { lang } = useAppStore();
  const t = useT(lang);
  const [games, setGames] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editGame, setEditGame] = useState<any>(null);

  const load = async () => {
    const g = await api.games.list();
    setGames(g);
    if (g.length > 0 && !selected) {
      selectGame(g[0]);
    }
  };

  const selectGame = async (game: any) => {
    setSelected(game);
    const c = await api.games.contents(game.id);
    setContents(c);
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: '20px 28px', flex: 1 }}>
      <PageHeader
        title={t('games')}
        actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ {t('add')}</button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        {/* Game list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'start' }}>
          {games.map((g: any) => (
            <div key={g.id}
              onClick={() => selectGame(g)}
              style={{
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                background: selected?.id === g.id ? 'var(--accent)22' : 'transparent',
                borderLeft: selected?.id === g.id ? '3px solid var(--accent)' : '3px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{g.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{g.program_count} {lang === 'th' ? 'โปรแกรม' : 'programs'}</div>
              </div>
              <button className="btn btn-ghost" onClick={e => { e.stopPropagation(); setEditGame(g); }}
                style={{ fontSize: 11, padding: '3px 8px' }}>{t('edit')}</button>
            </div>
          ))}
        </div>

        {/* Content for selected game */}
        {selected && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{selected.name}</h2>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                {selected.program_count} {lang === 'th' ? 'โปรแกรม' : 'programs'} · {contents.length} {lang === 'th' ? 'คอนเทนต์' : 'content links'}
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>{lang === 'th' ? 'ครีเอเตอร์' : 'Creator'}</th>
                    <th>{lang === 'th' ? 'คอนเทนต์' : 'Content'}</th>
                    <th>{t('platform')}</th>
                    <th style={{ textAlign: 'right' }}>{t('views')}</th>
                    <th style={{ textAlign: 'right' }}>{t('engagement')}</th>
                    <th>{lang === 'th' ? 'วันที่' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  {contents.map((c: any) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ background: c.avatar_color, width: 28, height: 28, fontSize: 11 }}>
                            {initials(c.creator_name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{c.creator_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text2)' }}>{c.program_name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>{c.title}</td>
                      <td>
                        <span className="platform-icon" style={{ background: platformColor(c.platform) }}>
                          {platformInitial(c.platform)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} className="num">{fmt(c.views)}</td>
                      <td style={{ textAlign: 'right' }} className="num">{fmt(c.engagement)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text2)' }}>{relDate(c.published_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contents.length === 0 && (
                <div className="empty-state">{t('noData')}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {(showModal || editGame) && (
        <GameModal
          game={editGame}
          t={t}
          lang={lang}
          onClose={() => { setShowModal(false); setEditGame(null); }}
          onSave={async () => { setShowModal(false); setEditGame(null); load(); }}
          onDelete={editGame ? async () => {
            await api.games.delete(editGame.id);
            setEditGame(null);
            setSelected(null);
            load();
          } : undefined}
        />
      )}
    </div>
  );
}

function GameModal({ game, t, lang, onClose, onSave, onDelete }: any) {
  const [name, setName] = useState(game?.name || '');

  const save = async () => {
    if (!name) return;
    if (game) await api.games.update(game.id, { name });
    else await api.games.create({ name });
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>
          {game ? t('edit') : t('add')} {t('game')}
        </div>
        <div className="form-group">
          <label>{t('name')}</label>
          <input value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 8 }}>
          <div>
            {onDelete && (
              <button className="btn btn-danger" onClick={async () => {
                if (confirm(lang === 'th' ? 'ลบเกมนี้?' : 'Delete this game?')) onDelete();
              }}>{t('delete')}</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>{t('cancel')}</button>
            <button className="btn btn-primary" onClick={save}>{t('save')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
