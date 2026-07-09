import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import { fmt, initials, platformColor, platformInitial, relDate, typeColor } from '../lib/utils';
import LinkPreview, { PreviewLink } from '../components/LinkPreview';

export default function CreatorDetail() {
  const { id } = useParams();
  const { lang } = useAppStore();
  const t = useT(lang);
  const navigate = useNavigate();
  const [creator, setCreator] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<PreviewLink | null>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    api.creators.get(Number(id)).then(c => {
      setCreator(c);
      setForm({
        name: c.name, type: c.type, program_id: c.program_id, avatar_color: c.avatar_color,
        youtube_handle: c.youtube_handle, facebook_handle: c.facebook_handle,
        tiktok_handle: c.tiktok_handle, instagram_handle: c.instagram_handle,
        yt_followers: c.yt_followers, fb_followers: c.fb_followers,
        tt_followers: c.tt_followers, ig_followers: c.ig_followers,
      });
    });
  }, [id]);

  const save = async () => {
    await api.creators.update(Number(id), form);
    setCreator({ ...creator, ...form });
    setEditing(false);
  };

  const del = async () => {
    if (!confirm('ลบครีเอเตอร์นี้?')) return;
    await api.creators.delete(Number(id));
    navigate('/creators');
  };

  if (!creator) return <div style={{ padding: 40, color: 'var(--text2)' }}>{t('loading')}</div>;

  const totalViews = creator.episodes?.reduce((s: number, e: any) =>
    s + (e.links || []).reduce((ls: number, l: any) => ls + (l.views || 0), 0), 0) || 0;
  const totalEng = creator.episodes?.reduce((s: number, e: any) =>
    s + (e.links || []).reduce((ls: number, l: any) => ls + (l.engagement || 0), 0), 0) || 0;

  return (
    <div style={{ padding: '20px 28px', flex: 1 }}>
      {/* Back */}
      <button className="btn btn-ghost" onClick={() => navigate('/creators')} style={{ marginBottom: 16 }}>
        ← {t('creators')}
      </button>

      {/* Header */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 20 }}>
        <div className="avatar" style={{ background: creator.avatar_color, width: 64, height: 64, fontSize: 24, flexShrink: 0 }}>
          {initials(creator.name)}
        </div>
        <div style={{ flex: 1 }}>
          {editing ? (
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, width: '100%' }} />
          ) : (
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{creator.name}</h1>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span className="badge" style={{ background: typeColor(creator.type) + '22', color: typeColor(creator.type) }}>{creator.type}</span>
            {creator.program_name && (
              <span className="badge" style={{ background: (creator.program_color || '#5b5bd6') + '22', color: creator.program_color || '#5b5bd6' }}>
                {creator.program_name}
              </span>
            )}
            {creator.game_name && (
              <span className="badge" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>{creator.game_name}</span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { p: 'YouTube', f: creator.yt_followers, h: creator.youtube_handle, key: 'yt_followers' },
              { p: 'TikTok', f: creator.tt_followers, h: creator.tiktok_handle, key: 'tt_followers' },
              { p: 'Facebook', f: creator.fb_followers, h: creator.facebook_handle, key: 'fb_followers' },
              { p: 'Instagram', f: creator.ig_followers, h: creator.instagram_handle, key: 'ig_followers' },
            ].map(pl => (
              <div key={pl.p} style={{
                background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="platform-icon" style={{ background: platformColor(pl.p), width: 18, height: 18, fontSize: 9 }}>
                    {platformInitial(pl.p)}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>{pl.h ? '@' + pl.h : '-'}</span>
                </div>
                {editing ? (
                  <input value={form[pl.key] || 0} type="number"
                    onChange={e => setForm({ ...form, [pl.key]: Number(e.target.value) })}
                    style={{ fontSize: 16, fontWeight: 700, padding: '2px 4px' }} />
                ) : (
                  <span className="num" style={{ fontSize: 16, fontWeight: 700 }}>{fmt(pl.f)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {editing ? (
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={save}>{t('save')}</button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>{t('edit')}</button>
              <button className="btn btn-danger" onClick={del}>{t('delete')}</button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">{t('views')}</div>
          <div className="stat-value num">{fmt(totalViews)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('engagement')}</div>
          <div className="stat-value num">{fmt(totalEng)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('episodes')}</div>
          <div className="stat-value num">{creator.episodes?.length || 0}</div>
        </div>
      </div>

      {/* Episodes */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>
          {t('episodes')}
        </div>
        <div>
          {creator.episodes?.map((ep: any) => (
            <div key={ep.id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span className="badge" style={{ background: typeColor(ep.type) + '22', color: typeColor(ep.type) }}>{ep.type}</span>
                <span style={{ fontWeight: 600 }}>{ep.title}</span>
                <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 'auto' }}>{relDate(ep.published_at)}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ep.links?.map((lnk: any) => (
                  <div key={lnk.id}
                    onClick={() => setPreview({ platform: lnk.platform, url: lnk.url, title: ep.title, creator_name: creator.name, views: lnk.views, engagement: lnk.engagement, uv: lnk.uv, video_views: lnk.video_views })}
                    style={{
                      background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px',
                      display: 'flex', alignItems: 'center', gap: 10, minWidth: 200,
                      cursor: 'pointer', border: '1px solid transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                    <span className="platform-icon" style={{ background: platformColor(lnk.platform), width: 22, height: 22, fontSize: 10 }}>
                      {platformInitial(lnk.platform)}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="num" style={{ fontWeight: 700 }}>{fmt(lnk.views)}
                        {lnk.uv > 0 && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)' }}> · UV {fmt(lnk.uv)}</span>}
                      </div>
                      {lnk.url ? (
                        <div style={{ fontSize: 11, color: 'var(--accent)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          🔗 {lnk.url.replace(/^https?:\/\/(www\.)?/, '')}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                          {lnk.video_views > 0 ? `Video Views ${fmt(lnk.video_views)}` : '-'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {preview && <LinkPreview link={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
