'use client';

import { useTranslations } from 'next-intl';
import type React from 'react';
import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { PracticeModularRenderer } from './modular/practice/PracticeModularRenderer';

interface PracticeBlockProps {
  data: TutorialContentJSON['practice'] | null | undefined;
  theme: {
    blockPractice: string;
    blockPracticeHeader: string;
  };
}

export function PracticeBlock({ data, theme }: PracticeBlockProps) {
  const t = useTranslations('blocks.practice');
  const common = useTranslations('common');

  if (!data) return null;

  return (
    <section className="design-panel" aria-label={t('ariaLabel')}>
      <BlockHeader
        icon="P"
        title={t('title')}
        accentColor={theme.blockPracticeHeader}
        badge={common('practice')}
        badgeTone="neutral"
        headingId="block-practice-heading"
      />
      <div
        style={{
          padding: 18,
          background: 'var(--design-content-surface)',
          borderTop: 'var(--design-content-border)',
        }}
      >
        <PracticeModularRenderer
          data={data as React.ComponentProps<typeof PracticeModularRenderer>['data']}
          themeColor={theme.blockPracticeHeader}
        />
      </div>
    </section>
  );
}