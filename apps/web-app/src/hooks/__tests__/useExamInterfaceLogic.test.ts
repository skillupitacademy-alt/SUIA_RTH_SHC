import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExamInterfaceLogic } from '../useExamInterfaceLogic';
import { apiClient } from '@quiz/api-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuizStore } from '@/store/quiz-store';
import { getFilteredBackup } from '@/hooks/useExamBackup';

// Mock dependencies
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
    useSearchParams: vi.fn(),
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

vi.mock('@/hooks/useExamBackup', () => ({
    useExamBackup: vi.fn(() => ({ clearBackup: vi.fn() })),
    getFilteredBackup: vi.fn(),
}));

vi.mock('@quiz/observability', () => ({
    recordClientMetric: vi.fn(),
    METRICS: { EXAM: { SUBMIT: 'submit' } },
}));

describe('useExamInterfaceLogic', () => {
    const mockExamId = '123e4567-e89b-12d3-a456-426614174000';
    const mockRouter = {
        replace: vi.fn(),
        push: vi.fn(),
    };
    const mockSearchParams = {
        get: vi.fn((key) => (key === 'examId' ? mockExamId : null)),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as unknown as vi.Mock).mockReturnValue(mockRouter);
        (useSearchParams as unknown as vi.Mock).mockReturnValue(mockSearchParams);
        
        // Reset QuizStore
        useQuizStore.setState({
            questions: [],
            answers: {},
            markedForReview: [],
            timeLeft: 0,
            currentQuestionIndex: 0,
            examId: null,
            isSubmitted: false,
        });

        vi.useFakeTimers();
    });

    it('should initialize and load exam state into the store', async () => {
        const mockData = {
            id: mockExamId,
            status: 'started' as const,
            questions: [
                { questionId: 'q1', text: 'Q1', options: ['A', 'B'], userAnswer: null, type: 'MCQ' },
                { questionId: 'q2', text: 'Q2', options: ['C', 'D'], userAnswer: 'C', type: 'CODE_MCQ' },
            ],
            remainingTimeSeconds: 600,
        };

        (apiClient.quiz.getQuizState as unknown as vi.Mock).mockResolvedValue(mockData);
        (getFilteredBackup as unknown as vi.Mock).mockReturnValue({});

        renderHook(() => useExamInterfaceLogic());

        await act(async () => {
            await vi.runAllTimersAsync();
        });

        const store = useQuizStore.getState();
        expect(store.examId).toBe(mockExamId);
        expect(store.questions).toHaveLength(2);
        expect(store.answers['q2']).toBe(0); // Index of 'C' in ['C', 'D']
        expect(store.timeLeft).toBe(600);
    });

    it('should handle answer submission through the store and API', async () => {
        const mockQuestions = [
            { id: 'q1', text: 'Q1', options: ['A', 'B'], difficulty: 'Simple', type: 'MCQ' as const },
        ];
        useQuizStore.setState({ 
            questions: mockQuestions, 
            examId: mockExamId,
            currentQuestionIndex: 0 
        });

        const { result } = renderHook(() => useExamInterfaceLogic());

        await act(async () => {
            await result.current.actions.setAnswer(1); // Select 'B'
        });

        expect(useQuizStore.getState().answers['q1']).toBe(1);
        expect(apiClient.quiz.submitAnswer).toHaveBeenCalledWith(
            mockExamId, 
            'q1', 
            'B', 
            expect.objectContaining({ idempotencyKey: expect.any(String) })
        );
    });

    it('should handle finish attempt with confirmation', async () => {
        useQuizStore.setState({
            examId: mockExamId,
            questions: [{ id: 'q1' }, { id: 'q2' }],
            answers: { q1: 0 }, // Only one answered
        });

        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        (apiClient.quiz.submitExam as unknown as vi.Mock).mockResolvedValue({});

        const { result } = renderHook(() => useExamInterfaceLogic());

        await act(async () => {
            await result.current.actions.handleFinish();
        });

        expect(confirmSpy).toHaveBeenCalled();
        expect(apiClient.quiz.submitExam).toHaveBeenCalledWith(mockExamId, expect.any(Object));
        expect(mockRouter.push).toHaveBeenCalledWith(`/reports/active-report?examId=${mockExamId}`);
    });

    it('should navigate between questions', () => {
        useQuizStore.setState({ currentQuestionIndex: 0 });
        const { result } = renderHook(() => useExamInterfaceLogic());

        act(() => {
            result.current.actions.setCurrentIndex(1);
        });

        expect(useQuizStore.getState().currentQuestionIndex).toBe(1);
    });

    it('should toggle review flag', () => {
        const { result } = renderHook(() => useExamInterfaceLogic());

        act(() => {
            result.current.actions.toggleReview('q1');
        });

        expect(useQuizStore.getState().markedForReview).toContain('q1');
    });
});
