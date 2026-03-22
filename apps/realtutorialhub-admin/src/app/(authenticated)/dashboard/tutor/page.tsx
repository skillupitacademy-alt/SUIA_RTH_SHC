'use client';

import { ZSkeleton } from '@quiz/ui';
import { Brain, MessagesSquare } from "lucide-react";
import dynamic from 'next/dynamic';

import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
const HelpRequestManager = dynamic(() => import('@/components/tutor/HelpRequestManager').then(mod => ({ default: mod.HelpRequestManager })), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });

export default function TutorAnalyticsPage() {
    return (
        <div className="space-y-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            <DashboardPageHeader
                title="Smart Tutor Operations"
                description="Live tactical center for managing student help requests and session interventions."
                icon={<Brain className="text-orange-500" size={20} />}
            />

            <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-sm">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-inner">
                            <MessagesSquare size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Intervention Queue</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Student Support Matrix</p>
                        </div>
                    </div>
                </div>
                <HelpRequestManager />
            </div>
        </div>
    );
}
