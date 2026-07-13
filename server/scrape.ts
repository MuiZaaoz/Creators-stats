// Human-like page visitor: fetches public pages with real browser headers,
// waits a random delay between visits, and reads the stats embedded in the HTML.
// No platform API keys involved.

export interface ClipStats {
  ok: boolean;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  note?: string;
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const DELAY_MIN = Number(process.env.AI_DELAY_MIN_MS || 3000);
const DELAY_MAX = Number(process.env.AI_DELAY_MAX_MS || 7000);

export function humanDelay(): Promise<void> {
  const ms = DELAY_MIN + Math.random() * Math.max(0, DELAY_MAX - DELAY_MIN);
  return new Promise(r => setTimeout(r, ms));
}

async function fetchPage(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const resp = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'user-agent': UA,
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9,th;q=0.8',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'upgrade-insecure-requests': '1',
      },
    });
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function firstNum(html: string, patterns: RegExp[]): number | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1] != null) {
      const n = parseCompact(m[1]);
      if (n != null) return n;
    }
  }
  return null;
}

// "1,234" / "12.3K" / "1.2M" / "1234" -> integer
function parseCompact(s: string): number | null {
  const t = String(s).trim().replace(/,/g, '');
  const m = t.match(/^([\d.]+)\s*([KMB])?$/i);
  if (!m) return null;
  let n = parseFloat(m[1]);
  if (Number.isNaN(n)) return null;
  const suf = (m[2] || '').toUpperCase();
  if (suf === 'K') n *= 1e3;
  if (suf === 'M') n *= 1e6;
  if (suf === 'B') n *= 1e9;
  return Math.round(n);
}

export async function scrapeClip(platform: string, url: string): Promise<ClipStats> {
  const none: ClipStats = { ok: false, views: null, likes: null, comments: null, shares: null, saves: null };
  const html = await fetchPage(url);
  if (!html) return { ...none, note: 'fetch_failed' };

  if (platform === 'YouTube') {
    const views = firstNum(html, [
      /"viewCount":\s*"(\d+)"/,
      /"viewCount":\s*\{"simpleText":"([\d,]+) views"/,
    ]);
    const likes = firstNum(html, [
      /"likeCount":\s*"?(\d+)/,
      /like this video along with ([\d,]+) other people/,
      /"accessibilityText":"([\d,.]+[KMB]?) likes?"/i,
    ]);
    const comments = firstNum(html, [
      /"commentCount":\s*\{"simpleText":"([\d,.KMB]+)"/i,
      /"commentCount":\s*"?(\d+)/,
    ]);
    return { ok: views != null, views, likes, comments, shares: null, saves: null };
  }

  if (platform === 'TikTok') {
    const views = firstNum(html, [/"playCount":\s*"?(\d+)/]);
    const likes = firstNum(html, [/"diggCount":\s*"?(\d+)/]);
    const comments = firstNum(html, [/"commentCount":\s*"?(\d+)/]);
    const shares = firstNum(html, [/"shareCount":\s*"?(\d+)/]);
    const saves = firstNum(html, [/"collectCount":\s*"?(\d+)/]);
    return { ok: views != null, views, likes, comments, shares, saves };
  }

  if (platform === 'Facebook') {
    const views = firstNum(html, [
      /"video_view_count":\s*(\d+)/,
      /"play_count":\s*(\d+)/,
      /"vc":\s*(\d+)/,
    ]);
    const likes = firstNum(html, [
      /"reaction_count":\s*\{"count":\s*(\d+)/,
      /"likecount":\s*(\d+)/i,
    ]);
    const comments = firstNum(html, [
      /"comment_count":\s*\{[^}]*?"total_count":\s*(\d+)/,
      /"commentcount":\s*(\d+)/i,
    ]);
    const shares = firstNum(html, [/"share_count":\s*\{"count":\s*(\d+)/]);
    return { ok: views != null, views, likes, comments, shares, saves: null, note: views == null ? 'fb_blocked' : undefined };
  }

  if (platform === 'Instagram') {
    // Try the post page first, then the public embed variant
    let h = html;
    let views = firstNum(h, [/"video_view_count":\s*(\d+)/, /"play_count":\s*(\d+)/]);
    let likes = firstNum(h, [/"edge_media_preview_like":\s*\{"count":\s*(\d+)/, /([\d,.KM]+)\s+likes/i]);
    let comments = firstNum(h, [/"edge_media_to_comment":\s*\{"count":\s*(\d+)/, /([\d,.KM]+)\s+comments/i]);
    if (views == null && likes == null) {
      const clean = url.split('?')[0].replace(/\/$/, '');
      const emb = await fetchPage(clean + '/embed/captioned/');
      if (emb) {
        h = emb;
        likes = firstNum(h, [/([\d,.KM]+)\s+likes/i, /"likeCount":\s*"?([\d,.KM]+)/i]);
        comments = firstNum(h, [/([\d,.KM]+)\s+comments/i]);
        views = firstNum(h, [/"video_view_count":\s*(\d+)/]);
      }
    }
    return { ok: views != null || likes != null, views, likes, comments, shares: null, saves: null, note: 'ig_partial' };
  }

  return none;
}

export async function scrapeFollowers(platform: 'tiktok' | 'youtube', handle: string): Promise<number | null> {
  if (platform === 'tiktok') {
    const html = await fetchPage(`https://www.tiktok.com/@${handle}`);
    if (!html) return null;
    return firstNum(html, [/"followerCount":\s*"?(\d+)/]);
  }
  if (platform === 'youtube') {
    const html = await fetchPage(`https://www.youtube.com/@${handle}`);
    if (!html) return null;
    return firstNum(html, [
      /"subscriberCountText":\s*\{"simpleText":"([\d,.KMB]+)\s+subscribers?"/i,
      /([\d,.KMB]+)\s+subscribers?"/i,
    ]);
  }
  return null;
}
