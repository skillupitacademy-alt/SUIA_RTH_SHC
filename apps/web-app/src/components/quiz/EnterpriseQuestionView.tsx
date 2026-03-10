'use client';

import { Code, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type EnterpriseQuestion = {
    id: string;
    text: string;
    difficulty: string;
    type?: string;
    code?: string | null;
    options: string[];
};

interface EnterpriseQuestionViewProps {
    question: EnterpriseQuestion;
    currentQuestionIndex: number;
    totalQuestions: number;
    answerIndex: number | undefined;
    onAnswer: (index: number) => void;
}

export function EnterpriseQuestionView({
    question,
    currentQuestionIndex,
    totalQuestions,
    answerIndex,
    onAnswer
}: EnterpriseQuestionViewProps) {
    return (
        <>
            <div className="shrink-0 flex items-center justify-between p-6 md:p-8 border-b">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold bg-muted px-4 py-1.5 rounded-full text-muted-foreground">
                        Question {currentQuestionIndex + 1} of {totalQuestions}
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

            <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
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
                    {question.options.map((option: string, i: number) => (
                        <button
                            key={i}
                            onClick={() => onAnswer(i)}
                            className={cn(
                                "flex items-center justify-between w-full p-6 rounded-2xl border-2 transition-all text-left group",
                                answerIndex === i
                                    ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                                    : "border-muted bg-muted/5 hover:border-primary/20 hover:bg-white"
                            )}
                            aria-label={`Select option ${String.fromCharCode(65 + i)}: ${option}`}
                            aria-pressed={answerIndex === i}
                        >
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl border-2 flex items-center justify-center font-bold transition-all",
                                    answerIndex === i ? "bg-primary border-primary text-white" : "border-muted-foreground/20 group-hover:border-primary/50"
                                )}>
                                    {String.fromCharCode(65 + i)}
                                </div>
                                <span className="font-semibold text-lg">{option}</span>
                            </div>
                            {answerIndex === i && (
                                <CheckCircle2 className="text-primary shrink-0" size={24} />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
