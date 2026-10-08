'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, QuizState } from '@quiz/api-client';
import { clientLogger } from '@/utils/clientLogger';
import { SyncManager } from '@/lib/sync-manager';
import { getFilteredBackup } from '@/hooks/useExamBackup';

type QuizQuestion = QuizState['questions'][number];

export interface ExamHUDState {
    examId: string;
    questions: QuizQuestion[];
    currentIndex: number;
    answers: Record<string, string>;
    flags: Record<string, boolean>;
    timeLeft: number;
    status: QuizState['status'];
    isLoading: boolean;
    error: string | null;
    isSubmitting: boolean;
}

export function useExamHUD(examId: string) {
    const router = useRouter();
    const [state, setState] = useState<ExamHUDState>({
        examId,
        questions: [],
        currentIndex: 0,
        answers: {},
        flags: {},
        timeLeft: 0,
        status: 'started', // Default to started for type compatibility
        isLoading: true,
        error: null,
        isSubmitting: false,
    });

    // 1. Initial Fetch & Reconciliation
    useEffect(() => {
        const init = async () => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!examId || examId === 'undefined' || !uuidRegex.test(examId)) {
                clientLogger.warn('[useExamHUD] Invalid examId, redirecting.');
                router.replace('/quiz/new?error=invalid_exam');
                return;
            }

            try {
                // Jitter to prevent thundering herd
                await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));

                const data = await apiClient.quiz.getQuizState(examId);

                const terminalStatuses = ['completed', 'processing', 'failed', 'abandoned'];
                if (terminalStatuses.includes(data.status)) {
                    router.replace(`/reports/${examId}`);
                    return;
                }

                const localBackup = getFilteredBackup(
                    data.id,
                    data.questions.map((q: QuizQuestion) => q.questionId)
                );

                const mergedAnswers = {
                    ...data.questions.reduce<Record<string, string>>((acc, q: QuizQuestion) => {
                        if (q.userAnswer) acc[q.questionId] = q.userAnswer;
                        return acc;
                    }, {})
                };

                Object.entries(localBackup).forEach(([qId, localAnswer]) => {
                    if (!mergedAnswers[qId]) mergedAnswers[qId] = localAnswer;
                });

                const firstUnanswered = data.questions.findIndex(q => !mergedAnswers[q.questionId]);

                setState(prev => ({
                    ...prev,
                    questions: data.questions,
                    answers: mergedAnswers,
                    timeLeft: data.remainingTimeSeconds || 0,
                    status: data.status,
                    currentIndex: firstUnanswered !== -1 ? firstUnanswered : 0,
                    isLoading: false
                }));

            } catch (err) {
                clientLogger.error('Failed to load exam', { error: err instanceof Error ? err.message : 'unknown' });
                setState(prev => ({ 
                    ...prev, 
                    error: err instanceof Error ? err.message : 'Failed to connect.', 
                    isLoading: false 
                }));
            }
        };

        if (examId) init();
    }, [examId, router]);

    // 2. Timer Tick
    useEffect(() => {
        if (state.isLoading || state.status !== 'started' || state.timeLeft <= 0) return;
        const interval = setInterval(() => {
            setState(prev => ({ ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) }));
        }, 1000);
        return () => clearInterval(interval);
    }, [state.isLoading, state.status, state.timeLeft]);

    // 3. Background Sync
    useEffect(() => {
        if (state.status !== 'started') return;

        const sync = async () => {
            await SyncManager.syncAll(async (item) => {
                return apiClient.quiz.submitAnswer(item.examId, item.questionId, item.answer, {
                    idempotencyKey: item.idempotencyKey
                });
            });
        };

        const initialDelay = Math.random() * 10000;
        const timeout = setTimeout(() => {
            sync();
            const interval = setInterval(sync, 10000);
            return () => clearInterval(interval);
        }, initialDelay);

        return () => clearTimeout(timeout);
    }, [state.status]);

    // 4. Actions
    const handleAnswer = useCallback(async (questionId: string, optionId: string) => {
        const idempotencyKey = `${examId}:${questionId}:${Date.now()}`;

        setState(prev => ({
            ...prev,
            answers: { ...prev.answers, [questionId]: optionId }
        }));

        try {
            await SyncManager.saveAnswer({
                examId,
                questionId,
                answer: optionId,
                idempotencyKey
            });

            await apiClient.quiz.submitAnswer(examId, questionId, optionId, {
                idempotencyKey
            });

            await SyncManager.removeAnswer(idempotencyKey);
        } catch (err) {
            clientLogger.warn('Network issue detected. Queued for sync.', { error: err });
        }
    }, [examId]);

    const toggleFlag = useCallback((questionId: string) => {
        setState(prev => ({
            ...prev,
            flags: { ...prev.flags, [questionId]: !prev.flags[questionId] }
        }));
    }, []);

    const goToQuestion = useCallback((index: number) => {
        setState(prev => {
            if (index >= 0 && index < prev.questions.length) {
                return { ...prev, currentIndex: index };
            }
            return prev;
        });
    }, []);

    const submitExam = useCallback(async () => {
        if (state.isSubmitting) return;
        setState(prev => ({ ...prev, isSubmitting: true }));

        try {
            await apiClient.quiz.submitExam(examId);
            router.replace(`/reports/${examId}`);
        } catch (err) {
            clientLogger.error('Submission failed', { error: err });
            setState(prev => ({ ...prev, isSubmitting: false, error: 'Submission failed. Please check connection.' }));
        }
    }, [examId, state.isSubmitting, router]);

    return {
        ...state,
        actions: {
            handleAnswer,
            toggleFlag,
            goToQuestion,
            submitExam,
            setError: (err: string | null) => setState(prev => ({ ...prev, error: err }))
        }
    };
}
