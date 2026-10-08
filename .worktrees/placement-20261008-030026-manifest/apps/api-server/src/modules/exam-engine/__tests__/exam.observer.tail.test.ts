import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExamObserver } from '../exam.observer';

describe('ExamObserver triggerPdfGeneration tail', () => {
  const originalApi = process.env.NEXT_PUBLIC_API_URL;
  const originalKey = process.env.INTERNAL_API_KEY;

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApi;
    process.env.INTERNAL_API_KEY = originalKey;
    vi.restoreAllMocks();
  });

  it('uses default API base when NEXT_PUBLIC_API_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    process.env.INTERNAL_API_KEY = 'k1';

    const fetchSpy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({} as any);
    (ExamObserver as any).triggerPdfGeneration('ex-1');

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:3002/api/generate-report',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-internal-key': 'k1' }),
      })
    );
  });

  it('uses configured API base when NEXT_PUBLIC_API_URL is set', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    process.env.INTERNAL_API_KEY = 'k2';

    const fetchSpy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({} as any);
    (ExamObserver as any).triggerPdfGeneration('ex-2');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.com/generate-report',
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-internal-key': 'k2' }),
      })
    );
  });
});
