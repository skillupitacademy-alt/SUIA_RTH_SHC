/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExamHUD } from '../useExamHUD';
import { apiClient } from '@quiz/api-client';
import { useRouter } from 'next/navigation';
import { SyncManager } from '@/lib/sync-manager';
import { getFilteredBackup } from '@/hooks/useExamBackup';

// Mock dependencies
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}));

vi.mock('@quiz/api-client', () => ({
    apiClient: {
        quiz: {
            getQuizState: vi.fn(),
            submitAnswer: vi.fn(),
            submitExam: vi.fn(),
        },
    },
}));

vi.mock('@/utils/clientLogger', () => ({
    clientLogger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
    },
}));

vi.mock('@/lib/sync-manager', () => ({
    SyncManager: {
        syncAll: vi.fn(),
        saveAnswer: vi.fn(),
        removeAnswer: vi.fn(),
    },
}));

vi.mock('@/hooks/useExamBackup', () => ({
    getFilteredBackup: vi.fn(),
}));

describe('useExamHUD', () => {
    const mockExamId = '123e4567-e89b-12d3-a456-426614174000';
    const mockRouter = {
        replace: vi.fn(),
        push: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as any).mockReturnValue(mockRouter);
        // Mock setTimeout to execute immediately
        vi.useFakeTimers();
    });

    it('should initialize with loading state', () => {
        const { result } = renderHook(() => useExamHUD(mockExamId));
        expect(result.current.isLoading).toBe(true);
        expect(result.current.examId).toBe(mockExamId);
    });

    it('should redirect if examId is invalid', async () => {
        renderHook(() => useExamHUD('invalid-id'));
        expect(mockRouter.replace).toHaveBeenCalledWith('/quiz/new?error=invalid_exam');
    });

    it('should load exam data and reconcile with local backup', async () => {
        const mockData = {
            id: mockExamId,
            status: 'started' as const,
            questions: [
                { questionId: 'q1', text: 'Q1', options: ['A', 'B'], userAnswer: null },
                { questionId: 'q2', text: 'Q2', options: ['C', 'D'], userAnswer: 'C' },
            ],
            remainingTimeSeconds: 600,
        };

        (apiClient.quiz.getQuizState as any).mockResolvedValue(mockData);
        (getFilteredBackup as any).mockReturnValue({ q1: 'A' });

        const { result } = renderHook(() => useExamHUD(mockExamId));

        // Let the effect run (inc. jitter delay)
        await act(async () => {
            vi.runAllTimers();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.questions).toHaveLength(2);
        expect(result.current.answers).toEqual({ q1: 'A', q2: 'C' });
        expect(result.current.timeLeft).toBe(600);
        expect(result.current.currentIndex).toBe(0); // q1 was local backup but firstUnanswered check might be based on data.questions
    });

    it('should handle terminal statuses by redirecting to reports', async () => {
        (apiClient.quiz.getQuizState as any).mockResolvedValue({
            id: mockExamId,
            status: 'completed' as const,
            questions: [],
        });

        renderHook(() => useExamHUD(mockExamId));

        await act(async () => {
            vi.runAllTimers();
        });

        expect(mockRouter.replace).toHaveBeenCalledWith(`/reports/${mockExamId}`);
    });

    it('should decrement timeLeft every second', async () => {
        const mockData = {
            id: mockExamId,
            status: 'started' as const,
            questions: [{ questionId: 'q1', text: 'Q1', options: ['A'], userAnswer: null }],
            remainingTimeSeconds: 600,
        };

        (apiClient.quiz.getQuizState as any).mockResolvedValue(mockData);
        (getFilteredBackup as any).mockReturnValue({});

        const { result } = renderHook(() => useExamHUD(mockExamId));

        await act(async () => {
            vi.runAllTimers();
        });

        expect(result.current.timeLeft).toBe(600);

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.timeLeft).toBe(599);
    });

    it('should handle answer submission', async () => {
        const mockData = {
            id: mockExamId,
            status: 'started' as const,
            questions: [{ questionId: 'q1', text: 'Q1', options: ['A', 'B'], userAnswer: null }],
            remainingTimeSeconds: 600,
        };

        (apiClient.quiz.getQuizState as any).mockResolvedValue(mockData);
        (getFilteredBackup as any).mockReturnValue({});

        const { result } = renderHook(() => useExamHUD(mockExamId));

        await act(async () => {
            vi.runAllTimers();
        });

        await act(async () => {
            await result.current.actions.handleAnswer('q1', 'B');
        });

        expect(result.current.answers['q1']).toBe('B');
        expect(SyncManager.saveAnswer).toHaveBeenCalled();
        expect(apiClient.quiz.submitAnswer).toHaveBeenCalledWith(mockExamId, 'q1', 'B', expect.any(Object));
        expect(SyncManager.removeAnswer).toHaveBeenCalled();
    });

    it('should handle submission failure', async () => {
        (apiClient.quiz.getQuizState as any).mockResolvedValue({
            id: mockExamId,
            status: 'started' as const,
            questions: [],
        });

        const { result } = renderHook(() => useExamHUD(mockExamId));

        await act(async () => {
            vi.runAllTimers();
        });

        (apiClient.quiz.submitExam as any).mockRejectedValue(new Error('Network Error'));

        await act(async () => {
            await result.current.actions.submitExam();
        });

        expect(result.current.isSubmitting).toBe(false);
        expect(result.current.error).toBe('Submission failed. Please check connection.');
    });
});
