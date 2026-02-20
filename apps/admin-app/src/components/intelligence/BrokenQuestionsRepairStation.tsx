'use client';

import { ZLoader } from "@quiz/ui";
import {
    AlertTriangle,
    ArrowUpRight,
    Check,
    Clock,
    ExternalLink,
    Wrench,
    Zap
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface BrokenQuestion {
    questionId: string;
    stemPreview: string;
    accuracy: number;
    discrimination: number;
    attempts: number;
    brokenScore: number;
    timeNote?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    lastEditedAt?: string;
    flags: {
        hard: boolean;
        discrim: boolean;
        time: boolean;
        skip: boolean;
    };
}

export function BrokenQuestionsRepairStation() {
    const [questions, setQuestions] = useState<BrokenQuestion[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
            const res = await fetch(`${apiBase}/api/admin/metrics/broken-questions?limit=10&floor=10`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setQuestions(data);
            }
        } catch (err) {
            console.error('Failed to fetch broken questions', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center bg-white rounded-[2.5rem] border border-slate-200">
                <ZLoader size="md" text="Scanning content health..." />
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="p-12 text-center bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="p-4 rounded-full bg-emerald-50 text-emerald-500 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Check size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">System Normalized</h3>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">No broken items detected in the last window.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 group hover:-translate-y-1 transition-all duration-300">
            <div className="p-10 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/20">
                            <Wrench size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Critical Action Required</p>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Content Repair Station</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-4 py-2 rounded-full bg-white border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Scanning: Last 30 Days
                        </span>
                        <button
                            onClick={() => { void fetchData(); }}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-white transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <Zap size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/30 uppercase text-[10px] font-black text-slate-400 tracking-widest border-b border-slate-100">
                            <th className="px-8 py-5">Severity</th>
                            <th className="px-8 py-5">Question Content</th>
                            <th className="px-8 py-5">Difficulty</th>
                            <th className="px-8 py-5">Performance</th>
                            <th className="px-8 py-5">Audit Signals</th>
                            <th className="px-8 py-5 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {questions.map((q) => {
                            const stemText = typeof q.stemPreview === "string" ? q.stemPreview : "";
                            const accuracyPct = typeof q.accuracy === "number" ? (q.accuracy * 100).toFixed(0) : "—";
                            const discriminationVal = typeof q.discrimination === "number" ? q.discrimination.toFixed(2) : "—";
                            const accuracyClass = typeof q.accuracy === "number" && q.accuracy < 0.3 ? "text-rose-500" : "text-slate-700";
                            const discrimClass = typeof q.discrimination === "number" && q.discrimination < 0.1 ? "text-rose-500" : "text-emerald-500";
                            const hasTimeNote = typeof q.timeNote === "string" && q.timeNote.length > 0;
                            const flags = q.flags ?? { hard: false, discrim: false, time: false, skip: false };
                            const difficultyClass =
                                q.difficulty === "hard"
                                    ? "bg-rose-50 text-rose-600 border-rose-100"
                                    : q.difficulty === "medium"
                                        ? "bg-blue-50 text-blue-600 border-blue-100"
                                        : "bg-emerald-50 text-emerald-600 border-emerald-100";
                            const severityClass =
                                q.brokenScore > 0.7
                                    ? "bg-rose-50 text-rose-600 border-rose-100"
                                    : "bg-amber-50 text-amber-600 border-amber-100";

                            return (
                                <tr key={q.questionId} className="group/row hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black transition-all group-hover/row:scale-110 shadow-sm border",
                                            severityClass
                                        )}>
                                            <span className="text-[8px] leading-none uppercase">Score</span>
                                            <span className="text-lg leading-tight">{(q.brokenScore * 100).toFixed(0)}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 max-w-md">
                                        <p className="text-sm font-bold text-slate-700 leading-relaxed truncate group-hover/row:text-slate-900 transition-colors">
                                            {stemText}...
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {q.questionId.slice(0, 8)}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                            difficultyClass
                                        )}>
                                            {q.difficulty}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-[10px] font-bold">
                                                <span className="text-slate-400 uppercase">Acc:</span>
                                                <span className={cn(accuracyClass)}>
                                                    {accuracyPct}%
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] font-bold">
                                                <span className="text-slate-400 uppercase">Disc:</span>
                                                <span className={cn(discrimClass)}>
                                                    {discriminationVal}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] font-bold border-t border-slate-50 pt-1">
                                                <span className="text-slate-300 uppercase italic">n={q.attempts}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-wrap gap-2">
                                            {flags.hard ? <span className="p-1.5 rounded-lg bg-rose-50 text-rose-500 border border-rose-100" title="Low Accuracy"><AlertTriangle size={14} /></span> : null}
                                            {flags.discrim ? <span className="p-1.5 rounded-lg bg-rose-100 text-rose-600 border border-rose-200" title="Low Discrimination"><ArrowUpRight size={14} className="rotate-90" /></span> : null}
                                            {flags.time ? <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 group/tip relative">
                                                <Clock size={14} />
                                                <span className="text-[9px] font-black uppercase">Anomaly</span>
                                            </div> : null}
                                            {hasTimeNote ? <p className="text-[8px] font-bold text-slate-400 max-w-[120px] leading-tight italic">{q.timeNote}</p> : null}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <Link
                                            href={`/questions/${q.questionId}/edit`}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10 hover:shadow-blue-500/20 active:scale-95 group-hover/row:translate-x-[-4px]"
                                        >
                                            Fix
                                            <ExternalLink size={14} />
                                        </Link>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Showing top 10 high-severity items requiring human review.
                </p>
            </div>
        </div>
    );
}
