import { FetchClient } from '@quiz/api-client/core/fetch-client';
import {
  AdminUserProfile,
  BackgroundJob,
  Domain,
  PaginatedQuestions,
  PaginatedResponse,
  QuestionSummary,
  Skill,
  Subtopic,
  Subject,
  Topic,
  UserProfile,
} from '@quiz/api-client/types';
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

type DomainPayload = Pick<Domain, 'name' | 'slug' | 'description' | 'icon'>;
type SubjectPayload = Pick<Subject, 'name' | 'domainId' | 'slug' | 'description' | 'icon' | 'orderIndex'>;
type TopicPayload = Pick<Topic, 'name' | 'subjectId' | 'slug' | 'description' | 'orderIndex' | 'complexity'>;
type SubtopicPayload = Pick<Subtopic, 'name' | 'topicId' | 'slug' | 'description' | 'orderIndex'>;
type SkillPayload = Pick<Skill, 'name' | 'description' | 'category'> & { topicId?: string };
type QuestionPayload = Omit<QuestionSummary, 'id'> & Record<string, unknown>;
type BlueprintPayload = Record<string, unknown>;
type UserUpdatePayload = Partial<AdminUserProfile> & Record<string, unknown>;
type FactoryBatchPayload = { questions: QuestionSummary[]; topicId: string; subtopicId?: string };
type LiveSession = Record<string, unknown>;
type MetricRow = Record<string, unknown>;

