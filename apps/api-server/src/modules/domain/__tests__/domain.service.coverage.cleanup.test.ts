import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, domains, subjects, topics } from '@quiz/db';
import { SubjectService, TopicService } from '../domain.service';
import { cacheService } from '@/modules/core/cache.service';

vi.mock('@/modules/core/cache.service', () => ({
    cacheService: {
        del: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
        increment: vi.fn().mockResolvedValue(0)
    }
}));

vi.mock('@quiz/db', () => ({
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
            subjects: { findMany: vi.fn() },
            topics: { findMany: vi.fn() },
            subtopics: { findMany: vi.fn() }
        }
    },
    domains: { id: 'id', status: 'status' },
    subjects: { id: 'id', domainId: 'domainId', name: 'name', status: 'status' },
    topics: { id: 'id', subjectId: 'subjectId', complexityLevel: 'complexityLevel', status: 'status' },
    subtopics: { id: 'id', topicId: 'topicId' }
}));

describe('Domain services cleanup coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('SubjectService.createSubject invalidates domain cache (Line 101)', async () => {
        await SubjectService.createSubject({ domainId: 'd-1', name: 'S1' } as any);
        expect(cacheService.del).toHaveBeenCalledWith('metadata:subjects:domain:d-1');
    });

    it('TopicService.createTopic invalidates subject cache (Line 175)', async () => {
        await TopicService.createTopic({ subjectId: 's-1', name: 'T1' } as any);
        expect(cacheService.del).toHaveBeenCalledWith('metadata:topics:subject:s-1');
    });

    it('SubjectService.deleteSubject hits error branch when delete throws', async () => {
        // Robust mock for the chain to ensure it doesn't fail on 'where' or 'returning'
        vi.mocked(db.delete).mockReturnValueOnce({
            where: vi.fn().mockReturnValue({
                returning: vi.fn().mockRejectedValue(new Error('Delete fail'))
            })
        } as any);
        
        await expect(SubjectService.deleteSubject('s-1')).rejects.toThrow('Delete fail');
    });
});
