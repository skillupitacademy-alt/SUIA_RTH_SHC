import { FetchClient } from '../core/fetch-client';

export class DashboardClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

  async getDashboard(range: string = '7d') {
    return this.client.get<any>(`/dashboard?range=${range}`);
  }
}
