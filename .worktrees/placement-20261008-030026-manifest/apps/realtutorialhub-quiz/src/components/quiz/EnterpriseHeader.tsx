'use client';

import { Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type EnterpriseQuestion = { id: string };

interface EnterpriseHeaderProps {
    error: string | null;
    setError: (error: string | null) => void;
    questions: EnterpriseQuestion[];
    currentQuestionIndex: number;
    answers: Record<string, number>;
    markedForReview: string[];
    timeLeft: number;
    formatTime: (seconds: number) => string;
    onSetCurrentIndex: (index: number) => void;
    onFinish: () => void;
    isSubmitting: boolean;
}

export function EnterpriseHeader({
    error,
    setError,
    questions,
    currentQuestionIndex,
    answers,
    markedForReview,
    timeLeft,
    formatTime,
    onSetCurrentIndex,
    onFinish,
    isSubmitting
}: EnterpriseHeaderProps) {
    return (
        <header className="shrink-0 z-40 bg-background border-b px-6 py-4 flex items-center justify-between shadow-sm">
            {error && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-2 hover:bg-white/20 rounded-full p-1" aria-label="Dismiss error message">
                        <ChevronRight size={14} className="rotate-90" />
                    </button>
                </div>
            )}
            <div className="flex items-center gap-6">
                <div>
                    <h2 className="text-xl font-black tracking-tight uppercase text-primary">Enterprise Exam</h2>
                    <p className="text-xs font-bold text-muted-foreground">Domain: Technical Assessment</p>
                </div>
                <div className="hidden md:flex gap-1.5">
                    {questions.map((q, i) => (
                        <button
                            key={q.id}
                            onClick={() => onSetCurrentIndex(i)}
                            className={cn(
                                "h-8 w-8 rounded-lg text-xs font-bold transition-all border-2",
                                currentQuestionIndex === i ? "border-primary bg-primary/5 text-primary" :
                                    answers[q.id] !== undefined ? "border-green-500 bg-green-500/10 text-green-600" :
                                        markedForReview.includes(q.id) ? "border-orange-500 bg-orange-500/10 text-orange-600" :
                                            "border-muted bg-background text-muted-foreground"
                            )}
                            aria-label={`Go to question ${i + 1}${answers[q.id] !== undefined ? ' (answered)' : markedForReview.includes(q.id) ? ' (marked for review)' : ''}`}
                            aria-current={currentQuestionIndex === i ? "true" : undefined}
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
                    onClick={onFinish}
                    disabled={isSubmitting}
                    className="hidden sm:flex items-center gap-2 px-6 py-2 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95 disabled:opacity-50"
                    aria-label="Submit exam"
                >
                    {isSubmitting ? "Submitting..." : "Submit Exam"}
                </button>
            </div>
        </header>
    );
}
