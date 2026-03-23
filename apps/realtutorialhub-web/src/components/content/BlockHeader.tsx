'use client';

import type { ReactNode } from 'react';

interface BlockHeaderProps {
  icon: string;
  title: string;
  accentColor: string;
  badge?: string;
  badgeTone?: 'success' | 'neutral';
  headingId?: string;
  children?: ReactNode;
}

export function BlockHeader({ icon, title, accentColor, badge, badgeTone = 'neutral', headingId, children }: BlockHeaderProps) {
  const badgeBg = badgeTone === 'success' ? 'rgba(46, 125, 70, 0.12)' : 'rgba(255, 255, 255, 0.24)';
  const badgeColor = badgeTone === 'success' ? '#2e7d46' : 'inherit';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '14px 18px',
        borderBottom: 'var(--design-header-border)',
        background: 'var(--design-header-bg)',
        backdropFilter: 'var(--design-backdrop)',
        WebkitBackdropFilter: 'var(--design-backdrop)',
        color: accentColor,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>
          {icon}
        </span>
        <h2
          id={headingId}
          tabIndex={-1}
          style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', fontFamily: 'var(--design-heading-font)' }}
        >
          {title}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {badge ? (
          <span
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              background: badgeBg,
              color: badgeColor,
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {badge}
          </span>
        ) : null}
        {children}
      </div>
    </div>
  );
}
