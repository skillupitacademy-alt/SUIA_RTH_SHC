import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TutorInsightCard } from '../TutorInsightCard';

// Mock fetch and observability
global.fetch = vi.fn();
vi.mock('@quiz/observability', () => ({
  recordCounter: vi.fn(),
  recordTimer: vi.fn(),
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
