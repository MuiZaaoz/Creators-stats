import React from 'react';
import { fmt } from '../lib/utils';

interface Props {
  label: string;
  value: number | string | null | undefined;
  color?: string;
  sub?: string;
  currency?: boolean;
  growth?: number;        // e.g. 12.6  -> ▲ +12.6%
  growthLabel?: string;
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, color, sub, currency, growth, growthLabel, icon }: Props) {
  const display = typeof value === 'string'
    ? value
    : (currency ? '฿' + fmt(value) : fmt(value));
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="stat-label">{label}</div>
        {icon && <span style={{ color: 'var(--text3)' }}>{icon}</span>}
      </div>
      <div className="stat-value num" style={color ? { color } : {}}>{display}</div>
      {growth != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span className={'growth ' + (growth >= 0 ? 'up' : 'down')}>
            {growth >= 0 ? '▲' : '▼'} {growth >= 0 ? '+' : ''}{growth}%
          </span>
          {growthLabel && <span className="stat-sub">{growthLabel}</span>}
        </div>
      )}
      {sub && !growth && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
