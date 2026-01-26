import { FetchClient } from '../core/fetch-client';

export class AdminClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

  async getDomains(page: number = 1, limit: number = 20) {
    return this.client.get<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/domains?page=${page}&limit=${limit}`);
  }

  async getSubjects(page: number = 1, limit: number = 20) {
    return this.client.get<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/subjects?page=${page}&limit=${limit}`);
  }

  async getTopics(page: number = 1, limit: number = 20) {
    return this.client.get<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/topics?page=${page}&limit=${limit}`);
  }

  async getQuestions(page: number = 1, limit: number = 20) {
    return this.client.get<{
        questions: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/questions?page=${page}&limit=${limit}`);
  }

  async getMetrics() {
    return this.client.get<any>('/admin/metrics');
  }

  async getUserMetrics() {
    return this.client.get<any>('/admin/metrics/users');
  }

  async getSecurityMetrics() {
    return this.client.get<any>('/admin/metrics/security');
  }

  async getContentHealth() {
    return this.client.get<any[]>('/admin/metrics/content');
  }

  async getPerformanceAnalytics() {
    return this.client.get<any[]>('/admin/metrics/performance');
  }

  async getExamActivity() {
    return this.client.get<any>('/admin/metrics/exams');
  }

  async getRBACMetrics() {
    return this.client.get<any[]>('/admin/metrics/rbac');
  }

  async getBlueprintMetrics() {
    return this.client.get<any>('/admin/metrics/blueprints');
  }

  async getGrowthMetrics() {
    return this.client.get<any[]>('/admin/metrics/growth');
  }

  async getAuditLogs() {
    return this.client.get<any[]>('/admin/logs');
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

  async getUsers(page: number = 1, limit: number = 20) {
    return this.client.get<{
        users: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/users?page=${page}&limit=${limit}`);
  }

  async login(email: string, password: string) {
    return this.client.post<{ user: any; accessToken: string }>('/admin/auth/login', { email, password });
  }
}
