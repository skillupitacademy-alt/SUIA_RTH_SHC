'use client';

import { useTranslations } from 'next-intl';
import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { ContentImage } from './ContentImage';

interface NotesBlockProps {
  data: TutorialContentJSON['notes'] | null | undefined;
  theme: {
    blockNotes: string;
    blockNotesHeader: string;
  };
}

export function NotesBlock({ data, theme }: NotesBlockProps) {
  const t = useTranslations('blocks.notes');
  const safeData = data ?? { markdown: '', image: null };

  return (
    <section className="design-panel" aria-label={t('ariaLabel')}>
      <BlockHeader icon="N" title={t('title')} accentColor={theme.blockNotesHeader} headingId="block-notes-heading" />
      <div
        style={{
          padding: 18,
          background: 'var(--design-content-surface)',
          borderTop: 'var(--design-content-border)',
        }}
      >
        <div
          style={{
          color: 'var(--block-text-primary)',
          fontSize: 14,
          lineHeight: 1.75,
          whiteSpace: 'pre-wrap',
        }}
      >
          {safeData.markdown}
        </div>
        {safeData.image ? (
          <div style={{ marginTop: 16 }}>
            <ContentImage image={safeData.image} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
