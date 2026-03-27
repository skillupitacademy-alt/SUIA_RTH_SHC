'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import type { DomainTheme } from '@/lib/domain-themes';

type ProjectDeliverableType = 'code' | 'repo' | 'live_demo' | 'document';
type ProjectLevel = 'simple' | 'intermediate' | 'expert';
type ProjectScope = 'topic' | 'subject' | 'domain';

export type ProjectCard = {
  id: string;
  title: string;
  description: string | null;
  deliverableType: ProjectDeliverableType;
  level: ProjectLevel;
  scope: ProjectScope;
};

type ProjectSubmissionRecord = {
  id: string;
  projectId: string;
  status: string;
  submittedAt: string | null;
  projectLevel: ProjectLevel;
  difficulty: string;
  submissionContent: Record<string, unknown>;
};

interface ProjectSubmissionPanelProps {
  subtopicId: string;
  subtopicName: string;
  theme: DomainTheme;
  projects: ProjectCard[];
}

async function readJsonError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: unknown; message?: unknown } | null;
    if (payload != null) {
      if (typeof payload.error === 'string' && payload.error.length > 0) return payload.error;
      if (typeof payload.message === 'string' && payload.message.length > 0) return payload.message;
    }
  } catch {
    // Fall back to the HTTP status text below.
  }

  return `Request failed with status ${response.status}`;
}

async function fetchMySubmissions(): Promise<ProjectSubmissionRecord[]> {
  const response = await fetch('/api/tutorial/projects/submissions', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await readJsonError(response));
  }

  const payload = (await response.json()) as { data?: ProjectSubmissionRecord[] } | null;
  return payload?.data ?? [];
}

function buildDeliverable(project: ProjectCard, value: string): Record<string, unknown> {
  const trimmed = value.trim();
  if (project.deliverableType === 'repo') return { repoUrl: trimmed };
  if (project.deliverableType === 'live_demo') return { liveDemoUrl: trimmed };
  if (project.deliverableType === 'document') return { documentUrl: trimmed };
  return { code: trimmed };
}

function getSubmissionLabel(project: ProjectCard): string {
  if (project.deliverableType === 'repo') return 'Repository URL';
  if (project.deliverableType === 'live_demo') return 'Demo URL';
  if (project.deliverableType === 'document') return 'Document URL';
  return 'Code or gist';
}

function getSubmissionPlaceholder(project: ProjectCard): string {
  if (project.deliverableType === 'repo') return 'https://github.com/your-account/your-project';
  if (project.deliverableType === 'live_demo') return 'https://your-demo.example.com';
  if (project.deliverableType === 'document') return 'https://docs.google.com/your-document';
  return 'Paste the code snippet or gist link here';
}

function levelTone(level: ProjectLevel): string {
  if (level === 'simple') return 'rgba(14, 165, 233, 0.12)';
  if (level === 'intermediate') return 'rgba(245, 124, 0, 0.12)';
  return 'rgba(139, 92, 246, 0.12)';
}

