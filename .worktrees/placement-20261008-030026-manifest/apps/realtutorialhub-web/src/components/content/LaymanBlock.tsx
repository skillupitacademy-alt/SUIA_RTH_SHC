'use client';

import { useTranslations } from 'next-intl';
import type React from 'react';
import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { ContentImage } from './ContentImage';
import { LaymanModularRenderer } from './modular/layman/LaymanModularRenderer';

interface LaymanBlockProps {
  data: TutorialContentJSON['layman'] | null | undefined;
  theme: {
    blockLayman: string;
    blockLaymanHeader: string;
  };
  isCompleted?: boolean;
}

export function LaymanBlock({ data, theme, isCompleted = false }: LaymanBlockProps) {
  const t = useTranslations('blocks.layman');
  const common = useTranslations('common');

  if (!data) return null;

  // Check for Modular Format (support both snake_case from DB and camelCase)
  const isModular = 'simpleOverview' in data || 'simple_overview' in data || 'analogy_card' in data || 'intro_card' in data;

  if (isModular) {
    return (
      <section className="design-panel" aria-label={t('ariaLabel')}>
        <BlockHeader
          icon="L"
          title={t('title')}
          accentColor={theme.blockLaymanHeader}
          badge={isCompleted ? common('completed') : common('plainEnglish')}
          badgeTone={isCompleted ? 'success' : 'neutral'}
          headingId="block-layman-heading"
        />
        <div
          style={{
            padding: 18,
            background: 'var(--design-content-surface)',
            borderTop: 'var(--design-content-border)',
          }}
        >
          <LaymanModularRenderer
            data={data as React.ComponentProps<typeof LaymanModularRenderer>['data']}
            themeColor={theme.blockLaymanHeader}
          />
        </div>
      </section>
    );
  }

  // Legacy Fallback (typed view to avoid explicit `any`)
  const safeData = data as unknown as {
    simpleExplanation?: string;
    image?: import('@quiz/types').ContentImage;
    analogyOrStory?: string;
    example1?: { company?: string; content?: string };
    example2?: { company?: string; content?: string };
  };

  return (
    <section className="design-panel" aria-label={t('ariaLabel')}>
      <BlockHeader
        icon="L"
        title={t('title')}
        accentColor={theme.blockLaymanHeader}
        badge={isCompleted ? common('completed') : common('plainEnglish')}
        badgeTone={isCompleted ? 'success' : 'neutral'}
        headingId="block-layman-heading"
      />
      <div
        style={{
          padding: 18,
          background: 'var(--design-content-surface)',
          borderTop: 'var(--design-content-border)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 20, alignItems: 'start' }}>
          <div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: 'var(--block-text-primary)' }}>
              {safeData.simpleExplanation}
            </p>
            <div
              style={{
                marginTop: 14,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'var(--design-content-surface-soft)',
                border: 'var(--design-content-border)',
                boxShadow: 'var(--design-content-shadow)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: theme.blockLaymanHeader, marginBottom: 6 }}>
                {common('analogy')}
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--block-text-secondary)', fontStyle: 'italic' }}>
                {safeData.analogyOrStory}
              </div>
            </div>
          </div>

          {safeData.image ? (
            <ContentImage image={safeData.image} />
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: 180,
                minHeight: 140,
                borderRadius: 16,
                background: 'var(--design-content-surface-soft)',
                border: 'var(--design-content-border)',
              }}
            />
          )}
        </div>

        <div
          style={{
            marginTop: 18,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 12,
          }}
        >
          {[safeData.example1, safeData.example2].map((example, index) => (
            <article
              key={example?.company}
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: index === 0 ? 'var(--design-content-surface)' : 'var(--design-content-surface-soft)',
                border: 'var(--design-content-border)',
                boxShadow: 'var(--design-content-shadow)',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.blockLaymanHeader, marginBottom: 6 }}>
                {common('example', { index: index + 1 })}: {example?.company}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--block-text-secondary)' }}>{example?.content}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
