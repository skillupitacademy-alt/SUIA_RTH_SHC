'use client';

import { PerformanceAnalyticsBoard } from "@/components/dashboard/PerformanceAnalyticsBoard";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

export default function PerformancePage() {
    return (
        <div className="max-w-[1600px] mx-auto">
            <DashboardPageHeader
                title="Performance Analytics"
                subtitle="Deep Dive into Domain Accuracy, Skill Gaps, and Candidate Efficacy"
            />
            <PerformanceAnalyticsBoard />
        </div>
    );
}
