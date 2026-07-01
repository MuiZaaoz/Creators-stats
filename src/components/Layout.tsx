import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';

const NAV = [
  { key: 'dashboard', path: '/', icon: '◈' },
  { key: 'creators', path: '/creators', icon: '◉' },
  { key: 'programs', path: '/programs', icon: '▣' },
  { key: 'collect', path: '/collect', icon: '⊕' },
  { key: 'editor', path: '/editor', icon: '✦' },
  { key: 'analytics', path: '/analytics', icon: '◎' },
  { key: 'export', path: '/export', icon: '↗' },
  { key: 'games', path: '/games', icon: '⬡' },
  { key: 'rewards', path: '/rewards', icon: '◆' },
  { key: 'auditLog', path: '/audit', icon: '≡' },
];

const NAV_BOTTOM = [
  { key: 'settings', path: '/settings', icon: '⚙' },
  { key: 'profile', path: '/profile', icon: '○' },
];

export default function Layout() {
  const { lang, setLang, currentUser } = useAppStore();
  const t = useT(lang);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar t={t} lang={lang} setLang={setLang} currentUser={currentUser} />
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
}

function Sidebar({ t, lang, setLang, currentUser }: any) {
  return (
    <nav style={{
      width: 'var(--sidebar-w)',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#fff', fontWeight: 700,
          }}>C</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>CreatorHub</div>
            <div style={{ fontSize: 10, color: 'var(--text2)', letterSpacing: '0.06em' }}>Program Management</div>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {NAV.map(item => (
          <NavLink
            key={item.key}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 7,
              marginBottom: 2,
              fontSize: 13, fontWeight: 500,
              color: isActive ? '#fff' : 'var(--text2)',
              background: isActive ? 'var(--accent)' : 'transparent',
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
            {t(item.key)}
          </NavLink>
        ))}
      </div>

      {/* Bottom */}
      <div style={{ padding: '8px 8px', borderTop: '1px solid var(--border)' }}>
        {NAV_BOTTOM.map(item => (
          <NavLink
            key={item.key}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 7,
              marginBottom: 2,
              fontSize: 13, fontWeight: 500,
              color: isActive ? '#fff' : 'var(--text2)',
              background: isActive ? 'var(--accent)' : 'transparent',
            })}
          >
            <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
            {t(item.key)}
          </NavLink>
        ))}

        {/* Lang Toggle */}
        <div style={{ display: 'flex', gap: 4, padding: '6px 10px', marginTop: 4 }}>
          {(['th', 'en'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                flex: 1, padding: '4px 0', borderRadius: 5,
                background: lang === l ? 'var(--accent)' : 'var(--surface2)',
                color: lang === l ? '#fff' : 'var(--text2)',
                fontSize: 11, fontWeight: 700,
                border: '1px solid var(--border)',
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* User */}
        <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
          }}>{currentUser.name[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text2)' }}>{currentUser.role}</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
