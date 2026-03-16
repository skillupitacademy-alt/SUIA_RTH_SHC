import { AdminDashboardSummary } from './bff-types';

/**
 * Fetches the aggregated dashboard summary from the BFF route.
 * Follows the same fetch pattern as existing utilities.
 */
export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const response = await fetch('/api/bff/dashboard-summary', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // No caching as per T123 requirements (T125 is Chunk 4)
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`BFF Request Failed: ${response.statusText}`);
  }

  return response.json();
}
