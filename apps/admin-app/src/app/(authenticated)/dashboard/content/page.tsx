'use client';

import { ContentReadinessBoard } from "@/components/dashboard/ContentReadinessBoard";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { GraduationCap } from "lucide-react";

export default function ContentReadinessPage() {
    return (
        <div className="max-w-[1600px] mx-auto">
            <DashboardPageHeader
                title="Content Readiness"
                description="Hierarchy Audit • Verify Domain, Subject, and Topic Question Pools"
                icon={<GraduationCap className="text-indigo-600" size={20} />}
            />
            <ContentReadinessBoard />
        </div>
    );
}
