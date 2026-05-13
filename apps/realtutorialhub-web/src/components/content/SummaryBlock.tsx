'use client';

import { useTranslations } from 'next-intl';
import type { TutorialContentJSON } from '@quiz/types';

import { SummaryContent } from '@/share-branding/TutorialEngine/components/notes/SummaryContent';

import { BlockHeader } from './BlockHeader';

interface SummaryBlockProps {
  data: TutorialContentJSON['summary'] | null | undefined;
  theme: {
    blockSummary: string;
    blockSummaryHeader: string;
  };
  subtopicName?: string;
}

export function SummaryBlock({ data, theme, subtopicName = 'this topic' }: SummaryBlockProps) {
  const t = useTranslations('blocks.summary');

  if (!data) return null;

  return (
    <section className="design-panel" aria-label={t('ariaLabel')}>
      <BlockHeader icon="S" title={t('title')} accentColor={theme.blockSummaryHeader} headingId="block-summary-heading" />
      <div
        style={{
          padding: 18,
          background: 'var(--design-content-surface)',
          borderTop: 'var(--design-content-border)',
        }}
      >
        <SummaryContent data={data as never} title={subtopicName} />
      </div>
    </section>
  );
}
