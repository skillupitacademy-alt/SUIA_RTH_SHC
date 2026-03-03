import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@quiz/db';
import { HierarchyFactory } from '../hierarchy.factory';

vi.mock('@quiz/db', () => ({
    db: {
        transaction: vi.fn().mockImplementation(async (cb) => {
            const tx = {
                query: {
                    domains: { findFirst: vi.fn() },
                    skills: { findFirst: vi.fn() },
                },
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
                        onConflictDoUpdate: vi.fn().mockReturnValue({
                            returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }])
                        })
                    })
                }),
                select: vi.fn().mockReturnValue({
                    from: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([])
                    })
                }),
                delete: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(undefined)
                })
            };
            return await cb(tx);
        })
    },
    domains: { id: 'd.id', name: 'd.name' },
    subjects: { id: 's.id', domainId: 's.domainId', name: 's.name' },
    topics: { id: 't.id', subjectId: 't.subjectId', name: 't.name' },
    skills: { id: 'sk.id', topicId: 'sk.topicId', name: 'sk.name' },
}));

describe('HierarchyFactory tail coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('atomicUpsert: processes batchDomains and batchSkills (Lines 66, 71)', async () => {
        const payload = {
            batchDomains: [
                { name: 'Batch Domain 1', abbreviation: 'BD1' }
            ],
            batchSkills: [
                { topicId: 't1', name: 'Batch Skill 1' }
            ]
        };

        const result = await HierarchyFactory.atomicUpsert(payload);
        
        expect(result.batchDomains.length).toBe(1);
        expect(Array.isArray(result.batchSkills)).toBe(true);
        expect(db.transaction).toHaveBeenCalled();
    });
});
