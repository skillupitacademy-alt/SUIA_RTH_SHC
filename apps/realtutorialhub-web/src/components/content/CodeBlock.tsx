'use client';

import { useTranslations } from 'next-intl';
import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { ContentImage } from './ContentImage';

interface CodeBlockProps {
  data: TutorialContentJSON['code'] | null | undefined;
  theme: {
    blockCode: string;
    blockCodeHeader: string;
  };
  onCopied?: () => void;
}

export function CodeBlock({ data, theme, onCopied }: CodeBlockProps) {
  const t = useTranslations('blocks.code');
  const common = useTranslations('common');
  const safeData = data ?? {
    language: 'javascript' as const,
    intro: '',
    code: '',
    steps: [],
    image: null,
  };

  return (
    <section className="design-panel" aria-label={t('ariaLabel')}>
      <BlockHeader icon="C" title={`${t('title')} (${safeData.language})`} accentColor={theme.blockCodeHeader} headingId="block-code-heading" />
      <div
        style={{
          padding: 18,
          background: 'var(--block-code-bg, #0d1018)',
          color: '#f7fafc',
          borderTop: 'var(--design-content-border)',
        }}
      >
        <p style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.65 }}>{safeData.intro}</p>
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
            {safeData.code}
          </pre>
        </div>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(safeData.code).catch(() => undefined);
            onCopied?.();
          }}
          style={{
            marginTop: 12,
            border: 'none',
            borderRadius: 10,
            padding: '9px 12px',
            background: theme.blockCodeHeader,
            color: '#fff',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Copy code
        </button>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8, color: 'rgba(255,255,255,0.82)' }}>{common('steps')}</div>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.65, color: 'rgba(255,255,255,0.82)' }}>
            {safeData.steps.map((step) => (
              <li key={step} style={{ marginBottom: 6 }}>
                {step}
              </li>
            ))}
          </ol>
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
