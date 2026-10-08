import type { DomainTheme } from '@/lib/domain-themes';

interface DomainBreadcrumbProps {
  domain: string;
  subtopic: string;
  theme: DomainTheme;
}

export function DomainBreadcrumb({ domain, subtopic, theme }: DomainBreadcrumbProps) {
  return (
    <div
      style={{
        minHeight: 38,
        background: theme.breadcrumbBg,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden="true">{theme.domainIcon}</span>
        <span style={{ color: 'rgba(255,255,255,0.85)' }}>{domain}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>›</span>
        <span style={{ fontWeight: 700 }}>{subtopic}</span>
      </div>
    </div>
  );
}

