import React from 'react';
import { FILE_PURPOSE_MAP } from '@/lib/governance-inventory';

interface DocExplainerProps {
    filePath: string;
}

export function DocExplainer({ filePath }: DocExplainerProps) {
    const purpose = FILE_PURPOSE_MAP[filePath] || 'This document defines a critical contract within the quiz platform architecture.';

    return (
        <div className="mb-16 animate-in fade-in slide-in-from-top-8 duration-1000">
            <div className="bg-[#FF4B91]/5 border-2 border-[#FF4B91]/20 rounded-[2.5rem] p-12 relative overflow-hidden group">
                {/* Decorative AI Sparkle */}
                <div className="absolute top-0 right-0 p-8">
                    <div className="w-12 h-12 rounded-full bg-white shadow-2xl flex items-center justify-center animate-bounce">
                        <div className="w-4 h-4 rounded-full bg-[#FF4B91] animate-pulse" />
                    </div>
                </div>

                <div className="max-w-3xl">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-4 py-1.5 bg-[#FF4B91] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg shadow-[#FF4B91]/20">
                            AI_ANALYSIS
                        </span>
                        <div className="h-[2px] w-12 bg-[#FF4B91]/20" />
                    </div>

                    <h3 className="text-4xl font-black text-[#1A1A1A] tracking-tighter uppercase mb-6 leading-tight italic">
                        Document <span className="text-[#FF4B91]">Purpose</span> & Contract_
                    </h3>

                    <p className="text-xl font-bold text-slate-600 leading-relaxed italic border-l-4 border-slate-200 pl-8">
                        "{purpose}"
                    </p>

                    <div className="mt-10 flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF4B91]" />
                            Authorized_Intel
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Verified_Contract
                        </div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-12">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] whitespace-nowrap">Raw_Source_Content</span>
                <div className="h-[1px] flex-1 bg-slate-100" />
            </div>
        </div>
    );
}
