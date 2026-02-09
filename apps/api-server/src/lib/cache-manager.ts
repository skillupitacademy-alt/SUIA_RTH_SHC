import { LRUCache } from 'lru-cache';

// Dashboard Data Cache
// TTL: 60 seconds (short-lived to balance freshness and load)
// Max Items: 1000 users * 2-3 active views = ~3000 items
const dashboardCache = new LRUCache<string, any>({
  max: 5000,
  ttl: 60 * 1000, 
});

// Simple In-Memory Rate Limiter
// Window: 60 seconds
// Limit: 60 requests
const rateLimitCache = new LRUCache<string, number>({
  max: 10000, // Track up to 10k unique IPs/Users
  ttl: 60 * 1000,
});

export const CacheManager = {
  // Dashboard Caching
  getDashboard: (userId: string, range: string, page: number, limit: number) => {
    const key = `dashboard:${userId}:${range}:${page}:${limit}`;
    return dashboardCache.get(key);
  },

  setDashboard: (userId: string, range: string, page: number, limit: number, data: any) => {
    const key = `dashboard:${userId}:${range}:${page}:${limit}`;
    dashboardCache.set(key, data);
  },

  invalidateUser: (userId: string) => {
    // LRU-Cache doesn't support wildcard delete easily without iteration.
    // For MVP/Hardening, we accept 60s staleness or rely on TTL.
    // If strict invalidation is needed, we'd need a different structure (e.g. version tagging).
    // For now, we rely on the short TTL.
  },

  // Rate Limiting (Fixed Window)
  checkRateLimit: (identifier: string, limit: number = 60): { allowed: boolean; remaining: number } => {
    const window = Math.floor(Date.now() / 60000); // 1-minute window
    const key = `rate:${identifier}:${window}`;
    
    // Get current count or default to 0
    const current = (rateLimitCache.get(key) as number) || 0;
    
    if (current >= limit) {
      return { allowed: false, remaining: 0 };
    }
    
    // Increment
    rateLimitCache.set(key, current + 1);
    return { allowed: true, remaining: limit - (current + 1) };
  }
};
