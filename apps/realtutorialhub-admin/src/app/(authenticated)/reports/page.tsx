'use client';

import { PageTitle } from '@quiz/ui';
import { FileText, Terminal } from 'lucide-react';
import React from 'react';

import { AdminReportPipelineCard } from '@/components/dashboard/AdminReportPipelineCard';
import { HierarchyReports } from '@/components/reports/HierarchyReports';

export default function ReportsPage() {
    return (
        <div className="space-y-10 pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b-2 border-primary/5">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                            <Terminal size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                            Report Operations
                        </span>
                    </div>
                    <PageTitle text="Report Pipeline" />
                    <p className="mt-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        PDF generation health, metrics, and admin controls
                    </p>
                </div>
            </div>

            {/* Pipeline Management Card */}
            <div className="p-8 rounded-[2.5rem] bg-white border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-outfit font-black uppercase tracking-tight text-[#1A1A1A]">
                            Generation Pipeline
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Monitor · Retry · Audit
                        </p>
                    </div>
                </div>
                <AdminReportPipelineCard />
            </div>

            {/* Existing Hierarchy Reports */}
            <div className="w-full">
                <HierarchyReports />
            </div>
        </div>
    );
}
