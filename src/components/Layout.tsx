import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { api } from '../lib/api';

// Line icons from the design prototype
const ICONS: Record<string, string> = {
  dash: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  layers: 'M12 2 2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  game: 'M6 11h4M8 9v4M15 12h.01M18 10h.01M17.5 5h-11A4.5 4.5 0 0 0 2 9.5l-1 6A3.5 3.5 0 0 0 4.4 20c1 0 1.9-.4 2.5-1.2L8 16h8l1.1 2.8c.6.8 1.5 1.2 2.5 1.2a3.5 3.5 0 0 0 3.4-4.5l-1-6A4.5 4.5 0 0 0 17.5 5z',
  upload: 'M12 16V8 M8 12l4-4 4 4 M20 16.7A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25',
  check: 'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  chart: 'M3 3v18h18 M7 14l4-5 3 3 4-7',
  reward: 'M9 8c0-1.7 2.7-3 6-3s6 1.3 6 3-2.7 3-6 3-6-1.3-6-3z M21 8v8c0 1.7-2.7 3-6 3s-6-1.3-6-3V8 M9 12c0 1.7 2.7 3 6 3s6-1.3 6-3 M3 8c0-1.7 2.7-3 6-3 M3 8v8c0 1.7 2.7 3 6 3 M3 12c0 1.7 2.7 3 6 3',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  account: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
  sliders: 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6',
};

export function Icon({ d, size = 17, color = 'currentColor' }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {d.split(' M').map((p, i) => <path key={i} d={(i === 0 ? '' : 'M') + p} />)}
    </svg>
  );
}

const TITLES: Record<string, [string, string, string, string]> = {
  // path: [th title, th subtitle, en title, en subtitle]
  '/': ['แดชบอร์ด', 'ภาพรวมทั้งหมดของโปรแกรมครีเอเตอร์', 'Dashboard', 'Overview of all creator programs'],
  '/creators': ['ครีเอเตอร์', 'จัดการและค้นหาข้อมูลครีเอเตอร์ทั้งหมด', 'Creators', 'Manage and search all creators'],
  '/programs': ['โปรแกรม', 'ผลงานและการจัดอันดับแต่ละโปรแกรม', 'Programs', 'Performance and ranking by program'],
  '/games': ['หมวดหมู่เกม', 'จัดการรายชื่อเกมที่ใช้จับคู่กับโปรแกรม', 'Games', 'Manage games linked to programs'],
  '/collect': ['รับข้อมูล', 'เพิ่มข้อมูลผ่าน Web Submit · Manual · Upload · AI Refresh', 'Data Collection', 'Add data via Web Submit · Manual · Upload · AI Refresh'],
  '/editor': ['ตรวจสอบข้อมูล', 'ตรวจสอบและอนุมัติข้อมูลก่อนเผยแพร่', 'Data Verification', 'Review and approve data before publishing'],
  '/analytics': ['วิเคราะห์ข้อมูล', 'รายงานเชิงลึกตามครีเอเตอร์ โปรแกรม แพลตฟอร์ม', 'Analytics', 'In-depth reports by creator, program, platform'],
  '/rewards': ['เงินรางวัล', 'จัดการเงินรางวัลแยกตามโปรแกรมและรายคน · คำนวณ CPM อัตโนมัติ', 'Rewards', 'Manage rewards by program and creator · auto CPM'],
  '/export': ['ส่งออกข้อมูล', 'Excel · Google Sheets · Scheduled', 'Export', 'Excel · Google Sheets · Scheduled'],
  '/profile': ['จัดการข้อมูลส่วนตัว', 'ข้อมูลบัญชี การเข้าใช้งาน และความปลอดภัย', 'My Profile', 'Account info, access and security'],
  '/audit': ['Audit Log', 'บันทึกความเคลื่อนไหวทั้งระบบ — สำหรับ Admin', 'Audit Log', 'System-wide activity log — Admin only'],
  '/settings': ['ตั้งค่าระบบ', 'ผู้ใช้งาน แพลตฟอร์ม AI และ Audit Logs', 'Settings', 'Users, AI platform and audit logs'],
};

