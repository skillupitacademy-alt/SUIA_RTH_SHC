'use client';

import { GitBranch } from 'lucide-react';

import { BlueprintAuditBoard } from '@/components/dashboard/BlueprintAuditBoard';
import { PageTitle } from '@/components/layout/PageTitle';

export default function BlueprintAuditPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6 border-b border-slate-200/70 pb-8 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-3">
                        <GitBranch size={20} className="text-[#FF4B91]" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF4B91]">Structural Audit</span>
                    </div>
                    <PageTitle text="Blueprint Integrity" />
                    <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-500">Assessment Compliance & Distribution</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">Verified blueprint</div>
            </div>

            <div className="p-2">
                <BlueprintAuditBoard />
            </div>
        </div>
    );
}
