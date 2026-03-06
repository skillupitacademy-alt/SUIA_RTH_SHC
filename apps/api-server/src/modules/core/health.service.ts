import { db } from '@quiz/db';
import { sql } from 'drizzle-orm';

import { logger } from '@/lib/logger';
import { recordTimer } from '@/lib/metrics';

import { cacheService } from './cache.service';

export interface ComponentStatus {
  status: 'up' | 'down' | 'degraded';
  latencyMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface HealthReport {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  components: {
    database: ComponentStatus;
    cache: ComponentStatus;
  };
}

export class HealthService {
  private static log = logger.child({ module: 'core:health' });
  private static readonly VERSION = '1.2.0';

  /**
   * Performs a simple liveness check (is the process alive?)
   */
  static getLivenessReport() {
    return {
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      version: this.VERSION,
      uptime: process.uptime(),
    };
  }

  /**
   * Performs a comprehensive readiness check (are all dependencies connected?)
   */
  static async getReadinessReport(): Promise<HealthReport> {
    // Parallel checks for performance
    const [dbResult, cacheResult] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
    ]);

    const isHealthy = dbResult.status === 'up' && cacheResult.status === 'up';
    const hasDegradation = dbResult.status === 'degraded' || cacheResult.status === 'degraded';

    return {
      status: isHealthy ? 'healthy' : (hasDegradation ? 'degraded' : 'unhealthy'),
      timestamp: new Date().toISOString(),
      version: this.VERSION,
      uptime: process.uptime(),
      components: {
        database: dbResult,
        cache: cacheResult,
      },
    };
  }

  private static async checkDatabase(): Promise<ComponentStatus> {
    const start = Date.now();
    try {
      await db.execute(sql`SELECT 1`);
      const latency = Date.now() - start;
      recordTimer('system.health.database.latency', latency);
      return {
        status: 'up',
        latencyMs: latency,
      };
    } catch (error) {
      this.log.error({ err: error }, 'Database health check failed');
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Unknown database error',
        latencyMs: Date.now() - start,
      };
    }
  }

  private static async checkCache(): Promise<ComponentStatus> {
    const start = Date.now();
    try {
      const usage = await cacheService.getUsage();
      const latency = Date.now() - start;
      recordTimer('system.health.cache.latency', latency);
      if (!usage.configured) {
        return {
          status: 'degraded',
          message: 'Cache not configured (Memory fallback in use)',
          latencyMs: Date.now() - start,
        };
      }
      return {
        status: 'up',
        latencyMs: Date.now() - start,
        details: {
          keys: usage.keys,
          memory: usage.memory,
        }
      };
    } catch (error) {
      this.log.error({ err: error }, 'Cache health check failed');
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Unknown cache error',
        latencyMs: Date.now() - start,
      };
    }
  }
}
