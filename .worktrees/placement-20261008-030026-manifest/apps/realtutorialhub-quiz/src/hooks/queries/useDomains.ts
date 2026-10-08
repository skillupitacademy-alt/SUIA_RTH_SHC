import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@quiz/api-client';

export function useDomains() {
  return useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      apiClient.client.setPortalIdentity('user');
      const data = await apiClient.dashboard.getPerformanceBreakdownMetadata() as { domains?: Array<{ dimensionId?: string; name?: string }> };
      return data?.domains || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour (domains rarely change)
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
