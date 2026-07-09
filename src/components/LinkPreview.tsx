import React from 'react';
import { fmt, platformColor, platformInitial } from '../lib/utils';

export interface PreviewLink {
  platform: string;
  url: string;
  title?: string;
  creator_name?: string;
  views?: number;
  engagement?: number;
  uv?: number;
  video_views?: number;
}

// Build an embeddable URL for each platform, or null when embedding isn't possible.
export function embedUrl(platform: string, url: string): string | null {
  if (!url) return null;
  try {
    if (platform === 'YouTube') {
      let id = '';
      const short = url.match(/youtu\.be\/([\w-]{6,})/);
      const shorts = url.match(/\/shorts\/([\w-]{6,})/);
      const watch = url.match(/[?&]v=([\w-]{6,})/);
      id = (watch?.[1] || shorts?.[1] || short?.[1] || '').split('?')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (platform === 'TikTok') {
      const m = url.match(/\/video\/(\d{8,})/);
      return m ? `https://www.tiktok.com/embed/v2/${m[1]}` : null;
    }
    if (platform === 'Facebook') {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=480`;
    }
    if (platform === 'Instagram') {
      const clean = url.split('?')[0].replace(/\/$/, '');
      const m = clean.match(/instagram\.com\/(p|reel|reels)\/([\w-]+)/);
      return m ? `https://www.instagram.com/${m[1] === 'reels' ? 'reel' : m[1]}/${m[2]}/embed` : null;
    }
  } catch { /* fall through */ }
  return null;
}

export default function LinkPreview({ link, onClose }: { link: PreviewLink; onClose: () => void }) {
  const embed = embedUrl(link.platform, link.url);
  const vertical = link.platform === 'TikTok' || link.platform === 'Instagram' || (link.url || '').includes('/shorts/') || (link.url || '').includes('/reel');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: vertical ? 420 : 640 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span className="platform-icon" style={{ background: platformColor(link.platform), width: 26, height: 26, fontSize: 11 }}>
            {platformInitial(link.platform)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{link.title || link.platform}</div>
            {link.creator_name && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{link.creator_name}</div>}
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: 16, padding: '4px 10px' }}>✕</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
          {link.views != null && (
            <div><span style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', marginRight: 6 }}>Views</span>
              <span className="num" style={{ fontWeight: 700 }}>{fmt(link.views)}</span></div>
          )}
          {(link.engagement || 0) > 0 && (
            <div><span style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', marginRight: 6 }}>Engagement</span>
              <span className="num" style={{ fontWeight: 700 }}>{fmt(link.engagement)}</span></div>
          )}
          {(link.uv || 0) > 0 && (
            <div><span style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', marginRight: 6 }}>UV</span>
              <span className="num" style={{ fontWeight: 700 }}>{fmt(link.uv)}</span></div>
          )}
          {(link.video_views || 0) > 0 && (
            <div><span style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', marginRight: 6 }}>Video Views</span>
              <span className="num" style={{ fontWeight: 700 }}>{fmt(link.video_views)}</span></div>
          )}
        </div>

        {/* Embed preview */}
        {embed ? (
          <div style={{
            borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)',
            background: '#000', marginBottom: 14,
            aspectRatio: vertical ? '9 / 14' : '16 / 9',
            maxHeight: vertical ? 480 : undefined,
          }}>
            <iframe
              src={embed}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title="preview"
            />
          </div>
        ) : link.url ? (
          <div style={{
            background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px',
            marginBottom: 14, fontSize: 12, color: 'var(--text2)',
          }}>
            ไม่รองรับการ preview ในหน้านี้ — กดปุ่มด้านล่างเพื่อเปิดลิงก์
          </div>
        ) : (
          <div style={{
            background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px',
            marginBottom: 14, fontSize: 12, color: 'var(--text2)',
          }}>
            คอนเทนต์นี้ไม่มีลิงก์แนบ (ข้อมูล Streamer)
          </div>
        )}

        {/* Link row */}
        {link.url && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px',
              fontSize: 12, color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{link.url}</div>
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ flexShrink: 0 }}>
              เปิดลิงก์ ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
