import { LRUCache } from 'lru-cache';

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache: LRUCache<string, any>;
  private isDebug: boolean;

  private constructor() {
    this.isDebug = process.env.DEBUG_CACHE === 'true';
    this.cache = new LRUCache({
      max: 500, // Bound memory usage
      ttl: 1000 * 60 * 5, // Default 5 mins
      allowStale: false,
      updateAgeOnGet: false,
    });
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
        console.log(`[Cache] ${value ? '✅ HIT' : '❌ MISS'}: ${key}`);
      }
      
      return value ?? null;
    } catch (error) {
      console.error(`[Cache] Error retrieving key ${key}:`, error);
      return null; // Fail-safe fallback
    }
  }

  public async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      this.cache.set(key, value, { ttl });
      if (this.isDebug) {
        console.log(`[Cache] 📥 SET: ${key} (TTL: ${ttl ?? 'default'})`);
      }
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error);
    }
  }

  public async del(key: string): Promise<void> {
    try {
      this.cache.delete(key);
      if (this.isDebug) {
        console.log(`[Cache] 🗑️ DEL: ${key}`);
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
}

export const cacheService = CacheService.getInstance();
