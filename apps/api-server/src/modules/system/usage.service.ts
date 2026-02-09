import { db } from '@quiz/db';
import { sql } from 'drizzle-orm';
import { cacheService } from '../core/cache.service';
import { Resend } from 'resend';
import { LRUCache } from 'lru-cache';

interface ServiceStatus {
  status: 'ok' | 'warning' | 'error' | 'not_configured';
  configured: boolean;
  checkedAt: string;
  metrics?: any;
  error?: { code?: string; message: string };
}

interface UsageResponse {
  neon: ServiceStatus;
  redis: ServiceStatus;
  resend: ServiceStatus;
  cloudflare: ServiceStatus;
}

const CACHE_TTL_MS = (parseInt(process.env.SERVICE_USAGE_CACHE_TTL_SEC || '60', 10)) * 1000;
const TIMEOUT_MS = parseInt(process.env.SERVICE_USAGE_TIMEOUT_MS || '4000', 10);

export class UsageService {
  private static cache = new LRUCache<string, UsageResponse>({
    max: 10,
    ttl: CACHE_TTL_MS,
  });

  private static async withTimeout<T>(promise: Promise<T>, fallbackError: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(fallbackError)), TIMEOUT_MS);
    });
    return Promise.race([promise, timeout]);
  }

  static async getAllUsage(): Promise<UsageResponse> {
    const cached = this.cache.get('usage');
    if (cached) return cached;

    const [neon, redis, resend, cloudflare] = await Promise.allSettled([
      this.getNeonUsage(),
      this.getRedisUsage(),
      this.getResendStatus(),
      this.getCloudflareStats(),
    ]);

    const response: UsageResponse = {
      neon: neon.status === 'fulfilled' ? neon.value : this.getErrorState(neon.reason),
      redis: redis.status === 'fulfilled' ? redis.value : this.getErrorState(redis.reason),
      resend: resend.status === 'fulfilled' ? resend.value : this.getErrorState(resend.reason),
      cloudflare: cloudflare.status === 'fulfilled' ? cloudflare.value : this.getErrorState(cloudflare.reason),
    };

    this.cache.set('usage', response);
    return response;
  }

  private static getErrorState(error: any): ServiceStatus {
    return {
      status: 'error',
      configured: true,
      checkedAt: new Date().toISOString(),
      error: { message: error.message || 'Unknown error' }
    };
  }

  private static async getNeonUsage(): Promise<ServiceStatus> {
    try {
      const limitMb = parseInt(process.env.NEON_DB_LIMIT_MB || '500', 10);
      
      const result = await this.withTimeout(
        db.execute(sql`SELECT pg_database_size(current_database()) as raw_size`),
        'Neon DB Query Timeout'
      ) as unknown as { rows: { raw_size: string | number }[] };
      
      const rawSize = Number(result.rows[0]?.raw_size || 0);
      const sizeMb = Math.round(rawSize / 1024 / 1024);
      const usagePercent = Math.min(100, Math.round((sizeMb / limitMb) * 100));

      let status: ServiceStatus['status'] = 'ok';
      if (usagePercent >= 80) status = 'warning';
      if (usagePercent >= 95) status = 'error';

      return {
        status,
        configured: true,
        checkedAt: new Date().toISOString(),
        metrics: {
          sizeBytes: rawSize,
          sizeMb,
          limitMb,
          usagePercent,
        }
      };
    } catch (error: any) {
      return {
        status: 'error',
        configured: true,
        checkedAt: new Date().toISOString(),
        error: { message: error.message }
      };
    }
  }

  private static async getRedisUsage(): Promise<ServiceStatus> {
    try {
      // @ts-ignore - getUsage was added to CacheService but TS might not know if not rebuilt
      const usage = await cacheService.getUsage();
      
      if (!usage.configured) {
        return { status: 'not_configured', configured: false, checkedAt: new Date().toISOString() };
      }

      const limitMb = process.env.REDIS_MEMORY_LIMIT_MB ? parseInt(process.env.REDIS_MEMORY_LIMIT_MB, 10) : 0;
      let usagePercent = 0;
      let status: ServiceStatus['status'] = 'ok';

      if (limitMb > 0 && usage.memoryBytes) {
        const usedMb = usage.memoryBytes / 1024 / 1024;
        usagePercent = Math.round((usedMb / limitMb) * 100);
        if (usagePercent >= 80) status = 'warning';
        if (usagePercent >= 95) status = 'error';
      }

      return {
        status,
        configured: true,
        checkedAt: new Date().toISOString(),
        metrics: {
          keys: usage.keys,
          memory: usage.memory,
          memoryBytes: usage.memoryBytes,
          usagePercent: limitMb > 0 ? usagePercent : null,
          limitMb: limitMb > 0 ? limitMb : null,
          snapshot: 'Runtime snapshot'
        }
      };
    } catch (error: any) {
       return {
        status: 'error',
        configured: true,
        checkedAt: new Date().toISOString(),
        error: { message: error.message }
      };
    }
  }

  private static async getResendStatus(): Promise<ServiceStatus> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { status: 'not_configured', configured: false, checkedAt: new Date().toISOString() };
    }

    try {
      const resend = new Resend(apiKey);
      // Retrieve API Keys list as a lightweight auth check
      await this.withTimeout(resend.apiKeys.list(), 'Resend API Timeout');
      
      return {
        status: 'ok',
        configured: true,
        checkedAt: new Date().toISOString(),
        metrics: {
          message: 'Connectivity only (quota unavailable)',
          connected: true
        }
      };
    } catch (error: any) {
      return {
        status: 'error',
        configured: true,
        checkedAt: new Date().toISOString(),
        error: { message: error.message }
      };
    }
  }

  private static async getCloudflareStats(): Promise<ServiceStatus> {
    const token = process.env.CLOUDFLARE_API_TOKEN;
    const zoneId = process.env.CLOUDFLARE_ZONE_ID;

    if (!token || !zoneId) {
      return { status: 'not_configured', configured: false, checkedAt: new Date().toISOString() };
    }

    try {
      const query = `
        query {
          viewer {
            zones(filter: {zoneTag: "${zoneId}"}) {
              httpRequests1dGroups(limit: 1, filter: {date_geq: "${new Date(Date.now() - 86400000).toISOString().split('T')[0]}"}) {
                sum {
                  requests
                  bytes
                }
              }
            }
          }
        }
      `;

      const response = await this.withTimeout(
        fetch('https://api.cloudflare.com/client/v4/graphql', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        }),
        'Cloudflare API Timeout'
      );

      if (!response.ok) {
        throw new Error(`Cloudflare API Error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].message);
      }

      const stats = data.data?.viewer?.zones?.[0]?.httpRequests1dGroups?.[0]?.sum || { requests: 0, bytes: 0 };

      return {
        status: 'ok',
        configured: true,
        checkedAt: new Date().toISOString(),
        metrics: {
          requests24h: stats.requests,
          bytes24h: stats.bytes,
          formattedBytes: (stats.bytes / 1024 / 1024).toFixed(2) + ' MB'
        }
      };

    } catch (error: any) {
      return {
        status: 'error',
        configured: true,
        checkedAt: new Date().toISOString(),
        error: { message: error.message }
      };
    }
  }
}
