import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useInsightVectorData } from '../../hooks/useInsightVectorData';

type FetchCall = [RequestInfo | URL, RequestInit | undefined];

const mockFetch = vi.fn<Promise<Response>, FetchCall>();
global.fetch = mockFetch;

function jsonResponse(data: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

describe('useInsightVectorData Hook', () => {
  const examId = 'exam-1';
  const userId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses cached URL fast-path from /export/urls', async () => {
    const payload = {
      content: {
        guidance_signals: [],
        historical_progress: [],
        aggregations: { L6_skill: [] }
      }
    };

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ url: 'http://cached.url' })) // export/urls
      .mockResolvedValueOnce(jsonResponse(payload)); // blob fetch

    const { result } = renderHook(() => useInsightVectorData(examId, userId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).not.toBeNull();
    });

    expect(mockFetch).toHaveBeenCalledWith(`/api/export/urls?examId=${encodeURIComponent(examId)}&format=json`, {
      credentials: 'include',
    });
    // Ensure export trigger was not called
    expect(mockFetch.mock.calls.some((call) => String(call[0]).includes('/export/trigger'))).toBe(false);
  });

  it('triggers export when no cached URL', async () => {
    vi.useFakeTimers();
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ url: null })) // export/urls
      .mockResolvedValueOnce(jsonResponse({ jobId: 'job-1', status: 'processing' })) // trigger
      .mockResolvedValueOnce(jsonResponse({ status: 'completed', downloadUrl: 'http://final.url' })) // status
      .mockResolvedValueOnce(jsonResponse({
        content: { guidance_signals: [], historical_progress: [], aggregations: { L6_skill: [] } }
      })); // blob

    const { result } = renderHook(() => useInsightVectorData(examId, userId));

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).not.toBeNull();
    });
  });

  it('maps content envelope fields correctly', async () => {
    const payload = {
      content: {
        guidance_signals: [{ signalType: 'Critical Gap', hierarchy: 'A > B', dimension: 'Skill (Expert)', currentValue: 33, severity: 'HIGH', recommendation: 'Fix' }],
        historical_progress: [{ sessionId: 's1', sessionDate: '2024-01-01', domain: 'D', subject: 'S', topic: 'T', subtopic: 'Sub', accuracyPct: 50, masteryScorePct: 40, expertDropoff: 10, readinessLevel: 'Novice-Stable', sessionIndex: 1, trend: 'stable' }],
        aggregations: { L6_skill: [{ skillName: 'Skill A', totalAttempts: 10, correctAnswers: 5, accuracyPct: 50, avgTimeSec: 40, masteryScorePct: 45, readinessLevel: 'Intermediate' }] }
      }
    };

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ url: 'http://cached.url' }))
      .mockResolvedValueOnce(jsonResponse(payload));

    const { result } = renderHook(() => useInsightVectorData(examId, userId));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data?.guidanceSignals.length).toBe(1);
      expect(result.current.data?.historicalProgress.length).toBe(1);
      expect(result.current.data?.skillData.length).toBe(1);
    });
  });

  it('handles status failure', async () => {
    vi.useFakeTimers();
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ url: null })) // export/urls
      .mockResolvedValueOnce(jsonResponse({ jobId: 'job-2', status: 'processing' })) // trigger
      .mockResolvedValueOnce(jsonResponse({ status: 'failed', error: 'Boom' })); // status

    const { result } = renderHook(() => useInsightVectorData(examId, userId));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Boom');
      expect(result.current.loading).toBe(false);
    });
  });

  it('retries on demand', async () => {
    vi.useFakeTimers();
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ url: null })) // export/urls
      .mockResolvedValueOnce(jsonResponse({ jobId: 'job-3', status: 'processing' })) // trigger
      .mockResolvedValueOnce(jsonResponse({ status: 'failed', error: 'First fail' })); // status

    const { result } = renderHook(() => useInsightVectorData(examId, userId));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('First fail');
    });

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ url: 'http://cached.retry' })) // export/urls
      .mockResolvedValueOnce(jsonResponse({
        content: { guidance_signals: [], historical_progress: [], aggregations: { L6_skill: [] } }
      })); // blob

    act(() => result.current.retry());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).not.toBeNull();
    });
  });
});
