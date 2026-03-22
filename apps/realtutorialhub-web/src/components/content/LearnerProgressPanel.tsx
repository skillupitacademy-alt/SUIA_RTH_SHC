'use client';

import { useEffect, useMemo, useState } from 'react';

import type { DomainTheme } from '@/lib/domain-themes';

type BlockType = 'notes' | 'layman' | 'real_life' | 'technical' | 'code' | 'ai_tutor';

interface LearnerProgressPanelProps {
  subtopicId: string;
  subtopicName: string;
  theme: DomainTheme;
  blockOrder: BlockType[];
}

const TRACKING_THRESHOLD = 0.8;
const TRACKING_DELAY_MS = 3000;

function getStorageKey(subtopicId: string): string {
  return `tutorial-progress:${subtopicId}`;
}

function loadCompletedBlocks(subtopicId: string): BlockType[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(getStorageKey(subtopicId));
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is BlockType => typeof item === 'string');
  } catch {
    return [];
  }
}

export function LearnerProgressPanel({ subtopicId, subtopicName, theme, blockOrder }: LearnerProgressPanelProps) {
  const [completedBlocks, setCompletedBlocks] = useState<BlockType[]>([]);
  const [visible, setVisible] = useState(false);

  const completedCount = completedBlocks.length;
  const completionPct = Math.round((completedCount / blockOrder.length) * 100);
  const allBlocksComplete = completedCount === blockOrder.length;

  useEffect(() => {
    setCompletedBlocks(loadCompletedBlocks(subtopicId));
  }, [subtopicId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(getStorageKey(subtopicId), JSON.stringify(completedBlocks));
  }, [completedBlocks, subtopicId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timers = new Map<BlockType, ReturnType<typeof globalThis.setTimeout>>();
    const selectors = blockOrder.map((blockType) => ({ blockType, element: window.document.getElementById(`block-${blockType}`) }));

    const clearTimer = (blockType: BlockType) => {
      const timer = timers.get(blockType);
      if (timer) {
        globalThis.clearTimeout(timer);
        timers.delete(blockType);
      }
    };

    const markComplete = (blockType: BlockType) => {
      setVisible(true);
      setCompletedBlocks((current) => (current.includes(blockType) ? current : [...current, blockType]));
      clearTimer(blockType);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          const blockType = target.dataset.blockType as BlockType | undefined;
          if (!blockType || completedBlocks.includes(blockType)) return;

          if (entry.isIntersecting && entry.intersectionRatio >= TRACKING_THRESHOLD) {
            if (timers.has(blockType)) return;

            timers.set(
              blockType,
              globalThis.setTimeout(() => {
                markComplete(blockType);
              }, TRACKING_DELAY_MS)
            );
          } else {
            clearTimer(blockType);
          }
        });
      },
      { threshold: [0.4, TRACKING_THRESHOLD, 1] }
    );

    selectors.forEach(({ blockType, element }) => {
      if (!element) return;
      element.dataset.blockType = blockType;
      observer.observe(element);
    });

    return () => {
      timers.forEach((timer) => globalThis.clearTimeout(timer));
      observer.disconnect();
    };
  }, [blockOrder, completedBlocks]);

  const tierCards = useMemo(
    () => [
      {
        name: 'Simple',
        status: allBlocksComplete ? 'Ready' : 'Locked',
        detail: allBlocksComplete ? 'Ready to launch the first assignment set.' : 'Complete all 6 content blocks to unlock.',
        tone: allBlocksComplete ? 'ready' : 'locked',
      },
      {
        name: 'Mixed',
        status: 'Locked',
        detail: 'Unlocks when Simple score reaches 60%.',
        tone: 'locked',
      },
      {
        name: 'Intermediate',
        status: 'Locked',
        detail: 'Unlocks when Mixed score reaches 65%.',
        tone: 'locked',
      },
      {
        name: 'Expert',
        status: 'Locked',
        detail: 'Unlocks when Intermediate score reaches 70%.',
        tone: 'locked',
      },
    ],
    [allBlocksComplete]
  );

  return (
    <section
      aria-label="Learning progress and assignment flow"
      style={{
        display: 'grid',
        gap: 14,
        marginBottom: 18,
      }}
    >
      <div
        style={{
          padding: 18,
          borderRadius: 18,
          background: 'var(--design-content-surface)',
          border: 'var(--design-content-border)',
          boxShadow: 'var(--design-content-shadow)',
          backdropFilter: 'var(--design-backdrop)',
          WebkitBackdropFilter: 'var(--design-backdrop)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: theme.sidebarAccent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Learner Flow
            </div>
            <h2
              style={{
                margin: '4px 0 8px',
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: 'var(--design-ink)',
                fontFamily: 'var(--design-heading-font)',
              }}
            >
              {subtopicName}
            </h2>
            <p style={{ margin: 0, color: 'var(--design-muted)', fontSize: 14, lineHeight: 1.7 }}>
              Complete the six blocks in order, track your progress as you scroll, and unlock the Simple assignment path after completion.
            </p>
          </div>

          <div
            style={{
              minWidth: 240,
              padding: '12px 14px',
              borderRadius: 16,
              background: 'var(--design-content-surface-soft)',
              border: 'var(--design-content-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--design-ink)' }}>Block progress</span>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: theme.sidebarAccent }}>
                {completedCount}/{blockOrder.length}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 999, overflow: 'hidden', background: 'rgba(148, 163, 184, 0.25)' }}>
              <div
                style={{
                  width: `${completionPct}%`,
                  height: '100%',
                  background: theme.progressFill,
                  transition: 'width 280ms ease',
                }}
              />
            </div>
            <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--design-muted)' }}>
              {allBlocksComplete ? 'All blocks complete. Simple assignment unlocked.' : 'Scroll through each block for 3 seconds to mark it complete.'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {tierCards.map((tier) => (
            <div
              key={tier.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                padding: '12px 14px',
                borderRadius: 14,
                background: tier.tone === 'ready' ? 'rgba(67, 160, 71, 0.10)' : 'var(--design-content-surface-soft)',
                border: 'var(--design-content-border)',
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--design-ink)' }}>{tier.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--design-muted)', marginTop: 4, lineHeight: 1.6 }}>{tier.detail}</div>
              </div>
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '5px 9px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  color: tier.tone === 'ready' ? '#2e7d46' : 'var(--design-muted)',
                  background: tier.tone === 'ready' ? 'rgba(67, 160, 71, 0.12)' : 'rgba(148, 163, 184, 0.16)',
                }}
              >
                {tier.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {allBlocksComplete ? (
        <div
          role="dialog"
          aria-live="polite"
          style={{
            padding: 16,
            borderRadius: 18,
            background: 'rgba(46, 125, 70, 0.10)',
            border: '1px solid rgba(46, 125, 70, 0.22)',
            color: '#1f5f36',
            boxShadow: 'var(--design-content-shadow)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Subtopic complete</div>
          <div style={{ fontSize: 13, lineHeight: 1.7 }}>
            You finished all six blocks. The Simple assignment path is now available, and the next tier unlock sequence is ready for T3-B.
          </div>
        </div>
      ) : null}

      <span aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(1px, 1px, 1px, 1px)' }}>
        {visible ? 'Block progress updated.' : ''}
      </span>
    </section>
  );
}
