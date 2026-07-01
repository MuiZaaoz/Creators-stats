import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';
import { api } from '../lib/api';
import PageHeader from '../components/PageHeader';

export default function Profile() {
  const { lang, currentUser } = useAppStore();
  const t = useT(lang);
  const [form, setForm] = useState({
    name: currentUser.name,
    role: currentUser.role,
    email: 'admin@creatorhub.th',
    username: 'admin',
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: '20px 28px', flex: 1 }}>
      <PageHeader title={t('profile')} />

      <div style={{ maxWidth: 480 }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: '#fff',
          }}>
            {currentUser.name[0]}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{currentUser.name}</div>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 8 }}>{currentUser.role}</div>
            <button className="btn btn-secondary" style={{ fontSize: 12 }}>
              {lang === 'th' ? 'เปลี่ยนรูป' : 'Change Avatar'}
            </button>
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>{lang === 'th' ? 'ข้อมูลส่วนตัว' : 'Personal Info'}</div>
          <div className="form-group">
            <label>{t('name')}</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={form.email} disabled style={{ opacity: 0.6 }} />
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
              {lang === 'th' ? 'แก้ไขได้โดย Admin เท่านั้น' : 'Can only be changed by Admin'}
            </div>
          </div>
          <div className="form-group">
            <label>Username</label>
            <input value={form.username} disabled style={{ opacity: 0.6 }} />
          </div>
          <div className="form-group">
            <label>{t('role')}</label>
            <input value={form.role} disabled style={{ opacity: 0.6 }} />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <button className="btn btn-primary" onClick={save}>{t('save')}</button>
            {saved && <span style={{ fontSize: 12, color: 'var(--green)' }}>✓ {lang === 'th' ? 'บันทึกแล้ว' : 'Saved'}</span>}
          </div>
        </div>

        <ChangePassword lang={lang} username={form.username} />
      </div>
    </div>
  );
}

function ChangePassword({ lang, username }: { lang: string; username: string }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setMsg(null);
    if (next.length < 6) { setMsg({ ok: false, text: lang === 'th' ? 'รหัสผ่านใหม่ต้องยาว 6 ตัวขึ้นไป' : 'Min 6 characters' }); return; }
    if (next !== confirm) { setMsg({ ok: false, text: lang === 'th' ? 'รหัสผ่านยืนยันไม่ตรงกัน' : 'Passwords do not match' }); return; }
    setBusy(true);
    try {
      await api.users.changePassword({ username, current_password: cur, new_password: next });
      setMsg({ ok: true, text: lang === 'th' ? 'เปลี่ยนรหัสผ่านสำเร็จ' : 'Password changed' });
      setCur(''); setNext(''); setConfirm('');
    } catch (e: any) {
      setMsg({ ok: false, text: lang === 'th' ? 'รหัสผ่านเดิมไม่ถูกต้อง หรือเกิดข้อผิดพลาด' : 'Wrong current password' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 16 }}>{lang === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}</div>
      <div className="form-group">
        <label>{lang === 'th' ? 'รหัสผ่านเดิม' : 'Current Password'}</label>
        <input type="password" placeholder="••••••••" value={cur} onChange={e => setCur(e.target.value)} />
      </div>
      <div className="form-group">
        <label>{lang === 'th' ? 'รหัสผ่านใหม่' : 'New Password'}</label>
        <input type="password" placeholder="••••••••" value={next} onChange={e => setNext(e.target.value)} />
      </div>
      <div className="form-group">
        <label>{lang === 'th' ? 'ยืนยันรหัสผ่าน' : 'Confirm Password'}</label>
        <input type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn btn-secondary" onClick={submit} disabled={busy}>{lang === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}</button>
        {msg && <span style={{ fontSize: 12, color: msg.ok ? 'var(--green)' : 'var(--red)' }}>{msg.ok ? '✓ ' : ''}{msg.text}</span>}
      </div>
    </div>
  );
}
