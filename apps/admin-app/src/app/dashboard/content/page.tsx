'use client';

import { ContentReadinessBoard } from "@/components/dashboard/ContentReadinessBoard";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

export default function ContentReadinessPage() {
    return (
        <div className="max-w-[1600px] mx-auto">
            <DashboardPageHeader
                title="Content Readiness"
                subtitle="Hierarchy Audit • Verify Domain, Subject, and Topic Question Pools"
            />
            <ContentReadinessBoard />
        </div>
    );
}
