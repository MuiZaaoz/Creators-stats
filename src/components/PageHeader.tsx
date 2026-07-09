import React from 'react';

interface Props {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

// Page titles now live in the Layout topbar (per the design prototype).
// This component only renders page-level action buttons, right-aligned.
export default function PageHeader({ actions }: Props) {
  if (!actions) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
      {actions}
    </div>
  );
}
