import { FetchClient } from '../core/fetch-client';

export interface TrendResponse {
    performanceTrend: { score: number; date: string }[];
    averageScore: number;
    currentAvg?: number;
    previousAvg?: number;
    deltaPct?: number | null;
    healthStatus?: 'green' | 'yellow' | 'red';
}

export class DashboardClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

    async getDashboard(range: string = '7d', page: number = 1, limit: number = 6) {
        const query = new URLSearchParams({ range, page: page.toString(), limit: limit.toString() });
        return this.client.get(`/dashboard?${query.toString()}`);
    }

    async getTrend(range: string = '7d') {
        const query = new URLSearchParams({ range });
        return this.client.get<TrendResponse>(`/dashboard/trend?${query.toString()}`);
    }

    async getPerformanceBreakdownMetadata() {
        return this.client.get('/dashboard/metadata');
    }

    async getPerformanceBreakdown(range: string = '28d') {
        const query = new URLSearchParams({ range });
        return this.client.get(`/dashboard/breakdown?${query.toString()}`);
    }
}
