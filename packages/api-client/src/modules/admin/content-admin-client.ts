import { FetchClient } from '@quiz/api-client/core/fetch-client';
import {
  AdminBlueprint,
  AdminSuccessResponse,
  Domain,
  DuplicateCheckResponse,
  PaginatedQuestions,
  PaginatedResponse,
  QuestionSummary,
  Skill,
  Subject,
  Subtopic,
  Topic,
  IAdminQuestionConfigClient,
  IAdminBlueprintConfigClient,
} from '@quiz/api-client/types';

type DomainPayload = Pick<Domain, 'name' | 'slug' | 'description' | 'icon'>;
type SubjectPayload = Pick<
  Subject,
  'name' | 'domainId' | 'slug' | 'description' | 'icon' | 'orderIndex'
>;
type TopicPayload = Pick<
  Topic,
  | 'name'
  | 'subjectId'
  | 'slug'
  | 'description'
  | 'orderIndex'
  | 'complexity'
>;
type SubtopicPayload = Pick<
  Subtopic,
  'name' | 'topicId' | 'slug' | 'description' | 'orderIndex'
>;
type SkillPayload = Pick<Skill, 'name' | 'description' | 'category'> & {
  topicId?: string;
};
type QuestionPayload = Omit<QuestionSummary, 'id'> & Record<string, unknown>;
type FactoryBatchPayload = {
  questions: QuestionSummary[];
  topicId: string;
  subtopicId?: string;
};
type BlueprintPayload = Record<string, unknown>;

export class ContentAdminClient implements IAdminQuestionConfigClient, IAdminBlueprintConfigClient {
  constructor(private client: FetchClient) {}

  // --- DOMAINS ---
  async getDomains(cursor?: string | null, limit: number = 20, search?: string) {
    const query = new URLSearchParams({ limit: limit.toString() });
    if (cursor != null && cursor !== '') query.append('cursor', cursor);
    if (search != null && search !== '') query.append('search', search);

    return this.client.get<PaginatedResponse<Domain>>(`/admin/domains?${query.toString()}`);
  }

  async createDomain(data: DomainPayload) {
    return this.client.post<Domain, DomainPayload>('/admin/domains', data);
  }

  async updateDomain(id: string, data: Partial<DomainPayload>) {
    return this.client.patch<Domain, Partial<DomainPayload>>(`/admin/domains/${id}`, data);
  }

  async deleteDomain(id: string) {
    return this.client.delete<AdminSuccessResponse>(`/admin/domains/${id}`);
  }

  async batchDeleteDomains(ids: string[]) {
    return this.client.post<AdminSuccessResponse>('/admin/domains/batch-delete', { ids });
  }

  // --- SUBJECTS ---
  async getSubjects(cursor?: string | null, limit: number = 20, domainId?: string, search?: string) {
    const query = new URLSearchParams({ limit: limit.toString() });
    if (cursor != null && cursor !== '') query.append('cursor', cursor);
    if (domainId != null && domainId !== '') query.append('domainId', domainId);
    if (search != null && search !== '') query.append('search', search);

    return this.client.get<PaginatedResponse<Subject>>(`/admin/subjects?${query.toString()}`);
  }

  async getSubjectsByDomain(domainId: string) {
    return this.getSubjects(null, 100, domainId).then((res) => res.data);
  }

  async createSubject(data: SubjectPayload) {
    return this.client.post<Subject, SubjectPayload>('/admin/subjects', data);
  }

  async updateSubject(id: string, data: Partial<SubjectPayload>) {
    return this.client.patch<Subject, Partial<SubjectPayload>>(`/admin/subjects/${id}`, data);
  }

  async deleteSubject(id: string) {
    return this.client.delete<AdminSuccessResponse>(`/admin/subjects/${id}`);
  }

  async batchDeleteSubjects(ids: string[]) {
    return this.client.post<AdminSuccessResponse>('/admin/subjects/batch-delete', { ids });
  }

  // --- TOPICS ---
  async getTopics(cursor?: string | null, limit: number = 20, subjectId?: string, search?: string) {
    const query = new URLSearchParams({ limit: limit.toString() });
    if (cursor != null && cursor !== '') query.append('cursor', cursor);
    if (subjectId != null && subjectId !== '') query.append('subjectId', subjectId);
    if (search != null && search !== '') query.append('search', search);

    return this.client.get<PaginatedResponse<Topic>>(`/admin/topics?${query.toString()}`);
  }

  async getTopicsBySubject(subjectId: string) {
    return this.getTopics(null, 100, subjectId).then((res) => res.data);
  }

  async createTopic(data: TopicPayload) {
    return this.client.post<Topic, TopicPayload>('/admin/topics', data);
  }

  async updateTopic(id: string, data: Partial<TopicPayload>) {
    return this.client.patch<Topic, Partial<TopicPayload>>(`/admin/topics/${id}`, data);
  }

  async deleteTopic(id: string) {
    return this.client.delete<AdminSuccessResponse>(`/admin/topics/${id}`);
  }

  async batchDeleteTopics(ids: string[]) {
    return this.client.post<AdminSuccessResponse>('/admin/topics/batch-delete', { ids });
  }

  // --- SUBTOPICS ---
  async getSubtopics(cursor?: string | null, limit: number = 20, topicId?: string, search?: string) {
    const query = new URLSearchParams({ limit: limit.toString() });
    if (cursor != null && cursor !== '') query.append('cursor', cursor);
    if (topicId != null && topicId !== '') query.append('topicId', topicId);
    if (search != null && search !== '') query.append('search', search);

    return this.client.get<PaginatedResponse<Subtopic>>(`/admin/subtopics?${query.toString()}`);
  }

