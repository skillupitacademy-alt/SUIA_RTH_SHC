import type { ContentBlockType, TutorialContentJSON } from '@quiz/types';

import type { DomainTheme } from '@/lib/domain-themes';

import { BlockNavPills } from './BlockNavPills';
import { BlockRenderer } from './BlockRenderer';
import { SubtopicHeader } from './SubtopicHeader';
import { LearnerProgressPanel } from './LearnerProgressPanel';
import { DomainBreadcrumb } from '../layout/DomainBreadcrumb';
import { TutorialNavbar } from '../layout/TutorialNavbar';
import { TutorialSidebar } from '../layout/TutorialSidebar';
import { TutorialKeyboardNav } from './TutorialKeyboardNav';

interface TutorialExperienceProps {
  params: {
    domainSlug: string;
    subjectSlug: string;
    topicSlug: string;
    subtopicSlug: string;
  };
  content: TutorialContentJSON;
  theme: DomainTheme;
  mode: 'compare' | 'detail' | 'learn';
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
    { term: 'Theme', detail: 'Version A aesthetic styling is locked for the learner experience.' },
    { term: 'Assignments', detail: 'Simple unlocks only after all six blocks are completed.' },
  ];

  const renderPanel = () => (
    <section
      data-design-version="aesthetic"
      className="design-panel"
      style={{
        padding: 18,
        background: 'var(--design-page-bg)',
        border: 'var(--design-surface-border)',
        borderRadius: 'var(--design-radius)',
        boxShadow: 'var(--design-shadow)',
        backdropFilter: 'var(--design-backdrop)',
        WebkitBackdropFilter: 'var(--design-backdrop)',
        fontFamily: 'var(--design-body-font)',
        overflow: 'hidden',
      }}
    >
      <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: theme.sidebarAccent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {mode === 'learn' ? 'Learner Flow' : 'Production Design'}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--design-ink)', fontFamily: 'var(--design-heading-font)' }}>
            {mode === 'learn' ? 'T3-A Learner View' : 'Aesthetic Maverick'}
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
          {mode === 'compare' ? 'Production review' : mode === 'learn' ? 'Learner view' : 'Detail view'}
        </span>
      </div>

      {mode === 'learn' ? (
        <LearnerProgressPanel
          subtopicId={params.subtopicSlug}
          subtopicName={subtopicName}
          theme={theme}
          blockOrder={blockOrder}
        />
      ) : (
        <SubtopicHeader subtopicName={subtopicName} completedBlocks={0} totalBlocks={6} theme={theme} />
      )}

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
      ) : mode === 'learn' ? (
        <BlockRenderer content={content} theme={theme} />
      ) : blockType ? (
        <BlockRenderer content={content} theme={theme} activeBlockType={blockType} />
      ) : null}
    </section>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tutorial-page-bg)' }}>
      <TutorialKeyboardNav mode={mode} blockType={blockType} blockOrder={blockOrder} params={params} />
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr)',
              gap: 18,
              alignItems: 'start',
            }}
          >
            {renderPanel()}
          </div>
        </main>
      </div>
    </div>
  );
}
