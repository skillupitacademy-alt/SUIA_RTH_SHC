'use client';

import { useTranslations } from 'next-intl';
import type React from 'react';
import type { ContentImage as ContentImageType, TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { ContentImage } from './ContentImage';
import { CodeModularRenderer } from './modular/code/CodeModularRenderer';

interface CodeBlockProps {
  data: TutorialContentJSON['code'] | null | undefined;
  theme: {
    blockCode: string;
    blockCodeHeader: string;
  };
}

export function CodeBlock({ data, theme }: CodeBlockProps) {
  const t = useTranslations('blocks.code');

  if (!data) return null;

  // Check for Modular Format (support both snake_case and camelCase)
  const isModular = 'problemContext' in data || 'problem_context' in data || 'problem_context_card' in data;

  if (isModular) {
    return (
      <section className="design-panel" aria-label={t('ariaLabel')}>
        <BlockHeader icon="C" title={t('title')} accentColor={theme.blockCodeHeader} headingId="block-code-heading" />
        <div
          style={{
            padding: 18,
            background: 'var(--design-content-surface)',
            borderTop: 'var(--design-content-border)',
          }}
        >
          <CodeModularRenderer
            data={data as React.ComponentProps<typeof CodeModularRenderer>['data']}
            themeColor={theme.blockCodeHeader}
          />
        </div>
      </section>
    );
  }

  // Legacy Fallback (typed view to avoid explicit `any`)
  const safeData = data as unknown as {
    title?: string;
    explanation?: string;
    image?: ContentImageType;
    language?: string;
    code?: string;
  };

  return (
    <section className="design-panel" aria-label={t('ariaLabel')}>
      <BlockHeader icon="C" title={t('title')} accentColor={theme.blockCodeHeader} headingId="block-code-heading" />
      <div
        style={{
          padding: 18,
          background: 'var(--design-content-surface)',
          borderTop: 'var(--design-content-border)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 20, alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: theme.blockCodeHeader, marginBottom: 4, textTransform: 'uppercase' }}>
              {safeData.title}
            </div>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: 'var(--block-text-primary)' }}>
              {safeData.explanation}
            </p>
          </div>
          {safeData.image ? <ContentImage image={safeData.image} /> : null}
        </div>

        <div
          style={{
            marginTop: 18,
            borderRadius: 16,
            background: '#0f172a',
            border: '1px solid #1e293b',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>{safeData.language || 'JAVASCRIPT'}</span>
          </div>
          <pre style={{ margin: 0, padding: 18, fontSize: 13.5, lineHeight: 1.6, overflowX: 'auto', color: '#f8fafc' }}>
            <code>{safeData.code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
