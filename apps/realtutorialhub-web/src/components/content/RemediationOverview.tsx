import Link from 'next/link';

import type { DomainTheme } from '@/lib/domain-themes';

export interface RemediationWeakAreaCard {
  subtopicId: string;
  subtopicName: string;
  score: number;
  threshold: number;
  progress: 'not_started' | 'in_progress' | 'completed';
  notesExcerpt: string;
  hierarchy?: {
    domainSlug: string;
    subjectSlug: string;
    topicSlug: string;
    subtopicSlug: string;
  };
  href?: string | null;
}

export interface RemediationHistoryItem {
  examResultId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  overallProgress: {
    completed: number;
    total: number;
  };
  weakSubtopics: RemediationWeakAreaCard[];
}

interface RemediationOverviewProps {
  theme: DomainTheme;
  currentPlan: RemediationHistoryItem | null;
  historyCount: number;
}

function titleCaseFromSlug(value: string): string {
  return value
    .split('-')
    .filter((part) => part.trim().length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function statusLabel(status: RemediationHistoryItem['status']): string {
  if (status === 'completed') return 'Completed';
  if (status === 'in_progress') return 'In progress';
  if (status === 'failed') return 'Needs review';
  return 'Pending';
}

export function RemediationOverview({ theme, currentPlan, historyCount }: RemediationOverviewProps) {
  if (currentPlan === null) {
    return (
      <section
        aria-label="Remediation overview"
        style={{
          padding: 18,
          borderRadius: 18,
          background: 'var(--design-content-surface)',
          border: 'var(--design-content-border)',
          boxShadow: 'var(--design-content-shadow)',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, color: theme.sidebarAccent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Your weak areas
        </div>
        <h2 style={{ margin: '6px 0 8px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--design-ink)', fontFamily: 'var(--design-heading-font)' }}>
          No remediation plan yet
        </h2>
        <p style={{ margin: 0, color: 'var(--design-muted)', fontSize: 14, lineHeight: 1.7 }}>
          Finish an exam to generate weak areas from your actual tutorial notes and revisit the relevant subtopics here.
        </p>
        <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--design-muted)' }}>
          History entries: {historyCount}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Remediation overview"
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
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: theme.sidebarAccent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Your weak areas
          </div>
          <h2 style={{ margin: '6px 0 8px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--design-ink)', fontFamily: 'var(--design-heading-font)' }}>
            Tutorial notes first, then practice
          </h2>
          <p style={{ margin: 0, color: 'var(--design-muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 760 }}>
            These cards are derived from your remediation history and show the exact tutorial notes you should revisit before you continue.
          </p>
        </div>
        <div
          style={{
            minWidth: 220,
            padding: '12px 14px',
            borderRadius: 16,
            background: 'var(--design-content-surface-soft)',
            border: 'var(--design-content-border)',
          }}
        >
          <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--design-ink)', marginBottom: 4 }}>Plan status</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: theme.sidebarAccent }}>{statusLabel(currentPlan.status)}</div>
          <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--design-muted)' }}>
            {currentPlan.overallProgress.completed}/{currentPlan.overallProgress.total} weak areas reviewed
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        {currentPlan.weakSubtopics.map((item) => (
          <article
            key={item.subtopicId}
            style={{
              padding: 14,
              borderRadius: 16,
              background: 'var(--design-content-surface-soft)',
              border: 'var(--design-content-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(14, 165, 233, 0.12)', color: theme.sidebarAccent, fontSize: 11.5, fontWeight: 800 }}>
                    Score {item.score}/{item.threshold}
                  </span>
                  <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(148, 163, 184, 0.16)', color: 'var(--design-muted)', fontSize: 11.5, fontWeight: 800 }}>
                    {item.progress.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--design-ink)' }}>{item.subtopicName}</div>
                {item.hierarchy ? (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(59, 79, 122, 0.12)', color: 'var(--design-ink)', fontSize: 11.5, fontWeight: 800 }}>
                      {titleCaseFromSlug(item.hierarchy.domainSlug)}
                    </span>
                    <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(59, 79, 122, 0.10)', color: 'var(--design-ink)', fontSize: 11.5, fontWeight: 800 }}>
                      {titleCaseFromSlug(item.hierarchy.subjectSlug)}
                    </span>
                    <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(59, 79, 122, 0.08)', color: 'var(--design-ink)', fontSize: 11.5, fontWeight: 800 }}>
                      {titleCaseFromSlug(item.hierarchy.topicSlug)}
                    </span>
                    <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(14, 165, 233, 0.12)', color: theme.sidebarAccent, fontSize: 11.5, fontWeight: 800 }}>
                      {titleCaseFromSlug(item.hierarchy.subtopicSlug)}
                    </span>
                  </div>
                ) : null}
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: 'var(--design-muted)' }}>
                  Tutorial notes: {item.notesExcerpt}
                </div>
              </div>
              {item.href ? (
                <div style={{ alignSelf: 'center' }}>
                  <Link
                    href={item.href}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 14px',
                      borderRadius: 999,
                      background: theme.sidebarAccent,
                      color: '#fff',
                      textDecoration: 'none',
                      fontWeight: 800,
                      fontSize: 12.5,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Open notes
                  </Link>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--design-muted)' }}>
        Based on your tutorial notes and weak-area scores, not AI-generated advice.
      </div>
    </section>
  );
}
