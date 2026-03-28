'use client';

import { ZSkeleton } from '@quiz/ui';
import { BarChart3 } from "lucide-react";
import dynamic from 'next/dynamic';

import { PageTitle } from '@/components/layout/PageTitle';
const PerformanceAnalyticsBoard = dynamic(() => import("@/components/dashboard/PerformanceAnalyticsBoard").then(mod => ({ default: mod.PerformanceAnalyticsBoard })), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });

export default function PerformancePage() {
    return (
        <div className="max-w-[1600px] mx-auto">
            <div className="pb-8 border-b border-slate-200/70 mb-8 pt-8 px-8">
                <div className="flex items-center gap-3 mb-2">
                    <BarChart3 size={20} className="text-[#FF4B91]" />
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF4B91]">Deep Analytics</span>
                </div>
                <PageTitle text="Performance Trends" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">
                    Domain Accuracy • Skill Gaps • Candidate Efficacy
                </p>
            </div>
            <PerformanceAnalyticsBoard />
        </div>
    );
}
