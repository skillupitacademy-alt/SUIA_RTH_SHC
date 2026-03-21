import type { ReactNode } from 'react';

interface BlockHeaderProps {
  icon: string;
  title: string;
  accentColor: string;
  badge?: string;
  badgeTone?: 'success' | 'neutral';
  children?: ReactNode;
}

export function BlockHeader({ icon, title, accentColor, badge, badgeTone = 'neutral', children }: BlockHeaderProps) {
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
        borderBottom: '1px solid var(--tutorial-border)',
        color: accentColor,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>
          {icon}
        </span>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em' }}>{title}</h2>
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

