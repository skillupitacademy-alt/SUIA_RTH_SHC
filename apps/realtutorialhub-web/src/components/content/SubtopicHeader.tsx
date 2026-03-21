'use client';

import type { DomainTheme } from '@/lib/domain-themes';

interface SubtopicHeaderProps {
  subtopicName: string;
  completedBlocks: number;
  totalBlocks: number;
  theme: DomainTheme;
}

export function SubtopicHeader({ subtopicName, completedBlocks, totalBlocks, theme }: SubtopicHeaderProps) {
  const pct = Math.round((completedBlocks / totalBlocks) * 100);
  const unlocked = completedBlocks >= totalBlocks;

  return (
    <header style={{ marginBottom: 18 }}>
      <h1
        style={{
          margin: '0 0 12px',
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: '-0.05em',
          color: 'var(--block-text-primary)',
          fontFamily: 'Georgia, serif',
        }}
      >
        {subtopicName}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div
          style={{
            flex: '1 1 320px',
            minHeight: 36,
            background: 'var(--tutorial-surface)',
            border: '1px solid var(--tutorial-border)',
            borderRadius: 10,
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: 'var(--tutorial-shadow)',
          }}
        >
          <span aria-hidden="true">✏️</span>
          <span style={{ fontSize: 13, color: 'var(--block-text-secondary)', fontWeight: 600 }}>
            {completedBlocks}/{totalBlocks} Completed
          </span>
          <div style={{ flex: 1, height: 8, borderRadius: 999, background: '#dde1ef', overflow: 'hidden' }}>
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: theme.progressFill,
                transition: 'width 0.35s ease',
              }}
            />
          </div>
          <span aria-hidden="true">⚙️</span>
          <span aria-hidden="true">🔍</span>
        </div>

        <button
          type="button"
          disabled={!unlocked}
          style={{
            padding: '10px 22px',
            borderRadius: 10,
            border: 'none',
            background: theme.quizBtn,
            color: '#ffffff',
            fontWeight: 800,
            fontSize: 14,
            cursor: unlocked ? 'pointer' : 'not-allowed',
            opacity: unlocked ? 1 : 0.5,
            boxShadow: '0 2px 8px rgba(245,124,0,0.35)',
            whiteSpace: 'nowrap',
          }}
          title={unlocked ? 'Take the quiz' : 'Complete all 6 blocks to unlock the quiz'}
        >
          Take Quiz
        </button>
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--block-text-secondary)' }}>
        Progress: {pct}% complete
      </div>
    </header>
  );
}
