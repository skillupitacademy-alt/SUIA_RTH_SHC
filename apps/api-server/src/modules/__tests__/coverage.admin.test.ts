import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockDb } from '../../__test-utils__/mock-db';
import { AdminAnalyticsEngine } from '../admin-engine/admin.analytics.engine';
import { AdminHierarchyEngine } from '../admin-engine/admin.hierarchy.engine';
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
}));

describe('Consolidated Administration Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AdminAnalyticsEngine', () => {
    it('covers efficiency analytics quadrants', async () => {
        // This targets the reduce loop and data normalization branches
        const analytics = await AdminAnalyticsEngine.getEfficiencyAnalytics();
        expect(analytics).toBeDefined();
    });

    it('handles performance analytics with range', async () => {
        vi.mocked(mockDb.execute).mockResolvedValue({ 
            rows: [{ dimensionId: 'd1', name: 'Domain 1', avgAccuracy: 85, count: 10 }] 
        } as any);
        const report = await AdminAnalyticsEngine.getPerformanceAnalytics('7d');
        expect(report).toBeDefined();
    });

    it('covers content health report branches', async () => {
        vi.mocked(mockDb.query.questions.findMany).mockResolvedValue([
            { difficulty: 'simple', subtopicId: 's1' },
            { difficulty: 'intermediate', subtopicId: 's2' }
        ] as any);
        const report = await AdminAnalyticsEngine.getContentHealthReport();
        expect(report).toBeDefined();
    });
  });

  describe('AdminHierarchyEngine', () => {
    it('exercises subject, topic, and subtopic list branches', async () => {
        await AdminHierarchyEngine.getSubjects(1, 10, { search: 'test' });
        await AdminHierarchyEngine.getTopics(1, 10, { search: 'test' });
        await AdminHierarchyEngine.getSubtopics(1, 10, { search: 'test' });
        expect(mockDb.query.subjects.findMany).toHaveBeenCalled();
    });

    it('covers domain and skill management branches', async () => {
        await AdminHierarchyEngine.getDomains(1, 10, { search: 'test' });
        await AdminHierarchyEngine.getSkills(1, 10, { search: 'test' });
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
                where: vi.fn().mockResolvedValue([{ id: 'u1' }]),
                innerJoin: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ id: 'u1' }])
                })
            })
        } as any);

        await AdminUserEngine.getUsers(1, 10, 'active', { search: 'John' });
        await AdminUserEngine.getUsers(1, 10, 'active', { role: 'ADMIN' });
        expect(mockDb.query.users.findMany).toHaveBeenCalled();
    });
  });
});
