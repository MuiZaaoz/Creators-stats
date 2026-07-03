import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import PageHeader from '../components/PageHeader';

const PAGES = ['dashboard', 'creators', 'programs', 'collect', 'editor', 'analytics', 'export', 'games', 'rewards', 'settings'];

export default function Settings() {
  const { lang } = useAppStore();
  const t = useT(lang);
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [editRole, setEditRole] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const load = async () => {
    const [u, r] = await Promise.all([api.users.list(), api.users.roles()]);
    setUsers(u);
    setRoles(r);
  };

  useEffect(() => { load(); }, []);

  const TABS = [
    { key: 'users', label: lang === 'th' ? 'จัดการผู้ใช้' : 'User Management' },
    { key: 'roles', label: lang === 'th' ? 'Role & สิทธิ์' : 'Roles & Permissions' },
  ];

  return (
    <div style={{ padding: '20px 28px', flex: 1 }}>
      <PageHeader title={t('settings')} />

      <div className="tab-bar">
        {TABS.map(tab => (
          <button key={tab.key}
            className={'tab-btn' + (activeTab === tab.key ? ' active' : '')}
            onClick={() => setActiveTab(tab.key as any)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button className="btn btn-primary" onClick={() => setShowUserModal(true)}>+ {lang === 'th' ? 'เพิ่มผู้ใช้' : 'Add User'}</button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>{t('name')}</th>
                  <th>{lang === 'th' ? 'Username' : 'Username'}</th>
                  <th>Email</th>
                  <th>{t('role')}</th>
                  <th>{t('status')}</th>
                  <th>{lang === 'th' ? 'เข้าสู่ระบบล่าสุด' : 'Last Login'}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>@{u.username}</td>
                    <td style={{ fontSize: 12 }}>{u.email}</td>
                    <td>
                      <span className="badge" style={{
                        background: u.role === 'Admin' ? '#7c5cff22' : 'var(--surface2)',
                        color: u.role === 'Admin' ? '#7c5cff' : 'var(--text2)',
                      }}>{u.role}</span>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: u.status === 'active' ? '#14532d22' : '#7f1d1d22',
                        color: u.status === 'active' ? 'var(--green)' : 'var(--red)',
                      }}>
                        {u.status === 'active' ? (lang === 'th' ? 'ใช้งาน' : 'Active') : (lang === 'th' ? 'ปิด' : 'Inactive')}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text2)' }}>{u.last_login || '-'}</td>
                    <td>
                      <button className="btn btn-ghost" style={{ fontSize: 11 }}
                        onClick={async () => {
                          const newStatus = u.status === 'active' ? 'inactive' : 'active';
                          await api.users.update(u.id, { ...u, status: newStatus });
                          load();
                        }}>
                        {u.status === 'active' ? (lang === 'th' ? 'ปิดการใช้งาน' : 'Disable') : (lang === 'th' ? 'เปิดการใช้งาน' : 'Enable')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {roles.map((r: any) => (
              <button key={r.id}
                onClick={() => setEditRole(r)}
                className="btn"
                style={{
                  background: editRole?.id === r.id ? 'var(--accent)' : 'var(--surface2)',
                  color: editRole?.id === r.id ? '#fff' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}>
                {r.name}
              </button>
            ))}
          </div>

          {editRole && (
            <RoleEditor role={editRole} t={t} lang={lang} onSave={async (perms: any) => {
              await api.users.updateRole(editRole.id, { permissions: perms });
              load();
              const updated = roles.map(r => r.id === editRole.id ? { ...r, permissions: perms } : r);
              setRoles(updated);
              setEditRole({ ...editRole, permissions: perms });
            }} />
          )}
        </div>
      )}

      {showUserModal && (
        <UserModal t={t} lang={lang} roles={roles}
          onClose={() => setShowUserModal(false)}
          onSave={() => { setShowUserModal(false); load(); }} />
      )}
    </div>
  );
}

function RoleEditor({ role, t, lang, onSave }: any) {
  const [perms, setPerms] = useState<any>({ ...role.permissions });
  const [saved, setSaved] = useState(false);

  const LEVEL_COLORS: Record<string, string> = {
    admin: '#7c5cff', edit: '#16a34a', view: '#0ea5e9', off: '#555',
  };

  const setLevel = (page: string, level: string) => {
    setPerms({ ...perms, [page]: level });
    setSaved(false);
  };

  const save = async () => {
    await onSave(perms);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{role.name}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {saved && <span style={{ fontSize: 12, color: 'var(--green)' }}>✓ {lang === 'th' ? 'บันทึกแล้ว' : 'Saved'}</span>}
          <button className="btn btn-primary" onClick={save}>{t('save')}</button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>{lang === 'th' ? 'หน้า' : 'Page'}</th>
            {['admin', 'edit', 'view', 'off'].map(lvl => (
              <th key={lvl} style={{ textAlign: 'center', color: LEVEL_COLORS[lvl] }}>{lvl.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PAGES.map(page => (
            <tr key={page}>
              <td style={{ fontWeight: 600, fontSize: 13 }}>{page}</td>
              {['admin', 'edit', 'view', 'off'].map(lvl => (
                <td key={lvl} style={{ textAlign: 'center' }}>
                  <input type="radio"
                    name={`${role.id}-${page}`}
                    checked={perms[page] === lvl}
                    onChange={() => setLevel(page, lvl)}
                    style={{ accentColor: LEVEL_COLORS[lvl], width: 16, height: 16 }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserModal({ t, lang, roles, onClose, onSave }: any) {
  const [form, setForm] = useState({ name: '', username: '', email: '', role: roles[0]?.name || 'Editor' });

  const save = async () => {
    if (!form.name || !form.username || !form.email) return;
    await api.users.create(form);
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>
          {lang === 'th' ? 'เพิ่มผู้ใช้ใหม่' : 'Add New User'}
        </div>
        {['name', 'username', 'email'].map(field => (
          <div key={field} className="form-group">
            <label>{field}</label>
            <input value={(form as any)[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} />
          </div>
        ))}
        <div className="form-group">
          <label>{t('role')}</label>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            {roles.map((r: any) => <option key={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={save}>{t('save')}</button>
        </div>
      </div>
    </div>
  );
}
