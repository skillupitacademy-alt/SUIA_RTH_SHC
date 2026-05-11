'use client';

import { useTranslations } from 'next-intl';
import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { ContentImage } from './ContentImage';
import { TechnicalModularRenderer } from './modular/technical/TechnicalModularRenderer';
import type React from 'react';

type TechnicalLegacyPoint = { label?: string; detail?: string };
type TechnicalLegacyData = {
  concept?: string;
  deepExplanation?: string;
  image?: import('@quiz/types').ContentImage;
  advancedPoints?: TechnicalLegacyPoint[];
};

interface TechnicalBlockProps {
  data: TutorialContentJSON['technical'] | null | undefined;
  theme: {
    blockTechnical: string;
    blockTechnicalHeader: string;
  };
}

export function TechnicalBlock({ data, theme }: TechnicalBlockProps) {
  const t = useTranslations('blocks.technical');

  if (!data) return null;

  // Check for Modular Format
  const isModular = 'coreTechnicalDefinition' in data;

  if (isModular) {
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
          <TechnicalModularRenderer
            data={data as React.ComponentProps<typeof TechnicalModularRenderer>['data']}
            themeColor={theme.blockTechnicalHeader}
          />
        </div>
      </section>
    );
  }

  // Legacy Fallback (typed view to avoid explicit `any`)
  const safeData = data as unknown as TechnicalLegacyData;

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
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 20, alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: theme.blockTechnicalHeader, marginBottom: 4, textTransform: 'uppercase' }}>
              {safeData.concept}
            </div>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: 'var(--block-text-primary)' }}>
              {safeData.deepExplanation}
            </p>
          </div>
          {safeData.image ? <ContentImage image={safeData.image} /> : null}
        </div>

        <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
          {safeData.advancedPoints?.map((point, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: 'var(--design-content-surface-soft)',
                border: 'var(--design-content-border)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--block-text-primary)', marginBottom: 2 }}>{point.label}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--block-text-secondary)' }}>{point.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
