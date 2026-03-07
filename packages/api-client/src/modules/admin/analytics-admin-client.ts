import { FetchClient } from '@quiz/api-client/core/fetch-client';
import {
  AdminContentHealthReport,
  AdminExamActivityReport,
  AdminMetricRow,
  AdminPerformanceAnalytics,
  AdminPlatformMetrics,
  AdminSystemUsage,
  AdminTrendSummary,
} from '@quiz/api-client/types';

export class AnalyticsAdminClient {
  constructor(private client: FetchClient) {}

  async getMetrics() {
    return this.client.get<AdminPlatformMetrics>('/admin/metrics');
  }

  async getUserMetrics() {
    return this.client.get<AdminPlatformMetrics>('/admin/metrics/users');
  }

  async getSecurityMetrics() {
    return this.client.get<Record<string, unknown>>('/admin/metrics/security');
  }

  async getContentHealthReport() {
    return this.client.get<AdminContentHealthReport[]>('/admin/metrics/content');
  }

  async getPerformanceAnalytics(range: string = '7d') {
    return this.client.get<AdminPerformanceAnalytics>(
      `/admin/metrics/performance?range=${range}`
    );
  }

  async getExamActivity() {
    return this.client.get<AdminExamActivityReport>('/admin/metrics/exams');
  }

  async getRBACMetrics() {
    return this.client.get<AdminMetricRow[]>('/admin/metrics/rbac');
  }

  async getBlueprintMetrics() {
    return this.client.get<Record<string, unknown>>('/admin/metrics/blueprints');
  }

  async getGrowthMetrics() {
    return this.client.get<AdminMetricRow[]>('/admin/metrics/growth');
  }

  async getSystemUsage() {
    return this.client.get<AdminSystemUsage>('/admin/system/usage');
  }

  async getTrendSummary(params: { range?: string } = {}) {
    const query = new URLSearchParams();
    if (params.range != null && params.range !== '')
      query.append('range', params.range);
    return this.client.get<AdminTrendSummary>(
      `/admin/trends/summary?${query.toString()}`
    );
  }

  async getScoreTrends(params: { userId?: string; range?: string } = {}) {
    const query = new URLSearchParams();
    if (params.userId != null && params.userId !== '')
      query.append('userId', params.userId);
    if (params.range != null && params.range !== '')
      query.append('range', params.range);
    return this.client.get<{ scores: AdminMetricRow[] }>(
      `/admin/trends/scores?${query.toString()}`
    );
  }

  async getSkillTrends(params: { userId?: string; range?: string } = {}) {
    const query = new URLSearchParams();
    if (params.userId != null && params.userId !== '')
      query.append('userId', params.userId);
    if (params.range != null && params.range !== '')
      query.append('range', params.range);
    return this.client.get<{ skills: AdminMetricRow[] }>(
      `/admin/trends/skills?${query.toString()}`
    );
  }
}
