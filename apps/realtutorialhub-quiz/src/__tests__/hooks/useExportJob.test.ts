import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useExportJob } from '../../hooks/useExportJob';

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

describe('useExportJob hook', () => {
  const examId = 'exam-1';
  const userId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('recovers from a 404 job poll when the export artifact exists', async () => {
    const intervalSpy = vi.spyOn(global, 'setInterval').mockImplementation((fn: TimerHandler): ReturnType<typeof setInterval> => {
      if (typeof fn === 'function') fn();
      return 0 as ReturnType<typeof setInterval>;
    });
    const clearSpy = vi.spyOn(global, 'clearInterval').mockImplementation(() => {});

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ jobId: 'job-1', status: 'processing' })) // export/trigger
      .mockResolvedValueOnce(jsonResponse({}, false, 404)) // export/status
      .mockResolvedValueOnce(jsonResponse({ url: 'http://download.url' })); // export/urls fallback

    const { result } = renderHook(() => useExportJob());

    await act(async () => {
      await result.current.triggerExport(examId, userId, 'json');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
      expect(result.current.downloadUrl).toBe('http://download.url');
      expect(result.current.error).toBeNull();
    });

    expect(String(mockFetch.mock.calls[1]?.[0])).toContain('/export/status/job-1?examId=exam-1&format=json');
    expect(String(mockFetch.mock.calls[2]?.[0])).toContain('/export/urls?examId=exam-1&format=json');

    intervalSpy.mockRestore();
    clearSpy.mockRestore();
  });
});
