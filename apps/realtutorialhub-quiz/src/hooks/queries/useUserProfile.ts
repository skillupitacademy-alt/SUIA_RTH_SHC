import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@quiz/api-client';

export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      apiClient.client.setPortalIdentity('user');
      return apiClient.auth.getSession();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
