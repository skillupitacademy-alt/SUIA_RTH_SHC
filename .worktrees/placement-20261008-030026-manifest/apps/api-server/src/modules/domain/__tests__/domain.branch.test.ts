import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, topics, subjects, domains } from '@quiz/db';
import { TopicService, SubjectService, DomainService } from '../domain.service';
import { cacheService } from '@/modules/core/cache.service';

vi.mock('@/modules/core/cache.service', () => ({
    cacheService: {
        del: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined)
    }
}));

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
    db: {
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'new-id' }])
            })
        }),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'upd-id' }])
                })
            })
        }),
        delete: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'del-id' }])
            })
        }),
        query: {
            topics: { findMany: vi.fn() },
            subjects: { findMany: vi.fn() },
            domains: { findMany: vi.fn(), findFirst: vi.fn() }
        }
    },
    topics: { id: 'id', subjectId: 'subjectId', status: 'status', complexityLevel: 'complexityLevel' },
    subjects: { id: 'id', domainId: 'domainId', status: 'status', order: 'order' },
    domains: { id: 'id', status: 'status' }
}));

describe('Domain services branch coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- SubjectService ---
    it('SubjectService.getSubjectsByDomain cache miss (Lines 90-96)', async () => {
        vi.mocked(cacheService.get).mockResolvedValue(null);
        vi.mocked(db.query.subjects.findMany).mockResolvedValue([{ id: 's1', name: 'S1' }] as any);
        
        const result = await SubjectService.getSubjectsByDomain('d1');
        expect(result).toHaveLength(1);
        expect(cacheService.set).toHaveBeenCalled();
    });

    it('SubjectService.getSubjectsByDomain cache hit', async () => {
        vi.mocked(cacheService.get).mockResolvedValue([{ id: 'cached-sub' }] as any);
        const result = await SubjectService.getSubjectsByDomain('d-hit');
        expect(result[0].id).toBe('cached-sub');
        expect(db.query.subjects.findMany).not.toHaveBeenCalled();
    });

    it('SubjectService invalidations (Lines 101, 109, 114)', async () => {
        await SubjectService.createSubject({ domainId: 'd1', name: 'S1' } as any);
        expect(cacheService.del).toHaveBeenCalledWith('metadata:subjects:domain:d1');
        
        await SubjectService.updateSubject('s1', { name: 'S1-updated' });
        expect(cacheService.del).toHaveBeenCalledWith('metadata:domains:all');

        await SubjectService.deleteSubject('s1');
        expect(cacheService.del).toHaveBeenCalledWith('metadata:domains:all');
    });

    it('SubjectService createSubject skips domain invalidation when domainId empty', async () => {
        await SubjectService.createSubject({ domainId: '', name: 'NoDomain' } as any);
        expect(cacheService.del).toHaveBeenCalledWith('metadata:domains:all');
        // ensure no subjects:domain cache delete when domainId is empty
        expect(cacheService.del).not.toHaveBeenCalledWith(expect.stringContaining('metadata:subjects:domain:'));
    });

    // --- TopicService ---
    it('TopicService.getTopicsBySubject cache miss (Lines 127-147)', async () => {
        vi.mocked(cacheService.get).mockResolvedValue(null);
        vi.mocked(db.query.topics.findMany).mockResolvedValue([
            { id: 't1', topicSkills: [{ skill: { name: 'Skill1' } }] }
        ] as any);

        const result = await TopicService.getTopicsBySubject('sb1');
        expect((result[0] as any).skillName).toBe('Skill1');
        expect(cacheService.set).toHaveBeenCalled();
    });

    it('TopicService.getTopicsBySubject cache hit', async () => {
        vi.mocked(cacheService.get).mockResolvedValue([{ id: 'cached-topic', skillName: 's' }] as any);
        const result = await TopicService.getTopicsBySubject('sb-hit');
        expect(result[0].id).toBe('cached-topic');
        expect(db.query.topics.findMany).not.toHaveBeenCalled();
    });

    it('TopicService getTopicsBySubject maps empty topicSkills to null skillName', async () => {
        vi.mocked(cacheService.get).mockResolvedValue(null);
        vi.mocked(db.query.topics.findMany).mockResolvedValue([{ id: 't-empty', topicSkills: [] }] as any);
        const result = await TopicService.getTopicsBySubject('sb-empty');
        expect((result[0] as any).skillName).toBeNull();
    });

    it('TopicService getTopicsBySubject handles missing topicSkills (line 144 fallback)', async () => {
        vi.mocked(cacheService.get).mockResolvedValue(null);
        vi.mocked(db.query.topics.findMany).mockResolvedValue([{ id: 't-missing' }] as any);
        const result = await TopicService.getTopicsBySubject('sb-missing');
        expect((result[0] as any).skillName).toBeNull();
    });

    it('TopicService getTopicsBySubject handles mixed topicSkills arrays (line 144 true branch)', async () => {
        vi.mocked(cacheService.get).mockResolvedValue(null);
        vi.mocked(db.query.topics.findMany).mockResolvedValue([
            { id: 't-skill', topicSkills: [{ skill: { name: 'SkillX' } }] },
            { id: 't-noskill', topicSkills: [] as any[] }
        ] as any);
        const result = await TopicService.getTopicsBySubject('sb-mixed');
        expect((result[0] as any).skillName).toBe('SkillX');
        expect((result[1] as any).skillName).toBeNull();
    });

    it('TopicService maps topicSkills with undefined skill to null (line 144 nullish coalesce)', async () => {
        vi.mocked(cacheService.get).mockResolvedValue(null);
        vi.mocked(db.query.topics.findMany).mockResolvedValue([
            { id: 't-undef', topicSkills: [{ skill: undefined }] }
        ] as any);
        const result = await TopicService.getTopicsBySubject('sb-undef');
        expect((result[0] as any).skillName).toBeNull();
    });

    it('TopicService invalidations (Lines 175, 182)', async () => {
        await TopicService.createTopic({ subjectId: 'sb1', name: 'T1' } as any);
        expect(cacheService.del).toHaveBeenCalledWith('metadata:topics:subject:sb1');

        await TopicService.updateTopic('t1', { subjectId: 'sb2' } as any);
        expect(cacheService.del).toHaveBeenCalledWith('metadata:topics:subject:sb2');
    });

    it('TopicService create/update without subjectId does not delete topic cache', async () => {
        await TopicService.createTopic({ subjectId: undefined, name: 'T-no' } as any);
        await TopicService.updateTopic('t-no', { subjectId: undefined } as any);
        expect(cacheService.del).not.toHaveBeenCalledWith(expect.stringContaining('metadata:topics:subject:'));
    });

    it('TopicService delete operations execute (Lines ~175-181)', async () => {
        await TopicService.deleteTopic('t-del');
        await TopicService.deleteTopicsBatch(['t-b1', 't-b2']);
        expect(db.delete).toHaveBeenCalled();
    });

    it('TopicService deleteTopic executes delete (current implementation has no cache invalidation)', async () => {
        await TopicService.deleteTopic('t1');
        expect(db.delete).toHaveBeenCalled();
    });

    it('Create subject and topic cache miss sets both caches', async () => {
        vi.mocked(cacheService.get).mockResolvedValueOnce(null); // for subjects
        vi.mocked(db.query.subjects.findMany).mockResolvedValueOnce([{ id: 's2', domainId: 'd1' }] as any);
        await SubjectService.getSubjectsByDomain('d1');

        vi.mocked(cacheService.get).mockResolvedValueOnce(null); // for topics
        vi.mocked(db.query.topics.findMany).mockResolvedValueOnce([{ id: 't2', topicSkills: [] }] as any);
        await TopicService.getTopicsBySubject('s2');

        expect(cacheService.set).toHaveBeenCalled();
    });

    it('DomainService delete batch invalidates each hierarchy entry', async () => {
        await DomainService.deleteDomainsBatch(['d10', 'd11']);
        expect(cacheService.del).toHaveBeenCalledWith('metadata:domain-hierarchy:d10');
        expect(cacheService.del).toHaveBeenCalledWith('metadata:domain-hierarchy:d11');
    });

    // --- DomainService ---
    it('DomainService.getAllDomains cache miss (Lines 11-24)', async () => {
        vi.mocked(cacheService.get).mockResolvedValue(null);
        vi.mocked(db.query.domains.findMany).mockResolvedValue([{ id: 'd1' }] as any);
        const result = await DomainService.getAllDomains();
        expect(result).toHaveLength(1);
    });

    it('DomainService.getDomainHierarchy cache hit and miss branches', async () => {
        // cache hit
        vi.mocked(cacheService.get).mockResolvedValueOnce({ id: 'cached' } as any);
        const cached = await DomainService.getDomainHierarchy('d-hit');
        expect(cached).toEqual({ id: 'cached' });

        // cache miss -> set
        vi.mocked(cacheService.get).mockResolvedValueOnce(null);
        vi.mocked(db.query.domains.findFirst).mockResolvedValueOnce({ id: 'd1', subjects: [] } as any);
        const fresh = await DomainService.getDomainHierarchy('d1');
        expect(fresh?.id).toBe('d1');
        expect(cacheService.set).toHaveBeenCalledWith('metadata:domain-hierarchy:d1', expect.any(Object), expect.any(Number));
    });

    it('DomainService delete operations invalidate caches (Lines ~100-181)', async () => {
        // deleteDomain
        await DomainService.deleteDomain('d1');
        expect(cacheService.del).toHaveBeenCalledWith('metadata:domains:all');
        expect(cacheService.del).toHaveBeenCalledWith('metadata:domain-hierarchy:d1');

        // deleteDomainsBatch
        await DomainService.deleteDomainsBatch(['d2', 'd3']);
        expect(cacheService.del).toHaveBeenCalledWith('metadata:domain-hierarchy:d2');
        expect(cacheService.del).toHaveBeenCalledWith('metadata:domain-hierarchy:d3');

        // deleteSubject(s)
        await SubjectService.deleteSubject('s1');
        await SubjectService.deleteSubjectsBatch(['s2', 's3']);
        expect(cacheService.del).toHaveBeenCalledWith('metadata:domains:all');
    });

    // --- Catch Block Coverage (All Services) ---
    it('Cache failures (catch blocks)', async () => {
        vi.mocked(cacheService.get).mockRejectedValue(new Error('Cache Fail'));
        vi.mocked(cacheService.set).mockRejectedValue(new Error('Cache Fail'));
        vi.mocked(cacheService.del).mockRejectedValue(new Error('Cache Fail'));

        // SubjectService
        await SubjectService.getSubjectsByDomain('d1');
        await SubjectService.createSubject({ domainId: 'd1' } as any);

        // TopicService
        await TopicService.getTopicsBySubject('sb1');
        await TopicService.createTopic({ subjectId: 'sb1' } as any);

        // DomainService
        await DomainService.getAllDomains();
        await DomainService.createDomain({ name: 'D' } as any);
        
        expect(cacheService.get).toHaveBeenCalled();
    });
});


