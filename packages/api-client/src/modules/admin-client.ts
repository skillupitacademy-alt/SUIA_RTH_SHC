import { FetchClient } from '../core/fetch-client';

export class AdminClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

  async getDomains() {
    return this.client.get<any[]>('/admin/domains');
  }

  async getQuestions() {
    return this.client.get<any[]>('/admin/questions');
  }

  async getMetrics() {
    return this.client.get<any>('/admin/metrics');
  }

  async getLiveSessions(page: number = 1, limit: number = 10) {
    return this.client.get<{
      sessions: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/admin/sessions/live?page=${page}&limit=${limit}`);
  }

  async login(email: string, password: string) {
    return this.client.post<{ user: any; accessToken: string }>('/admin/auth/login', { email, password });
  }
}
