'use client';

import { useTranslations } from 'next-intl';
import type React from 'react';
import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { QuizModularRenderer } from './modular/quiz/QuizModularRenderer';

interface QuizBlockProps {
  data: TutorialContentJSON['quiz'] | null | undefined;
  theme: {
    blockQuiz: string;
    blockQuizHeader: string;
  };
}

export function QuizBlock({ data, theme }: QuizBlockProps) {
  const t = useTranslations('blocks.quiz');
  const common = useTranslations('common');

  if (!data) return null;

  return (
    <section className="design-panel" aria-label={t('ariaLabel')}>
      <BlockHeader
        icon="Q"
        title={t('title')}
        accentColor={theme.blockQuizHeader}
        badge={common('quiz')}
        badgeTone="neutral"
        headingId="block-quiz-heading"
      />
      <div
        style={{
          padding: 18,
          background: 'var(--design-content-surface)',
          borderTop: 'var(--design-content-border)',
        }}
      >
        <QuizModularRenderer
          data={data as React.ComponentProps<typeof QuizModularRenderer>['data']}
          themeColor={theme.blockQuizHeader}
        />
      </div>
    </section>
  );
}