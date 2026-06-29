import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useT } from '../lib/i18n';

interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: Props) {
  const { lang } = useAppStore();
  const t = useT(lang);
  const now = new Date();
  const stamp = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' +
    now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '4px 0 20px', gap: 16, flexWrap: 'wrap',
    }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {actions}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 9, padding: '7px 13px', fontSize: 12.5, color: 'var(--text2)',
          boxShadow: 'var(--shadow)',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)' }} />
          {t('lastUpdate')} <span style={{ color: 'var(--text)', fontWeight: 600 }}>{stamp}</span>
        </div>
        <Link to="/collect" className="btn btn-primary" style={{ padding: '9px 16px' }}>
          + {t('addData')}
        </Link>
      </div>
    </div>
  );
}
