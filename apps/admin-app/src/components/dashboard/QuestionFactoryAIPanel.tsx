'use client';

import React from 'react';
import { BrainCircuit, Sparkles, ArrowRight, Wand2 } from 'lucide-react';
import Link from 'next/link';

export function QuestionFactoryAIPanel() {
    return (
        <div className="group relative overflow-hidden bg-white border-2 border-primary/5 rounded-[2.5rem] p-8 shadow-xl shadow-muted/5 transition-all hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-primary">
                <BrainCircuit size={120} />
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-4 max-w-xl">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-lg shadow-indigo-500/10">
                            <Wand2 size={22} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-500">AI Intelligence_</span>
                    </div>

                    <div>
                        <h2 className="text-3xl font-black tracking-tighter italic uppercase text-[#1A1A1A] mb-2">Question Factory</h2>
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                            Transform documentation and source code into high-fidelity exam batches using the Context-Aware AI Engine.
                            Define your blueprint and generate strict-schema content in seconds.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#FF4B91]">
                        <span className="flex items-center gap-1.5"><Sparkles size={12} /> Context Aware</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="flex items-center gap-1.5"><Sparkles size={12} /> Strict Schema</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="flex items-center gap-1.5"><Sparkles size={12} /> Prompt Engineering</span>
                    </div>
                </div>

                <Link
                    href="/factory/question-generator"
                    className="flex items-center gap-3 px-8 py-4 bg-[#1A1A1A] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#FF4B91] transition-all shadow-xl shadow-black/10 hover:shadow-[#FF4B91]/20 group/btn"
                >
                    Launch Factory
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
