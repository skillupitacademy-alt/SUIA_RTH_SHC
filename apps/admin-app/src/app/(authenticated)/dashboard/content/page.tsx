'use client';

import { ZSkeleton } from '@quiz/ui';
import { GraduationCap } from "lucide-react";
import dynamic from 'next/dynamic';

const ContentReadinessBoard = dynamic(() => import("@/components/dashboard/ContentReadinessBoard").then(mod => ({ default: mod.ContentReadinessBoard })), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

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
