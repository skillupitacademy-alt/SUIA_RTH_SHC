import { describe, it, expect, vi, afterEach } from 'vitest';

import { QueueService } from '../queue.service';
import { logger } from '@/lib/logger';

const resetSingleton = () => {
  (QueueService as unknown as { instance?: QueueService | undefined }).instance = undefined;
};

describe('QueueService branch coverage', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    Object.assign(process.env, originalEnv);
    resetSingleton();
    vi.restoreAllMocks();
  });

  it('picks NEXT_PUBLIC_APP_URL when provided', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://public.example.com';
    process.env.VERCEL_URL = '';
    resetSingleton();

    const qs = QueueService.getInstance();
    expect((qs as unknown as { appUrl: string }).appUrl).toBe('https://public.example.com');
  });

  it('falls back to INTERNAL_API_URL when public url is empty', () => {
    process.env.NEXT_PUBLIC_APP_URL = '   ';
    process.env.INTERNAL_API_URL = 'https://internal.example.com';
    resetSingleton();

    const qs = QueueService.getInstance();
    expect((qs as unknown as { appUrl: string }).appUrl).toBe('https://internal.example.com');
  });

  it('adds delay and retries headers when options passed', async () => {
    process.env.QSTASH_TOKEN = 'tok';
    resetSingleton();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: 'mid' }),
    });
    // @ts-expect-error override global
    global.fetch = fetchMock;

    const qs = QueueService.getInstance();
    await qs.enqueue('JOB', { a: 1 }, { delay: 5, retries: 2 });

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers['Upstash-Delay']).toBe('5s');
    expect(headers['Upstash-Retries']).toBe('2');
  });

  it('logs error and returns failure when fetch throws', async () => {
    process.env.QSTASH_TOKEN = 'tok';
    resetSingleton();
    // @ts-expect-error override global
    global.fetch = vi.fn().mockRejectedValue(new Error('net down'));
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    const qs = QueueService.getInstance();
    const res = await qs.enqueue('JOB', { a: 1 });

    expect(res.success).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('returns failure and warns when no QSTASH_TOKEN set', async () => {
    process.env.QSTASH_TOKEN = '';
    resetSingleton();
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const qs = QueueService.getInstance();

    const res = await qs.enqueue('JOB', { a: 1 });

    expect(res.success).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('falls back to localhost appUrl when no env urls set', () => {
    process.env.NEXT_PUBLIC_APP_URL = '';
    process.env.INTERNAL_API_URL = '';
    process.env.VERCEL_URL = '';
    resetSingleton();

    const qs = QueueService.getInstance();
    expect((qs as unknown as { appUrl: string }).appUrl).toBe('http://localhost:3000');
  });

  it('returns failure and logs when response not ok', async () => {
    process.env.QSTASH_TOKEN = 'tok';
    resetSingleton();
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    // @ts-expect-error override global
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'oops',
    });

    const qs = QueueService.getInstance();
    const res = await qs.enqueue('JOB', { a: 1 });

    expect(res.success).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
  });
});
