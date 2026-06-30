import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useT, type Lang } from '../lib/i18n';

interface Props {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: Props) {
  const { lang, setLang } = useAppStore();
  const t = useT(lang);
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (gearRef.current && !gearRef.current.contains(e.target as Node)) setGearOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: 16, padding: '22px 28px 0', flexWrap: 'wrap',
    }}>
      <div>
        <h1 style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>{subtitle}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Language dropdown */}
        <div ref={langRef} style={{ position: 'relative' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setLangOpen(o => !o)}
            style={{ height: 38 }}>
            <GlobeIcon />
            <span style={{ fontWeight: 700 }}>{lang === 'en' ? 'EN' : 'TH'}</span>
            <ChevronDown />
          </button>
          {langOpen && (
            <div style={popStyle}>
              {([['th', 'ไทย (TH)'], ['en', 'English (EN)']] as [Lang, string][]).map(([code, label]) => (
                <button key={code} onClick={() => { setLang(code); setLangOpen(false); }}
                  style={{
                    ...popItem,
                    color: lang === code ? 'var(--accent-hover)' : 'var(--text)',
                    background: lang === code ? 'var(--accent-soft)' : 'transparent',
                    fontWeight: lang === code ? 700 : 500,
                  }}>
                  {label}
                  {lang === code && <CheckIcon />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Last updated pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 38,
          padding: '0 14px', borderRadius: 9, background: 'var(--surface)',
          border: '1px solid var(--border2)', boxShadow: 'var(--shadow-sm)',
          fontSize: 12.5, color: 'var(--text2)', whiteSpace: 'nowrap',
        }}>
          <span className="dot" style={{ background: 'var(--green)' }} />
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{t('lastUpdated')}</span>
          <span className="num">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} 18:42</span>
        </div>

        {/* Settings gear */}
        <div ref={gearRef} style={{ position: 'relative' }}>
          <button onClick={() => setGearOpen(o => !o)} title={t('customize')}
            style={{
              width: 38, height: 38, borderRadius: 9, background: 'var(--surface)',
              border: '1px solid var(--border2)', boxShadow: 'var(--shadow-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)',
            }}>
            <GearIcon />
          </button>
          {gearOpen && (
            <div style={{ ...popStyle, width: 220 }}>
              <div style={{ padding: '6px 12px 8px', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('customize')}
              </div>
              <button style={popItem} onClick={() => { setGearOpen(false); navigate('/settings'); }}>
                {t('settings')}
              </button>
              <button style={popItem} onClick={() => { setGearOpen(false); navigate('/profile'); }}>
                {t('profile')}
              </button>
              <button style={popItem} onClick={() => { setLang(lang === 'th' ? 'en' : 'th'); setGearOpen(false); }}>
                {t('switchLanguage')}
              </button>
            </div>
          )}
        </div>

        {/* Add Data */}
        <button className="btn btn-primary" style={{ height: 38 }} onClick={() => navigate('/collect')}>
          <PlusIcon /> {t('addData')}
        </button>
      </div>
    </div>
  );
}

const popStyle: React.CSSProperties = {
  position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 168,
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 11,
  boxShadow: 'var(--shadow-pop)', padding: 5, zIndex: 100,
};
const popItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 7,
  fontSize: 13, fontWeight: 500, background: 'transparent', color: 'var(--text)',
};

const GlobeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
  </svg>
);
const ChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 9l6 6 6-6" /></svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
);
const GearIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
);
