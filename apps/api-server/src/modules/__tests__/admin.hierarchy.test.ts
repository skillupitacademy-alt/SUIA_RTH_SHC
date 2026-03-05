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
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default returns for findMany to avoid '.map of undefined' errors
    vi.mocked(mockDb.query.users.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.query.domains.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.query.subjects.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.query.topics.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.query.subtopics.findMany).mockResolvedValue([]);
    vi.mocked(mockDb.query.skills.findMany).mockResolvedValue([]);
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
        const analytics = await AdminAnalyticsEngine.getEfficiencyAnalytics();
        expect(analytics.mastery).toBe(5);
        expect(analytics.rash).toBe(2);
    });

    it('handles performance analytics with range', async () => {
        vi.mocked(mockDb.execute).mockResolvedValue({ 
            rows: [{ dimensionId: 'd1', name: 'Domain 1', avgAccuracy: 85, count: 10 }] 
        } as any);
        const report = await AdminAnalyticsEngine.getPerformanceAnalytics('7d');
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
        const report = await AdminAnalyticsEngine.getContentHealthReport();
        expect(report).toBeDefined();
        expect(report[0].domainName).toBe('D1');
    });
  });

  describe('AdminHierarchy Engines (Split)', () => {
    it('exercises subject, topic, and subtopic list branches', async () => {
        await AdminSubjectEngine.getSubjects(1, 10, { search: 'test' });
        await AdminTopicEngine.getTopics(1, 10, { search: 'test' });
        await AdminSubtopicEngine.getSubtopics(1, 10, { search: 'test' });
        expect(mockDb.query.subjects.findMany).toHaveBeenCalled();
    });

    it('covers domain and skill management branches', async () => {
        await AdminDomainEngine.getDomains(1, 10, { search: 'test' });
        await AdminSkillEngine.getSkills(1, 10, { search: 'test' });
        expect(mockDb.query.domains.findMany).toHaveBeenCalled();
    });
  });

  describe('AdminUserEngine', () => {
    it('filters by verification and block status', async () => {
        await AdminUserEngine.getUsers(1, 10, 'active', { isBlocked: true });
        await AdminUserEngine.getUsers(1, 10, 'active', { isVerified: true });
        await AdminUserEngine.getUsers(1, 10, 'deleted');
        expect(mockDb.query.users.findMany).toHaveBeenCalledTimes(3);
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

        await AdminUserEngine.getUsers(1, 10, 'active', { search: 'John' });
        await AdminUserEngine.getUsers(1, 10, 'active', { role: 'ADMIN' });
        expect(mockDb.query.users.findMany).toHaveBeenCalled();
    });
  });
});
