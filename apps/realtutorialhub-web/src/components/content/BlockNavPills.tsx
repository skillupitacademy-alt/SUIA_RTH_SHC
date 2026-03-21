import Link from 'next/link';

import type { ContentBlockType } from '@quiz/types';

import type { DomainTheme } from '@/lib/domain-themes';

interface BlockNavPillsProps {
  currentBlockType: ContentBlockType;
  blocks: ContentBlockType[];
  domainSlug: string;
  subjectSlug: string;
  topicSlug: string;
  subtopicSlug: string;
  theme: DomainTheme;
}

const labels: Record<ContentBlockType, string> = {
  notes: 'Notes',
  layman: 'Layman',
  real_life: 'Real-Life',
  technical: 'Technical',
  code: 'Code',
  ai_tutor: 'AI Tutor',
};

export function BlockNavPills({
  currentBlockType,
  blocks,
  domainSlug,
  subjectSlug,
  topicSlug,
  subtopicSlug,
  theme,
}: BlockNavPillsProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
      {blocks.map((block) => {
        const active = block === currentBlockType;
        const href = `/learn/${domainSlug}/${subjectSlug}/${topicSlug}/${subtopicSlug}/${block}`;
        return (
          <Link
            key={block}
            href={href}
            style={{
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: 999,
              border: `1px solid ${active ? theme.sidebarAccent : 'var(--tutorial-border)'}`,
              background: active ? `${theme.sidebarAccent}18` : 'var(--tutorial-surface)',
              color: active ? theme.sidebarAccent : 'var(--block-text-secondary)',
              fontWeight: 700,
              fontSize: 12.5,
            }}
          >
            {labels[block]}
          </Link>
        );
      })}
    </div>
  );
}

