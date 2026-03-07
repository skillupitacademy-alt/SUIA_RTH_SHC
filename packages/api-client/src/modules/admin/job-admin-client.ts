import { FetchClient } from '@quiz/api-client/core/fetch-client';
import { BackgroundJob } from '@quiz/api-client/types';

export class JobAdminClient {
  constructor(private client: FetchClient) {}

  async createJob(type: string, payload?: Record<string, unknown>) {
    return this.client.post<{ job: BackgroundJob }>('/admin/jobs', {
      type,
      payload,
    });
  }

  async getJobById(id: string) {
    return this.client.get<{ job: BackgroundJob }>(`/admin/jobs/${id}`);
  }
}
