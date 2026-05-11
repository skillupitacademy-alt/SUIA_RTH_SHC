'use client';

import { useTranslations } from 'next-intl';
import type React from 'react';
import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { AssignmentModularRenderer } from './modular/assignment/AssignmentModularRenderer';

interface AssignmentBlockProps {
  data: TutorialContentJSON['assignment'] | null | undefined;
  theme: {
    blockAssignment: string;
    blockAssignmentHeader: string;
  };
}

export function AssignmentBlock({ data, theme }: AssignmentBlockProps) {
  const t = useTranslations('blocks.assignment');
  const common = useTranslations('common');

  if (!data) return null;

  return (
    <section className="design-panel" aria-label={t('ariaLabel')}>
      <BlockHeader
        icon="A"
        title={t('title')}
        accentColor={theme.blockAssignmentHeader}
        badge={common('assignment')}
        badgeTone="neutral"
        headingId="block-assignment-heading"
      />
      <div
        style={{
          padding: 18,
          background: 'var(--design-content-surface)',
          borderTop: 'var(--design-content-border)',
        }}
      >
        <AssignmentModularRenderer
          data={data as React.ComponentProps<typeof AssignmentModularRenderer>['data']}
          themeColor={theme.blockAssignmentHeader}
        />
      </div>
    </section>
  );
}