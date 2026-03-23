"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import type { ContentBlockType } from '@quiz/types';

import type { DomainTheme } from '@/lib/domain-themes';

interface BlockPreviewCardProps {
  blockType: ContentBlockType;
  blockContent: string;
  isCompleted: boolean;
  isLocked: boolean;
  theme: DomainTheme;
  subtopicSlug: string;
  domainSlug: string;
  subjectSlug: string;
  topicSlug: string;
}

export function BlockPreviewCard({
  blockType,
  blockContent,
  isCompleted,
  isLocked,
  theme,
  subtopicSlug,
  domainSlug,
  subjectSlug,
  topicSlug,
}: BlockPreviewCardProps) {
  const t = useTranslations('blocks');
  const href = `/learn/${domainSlug}/${subjectSlug}/${topicSlug}/${subtopicSlug}/${blockType}`;

  return (
    <article
      className="design-panel"
      style={{
        position: 'relative',
        overflow: 'hidden',
        opacity: isLocked ? 0.72 : 1,
      }}
      aria-label={`${t(`${blockType}.title`)} preview`}
    >
      <div style={{ padding: 14, borderBottom: '1px solid var(--tutorial-border)' }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.sidebarAccent }}>{t(`${blockType}.title`)}</div>
      </div>
      <div style={{ padding: 14, minHeight: 112, background: 'var(--tutorial-surface)' }}>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: 'var(--block-text-secondary)' }}>{blockContent}</p>
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: isCompleted ? '#2e7d46' : 'var(--block-text-secondary)' }}>
            {isCompleted ? 'Completed' : 'Unlock next'}
          </span>
          <Link
            href={href}
            onClick={() => {
              try {
                window.sessionStorage.setItem('rth-last-block', blockType);
              } catch {
                // Ignore storage failures.
              }
            }}
            style={{
              textDecoration: 'none',
              fontSize: 12.5,
              fontWeight: 800,
              color: isLocked ? 'var(--block-text-secondary)' : theme.sidebarAccent,
            }}
            aria-disabled={isLocked}
          >
            View {'->'}
          </Link>
        </div>
      </div>
      {isLocked ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(255,255,255,0.24)',
            color: 'var(--block-text-primary)',
            fontWeight: 800,
          }}
        >
          Complete the previous block first
        </div>
      ) : null}
    </article>
  );
}
