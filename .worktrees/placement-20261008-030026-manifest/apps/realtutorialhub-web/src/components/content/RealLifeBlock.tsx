'use client';

import { useTranslations } from 'next-intl';
import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { ContentImage } from './ContentImage';
import { RealLifeModularRenderer } from './modular/reallife/RealLifeModularRenderer';
import type React from 'react';

type RealLifeLegacyBullet = { label?: string; detail?: string };
type RealLifeLegacyData = {
  title?: string;
  scenario?: string;
  bullets?: RealLifeLegacyBullet[];
  image?: import('@quiz/types').ContentImage;
  tip?: string;
};

interface RealLifeBlockProps {
  data: TutorialContentJSON['real_life'] | null | undefined;
  theme: {
    blockRealLife: string;
    blockRealLifeHeader: string;
  };
}

export function RealLifeBlock({ data, theme }: RealLifeBlockProps) {
  const t = useTranslations('blocks.real_life');
  const common = useTranslations('common');

  if (!data) return null;

  // Check for Modular Format (support both snake_case and camelCase)
  const isModular = 'conceptMapping' in data || 'concept_mapping' in data || 'industry_scenario' in data;

  if (isModular) {
    return (
      <section className="design-panel" aria-label={t('ariaLabel')}>
        <BlockHeader icon="R" title={t('title')} accentColor={theme.blockRealLifeHeader} headingId="block-reallife-heading" />
        <div
          style={{
            padding: 18,
            background: 'var(--design-content-surface)',
            borderTop: 'var(--design-content-border)',
          }}
        >
          <RealLifeModularRenderer
            data={data as React.ComponentProps<typeof RealLifeModularRenderer>['data']}
            themeColor={theme.blockRealLifeHeader}
          />
        </div>
      </section>
    );
  }

  // Legacy Fallback (typed view to avoid explicit `any`)
  const safeData = data as unknown as RealLifeLegacyData;

  return (
    <section className="design-panel" aria-label={t('ariaLabel')}>
      <BlockHeader icon="R" title={t('title')} accentColor={theme.blockRealLifeHeader} headingId="block-reallife-heading" />
      <div
        style={{
          padding: 18,
          background: 'var(--design-content-surface)',
          borderTop: 'var(--design-content-border)',
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: theme.blockRealLifeHeader, marginBottom: 4, textTransform: 'uppercase' }}>
            {safeData.title}
          </div>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: 'var(--block-text-primary)' }}>{safeData.scenario}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {safeData.bullets?.map((bullet, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'var(--design-content-surface-soft)',
                  border: 'var(--design-content-border)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--block-text-primary)', marginBottom: 2 }}>{bullet.label}</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--block-text-secondary)' }}>{bullet.detail}</div>
              </div>
            ))}
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
            padding: '14px 16px',
            borderRadius: 12,
            background: 'var(--design-content-surface)',
            border: '1px solid var(--design-content-border)',
            borderLeft: `4px solid ${theme.blockRealLifeHeader}`,
          }}
        >
          <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.blockRealLifeHeader, marginBottom: 4 }}>{common('proTip')}</div>
          <div style={{ fontSize: 13.5, color: 'var(--block-text-primary)' }}>{safeData.tip}</div>
        </div>
      </div>
    </section>
  );
}
