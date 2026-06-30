import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';

const TOP = [{ key: 'dashboard', path: '/', icon: 'grid' }];

const GROUPS: { title: string; items: { key: string; path: string; icon: string; badge?: number }[] }[] = [
  {
    title: 'grpManagement',
    items: [
      { key: 'creators', path: '/creators', icon: 'users' },
      { key: 'programs', path: '/programs', icon: 'layers' },
      { key: 'gameCategories', path: '/games', icon: 'hexagon' },
      { key: 'rewards', path: '/rewards', icon: 'diamond' },
    ],
  },
  {
    title: 'grpData',
    items: [
      { key: 'collectData', path: '/collect', icon: 'inbox' },
      { key: 'reviewData', path: '/editor', icon: 'check', badge: 3 },
    ],
  },
  {
    title: 'grpReports',
    items: [
      { key: 'analytics', path: '/analytics', icon: 'chart' },
      { key: 'export', path: '/export', icon: 'upload' },
      { key: 'auditLog', path: '/audit', icon: 'list' },
    ],
  },
];

export default function Layout() {
  const { lang, currentUser } = useAppStore();
  const t = useT(lang);

  const itemStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 11,
    padding: '9px 11px', borderRadius: 9, marginBottom: 2,
    fontSize: 13, fontWeight: isActive ? 600 : 500,
    color: isActive ? 'var(--accent-hover)' : 'var(--text2)',
    background: isActive ? 'var(--accent-soft)' : 'transparent',
    transition: 'all 0.12s',
  });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <nav style={{
        width: 'var(--sidebar-w)', background: 'var(--surface)',
        borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 18px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #6d6df0, #5b46c9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, color: '#fff', fontWeight: 800,
            }}>C</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.15, letterSpacing: '-0.01em' }}>CreatorHub</div>
              <div style={{ fontSize: 10.5, color: 'var(--text3)', fontWeight: 500 }}>{t('programMgmt')}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 12px' }}>
          {TOP.map(item => (
            <NavLink key={item.key} to={item.path} end style={itemStyle}>
              <Icon name={item.icon} /> {t(item.key)}
            </NavLink>
          ))}

          {GROUPS.map(group => (
            <div key={group.title} style={{ marginTop: 16 }}>
              <div style={{
                fontSize: 10.5, fontWeight: 700, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.07em',
                padding: '0 11px', marginBottom: 6,
              }}>{t(group.title)}</div>
              {group.items.map(item => (
                <NavLink key={item.key} to={item.path} style={itemStyle}>
                  {({ isActive }) => (
                    <>
                      <Icon name={item.icon} />
                      <span style={{ flex: 1 }}>{t(item.key)}</span>
                      {item.badge && (
                        <span style={{
                          background: isActive ? 'var(--accent)' : 'var(--red)', color: '#fff',
                          borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '1px 7px', minWidth: 18, textAlign: 'center',
                        }}>{item.badge}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom: settings + user */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
          <NavLink to="/settings" style={itemStyle}>
            <Icon name="gear" /> {t('settings')}
          </NavLink>
          <NavLink to="/profile" style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: 10, marginTop: 4,
            background: isActive ? 'var(--surface2)' : 'transparent',
          })}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6d6df0,#5b46c9)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
            }}>{currentUser.name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{currentUser.name}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text3)' }}>{t('administrator')}</div>
            </div>
          </NavLink>
        </div>
      </nav>

      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
}

function Icon({ name }: { name: string }) {
  const p: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    users: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0111 0M16 5.2a3 3 0 010 5.6M20.5 20a5.2 5.2 0 00-3.5-4.9" /></>,
    layers: <><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" /></>,
    hexagon: <path d="M12 2.5l8 4.6v9.8l-8 4.6-8-4.6V7.1l8-4.6z" />,
    diamond: <path d="M12 3l8 6-8 12L4 9l8-6z" />,
    inbox: <><path d="M3 12h5l2 3h4l2-3h5" /><path d="M5 5h14l2 7v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6l2-7z" /></>,
    check: <><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M8 12l3 3 5-6" /></>,
    chart: <><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
  };
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {p[name] || p.grid}
    </svg>
  );
}
