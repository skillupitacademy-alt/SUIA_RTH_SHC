import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@quiz/api-client';

export function useSubjects(domainId?: string) {
  return useQuery({
    queryKey: ['subjects', domainId],
    queryFn: async () => {
      if (!domainId) return [];
      apiClient.client.setPortalIdentity('user');
      const data = await apiClient.dashboard.getPerformanceBreakdownMetadata() as { subjects?: Array<{ domainId?: string; dimensionId?: string; name?: string }> };
      return (data?.subjects || []).filter((s) => s.domainId === domainId);
    },
    enabled: !!domainId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
