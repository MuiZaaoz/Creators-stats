import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { fmt, initials, platformColor, platformInitial } from '../lib/utils';

// Extract a YouTube embed URL from common youtube/youtu.be link shapes.
function youtubeEmbed(url: string): string | null {
  if (!url) return null;
  const u = url.replace(/^https?:\/\//, '');
  const m = u.match(/youtu\.be\/([A-Za-z0-9_-]+)/) || u.match(/youtube\.com\/(?:watch\?v=|embed\/)([A-Za-z0-9_-]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  return null;
}

export default function PreviewModal() {
  const { preview, closePreview, lang } = useAppStore();
  const t = useT(lang);
  const [copied, setCopied] = useState(false);
  if (!preview) return null;

  const fullUrl = preview.url?.startsWith('http') ? preview.url : 'https://' + (preview.url || '');
  const embed = youtubeEmbed(preview.url || '');

  const copy = () => {
    navigator.clipboard?.writeText(fullUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  return (
    <div className="modal-overlay" onClick={closePreview}>
      <div className="modal" style={{ maxWidth: 620, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Video / thumbnail area */}
        <div style={{ position: 'relative', background: '#0c0c12', aspectRatio: '16 / 9' }}>
          {embed ? (
            <iframe src={embed} title={preview.title} allowFullScreen
              style={{ width: '100%', height: '100%', border: 0 }} />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12, color: '#fff',
              background: `linear-gradient(135deg, ${platformColor(preview.platform)}cc, #1c1c24)`,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
              </div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{lang === 'th' ? 'ตัวอย่างวิดีโอ' : 'Video preview'} · {preview.platform}</div>
            </div>
          )}
          <button onClick={closePreview} style={{
            position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Info */}
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div className="avatar" style={{ background: preview.avatar_color || 'var(--accent)', width: 40, height: 40 }}>{initials(preview.creator)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{preview.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span className="platform-icon" style={{ background: platformColor(preview.platform), width: 18, height: 18, fontSize: 8 }}>{platformInitial(preview.platform)}</span>
                {preview.creator} · {preview.platform}{preview.type ? ` · ${preview.type}` : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: t('views'), v: preview.views },
              { label: t('engagement'), v: preview.engagement },
              { label: t('likes'), v: preview.likes },
              { label: t('comments'), v: preview.comments },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface2)', borderRadius: 9, padding: '10px 12px' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                <div className="num" style={{ fontWeight: 700, fontSize: 15 }}>{fmt(s.v)}</div>
              </div>
            ))}
          </div>

          {/* Saved link */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              {lang === 'th' ? 'ลิงก์ที่บันทึก' : 'Saved link'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={fullUrl} target="_blank" rel="noreferrer" style={{
                flex: 1, minWidth: 0, background: 'var(--surface2)', border: '1px solid var(--border2)',
                borderRadius: 8, padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 12.5,
                color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{fullUrl}</a>
              <button className="btn btn-secondary btn-sm" onClick={copy}>{copied ? (lang === 'th' ? 'คัดลอกแล้ว' : 'Copied') : (lang === 'th' ? 'คัดลอก' : 'Copy')}</button>
              <a className="btn btn-primary btn-sm" href={fullUrl} target="_blank" rel="noreferrer">{lang === 'th' ? 'เปิดลิงก์' : 'Open'}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
