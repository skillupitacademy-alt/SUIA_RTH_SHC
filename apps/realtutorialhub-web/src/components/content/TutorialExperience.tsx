import type { ContentBlockType, TutorialContentJSON } from '@quiz/types';

import type { DomainTheme } from '@/lib/domain-themes';

import { BlockNavPills } from './BlockNavPills';
import { BlockPreviewCard } from './BlockPreviewCard';
import { BlockRenderer } from './BlockRenderer';
import { SubtopicHeader } from './SubtopicHeader';
import { DomainBreadcrumb } from '../layout/DomainBreadcrumb';
import { TutorialNavbar } from '../layout/TutorialNavbar';
import { TutorialSidebar } from '../layout/TutorialSidebar';

interface TutorialExperienceProps {
  params: {
    domainSlug: string;
    subjectSlug: string;
    topicSlug: string;
    subtopicSlug: string;
  };
  content: TutorialContentJSON;
  theme: DomainTheme;
  mode: 'compare' | 'detail';
  blockType?: ContentBlockType;
}

const blockOrder: ContentBlockType[] = ['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor'];

export function TutorialExperience({ params, content, theme, mode, blockType }: TutorialExperienceProps) {
  const domainName = params.domainSlug.replace(/-/g, ' ');
  const subtopicName = 'JavaScript Promises';

  const currentDomain = {
    name: domainName,
    topics: blockOrder.map((block, index) => ({
      name: block.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      status: index === 0 ? 'completed' : index === 1 ? 'active' : 'not_started',
      slug: block,
    })) as Array<{
      name: string;
      status: 'completed' | 'active' | 'in_progress' | 'locked' | 'not_started';
      slug: string;
    }>,
  };

  const topicGroups = [
    {
      name: 'Blocks',
      defaultExpanded: true,
      items: currentDomain.topics,
    },
  ];

  const notes = [
    { term: 'Learning order', detail: 'Layman first, then scenario, technical detail, code, AI tutor.' },
    { term: 'Images', detail: 'Promise chain and async flow placeholders are available now.' },
    { term: 'Theme', detail: 'Each version uses a separate design frame but the same content.' },
  ];

  const renderPanel = (version: 'aesthetic' | 'logic') => (
    <section
      key={version}
      data-design-version={version}
      className="design-panel"
      style={{
        padding: 18,
        background: 'var(--design-surface)',
      }}
    >
      <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: theme.sidebarAccent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {version === 'aesthetic' ? 'Version A' : 'Version B'}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--block-text-primary)' }}>
            {version === 'aesthetic' ? 'Aesthetic Maverick' : 'Logic Legend'}
          </div>
        </div>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 800,
            padding: '6px 10px',
            borderRadius: 999,
            background: 'var(--tutorial-surface-soft)',
            color: 'var(--block-text-secondary)',
          }}
        >
          {mode === 'compare' ? 'Side-by-side review' : 'Detail view'}
        </span>
      </div>

      <SubtopicHeader
        subtopicName={subtopicName}
        completedBlocks={0}
        totalBlocks={6}
        theme={theme}
      />

      {mode === 'detail' && blockType ? (
        <BlockNavPills
          currentBlockType={blockType}
          blocks={blockOrder}
          domainSlug={params.domainSlug}
          subjectSlug={params.subjectSlug}
          topicSlug={params.topicSlug}
          subtopicSlug={params.subtopicSlug}
          theme={theme}
        />
      ) : null}

      {mode === 'compare' ? (
        <BlockRenderer content={content} theme={theme} />
      ) : blockType ? (
        <BlockRenderer content={content} theme={theme} activeBlockType={blockType} />
      ) : null}
    </section>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tutorial-page-bg)' }}>
      <TutorialNavbar />
      <DomainBreadcrumb domain={domainName} subtopic={subtopicName} theme={theme} />
      <div style={{ display: 'flex', alignItems: 'stretch', maxWidth: 1680, margin: '0 auto' }}>
        <TutorialSidebar
          currentDomain={currentDomain}
          topicGroups={topicGroups}
          notes={notes}
          theme={theme}
          activeSubtopicSlug={params.subtopicSlug}
        />
        <main style={{ flex: 1, minWidth: 0, padding: 24 }}>
          <div id="compare" style={{ marginBottom: 16 }}>
            <BlockPreviewCard
              blockType="layman"
              blockContent={content.layman.simpleExplanation.slice(0, 120)}
              isCompleted={false}
              isLocked={false}
              theme={theme}
              subtopicSlug={params.subtopicSlug}
              domainSlug={params.domainSlug}
              subjectSlug={params.subjectSlug}
              topicSlug={params.topicSlug}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: mode === 'compare' ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)',
              gap: 18,
              alignItems: 'start',
            }}
          >
            {renderPanel('aesthetic')}
            {mode === 'compare' ? renderPanel('logic') : null}
          </div>
        </main>
      </div>
    </div>
  );
}
