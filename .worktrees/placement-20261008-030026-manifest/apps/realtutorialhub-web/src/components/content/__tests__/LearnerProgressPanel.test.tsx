import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LearnerProgressPanel } from '../LearnerProgressPanel';
import { getDomainTheme } from '@/lib/domain-themes';

const subtopicId = '11111111-1111-1111-1111-111111111111';

type BlockType = 'notes' | 'layman' | 'real_life' | 'technical' | 'code' | 'ai_tutor';

const blockOrder: BlockType[] = ['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor'];
const theme = getDomainTheme('full-stack');

class MockIntersectionObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

const mockProgressData = {
  data: {
    blocksViewed: [],
    completionPercent: 0,
    assignmentUnlocked: false,
  },
};

const mockAssignmentData = {
  data: {
    locked: false,
    assignments: [{ id: 'assignment-1', question: 'What is a promise?' }],
    progress: { status: 'not_started' },
    tierStatus: {
      simple: { status: 'not_started', isUnlocked: true, startedAt: null, completedAt: null },
      mixed: { status: 'not_started', isUnlocked: false, startedAt: null, completedAt: null },
      intermediate: { status: 'not_started', isUnlocked: false, startedAt: null, completedAt: null },
      expert: { status: 'not_started', isUnlocked: false, startedAt: null, completedAt: null },
    },
  },
};

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LearnerProgressPanel subtopicId={subtopicId} subtopicName="JavaScript Promises" theme={theme} blockOrder={blockOrder} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('LearnerProgressPanel', () => {
  it('renders tier state from the assignment api', async () => {
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/tutorial/progress')) {
        return Promise.resolve(jsonResponse(mockProgressData));
      }
      return Promise.resolve(jsonResponse(mockAssignmentData));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPanel();

    expect(await screen.findByText('Start simple assignments')).toBeDefined();
    expect(screen.getByText('Complete Simple first.')).toBeDefined();
    expect(screen.getByText('What is a promise?')).toBeDefined();
  });

  it('calls the start tier api when the start button is clicked', async () => {
    let startCalled = false;
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/tutorial/assignments') && url.includes('/start')) {
        startCalled = true;
        return Promise.resolve(jsonResponse({ data: { id: 'progress-1', status: 'in_progress' } }));
      }
      if (typeof url === 'string' && url.includes('/api/tutorial/progress')) {
        return Promise.resolve(jsonResponse(mockProgressData));
      }
      
      const status = startCalled ? 'in_progress' : 'not_started';
      return Promise.resolve(jsonResponse({
        data: {
          ...mockAssignmentData.data,
          progress: { status },
          tierStatus: {
            ...mockAssignmentData.data.tierStatus,
            simple: { ...mockAssignmentData.data.tierStatus.simple, status },
          },
        },
      }));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPanel();

    const startButton = await screen.findByRole('button', { name: 'Start simple assignments' });
    fireEvent.click(startButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/start'), expect.anything()));
    expect(await screen.findByText('Assignment tier started.')).toBeDefined();
  });

  it('calls the complete tier api and shows the next unlocked tier', async () => {
    let completeCalled = false;
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/tutorial/assignments') && url.includes('/complete')) {
        completeCalled = true;
        return Promise.resolve(jsonResponse({ data: { progress: { id: 'progress-1', status: 'self_completed' }, nextUnlockedTier: 'mixed' } }));
      }
      if (typeof url === 'string' && url.includes('/api/tutorial/progress')) {
        return Promise.resolve(jsonResponse(mockProgressData));
      }

      const status = completeCalled ? 'self_completed' : 'in_progress';
      return Promise.resolve(jsonResponse({
        data: {
          ...mockAssignmentData.data,
          progress: { status },
          tierStatus: {
            ...mockAssignmentData.data.tierStatus,
            simple: { ...mockAssignmentData.data.tierStatus.simple, status: status as 'not_started' | 'in_progress' | 'self_completed', isUnlocked: true },
            mixed: { ...mockAssignmentData.data.tierStatus.mixed, isUnlocked: completeCalled },
          },
        },
      }));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPanel();

    const completeButton = await screen.findByRole('button', { name: 'Mark simple as done' });
    fireEvent.click(completeButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/complete'), expect.anything()));
    expect(await screen.findByText('Mixed unlocked.')).toBeDefined();
  });

  it('submits help requests for the current assignment', async () => {
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/tutorial/assignments/help')) {
        return Promise.resolve(jsonResponse({ data: { id: 'help-1' } }));
      }
      if (typeof url === 'string' && url.includes('/api/tutorial/progress')) {
        return Promise.resolve(jsonResponse(mockProgressData));
      }
      return Promise.resolve(jsonResponse(mockAssignmentData));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPanel();

    const textarea = await screen.findByPlaceholderText('Type your question for faculty...');
    fireEvent.change(textarea, { target: { value: 'Need help understanding promise chaining.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ask for help' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/help'), expect.anything()));
    expect(await screen.findByText('Help request sent. Faculty will respond.')).toBeDefined();
  });

  it('shows a loading state while the assignment status is fetching', async () => {
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>(() => {
          // intentionally pending
        })
    );
    vi.stubGlobal('fetch', fetchMock);

    renderPanel();

    expect(await screen.findByLabelText('Loading assignment status')).toBeDefined();
  });

  it('shows an error state when the assignment status request fails', async () => {
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/tutorial/progress')) {
        return Promise.resolve(jsonResponse(mockProgressData));
      }
      return Promise.resolve(jsonResponse({ error: 'Failed to load assignment status' }, 500));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderPanel();

    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.getByText('Failed to load assignment status')).toBeDefined();
  });
});
