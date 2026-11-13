import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { eventBus } from '@/lib/event-bus';
import { AppEvents } from '@/lib/events';
import { logger } from '@/lib/logger';

import { ExamObserver } from '../exam.observer';

// Exercise the existing private trigger without adding a public production API.
const observer = ExamObserver as unknown as { triggerPdfGeneration(examId: string): Promise<void> };
const internalKey = 'p0-disposable-internal-key';
const apiBase = 'http://localhost:3000/api';

describe('ExamObserver configured report trigger security', () => {
  beforeEach(() => {
    eventBus.clear();
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_API_URL', apiBase);
    vi.stubEnv('INTERNAL_API_KEY', internalKey);
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 202 })));
  });

  afterEach(() => {
    eventBus.clear();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([undefined, '', ' ', '\t'])('does not send a report request with missing or blank key %j', async value => {
    vi.stubEnv('INTERNAL_API_KEY', value);
    await observer.triggerPdfGeneration('exam-1');
    expect(fetch).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      { examId: 'exam-1', reason: 'missing_internal_key' }, expect.any(String),
    );
  });

  it.each([undefined, '', ' ', '\t'])('does not choose an endpoint when its configuration is missing %j', async value => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', value);
    await observer.triggerPdfGeneration('exam-1');
    expect(fetch).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      { examId: 'exam-1', reason: 'missing_api_url' }, expect.any(String),
    );
  });

  it.each([
    'not-a-url', '/api', 'file:///api', 'ftp://reports.example.invalid/api',
    'https://user:private-password@reports.example.invalid/api',
    'https://reports.example.invalid/api?credential=private-value',
    'https://reports.example.invalid/api#private-value',
  ])('rejects an invalid or credential-bearing API base %s', async value => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', value);
    await observer.triggerPdfGeneration('exam-1');
    expect(fetch).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      { examId: 'exam-1', reason: 'invalid_api_url' }, expect.any(String),
    );
    expect(JSON.stringify(vi.mocked(logger.warn).mock.calls)).not.toContain(value);
  });

  it.each([
    ['http://localhost:3000', 'http://localhost:3000/api/generate-report'],
    ['http://localhost:3000/', 'http://localhost:3000/api/generate-report'],
    ['http://localhost:3000/api', 'http://localhost:3000/api/generate-report'],
    ['http://localhost:3000/api///', 'http://localhost:3000/api/generate-report'],
    [' https://reports.example.invalid/api/ ', 'https://reports.example.invalid/api/generate-report'],
  ])('uses the configured API base %s and exact report path', async (configured, expected) => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', configured);
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    await observer.triggerPdfGeneration('exam-1');
    expect(fetch).toHaveBeenCalledExactlyOnceWith(expected, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': internalKey },
      body: JSON.stringify({ attemptId: 'exam-1' }),
      cache: 'no-store', redirect: 'error', signal: expect.any(AbortSignal),
    });
    expect(timeout).toHaveBeenCalledWith(10_000);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it.each([302, 401, 403, 500, 503])('records sanitized HTTP %i failure without response content', async status => {
    const response = new Response('private provider body ' + internalKey, { status });
    const bodyReader = vi.spyOn(response, 'text');
    vi.mocked(fetch).mockResolvedValueOnce(response);
    await expect(observer.triggerPdfGeneration('exam-1')).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      { examId: 'exam-1', reason: 'http_error', status }, expect.any(String),
    );
    expect(bodyReader).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toMatch(/private provider|p0-disposable-internal-key/);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it.each(['network', 'timeout', 'redirect'])('isolates %s failure without logging credentials or endpoint', async kind => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error(`${kind} ${apiBase} ${internalKey}`));
    await expect(observer.triggerPdfGeneration('exam-1')).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      { examId: 'exam-1', reason: 'request_failed' }, expect.any(String),
    );
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain(internalKey);
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain(apiBase);
  });

  it('keeps exam completion event delivery successful when report configuration is missing', async () => {
    vi.stubEnv('INTERNAL_API_KEY', undefined);
    ExamObserver.init();
    const completed = vi.fn();
    eventBus.onEvent(AppEvents.EXAM_COMPLETED, completed);
    await expect(eventBus.emitEvent(AppEvents.EXAM_COMPLETED, {
      examId: 'exam-1', userId: 'owner-1', completedAt: new Date(),
    })).resolves.toBeUndefined();
    expect(completed).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('keeps completed-event observers working when the optional report request fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('private provider ' + internalKey));
    ExamObserver.init();
    const completed = vi.fn();
    eventBus.onEvent(AppEvents.EXAM_COMPLETED, completed);
    await expect(eventBus.emitEvent(AppEvents.EXAM_COMPLETED, {
      examId: 'exam-1', userId: 'owner-1', completedAt: new Date(),
    })).resolves.toBeUndefined();
    expect(completed).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(logger.error).toHaveBeenCalledWith(
      { examId: 'exam-1', reason: 'request_failed' }, expect.any(String),
    ));
  });

  it('does not wait for a pending report request before delivering exam completion', async () => {
    let rejectReport!: (error: Error) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise<Response>((_resolve, reject) => {
      rejectReport = reject;
    }));
    ExamObserver.init();
    const completed = vi.fn();
    eventBus.onEvent(AppEvents.EXAM_COMPLETED, completed);
    try {
      await expect(eventBus.emitEvent(AppEvents.EXAM_COMPLETED, {
        examId: 'exam-1', userId: 'owner-1', completedAt: new Date(),
      })).resolves.toBeUndefined();
      expect(completed).toHaveBeenCalledOnce();
      expect(fetch).toHaveBeenCalledOnce();
    } finally {
      rejectReport(new Error('Synthetic pending request cleanup'));
      await vi.waitFor(() => expect(logger.error).toHaveBeenCalledWith(
        { examId: 'exam-1', reason: 'request_failed' }, expect.any(String),
      ));
    }
  });
});
