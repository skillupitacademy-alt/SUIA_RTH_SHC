import { apiClient } from '@quiz/api-client';
import { useQuery } from '@tanstack/react-query';

export interface AdminQuestionFilters {
  page?: number;
  limit?: number;
  search?: string;
  domainId?: string;
  subjectId?: string;
}

export function useAdminQuestions(filters: AdminQuestionFilters = {}) {
  return useQuery({
    queryKey: ['admin-questions', filters],
    queryFn: async () => {
      apiClient.client.setPortalIdentity('admin');
      return apiClient.admin.questions.getQuestions(filters.page?.toString(), filters.limit, filters);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
