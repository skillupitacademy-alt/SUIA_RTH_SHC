import { describe, expect, it, vi, beforeEach } from 'vitest';
import { sql } from 'drizzle-orm';

import { db } from '@quiz/db';

import { cacheService } from '../cache.service';
import { HealthService } from '../health.service';

vi.mock('@quiz/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('../cache.service', () => ({
  cacheService: {
    getUsage: vi.fn(),
  },
}));

vi.mock('@/lib/metrics', () => ({
  recordTimer: vi.fn(),
}));

import { recordTimer } from '@/lib/metrics';

describe('HealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLivenessReport', () => {
    it('returns a healthy liveness report', () => {
      const report = HealthService.getLivenessReport();
      expect(report.status).toBe('healthy');
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('version');
      expect(report).toHaveProperty('uptime');
    });
  });

  describe('getReadinessReport', () => {
    it('returns healthy when database and cache are up', async () => {
      (db.execute as any).mockResolvedValue({});
      (cacheService.getUsage as any).mockResolvedValue({ configured: true, keys: 10, memory: '1KB' });

      const report = await HealthService.getReadinessReport();
      expect(report.status).toBe('healthy');
      expect(recordTimer).toHaveBeenCalledWith('system.health.database.latency', expect.any(Number));
      expect(recordTimer).toHaveBeenCalledWith('system.health.cache.latency', expect.any(Number));
      expect(report.components.database.status).toBe('up');
      expect(report.components.cache.status).toBe('up');
    });

    it('returns unhealthy when database is down', async () => {
      (db.execute as any).mockRejectedValue(new Error('DB Connection Failed'));
      (cacheService.getUsage as any).mockResolvedValue({ configured: true });

      const report = await HealthService.getReadinessReport();
      expect(report.status).toBe('unhealthy');
      expect(report.components.database.status).toBe('down');
      expect(report.components.database.message).toBe('DB Connection Failed');
      expect(recordTimer).toHaveBeenCalledWith('system.health.cache.latency', expect.any(Number));
      // Database fails so latency check might or might not have been recorded based on placement
      // In my implementation, recordTimer is AFTER await db.execute, so it won't be called on error.
    });

    it('returns degraded when cache is not configured', async () => {
      (db.execute as any).mockResolvedValue({});
      (cacheService.getUsage as any).mockResolvedValue({ configured: false });

      const report = await HealthService.getReadinessReport();
      expect(report.status).toBe('degraded');
      expect(report.components.cache.status).toBe('degraded');
      expect(report.components.cache.message).toContain('not configured');
      expect(recordTimer).toHaveBeenCalledWith('system.health.cache.latency', expect.any(Number));
    });

    it('returns unhealthy when cache throws error', async () => {
      (db.execute as any).mockResolvedValue({});
      (cacheService.getUsage as any).mockRejectedValue(new Error('Redis Timeout'));

      const report = await HealthService.getReadinessReport();
      expect(report.status).toBe('unhealthy');
      expect(report.components.cache.status).toBe('down');
      expect(report.components.cache.message).toBe('Redis Timeout');
    });
  });

  describe('checkers', () => {
    it('checkDatabase uses unknown error message for non-Error throwables', async () => {
      (db.execute as any).mockRejectedValue('db-failed');

      const result = await (HealthService as any).checkDatabase();

      expect(result.status).toBe('down');
      expect(result.message).toBe('Unknown database error');
    });

    it('checkCache uses unknown error message for non-Error throwables', async () => {
      (cacheService.getUsage as any).mockRejectedValue('cache-failed');

      const result = await (HealthService as any).checkCache();

      expect(result.status).toBe('down');
      expect(result.message).toBe('Unknown cache error');
    });
  });
});
