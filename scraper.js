// scraper.js — "human-like" content scraper (no APIs)
// เปิดหน้าเว็บด้วย headless browser เสมือนผู้ใช้จริง แล้วอ่านค่า
//   Views      = Total Views
//   Engagement = Likes + Comments + Shares
// รองรับ YouTube / TikTok / Facebook / Instagram พร้อมหน่วงเวลากันโดนตรวจจับ

import { chromium } from 'playwright';

// ---- helpers ---------------------------------------------------------------

const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
];
const rand = (min, max) => Math.floor(Math.random() * (max - min) + min);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// แปลงข้อความยอด เช่น "1.2M", "12,345", "3.4 พัน" → ตัวเลขจริง
export function parseCount(text) {
  if (text == null) return null;
  let s = String(text).trim().toLowerCase().replace(/[, ]/g, '');
  const m = s.match(/([\d.]+)\s*([kmb万千]?)/i);
  if (!m) return null;
  let n = parseFloat(m[1]);
  const unit = m[2];
  if (unit === 'k') n *= 1e3;
  else if (unit === 'm') n *= 1e6;
  else if (unit === 'b') n *= 1e9;
  else if (unit === '千') n *= 1e3;
  else if (unit === '万') n *= 1e4;
  return Math.round(n);
}

export function detectPlatform(url) {
  if (/youtu\.?be|youtube\.com/i.test(url)) return 'YouTube';
  if (/tiktok\.com/i.test(url)) return 'TikTok';
  if (/facebook\.com|fb\.watch/i.test(url)) return 'Facebook';
  if (/instagram\.com/i.test(url)) return 'Instagram';
  return 'Unknown';
}

// ---- per-platform extractors (อ่านจาก JSON ที่ฝังในหน้า = เสถียรสุด) --------

function extractYouTube(html) {
  const views = html.match(/"viewCount":\s*"(\d+)"/);                 // videoDetails.viewCount
  const likes = html.match(/"label":"([\d,\.]+)\s*(?:likes|ถูกใจ)"/i) // like button aria-label
             || html.match(/"likeCount":\s*"?(\d[\d,]*)"?/);
  const comments = html.match(/"commentCount":\s*"?(\d[\d,]*)"?/)
                || html.match(/([\d,]+)\s*Comments/i);
  return {
    views: views ? +views[1] : null,
    likes: likes ? parseCount(likes[1]) : null,
    comments: comments ? parseCount(comments[1]) : null,
    shares: 0, // YouTube ไม่เปิดเผยยอดแชร์
  };
}

function extractTikTok(html) {
  // TikTok ฝัง JSON ใน __UNIVERSAL_DATA_FOR_REHYDRATION__ / SIGI_STATE
  const pick = (re) => { const m = html.match(re); return m ? +m[1] : null; };
  return {
    views: pick(/"playCount":\s*(\d+)/),
    likes: pick(/"diggCount":\s*(\d+)/),
    comments: pick(/"commentCount":\s*(\d+)/),
    shares: pick(/"shareCount":\s*(\d+)/),
  };
}

