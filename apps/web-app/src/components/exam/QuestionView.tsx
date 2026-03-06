/* eslint-disable @typescript-eslint/no-explicit-any */
import { Flag, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionViewProps {
    question: any;
    currentIndex: number;
    answer: string | undefined;
    isFlagged: boolean;
    onSelectOption: (questionId: string, optionText: string) => void;
    onToggleFlag: (questionId: string) => void;
    theme: any;
}

export function QuestionView({
    question,
    currentIndex,
    answer,
    isFlagged,
    onSelectOption,
    onToggleFlag,
    theme
}: QuestionViewProps) {
    return (
        <div className={cn(
            "border flex flex-col flex-1 h-full overflow-hidden",
            theme.colors.questionCard,
            theme.colors.questionCardBorder,
            theme.spacing.questionCardPadding,
            theme.effects.questionCardRadius
        )}>
            {/* Header Area */}
            <div className="shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
                <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-[#FF2D55]/10 border border-[#FF2D55]/20 text-[#FF2D55] text-[10px] font-black uppercase tracking-tighter mb-3">
                        Strategic Analysis :: SEC-{(currentIndex + 1).toString().padStart(3, '0')}
                    </span>
                    <h1 className="text-2xl lg:text-3xl font-bold font-outfit leading-tight lg:max-w-3xl">
                        {question.text}
                    </h1>
                </div>
                <button
                    onClick={() => onToggleFlag(question.questionId)}
                    className={cn(
                        "flex items-center gap-2 px-5 py-3 border-2 transition-all font-bold text-sm",
                        theme.effects.buttonRadius,
                        isFlagged
                            ? "bg-pink-50 border-pink-500 text-pink-600"
                            : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    )}
                >
                    <Flag size={16} fill={isFlagged ? 'currentColor' : 'none'} />
                    <span>{isFlagged ? 'Review Flag Set' : 'Flag for Review'}</span>
                </button>
            </div>

            {/* Content Area - SCROLLABLE */}
            <div className="flex-1 overflow-y-auto px-1 min-h-0 space-y-10 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {question.codeSnippet && (
                    <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6 font-mono text-sm leading-relaxed relative group">
                        <div className="absolute top-0 right-8 px-4 py-1.5 bg-gray-100 rounded-b-xl border-x-2 border-b-2 border-gray-200 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                            Source Fragment
                        </div>
                        <pre className="overflow-x-auto pt-4 text-gray-800 whitespace-pre-wrap">
                            <code>{question.codeSnippet}</code>
                        </pre>
                    </div>
                )}

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                    {question.options.map((option: any, oIdx: number) => {
                        const optionText = typeof option === 'string' ? option : (option.text || option.label || 'Unknown Option');
                        const isSelected = answer === optionText;

                        return (
                            <button
                                key={oIdx}
                                onClick={() => onSelectOption(question.questionId, optionText)}
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
        </div>
    );
}
