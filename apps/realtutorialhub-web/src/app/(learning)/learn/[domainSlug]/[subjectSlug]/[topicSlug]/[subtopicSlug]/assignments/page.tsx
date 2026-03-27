import type { Metadata } from 'next';

import { LearnerProgressPanel } from '@/components/content/LearnerProgressPanel';
import { getDomainTheme } from '@/lib/domain-themes';
import { SEED_SUBTOPIC_ID, getSeededTutorialContent } from '@/lib/tutorial-content';
import { getHierarchyBySlugs, getPublishedTutorialContent, slugifySegment } from '@/lib/tutorial-hierarchy';

interface PageProps {
  params: Promise<{
    domainSlug: string;
    subjectSlug: string;
    topicSlug: string;
    subtopicSlug: string;
  }>;
}

function titleCaseFromSlug(value: string) {
  return value
    .split('-')
    .filter((part) => part.trim().length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getNotesSummary(content: unknown): string {
  if (content === null || typeof content !== 'object') return '';

  const notes = (content as { notes?: { markdown?: string } }).notes?.markdown ?? '';
  const collapsed = notes.replace(/\s+/g, ' ').trim();
  if (collapsed.length === 0) return '';
  return collapsed.length > 180 ? `${collapsed.slice(0, 180).trimEnd()}...` : collapsed;
}

export default async function TutorialAssignmentsPage({ params }: PageProps) {
  const resolved = await params;
  const hierarchy = await getHierarchyBySlugs(resolved);
  const publishedContent = hierarchy != null ? await getPublishedTutorialContent(hierarchy.subtopic.id) : null;
  const content = publishedContent?.content ?? (await getSeededTutorialContent());
  const theme = getDomainTheme(resolved.domainSlug);
  const subtopicId = hierarchy?.subtopic.id ?? SEED_SUBTOPIC_ID;

  const subtopicName = hierarchy?.subtopic.name ?? titleCaseFromSlug(slugifySegment(resolved.subtopicSlug));
  const topicName = hierarchy?.topic.name ?? titleCaseFromSlug(slugifySegment(resolved.topicSlug));
  const domainName = hierarchy?.domain.name ?? titleCaseFromSlug(slugifySegment(resolved.domainSlug));
  const notesSummary = getNotesSummary(content) || `Review the notes for ${subtopicName} before moving through the practice tiers.`;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tutorial-page-bg)', padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gap: 18 }}>
        <section
          style={{
            padding: 18,
            borderRadius: 18,
            background: 'var(--design-content-surface)',
            border: 'var(--design-content-border)',
            boxShadow: 'var(--design-content-shadow)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: theme.sidebarAccent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Assignments
          </div>
          <h1 style={{ margin: '6px 0 8px', fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--design-ink)', fontFamily: 'var(--design-heading-font)' }}>
            Practice tiers for {subtopicName}
          </h1>
          <p style={{ margin: 0, color: 'var(--design-muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 920 }}>
            The assignment flow follows the same domain, subject, topic, and subtopic hierarchy as the lesson page. Complete the tutorial blocks there, then return here to work through the tiers.
          </p>

          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(59, 79, 122, 0.12)', color: 'var(--design-ink)', fontSize: 11.5, fontWeight: 800 }}>
              {domainName}
            </span>
            <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(59, 79, 122, 0.10)', color: 'var(--design-ink)', fontSize: 11.5, fontWeight: 800 }}>
              {topicName}
            </span>
            <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(14, 165, 233, 0.12)', color: theme.sidebarAccent, fontSize: 11.5, fontWeight: 800 }}>
              {subtopicName}
            </span>
          </div>

          <div style={{ marginTop: 14, padding: 14, borderRadius: 16, background: 'var(--design-content-surface-soft)', border: 'var(--design-content-border)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: theme.sidebarAccent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Notes focus
            </div>
            <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.7, color: 'var(--design-muted)' }}>
              {notesSummary}
            </div>
          </div>
        </section>

        <LearnerProgressPanel
          subtopicId={subtopicId}
          subtopicName={subtopicName}
          theme={theme}
          blockOrder={['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor']}
          showContentProgress={false}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const hierarchy = await getHierarchyBySlugs(resolved);
  const content = hierarchy != null ? await getPublishedTutorialContent(hierarchy.subtopic.id) : null;
  const subtopicName = hierarchy?.subtopic.name ?? titleCaseFromSlug(slugifySegment(resolved.subtopicSlug));
  const topicName = hierarchy?.topic.name ?? titleCaseFromSlug(slugifySegment(resolved.topicSlug));
  const description = getNotesSummary(content?.content ?? null);

  return {
    title: `${subtopicName} Assignments - ${topicName} | RealTutorialHub`,
    description,
    openGraph: {
      title: `${subtopicName} Assignments - ${topicName} | RealTutorialHub`,
      description,
      type: 'article',
    },
  };
}
