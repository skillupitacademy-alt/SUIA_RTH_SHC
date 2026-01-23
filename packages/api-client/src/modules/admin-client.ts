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
}
