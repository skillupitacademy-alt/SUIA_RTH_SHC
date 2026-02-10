import { FetchClient } from '../core/fetch-client';


export interface AdminTrendSummary {
    avgScore: number;
    passRate: number;
    totalExams: number;
    bestSkill: { name: string; delta: number } | null;
    worstSkill: { name: string; delta: number } | null;
    currentStreak: number;
    deltaPct?: number | null;
    healthStatus?: 'green' | 'yellow' | 'red';
}

export class AdminClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

  async getDomains(page: number = 1, limit: number = 20, search?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) query.append('search', search);

    return this.client.get<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/domains?${query.toString()}`);
  }

  async getSubjects(page: number = 1, limit: number = 20, domainId?: string, search?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (domainId) query.append('domainId', domainId);
    if (search) query.append('search', search);
    
    return this.client.get<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/subjects?${query.toString()}`);
  }

  async getTopics(page: number = 1, limit: number = 20, subjectId?: string, search?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (subjectId) query.append('subjectId', subjectId);
    if (search) query.append('search', search);

    return this.client.get<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/topics?${query.toString()}`);
  }

  async getSubjectsByDomain(domainId: string) {
    return this.getSubjects(1, 100, domainId).then(res => res.data);
  }

  async getTopicsBySubject(subjectId: string) {
    return this.getTopics(1, 100, subjectId).then(res => res.data);
  }

  async getTopicSkills(topicId: string) {
    return this.client.get<any[]>(`/admin/topics/${topicId}/skills`);
  }

  async getSubtopics(page: number = 1, limit: number = 20, topicId?: string, search?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (topicId) query.append('topicId', topicId);
    if (search) query.append('search', search);

    return this.client.get<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/subtopics?${query.toString()}`);
  }

  async getSkills(page: number = 1, limit: number = 20, search?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) query.append('search', search);

    return this.client.get<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/skills?${query.toString()}`);
  }

  async getQuestions(page: number = 1, limit: number = 20, filters?: { domainId?: string; subjectId?: string; topicId?: string; subtopicId?: string; skillIds?: string[]; status?: string; search?: string }) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (filters?.domainId) query.append('domainId', filters.domainId);
    if (filters?.subjectId) query.append('subjectId', filters.subjectId);
    if (filters?.topicId) query.append('topicId', filters.topicId);
    if (filters?.subtopicId) query.append('subtopicId', filters.subtopicId);
    if (filters?.skillIds && filters.skillIds.length > 0) {
        filters.skillIds.forEach(id => query.append('skillIds', id));
    }
    if (filters?.status) query.append('status', filters.status);
    if (filters?.search) query.append('search', filters.search);

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

  async batchDeleteDomains(ids: string[]) {
    return this.client.post<any>('/admin/domains/batch-delete', { ids });
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

  async batchDeleteSubjects(ids: string[]) {
    return this.client.post<any>('/admin/subjects/batch-delete', { ids });
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

  async batchDeleteTopics(ids: string[]) {
    return this.client.post<any>('/admin/topics/batch-delete', { ids });
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

  async batchDeleteSubtopics(ids: string[]) {
    return this.client.post<any>('/admin/subtopics/batch-delete', { ids });
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

  async batchDeleteSkills(ids: string[]) {
    return this.client.post<any>('/admin/skills/batch-delete', { ids });
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

  async batchDeleteQuestions(ids: string[]) {
    return this.client.post<any>('/admin/questions/batch-delete', { ids });
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

  async getContentHealthReport() {
    return this.client.get<any[]>('/admin/metrics/content');
  }

  async getPerformanceAnalytics(range: string = '7d') {
    return this.client.get<any>(`/admin/metrics/performance?range=${range}`);
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

  async getLiveSessions(page: number = 1, limit: number = 10, search?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) query.append('search', search);

    return this.client.get<{
      sessions: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/admin/sessions/live?${query.toString()}`);
  }

  async getUsers(page: number = 1, limit: number = 20, status: 'active' | 'deleted' = 'active', filters?: { search?: string; role?: string; isBlocked?: boolean; isVerified?: boolean; status?: string }) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString(), status });
    if (filters?.search) query.append('search', filters.search);
    if (filters?.role) query.append('role', filters.role);
    if (filters?.isBlocked !== undefined) query.append('isBlocked', filters.isBlocked ? 'true' : 'false');
    if (filters?.isVerified !== undefined) query.append('isVerified', filters.isVerified ? 'true' : 'false');
    if (filters?.status) query.append('xStatus', filters.status);

    return this.client.get<{
        users: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/users?${query.toString()}`);
  }

  async updateUser(id: string, data: any) {
    return this.client.patch<any>(`/admin/users/${id}`, data);
  }

  async deleteUser(id: string) {
    return this.client.delete<any>(`/admin/users/${id}`);
  }

  async login(email: string, password: string) {
    return this.client.post<{ user: any; accessToken: string; expiresAt: string | null }>('/admin/auth/login', { email, password });
  }

  async getBlueprints(page: number = 1, limit: number = 20, search?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) query.append('search', search);

    return this.client.get<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/blueprints?${query.toString()}`);
  }

  async getBlueprintById(id: string) {
    return this.client.get<any>(`/admin/blueprints/${id}`);
  }

  async createBlueprint(data: any) {
    return this.client.post<any>('/admin/blueprints', data);
  }

  async updateBlueprint(id: string, data: any) {
    return this.client.patch<any>(`/admin/blueprints/${id}`, data);
  }

  async deleteBlueprint(id: string) {
    return this.client.delete<any>(`/admin/blueprints/${id}`);
  }

  async atomicSeed(data: any) {
    return this.client.post<any>('/admin/hierarchy/atomic', data);
  }

  async saveFactoryBatch(data: { questions: any[], topicId: string, subtopicId?: string }) {
    return this.client.post<any>('/factory/save', data);
  }

  async checkDuplicates(data: { questions: { questionText: string }[], topicId: string }) {
    return this.client.post<{ details: any[], foundCount: number }>('/factory/check-duplicates', data);
  }

  async getSystemUsage() {
    return this.client.get<any>('/admin/system/usage');
  }

  async getTrendSummary(params: { range?: string } = {}) {
    const query = new URLSearchParams();
    if (params.range) query.append('range', params.range);
    return this.client.get<AdminTrendSummary>(`/admin/trends/summary?${query.toString()}`);
  }

  async getScoreTrends(params: { userId?: string; range?: string } = {}) {
    const query = new URLSearchParams();
    if (params.userId) query.append('userId', params.userId);
    if (params.range) query.append('range', params.range);
    return this.client.get<{ scores: any[] }>(`/admin/trends/scores?${query.toString()}`);
  }

  async getSkillTrends(params: { userId?: string; range?: string } = {}) {
    const query = new URLSearchParams();
    if (params.userId) query.append('userId', params.userId);
    if (params.range) query.append('range', params.range);
    return this.client.get<{ skills: any[] }>(`/admin/trends/skills?${query.toString()}`);
  }
}
