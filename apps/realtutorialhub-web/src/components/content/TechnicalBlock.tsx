'use client';

import { useTranslations } from 'next-intl';
import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { ContentImage } from './ContentImage';

interface TechnicalBlockProps {
  data: TutorialContentJSON['technical'] | null | undefined;
  theme: {
    blockTechnical: string;
    blockTechnicalHeader: string;
  };
}

export function TechnicalBlock({ data, theme }: TechnicalBlockProps) {
  const t = useTranslations('blocks.technical');
  const common = useTranslations('common');
  const safeData = data ?? {
    markdown: '',
    bullets: [],
    tip: '',
    image: null,
  };

  return (
    <section className="design-panel" aria-label={t('ariaLabel')}>
      <BlockHeader icon="T" title={t('title')} accentColor={theme.blockTechnicalHeader} headingId="block-technical-heading" />
      <div
        style={{
          padding: 18,
          background: 'var(--design-content-surface)',
          borderTop: 'var(--design-content-border)',
        }}
      >
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: 'var(--block-text-primary)' }}>{safeData.markdown}</p>
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {safeData.bullets.map((bullet) => (
            <div
              key={bullet.term}
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                background: 'var(--design-content-surface-soft)',
                border: 'var(--design-content-border)',
                boxShadow: 'var(--design-content-shadow)',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.blockTechnicalHeader, marginBottom: 4 }}>
                {bullet.term}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--block-text-secondary)' }}>{bullet.detail}</div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 12,
            background: 'var(--design-content-surface)',
            borderLeft: `4px solid ${theme.blockTechnicalHeader}`,
            color: 'var(--block-text-secondary)',
            fontSize: 13,
            boxShadow: 'var(--design-content-shadow)',
          }}
        >
          <strong style={{ color: theme.blockTechnicalHeader }}>{common('tip')}:</strong> {safeData.tip}
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
