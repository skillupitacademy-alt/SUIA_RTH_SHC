'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

// Detailed Question Status
type QuestionStatus = 'current' | 'answered' | 'flagged' | 'unvisited';

interface HUDState extends QuizState {
    currentIndex: number;
    flags: Record<string, boolean>;
    localAnswers: Record<string, string>;
}

export default function ActiveExamPage() {
    const router = useRouter();
    const { examId } = useParams<{ examId: string }>();
    const [state, setState] = useState<HUDState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [confirmSubmit, setConfirmSubmit] = useState(false);

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
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0A0A0A]">
            <Loader2 className="animate-spin text-[#FF2D55]" size={48} />
            <p className="text-[#FF2D55] font-black font-outfit uppercase tracking-tighter">Initializing Mission Control...</p>
        </div>
    );

    if (error) return (
        <div className="flex h-screen flex-col items-center justify-center gap-6 text-center bg-[#0A0A0A] p-6">
            <AlertCircle className="text-[#FF2D55]" size={64} />
            <div>
                <h1 className="text-3xl font-black text-white font-outfit uppercase">Connection Severed</h1>
                <p className="text-gray-400 mt-2 max-w-md">{error}</p>
            </div>
            <button
                onClick={() => router.push('/quiz/new')}
                className="px-8 py-3 bg-[#FF2D55] text-white font-bold rounded-xl shadow-lg hover:shadow-[#FF2D55]/20 transition-all"
            >
                Return to Command Center
            </button>
        </div>
    );

    if (!state || !currentQuestion) return null;

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-inter selection:bg-[#FF2D55]/30">
            {/* TOP NAVIGATION HUD */}
            <header className="sticky top-0 z-50 h-16 border-b border-white/5 bg-black/50 backdrop-blur-xl px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[#FF2D55] flex items-center justify-center font-black italic">!G</div>
                    <div className="h-4 w-[1px] bg-white/10 mx-2" />
                    <div>
                        <h2 className="text-xs font-black font-outfit uppercase tracking-widest text-gray-500">Active Campaign</h2>
                        <p className="text-sm font-bold truncate max-w-[200px]">{examId}</p>
                    </div>
                </div>

                <div className={cn(
                    "flex items-center gap-3 px-6 py-2 rounded-full border transition-all duration-500",
                    isNearEnd ? "border-[#FF2D55]/50 bg-[#FF2D55]/10 pink-glow animate-pulse" : "border-white/10 bg-white/5"
                )}>
                    <Timer size={18} className={isNearEnd ? "text-[#FF2D55]" : "text-gray-400"} />
                    <span className={cn(
                        "font-mono font-black text-lg tabular-nums",
                        isNearEnd ? "text-[#FF2D55] text-shadow-pink" : "text-white"
                    )}>
                        {formatTime(timeLeft || 0)}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setConfirmSubmit(true)}
                        className="px-6 py-2 bg-[#FF2D55] text-white text-sm font-black font-outfit rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#FF2D55]/20"
                    >
                        TERMINATE SESSION
                    </button>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
                {/* LEFT: TACTICAL SIDEBAR */}
                <aside className="lg:col-span-3 space-y-6 order-2 lg:order-1">
                    <div className="glass-morphism rounded-3xl p-6 bg-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-outfit font-black uppercase text-xs tracking-widest text-[#FF2D55]">Tactical Map</h3>
                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-gray-400">
                                {Object.keys(state.localAnswers).length}/{state.questions.length} COMPLETE
                            </span>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                            {state.questions.map((q, idx) => {
                                const isCurrent = idx === state.currentIndex;
                                const isAnswered = !!state.localAnswers[q.questionId];
                                const isFlagged = state.flags[q.questionId];

                                return (
                                    <button
                                        key={q.questionId}
                                        onClick={() => goToQuestion(idx)}
                                        className={cn(
                                            "aspect-square rounded-xl border flex items-center justify-center transition-all relative overflow-hidden group",
                                            isCurrent ? "bg-[#FF2D55] border-[#FF2D55] pink-glow" :
                                                isAnswered ? "bg-white/10 border-white/20 hover:border-[#FF2D55]/50" :
                                                    "bg-white/5 border-white/10 hover:border-white/30"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-xs font-black font-outfit",
                                            isCurrent ? "text-white" : isAnswered ? "text-white" : "text-gray-500 group-hover:text-white"
                                        )}>
                                            {(idx + 1).toString().padStart(2, '0')}
                                        </span>
                                        {isFlagged && (
                                            <div className="absolute top-1 right-1">
                                                <Flag size={8} fill="currentColor" className="text-[#FF2D55]" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 space-y-3 pt-6 border-t border-white/5">
                            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                <div className="w-2 h-2 rounded bg-[#FF2D55] pink-glow" /> Active Position
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                <div className="w-2 h-2 rounded bg-white/20" /> Answered
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                <Flag size={8} className="text-[#FF2D55]" fill="currentColor" /> Marked for Review
                            </div>
                        </div>
                    </div>

                    <div className="glass-morphism rounded-3xl p-6 bg-white/5 border-dashed border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                            <LayoutDashboard size={14} className="text-[#FF2D55]" />
                            <h3 className="font-bold text-sm tracking-tight">Mission Metrics</h3>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Completion</span>
                                <span>{Math.round((Object.keys(state.localAnswers).length / state.questions.length) * 100)}%</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#FF2D55] transition-all duration-1000"
                                    style={{ width: `${(Object.keys(state.localAnswers).length / state.questions.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* RIGHT: QUESTION ENGINE */}
                <div className="lg:col-span-9 space-y-6 order-1 lg:order-2">
                    <div className="glass-morphism rounded-[2.5rem] p-4 lg:p-10 min-h-[600px] flex flex-col">
                        {/* Header Area */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-10 pb-8 border-b border-white/5">
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
                                    "flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all font-bold text-sm",
                                    state.flags[currentQuestion.questionId]
                                        ? "bg-[#FF2D55]/10 border-[#FF2D55] text-[#FF2D55]"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                )}
                            >
                                <Flag size={16} fill={state.flags[currentQuestion.questionId] ? 'currentColor' : 'none'} />
                                <span>{state.flags[currentQuestion.questionId] ? 'Review Flag Set' : 'Flag for Review'}</span>
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-grow space-y-10">
                            {currentQuestion.codeSnippet && (
                                <div className="rounded-3xl border border-white/10 bg-black/40 p-6 font-mono text-sm leading-relaxed relative group">
                                    <div className="absolute top-0 right-8 px-4 py-1.5 bg-white/5 rounded-b-xl border-x border-b border-white/10 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        Source Fragment
                                    </div>
                                    <pre className="overflow-x-auto pt-4 text-pink-50/90 whitespace-pre-wrap">
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
                                                "group flex items-start gap-4 p-6 rounded-3xl border transition-all text-left relative",
                                                isSelected
                                                    ? "bg-[#FF2D55]/10 border-[#FF2D55] pink-glow ring-1 ring-[#FF2D55]"
                                                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30"
                                            )}
                                        >
                                            <div className={cn(
                                                "mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center transition-all shrink-0",
                                                isSelected ? "bg-[#FF2D55] border-[#FF2D55]" : "border-white/20 group-hover:border-white/50"
                                            )}>
                                                {isSelected ? <CheckCircle2 size={12} className="text-white" /> : <Circle size={10} className="text-white/20" />}
                                            </div>
                                            <div className="space-y-1">
                                                <span className={cn(
                                                    "text-sm font-bold block leading-relaxed",
                                                    isSelected ? "text-white" : "text-gray-400 group-hover:text-white"
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
                        <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between">
                            <button
                                onClick={() => goToQuestion(state.currentIndex - 1)}
                                disabled={state.currentIndex === 0}
                                className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold disabled:opacity-30 transition-all hover:bg-white/10"
                            >
                                <ChevronLeft size={18} />
                                PREVIOUS
                            </button>

                            <div className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                                <span className="text-[10px] font-black text-[#FF2D55] uppercase tracking-widest px-2">Checkpoint</span>
                                {state.questions.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-1.5 h-1.5 rounded-full transition-all",
                                            i === state.currentIndex ? "bg-[#FF2D55] w-4" : i < state.currentIndex ? "bg-white/20" : "bg-white/5"
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
                                className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white text-black text-sm font-black font-outfit shadow-xl hover:scale-105 active:scale-95 transition-all"
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
