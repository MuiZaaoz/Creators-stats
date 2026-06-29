import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';

const SECTIONS = [
  {
    title: null,
    items: [{ key: 'dashboard', path: '/', icon: '▦' }],
  },
  {
    title: 'การจัดการ',
    titleEn: 'Management',
    items: [
      { key: 'creators', path: '/creators', icon: '◉' },
      { key: 'programs', path: '/programs', icon: '▤' },
      { key: 'games', path: '/games', icon: '⬡' },
      { key: 'rewards', path: '/rewards', icon: '◆' },
    ],
  },
  {
    title: 'ข้อมูล',
    titleEn: 'Data',
    items: [
      { key: 'collect', path: '/collect', icon: '⇲' },
      { key: 'editor', path: '/editor', icon: '☑', badge: true },
    ],
  },
  {
    title: 'รายงาน',
    titleEn: 'Reports',
    items: [
      { key: 'analytics', path: '/analytics', icon: '◷' },
      { key: 'export', path: '/export', icon: '↧' },
      { key: 'auditLog', path: '/audit', icon: '≡' },
    ],
  },
  {
    title: 'ระบบ',
    titleEn: 'System',
    items: [
      { key: 'settings', path: '/settings', icon: '⚙' },
      { key: 'profile', path: '/profile', icon: '○' },
    ],
  },
];

export default function Layout() {
  const { lang, setLang, currentUser } = useAppStore();
  const t = useT(lang);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    api.contents.review().then((items) => {
      setPending(items.filter((x: any) => x.status === 'pending').length);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <nav style={{
        width: 'var(--sidebar-w)', background: 'var(--surface)',
        borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 18px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'linear-gradient(135deg,#1c1c24,#2d2640)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#fff', fontWeight: 800,
            }}>C</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.1, letterSpacing: '-0.01em' }}>CreatorHub</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Program Management</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }}>
          {SECTIONS.map((sec, si) => (
            <div key={si} style={{ marginBottom: 10 }}>
              {sec.title && (
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '8px 10px 4px' }}>
                  {lang === 'th' ? sec.title : sec.titleEn}
                </div>
              )}
              {sec.items.map((item: any) => (
                <NavLink
                  key={item.key}
                  to={item.path}
                  end={item.path === '/'}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                    fontSize: 13.5, fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--accent)' : 'var(--text2)',
                    background: isActive ? 'var(--accent-bg)' : 'transparent',
                  })}
                >
                  <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{t(item.key)}</span>
                  {item.badge && pending > 0 && (
                    <span style={{
                      background: 'var(--red)', color: '#fff', borderRadius: 10,
                      minWidth: 18, height: 18, padding: '0 5px', fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{pending}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Footer: lang + user */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {(['th', 'en'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                style={{
                  flex: 1, padding: '5px 0', borderRadius: 6,
                  background: lang === l ? 'var(--accent)' : 'var(--surface2)',
                  color: lang === l ? '#fff' : 'var(--text2)',
                  fontSize: 11, fontWeight: 700, border: 'none',
                }}>{l.toUpperCase()}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 6px' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
            }}>{currentUser.name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{currentUser.role === 'Admin' ? 'Administrator' : currentUser.role}</div>
            </div>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
}
