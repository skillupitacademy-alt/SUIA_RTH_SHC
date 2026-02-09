import { FetchClient } from '../core/fetch-client';

export class DashboardClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

    async getDashboard(range: string = '7d', page: number = 1, limit: number = 6) {
        const query = new URLSearchParams({ range, page: page.toString(), limit: limit.toString() });
        return this.client.get(`/dashboard?${query.toString()}`);
    }
}
