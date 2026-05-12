'use client';

import type { ContentBlockType } from '@quiz/types';

interface BlockLoadingSkeletonProps {
  blockType: ContentBlockType;
}

const SKELETON_STYLES: Record<ContentBlockType, { accent: string }> = {
  overview: { accent: 'rgba(208, 63, 0, 0.5)' },
  notes: { accent: 'rgba(245, 158, 11, 0.5)' },
  layman: { accent: 'rgba(61, 90, 158, 0.5)' },
  real_life: { accent: 'rgba(46, 125, 70, 0.5)' },
  technical: { accent: 'rgba(230, 81, 0, 0.5)' },
  visual: { accent: 'rgba(37, 99, 235, 0.5)' },
  code: { accent: 'rgba(84, 110, 122, 0.5)' },
  quiz: { accent: 'rgba(244, 63, 94, 0.5)' },
  practice: { accent: 'rgba(79, 70, 229, 0.5)' },
  assignment: { accent: 'rgba(15, 23, 42, 0.5)' },
  project: { accent: 'rgba(124, 58, 237, 0.5)' },
  summary: { accent: 'rgba(20, 184, 166, 0.5)' },
  interview: { accent: 'rgba(234, 88, 12, 0.5)' },
  ai_tutor: { accent: 'rgba(106, 27, 154, 0.5)' },
};

function SkeletonLine({ width, height = 12 }: { width: string; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 999,
        background: 'linear-gradient(90deg, rgba(148, 163, 184, 0.16), rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.16))',
        backgroundSize: '200% 100%',
        animation: 'rth-shimmer 1.2s ease-in-out infinite',
      }}
    />
  );
}

export function BlockLoadingSkeleton({ blockType }: BlockLoadingSkeletonProps) {
  const { accent } = SKELETON_STYLES[blockType] || { accent: 'rgba(148, 163, 184, 0.2)' };

  return (
    <section
      aria-label={`${blockType} loading skeleton`}
      style={{
        padding: 18,
        borderRadius: 18,
        border: 'var(--design-content-border)',
        background: 'var(--design-content-surface)',
        boxShadow: 'var(--design-content-shadow)',
        display: 'grid',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <SkeletonLine width="30%" height={18} />
        <div style={{ width: 92, height: 28, borderRadius: 999, background: accent }} />
      </div>
      <SkeletonLine width="70%" height={12} />
      <SkeletonLine width="88%" height={12} />
      <SkeletonLine width="60%" height={12} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        <div style={{ height: 84, borderRadius: 14, background: accent }} />
        <div style={{ height: 84, borderRadius: 14, background: accent }} />
      </div>
      <style jsx>{`
        @keyframes rth-shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </section>
  );
}
