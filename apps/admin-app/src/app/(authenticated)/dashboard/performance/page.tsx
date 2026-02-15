'use client';

import { BarChart3 } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { PerformanceAnalyticsBoard } from "@/components/dashboard/PerformanceAnalyticsBoard";

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
