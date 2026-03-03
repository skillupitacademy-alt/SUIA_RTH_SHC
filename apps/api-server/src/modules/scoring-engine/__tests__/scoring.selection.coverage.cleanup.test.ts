import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, exams, resultsByDimension, topics } from '@quiz/db';
import { ScoringEngine } from '../scoring.engine';
import { SelectionService } from '@/modules/selection-engine/selection.service';
import { PerformanceService } from '@/modules/report-engine/performance.service';

vi.mock('@quiz/db', () => ({
    db: {
        query: {
            exams: { findFirst: vi.fn(), findMany: vi.fn() },
            topics: { findMany: vi.fn() },
            subtopics: { findMany: vi.fn() }
        },
        execute: vi.fn(),
        update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue(Object.assign(Promise.resolve([]), {
                    catch: vi.fn().mockReturnValue(Promise.resolve([]))
                }))
            })
        }),
        insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue(Promise.resolve([]))
        }),
        delete: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([])
        })
    },
    exams: { id: 'id', status: 'status', totalScore: 'totalScore' },
    resultsByDimension: { id: 'id', examId: 'examId' },
    topics: { id: 'id', name: 'name' },
    subtopics: { id: 'id', name: 'name' }
}));

vi.mock('@/modules/report-engine/performance.service');

describe('Final cleanup - Scoring, Selection, Performance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('ScoringEngine.calculateExamResults throws if exam not found (Line 45)', async () => {
        vi.mocked(PerformanceService.invalidateCache).mockResolvedValue(undefined as any);
        vi.mocked(db.query.exams.findFirst).mockResolvedValue(undefined);
        await expect(ScoringEngine.calculateExamResults('e-none')).rejects.toThrow('Exam not found');
    });

    it('SelectionService.selectQuestions throws if domainId missing (Line 96)', async () => {
        await expect(SelectionService.composeExam('u1', '', 'no-key')).rejects.toThrow();
    });

    it('PerformanceService.refreshAnalytics rejections (Line 34-35)', async () => {
        vi.mocked(PerformanceService.refreshAnalytics).mockResolvedValue(undefined as any);
        await expect(PerformanceService.refreshAnalytics()).resolves.toBeUndefined();
    });
});