export default function Layout() {
  const { lang, setLang, currentUser } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    api.contents.review().then(items => {
      setPendingCount(items.filter((i: any) => i.status === 'pending').length);
    }).catch(() => {});
  }, [location.pathname]);

  const basePath = '/' + (location.pathname.split('/')[1] || '');
  const tt = TITLES[basePath] || TITLES['/'];
  const [title, subtitle] = lang === 'th' ? [tt[0], tt[1]] : [tt[2], tt[3]];

  const t2 = (th: string, en: string) => (lang === 'th' ? th : en);

  const NAV_GROUPS = [
    { label: null, items: [{ path: '/', label: t2('แดชบอร์ด', 'Dashboard'), icon: ICONS.dash }] },
    {
      label: t2('การจัดการ', 'MANAGE'),
      items: [
        { path: '/creators', label: t2('ครีเอเตอร์', 'Creators'), icon: ICONS.users },
        { path: '/programs', label: t2('โปรแกรม', 'Programs'), icon: ICONS.layers },
        { path: '/games', label: t2('หมวดหมู่เกม', 'Games'), icon: ICONS.game },
      ],
    },
    {
      label: t2('ข้อมูล', 'DATA'),
      items: [
        { path: '/collect', label: t2('รับข้อมูล', 'Collect'), icon: ICONS.upload },
        { path: '/editor', label: t2('ตรวจสอบข้อมูล', 'Verify'), icon: ICONS.check, badge: pendingCount },
      ],
    },
    {
      label: t2('รายงาน', 'REPORTS'),
      items: [
        { path: '/analytics', label: t2('วิเคราะห์', 'Analytics'), icon: ICONS.chart },
        { path: '/rewards', label: t2('เงินรางวัล', 'Rewards'), icon: ICONS.reward },
        { path: '/export', label: t2('ส่งออก', 'Export'), icon: ICONS.download },
      ],
    },
    {
      label: t2('บัญชี', 'ACCOUNT'),
      items: [
        { path: '/profile', label: t2('จัดการข้อมูลส่วนตัว', 'My Profile'), icon: ICONS.account },
        { path: '/audit', label: 'Audit Log', icon: ICONS.shield },
        { path: '/settings', label: t2('ตั้งค่า', 'Settings'), icon: ICONS.sliders },
      ],
    },
  ];

  const now = new Date();
  const updateStamp = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' +
    now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ============ SIDEBAR ============ */}
      <nav style={{
        width: 'var(--sidebar-w)', background: '#fff',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#fff', fontWeight: 700,
          }}>C</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.15 }}>CreatorHub</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>Program Management</div>
          </div>
        </div>

        {/* Nav groups */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2px 10px' }}>
          {NAV_GROUPS.map((g, gi) => (
            <div key={gi} style={{ marginBottom: 6 }}>
              {g.label && (
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#b0b0b8', letterSpacing: '0.08em', padding: '10px 10px 5px' }}>
                  {g.label}
                </div>
              )}
              {g.items.map((item: any) => (
                <NavLink key={item.path} to={item.path} end={item.path === '/'}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 9, marginBottom: 2,
                    fontSize: 13.5,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#4646c6' : '#52525b',
                    background: isActive ? 'var(--accent-tint)' : 'transparent',
                    transition: 'background .12s',
                  })}>
                  <Icon d={item.icon} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge > 0 && (
                    <span style={{
                      background: '#dc2626', color: '#fff', borderRadius: 20,
                      fontSize: 10.5, fontWeight: 700, padding: '1px 7px',
                    }}>{item.badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* User chip */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid #f0f0f2', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#1c1c1f', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
          }}>{currentUser.name[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>Administrator</div>
          </div>
          <span style={{ color: 'var(--text2)', fontSize: 11 }}>⌄</span>
        </div>
      </nav>

      {/* ============ MAIN ============ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          background: '#fff', borderBottom: '1px solid var(--border)',
          padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.25 }}>{title}</h1>
            <div style={{ fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>
          </div>

          {/* Last update chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--surface2)', borderRadius: 9, padding: '8px 13px',
            fontSize: 12, color: '#52525b', whiteSpace: 'nowrap',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
            {t2('อัปเดตล่าสุด', 'Last update')} <span className="num" style={{ fontWeight: 600 }}>{updateStamp}</span>
          </div>

          {/* Lang selector */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setLangOpen(!langOpen)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fff', border: '1px solid var(--border)', borderRadius: 9,
              padding: '8px 12px', fontSize: 12.5, fontWeight: 700, color: '#1c1c1f',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" /><path d="M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {lang.toUpperCase()} <span style={{ fontSize: 9 }}>▾</span>
            </button>
            {langOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '110%', zIndex: 100,
                background: '#fff', border: '1px solid var(--border)', borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,.1)', overflow: 'hidden', minWidth: 130,
              }}>
                {([['th', 'ไทย (TH)'], ['en', 'English (EN)']] as const).map(([code, label]) => (
                  <button key={code}
                    onClick={() => { setLang(code); setLangOpen(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '9px 14px', fontSize: 12.5, background: lang === code ? 'var(--accent-tint)' : '#fff',
                      color: lang === code ? '#4646c6' : '#1c1c1f', fontWeight: lang === code ? 700 : 500,
                    }}>{label}</button>
                ))}
              </div>
            )}
          </div>

          {/* Settings gear */}
          <button onClick={() => navigate('/settings')} style={{
            background: '#fff', border: '1px solid var(--border)', borderRadius: 9,
            padding: 8, display: 'flex', color: '#52525b',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {/* Add data */}
          <button className="btn btn-primary" onClick={() => navigate('/collect')} style={{ whiteSpace: 'nowrap' }}>
            + {t2('เพิ่มข้อมูล', 'Add Data')}
          </button>
        </header>

        <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
