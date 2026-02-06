'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { apiClient, QuizState } from '@quiz/api-client';
import {
    Loader2,
    AlertCircle,
    Timer,
    ChevronLeft,
    ChevronRight,
    Flag,
    CheckCircle2,
    Circle,
    Info,
    LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { getTheme } from '@/lib/exam-themes';
import { ThemeSwitcher } from '@/components/exam/ThemeSwitcher';

// Detailed Question Status
type QuestionStatus = 'current' | 'answered' | 'flagged' | 'unvisited';

interface HUDState extends QuizState {
    currentIndex: number;
    flags: Record<string, boolean>;
    localAnswers: Record<string, string>;
}

export default function ActiveExamPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { examId } = useParams<{ examId: string }>();
    const [state, setState] = useState<HUDState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [confirmSubmit, setConfirmSubmit] = useState(false);

    // Theme Configuration
    const theme = getTheme(searchParams.get('theme'));

    // 1. Initial Fetch & Gating
    useEffect(() => {
        const fetchState = async () => {
            // Guardrail: Validate examId format before proceeding
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!examId || examId === 'undefined' || !uuidRegex.test(examId)) {
                console.warn('[ActiveExamPage] Invalid examId detected, redirecting to Mission Control (/quiz/new?error=invalid_exam).');
                router.replace('/quiz/new?error=invalid_exam');
                return;
            }

            try {
                const data = await apiClient.quiz.getQuizState(examId);

                // Status Gating (P0 Requirement)
                const terminalStatuses = ['completed', 'processing', 'failed', 'abandoned'];
                if (terminalStatuses.includes(data.status)) {
                    router.replace(`/reports/active-report?examId=${examId}`);
                    return;
                }

                // Initialize local state
                const firstUnanswered = data.questions.findIndex(q => q.userAnswer === null);
                setState({
                    ...data,
                    currentIndex: firstUnanswered !== -1 ? firstUnanswered : 0,
                    flags: {}, // We'll track flags locally for now as backend doesn't persist them yet
                    localAnswers: data.questions.reduce((acc, q) => {
                        if (q.userAnswer) acc[q.questionId] = q.userAnswer;
                        return acc;
                    }, {} as Record<string, string>)
                });

                setTimeLeft(data.remainingTimeSeconds || 0);
            } catch (err: any) {
                console.error('Failed to load exam:', err);
                if (err.message.includes('403')) setError('Unauthorized: Session ownership mismatch.');
                else if (err.message.includes('404')) setError('Assessment session not found.');
                else setError('Failed to connect to Mission Control.');
            } finally {
                setLoading(false);
            }
        };

        fetchState();
    }, [examId, router]);

    // 2. Mission Timer Tick
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => (prev && prev > 0) ? prev - 1 : 0);
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft]);

    // 3. Handlers
    const handleSelectOption = async (questionId: string, optionId: string) => {
        if (!state) return;

        // Optimistic Update
        setState(prev => prev ? ({
            ...prev,
            localAnswers: { ...prev.localAnswers, [questionId]: optionId }
        }) : null);

        try {
            // Persistence (No raw fetch - using apiClient)
            await apiClient.quiz.submitAnswer(examId, questionId, optionId);
        } catch (err) {
            console.error('Critical: Failed to persist answer', err);
            // In a real premium app, we might show a "Sync Error" toast here
        }
    };

    const toggleFlag = (questionId: string) => {
        setState(prev => prev ? ({
            ...prev,
            flags: { ...prev.flags, [questionId]: !prev.flags[questionId] }
        }) : null);
    };

    const goToQuestion = (index: number) => {
        if (!state) return;
        if (index >= 0 && index < state.questions.length) {
            setState({ ...state, currentIndex: index });
        }
    };

    const submitExam = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await apiClient.quiz.submitExam(examId);
            router.replace(`/reports/active-report?examId=${examId}`);
        } catch (err) {
            console.error('Failed to submit exam', err);
            setIsSubmitting(false);
            setError('Submission failed. Please check your connection.');
        }
    };

    // 4. Derived Data
    const currentQuestion = useMemo(() => {
        if (!state) return null;
        return state.questions[state.currentIndex];
    }, [state]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const isNearEnd = (timeLeft || 0) < 300; // < 5 mins

    // 5. Render Helpers
    if (loading) return (
        <div className={cn("flex h-screen flex-col items-center justify-center gap-4", theme.colors.pageBackground)}>
            <Loader2 className="animate-spin text-pink-500" size={48} />
            <p className="text-pink-500 font-black font-outfit uppercase tracking-tighter">Initializing Mission Control...</p>
        </div>
    );

    if (error) return (
        <div className={cn("flex h-screen flex-col items-center justify-center gap-6 text-center p-6", theme.colors.pageBackground)}>
            <AlertCircle className="text-pink-500" size={64} />
            <div>
                <h1 className="text-3xl font-black text-gray-900 font-outfit uppercase">Connection Severed</h1>
                <p className="text-gray-600 mt-2 max-w-md">{error}</p>
            </div>
            <button
                onClick={() => router.push('/quiz/new')}
                className={cn(
                    "px-8 py-3 font-bold transition-all",
                    theme.colors.primaryButton,
                    theme.colors.primaryButtonText,
                    theme.effects.buttonRadius,
                    theme.effects.primaryButtonShadow
                )}
            >
                Return to Command Center
            </button>
        </div>
    );

    if (!state || !currentQuestion) return null;

    return (
        <div className={cn("min-h-screen text-gray-900 font-inter selection:bg-pink-500/30", theme.colors.pageBackground)}>
            {/* Theme Switcher (Dev Only) */}
            <ThemeSwitcher />

            {/* TOP NAVIGATION HUD */}
            <header className={cn(
                "sticky top-0 z-50 border-b px-6 flex items-center justify-between backdrop-blur-xl",
                theme.spacing.headerHeight,
                "bg-white/90 border-gray-200"
            )}>
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center font-black italic text-white">!G</div>
                    <div className="h-4 w-[1px] bg-gray-200 mx-2" />
                    <div>
                        <h2 className="text-xs font-black font-outfit uppercase tracking-widest text-gray-500">Active Campaign</h2>
                        <p className="text-sm font-bold truncate max-w-[200px] text-gray-900">{examId}</p>
                    </div>
                </div>

                <div className={cn(
                    "flex items-center gap-3 px-6 py-2 rounded-full border transition-all duration-500",
                    isNearEnd ? "border-pink-500/50 bg-pink-50 animate-pulse" : "border-gray-200 bg-gray-50"
                )}>
                    <Timer size={18} className={isNearEnd ? "text-pink-500" : "text-gray-600"} />
                    <span className={cn(
                        "font-mono font-black text-lg tabular-nums",
                        isNearEnd ? "text-pink-500" : "text-gray-900"
                    )}>
                        {formatTime(timeLeft || 0)}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setConfirmSubmit(true)}
                        className="px-6 py-2 bg-pink-500 text-white text-sm font-black font-outfit rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-pink-500/20"
                    >
                        TERMINATE SESSION
                    </button>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
                {/* LEFT: TACTICAL SIDEBAR */}
                <aside className="lg:col-span-3 space-y-6 order-2 lg:order-1">
                    <div className={cn(
                        "rounded-3xl p-6 border",
                        theme.colors.questionCard,
                        theme.colors.questionCardBorder
                    )}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-outfit font-black uppercase text-xs tracking-widest text-pink-500">Tactical Map</h3>
                            <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-600">
                                {Object.keys(state.localAnswers).length}/{state.questions.length} COMPLETE
                            </span>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                            {state.questions.map((q, idx) => {
                                const isCurrent = idx === state.currentIndex;
                                const isAnswered = !!state.localAnswers[q.questionId];
                                const isFlagged = state.flags[q.questionId];

                                // Determine chip styling based on state
                                let chipClasses = '';
                                if (isCurrent) {
                                    chipClasses = theme.colors.tacticalChipCurrent;
                                } else if (isFlagged) {
                                    chipClasses = theme.colors.tacticalChipFlagged;
                                } else if (isAnswered) {
                                    chipClasses = theme.colors.tacticalChipAnswered;
                                } else {
                                    chipClasses = theme.colors.tacticalChipUnvisited;
                                }

                                return (
                                    <button
                                        key={q.questionId}
                                        onClick={() => goToQuestion(idx)}
                                        className={cn(
                                            "aspect-square border-2 flex items-center justify-center transition-all duration-150 relative overflow-hidden hover:scale-105 active:scale-95",
                                            theme.spacing.tacticalChipSize,
                                            theme.effects.chipRadius,
                                            chipClasses
                                        )}
                                    >
                                        <span className="text-[11px] font-black font-outfit">
                                            {(idx + 1).toString().padStart(2, '0')}
                                        </span>
                                        {isFlagged && (
                                            <div className="absolute top-0.5 right-0.5">
                                                <Flag size={8} fill="currentColor" className="text-orange-500" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 space-y-3 pt-6 border-t border-gray-200">
                            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                <div className="w-2 h-2 rounded bg-pink-500" /> Active Position
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                <div className="w-2 h-2 rounded bg-green-500" /> Answered
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                <Flag size={8} className="text-orange-500" fill="currentColor" /> Marked for Review
                            </div>
                        </div>
                    </div>

                    <div className={cn(
                        "rounded-3xl p-6 border",
                        theme.colors.questionCard,
                        theme.colors.questionCardBorder
                    )}>
                        <div className="flex items-center gap-3 mb-4">
                            <LayoutDashboard size={14} className="text-pink-500" />
                            <h3 className="font-bold text-sm tracking-tight text-gray-900">Mission Metrics</h3>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Completion</span>
                                <span>{Math.round((Object.keys(state.localAnswers).length / state.questions.length) * 100)}%</span>
                            </div>
                            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-pink-500 transition-all duration-1000"
                                    style={{ width: `${(Object.keys(state.localAnswers).length / state.questions.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* RIGHT: QUESTION ENGINE */}
                <div className="lg:col-span-9 space-y-6 order-1 lg:order-2">
                    <div className={cn(
                        "border flex flex-col min-h-[520px]",
                        theme.colors.questionCard,
                        theme.colors.questionCardBorder,
                        theme.spacing.questionCardPadding,
                        theme.effects.questionCardRadius
                    )}>
                        {/* Header Area */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-10 pb-8 border-b border-gray-200">
                            <div>
                                <span className="inline-block px-3 py-1 rounded-full bg-[#FF2D55]/10 border border-[#FF2D55]/20 text-[#FF2D55] text-[10px] font-black uppercase tracking-tighter mb-3">
                                    Strategic Analysis • SEC-{(state.currentIndex + 1).toString().padStart(3, '0')}
                                </span>
                                <h1 className="text-2xl lg:text-3xl font-bold font-outfit leading-tight lg:max-w-3xl">
                                    {currentQuestion.text}
                                </h1>
                            </div>
                            <button
                                onClick={() => toggleFlag(currentQuestion.questionId)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-3 border-2 transition-all font-bold text-sm",
                                    theme.effects.buttonRadius,
                                    state.flags[currentQuestion.questionId]
                                        ? "bg-pink-50 border-pink-500 text-pink-600"
                                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                                )}
                            >
                                <Flag size={16} fill={state.flags[currentQuestion.questionId] ? 'currentColor' : 'none'} />
                                <span>{state.flags[currentQuestion.questionId] ? 'Review Flag Set' : 'Flag for Review'}</span>
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-grow space-y-10">
                            {currentQuestion.codeSnippet && (
                                <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6 font-mono text-sm leading-relaxed relative group">
                                    <div className="absolute top-0 right-8 px-4 py-1.5 bg-gray-100 rounded-b-xl border-x-2 border-b-2 border-gray-200 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                        Source Fragment
                                    </div>
                                    <pre className="overflow-x-auto pt-4 text-gray-800 whitespace-pre-wrap">
                                        <code>{currentQuestion.codeSnippet}</code>
                                    </pre>
                                </div>
                            )}

                            {/* Options Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentQuestion.options.map((option: any, oIdx: number) => {
                                    // Handle both string and object options
                                    const optionText = typeof option === 'string' ? option : (option.text || option.label || 'Unknown Option');
                                    const isSelected = state.localAnswers[currentQuestion.questionId] === optionText;

                                    return (
                                        <button
                                            key={oIdx}
                                            onClick={() => handleSelectOption(currentQuestion.questionId, optionText)}
                                            className={cn(
                                                "group flex items-start gap-4 border-2 transition-all duration-150 text-left relative active:scale-95",
                                                theme.spacing.answerOptionPadding,
                                                theme.spacing.answerMinHeight,
                                                theme.effects.answerRadius,
                                                isSelected
                                                    ? cn(
                                                        theme.colors.answerSelected,
                                                        `border-2 ${theme.colors.answerSelectedBorder}`,
                                                        theme.effects.selectedShadow
                                                    )
                                                    : cn(
                                                        theme.colors.answerUnselected,
                                                        `border-2 ${theme.colors.answerUnselectedBorder}`,
                                                        "hover:border-gray-400 hover:shadow-sm"
                                                    )
                                            )}
                                        >
                                            <div className={cn(
                                                "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                                isSelected ? "bg-pink-500 border-pink-500" : "border-gray-300 group-hover:border-gray-400"
                                            )}>
                                                {isSelected ? <CheckCircle2 size={14} className="text-white" /> : <Circle size={10} className="text-gray-400" />}
                                            </div>
                                            <div className="space-y-1">
                                                <span className={cn(
                                                    theme.typography.answerTextSize,
                                                    "font-medium block leading-relaxed",
                                                    isSelected ? theme.colors.answerSelectedText : theme.colors.answerUnselectedText
                                                )}>
                                                    {optionText}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer Controls */}
                        <div className="mt-16 pt-8 border-t border-gray-200 flex items-center justify-between">
                            <button
                                onClick={() => goToQuestion(state.currentIndex - 1)}
                                disabled={state.currentIndex === 0}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 border-2 text-sm font-bold disabled:opacity-30 transition-all duration-150 hover:shadow-sm",
                                    theme.colors.secondaryButton,
                                    theme.colors.secondaryButtonText,
                                    theme.effects.buttonRadius
                                )}
                            >
                                <ChevronLeft size={18} />
                                PREVIOUS
                            </button>

                            <div className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-gray-100 rounded-full border border-gray-200">
                                <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest px-2">Checkpoint</span>
                                {state.questions.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-1.5 h-1.5 rounded-full transition-all",
                                            i === state.currentIndex ? "bg-pink-500 w-4" : i < state.currentIndex ? "bg-gray-400" : "bg-gray-200"
                                        )}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    if (state.currentIndex === state.questions.length - 1) {
                                        setConfirmSubmit(true);
                                    } else {
                                        goToQuestion(state.currentIndex + 1);
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-2 px-8 py-3 text-sm font-black font-outfit transition-all duration-150 hover:scale-105 active:scale-95",
                                    theme.colors.primaryButton,
                                    theme.colors.primaryButtonText,
                                    theme.effects.buttonRadius,
                                    theme.effects.primaryButtonShadow
                                )}
                            >
                                {state.currentIndex === state.questions.length - 1 ? 'FINISH' : 'SAVE & NEXT'}
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* MODALS */}
            {confirmSubmit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                    <div className="glass-morphism rounded-[3rem] p-10 max-w-lg w-full text-center space-y-8 animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 rounded-full bg-[#FF2D55]/10 border border-[#FF2D55]/20 flex items-center justify-center mx-auto pink-glow">
                            <Info size={40} className="text-[#FF2D55]" />
                        </div>

                        <div>
                            <h2 className="text-3xl font-black font-outfit uppercase">Commit Evaluation?</h2>
                            <p className="text-gray-400 mt-4 leading-relaxed">
                                You have completed <span className="text-white font-bold">{Object.keys(state.localAnswers).length} out of {state.questions.length}</span> objectives.
                                Terminating the session now will finalize your scores.
                            </p>
                        </div>

                        {Object.keys(state.localAnswers).length < state.questions.length && (
                            <div className="bg-[#FF2D55]/5 border border-[#FF2D55]/20 p-4 rounded-2xl flex items-start gap-4 text-left">
                                <AlertCircle size={20} className="text-[#FF2D55] shrink-0 mt-0.5" />
                                <p className="text-xs text-[#FF2D55]/80 font-bold uppercase tracking-wide">
                                    Warning: Unanswered questions will be marked as incorrect.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setConfirmSubmit(false)}
                                className="px-8 py-4 rounded-2xl border border-white/10 font-bold hover:bg-white/5 transition-all text-sm uppercase tracking-widest"
                            >
                                Continue
                            </button>
                            <button
                                onClick={submitExam}
                                disabled={isSubmitting}
                                className="px-8 py-4 rounded-2xl bg-[#FF2D55] text-white font-black font-outfit shadow-lg pink-glow hover:scale-105 transition-all text-sm uppercase flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Terminate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
