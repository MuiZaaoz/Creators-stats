import React from 'react';
import Header from './Header';

interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />
      {actions && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '14px 28px 0' }}>
          {actions}
        </div>
      )}
    </>
  );
}
