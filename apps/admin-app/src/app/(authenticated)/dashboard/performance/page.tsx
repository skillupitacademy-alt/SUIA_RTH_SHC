'use client';

import { ZSkeleton } from '@quiz/ui';
import { BarChart3 } from "lucide-react";
import dynamic from 'next/dynamic';

import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
const PerformanceAnalyticsBoard = dynamic(() => import("@/components/dashboard/PerformanceAnalyticsBoard").then(mod => ({ default: mod.PerformanceAnalyticsBoard })), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });

export default function PerformancePage() {
    return (
        <div className="max-w-[1600px] mx-auto">
            <DashboardPageHeader
                title="Performance Analytics"
                description="Deep Dive into Domain Accuracy, Skill Gaps, and Candidate Efficacy"
                icon={<BarChart3 className="text-blue-600" size={20} />}
            />
            <PerformanceAnalyticsBoard />
        </div>
    );
}