  async createSubtopic(data: SubtopicPayload) {
    return this.client.post<Subtopic, SubtopicPayload>('/admin/subtopics', data);
  }

  async updateSubtopic(id: string, data: Partial<SubtopicPayload>) {
    return this.client.patch<Subtopic, Partial<SubtopicPayload>>(`/admin/subtopics/${id}`, data);
  }

  async deleteSubtopic(id: string) {
    return this.client.delete<AdminSuccessResponse>(`/admin/subtopics/${id}`);
  }

  async batchDeleteSubtopics(ids: string[]) {
    return this.client.post<AdminSuccessResponse>('/admin/subtopics/batch-delete', { ids });
  }

  // --- SKILLS ---
  async getSkills(cursor?: string | null, limit: number = 20, search?: string) {
    const query = new URLSearchParams({ limit: limit.toString() });
    if (cursor != null && cursor !== '') query.append('cursor', cursor);
    if (search != null && search !== '') query.append('search', search);

    return this.client.get<PaginatedResponse<Skill>>(`/admin/skills?${query.toString()}`);
  }

  async getTopicSkills(topicId: string) {
    return this.client.get<Skill[]>(`/admin/topics/${topicId}/skills`);
  }

  async createSkill(data: SkillPayload) {
    return this.client.post<Skill, SkillPayload>('/admin/skills', data);
  }

  async updateSkill(id: string, data: Partial<SkillPayload>) {
    return this.client.patch<Skill, Partial<SkillPayload>>(`/admin/skills/${id}`, data);
  }

  async deleteSkill(id: string) {
    return this.client.delete<AdminSuccessResponse>(`/admin/skills/${id}`);
  }

  async batchDeleteSkills(ids: string[]) {
    return this.client.post<AdminSuccessResponse>('/admin/skills/batch-delete', { ids });
  }

  async mapTopicSkills(topicId: string, skillIds: string[]) {
    return this.client.post<AdminSuccessResponse>(`/admin/topics/${topicId}/skills`, { skillIds });
  }

  // --- QUESTIONS ---
  async getQuestions(
    cursor?: string | null,
    limit: number = 20,
    filters?: {
      domainId?: string;
      subjectId?: string;
      topicId?: string;
      subtopicId?: string;
      skillIds?: string[];
      status?: string;
      search?: string;
    }
  ) {
    const query = new URLSearchParams({ limit: limit.toString() });
    if (cursor != null && cursor !== '') query.append('cursor', cursor);
    if (filters?.domainId) query.append('domainId', filters.domainId);
    if (filters?.subjectId) query.append('subjectId', filters.subjectId);
    if (filters?.topicId) query.append('topicId', filters.topicId);
    if (filters?.subtopicId) query.append('subtopicId', filters.subtopicId);
    if (filters?.skillIds) filters.skillIds.forEach(id => query.append('skillIds', id));
    if (filters?.status) query.append('status', filters.status);
    if (filters?.search) query.append('search', filters.search);

    return this.client.get<PaginatedQuestions>(`/admin/questions?${query.toString()}`);
  }

  async getQuestionById(id: string) {
    return this.client.get<QuestionSummary>(`/admin/questions/${id}`);
  }

  async createQuestion(data: QuestionPayload) {
    return this.client.post<QuestionSummary, QuestionPayload>('/admin/questions', data);
  }

  async bulkCreateQuestions(data: {
    topicId: string;
    subtopicId?: string;
    skillIds?: string[];
    questions: QuestionPayload[];
  }) {
    return this.client.post<{ questions: QuestionSummary[] }, typeof data>('/admin/questions/bulk', data);
  }

  async updateQuestion(id: string, data: Partial<QuestionPayload>) {
    return this.client.patch<QuestionSummary, Partial<QuestionPayload>>(`/admin/questions/${id}`, data);
  }

  async deleteQuestion(id: string) {
    return this.client.delete<AdminSuccessResponse>(`/admin/questions/${id}`);
  }

  async batchDeleteQuestions(ids: string[]) {
    return this.client.post<AdminSuccessResponse>('/admin/questions/batch-delete', { ids });
  }

  async atomicSeed(data: Record<string, unknown>) {
    return this.client.post<Record<string, unknown>, Record<string, unknown>>('/admin/hierarchy/atomic', data);
  }

  async saveFactoryBatch(data: FactoryBatchPayload) {
    return this.client.post<Record<string, unknown>, FactoryBatchPayload>('/factory/save', data);
  }

  async checkDuplicates(data: { questions: { questionText: string }[]; topicId: string }) {
    return this.client.post<DuplicateCheckResponse>('/factory/check-duplicates', data);
  }

  // --- BLUEPRINTS ---
  async getBlueprints(cursor?: string | null, limit: number = 20, search?: string) {
    const query = new URLSearchParams({ limit: limit.toString() });
    if (cursor != null && cursor !== '') query.append('cursor', cursor);
    if (search != null && search !== '') query.append('search', search);

    return this.client.get<PaginatedResponse<AdminBlueprint>>(`/admin/blueprints?${query.toString()}`);
  }

  async getBlueprintById(id: string) {
    return this.client.get<AdminBlueprint>(`/admin/blueprints/${id}`);
  }

  async createBlueprint(data: BlueprintPayload) {
    return this.client.post<AdminBlueprint, BlueprintPayload>('/admin/blueprints', data);
  }

  async updateBlueprint(id: string, data: Partial<BlueprintPayload>) {
    return this.client.patch<AdminBlueprint, Partial<BlueprintPayload>>(`/admin/blueprints/${id}`, data);
  }

  async deleteBlueprint(id: string) {
    return this.client.delete<AdminSuccessResponse>(`/admin/blueprints/${id}`);
  }
}
