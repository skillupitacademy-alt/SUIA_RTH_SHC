import { Redis } from '@upstash/redis';
import { LRUCache } from 'lru-cache';

import { logger } from '@/lib/logger';

interface _CacheOptions {
  ttl?: number;
  maxSize?: number;
}

const REDIS_TIMEOUT_MS = 1000; // Increased to 1s for stable Admin checks (Upstash REST)
const REDIS_COOLDOWN_MS = 60000; // 60s cooldown on failure

export class CacheService {
  private static instance: CacheService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache: LRUCache<string, any>;
  private redis: Redis | null = null;
  private isDebug: boolean;
  private redisDeadUntil: number = 0;

  private constructor() {
    this.isDebug = process.env.DEBUG_CACHE === 'true';
    this.cache = new LRUCache({
      max: 500, // Bound memory usage
      ttl: 1000 * 60 * 5, // Default 5 mins
      allowStale: false,
      updateAgeOnGet: false,
    });

    // Initialize Redis if credentials exist
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl !== undefined && redisToken !== undefined) {
      try {
        this.redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });
        // logger.debug('[Cache] Edge-compatible Redis provider initialized (Upstash)');
      } catch (e) {
        logger.error({ err: e }, '[Cache] Failed to initialize Redis provider');
      }
    }
  }

  public static getInstance(): CacheService {
    if (CacheService.instance === undefined) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Helper to wrap Redis calls with a timeout and cooldown
   */
  private async withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
    if (this.redis === null) return fallback;

    // Circuit Breaker: Skip if in cooldown
    if (Date.now() < this.redisDeadUntil) {
      if (this.isDebug) { /* logger.debug('[Cache] Redis in cooldown, skipping...'); */ }
      return fallback;
    }

    const timeout = new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Redis Timeout')), REDIS_TIMEOUT_MS);
    });

    try {
      return await Promise.race([promise, timeout]);
    } catch (e: unknown) {
      logger.error({ err: e, cooldownSeconds: REDIS_COOLDOWN_MS / 1000 }, '[Cache] Redis operation failed or timed out; entering cooldown');
      this.redisDeadUntil = Date.now() + REDIS_COOLDOWN_MS;
      return fallback;
    }
  }

  private debug(op: string, key: string) {
    if (this.isDebug) {
      logger.debug({ op, key }, '[Cache] debug');
    }
  }

  /**
   * Generates a stable hash for objects (sorted keys)
   */
  public generateKey(prefix: string, data: unknown): string {
    const stableString = this.hash(data);
    return `${prefix}:${stableString}`;
  }

  /**
   * Helper to generate a stable hash for objects (sorted keys)
   */
  private hash(data: unknown): string {
    const dataObj = typeof data === 'object' && data !== null ? data : {};
    return JSON.stringify(dataObj, Object.keys(dataObj as Record<string, unknown>).sort());
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const value = this.cache.get(key) as T | undefined;
      
      if (this.isDebug === true) {
        // console.log(`[Cache] ${value !== undefined ? '[HIT]' : '[MISS]'}: ${key}`);
      }
      
      if (value !== undefined) return value;

      // Primary: Redis Fallback
      if (this.redis !== null) {
        const redisValue = await this.withTimeout(this.redis.get<T>(key), null);
        if (redisValue !== null) {
          this.cache.set(key, redisValue); // Backfill local
          return redisValue;
        }
      }

      return null;
    } catch (_error) {
      logger.error({ err: _error, key }, '[Cache] Error retrieving key');
      return null;
    }
  }

  public async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      this.cache.set(key, value, { ttl });
      if (this.isDebug === true) {
        // console.log(`[Cache] [SET]: ${key} (TTL: ${ttl ?? 'default'})`);
      }

      if (this.redis !== null) {
        const setPromise = ttl !== undefined 
          ? this.redis.set(key, value, { px: ttl }) 
          : this.redis.set(key, value);
        await this.withTimeout(setPromise, null);
      }
    } catch (_error) {
      logger.error({ err: _error, key }, '[Cache] Error setting key');
    }
  }

  public async del(key: string): Promise<void> {
    try {
      this.cache.delete(key);
      if (this.isDebug === true) {
        // console.log(`[Cache] [DEL]: ${key}`);
      }
      
      if (this.redis !== null) {
        await this.withTimeout(this.redis.del(key), null);
      }
    } catch (_error) {
      logger.error({ err: _error, key }, '[Cache] Error deleting key');
    }
  }

  /**
   * Utility for pattern-based deletion (simplistic for Phase 1)
   */
  public async delByPrefix(prefix: string): Promise<void> {
    try {
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      }
    } catch (_error) {
      logger.error({ err: _error, prefix }, '[Cache] Error deleting prefix');
    }
  }

  /**
   * Atomic increment for a fixed window.
   * Returns current count and remaining TTL in seconds.
   */
  public async increment(key: string, windowMs: number): Promise<{ count: number; ttlRem: number }> {
    try {
      // 1. Try Redis with aggressive timeout & cooldown
      if (this.redis !== null) {
        const result = await this.withTimeout((async () => {
          const count = await this.redis!.incr(key);
          if (count === 1) {
            await this.redis!.pexpire(key, windowMs);
          }
          const ttl = await this.redis!.pttl(key);
          return { count, ttlRem: Math.max(1, Math.ceil(ttl / 1000)) };
        })(), null);

        if (result !== null) return result;
      }

      // 2. Local Fallback
      let count = (this.cache.get(key) as number) || 0;
      count++;
      
      let ttlRemSeconds = Math.ceil(windowMs / 1000);

      if (count === 1) {
        this.cache.set(key, count, { ttl: windowMs });
      } else {
        const remainingMs = this.cache.getRemainingTTL(key);
        if (remainingMs > 0) {
          ttlRemSeconds = Math.ceil(remainingMs / 1000);
        }
        this.cache.set(key, count, { ttl: remainingMs > 0 ? remainingMs : windowMs });
      }

      if (this.isDebug === true) {
        // console.log(`[Cache] [INCR]: ${key} -> ${count} (TTL REM: ${ttlRemSeconds}s)`);
      }

      return { count, ttlRem: ttlRemSeconds };
    } catch (_error) {
      logger.error({ err: _error, key }, '[Cache] Error incrementing key');
      return { count: 1, ttlRem: 60 };
    }
  }

  /**
   * Get Redis usage statistics
   */
  public async getUsage(): Promise<{ configured: boolean; keys?: number; memory?: string; memoryBytes?: number }> {
    if (!this.redis) {
      return { configured: false };
    }

    try {
      // Use the INFO command to get memory stats
      // Upstash Redis info() returns a string, but we cast to any to be safe with different versions/types
      // Use the raw .execute() method for 'info memory' which is the correct way for Upstash REST client
      const infoResponse = await this.withTimeout(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.redis as any).execute(['info', 'memory']),
        null
      );
      
      // Try to get key count (DB0 is default)
      const dbsize = await this.withTimeout(this.redis.dbsize(), 0);

      let memory = 'Unknown';
      let memoryBytes = 0;

      if (typeof infoResponse === 'string') {
        const infoStr = infoResponse as string;
        const memMatch = infoStr.match(/used_memory_human:([^\r\n]+)/);
        const memBytesMatch = infoStr.match(/used_memory:(\d+)/);
        
        if (memMatch) memory = memMatch[1];
        if (memBytesMatch) memoryBytes = parseInt(memBytesMatch[1], 10);
      } else if (infoResponse !== null && infoResponse !== undefined && typeof infoResponse === 'object') {
        // Handle case where info() might return a parsed object
        const infoObj = infoResponse as Record<string, unknown>;
        memory = (infoObj.used_memory_human as string) || ((infoObj.memory as Record<string, unknown>)?.used_memory_human as string) || 'Unknown';
        memoryBytes = parseInt((infoObj.used_memory as string) || ((infoObj.memory as Record<string, unknown>)?.used_memory as string) || '0', 10);
      }

      return {
        configured: true,
        keys: dbsize,
        memory,
        memoryBytes,
      };
    } catch (_error) {
      logger.error({ err: _error }, '[Cache] Error getting Redis usage');
      // Return a safer fallback that doesn't just say "Error" if we can help it
      return { configured: true, keys: 0, memory: 'Unavailable', memoryBytes: 0 };
    }
  }
}

export const cacheService = CacheService.getInstance();
