export function fmt(n: number | null | undefined): string {
  if (n == null) return '0';
  return Math.round(n).toLocaleString('en-US');
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '0%';
  return (n * 100).toFixed(1) + '%';
}

export function fmtCurrency(n: number | null | undefined): string {
  if (n == null) return '฿0';
  return '฿' + Math.round(n).toLocaleString('en-US');
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function platformColor(platform: string): string {
  const colors: Record<string, string> = {
    YouTube: '#ff0000',
    TikTok: '#010101',
    Facebook: '#1877f2',
    Instagram: '#e1306c',
  };
  return colors[platform] || '#888';
}

export function platformInitial(platform: string): string {
  const map: Record<string, string> = { YouTube: 'YT', TikTok: 'TT', Facebook: 'FB', Instagram: 'IG' };
  return map[platform] || platform[0];
}

export function typeColor(type: string): string {
  const colors: Record<string, string> = { Long: '#3b82f6', Short: '#f97316', Streamer: '#8b5cf6' };
  return colors[type] || '#888';
}

export function relDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}
