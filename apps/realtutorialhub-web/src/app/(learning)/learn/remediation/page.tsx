import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { TokenService } from '@quiz/auth';
import type { TutorialContentJSON } from '@quiz/types';

import { getDomainTheme } from '@/lib/domain-themes';
import { getPublishedTutorialContent, getPublishedTutorialPaths } from '@/lib/tutorial-hierarchy';
import { RemediationService } from '@/server/remediation.service';

import { RemediationOverview, type RemediationHistoryItem, type RemediationWeakAreaCard } from '@/components/content/RemediationOverview';

const remediationService = new RemediationService();
const tokenService = new TokenService();

export const metadata: Metadata = {
  title: 'Remediation | RealTutorialHub',
  description: 'Review your weak areas using the tutorial notes, topic flow, and subtopic paths that match your learning history.',
};

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = tokenService.getAccessToken({ cookies: cookieStore }, { scope: 'user' });
  if (token === undefined) return null;

  try {
    const payload = await TokenService.verifyAccessToken(token, { audience: 'user', isAdmin: false });
    return payload.userId;
  } catch {
    return null;
  }
}

function truncateNotes(value: string, maxLength = 220): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function getNotesExcerpt(content: TutorialContentJSON | null | undefined, fallback: string): string {
  if (!content?.notes) {
    return `Revisit the tutorial notes for ${fallback}.`;
  }

  let excerpt = '';
  if ('markdown' in content.notes) {
    excerpt = content.notes.markdown;
  } else if ('coreDefinition' in content.notes) {
    excerpt = `${content.notes.coreDefinition.definition} ${content.notes.conceptExplanation.mainConcept}`;
  }

  if (excerpt.trim().length === 0) {
    return `Revisit the tutorial notes for ${fallback}.`;
  }

  return truncateNotes(excerpt);
}

export default async function RemediationPage() {
  const userId = await getUserId();
  const defaultTheme = getDomainTheme('full-stack');

  if (userId === null) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--tutorial-page-bg)', padding: 24 }}>
        <section
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: 18,
            borderRadius: 18,
            background: 'var(--design-content-surface)',
            border: 'var(--design-content-border)',
            boxShadow: 'var(--design-content-shadow)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: defaultTheme.sidebarAccent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Remediation
          </div>
          <h1 style={{ margin: '6px 0 8px', fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--design-ink)', fontFamily: 'var(--design-heading-font)' }}>
            Sign in to view remediation notes
          </h1>
          <p style={{ margin: 0, color: 'var(--design-muted)', fontSize: 14, lineHeight: 1.7 }}>
            The remediation view uses your own tutorial history, so we need your student session before showing weak areas.
          </p>
        </section>
      </div>
    );
  }

  const [history, paths] = await Promise.all([
    remediationService.getStudentRemediationHistory(userId),
    getPublishedTutorialPaths(),
  ]);

  const pathBySubtopicId = new Map(paths.map((item) => [item.subtopicId, item] as const));
  const latestPlan = history[0] ?? null;
  const theme = latestPlan && latestPlan.weakSubtopics.length > 0 && pathBySubtopicId.has(latestPlan.weakSubtopics[0].subtopicId)
    ? getDomainTheme(pathBySubtopicId.get(latestPlan.weakSubtopics[0].subtopicId)!.domainSlug)
    : defaultTheme;

  const currentPlan: RemediationHistoryItem | null = latestPlan == null
    ? null
    : {
        ...latestPlan,
        weakSubtopics: await Promise.all(
          latestPlan.weakSubtopics.map(async (weakSubtopic) => {
            const path = pathBySubtopicId.get(weakSubtopic.subtopicId);
            const content = await getPublishedTutorialContent(weakSubtopic.subtopicId, 'simple');
            const tutorialContent = (content?.content ?? null) as TutorialContentJSON | null;

            const hierarchy = path
              ? {
                  domainSlug: path.domainSlug,
                  subjectSlug: path.subjectSlug,
                  topicSlug: path.topicSlug,
                  subtopicSlug: path.subtopicSlug,
                }
              : undefined;

            return {
              ...weakSubtopic,
              notesExcerpt: getNotesExcerpt(tutorialContent, weakSubtopic.subtopicName),
              hierarchy,
              href: path
                ? `/learn/${path.domainSlug}/${path.subjectSlug}/${path.topicSlug}/${path.subtopicSlug}`
                : null,
            } satisfies RemediationWeakAreaCard;
          })
        ),
      };

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
            Remediation
          </div>
          <h1 style={{ margin: '6px 0 8px', fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--design-ink)', fontFamily: 'var(--design-heading-font)' }}>
            Review the tutorial notes that match your weak areas
          </h1>
          <p style={{ margin: 0, color: 'var(--design-muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 920 }}>
            This page is built from your remediation history and the notes that already live under the domain, subject, topic, and subtopic hierarchy.
          </p>
        </section>

        <RemediationOverview theme={theme} currentPlan={currentPlan} historyCount={history.length} />
      </div>
    </div>
  );
}
