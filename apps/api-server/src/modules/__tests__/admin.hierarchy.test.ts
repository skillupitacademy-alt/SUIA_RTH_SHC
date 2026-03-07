import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockDb } from '../../__test-utils__/mock-db';
import { AdminAnalyticsEngine } from '../admin-engine/admin.analytics.engine';
import { AdminDomainEngine } from '../admin-engine/admin.domain.engine';
import { AdminSkillEngine } from '../admin-engine/admin.skill.engine';
import { AdminSubjectEngine } from '../admin-engine/admin.subject.engine';
import { AdminSubtopicEngine } from '../admin-engine/admin.subtopic.engine';
import { AdminTopicEngine } from '../admin-engine/admin.topic.engine';
import { AdminUserEngine } from '../admin-engine/admin.user.engine';

// Mock DB globally
vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: mockDb,
  users: { id: 'users.id', email: 'users.email', isBlocked: 'users.isBlocked', emailVerified: 'users.emailVerified', deletedAt: 'users.deletedAt', createdAt: 'users.createdAt', lastActiveAt: 'users.lastActiveAt' },
  domains: { id: 'domains.id', name: 'domains.name' },
  subjects: { id: 'subjects.id', name: 'subjects.name', domainId: 'subjects.domainId' },
  topics: { id: 'topics.id', name: 'topics.name', subjectId: 'topics.subjectId' },
  subtopics: { id: 'subtopics.id', name: 'subtopics.name', topicId: 'subtopics.topicId' },
  skills: { id: 'skills.id', name: 'skills.name' },
  userProfiles: { userId: 'userProfiles.userId', name: 'userProfiles.name' },
  userRoles: { userId: 'userRoles.userId', roleId: 'userRoles.roleId' },
  roles: { id: 'roles.id', name: 'roles.name' },
  questions: { id: 'questions.id', status: 'questions.status', difficulty: 'questions.difficulty', subtopicId: 'questions.subtopicId' },
  examQuestions: { id: 'examQuestions.id', isCorrect: 'examQuestions.isCorrect', responseMetadata: 'examQuestions.responseMetadata' },
  exams: { id: 'exams.id', userId: 'exams.userId', status: 'exams.status', startedAt: 'exams.startedAt', completedAt: 'exams.completedAt' },
  auditLogs: { id: 'auditLogs.id', createdAt: 'auditLogs.createdAt' },
  resultsByDimension: { id: 'resultsByDimension.id', examId: 'resultsByDimension.examId', name: 'resultsByDimension.name', dimensionType: 'resultsByDimension.dimensionType' },
}));

