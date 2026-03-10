'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@quiz/api-client';
import { useQuizStore } from '@/store/quiz-store';
import { useShallow } from 'zustand/react/shallow';
import { useExamBackup, getFilteredBackup } from '@/hooks/useExamBackup';
import { clientLogger } from '@/utils/clientLogger';
import { recordClientMetric } from '@quiz/observability';

type RemoteQuestion = {
    questionId: string;
    type?: string;
    text: string;
    codeSnippet?: string | null;
    options: string[];
    difficulty?: string;
    userAnswer: string | null;
};

export function useExamInterfaceLogic() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const examIdParam = searchParams.get('examId');

    const {
        questions,
        answers,
        markedForReview,
        timeLeft,
        currentQuestionIndex,
        setAnswer,
        toggleReview,
        setCurrentIndex,
        finishQuiz,
        examId,
        setExamId,
        isSubmitted,
        updateTimeLeft
    } = useQuizStore(
        useShallow((s) => ({
            questions: s.questions,
            answers: s.answers,
            markedForReview: s.markedForReview,
            timeLeft: s.timeLeft,
            currentQuestionIndex: s.currentQuestionIndex,
            setAnswer: s.setAnswer,
            toggleReview: s.toggleReview,
            setCurrentIndex: s.setCurrentIndex,
            finishQuiz: s.finishQuiz,
            examId: s.examId,
            setExamId: s.setExamId,
            isSubmitted: s.isSubmitted,
            updateTimeLeft: s.updateTimeLeft,
        }))
    );

    const normalizedAnswers = useMemo(() => {
        const result: Record<string, string> = {};
        Object.entries(answers).forEach(([qId, optIdx]) => {
            const q = questions.find(question => question.id === qId);
            if (q && q.options[optIdx]) {
                result[qId] = q.options[optIdx];
            }
        });
        return result;
    }, [answers, questions]);

    const { clearBackup } = useExamBackup(examId || undefined, normalizedAnswers);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const withRetry = useCallback(async <T,>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
        try {
            return await fn();
        } catch (err) {
            if (retries <= 0) throw err;
            await new Promise(resolve => setTimeout(resolve, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
    }, []);

    const handleAnswer = useCallback(async (optionIndex: number) => {
        const question = questions[currentQuestionIndex];
        if (!question || !examId) return;

        const questionId = question.id;
        const option = question.options[optionIndex];

        setAnswer(questionId, optionIndex);

        try {
            const idempotencyKey = `${examId}:${questionId}:${optionIndex}`;
            await withRetry(() =>
                apiClient.quiz.submitAnswer(examId, questionId, option, {
                    idempotencyKey
                })
            );
        } catch (err) {
            clientLogger.error('Failed to save answer after retries', { error: err });
        }
    }, [examId, currentQuestionIndex, questions, setAnswer, withRetry]);

    useEffect(() => {
        const initExam = async () => {
            if (!examIdParam) {
                router.push('/quiz/new');
                return;
            }

            try {
                setIsLoading(true);
                const state = await apiClient.quiz.getQuizState(examIdParam);

                if (state.status === 'completed' || state.status === 'processing' || state.status === 'failed') {
                    router.replace(`/reports/active-report?examId=${examIdParam}`);
                    return;
                }

                const mappedQuestions = state.questions.map((q: RemoteQuestion) => ({
                    id: q.questionId,
                    type: (q.type === 'code_mcq' ? 'CODE_MCQ' : 'MCQ') as 'MCQ' | 'CODE_MCQ',
                    text: q.text,
                    code: q.codeSnippet || "",
                    options: q.options,
                    difficulty: q.difficulty || 'Intermediate'
                }));

                useQuizStore.getState().startQuiz(mappedQuestions, {
                    domain: state.id || 'unknown',
                    subjects: [],
                    difficulty: 'mixed',
                }, state.remainingTimeSeconds || 0);
                
                setExamId(state.id);

                state.questions.forEach((q: RemoteQuestion) => {
                    if (q.userAnswer !== null) {
                        const idx = q.options.indexOf(q.userAnswer);
                        if (idx !== -1) {
                            useQuizStore.getState().setAnswer(q.questionId, idx);
                        }
                    }
                });

                const firstUnanswered = state.questions.findIndex((q: RemoteQuestion) => q.userAnswer === null);
                setCurrentIndex(firstUnanswered !== -1 ? firstUnanswered : 0);

                const localBackup = getFilteredBackup(state.id, state.questions.map((q: RemoteQuestion) => q.questionId));
                Object.entries(localBackup).forEach(([qId, localAnswer]) => {
                    const storeState = useQuizStore.getState();
                    const questionInStore = storeState.questions.find(q => q.id === qId);
                    const serverQuestion = state.questions.find((q: RemoteQuestion) => q.questionId === qId);
                    
                    if (serverQuestion && serverQuestion.userAnswer === null && questionInStore) {
                        const optionIdx = questionInStore.options.indexOf(localAnswer);
                        if (optionIdx !== -1) storeState.setAnswer(qId, optionIdx);
                    }
                });

                if (mappedQuestions.length === 0) {
                    recordClientMetric('ui.exam.empty_questions', 1, { examId: examIdParam });
                    setError("No questions found for this session.");
                }

            } catch (err) {
                clientLogger.error('Failed to load exam session', { error: err });
                router.push('/quiz/new');
            } finally {
                setIsLoading(false);
            }
        };

        void initExam();
    }, [examIdParam, router, setExamId, setCurrentIndex, setIsLoading, setError]);

    useEffect(() => {
        if (isLoading || isSubmitted) return;
        const timer = setInterval(() => updateTimeLeft(), 1000);
        return () => clearInterval(timer);
    }, [isLoading, isSubmitted, updateTimeLeft]);

    const handleFinish = async () => {
        if (!examId || isSubmitting) return;

        if (Object.keys(answers).length < questions.length) {
            const confirmed = window.confirm(`You have only answered ${Object.keys(answers).length} of ${questions.length} questions. Finish anyway?`);
            if (!confirmed) return;
        }

        try {
            setIsSubmitting(true);
            const submissionKey = crypto.randomUUID();
            await withRetry(() =>
                apiClient.quiz.submitExam(examId, { idempotencyKey: submissionKey })
            );

            clearBackup(examId);
            finishQuiz();
            router.push(`/reports/active-report?examId=${examId}`);
        } catch (err) {
            clientLogger.error('Failed to submit exam', { error: err });
            setError("Submission failed. Check connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        examId,
        questions,
        answers,
        markedForReview,
        timeLeft,
        currentQuestionIndex,
        isLoading,
        isSubmitting,
        isSubmitted,
        error,
        actions: {
            setAnswer: handleAnswer,
            toggleReview,
            setCurrentIndex,
            handleFinish,
            setError
        }
    };
}
