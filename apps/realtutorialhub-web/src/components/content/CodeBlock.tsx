'use client';

import { useTranslations } from 'next-intl';
import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { ContentImage } from './ContentImage';

interface CodeBlockProps {
  data: TutorialContentJSON['code'];
  theme: {
    blockCode: string;
    blockCodeHeader: string;
  };
}

export function CodeBlock({ data, theme }: CodeBlockProps) {
  const t = useTranslations('blocks.code');
  const common = useTranslations('common');

  return (
    <section className="design-panel" aria-label={t('ariaLabel')}>
      <BlockHeader icon="C" title={`${t('title')} (${data.language})`} accentColor={theme.blockCodeHeader} headingId="block-code-heading" />
      <div
        style={{
          padding: 18,
          background: 'var(--block-code-bg, #0d1018)',
          color: '#f7fafc',
          borderTop: 'var(--design-content-border)',
        }}
      >
        <p style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.65 }}>{data.intro}</p>
        <div
          style={{
            padding: 16,
            borderRadius: 14,
            background: 'rgba(8, 13, 24, 0.92)',
            border: '1px solid rgba(255,255,255,0.1)',
            overflowX: 'auto',
          }}
        >
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'Consolas, Monaco, monospace', fontSize: 13, lineHeight: 1.65 }}>
            {data.code}
          </pre>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8, color: 'rgba(255,255,255,0.82)' }}>{common('steps')}</div>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.65, color: 'rgba(255,255,255,0.82)' }}>
            {data.steps.map((step) => (
              <li key={step} style={{ marginBottom: 6 }}>
                {step}
              </li>
            ))}
          </ol>
        </div>
        {data.image ? (
          <div style={{ marginTop: 16 }}>
            <ContentImage image={data.image} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
