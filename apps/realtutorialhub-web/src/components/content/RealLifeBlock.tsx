import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { ContentImage } from './ContentImage';

interface RealLifeBlockProps {
  data: TutorialContentJSON['real_life'];
  theme: {
    blockRealLife: string;
    blockRealLifeHeader: string;
  };
}

export function RealLifeBlock({ data, theme }: RealLifeBlockProps) {
  return (
    <section className="design-panel" aria-label="Real life block">
      <BlockHeader icon="🧭" title={data.title} accentColor={theme.blockRealLifeHeader} />
      <div
        style={{
          padding: 18,
          background: 'var(--design-content-surface)',
          borderTop: 'var(--design-content-border)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 16, alignItems: 'start' }}>
          <div>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: 'var(--block-text-primary)' }}>
              {data.scenario}
            </p>
            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
              {data.bullets.map((bullet) => (
                <div
                  key={bullet.label}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'var(--design-content-surface-soft)',
                    border: 'var(--design-content-border)',
                    boxShadow: 'var(--design-content-shadow)',
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.blockRealLifeHeader, marginBottom: 4 }}>
                    {bullet.label}
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
                borderLeft: `4px solid ${theme.blockRealLifeHeader}`,
                color: 'var(--block-text-secondary)',
                fontSize: 13,
                boxShadow: 'var(--design-content-shadow)',
              }}
            >
              <strong style={{ color: theme.blockRealLifeHeader }}>Tip:</strong> {data.tip}
            </div>
          </div>

          {data.image ? <ContentImage image={data.image} /> : null}
        </div>
      </div>
    </section>
  );
}
