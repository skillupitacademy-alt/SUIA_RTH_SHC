'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AssignmentDifficulty, ContentBlockType } from '@quiz/types';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { DomainTheme } from '@/lib/domain-themes';
import { getTutorialProgress, reportTutorialBlockViewed } from '@/lib/tutorial-progress';

type AssignmentTierStatus = {
  status: 'not_started' | 'in_progress' | 'self_completed';
  isUnlocked: boolean;
  startedAt: string | null;
  completedAt: string | null;
};

type AssignmentTierStatusMap = {
  simple: AssignmentTierStatus;
  mixed: AssignmentTierStatus;
  intermediate: AssignmentTierStatus;
  expert: AssignmentTierStatus;
};

type AssignmentItem = {
  id: string;
  question: string;
};

type AssignmentStateResponse = {
  locked: boolean;
  requiredTier?: AssignmentDifficulty | 'content_flow';
  assignments: AssignmentItem[];
  progress?: { status: string } | null;
  tierStatus: AssignmentTierStatusMap;
};

interface LearnerProgressPanelProps {
  subtopicId: string;
  subtopicName: string;
  theme: DomainTheme;
  blockOrder: ContentBlockType[];
  assignmentsHref?: string;
  showContentProgress?: boolean;
}

const TRACKING_THRESHOLD = 0.8;
const TRACKING_DELAY_MS = 3000;
const ASSIGNMENT_TIERS: AssignmentDifficulty[] = ['simple', 'mixed', 'intermediate', 'expert'];

function getStorageKey(subtopicId: string): string {
  return `tutorial-progress:${subtopicId}`;
}

function loadCompletedBlocks(subtopicId: string): ContentBlockType[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(getStorageKey(subtopicId));
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is ContentBlockType => typeof item === 'string');
  } catch {
    return [];
  }
}

async function readJsonError(response: Response): Promise<string> {
  try {
    const parsed = (await response.json()) as { error?: unknown; message?: unknown } | null;
    if (parsed != null) {
      if (typeof parsed.error === 'string' && parsed.error.length > 0) return parsed.error;
      if (typeof parsed.message === 'string' && parsed.message.length > 0) return parsed.message;
    }
  } catch {
    // Fall through to status text.
  }

  return `Request failed with status ${response.status}`;
}

async function fetchAssignmentState(subtopicId: string): Promise<AssignmentStateResponse> {
  const response = await fetch(`/api/tutorial/assignments/${subtopicId}?difficulty=simple`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await readJsonError(response));
  }

  const payload = (await response.json()) as { data?: AssignmentStateResponse };
  if (payload.data == null) {
    throw new Error('Invalid assignment response');
  }

  return payload.data;
}

async function postAssignmentJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readJsonError(response));
  }

  return (await response.json()) as T;
}

function getPreviousTier(difficulty: AssignmentDifficulty): AssignmentDifficulty | null {
  const index = ASSIGNMENT_TIERS.indexOf(difficulty);
  if (index <= 0) return null;
  return ASSIGNMENT_TIERS[index - 1] ?? null;
}

