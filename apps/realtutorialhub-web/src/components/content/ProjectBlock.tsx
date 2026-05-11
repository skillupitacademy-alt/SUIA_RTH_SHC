'use client';

import { useTranslations } from 'next-intl';
import type React from 'react';
import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { ProjectModularRenderer } from './modular/project/ProjectModularRenderer';

interface ProjectBlockProps {
  data: TutorialContentJSON['project'] | null | undefined;
  theme: {
    blockProject: string;
    blockProjectHeader: string;
  };
}

export function ProjectBlock({ data, theme }: ProjectBlockProps) {
  const t = useTranslations('blocks.project');
  const common = useTranslations('common');

  if (!data) return null;

  return (
    <section className="design-panel" aria-label={t('ariaLabel')}>
      <BlockHeader
        icon="Pr"
        title={t('title')}
        accentColor={theme.blockProjectHeader}
        badge={common('project')}
        badgeTone="neutral"
        headingId="block-project-heading"
      />
      <div
        style={{
          padding: 18,
          background: 'var(--design-content-surface)',
          borderTop: 'var(--design-content-border)',
        }}
      >
        <ProjectModularRenderer
          data={data as React.ComponentProps<typeof ProjectModularRenderer>['data']}
          themeColor={theme.blockProjectHeader}
        />
      </div>
    </section>
  );
}