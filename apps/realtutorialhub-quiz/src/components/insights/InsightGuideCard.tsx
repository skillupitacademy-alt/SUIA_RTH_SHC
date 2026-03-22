'use client';

import { TutorInsight } from "@quiz/api-client";
import { Lightbulb } from "lucide-react";

import { cn } from "@/lib/utils";

export interface InsightGuideCardProps {
    title?: string;
    measures?: string;
    matters?: string;
    howToRead?: string;
    signals?: { type: 'good' | 'neutral' | 'risk'; text: string }[];
    nextSteps?: string[];
    confidence?: 'low' | 'medium' | 'high';
    sampleSize?: number;
    lastUpdated?: string;
    expectedOutcome?: string;
    insight?: TutorInsight;
}

export function InsightGuideCard(props: InsightGuideCardProps) {
    const title = props.insight?.title || props.title;
    const measures = props.insight?.measures || props.measures;
    const matters = props.insight?.matters || props.matters;
    const howToRead = props.insight?.howToRead || props.howToRead;
    const signals = props.insight?.signals || props.signals || [];
    const nextSteps = props.insight?.nextSteps || props.nextSteps || [];
    const confidence = props.insight?.confidence || props.confidence;
    const sampleSize = props.insight?.sampleSize || props.sampleSize;
    const lastUpdated = props.lastUpdated;
    const expectedOutcome = props.insight?.expectedOutcome || props.expectedOutcome;

    const confidenceColors = {
        low: "bg-rose-100 text-rose-600 border-rose-200",
        medium: "bg-amber-100 text-amber-600 border-amber-200",
        high: "bg-emerald-100 text-emerald-600 border-emerald-200"
    };

    return (
        <div className="mt-6 bg-white rounded-[2rem] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
            <div className="p-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-pink-50 text-pink-500">
                            <Lightbulb size={20} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Tutor Insight: {title}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {confidence && (
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors",
                                confidenceColors[confidence]
                            )}>
                                Confidence: {confidence}
                            </span>
                        )}
                        {sampleSize && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Based on {sampleSize} attempts
                            </span>
                        )}
                        {lastUpdated && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Updated {lastUpdated}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6 text-left">
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

                    <div className="space-y-6 text-left">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Key Signals</p>
                            <div className="space-y-3">
                                {signals.length > 0 ? signals.map((signal, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white transition-colors">
                                        {signal.type === 'good' && <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />}
                                        {signal.type === 'neutral' && <div className="h-2 w-2 rounded-full bg-orange-500 mt-1.5 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />}
                                        {signal.type === 'risk' && <div className="h-2 w-2 rounded-full bg-rose-500 mt-1.5 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />}
                                        <p className="text-[11px] font-bold text-slate-600 leading-tight">{signal.text}</p>
                                    </div>
                                )) : (
                                    <p className="text-[11px] font-bold text-slate-400 italic">No significant signals detected yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">What to do next</p>
                            <div className="space-y-2">
                                {nextSteps.length > 0 ? nextSteps.map((step, i) => (
                                    <div key={i} className="flex items-center gap-3 group">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-[10px] font-black transition-all group-hover:scale-110">
                                            {i + 1}
                                        </span>
                                        <p className="text-[11px] font-bold text-slate-700">{step}</p>
                                    </div>
                                )) : (
                                    <p className="text-[11px] font-bold text-slate-400 italic">Continue with your current study plan.</p>
                                )}
                            </div>
                            {expectedOutcome && (
                                <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Expected Outcome</p>
                                    <p className="text-[11px] font-bold text-emerald-700 italic">Projected: {expectedOutcome}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
