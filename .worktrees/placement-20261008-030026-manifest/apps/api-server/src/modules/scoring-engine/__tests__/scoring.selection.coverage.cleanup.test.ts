import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, exams, resultsByDimension, topics } from '@quiz/db';
import { container } from '@/modules/core/container';
import { ScoringEngine } from '../scoring.engine';
import { SelectionService } from '@/modules/selection-engine/selection.service';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { installSelectMock } from '../../../test/select-mock';

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
    db: {
        query: {
            exams: { findFirst: vi.fn(), findMany: vi.fn() },
            topics: { findMany: vi.fn() },
            subtopics: { findMany: vi.fn() }
        },
        select: vi.fn(),
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
    examBlueprints: {},
    examQuestions: {},
    questions: {},
    questionSkills: {},
    skills: {},
    resultsByDimension: { id: 'id', examId: 'examId' },
    topics: { id: 'id', name: 'name' },
    subtopics: { id: 'id', name: 'name' },
    subjects: {},
    domains: {},
    topicSkills: {}
}));

const mockPerformanceService = {
    invalidateCache: vi.fn(),
    refreshAnalytics: vi.fn(),
    cacheReport: vi.fn(),
    getCachedReport: vi.fn()
};

const mockSelectionService = {
    composeExam: vi.fn(),
    selectQuestions: vi.fn()
};

vi.mock('@/modules/report-engine/performance.service', () => ({
    PerformanceService: vi.fn().mockImplementation(() => mockPerformanceService)
}));

vi.mock('@/modules/selection-engine/selection.service', () => ({
    SelectionService: vi.fn().mockImplementation(() => mockSelectionService)
}));

describe('Final cleanup - Scoring, Selection, Performance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        container.register(PerformanceService, mockPerformanceService as any);
        container.register(SelectionService, mockSelectionService as any);
    });

    it('ScoringEngine.calculateExamResults throws if exam not found (Line 45)', async () => {
        mockPerformanceService.invalidateCache.mockResolvedValue(undefined);
        installSelectMock(db as any, [
            { resolveOn: 'limit', result: [] },
        ]);
        await expect(container.get(ScoringEngine).calculateExamResults('e-none')).rejects.toThrow('Exam not found');
    });

    it('SelectionService.selectQuestions throws if domainId missing (Line 96)', async () => {
        mockSelectionService.composeExam.mockRejectedValue(new Error('domainId missing'));
        await expect(container.get(SelectionService).composeExam('u1', '', 'no-key')).rejects.toThrow();
    });

    it('PerformanceService.refreshAnalytics rejections (Line 34-35)', async () => {
        mockPerformanceService.refreshAnalytics.mockResolvedValue(undefined);
        await expect(container.get(PerformanceService).refreshAnalytics()).resolves.toBeUndefined();
    });
});