function titleCase(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function getTierCopy(
  difficulty: AssignmentDifficulty,
  tier: AssignmentTierStatus,
  contentComplete: boolean,
  totalBlocks: number
): { detail: string; badge: string; ready: boolean } {
  const label = titleCase(difficulty);

  if (!tier.isUnlocked) {
    if (difficulty === 'simple' && !contentComplete) {
      return {
        detail: `Complete all ${totalBlocks} content blocks to unlock the Simple assignments.`,
        badge: 'Locked',
        ready: false,
      };
    }

    const previousTier = getPreviousTier(difficulty);
    return {
      detail: previousTier === null ? 'Complete the learning flow to unlock this tier.' : `Complete ${titleCase(previousTier)} first.`,
      badge: 'Locked',
      ready: false,
    };
  }

  if (tier.status === 'self_completed') {
    return {
      detail: `${label} assignments complete. The next tier is available if unlocked.`,
      badge: 'Completed',
      ready: false,
    };
  }

  if (tier.status === 'in_progress') {
    return {
      detail: `Continue the ${label} assignments and mark them done when finished.`,
      badge: 'In progress',
      ready: true,
    };
  }

  return {
    detail: `Ready to begin the ${label} assignments.`,
    badge: 'Ready',
    ready: true,
  };
}

export function LearnerProgressPanel({
  subtopicId,
  subtopicName,
  theme,
  blockOrder,
  assignmentsHref,
  showContentProgress = true,
}: LearnerProgressPanelProps) {
  const queryClient = useQueryClient();
  const [completedBlocks, setCompletedBlocks] = useState<ContentBlockType[]>([]);
  const [visible, setVisible] = useState(false);
  const [helpQuestion, setHelpQuestion] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [helpMessage, setHelpMessage] = useState<string | null>(null);

  const completedCount = showContentProgress ? completedBlocks.length : 0;
  const completionPct = showContentProgress && blockOrder.length > 0 ? Math.round((completedCount / blockOrder.length) * 100) : 0;
  const allBlocksComplete = showContentProgress && completedCount === blockOrder.length && blockOrder.length > 0;
  const introCopy = showContentProgress
    ? `Complete the ${blockOrder.length} blocks in order, track your progress as you scroll, and unlock the Simple assignment path after completion.`
    : 'Use this compact practice view to work through the tier cards and help flow after you complete the lesson blocks on the main page.';

  const assignmentQuery = useQuery({
    queryKey: ['assignment-state', subtopicId],
    queryFn: () => fetchAssignmentState(subtopicId),
  });

  const progressQuery = useQuery({
    queryKey: ['tutorial-progress', subtopicId],
    queryFn: () => getTutorialProgress(subtopicId),
    staleTime: 5000,
  });

  const startMutation = useMutation({
    mutationFn: async (difficulty: AssignmentDifficulty) => {
      return postAssignmentJson<{ data: { id: string; status: string } }>(
        `/api/tutorial/assignments/${subtopicId}/start`,
        { difficulty }
      );
    },
    onSuccess: async () => {
      setStatusMessage('Assignment tier started.');
      setHelpMessage(null);
      await queryClient.invalidateQueries({ queryKey: ['assignment-state', subtopicId] });
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to start assignments.');
      setHelpMessage(null);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (difficulty: AssignmentDifficulty) => {
      return postAssignmentJson<{ data: { nextUnlockedTier: AssignmentDifficulty | null } }>(
        `/api/tutorial/assignments/${subtopicId}/complete`,
        { difficulty }
      );
    },
    onSuccess: async (result) => {
      const nextTier = result.data.nextUnlockedTier;
      setStatusMessage(nextTier === null ? 'Tier completed.' : `${titleCase(nextTier)} unlocked.`);
      setHelpMessage(null);
      await queryClient.invalidateQueries({ queryKey: ['assignment-state', subtopicId] });
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to complete assignments.');
      setHelpMessage(null);
    },
  });

  const helpMutation = useMutation({
    mutationFn: async (input: { assignmentId: string; question: string }) => {
      return postAssignmentJson<{ data: { id: string } }>('/api/tutorial/assignments/help', {
        subtopicId,
        assignmentId: input.assignmentId,
        question: input.question,
      });
    },
    onSuccess: async () => {
      setHelpQuestion('');
      setHelpMessage('Help request sent. Faculty will respond.');
      setStatusMessage(null);
      await queryClient.invalidateQueries({ queryKey: ['assignment-state', subtopicId] });
    },
    onError: (error) => {
      setHelpMessage(error instanceof Error ? error.message : 'Failed to send help request.');
      setStatusMessage(null);
    },
  });

  useEffect(() => {
    setCompletedBlocks(loadCompletedBlocks(subtopicId));
  }, [subtopicId]);

  useEffect(() => {
    if (progressQuery.data?.blocksViewed) {
      setCompletedBlocks((current) => {
        const merged = new Set([...current, ...progressQuery.data!.blocksViewed]);
        if (merged.size === current.length) return current;
        return Array.from(merged) as ContentBlockType[];
      });
    }
  }, [progressQuery.data, subtopicId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(getStorageKey(subtopicId), JSON.stringify(completedBlocks));
  }, [completedBlocks, subtopicId]);

  useEffect(() => {
    if (!showContentProgress) return;
    if (typeof window === 'undefined') return;

    const timers = new Map<ContentBlockType, ReturnType<typeof globalThis.setTimeout>>();
    const selectors = blockOrder.map((blockType) => ({ blockType, element: window.document.getElementById(`block-${blockType}`) }));

    const clearTimer = (blockType: ContentBlockType) => {
      const timer = timers.get(blockType);
      if (timer) {
        globalThis.clearTimeout(timer);
        timers.delete(blockType);
      }
    };

    const markComplete = (blockType: ContentBlockType) => {
      setVisible(true);
      setCompletedBlocks((current) => (current.includes(blockType) ? current : [...current, blockType]));
      void reportTutorialBlockViewed(subtopicId, blockType).catch(() => undefined);
      clearTimer(blockType);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          const blockType = target.dataset.blockType as ContentBlockType | undefined;
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
  }, [blockOrder, completedBlocks, showContentProgress, subtopicId]);

  const tierStatus = assignmentQuery.data?.tierStatus;
  const simpleAssignments = assignmentQuery.data?.assignments ?? [];
  const primaryAssignment = simpleAssignments[0];
  const contentFlowUnlocked = assignmentQuery.data?.tierStatus.simple.isUnlocked ?? allBlocksComplete;

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
              {introCopy}
            </p>
          </div>

          <div style={{ display: 'grid', gap: 10, justifyItems: 'end' }}>
            {assignmentsHref ? (
              <Link
                href={assignmentsHref}
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
                Open assignments page
              </Link>
            ) : null}

            {showContentProgress ? (
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
            ) : null}
          </div>
        </div>

        {assignmentQuery.isLoading ? (
          <div style={{ marginTop: 16, display: 'grid', gap: 12 }} aria-busy="true" aria-label="Loading assignment status">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={`assignment-skeleton-${index}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: 'var(--design-content-surface-soft)',
                  border: 'var(--design-content-border)',
                  opacity: 0.75,
                }}
              >
                <div style={{ display: 'grid', gap: 8, flex: 1 }}>
                  <div style={{ width: 96, height: 14, borderRadius: 999, background: 'rgba(148, 163, 184, 0.22)' }} />
                  <div style={{ width: '72%', height: 10, borderRadius: 999, background: 'rgba(148, 163, 184, 0.16)' }} />
                </div>
                <div style={{ width: 74, height: 28, borderRadius: 999, background: 'rgba(148, 163, 184, 0.18)' }} />
              </div>
            ))}
          </div>
        ) : assignmentQuery.isError ? (
          <div
            role="alert"
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 14,
              border: '1px solid rgba(185, 28, 28, 0.2)',
              background: 'rgba(185, 28, 28, 0.08)',
              color: '#991b1b',
              display: 'grid',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800 }}>Unable to load assignment status</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>{assignmentQuery.error instanceof Error ? assignmentQuery.error.message : 'Please try again.'}</div>
            <button
              type="button"
              onClick={() => assignmentQuery.refetch()}
              style={{
                justifySelf: 'start',
                padding: '8px 12px',
                borderRadius: 999,
                border: 'none',
                background: '#991b1b',
                color: '#fff',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {statusMessage ? (
              <div
                role="status"
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 12,
                  background: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(37, 99, 235, 0.15)',
                  color: '#1d4ed8',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {statusMessage}
              </div>
            ) : null}

            {helpMessage ? (
              <div
                role="status"
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 12,
                  background: 'rgba(16, 185, 129, 0.10)',
                  border: '1px solid rgba(16, 185, 129, 0.18)',
                  color: '#047857',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {helpMessage}
              </div>
            ) : null}

            {tierStatus ? (
              <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                {ASSIGNMENT_TIERS.map((difficulty) => {
                  const tier = tierStatus[difficulty];
                  const copy = getTierCopy(difficulty, tier, contentFlowUnlocked, blockOrder.length);
                  const actionLabel =
                    tier.status === 'self_completed'
                      ? 'Completed'
                      : tier.status === 'in_progress'
                        ? `Mark ${difficulty} as done`
                        : tier.isUnlocked
                          ? `Start ${difficulty} assignments`
                          : 'Locked';
                  const actionDisabled =
                    tier.status === 'self_completed' ||
                    !tier.isUnlocked ||
                    startMutation.isPending ||
                    completeMutation.isPending;

                  return (
                    <div
                      key={difficulty}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 16,
                        padding: '12px 14px',
                        borderRadius: 14,
                        background: tier.status === 'self_completed' ? 'rgba(67, 160, 71, 0.10)' : 'var(--design-content-surface-soft)',
                        border: 'var(--design-content-border)',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--design-ink)' }}>{titleCase(difficulty)}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--design-muted)', marginTop: 4, lineHeight: 1.6 }}>{copy.detail}</div>
                      </div>
                      <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
                        <div
                          style={{
                            alignSelf: 'flex-start',
                            padding: '5px 9px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 800,
                            color: tier.status === 'self_completed' ? '#2e7d46' : 'var(--design-muted)',
                            background: tier.status === 'self_completed' ? 'rgba(67, 160, 71, 0.12)' : 'rgba(148, 163, 184, 0.16)',
                          }}
                        >
                          {copy.badge}
                        </div>
                        <button
                          type="button"
                          disabled={actionDisabled}
                          onClick={() => {
                            if (tier.status === 'self_completed' || !tier.isUnlocked) return;
                            if (tier.status === 'in_progress') {
                              completeMutation.mutate(difficulty);
                              return;
                            }
                            startMutation.mutate(difficulty);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 999,
                            border: 'none',
                            background: tier.status === 'self_completed'
                              ? 'rgba(148, 163, 184, 0.20)'
                              : tier.isUnlocked
                                ? theme.sidebarAccent
                                : 'rgba(148, 163, 184, 0.20)',
                            color: tier.status === 'self_completed' ? 'var(--design-muted)' : '#fff',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: actionDisabled ? 'not-allowed' : 'pointer',
                            minWidth: 140,
                          }}
                        >
                          {actionLabel}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {primaryAssignment != null ? (
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  borderRadius: 14,
                  background: 'var(--design-content-surface-soft)',
                  border: 'var(--design-content-border)',
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--design-ink)' }}>Simple assignment set</div>
                  <div style={{ fontSize: 12.5, color: 'var(--design-muted)', marginTop: 4, lineHeight: 1.6 }}>
                    Ask for help on the current assignment if you get stuck.
                  </div>
                </div>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: 'var(--design-content-border)',
                    background: 'var(--design-content-surface)',
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--design-ink)', lineHeight: 1.6 }}>
                    {primaryAssignment.question}
                  </div>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--design-muted)' }}>Ask for help</span>
                    <textarea
                      value={helpQuestion}
                      onChange={(event) => setHelpQuestion(event.target.value)}
                      placeholder="Type your question for faculty..."
                      rows={3}
                      style={{
                        width: '100%',
                        resize: 'vertical',
                        borderRadius: 12,
                        border: 'var(--design-content-border)',
                        padding: 12,
                        font: 'inherit',
                        color: 'var(--design-ink)',
                        background: 'var(--design-surface)',
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={helpMutation.isPending || helpQuestion.trim().length === 0}
                    onClick={() => {
                      if (helpQuestion.trim().length === 0) return;
                      helpMutation.mutate({ assignmentId: primaryAssignment.id, question: helpQuestion.trim() });
                    }}
                    style={{
                      justifySelf: 'start',
                      padding: '8px 12px',
                      borderRadius: 999,
                      border: 'none',
                      background: helpMutation.isPending || helpQuestion.trim().length === 0 ? 'rgba(148, 163, 184, 0.28)' : theme.sidebarAccent,
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: helpMutation.isPending || helpQuestion.trim().length === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Ask for help
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {showContentProgress && allBlocksComplete ? (
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
            You finished all {blockOrder.length} blocks. The Simple assignment path is now available, and the next tier unlock sequence is ready.
          </div>
        </div>
      ) : null}

      <span aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(1px, 1px, 1px, 1px)' }}>
        {visible ? 'Block progress updated.' : ''}
      </span>
    </section>
  );
}
