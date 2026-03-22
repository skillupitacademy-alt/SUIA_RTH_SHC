'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@quiz/api-client';
import type { StatsOverview } from '@/components/dashboard/StatsCards';

export interface DashboardActivity {
  id: string;
  status: string;
  relativeTime: string;
  title: string;
  score: number | null;
}

export interface DashboardData {
  overview: StatsOverview;
  deltaPct: number | null;
  healthStatus: 'green' | 'yellow' | 'red';
  recentActivity: DashboardActivity[];
}

export function useDashboardQuery(range: string = '7d', page: number = 1, pageSize: number = 3) {
  return useQuery({
    queryKey: ['dashboard', range, page, pageSize],
    queryFn: async () => {
      return await apiClient.dashboard.getDashboard(range, page, pageSize) as DashboardData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
