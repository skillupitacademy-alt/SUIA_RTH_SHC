import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProjectSubmissionPanel, type ProjectCard } from '../ProjectSubmissionPanel';
import { getDomainTheme } from '@/lib/domain-themes';

const theme = getDomainTheme('full-stack');
const subtopicId = '11111111-1111-1111-1111-111111111111';

const projects: ProjectCard[] = [
  {
    id: 'project-1',
    title: 'Build a Promise Tracker',
    description: 'Track promise states in a small dashboard.',
    deliverableType: 'repo',
    level: 'simple',
    scope: 'topic',
  },
  {
    id: 'project-2',
    title: 'Create an Async Demo',
    description: null,
    deliverableType: 'document',
    level: 'intermediate',
    scope: 'subject',
  },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function renderPanel(availableProjects = projects) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectSubmissionPanel
        subtopicId={subtopicId}
        subtopicName="JavaScript Promises"
        theme={theme}
        projects={availableProjects}
      />
    </QueryClientProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProjectSubmissionPanel', () => {
  it('renders the project list and submits a repo deliverable', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: [] }))
      .mockResolvedValueOnce(jsonResponse({ data: { submissionId: 'submission-1' } }))
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: 'submission-1', projectId: 'project-1', status: 'submitted', submittedAt: '2026-03-27T00:00:00.000Z', projectLevel: 'simple', difficulty: 'simple', submissionContent: { repoUrl: 'https://github.com/example/repo' } }] }));
    vi.stubGlobal('fetch', fetchMock);

    renderPanel();

    expect(await screen.findByText('Build a Promise Tracker')).toBeDefined();
    fireEvent.change(screen.getByPlaceholderText('https://github.com/your-account/your-project'), {
      target: { value: 'https://github.com/example/repo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit project' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/tutorial/projects/submit',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          projectId: 'project-1',
          deliverable: { repoUrl: 'https://github.com/example/repo' },
        }),
      })
    );
    expect(await screen.findByText('Project submitted. Faculty review will begin soon.')).toBeDefined();
  });

  it('shows the empty state when no projects are available', () => {
    renderPanel([]);

    expect(screen.getByText('No published projects are available for this subtopic yet.')).toBeDefined();
  });
});
