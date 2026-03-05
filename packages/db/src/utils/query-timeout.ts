/**
 * Database Query Timeout Utility (Task 37)
 * Usage: const result = await withTimeout(db.select()..., STANDARD_QUERY_TIMEOUT, 'fetch exam by id');
 */

export const QUICK_QUERY_TIMEOUT = 5_000;    // 5s — simple lookups
export const STANDARD_QUERY_TIMEOUT = 15_000; // 15s — standard CRUD
export const REPORT_QUERY_TIMEOUT = 30_000;   // 30s — analytics/aggregations
export const MIGRATION_TIMEOUT = 120_000;      // 120s — migrations

export class QueryTimeoutError extends Error {
  constructor(queryDescription: string, timeoutMs: number) {
    super(`Query "${queryDescription}" exceeded ${timeoutMs}ms timeout`);
    this.name = 'QueryTimeoutError';
  }
}

/**
 * Wraps a database query promise with a timeout.
 */
export async function withTimeout<T>(
  queryPromise: Promise<T>,
  timeoutMs: number,
  queryDescription: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      console.warn(`[DB Timeout] ${queryDescription} exceeded ${timeoutMs}ms`);
      reject(new QueryTimeoutError(queryDescription, timeoutMs));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([queryPromise, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timeoutId!);
  }
}
