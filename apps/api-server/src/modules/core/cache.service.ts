import { LRUCache } from 'lru-cache';
import { Redis } from '@upstash/redis';

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

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
        try {
          const redisValue = await this.redis.get<T>(key);
          if (redisValue !== null) {
            this.cache.set(key, redisValue); // Backfill local
            return redisValue;
          }
        } catch (e) {
          console.error(`[Cache] Redis GET failed for ${key}:`, e);
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
        try {
          if (ttl) {
            await this.redis.set(key, value, { px: ttl });
          } else {
            await this.redis.set(key, value);
          }
        } catch (e) {
          console.error(`[Cache] Redis SET failed for ${key}:`, e);
        }
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
        try {
          await this.redis.del(key);
        } catch (e) {
          console.error(`[Cache] Redis DEL failed for ${key}:`, e);
        }
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
          const count = await this.redis.incr(key);
          if (count === 1) {
            await this.redis.pexpire(key, windowMs);
          }
          const ttl = await this.redis.pttl(key);
          return { 
            count, 
            ttlRem: Math.max(1, Math.ceil(ttl / 1000)) 
          };
        } catch (e) {
          console.error(`[Cache] Redis INCR failed for ${key}:`, e);
        }
      }

      // Local Fallback
      const cached = this.cache.get(key);
      let count = (cached as number) || 0;
      count++;
      
      if (count === 1) {
        this.cache.set(key, count, { ttl: windowMs });
      } else {
        this.cache.set(key, count); 
      }

      if (this.isDebug) {
        console.log(`[Cache] [INCR]: ${key} -> ${count}`);
      }

      return { 
        count, 
        ttlRem: Math.ceil(windowMs / 1000) 
      };
    } catch (error) {
      console.error(`[Cache] Error incrementing key ${key}:`, error);
      return { count: 1, ttlRem: 60 };
    }
  }
}

export const cacheService = CacheService.getInstance();
