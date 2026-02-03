'use client';

import React from 'react';
import { FactoryLayout } from '@/components/layout/FactoryLayout';
import { FactoryProvider, useFactory } from '@/context/FactoryContext';
import { ChevronLeft, Info } from 'lucide-react';
import Link from 'next/link';

export default function QuestionReviewPage() {
    return (
        <QuestionReviewContent />
    );
}

function QuestionReviewContent() {
    const { stagedQuestions } = useFactory();

    return (
        <FactoryLayout
            title="Review Console"
            subtitle="Stage Management & Verification"
            backPath="/factory/question-generator"
        >
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
                <div className="max-w-[1400px] mx-auto p-8 space-y-8 pb-32">

                    {/* Breadcrumbs / Header Info */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/factory/question-generator"
                            className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-[#FF4B91] transition-colors tracking-widest"
                        >
                            <ChevronLeft size={14} /> Back to Blueprint
                        </Link>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest shadow-sm">
                            <Info size={14} className="text-[#FF4B91]" /> {stagedQuestions.length} Questions Staged
                        </div>
                    </div>

                    {stagedQuestions.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] p-24 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-300 flex items-center justify-center mb-6 font-black italic">
                                EMPTY
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1A1A]">No Questions Staged</h3>
                            <p className="text-xs text-slate-400 max-w-sm mt-3 font-medium italic">
                                Go back and ingest a JSON payload to populate this console.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                            {/* Phase 3 Cards will go here */}
                            <div className="bg-white rounded-[2.5rem] p-12 border border-slate-200 shadow-xl flex flex-col items-center justify-center text-center">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1A1A]">Phase 3: Interactive Review</h3>
                                <p className="text-xs text-slate-400 max-w-sm mt-3 font-medium italic">
                                    Displaying your {stagedQuestions.length} questions in vertical stack soon.
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </FactoryLayout>
    );
}
