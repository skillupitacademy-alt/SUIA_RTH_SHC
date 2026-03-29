'use client';

import { Cpu } from 'lucide-react';

import { QuestionFactoryAIPanel } from '@/components/dashboard/QuestionFactoryAIPanel';
import { PageTitle } from '@/components/layout/PageTitle';

export default function QuestionFactoryAuditPage() {
    return (
        <div className="space-y-6">
            <div className="pb-8 border-b border-slate-200/70 mb-8 pt-8 px-8">
                <div className="flex items-center gap-3 mb-2">
                    <Cpu size={20} className="text-[#FF4B91]" />
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF4B91]">Bank Intelligence</span>
                </div>
                <PageTitle text="Question Bank" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">
                    AI Content Analytics • Metadata Health • Pool Statistics
                </p>
            </div>

            <div className="p-2">
                <QuestionFactoryAIPanel />
            </div>
        </div>
    );
}
