// Human-like page visitor: fetches public pages with real browser headers,
// waits a random delay between visits, and reads the stats embedded in the HTML.
// No platform API keys involved.
//
// Facebook / Instagram often wall the direct clip page, so both have a
// fallback: visit the page's / account's Reels listing and locate the clip
// by its id (Facebook) or shortcode (Instagram), then read the counters
// that sit near it in the embedded JSON.

export interface ClipStats {
  ok: boolean;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  note?: string;
}

export interface ScrapeCtx {
  fbHandle?: string | null;
  igHandle?: string | null;
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const DELAY_MIN = Number(process.env.AI_DELAY_MIN_MS || 3000);
const DELAY_MAX = Number(process.env.AI_DELAY_MAX_MS || 7000);

export function humanDelay(): Promise<void> {
  const ms = DELAY_MIN + Math.random() * Math.max(0, DELAY_MAX - DELAY_MIN);
  return new Promise(r => setTimeout(r, ms));
}

async function fetchPageFull(url: string): Promise<{ html: string; finalUrl: string } | null> {
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
    return { html: await resp.text(), finalUrl: resp.url || url };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPage(url: string): Promise<string | null> {
  const r = await fetchPageFull(url);
  return r ? r.html : null;
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

// Find `needle` in the html and run the number patterns only on the JSON
// blob around it — used to read a specific clip out of a Reels listing.
function firstNumNear(html: string, needle: string, patterns: RegExp[], radius = 5000): number | null {
  let idx = html.indexOf(needle);
  while (idx !== -1) {
    const windowHtml = html.slice(Math.max(0, idx - radius), idx + radius);
    const n = firstNum(windowHtml, patterns);
    if (n != null) return n;
    idx = html.indexOf(needle, idx + needle.length);
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

export function extractFbVideoId(url: string): string | null {
  const m = url.match(/\/reel\/(\d+)/) || url.match(/\/videos\/(\d+)/) || url.match(/[?&]v=(\d+)/);
  return m ? m[1] : null;
}

export function extractIgShortcode(url: string): string | null {
  const m = url.match(/\/(?:reels?|p)\/([\w-]+)/);
  return m ? m[1] : null;
}

// Learn the page/account name when a URL carries it
export function fbHandleFromUrl(url: string): string | null {
  const m = url.match(/facebook\.com\/([A-Za-z0-9.\-_]+)\/(?:videos|reels)\//);
  if (m && !['watch', 'reel', 'share', 'people'].includes(m[1])) return m[1];
  return null;
}

export function igHandleFromUrl(url: string): string | null {
  const m = url.match(/instagram\.com\/([A-Za-z0-9._]+)\/(?:reels?|p)\//);
  if (m && !['reel', 'reels', 'p', 'tv'].includes(m[1])) return m[1];
  return null;
}

const FB_VIEW_PATTERNS = [/"video_view_count":\s*(\d+)/, /"play_count":\s*(\d+)/, /"vc":\s*(\d+)/, /"view_count":\s*(\d+)/];
const FB_LIKE_PATTERNS = [/"reaction_count":\s*\{"count":\s*(\d+)/, /"like_count":\s*(\d+)/, /"likecount":\s*(\d+)/i];
const FB_COMMENT_PATTERNS = [/"comment_count":\s*\{[^}]*?"total_count":\s*(\d+)/, /"comment_count":\s*(\d+)/, /"total_comment_count":\s*(\d+)/];
const FB_SHARE_PATTERNS = [/"share_count":\s*\{"count":\s*(\d+)/, /"share_count":\s*(\d+)/];

const IG_VIEW_PATTERNS = [/"video_view_count":\s*(\d+)/, /"play_count":\s*(\d+)/, /"ig_play_count":\s*(\d+)/, /"view_count":\s*(\d+)/];
const IG_LIKE_PATTERNS = [/"edge_media_preview_like":\s*\{"count":\s*(\d+)/, /"like_count":\s*(\d+)/, /([\d,.KM]+)\s+likes/i];
const IG_COMMENT_PATTERNS = [/"edge_media_to_comment":\s*\{"count":\s*(\d+)/, /"comment_count":\s*(\d+)/, /([\d,.KM]+)\s+comments/i];

export async function scrapeClip(platform: string, url: string, ctx: ScrapeCtx = {}): Promise<ClipStats> {
  const none: ClipStats = { ok: false, views: null, likes: null, comments: null, shares: null, saves: null };

  if (platform === 'YouTube') {
    const html = await fetchPage(url);
    if (!html) return { ...none, note: 'fetch_failed' };
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
    const html = await fetchPage(url);
    if (!html) return { ...none, note: 'fetch_failed' };
    const views = firstNum(html, [/"playCount":\s*"?(\d+)/]);
    const likes = firstNum(html, [/"diggCount":\s*"?(\d+)/]);
    const comments = firstNum(html, [/"commentCount":\s*"?(\d+)/]);
    const shares = firstNum(html, [/"shareCount":\s*"?(\d+)/]);
    const saves = firstNum(html, [/"collectCount":\s*"?(\d+)/]);
    return { ok: views != null, views, likes, comments, shares, saves };
  }

  if (platform === 'Facebook') {
    // 1) the clip page itself (also resolves share links to their real URL)
    const page = await fetchPageFull(url);
    let videoId = extractFbVideoId(url);
    let handle = ctx.fbHandle || null;
    if (page) {
      videoId = videoId || extractFbVideoId(page.finalUrl);
      handle = handle || fbHandleFromUrl(page.finalUrl) || fbHandleFromUrl(url);
      const views = firstNum(page.html, FB_VIEW_PATTERNS);
      if (views != null) {
        return {
          ok: true, views,
          likes: firstNum(page.html, FB_LIKE_PATTERNS),
          comments: firstNum(page.html, FB_COMMENT_PATTERNS),
          shares: firstNum(page.html, FB_SHARE_PATTERNS),
          saves: null,
        };
      }
    }
    // 2) fallback: the page's Reels/Videos listing, locate this clip by id
    if (handle && videoId) {
      for (const listUrl of [
        `https://www.facebook.com/${handle}/reels/`,
        `https://www.facebook.com/${handle}/videos/`,
      ]) {
        await humanDelay();
        const list = await fetchPage(listUrl);
        if (!list || !list.includes(videoId)) continue;
        const views = firstNumNear(list, videoId, FB_VIEW_PATTERNS);
        if (views != null) {
          return {
            ok: true, views,
            likes: firstNumNear(list, videoId, FB_LIKE_PATTERNS),
            comments: firstNumNear(list, videoId, FB_COMMENT_PATTERNS),
            shares: firstNumNear(list, videoId, FB_SHARE_PATTERNS),
            saves: null, note: 'fb_from_reels_list',
          };
        }
      }
    }
    return { ...none, note: page ? 'fb_blocked' : 'fetch_failed' };
  }

  if (platform === 'Instagram') {
    const shortcode = extractIgShortcode(url);
    let handle = ctx.igHandle || igHandleFromUrl(url);

    // 1) the clip page + public embed variant
    const html = await fetchPage(url);
    if (html) {
      handle = handle || igHandleFromUrl(html.match(/"username":"([A-Za-z0-9._]+)"/)?.[0] || '') || (html.match(/"username":"([A-Za-z0-9._]+)"/)?.[1] ?? null);
      const views = firstNum(html, IG_VIEW_PATTERNS);
      const likes = firstNum(html, IG_LIKE_PATTERNS);
      if (views != null || likes != null) {
        return { ok: views != null || likes != null, views, likes, comments: firstNum(html, IG_COMMENT_PATTERNS), shares: null, saves: null };
      }
    }
    if (shortcode) {
      await humanDelay();
      const emb = await fetchPage(`https://www.instagram.com/p/${shortcode}/embed/captioned/`);
      if (emb) {
        const likes = firstNum(emb, IG_LIKE_PATTERNS);
        const views = firstNum(emb, IG_VIEW_PATTERNS);
        if (views != null || likes != null) {
          return { ok: true, views, likes, comments: firstNum(emb, IG_COMMENT_PATTERNS), shares: null, saves: null, note: 'ig_embed' };
        }
      }
    }
    // 2) fallback: the account's Reels grid, locate this clip by shortcode
    if (handle && shortcode) {
      for (const listUrl of [
        `https://www.instagram.com/${handle}/reels/`,
        `https://www.instagram.com/${handle}/`,
      ]) {
        await humanDelay();
        const list = await fetchPage(listUrl);
        if (!list || !list.includes(shortcode)) continue;
        const views = firstNumNear(list, shortcode, IG_VIEW_PATTERNS);
        const likes = firstNumNear(list, shortcode, IG_LIKE_PATTERNS);
        if (views != null || likes != null) {
          return {
            ok: true, views, likes,
            comments: firstNumNear(list, shortcode, IG_COMMENT_PATTERNS),
            shares: null, saves: null, note: 'ig_from_reels_list',
          };
        }
      }
    }
    return { ...none, note: html ? 'ig_blocked' : 'fetch_failed' };
  }

  return none;
}

export async function scrapeFollowers(platform: 'tiktok' | 'youtube' | 'instagram' | 'facebook', handle: string): Promise<number | null> {
  if (platform === 'tiktok') {
    const html = await fetchPage(`https://www.tiktok.com/@${handle}`);
    return html ? firstNum(html, [/"followerCount":\s*"?(\d+)/]) : null;
  }
  if (platform === 'youtube') {
    const html = await fetchPage(`https://www.youtube.com/@${handle}`);
    return html ? firstNum(html, [
      /"subscriberCountText":\s*\{"simpleText":"([\d,.KMB]+)\s+subscribers?"/i,
      /([\d,.KMB]+)\s+subscribers?"/i,
    ]) : null;
  }
  if (platform === 'instagram') {
    const html = await fetchPage(`https://www.instagram.com/${handle}/`);
    return html ? firstNum(html, [/"edge_followed_by":\s*\{"count":\s*(\d+)/, /"follower_count":\s*(\d+)/, /content="([\d,.KM]+)\s+Followers/i]) : null;
  }
  if (platform === 'facebook') {
    const html = await fetchPage(`https://www.facebook.com/${handle}/`);
    return html ? firstNum(html, [/"follower_count":\s*(\d+)/, /([\d,.KM]+)\s+followers/i]) : null;
  }
  return null;
}