export class AdminClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

  async getDomains(page: number = 1, limit: number = 20, search?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search != null && search !== '') query.append('search', search);

    return this.client.get<PaginatedResponse<Domain>>(`/admin/domains?${query.toString()}`);
  }

  async getSubjects(page: number = 1, limit: number = 20, domainId?: string, search?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (domainId != null && domainId !== '') query.append('domainId', domainId);
    if (search != null && search !== '') query.append('search', search);
    
    return this.client.get<PaginatedResponse<Subject>>(`/admin/subjects?${query.toString()}`);
  }

  async getTopics(page: number = 1, limit: number = 20, subjectId?: string, search?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (subjectId != null && subjectId !== '') query.append('subjectId', subjectId);
    if (search != null && search !== '') query.append('search', search);

    return this.client.get<PaginatedResponse<Topic>>(`/admin/topics?${query.toString()}`);
  }

  async getSubjectsByDomain(domainId: string) {
    return this.getSubjects(1, 100, domainId).then(res => res.data);
  }

  async getTopicsBySubject(subjectId: string) {
    return this.getTopics(1, 100, subjectId).then(res => res.data);
  }

  async getTopicSkills(topicId: string) {
    return this.client.get<Skill[]>(`/admin/topics/${topicId}/skills`);
  }

  async getSubtopics(page: number = 1, limit: number = 20, topicId?: string, search?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (topicId != null && topicId !== '') query.append('topicId', topicId);
    if (search != null && search !== '') query.append('search', search);

    return this.client.get<PaginatedResponse<Subtopic>>(`/admin/subtopics?${query.toString()}`);
  }

  async getSkills(page: number = 1, limit: number = 20, search?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search != null && search !== '') query.append('search', search);

    return this.client.get<PaginatedResponse<Skill>>(`/admin/skills?${query.toString()}`);
  }

  async getQuestions(page: number = 1, limit: number = 20, filters?: { domainId?: string; subjectId?: string; topicId?: string; subtopicId?: string; skillIds?: string[]; status?: string; search?: string }) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (filters?.domainId != null && filters.domainId !== '') query.append('domainId', filters.domainId);
    if (filters?.subjectId != null && filters.subjectId !== '') query.append('subjectId', filters.subjectId);
    if (filters?.topicId != null && filters.topicId !== '') query.append('topicId', filters.topicId);
    if (filters?.subtopicId != null && filters.subtopicId !== '') query.append('subtopicId', filters.subtopicId);
    if (filters?.skillIds != null && filters.skillIds.length > 0) {
        filters.skillIds.forEach(id => query.append('skillIds', id));
    }
    if (filters?.status != null && filters.status !== '') query.append('status', filters.status);
    if (filters?.search != null && filters.search !== '') query.append('search', filters.search);

    return this.client.get<PaginatedQuestions>(`/admin/questions?${query.toString()}`);
  }

  async getQuestionById(id: string) {
    return this.client.get<QuestionSummary>(`/admin/questions/${id}`);
  }

  async createDomain(data: DomainPayload) {
    return this.client.post<Domain, DomainPayload>('/admin/domains', data);
  }

  async updateDomain(id: string, data: Partial<DomainPayload>) {
    return this.client.patch<Domain, Partial<DomainPayload>>(`/admin/domains/${id}`, data);
  }

  async deleteDomain(id: string) {
    return this.client.delete<any>(`/admin/domains/${id}`);
  }

  async batchDeleteDomains(ids: string[]) {
    return this.client.post<any>('/admin/domains/batch-delete', { ids });
  }

  async createSubject(data: SubjectPayload) {
    return this.client.post<Subject, SubjectPayload>('/admin/subjects', data);
  }

  async updateSubject(id: string, data: Partial<SubjectPayload>) {
    return this.client.patch<Subject, Partial<SubjectPayload>>(`/admin/subjects/${id}`, data);
  }

  async deleteSubject(id: string) {
    return this.client.delete<any>(`/admin/subjects/${id}`);
  }

  async batchDeleteSubjects(ids: string[]) {
    return this.client.post<any>('/admin/subjects/batch-delete', { ids });
  }

  async createTopic(data: TopicPayload) {
    return this.client.post<Topic, TopicPayload>('/admin/topics', data);
  }

  async updateTopic(id: string, data: Partial<TopicPayload>) {
    return this.client.patch<Topic, Partial<TopicPayload>>(`/admin/topics/${id}`, data);
  }

  async deleteTopic(id: string) {
    return this.client.delete<any>(`/admin/topics/${id}`);
  }

  async batchDeleteTopics(ids: string[]) {
    return this.client.post<any>('/admin/topics/batch-delete', { ids });
  }

  async createSubtopic(data: SubtopicPayload) {
    return this.client.post<Subtopic, SubtopicPayload>('/admin/subtopics', data);
  }

  async updateSubtopic(id: string, data: Partial<SubtopicPayload>) {
    return this.client.patch<Subtopic, Partial<SubtopicPayload>>(`/admin/subtopics/${id}`, data);
  }

  async deleteSubtopic(id: string) {
    return this.client.delete<any>(`/admin/subtopics/${id}`);
  }

  async batchDeleteSubtopics(ids: string[]) {
    return this.client.post<any>('/admin/subtopics/batch-delete', { ids });
  }

  async createSkill(data: SkillPayload) {
    return this.client.post<Skill, SkillPayload>('/admin/skills', data);
  }

  async updateSkill(id: string, data: Partial<SkillPayload>) {
    return this.client.patch<Skill, Partial<SkillPayload>>(`/admin/skills/${id}`, data);
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

  async createQuestion(data: QuestionPayload) {
    return this.client.post<QuestionSummary, QuestionPayload>('/admin/questions', data);
  }

  async bulkCreateQuestions(data: { topicId: string; subtopicId?: string; skillId?: string; skillIds?: string[]; questions: QuestionPayload[] }) {
    return this.client.post<{ questions: QuestionSummary[] }, typeof data>('/admin/questions/bulk', data);
  }

  async updateQuestion(id: string, data: Partial<QuestionPayload>) {
    return this.client.patch<QuestionSummary, Partial<QuestionPayload>>(`/admin/questions/${id}`, data);
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
    if (search != null && search !== '') query.append('search', search);

    return this.client.get<{
      sessions: LiveSession[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/admin/sessions/live?${query.toString()}`);
  }

  async getUsers(page: number = 1, limit: number = 20, status: 'active' | 'deleted' = 'active', filters?: { search?: string; role?: string; isBlocked?: boolean; isVerified?: boolean; status?: string }) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString(), status });
    if (filters?.search != null && filters.search !== '') query.append('search', filters.search);
    if (filters?.role != null && filters.role !== '') query.append('role', filters.role);
    if (filters?.isBlocked !== undefined) query.append('isBlocked', filters.isBlocked ? 'true' : 'false');
    if (filters?.isVerified !== undefined) query.append('isVerified', filters.isVerified ? 'true' : 'false');
    if (filters?.status != null && filters.status !== '') query.append('xStatus', filters.status);

    return this.client.get<{
      users: AdminUserProfile[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/admin/users?${query.toString()}`);
  }

  async updateUser(id: string, data: UserUpdatePayload) {
    return this.client.patch<AdminUserProfile, UserUpdatePayload>(`/admin/users/${id}`, data);
  }

  async deleteUser(id: string) {
    return this.client.delete<any>(`/admin/users/${id}`);
  }

  async login(email: string, password: string) {
    return this.client.post<{ user: AdminUserProfile; accessToken: string; expiresAt: string | null }>(
      '/admin/auth/login',
      { email, password }
    );
  }

  async getBlueprints(page: number = 1, limit: number = 20, search?: string) {
    const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search != null && search !== '') query.append('search', search);

    return this.client.get<PaginatedResponse<Record<string, unknown>>>(`/admin/blueprints?${query.toString()}`);
  }

  async getBlueprintById(id: string) {
    return this.client.get<Record<string, unknown>>(`/admin/blueprints/${id}`);
  }

  async createBlueprint(data: BlueprintPayload) {
    return this.client.post<Record<string, unknown>, BlueprintPayload>('/admin/blueprints', data);
  }

  async updateBlueprint(id: string, data: Partial<BlueprintPayload>) {
    return this.client.patch<Record<string, unknown>, Partial<BlueprintPayload>>(`/admin/blueprints/${id}`, data);
  }

  async deleteBlueprint(id: string) {
    return this.client.delete<any>(`/admin/blueprints/${id}`);
  }

  async atomicSeed(data: Record<string, unknown>) {
    return this.client.post<Record<string, unknown>, Record<string, unknown>>('/admin/hierarchy/atomic', data);
  }

  async saveFactoryBatch(data: FactoryBatchPayload) {
    return this.client.post<Record<string, unknown>, FactoryBatchPayload>('/factory/save', data);
  }

  async checkDuplicates(data: { questions: { questionText: string }[]; topicId: string }) {
    return this.client.post<{ details: Array<{ id?: string; questionText: string }>; foundCount: number }>(
      '/factory/check-duplicates',
      data
    );
  }

  async getSystemUsage() {
    return this.client.get<any>('/admin/system/usage');
  }

  async getTrendSummary(params: { range?: string } = {}) {
    const query = new URLSearchParams();
    if (params.range != null && params.range !== '') query.append('range', params.range);
    return this.client.get<AdminTrendSummary>(`/admin/trends/summary?${query.toString()}`);
  }

  async getScoreTrends(params: { userId?: string; range?: string } = {}) {
    const query = new URLSearchParams();
    if (params.userId != null && params.userId !== '') query.append('userId', params.userId);
    if (params.range != null && params.range !== '') query.append('range', params.range);
    return this.client.get<{ scores: MetricRow[] }>(`/admin/trends/scores?${query.toString()}`);
  }

  async getSkillTrends(params: { userId?: string; range?: string } = {}) {
    const query = new URLSearchParams();
    if (params.userId != null && params.userId !== '') query.append('userId', params.userId);
    if (params.range != null && params.range !== '') query.append('range', params.range);
    return this.client.get<{ skills: MetricRow[] }>(`/admin/trends/skills?${query.toString()}`);
  }

  async createJob(type: string, payload?: Record<string, unknown>) {
    return this.client.post<{ job: BackgroundJob }>('/admin/jobs', { type, payload });
  }

  async getJobById(id: string) {
    return this.client.get<{ job: BackgroundJob }>(`/admin/jobs/${id}`);
  }
}
