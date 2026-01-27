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

  async getSubjects(page: number = 1, limit: number = 20, domainId?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (domainId) query.append('domainId', domainId);
    
    return this.client.get<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/subjects?${query.toString()}`);
  }

  async getTopics(page: number = 1, limit: number = 20, subjectId?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (subjectId) query.append('subjectId', subjectId);

    return this.client.get<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/topics?${query.toString()}`);
  }

  async getTopicSkills(topicId: string) {
    return this.client.get<any[]>(`/admin/topics/${topicId}/skills`);
  }

  async getSubtopics(page: number = 1, limit: number = 20, topicId?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (topicId) query.append('topicId', topicId);

    return this.client.get<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/subtopics?${query.toString()}`);
  }

  async getSkills(page: number = 1, limit: number = 20) {
    return this.client.get<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/skills?page=${page}&limit=${limit}`);
  }

  async getQuestions(page: number = 1, limit: number = 20, filters?: { domainId?: string; subjectId?: string; topicId?: string; subtopicId?: string; skillIds?: string[]; status?: string }) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (filters?.domainId) query.append('domainId', filters.domainId);
    if (filters?.subjectId) query.append('subjectId', filters.subjectId);
    if (filters?.topicId) query.append('topicId', filters.topicId);
    if (filters?.subtopicId) query.append('subtopicId', filters.subtopicId);
    if (filters?.skillIds && filters.skillIds.length > 0) {
        filters.skillIds.forEach(id => query.append('skillIds', id));
    }
    if (filters?.status) query.append('status', filters.status);

    return this.client.get<{
        questions: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/questions?${query.toString()}`);
  }

  async getQuestionById(id: string) {
    return this.client.get<any>(`/admin/questions/${id}`);
  }

  async createDomain(data: any) {
    return this.client.post<any>('/admin/domains', data);
  }

  async updateDomain(id: string, data: any) {
    return this.client.patch<any>(`/admin/domains/${id}`, data);
  }

  async deleteDomain(id: string) {
    return this.client.delete<any>(`/admin/domains/${id}`);
  }

  async createSubject(data: any) {
    return this.client.post<any>('/admin/subjects', data);
  }

  async updateSubject(id: string, data: any) {
    return this.client.patch<any>(`/admin/subjects/${id}`, data);
  }

  async deleteSubject(id: string) {
    return this.client.delete<any>(`/admin/subjects/${id}`);
  }

  async createTopic(data: any) {
    return this.client.post<any>('/admin/topics', data);
  }

  async updateTopic(id: string, data: any) {
    return this.client.patch<any>(`/admin/topics/${id}`, data);
  }

  async deleteTopic(id: string) {
    return this.client.delete<any>(`/admin/topics/${id}`);
  }

  async createSubtopic(data: any) {
    return this.client.post<any>('/admin/subtopics', data);
  }

  async updateSubtopic(id: string, data: any) {
    return this.client.patch<any>(`/admin/subtopics/${id}`, data);
  }

  async deleteSubtopic(id: string) {
    return this.client.delete<any>(`/admin/subtopics/${id}`);
  }

  async createSkill(data: any) {
    return this.client.post<any>('/admin/skills', data);
  }

  async updateSkill(id: string, data: any) {
    return this.client.patch<any>(`/admin/skills/${id}`, data);
  }

  async deleteSkill(id: string) {
    return this.client.delete<any>(`/admin/skills/${id}`);
  }

  async mapTopicSkills(topicId: string, skillIds: string[]) {
    return this.client.post<any>(`/admin/topics/${topicId}/skills`, { skillIds });
  }

  async createQuestion(data: any) {
    return this.client.post<any>('/admin/questions', data);
  }

  async bulkCreateQuestions(data: { topicId: string, subtopicId?: string, skillId?: string, skillIds?: string[], questions: any[] }) {
    return this.client.post<any>('/admin/questions/bulk', data);
  }

  async updateQuestion(id: string, data: any) {
    return this.client.patch<any>(`/admin/questions/${id}`, data);
  }

  async deleteQuestion(id: string) {
    return this.client.delete<any>(`/admin/questions/${id}`);
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

  async getUsers(page: number = 1, limit: number = 20, status: 'active' | 'deleted' = 'active') {
    return this.client.get<{
        users: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/users?page=${page}&limit=${limit}&status=${status}`);
  }

  async updateUser(id: string, data: any) {
    return this.client.patch<any>(`/admin/users/${id}`, data);
  }

  async deleteUser(id: string) {
    return this.client.delete<any>(`/admin/users/${id}`);
  }

  async login(email: string, password: string) {
    return this.client.post<{ user: any; accessToken: string }>('/admin/auth/login', { email, password });
  }
}
