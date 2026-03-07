import { FetchClient } from '@quiz/api-client/core/fetch-client';
import {
  AdminSessionListResponse,
  AdminLiveSession,
  PaginatedResponse,
} from '@quiz/api-client/types';

export class SessionAdminClient {
  constructor(private client: FetchClient) {}

  async getLiveSessions(
    page: number = 1,
    limit: number = 10,
    search?: string
  ) {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search != null && search !== '') query.append('search', search);

    return this.client.get<{
      sessions: AdminLiveSession[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/admin/sessions/live?${query.toString()}`);
  }
}