describe('Consolidated Administration Coverage', () => {
  const auditStub = { log: vi.fn() };
  const domainRepoStub = { findAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteBatch: vi.fn(), updateStatus: vi.fn() };
  const skillRepoStub = { findAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteBatch: vi.fn(), getTopicSkills: vi.fn(), getSkillsByTopic: vi.fn(), mapTopicToSkills: vi.fn() };
  const subjectRepoStub = { findAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteBatch: vi.fn() };
  const topicRepoStub = { findAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteBatch: vi.fn() };
  const subtopicRepoStub = { findAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteBatch: vi.fn() };
  const adminUserRepoStub = { findAll: vi.fn(), update: vi.fn(), delete: vi.fn(), toggleBlockStatus: vi.fn() };
  const analyticsEngine = new AdminAnalyticsEngine();
  const domainEngine = new AdminDomainEngine(domainRepoStub as any, auditStub as any);
  const skillEngine = new AdminSkillEngine(skillRepoStub as any, auditStub as any);
  const subjectEngine = new AdminSubjectEngine(subjectRepoStub as any, auditStub as any);
  const subtopicEngine = new AdminSubtopicEngine(subtopicRepoStub as any, auditStub as any);
  const topicEngine = new AdminTopicEngine(topicRepoStub as any, auditStub as any);
  const userEngine = new AdminUserEngine(adminUserRepoStub as any, auditStub as any);

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default returns for findMany to avoid '.map of undefined' errors
    vi.mocked(mockDb.query.users.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.query.domains.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.query.subjects.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.query.topics.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.query.subtopics.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.query.skills.findMany).mockResolvedValue([]);
    subjectRepoStub.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    topicRepoStub.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    subtopicRepoStub.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    domainRepoStub.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    skillRepoStub.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    adminUserRepoStub.findAll.mockResolvedValue({ users: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 0 }]),
            groupBy: vi.fn().mockResolvedValue([]),
        }),
    } as any);
  });

  describe('AdminAnalyticsEngine', () => {
    it('covers efficiency analytics quadrants', async () => {
        vi.mocked(mockDb.select).mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    groupBy: vi.fn().mockImplementation(async () => {
                        const data = [
                            { quadrant: 'mastery', count: 5 },
                            { quadrant: 'rash', count: 2 }
                        ];
                        return data;
                    })
                })
            })
        } as any);
        const analytics = await analyticsEngine.getEfficiencyAnalytics();
        expect(analytics.mastery).toBe(5);
        expect(analytics.rash).toBe(2);
    });

    it('handles performance analytics with range', async () => {
        vi.mocked(mockDb.execute).mockResolvedValue({ 
            rows: [{ dimensionId: 'd1', name: 'Domain 1', avgAccuracy: 85, count: 10 }] 
        } as any);
        const report = await analyticsEngine.getPerformanceAnalytics('7d');
        expect(report).toBeDefined();
    });

    it('covers content health report branches', async () => {
        vi.mocked(mockDb.query.domains.findMany).mockResolvedValue([
            { id: 'd1', name: 'D1', subjects: [
                { id: 's1', name: 'S1', topics: [
                    { id: 't1', name: 'T1', questions: [{ difficulty: 'simple', subtopicId: 'st1' }], subtopics: [{ id: 'st1', name: 'ST1' }] }
                ]}
            ]}
        ] as any);
        const report = await analyticsEngine.getContentHealthReport();
        expect(report).toBeDefined();
        expect(report[0].domainName).toBe('D1');
    });
  });

  describe('AdminHierarchy Engines (Split)', () => {
    it('exercises subject, topic, and subtopic list branches', async () => {
        await subjectEngine.getSubjects(1, 10, { search: 'test' });
        await topicEngine.getTopics(1, 10, { search: 'test' });
        await subtopicEngine.getSubtopics(1, 10, { search: 'test' });
        expect(subjectRepoStub.findAll).toHaveBeenCalledWith(1, 10, { search: 'test' });
        expect(topicRepoStub.findAll).toHaveBeenCalledWith(1, 10, { search: 'test' });
        expect(subtopicRepoStub.findAll).toHaveBeenCalledWith(1, 10, { search: 'test' });
    });

    it('covers domain and skill management branches', async () => {
        await domainEngine.getDomains(1, 10, { search: 'test' });
        await skillEngine.getSkills(1, 10, { search: 'test' });
        expect(domainRepoStub.findAll).toHaveBeenCalledWith(1, 10, { search: 'test' });
        expect(skillRepoStub.findAll).toHaveBeenCalledWith(1, 10, { search: 'test' });
    });
  });

  describe('AdminUserEngine', () => {
    it('filters by verification and block status', async () => {
        await userEngine.getUsers(1, 10, 'active', { isBlocked: true });
        await userEngine.getUsers(1, 10, 'active', { isVerified: true });
        await userEngine.getUsers(1, 10, 'deleted');
        expect(adminUserRepoStub.findAll).toHaveBeenCalledTimes(3);
    });

    it('exercises search and role filtering branches', async () => {
        // Mock profile search result to trigger identity branch
        vi.mocked(mockDb.select).mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([{ userId: 'u1' }]),
                innerJoin: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ userId: 'u1' }])
                })
            })
        } as any);

        await userEngine.getUsers(1, 10, 'active', { search: 'John' });
        await userEngine.getUsers(1, 10, 'active', { role: 'ADMIN' });
        expect(adminUserRepoStub.findAll).toHaveBeenCalled();
    });
  });
});


