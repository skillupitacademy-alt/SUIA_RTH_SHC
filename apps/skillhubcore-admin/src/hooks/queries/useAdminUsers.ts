import { apiClient } from '@quiz/api-client';
import { useQuery } from '@tanstack/react-query';

export interface AdminUserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export function useAdminUsers(filters: AdminUserFilters = {}) {
  return useQuery({
    queryKey: ['admin-users', filters],
    queryFn: async () => {
      apiClient.client.setPortalIdentity('admin');
      return apiClient.admin.users.getUsers(filters.page?.toString(), filters.limit, 'active', filters);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
