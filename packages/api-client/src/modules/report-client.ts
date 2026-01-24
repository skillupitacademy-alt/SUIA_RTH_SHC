import { FetchClient } from '../core/fetch-client';

export class ReportClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

  async getUserPerformance() {
    return this.client.get<any>('/reports');
  }

  async getExamReport(examId: string) {
    return this.client.get<any>(`/reports?id=${examId}`);
  }
}
