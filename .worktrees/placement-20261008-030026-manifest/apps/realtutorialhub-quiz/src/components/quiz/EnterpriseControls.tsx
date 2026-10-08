'use client';

import { ChevronLeft, Flag, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnterpriseControlsProps {
    currentQuestionIndex: number;
    totalQuestions: number;
    questionId: string;
    isMarkedForReview: boolean;
    onSetCurrentIndex: (index: number) => void;
    onToggleReview: (id: string) => void;
    onFinish: () => void;
    isSubmitting: boolean;
}

export function EnterpriseControls({
    currentQuestionIndex,
    totalQuestions,
    questionId,
    isMarkedForReview,
    onSetCurrentIndex,
    onToggleReview,
    onFinish,
    isSubmitting
}: EnterpriseControlsProps) {
    return (
        <div className="shrink-0 p-6 md:p-8 border-t flex items-center justify-between gap-4 bg-background">
            <div className="flex items-center gap-3">
                <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => onSetCurrentIndex(currentQuestionIndex - 1)}
                    className="p-4 rounded-2xl border-2 font-bold hover:bg-muted transition-all disabled:opacity-30"
                    aria-label="Previous question"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={() => onToggleReview(questionId)}
                    className={cn(
                        "flex items-center gap-2 px-6 py-4 rounded-2xl border-2 font-bold transition-all",
                        isMarkedForReview ? "bg-orange-500 border-orange-500 text-white" : "hover:bg-muted"
                    )}
                    aria-label={isMarkedForReview ? "Unmark question for review" : "Mark question for review"}
                    aria-pressed={isMarkedForReview}
                >
                    <Flag size={20} className={isMarkedForReview ? "fill-current" : ""} />
                    <span className="hidden sm:inline">Review later</span>
                </button>
            </div>

            <div className="flex items-center gap-3">
                {currentQuestionIndex < totalQuestions - 1 ? (
                    <button
                        onClick={() => onSetCurrentIndex(currentQuestionIndex + 1)}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-secondary text-primary-foreground font-black shadow-lg hover:bg-secondary/90 transition-all active:scale-95 group"
                        aria-label="Next question"
                    >
                        Next Question
                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                ) : (
                    <button
                        onClick={onFinish}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-green-600 text-white font-black shadow-lg hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
                        aria-label="Finish attempt"
                    >
                        {isSubmitting ? "Submitting..." : "Finish Attempt"}
                        <CheckCircle2 size={20} />
                    </button>
                )}
            </div>
        </div>
    );
}
