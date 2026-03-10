import { Flag, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

type TacticalQuestion = { questionId: string };
type ThemeConfig = {
    colors: {
        questionCard: string;
        questionCardBorder: string;
        tacticalChipCurrent: string;
        tacticalChipFlagged: string;
        tacticalChipAnswered: string;
        tacticalChipUnvisited: string;
    };
    spacing: { tacticalChipSize: string };
    effects: { chipRadius: string };
};

interface TacticalMapProps {
    questions: TacticalQuestion[];
    currentIndex: number;
    answers: Record<string, string>;
    flags: Record<string, boolean>;
    onGoToQuestion: (index: number) => void;
    theme: ThemeConfig;
}

export function TacticalMap({
    questions,
    currentIndex,
    answers,
    flags,
    onGoToQuestion,
    theme
}: TacticalMapProps) {
    const answeredCount = Object.keys(answers).length;
    const totalCount = questions.length;
    const completionPercentage = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

    return (
        <aside className="lg:col-span-3 space-y-6 order-2 lg:order-1 overflow-y-auto pr-2 scrollbar-hide h-full">
            <div className={cn(
                "rounded-3xl p-6 border",
                theme.colors.questionCard,
                theme.colors.questionCardBorder
            )}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-outfit font-black uppercase text-xs tracking-widest text-pink-500">Tactical Map</h3>
                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-600">
                        {answeredCount}/{totalCount} COMPLETE
                    </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, idx) => {
                        const isCurrent = idx === currentIndex;
                        const isAnswered = !!answers[q.questionId];
                        const isFlagged = flags[q.questionId];

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
                                onClick={() => onGoToQuestion(idx)}
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
                        <span>{completionPercentage}%</span>
                    </div>
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-pink-500 transition-all duration-1000"
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </aside>
    );
}
