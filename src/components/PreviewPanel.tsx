import React from 'react';
import { usePreviewStore } from '../store/previewStore';
import { fmt, initials, platformColor, platformInitial } from '../lib/utils';

function normalizeUrl(url: string): string {
  if (!url) return '#';
  return url.startsWith('http') ? url : 'https://' + url;
}

export default function PreviewPanel() {
  const { preview, close } = usePreviewStore();
  if (!preview) return null;

  const color = platformColor(preview.platform);

  return (
    <>
      {/* overlay */}
      <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
      {/* panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: 430, maxWidth: '92vw',
        background: 'var(--surface)', borderLeft: '1px solid var(--border)', zIndex: 1001,
        display: 'flex', flexDirection: 'column', boxShadow: '-14px 0 44px rgba(0,0,0,0.4)',
        animation: 'slideIn 0.25s cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>ตัวอย่างวิดีโอ</div>
          <button onClick={close} className="btn btn-ghost" style={{ width: 30, height: 30, padding: 0, justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {/* video placeholder */}
          <div style={{
            position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 13, overflow: 'hidden',
            background: 'repeating-linear-gradient(135deg,#1c1c24,#1c1c24 12px,#23202e 12px,#23202e 24px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,.45)', padding: '5px 9px', borderRadius: 7 }}>
              <span className="platform-icon" style={{ background: color, width: 16, height: 16, fontSize: 9 }}>{platformInitial(preview.platform)}</span>
              <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{preview.platform}</span>
            </div>
            {preview.type && (
              <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10.5, color: '#fff', fontWeight: 600, background: 'rgba(0,0,0,.4)', padding: '4px 8px', borderRadius: 6 }}>{preview.type}</div>
            )}
            <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'rgba(255,255,255,.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#1c1c24"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, fontSize: 10, color: 'rgba(255,255,255,.55)', fontFamily: 'monospace' }}>vdo preview placeholder · 1280×720</div>
          </div>

          <div style={{ marginTop: 16, fontSize: 15, fontWeight: 600 }}>{preview.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 10 }}>
            <div className="avatar" style={{ background: preview.avatar_color || 'var(--accent)', width: 28, height: 28, fontSize: 11 }}>{initials(preview.creator)}</div>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{preview.creator}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            <div style={{ border: '1px solid var(--border)', borderRadius: 11, padding: '13px 15px' }}>
              <div style={{ fontSize: 11.5, color: 'var(--text2)', marginBottom: 5 }}>Total Views</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 600 }}>{fmt(preview.views)}</div>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 11, padding: '13px 15px' }}>
              <div style={{ fontSize: 11.5, color: 'var(--text2)', marginBottom: 5 }}>Engagement</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 600 }}>{fmt(preview.engagement)}</div>
            </div>
          </div>

          <div style={{ marginTop: 16, fontSize: 11.5, color: 'var(--text2)', fontWeight: 600 }}>ลิงก์ต้นทาง</div>
          <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', background: 'var(--surface2)' }}>
            <span style={{ flex: 1, fontSize: 11.5, color: 'var(--text2)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preview.url || '-'}</span>
          </div>

          <a href={normalizeUrl(preview.url)} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', marginTop: 14, padding: 11, width: '100%' }}>
            เปิดลิงก์วิดีโอจริง ↗
          </a>
        </div>
      </div>
    </>
  );
}
