import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { postMock, setPortalIdentityMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  setPortalIdentityMock: vi.fn(),
}));

vi.mock('@quiz/api-client', () => ({
  apiClient: {
    client: {
      post: postMock,
      setPortalIdentity: setPortalIdentityMock,
    },
  },
}));

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
    await act(async () => {
      await Promise.resolve();
    });

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
    const intervalSpy = vi.spyOn(global, 'setInterval').mockImplementation((fn: TimerHandler): ReturnType<typeof setInterval> => {
      if (typeof fn === 'function') fn();
      return 0 as ReturnType<typeof setInterval>;
    });
    const clearSpy = vi.spyOn(global, 'clearInterval').mockImplementation(() => {});
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ url: null })) // export/urls
      .mockResolvedValueOnce(jsonResponse({ status: 'completed', downloadUrl: 'http://final.url' })) // status
      .mockResolvedValueOnce(jsonResponse({
        content: { guidance_signals: [], historical_progress: [], aggregations: { L6_skill: [] } }
      })); // blob
    postMock.mockResolvedValueOnce({ jobId: 'job-1', status: 'processing' }); // trigger

    const { result } = renderHook(() => useInsightVectorData(examId, userId));
    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).not.toBeNull();
    });
    expect(setPortalIdentityMock).toHaveBeenCalledWith('user');
    expect(postMock).toHaveBeenCalledWith('/export/trigger', {
      examId,
      userId,
      format: 'json',
    });
    intervalSpy.mockRestore();
    clearSpy.mockRestore();
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
    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.data?.guidanceSignals.length).toBe(1);
      expect(result.current.data?.historicalProgress.length).toBe(1);
      expect(result.current.data?.skillData.length).toBe(1);
    });
  });

  it('handles status failure', async () => {
    const intervalSpy = vi.spyOn(global, 'setInterval').mockImplementation((fn: TimerHandler): ReturnType<typeof setInterval> => {
      if (typeof fn === 'function') fn();
      return 0 as ReturnType<typeof setInterval>;
    });
    const clearSpy = vi.spyOn(global, 'clearInterval').mockImplementation(() => {});
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ url: null })) // export/urls
      .mockResolvedValueOnce(jsonResponse({ status: 'failed', error: 'Boom' })) // status
      .mockResolvedValueOnce(jsonResponse({ url: null })); // fallback export/urls
    postMock.mockResolvedValueOnce({ jobId: 'job-2', status: 'processing' }); // trigger

    const { result } = renderHook(() => useInsightVectorData(examId, userId));
    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockFetch.mock.calls.some((call) => String(call[0]).includes('/export/status/'))).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Boom');
    });
    intervalSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it('retries on demand', async () => {
    const intervalSpy = vi.spyOn(global, 'setInterval').mockImplementation((fn: TimerHandler): ReturnType<typeof setInterval> => {
      if (typeof fn === 'function') fn();
      return 0 as ReturnType<typeof setInterval>;
    });
    const clearSpy = vi.spyOn(global, 'clearInterval').mockImplementation(() => {});
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ url: null })) // export/urls
      .mockResolvedValueOnce(jsonResponse({ status: 'failed', error: 'First fail' })) // status
      .mockResolvedValueOnce(jsonResponse({ url: null })); // fallback export/urls
    postMock.mockResolvedValueOnce({ jobId: 'job-3', status: 'processing' }); // trigger

    const { result } = renderHook(() => useInsightVectorData(examId, userId));
    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockFetch.mock.calls.some((call) => String(call[0]).includes('/export/status/'))).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('First fail');
    });

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ url: 'http://cached.retry' })) // export/urls
      .mockResolvedValueOnce(jsonResponse({
        content: { guidance_signals: [], historical_progress: [], aggregations: { L6_skill: [] } }
      })); // blob

    await act(async () => result.current.retry());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).not.toBeNull();
    });
    intervalSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it('recovers when export status polling returns 404 but the artifact exists', async () => {
    const intervalSpy = vi.spyOn(global, 'setInterval').mockImplementation((fn: TimerHandler): ReturnType<typeof setInterval> => {
      if (typeof fn === 'function') fn();
      return 0 as ReturnType<typeof setInterval>;
    });
    const clearSpy = vi.spyOn(global, 'clearInterval').mockImplementation(() => {});

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ url: null })) // export/urls precheck
      .mockResolvedValueOnce(jsonResponse({}, false, 404)) // status
      .mockResolvedValueOnce(jsonResponse({ url: 'http://recovered.url' })) // export/urls recovery
      .mockResolvedValueOnce(jsonResponse({
        content: { guidance_signals: [], historical_progress: [], aggregations: { L6_skill: [] } }
      })); // payload
    postMock.mockResolvedValueOnce({ jobId: 'job-4', status: 'processing' }); // trigger

    const { result } = renderHook(() => useInsightVectorData(examId, userId));
    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).not.toBeNull();
    });

    expect(String(mockFetch.mock.calls[1]?.[0])).toContain('/export/status/job-4?examId=exam-1&format=json');
    expect(String(mockFetch.mock.calls[2]?.[0])).toContain('/export/urls?examId=exam-1&format=json');
    intervalSpy.mockRestore();
    clearSpy.mockRestore();
  });
});
