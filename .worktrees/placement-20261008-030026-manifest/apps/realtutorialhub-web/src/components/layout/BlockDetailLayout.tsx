import type { ReactNode } from 'react';

import type { DomainTheme } from '@/lib/domain-themes';

import { DomainBreadcrumb } from './DomainBreadcrumb';
import { TutorialNavbar } from './TutorialNavbar';

interface BlockDetailLayoutProps {
  domainName: string;
  subtopicName: string;
  theme: DomainTheme;
  children: ReactNode;
}

export function BlockDetailLayout({ domainName, subtopicName, theme, children }: BlockDetailLayoutProps) {
  return (
    <div className="tutorial-scaffold" style={{ background: 'var(--tutorial-page-bg)' }}>
      <TutorialNavbar />
      <DomainBreadcrumb domain={domainName} subtopic={subtopicName} theme={theme} />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>{children}</main>
    </div>
  );
}

