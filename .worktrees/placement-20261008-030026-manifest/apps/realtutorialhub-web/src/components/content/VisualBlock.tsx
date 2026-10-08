'use client';

import { useTranslations } from 'next-intl';
import type React from 'react';
import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { VisualModularRenderer } from './modular/visual/VisualModularRenderer';

interface VisualBlockProps {
  data: TutorialContentJSON['visual'] | null | undefined;
  theme: {
    blockVisual: string;
    blockVisualHeader: string;
  };
}

export function VisualBlock({ data, theme }: VisualBlockProps) {
  const t = useTranslations('blocks.visual');
  const common = useTranslations('common');

  if (!data) return null;

  return (
    <section className="design-panel" aria-label={t('ariaLabel')}>
      <BlockHeader
        icon="V"
        title={t('title')}
        accentColor={theme.blockVisualHeader}
        badge={common('visual')}
        badgeTone="neutral"
        headingId="block-visual-heading"
      />
      <div
        style={{
          padding: 18,
          background: 'var(--design-content-surface)',
          borderTop: 'var(--design-content-border)',
        }}
      >
        <VisualModularRenderer
          data={data as React.ComponentProps<typeof VisualModularRenderer>['data']}
          themeColor={theme.blockVisualHeader}
        />
      </div>
    </section>
  );
}
