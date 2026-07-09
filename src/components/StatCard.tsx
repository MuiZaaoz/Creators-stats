import React from 'react';
import { fmt } from '../lib/utils';

interface Props {
  label: string;
  value: number | null | undefined;
  color?: string;
  sub?: string;
  currency?: boolean;
}

export default function StatCard({ label, value, color, sub, currency }: Props) {
  const display = currency ? '$' + fmt(value) : fmt(value);
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value num" style={color ? { color } : {}}>{display}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
