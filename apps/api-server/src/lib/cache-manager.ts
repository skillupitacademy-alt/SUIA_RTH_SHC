import { LRUCache } from 'lru-cache';

// Dashboard Data Cache
// TTL: 60 seconds (short-lived)
// Max Items: 5000 items
const dashboardCache = new LRUCache<string, any>({
  max: 5000,
  ttl: 60 * 1000, 
});

// Rate Limiter Cache
// Window: 60 seconds
// Limit: 60 requests
const rateLimitCache = new LRUCache<string, number>({
  max: 10000, 
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

  getTrend: (userId: string, range: string) => {
    const key = `trend:${userId}:${range}`;
    return dashboardCache.get(key);
  },

  setTrend: (userId: string, range: string, data: any) => {
    const key = `trend:${userId}:${range}`;
    dashboardCache.set(key, data);
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
