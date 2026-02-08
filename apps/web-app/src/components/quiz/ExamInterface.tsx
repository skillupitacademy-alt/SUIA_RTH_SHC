'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Flag,
    Code
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuizStore } from '@/store/quiz-store';
import { useSearchParams, useRouter } from 'next/navigation';

export function ExamInterface() {
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
        setQuestions,
        examId,
        setExamId,
        isSubmitted,
        updateTimeLeft,
    } = useQuizStore();

    const [isLoading, setIsLoading] = useState(true);
    // isSaving removed as it was unused
    const [error, setError] = useState<string | null>(null);

    const question = questions[currentQuestionIndex];

    const handleAnswer = async (optionIndex: number) => {
        const currentQuestion = questions[currentQuestionIndex];
        const questionId = currentQuestion.id;
        const option = currentQuestion.options[optionIndex];

        // Optimistic UI update
        setAnswer(questionId, optionIndex);

        // Real persistence
        if (examId) {
            try {
                // Backend expects questionId (uuid) and option text
                await apiClient.quiz.submitAnswer(examId, questionId, option);
            } catch {
                // Ignore silent save errors
            } finally {
                // Noop
            }
        }
    };

    useEffect(() => {
        const initExam = async () => {
            if (!examIdParam) {
                router.push('/quiz/new');
                return;
            }

            try {
                setIsLoading(true);
                const state = await apiClient.quiz.getQuizState(examIdParam);

                // Status Gating (Phase 2 Revision)
                if (state.status === 'completed' || state.status === 'processing' || state.status === 'failed') {
                    router.replace(`/reports/active-report?examId=${examIdParam}`);
                    return;
                }

                // Map Questions to store interface
                const mappedQuestions = state.questions.map((q) => ({
                    id: q.questionId, // Actual question UUID
                    type: (q.type === 'code_mcq' ? 'CODE_MCQ' : 'MCQ') as 'MCQ' | 'CODE_MCQ',
                    text: q.text,
                    code: q.codeSnippet || "",
                    options: q.options,
                    difficulty: q.difficulty || 'Intermediate'
                }));

                // Reset and Hydrate Store (Phase 2 Revision)
                // Using startQuiz to clear old state and set initial duration
                useQuizStore.getState().startQuiz(mappedQuestions, null, state.remainingTimeSeconds || 0);
                setExamId(state.id);

                // Hydrate answers from backend
                state.questions.forEach((q: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                    if (q.userAnswer !== null) {
                        const idx = q.options.indexOf(q.userAnswer);
                        if (idx !== -1) {
                            useQuizStore.getState().setAnswer(q.questionId, idx);
                        }
                    }
                });

                // Calculate connection-safe starting index (first unanswered or 0)
                const firstUnanswered = state.questions.findIndex((q: any) => q.userAnswer === null); // eslint-disable-line @typescript-eslint/no-explicit-any
                setCurrentIndex(firstUnanswered !== -1 ? firstUnanswered : 0);

            } catch (err) {
                console.error("Failed to load exam session", err);
                router.push('/quiz/new');
            } finally {
                setIsLoading(false);
            }
        };

        initExam();
    }, [examIdParam, router, setExamId, setQuestions, questions.length, examId]);

    // Timer logic
    useEffect(() => {
        if (isLoading || isSubmitted) return;
        const timer = setInterval(() => {
            updateTimeLeft();
        }, 1000);
        return () => clearInterval(timer);
    }, [isLoading, isSubmitted, updateTimeLeft]);

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFinish = async () => {
        if (!examId || isSubmitting) return;

        // Simple validation before submission
        if (Object.keys(answers).length < questions.length) {
            const confirmed = window.confirm(`You have only answered ${Object.keys(answers).length} of ${questions.length} questions. Finish anyway?`);
            if (!confirmed) return;
        }

        try {
            setIsSubmitting(true);
            await apiClient.quiz.submitExam(examId);
            finishQuiz();
            router.push(`/reports/active-report?examId=${examId}`);
        } catch (err) {
            console.error("Failed to submit exam", err);
            setError("Failed to submit exam. Please try again or check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-[calc(100vh-64px)] bg-muted/5 items-center justify-center">
                <p className="text-xl font-bold text-primary animate-pulse">Loading Exam...</p>
            </div>
        );
    }

    if (!question) return null;

    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] bg-muted/5">
            {/* Exam Header */}
            <header className="sticky top-0 z-40 bg-background border-b px-6 py-4 flex items-center justify-between shadow-sm">
                {error && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        {error}
                        <button onClick={() => setError(null)} className="ml-2 hover:bg-white/20 rounded-full p-1">
                            <ChevronRight size={14} className="rotate-90" />
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-6">
                    <div>
                        <h2 className="text-xl font-black tracking-tight uppercase italic text-primary">Enterprise Exam</h2>
                        <p className="text-xs font-bold text-muted-foreground">Domain: Technical Assessment</p>
                    </div>
                    <div className="hidden md:flex gap-1.5">
                        {questions.map((q, i) => (
                            <button
                                key={q.id}
                                onClick={() => setCurrentIndex(i)}
                                className={cn(
                                    "h-8 w-8 rounded-lg text-xs font-bold transition-all border-2",
                                    currentQuestionIndex === i ? "border-primary bg-primary/5 text-primary" :
                                        answers[q.id] !== undefined ? "border-green-500 bg-green-500/10 text-green-600" :
                                            markedForReview.includes(q.id) ? "border-orange-500 bg-orange-500/10 text-orange-600" :
                                                "border-muted bg-background text-muted-foreground"
                                )}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-2xl border-2 transition-colors",
                        timeLeft < 300 ? "border-red-500 text-red-500 bg-red-50" : "border-primary/20 bg-primary/5 text-primary"
                    )}>
                        <Clock size={16} className={timeLeft < 300 ? "animate-pulse" : ""} />
                        <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
                    </div>
                    <button
                        onClick={handleFinish}
                        disabled={isSubmitting}
                        className="hidden sm:flex items-center gap-2 px-6 py-2 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Exam"}
                    </button>
                </div>
            </header>

            {/* Question Content */}
            <main className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto p-6 md:p-12">
                <div className="bg-background border rounded-[3rem] p-8 md:p-12 shadow-sm min-h-[500px] flex flex-col">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold bg-muted px-4 py-1.5 rounded-full text-muted-foreground">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </span>
                            <span className={cn(
                                "text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full",
                                question.difficulty === 'Simple' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                            )}>
                                {question.difficulty}
                            </span>
                        </div>
                        {question.type === 'CODE_MCQ' && (
                            <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                <Code size={18} /> Code Analysis
                            </div>
                        )}
                    </div>

                    <div className="flex-1 space-y-8">
                        <h1 className="text-2xl md:text-3xl font-extrabold leading-tight text-foreground/90">
                            {question.text}
                        </h1>

                        {question.type === 'CODE_MCQ' && question.code && question.code.trim().length > 0 && (
                            <div className="relative group">
                                <pre className="p-6 rounded-3xl bg-[#0d1117] text-[#e6edf3] font-mono text-sm overflow-x-auto border-2 border-primary/10 shadow-inner">
                                    <code>{question.code}</code>
                                </pre>
                                <div className="absolute top-4 right-4 text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                                    TypeScript Snippet
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 pt-4">
                            {question.options.map((option, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(i)}
                                    className={cn(
                                        "flex items-center justify-between w-full p-6 rounded-2xl border-2 transition-all text-left group",
                                        answers[question.id] === i
                                            ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                                            : "border-muted bg-muted/5 hover:border-primary/20 hover:bg-white"
                                    )}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl border-2 flex items-center justify-center font-bold transition-all",
                                            answers[question.id] === i ? "bg-primary border-primary text-white" : "border-muted-foreground/20 group-hover:border-primary/50"
                                        )}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <span className="font-semibold text-lg">{option}</span>
                                    </div>
                                    {answers[question.id] === i && (
                                        <CheckCircle2 className="text-primary shrink-0" size={24} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="mt-12 pt-8 border-t flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                disabled={currentQuestionIndex === 0}
                                onClick={() => setCurrentIndex(currentQuestionIndex - 1)}
                                className="p-4 rounded-2xl border-2 font-bold hover:bg-muted transition-all disabled:opacity-30"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={() => toggleReview(question.id)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-4 rounded-2xl border-2 font-bold transition-all",
                                    markedForReview.includes(question.id) ? "bg-orange-500 border-orange-500 text-white" : "hover:bg-muted"
                                )}
                            >
                                <Flag size={20} className={markedForReview.includes(question.id) ? "fill-current" : ""} />
                                <span className="hidden sm:inline">Review later</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            {currentQuestionIndex < questions.length - 1 ? (
                                <button
                                    onClick={() => setCurrentIndex(currentQuestionIndex + 1)}
                                    className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-secondary text-primary-foreground font-black shadow-lg hover:bg-secondary/90 transition-all active:scale-95 group"
                                >
                                    Next Question
                                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleFinish}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-green-600 text-white font-black shadow-lg hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? "Submitting..." : "Finish Attempt"}
                                    <CheckCircle2 size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary" /> Active</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500" /> Answered</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-orange-500" /> Review</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-muted" /> Unvisited</div>
                </div>
            </main>
        </div>
    );
}
