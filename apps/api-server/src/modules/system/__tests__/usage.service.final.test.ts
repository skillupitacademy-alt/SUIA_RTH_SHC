import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { db } from '@quiz/db';
import { UsageService } from '../usage.service';
import { cacheService } from '@/modules/core/cache.service';

// Use stable hoisted mocks for Vitest compatibility
const vi_resendConstructor = vi.fn();
const vi_resendList = vi.fn();
const vi_dbExecute = vi.fn();
const vi_cacheUsage = vi.fn();
const vi_fetch = vi.fn();

// Mock dependencies at the top level
vi.mock('@quiz/db', () => ({
  db: {
    execute: vi.fn((...args) => vi_dbExecute(...args)),
  },
}));

vi.mock('drizzle-orm', () => ({
  sql: vi.fn(),
}));

vi.mock('@/modules/core/cache.service', () => ({
  cacheService: {
    getUsage: vi.fn((...args) => vi_cacheUsage(...args)),
  },
}));

vi.mock('resend', () => {
  return {
    Resend: class {
      apiKeys = { list: vi_resendList };
      constructor(...args: any[]) {
        vi_resendConstructor(...args);
      }
    }
  };
});

// Setup global fetch mock
(global as any).fetch = vi_fetch;

describe('UsageService 100% Branch Coverage - FINAL BLITZ', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, SERVICE_USAGE_TIMEOUT_MS: '1000' };
    (UsageService as any).cache.clear();

    // Default Success Setup
    vi_dbExecute.mockResolvedValue({ rows: [{ raw_size: 10 * 1024 * 1024 }] });
    vi_cacheUsage.mockResolvedValue({ configured: true, memoryBytes: 5 * 1024 * 1024, keys: 1, memory: '5MB' });
    vi_resendList.mockResolvedValue({ data: [] });
    vi_fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          viewer: {
            zones: [{
              httpRequests1dGroups: [{ sum: { requests: 123, bytes: 456789 } }]
            }]
          }
        }
      })
    } as any);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  const callPrivate = (method: string, ...args: any[]) => (UsageService as any)[method](...args);

  describe('Integration & getAllUsage (Lines 39-59)', () => {
    it('covers success path for all services (Hits lines 115, 163, etc)', async () => {
      process.env.RESEND_API_KEY = 'valid-key';
      process.env.CLOUDFLARE_API_TOKEN = 'valid-token';
      process.env.CLOUDFLARE_ZONE_ID = 'valid-zone';
      process.env.REDIS_MEMORY_LIMIT_MB = '100';

      const res = await UsageService.getAllUsage();
      expect(res.neon.status).toBe('ok');
      expect(res.redis.status).toBe('ok');
      expect(res.resend.status).toBe('ok');
      expect(res.cloudflare.status).toBe('ok');
    });

    it('returns cached value (Line 41)', async () => {
      const mockResult = { neon: { status: 'warning' } } as any;
      (UsageService as any).cache.set('usage', mockResult);
      const res = await UsageService.getAllUsage();
      expect(res).toBe(mockResult);
    });

    it('synthesizes error states from Promise.allSettled reasons (Lines 52-54)', async () => {
      // We must mock the private methods using spyOn to ensure they reject, hitting the catch in Promise.allSettled handling
      vi.spyOn(UsageService as any, 'getNeonUsage').mockRejectedValue(new Error('fail-neon'));
      vi.spyOn(UsageService as any, 'getRedisUsage').mockRejectedValue(new Error('fail-redis'));
      vi.spyOn(UsageService as any, 'getResendStatus').mockRejectedValue(new Error('fail-resend'));
      vi.spyOn(UsageService as any, 'getCloudflareStats').mockRejectedValue(new Error('fail-cf'));

      const res = await UsageService.getAllUsage();
      expect(res.neon.status).toBe('_error');
      expect(res.neon._error?.message).toBe('fail-neon');
      expect(res.redis.status).toBe('_error');
      expect(res.redis._error?.message).toBe('fail-redis');
      expect(res.resend.status).toBe('_error');
      expect(res.resend._error?.message).toBe('fail-resend');
      expect(res.cloudflare.status).toBe('_error');
      expect(res.cloudflare._error?.message).toBe('fail-cf');
    });
  });

  describe('Neon - getNeonUsage (Lines 71-108)', () => {
    it('handles nullish raw_size (Line 80)', async () => {
      vi_dbExecute.mockResolvedValue({ rows: [{ raw_size: null }] });
      const res = await callPrivate('getNeonUsage');
      expect(res.metrics?.usagePercent).toBe(0);
    });

    it('triggers warning and error statuses (Lines 85-86)', async () => {
      process.env.NEON_DB_LIMIT_MB = '100';
      // Status OK
      vi_dbExecute.mockResolvedValue({ rows: [{ raw_size: 10 * 1024 * 1024 }] });
      expect((await callPrivate('getNeonUsage')).status).toBe('ok');
      // Status Warning (85%)
      vi_dbExecute.mockResolvedValue({ rows: [{ raw_size: 85 * 1024 * 1024 }] });
      expect((await callPrivate('getNeonUsage')).status).toBe('warning');
      // Status Error (96%)
      vi_dbExecute.mockResolvedValue({ rows: [{ raw_size: 96 * 1024 * 1024 }] });
      expect((await callPrivate('getNeonUsage')).status).toBe('_error');
    });

    it('handles errors in catch block (Line 100)', async () => {
      // Branch: instanceof Error
      vi_dbExecute.mockRejectedValue(new Error('neon-err-obj'));
      let res = await callPrivate('getNeonUsage');
      expect(res._error?.message).toBe('neon-err-obj');
      
      // Branch: not instanceof Error
      vi_dbExecute.mockRejectedValue('neon-string-err');
      res = await callPrivate('getNeonUsage');
      expect(res._error?.message).toBe('Unknown Neon _error');
    });
  });

  describe('Redis - getRedisUsage (Lines 110-151)', () => {
    it('returns not_configured if storage is disabled (Line 115)', async () => {
      vi_cacheUsage.mockResolvedValue({ configured: false });
      const res = await callPrivate('getRedisUsage');
      expect(res.status).toBe('not_configured');
    });

    it('handles nullish memoryBytes (Line 122)', async () => {
      process.env.REDIS_MEMORY_LIMIT_MB = '100';
      vi_cacheUsage.mockResolvedValue({ configured: true, memoryBytes: null });
      const res = await callPrivate('getRedisUsage');
      expect(res.metrics?.usagePercent).toBe(0);
    });

    it('triggers warning and error thresholds (Lines 125-126)', async () => {
      process.env.REDIS_MEMORY_LIMIT_MB = '100';
      // Status OK
      vi_cacheUsage.mockResolvedValue({ configured: true, memoryBytes: 70 * 1024 * 1024 });
      expect((await callPrivate('getRedisUsage')).status).toBe('ok');
      // Status Warning
      vi_cacheUsage.mockResolvedValue({ configured: true, memoryBytes: 85 * 1024 * 1024 });
      expect((await callPrivate('getRedisUsage')).status).toBe('warning');
      // Status Error
      vi_cacheUsage.mockResolvedValue({ configured: true, memoryBytes: 96 * 1024 * 1024 });
      expect((await callPrivate('getRedisUsage')).status).toBe('_error');
    });

    it('fallback limitMb=0 logic (Line 118)', async () => {
      delete process.env.REDIS_MEMORY_LIMIT_MB;
      vi_cacheUsage.mockResolvedValue({ configured: true, memoryBytes: 1000 });
      const res = await callPrivate('getRedisUsage');
      expect(res.metrics?.limitMb).toBeNull();
    });

    it('handles errors in catch block (Line 143)', async () => {
      // Branch: instanceof Error
      vi_cacheUsage.mockRejectedValue(new Error('redis-err-obj'));
      let res = await callPrivate('getRedisUsage');
      expect(res._error?.message).toBe('redis-err-obj');
      
      // Branch: not instanceof Error
      vi_cacheUsage.mockRejectedValue('redis-string-err');
      res = await callPrivate('getRedisUsage');
      expect(res._error?.message).toBe('Unknown Redis _error');
    });
  });

  describe('Resend - getResendStatus (Lines 153-181)', () => {
    it('returns not_configured if key is missing (Line 155)', async () => {
      process.env.RESEND_API_KEY = ' ';
      const res = await callPrivate('getResendStatus');
      expect(res.status).toBe('not_configured');
    });

    it('handles errors in catch block (Line 173)', async () => {
      process.env.RESEND_API_KEY = 'test';
      // Branch: instanceof Error
      vi_resendList.mockRejectedValue(new Error('resend-err-obj'));
      let res = await callPrivate('getResendStatus');
      expect(res._error?.message).toBe('resend-err-obj');
      
      // Branch: not instanceof Error
      vi_resendList.mockRejectedValue('resend-string-err');
      res = await callPrivate('getResendStatus');
      expect(res._error?.message).toBe('Unknown Resend _error');
    });

    it('fails if constructor throws (Line 173)', async () => {
      process.env.RESEND_API_KEY = 'test';
      vi_resendConstructor.mockImplementationOnce(() => {
        throw new Error('cons-error');
      });
      const res = await callPrivate('getResendStatus');
      expect(res._error?.message).toBe('cons-error');
    });
  });

  describe('Cloudflare - getCloudflareStats (Lines 183-267)', () => {
    beforeEach(() => {
      process.env.CLOUDFLARE_API_TOKEN = 't';
      process.env.CLOUDFLARE_ZONE_ID = 'z';
    });

    it('not_configured if zone missing (Line 187)', async () => {
      process.env.CLOUDFLARE_ZONE_ID = '';
      const res = await callPrivate('getCloudflareStats');
      expect(res.status).toBe('not_configured');
    });

    it('handles non-OK response (Line 236)', async () => {
      vi_fetch.mockResolvedValueOnce({ ok: false, statusText: 'Bad Request' } as any);
      const res = await callPrivate('getCloudflareStats');
      expect(res._error?.message).toContain('Bad Request');
    });

    it('extracts GraphQL errors array (Line 241)', async () => {
      vi_fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ errors: [{ message: 'gql-failed' }] })
      } as any);
      const res = await callPrivate('getCloudflareStats');
      expect(res._error?.message).toBe('gql-failed');
    });

    it('applies fallback metrics if data is empty (Line 244)', async () => {
      vi_fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { viewer: { zones: [{ httpRequests1dGroups: [] }] } } })
      } as any);
      const res = await callPrivate('getCloudflareStats');
      expect(res.metrics?.requests24h).toBe(0);
    });

    it('handles fetch errors in catch block (Line 258)', async () => {
      // Branch: instanceof Error
      vi_fetch.mockRejectedValue(new Error('cf-err-obj'));
      let res = await callPrivate('getCloudflareStats');
      expect(res._error?.message).toBe('cf-err-obj');
      
      // Branch: not instanceof Error
      vi_fetch.mockRejectedValueOnce('cf-string-err');
      res = await callPrivate('getCloudflareStats');
      expect(res._error?.message).toBe('Unknown Cloudflare _error');
    });
  });

  describe('Common - getErrorState (Lines 61-69)', () => {
    it('handles non-Error objects', () => {
      const res = callPrivate('getErrorState', 'boom');
      expect(res._error?.message).toBe('Unknown _error');
    });

    it('handles Error objects', () => {
      const res = callPrivate('getErrorState', new Error('real-err'));
      expect(res._error?.message).toBe('real-err');
    });
  });
});
