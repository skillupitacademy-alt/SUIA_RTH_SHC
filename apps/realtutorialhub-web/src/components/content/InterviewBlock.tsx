'use client';

import { useTranslations } from 'next-intl';
import type { TutorialContentJSON } from '@quiz/types';

import { InterviewPrepContent } from '@/share-branding/TutorialEngine/components/notes/InterviewPrepContent';

import { BlockHeader } from './BlockHeader';

interface InterviewBlockProps {
  data: TutorialContentJSON['interview'] | null | undefined;
  theme: {
    blockInterview: string;
    blockInterviewHeader: string;
  };
  subtopicName?: string;
}

export function InterviewBlock({ data, theme, subtopicName = 'this topic' }: InterviewBlockProps) {
  const t = useTranslations('blocks.interview');

  if (!data) return null;

  return (
    <section className="design-panel" aria-label={t('ariaLabel')}>
      <BlockHeader icon="I" title={t('title')} accentColor={theme.blockInterviewHeader} headingId="block-interview-heading" />
      <div
        style={{
          padding: 18,
          background: 'var(--design-content-surface)',
          borderTop: 'var(--design-content-border)',
        }}
      >
        <InterviewPrepContent data={data as never} title={subtopicName} />
      </div>
    </section>
  );
}
