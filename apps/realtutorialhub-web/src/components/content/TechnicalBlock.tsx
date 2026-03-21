import type { TutorialContentJSON } from '@quiz/types';

import { BlockHeader } from './BlockHeader';
import { ContentImage } from './ContentImage';

interface TechnicalBlockProps {
  data: TutorialContentJSON['technical'];
  theme: {
    blockTechnical: string;
    blockTechnicalHeader: string;
  };
}

export function TechnicalBlock({ data, theme }: TechnicalBlockProps) {
  return (
    <section className="design-panel" aria-label="Technical block">
      <BlockHeader icon="⚙️" title="Technical" accentColor={theme.blockTechnicalHeader} />
      <div style={{ padding: 18, background: theme.blockTechnical }}>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: 'var(--block-text-primary)' }}>{data.markdown}</p>
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {data.bullets.map((bullet) => (
            <div
              key={bullet.term}
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.52)',
                border: '1px solid rgba(255,255,255,0.72)',
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
            background: 'rgba(255,255,255,0.7)',
            borderLeft: `4px solid ${theme.blockTechnicalHeader}`,
            color: 'var(--block-text-secondary)',
            fontSize: 13,
          }}
        >
          <strong style={{ color: theme.blockTechnicalHeader }}>Tip:</strong> {data.tip}
        </div>
        {data.image ? <div style={{ marginTop: 16 }}><ContentImage image={data.image} /></div> : null}
      </div>
    </section>
  );
}

