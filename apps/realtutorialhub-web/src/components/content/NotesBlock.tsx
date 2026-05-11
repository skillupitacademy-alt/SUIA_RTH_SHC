'use client';

import { useTranslations } from 'next-intl';
import type React from 'react';
import type { ContentImage as ContentImageType, TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { ContentImage } from './ContentImage';

import { NotesModularRenderer } from './modular/notes/NotesModularRenderer';

interface NotesBlockProps {
  data: TutorialContentJSON['notes'] | null | undefined;
  theme: {
    blockNotes: string;
    blockNotesHeader: string;
  };
}

export function NotesBlock({ data, theme }: NotesBlockProps) {
  const t = useTranslations('blocks.notes');
  
  if (!data) return null;

  // Check if we are using the new modular format
  const isModular = 'coreDefinition' in data;

  if (isModular) {
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
          <NotesModularRenderer
            data={data as React.ComponentProps<typeof NotesModularRenderer>['data']}
            themeColor={theme.blockNotesHeader}
          />
        </div>
      </section>
    );
  }

  // Legacy Markdown Fallback (typed view to avoid explicit `any`)
  const legacyData = data as {
    markdown: string;
    image?: ContentImageType;
  };

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
          {legacyData.markdown}
        </div>
        {legacyData.image ? (
          <div style={{ marginTop: 16 }}>
            <ContentImage image={legacyData.image} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
