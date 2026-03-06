/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HUDControlsProps {
    currentIndex: number;
    totalQuestions: number;
    onGoToQuestion: (index: number) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    theme: any;
}

export function HUDControls({
    currentIndex,
    totalQuestions,
    onGoToQuestion,
    onSubmit,
    isSubmitting,
    theme
}: HUDControlsProps) {
    const isLastQuestion = currentIndex === totalQuestions - 1;

    return (
        <div className="shrink-0 pt-6 mt-4 border-t border-gray-200 flex items-center justify-between bg-white z-10">
            <button
                onClick={() => onGoToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
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

            {/* Checkpoint Indicators (Desktop Only) */}
            <div className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-gray-100 rounded-full border border-gray-200">
                <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest px-2">Checkpoint</span>
                {Array.from({ length: totalQuestions }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all",
                            i === currentIndex ? "bg-pink-500 w-4" : i < currentIndex ? "bg-gray-400" : "bg-gray-200"
                        )}
                    />
                ))}
            </div>

            <button
                onClick={() => {
                    if (isLastQuestion) {
                        onSubmit();
                    } else {
                        onGoToQuestion(currentIndex + 1);
                    }
                }}
                disabled={isSubmitting}
                className={cn(
                    "flex items-center gap-2 px-8 py-3 text-sm font-black font-outfit transition-all duration-150 hover:scale-105 active:scale-95",
                    theme.colors.primaryButton,
                    theme.colors.primaryButtonText,
                    theme.effects.buttonRadius,
                    theme.effects.primaryButtonShadow
                )}
            >
                {isSubmitting ? 'PROCESSING...' : (isLastQuestion ? 'FINISH' : 'SAVE & NEXT')}
                <ChevronRight size={18} />
            </button>
        </div>
    );
}
