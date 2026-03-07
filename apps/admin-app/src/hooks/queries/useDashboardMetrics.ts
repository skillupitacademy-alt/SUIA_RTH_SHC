import { apiClient } from '@quiz/api-client';
import { useQuery } from '@tanstack/react-query';

type GrowthMetric = { id?: string; date?: string; name?: string; score?: number; count?: number };

export function useDashboardMetrics(range: string = '7d') {
  return useQuery({
    queryKey: ['admin-dashboard-metrics', range],
    queryFn: async () => {
      apiClient.client.setPortalIdentity('admin');
      return apiClient.admin.getPerformanceAnalytics(range);
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Auto-refresh every 60 seconds
  });
}

export function useGrowthMetrics() {
  return useQuery({
    queryKey: ['admin-growth-metrics'],
    queryFn: async () => {
      apiClient.client.setPortalIdentity('admin');
      const data = await apiClient.admin.getGrowthMetrics();
      return Array.isArray(data)
        ? data.map((g: GrowthMetric, idx: number) => ({
            id: g.id ?? g.date ?? `metric-${idx}`,
            name: g.name ?? g.date ?? 'Metric',
            accuracy: typeof g.score === 'number' ? Math.round(g.score * 100) / 100 : 0,
            sampleSize: typeof g.count === 'number' ? g.count : 0
          }))
        : [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
