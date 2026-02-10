'use client';

import { CheckCircle2, XCircle, Clock, Trophy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultSummaryProps {
    score: number;
    total: number;
    timeTaken: string;
    percentile: number;
    status: 'passed' | 'failed';
}

export function ResultSummary({ score, total, timeTaken, percentile, status }: ResultSummaryProps) {
    const percentage = Math.round((score / total) * 100);

    return (
        <div className="space-y-8">
            {/* Hero Result Card */}
            <div className={cn(
                "relative overflow-hidden p-8 md:p-12 rounded-[3rem] border-2 transition-all",
                status === 'passed'
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-primary/50 bg-primary/5"
            )}>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left space-y-4">
                        <div className={cn(
                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest",
                            status === 'passed' ? "bg-green-100 text-green-700" : "bg-primary/20 text-primary"
                        )}>
                            {status === 'passed' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            Assessment {status}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900">
                            You scored <span className="text-primary">{percentage}%</span>
                        </h1>
                        <p className="text-lg text-slate-700 font-medium max-w-md leading-relaxed">
                            {status === 'passed'
                                ? "Excellent work! You've demonstrated strong mastery of the selected domains."
                                : "A good effort, but there's room for improvement in some key areas."}
                        </p>
                    </div>

                    <div className="relative h-48 w-48 flex items-center justify-center shrink-0">
                        <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 192 192">
                            <circle
                                cx="96" cy="96" r="84"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="12"
                                className="text-muted/10"
                            />
                            <circle
                                cx="96" cy="96" r="84"
                                fill="transparent"
                                stroke="currentColor"
                                strokeWidth="12"
                                strokeDasharray={527.79} // 2 * pi * 84
                                strokeDashoffset={527.79 * (1 - percentage / 100)}
                                strokeLinecap="round"
                                className="text-primary transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-slate-900">{score}/{total}</span>
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Correct</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl border-2 border-slate-200 bg-background flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Time Taken</p>
                        <p className="text-xl font-black">{timeTaken}</p>
                    </div>
                </div>
                <div className="p-6 rounded-3xl border-2 border-slate-200 bg-background flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Percentile</p>
                        <p className="text-xl font-black">{percentile}th</p>
                    </div>
                </div>
                <div className="p-6 rounded-3xl border-2 border-slate-200 bg-background flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Accuracy</p>
                        <p className="text-xl font-black">{percentage}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
