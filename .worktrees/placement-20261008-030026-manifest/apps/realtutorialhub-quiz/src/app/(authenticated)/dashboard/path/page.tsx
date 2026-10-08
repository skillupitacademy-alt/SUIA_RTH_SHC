'use client';

import { TrendingUp, Clock } from "lucide-react";

export default function LearningPathPage() {
    return (
        <div className="space-y-12">
            <div className="flex flex-col gap-3">
                <div className="h-14 w-14 rounded-2xl bg-indigo-100/50 flex items-center justify-center text-indigo-600">
                    <TrendingUp size={32} />
                </div>
                <h2 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.4em]">Curriculum Orchestrator</h2>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Learning Path</h1>
                <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest mt-1 max-w-2xl leading-relaxed">
                    Unlock personalized learning paths based on your assessment performance.
                    Our AI is currently mapping your skills to curate the perfect curriculum for you.
                </p>
            </div>

            <div className="p-12 border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/10 flex flex-col items-center justify-center text-center gap-6 py-24">
                <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-3xl bg-white shadow-sm border border-slate-100">
                        <Clock size={32} className="text-slate-300 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight mt-2">Neural Mapping...</h3>
                </div>
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 max-w-xs leading-relaxed">
                    We&apos;re putting the finishing touches on your adaptive learning journey. Architecture synchronization in progress.
                </p>
            </div>
        </div>
    );
}
