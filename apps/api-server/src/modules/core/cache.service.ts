import { LRUCache } from 'lru-cache';
import { Redis } from '@upstash/redis';

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

const REDIS_TIMEOUT_MS = 2000; // 2s timeout for rate limiting operations

export class CacheService {
  private static instance: CacheService;
  private cache: LRUCache<string, any>;
  private redis: Redis | null = null;
  private isDebug: boolean;

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

    if (redisUrl && redisToken) {
      try {
        this.redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });
        console.log('[Cache] Edge-compatible Redis provider initialized (Upstash)');
      } catch (e) {
        console.error('[Cache] Failed to initialize Redis provider:', e);
      }
    }
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Helper to wrap Redis calls with a timeout
   */
  private async withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
    const timeout = new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Redis Timeout')), REDIS_TIMEOUT_MS);
    });
    try {
      return await Promise.race([promise, timeout]);
    } catch (e) {
      console.error(`[Cache] Redis operation failed or timed out:`, e);
      return fallback;
    }
  }

  /**
   * Generates a stable hash for objects (sorted keys)
   */
  public generateKey(prefix: string, data: any): string {
    const stableString = JSON.stringify(data, Object.keys(data).sort());
    return `${prefix}:${stableString}`;
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const value = this.cache.get(key) as T | undefined;
      
      if (this.isDebug) {
        console.log(`[Cache] ${value ? '[HIT]' : '[MISS]'}: ${key}`);
      }
      
      if (value !== undefined) return value;

      // Primary: Redis Fallback
      if (this.redis) {
        const redisValue = await this.withTimeout(this.redis.get<T>(key), null);
        if (redisValue !== null) {
          this.cache.set(key, redisValue); // Backfill local
          return redisValue;
        }
      }

      return null;
    } catch (error) {
      console.error(`[Cache] Error retrieving key ${key}:`, error);
      return null;
    }
  }

  public async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      this.cache.set(key, value, { ttl });
      if (this.isDebug) {
        console.log(`[Cache] [SET]: ${key} (TTL: ${ttl ?? 'default'})`);
      }

      if (this.redis) {
        const setPromise = ttl 
          ? this.redis.set(key, value, { px: ttl }) 
          : this.redis.set(key, value);
        await this.withTimeout(setPromise, null);
      }
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error);
    }
  }

  public async del(key: string): Promise<void> {
    try {
      this.cache.delete(key);
      if (this.isDebug) {
        console.log(`[Cache] [DEL]: ${key}`);
      }
      
      if (this.redis) {
        await this.withTimeout(this.redis.del(key), null);
      }
    } catch (error) {
      console.error(`[Cache] Error deleting key ${key}:`, error);
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
    } catch (error) {
      console.error(`[Cache] Error deleting prefix ${prefix}:`, error);
    }
  }

  /**
   * Atomic increment for a fixed window.
   * Returns current count and remaining TTL in seconds.
   */
  public async increment(key: string, windowMs: number): Promise<{ count: number; ttlRem: number }> {
    try {
      if (this.redis) {
        try {
          // Wrap INCR logic in timeout
          const result = await this.withTimeout((async () => {
            const count = await this.redis!.incr(key);
            if (count === 1) {
              await this.redis!.pexpire(key, windowMs);
            }
            const ttl = await this.redis!.pttl(key);
            return { count, ttlRem: Math.max(1, Math.ceil(ttl / 1000)) };
          })(), null);

          if (result) return result;
          // If result is null (timeout/failure), fall through to local
        } catch (e) {
          // Already logged in withTimeout
        }
      }

      // Local Fallback
      let count = (this.cache.get(key) as number) || 0;
      count++;
      
      let ttlRemSeconds = Math.ceil(windowMs / 1000);

      if (count === 1) {
        this.cache.set(key, count, { ttl: windowMs });
      } else {
        // Correctness fix: Get actual remaining TTL from lru-cache
        const remainingMs = this.cache.getRemainingTTL(key);
        if (remainingMs > 0) {
          ttlRemSeconds = Math.ceil(remainingMs / 1000);
        }
        this.cache.set(key, count, { ttl: remainingMs > 0 ? remainingMs : windowMs });
      }

      if (this.isDebug) {
        console.log(`[Cache] [INCR]: ${key} -> ${count} (TTL REM: ${ttlRemSeconds}s)`);
      }

      return { count, ttlRem: ttlRemSeconds };
    } catch (error) {
      console.error(`[Cache] Error incrementing key ${key}:`, error);
      return { count: 1, ttlRem: 60 };
    }
  }
}

export const cacheService = CacheService.getInstance();
