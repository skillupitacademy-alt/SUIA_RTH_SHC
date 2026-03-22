'use client';

import { Lightbulb } from "lucide-react";

import { cn } from "@/lib/utils";

export interface InsightGuideCardProps {
    title: string;
    measures: string;
    matters: string;
    howToRead: string;
    signals: { type: 'good' | 'neutral' | 'risk'; text: string }[];
    nextSteps: string[];
    confidence?: 'low' | 'medium' | 'high';
    sampleSize?: number;
    lastUpdated?: string;
    owner?: string;
}

export function InsightGuideCard({
    title,
    measures,
    matters,
    howToRead,
    signals,
    nextSteps,
    confidence,
    sampleSize,
    lastUpdated,
    owner
}: InsightGuideCardProps) {
    const confidenceColors = {
        low: "bg-rose-100 text-rose-600 border-rose-200",
        medium: "bg-amber-100 text-amber-600 border-amber-200",
        high: "bg-emerald-100 text-emerald-600 border-emerald-200"
    };

    return (
        <div className="mt-8 bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            <div className="p-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-500">
                            <Lightbulb size={20} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">System Intel: {title}</h3>
                        {typeof owner === "string" && owner.length > 0 && (
                            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                Owner: {owner}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {typeof confidence === "string" && (
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                confidenceColors[confidence]
                            )}>
                                Confidence: {confidence}
                            </span>
                        )}
                        {typeof sampleSize === "number" && sampleSize > 0 && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Based on {sampleSize} attempts
                            </span>
                        )}
                        {typeof lastUpdated === "string" && lastUpdated.length > 0 && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Updated {lastUpdated}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">What this measures</p>
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">{measures}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Why it matters</p>
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">{matters}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">How to read</p>
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">{howToRead}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Key Signals</p>
                            <div className="space-y-3">
                                {signals.map((signal, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        {signal.type === 'good' && <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                        {signal.type === 'neutral' && <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                                        {signal.type === 'risk' && <div className="h-2 w-2 rounded-full bg-rose-500 mt-1.5 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />}
                                        <p className="text-[11px] font-bold text-slate-600 leading-tight">{signal.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Platform Recommendations</p>
                            <div className="space-y-2">
                                {nextSteps.map((step, i) => (
                                    <div key={i} className="flex items-center gap-3 group">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black transition-all group-hover:scale-110">
                                            {i + 1}
                                        </span>
                                        <p className="text-[11px] font-bold text-slate-700">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
