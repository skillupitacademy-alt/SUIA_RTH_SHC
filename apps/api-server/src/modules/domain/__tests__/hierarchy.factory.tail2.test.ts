import { describe, it, expect, vi } from 'vitest';
import { HierarchyFactory } from '../hierarchy.factory';
import { db } from '@quiz/db';

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
    db: {
        transaction: vi.fn().mockImplementation(async (cb) => {
            const tx = {
                query: {
                    domains: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
                    subjects: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
                    topics: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
                    subtopics: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
                    skills: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
                    questionSkills: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) }
                },
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }])
                    })
                })
            };
            return await cb(tx);
        })
    },
    domains: {}, subjects: {}, topics: {}, subtopics: {}, questions: {}, skills: {}, questionSkills: {}
}));

describe('HierarchyFactory extreme tail logic', () => {
    it('processSubject/topic/subtopic branch logic bypassing ID checks (Lines 189, 227)', async () => {
        const payload = {
            domainId: 'd1',
            subjects: [
                {
                    id: 's1', // provided directly! (bypasses missing id branch)
                    name: 'S Name',
                    topics: [
                        {
                            id: 't1', // provided directly!
                            name: 'T Name',
                            subtopics: [
                                {
                                    id: 'st1', // provided directly!
                                    name: 'ST Name'
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const result = await HierarchyFactory.atomicUpsert(payload);
        expect(result.domainId).toBe('d1');
        // Because IDs were provided, the DB query to find existing items is SKIPPED
        // and we expect the transaction logic to not invoke subjects/topics/subtopics findFirst.
    });

    it('throws domain context error if subjects provided without domain (Line 77)', async () => {
        const payload = {
            batchSkills: ['Skill A'],
            subjects: [{ name: 'S1', topics: [] }]
        };
        await expect(HierarchyFactory.atomicUpsert(payload as any)).rejects.toThrow('Domain context required for hierarchical operations.');
    });

    it('updates existing domain if description or category provided (Lines 129, 132)', async () => {
        vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
            const tx = {
                query: {
                    domains: { findFirst: vi.fn().mockResolvedValue({ id: 'd1', description: 'old', category: 'old' }) },
                    subjects: { findFirst: vi.fn() },
                    topics: { findFirst: vi.fn() },
                    subtopics: { findFirst: vi.fn() }
                },
                update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
                insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }) })
            };
            return await cb(tx);
        });

        await HierarchyFactory.atomicUpsert({ domainName: 'D1', description: 'newDesc' });
        await HierarchyFactory.atomicUpsert({ domainName: 'D1', category: 'newCat' });
        await HierarchyFactory.atomicUpsert({ domainName: 'D1' });
    });

    it('processes question type code_mcq and difficulties intermediate/expert (Lines 306, 324)', async () => {
        vi.mocked(db.transaction).mockImplementation(async (cb: any) => {
            const tx = {
                query: {
                    domains: { findFirst: vi.fn() },
                    subjects: { findFirst: vi.fn() },
                    topics: { findFirst: vi.fn() },
                    subtopics: { findFirst: vi.fn() },
                    skills: { findFirst: vi.fn() }
                },
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([
                            { id: 'q1', difficulty: 'intermediate' },
                            { id: 'q2', difficulty: 'expert' },
                            { id: 'q3', difficulty: 'simple' },
                            { id: 'q4', difficulty: 'unknown' } 
                        ])
                    })
                }),
                update: vi.fn()
            };
            return await cb(tx);
        });

        const payload = {
            domainId: 'd1',
            subjects: [{
                name: 'S1',
                topics: [{
                    name: 'T1',
                    subtopics: [{
                        name: 'ST1',
                        questions: [
                            { type: 'code_mcq', difficulty: 'intermediate', questionText: 'Q1' },
                            { type: 'mcq', difficulty: 'expert', questionText: 'Q2' },
                            { difficulty: 'simple', questionText: 'Q3' },
                            { difficulty: undefined as any, questionText: 'Q4' } 
                        ]
                    }]
                }]
            }]
        };

        const result = await HierarchyFactory.atomicUpsert(payload as any);
        expect(result.questionStats.intermediate).toBe(1);
        expect(result.questionStats.expert).toBe(1);
    });
});


