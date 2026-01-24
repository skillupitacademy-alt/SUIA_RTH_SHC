import { FetchClient } from '../core/fetch-client';

export class DashboardClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

  async getDashboard() {
    return this.client.get<any>('/dashboard');
  }
}
