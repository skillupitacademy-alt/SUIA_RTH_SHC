import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { TutorInsightCard } from '../TutorInsightCard';

// Mock fetch and observability
global.fetch = vi.fn();
vi.mock('@quiz/observability', () => ({
  recordCounter: vi.fn(),
  recordTimer: vi.fn(),
}));

// Mock TopicProgressChart and NotesViewer to avoid deep dependencies in smoke test
vi.mock('../TopicProgressChart', () => ({
  TopicProgressChart: () => <div data-testid="topic-progress-chart" />,
}));
vi.mock('../NotesViewer', () => ({
  NotesViewer: () => <div data-testid="notes-viewer" />,
}));

describe('TutorInsightCard Smoke Test', () => {
  it('should not crash with empty recommendations', async () => {
    // @ts-ignore
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const { container } = render(<TutorInsightCard />);
    expect(container).toBeDefined();
  });

  it('should handle fetch errors gracefully', async () => {
    // @ts-ignore
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    });

    const { container } = render(<TutorInsightCard />);
    expect(container).toBeDefined();
  });
});