function extractInstagram(html) {
  const pick = (re) => { const m = html.match(re); return m ? +m[1] : null; };
  return {
    views: pick(/"video_view_count":\s*(\d+)/) ?? pick(/"play_count":\s*(\d+)/),
    likes: pick(/"edge_media_preview_like":\s*\{\s*"count":\s*(\d+)/) ?? pick(/"like_count":\s*(\d+)/),
    comments: pick(/"edge_media_to_parent_comment":\s*\{\s*"count":\s*(\d+)/) ?? pick(/"comment_count":\s*(\d+)/),
    shares: 0,
  };
}

function extractFacebook(html) {
  const pick = (re) => { const m = html.match(re); return m ? parseCount(m[1]) : null; };
  return {
    views: pick(/([\d.,]+[KMB]?)\s*views/i),
    likes: pick(/"reaction_count":\s*\{\s*"count":\s*(\d+)/) ?? pick(/([\d.,]+[KMB]?)\s*likes/i),
    comments: pick(/"comment_count":\s*\{\s*"total_count":\s*(\d+)/) ?? pick(/([\d.,]+[KMB]?)\s*comments/i),
    shares: pick(/"share_count":\s*\{\s*"count":\s*(\d+)/) ?? pick(/([\d.,]+[KMB]?)\s*shares/i),
  };
}

const EXTRACTORS = { YouTube: extractYouTube, TikTok: extractTikTok, Instagram: extractInstagram, Facebook: extractFacebook };

// ---- main scrape (สวมเป็นคน + หน่วงเวลา) -----------------------------------

// ธงประหยัดแรม — ให้ Chromium อยู่ ~230MB (fit Render free 512MB)
const FRUGAL_ARGS = [
  '--no-sandbox', '--single-process', '--disable-gpu', '--disable-dev-shm-usage',
  '--disable-blink-features=AutomationControlled',
  '--disable-extensions', '--mute-audio', '--no-first-run',
  '--js-flags=--max-old-space-size=256',
];

export async function scrapeMetrics(url) {
  const platform = detectPlatform(url);
  if (platform === 'Unknown') return { platform, url, ok: false, error: 'unknown platform' };

  // เปิด browser ใหม่ต่อ 1 ลิงก์ แล้วปิดทันที → แรมไม่สะสม (ไม่รันซ้อนกัน)
  const launchOpts = { args: FRUGAL_ARGS };
  if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) launchOpts.executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  const browser = await chromium.launch(launchOpts);
  try {
    const ctx = await browser.newContext({
      userAgent: UA_POOL[rand(0, UA_POOL.length)],
      viewport: { width: 1000, height: 700 },
      locale: 'th-TH',
      timezoneId: 'Asia/Bangkok',
    });
    // บล็อกรูป/วิดีโอ/ฟอนต์/CSS — ประหยัดแรม+แบนด์วิดท์ (เราต้องการแค่ HTML/JSON)
    await ctx.route('**/*', (route) => {
      const t = route.request().resourceType();
      (['image', 'media', 'font', 'stylesheet']).includes(t) ? route.abort() : route.continue();
    });
    // ลบร่องรอย automation (navigator.webdriver ฯลฯ)
    await ctx.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => undefined }));

    const page = await ctx.newPage();
    await sleep(rand(1000, 3000));                         // หน่วงก่อนเข้า
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(rand(2500, 5000));                         // ให้ JS โหลดยอดจริง
    await page.mouse.wheel(0, rand(300, 900));             // เลื่อนเหมือนคนอ่าน
    await sleep(rand(1000, 2500));

    const html = await page.content();
    const raw = EXTRACTORS[platform](html);
    const engagement = (raw.likes || 0) + (raw.comments || 0) + (raw.shares || 0);
    const ok = raw.views != null || engagement > 0;
    return {
      platform, url, ok,
      views: raw.views ?? 0,
      likes: raw.likes ?? 0,
      comments: raw.comments ?? 0,
      shares: raw.shares ?? 0,
      engagement,                                          // = Like + Comment + Share
      scraped_at: new Date().toISOString(),
    };
  } catch (e) {
    return { platform, url, ok: false, error: String(e).slice(0, 120) };
  } finally {
    await browser.close();
  }
}

// ---- คิว + rate limit (ทีละลิงก์ ไม่รันซ้อน = แรมไม่พีค + กันโดนจับบอท) -----
// ประมวลผล "ทีละ 1 ลิงก์เท่านั้น" หน่วง 20–45 วิ ระหว่างรายการ
// → มีแค่ Chromium ตัวเดียวในระบบตลอด (แรม ~315MB) + ช้าลงกันโดนตรวจจับ
let queue = Promise.resolve();
export function enqueueScrape(url) {
  let resolveResult;
  const result = new Promise((r) => { resolveResult = r; });
  queue = queue.then(async () => {
    let r;
    try { r = await scrapeMetrics(url); }
    catch (e) { r = { platform: detectPlatform(url), url, ok: false, error: String(e).slice(0, 150) }; }
    resolveResult(r);                          // ส่งผลกลับทันทีที่ scrape เสร็จ
    await sleep(rand(20000, 45000));           // แล้วค่อยหน่วงก่อนคิวถัดไป (กันโดนจับบอท)
  });
  return result;
}
