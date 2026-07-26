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
  
  if (!data) {
    return (
      <section className="design-panel" aria-label={t('ariaLabel')}>
        <BlockHeader icon="N" title={t('title')} accentColor={theme.blockNotesHeader} headingId="block-notes-heading" />
      </section>
    );
  }

  // Canonical modular Notes payload. Old aliases are intentionally not accepted here.
  const isModular =
    'concept_card' in data ||
    'definition_block' in data ||
    'component_grid' in data ||
    'syntax_block' in data ||
    'example_panel' in data ||
    'practice_card' in data ||
    'warning_faq' in data ||
    'summary_card' in data;

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
