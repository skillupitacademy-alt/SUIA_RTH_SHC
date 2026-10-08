/**
 * Standard Cache TTLs for Analytics & Activity (in seconds)
 */
export const CACHE_TTL = {
  // 1. Analytics: Global Aggregates (Materialized Views based)
  ADMIN_GLOBAL: 3600, // 1 Hour

  // 2. Analytics: Individual Student Performance (Real-time DB filtered)
  USER_PERSONAL: 120, // 2 Minutes

  // 3. Activity Feed: Audit logs, Login history, Recent Actions
  // (Short TTL so users see their latest actions quickly)
  ACTIVITY_FEED: 60, // 1 Minute

  // 4. Metadata: Static resources, Roles, Category lists
  METADATA: 300, // 5 Minutes

  // 5. Auth Strategy:
  // - Login/Logout Actions: 0 (Strictly No Cache)
  // - Session Validation: Handled by JWT expiry
  AUTH_STATE: 0,
} as const;

/**
 * Standard Redis Key Patterns
 */
export const CACHE_KEYS = {
  ANALYTICS: {
    ADMIN: (metric: string) => `analytics:admin:${metric}`,
    USER: (userId: string, metric: string) => `analytics:user:${userId}:${metric}`,
  },
  ACTIVITY: {
    LOGS: (userId: string) => `activity:logs:${userId}`,
    AUDIT: (scope: string) => `activity:audit:${scope}`,
  },
};