export function ProjectSubmissionPanel({ subtopicId, subtopicName, theme, projects }: ProjectSubmissionPanelProps) {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? '');
  const [submissionValue, setSubmissionValue] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const projectTitleById = useMemo(() => new Map(projects.map((project) => [project.id, project.title] as const)), [projects]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    setSelectedProjectId(projects[0]?.id ?? '');
  }, [projects]);

  useEffect(() => {
    setSubmissionValue('');
    setMessage(null);
    setError(null);
  }, [selectedProjectId]);

  const submissionsQuery = useQuery({
    queryKey: ['tutorial-project-submissions', subtopicId],
    queryFn: fetchMySubmissions,
    enabled: projects.length > 0,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (selectedProject === null) {
        throw new Error('Select a project first.');
      }

      const trimmed = submissionValue.trim();
      if (trimmed.length === 0) {
        throw new Error('Add a submission before sending.');
      }

      const response = await fetch('/api/tutorial/projects/submit', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          deliverable: buildDeliverable(selectedProject, trimmed),
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; data?: { submissionId?: string } } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to submit project');
      }

      return payload?.data?.submissionId ?? 'submitted';
    },
    onSuccess: async () => {
      setMessage('Project submitted. Faculty review will begin soon.');
      setError(null);
      setSubmissionValue('');
      await queryClient.invalidateQueries({ queryKey: ['tutorial-project-submissions', subtopicId] });
    },
    onError: (submitError) => {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit project');
      setMessage(null);
    },
  });

  if (projects.length === 0) {
    return (
      <section
        aria-label="Project submission"
        style={{
          padding: 18,
          borderRadius: 18,
          background: 'var(--design-content-surface)',
          border: 'var(--design-content-border)',
          boxShadow: 'var(--design-content-shadow)',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, color: theme.sidebarAccent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Project submission
        </div>
        <h3 style={{ margin: '6px 0 8px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--design-ink)', fontFamily: 'var(--design-heading-font)' }}>
          {subtopicName}
        </h3>
        <p style={{ margin: 0, color: 'var(--design-muted)', fontSize: 14, lineHeight: 1.7 }}>
          No published projects are available for this subtopic yet.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Project submission"
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
            Project submission
          </div>
          <h3 style={{ margin: '6px 0 8px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--design-ink)', fontFamily: 'var(--design-heading-font)' }}>
            Submit a project
          </h3>
          <p style={{ margin: 0, color: 'var(--design-muted)', fontSize: 14, lineHeight: 1.7 }}>
            Pick the project that matches your current scope, then submit a repo, demo, document, or code sample for faculty review.
          </p>
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 999, background: 'var(--design-content-surface-soft)', color: 'var(--design-muted)', fontSize: 12.5, fontWeight: 800 }}>
          {projects.length} available
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        {projects.map((project) => {
          const active = project.id === selectedProject?.id;
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => setSelectedProjectId(project.id)}
              style={{
                textAlign: 'left',
                width: '100%',
                padding: 14,
                borderRadius: 16,
                border: `1px solid ${active ? theme.sidebarAccent : 'var(--design-content-border)'}`,
                background: active ? `${theme.sidebarAccent}14` : 'var(--design-content-surface-soft)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 999, background: levelTone(project.level), color: 'var(--design-ink)', fontSize: 11.5, fontWeight: 800 }}>
                      {project.level}
                    </span>
                    <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(148, 163, 184, 0.14)', color: 'var(--design-muted)', fontSize: 11.5, fontWeight: 800 }}>
                      {project.scope}
                    </span>
                    <span style={{ padding: '4px 8px', borderRadius: 999, background: 'rgba(14, 165, 233, 0.10)', color: theme.sidebarAccent, fontSize: 11.5, fontWeight: 800 }}>
                      {project.deliverableType}
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--design-ink)' }}>{project.title}</div>
                  {project.description ? (
                    <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.65, color: 'var(--design-muted)' }}>{project.description}</div>
                  ) : null}
                </div>
                <div style={{ alignSelf: 'center', fontSize: 12, fontWeight: 800, color: active ? theme.sidebarAccent : 'var(--design-muted)' }}>
                  {active ? 'Selected' : 'Choose'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedProject ? (
        <div style={{ marginTop: 16, padding: 14, borderRadius: 16, background: 'var(--design-content-surface-soft)', border: 'var(--design-content-border)' }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--design-ink)' }}>Submission input</div>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--design-muted)' }}>{getSubmissionLabel(selectedProject)}</span>
              <textarea
                value={submissionValue}
                onChange={(event) => setSubmissionValue(event.target.value)}
                rows={selectedProject.deliverableType === 'code' ? 6 : 3}
                placeholder={getSubmissionPlaceholder(selectedProject)}
                style={{
                  width: '100%',
                  resize: 'vertical',
                  borderRadius: 14,
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
              onClick={() => {
                void submitMutation.mutateAsync();
              }}
              disabled={submitMutation.isPending || submissionValue.trim().length === 0}
              style={{
                justifySelf: 'start',
                padding: '10px 14px',
                borderRadius: 999,
                border: 'none',
                background: submitMutation.isPending || submissionValue.trim().length === 0 ? 'rgba(148, 163, 184, 0.28)' : theme.sidebarAccent,
                color: '#fff',
                fontWeight: 800,
                cursor: submitMutation.isPending || submissionValue.trim().length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit project'}
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <div role="status" style={{ marginTop: 12, padding: 12, borderRadius: 12, background: 'rgba(16, 185, 129, 0.10)', border: '1px solid rgba(16, 185, 129, 0.18)', color: '#047857', fontSize: 13, fontWeight: 700 }}>
          {message}
        </div>
      ) : null}

      {error ? (
        <div role="alert" style={{ marginTop: 12, padding: 12, borderRadius: 12, background: 'rgba(198, 40, 40, 0.10)', border: '1px solid rgba(198, 40, 40, 0.18)', color: '#991b1b', fontSize: 13, fontWeight: 700 }}>
          {error}
        </div>
      ) : null}

      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--design-ink)', marginBottom: 10 }}>Your submissions</div>
        {submissionsQuery.isLoading ? (
          <div style={{ fontSize: 13, color: 'var(--design-muted)' }}>Loading submissions...</div>
        ) : submissionsQuery.isError ? (
          <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 700 }}>
            {submissionsQuery.error instanceof Error ? submissionsQuery.error.message : 'Unable to load submissions.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {(submissionsQuery.data ?? []).length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--design-muted)' }}>No submissions yet.</div>
            ) : (
              (submissionsQuery.data ?? []).map((submission) => (
                <div
                  key={submission.id}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: 'var(--design-content-surface)',
                    border: 'var(--design-content-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--design-ink)' }}>
                        {projectTitleById.get(submission.projectId) ?? submission.projectId}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--design-muted)' }}>
                        {submission.projectLevel} · {submission.status}
                      </div>
                    </div>
                    <div style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 800, color: theme.sidebarAccent }}>
                      {submission.submittedAt ?? 'Pending'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
