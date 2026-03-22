'use client';

import { ZSkeleton } from '@quiz/ui';
import { Activity } from "lucide-react";
import dynamic from 'next/dynamic';

import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
const ServiceHealth = dynamic(() => import("@/components/dashboard/ServiceHealth").then(mod => ({ default: mod.ServiceHealth })), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });

export default function ServiceHealthPage() {
    return (
        <div className="max-w-[1600px] mx-auto">
            <DashboardPageHeader
                title="Service Health"
                description="Infrastructure Status • Database, Cache, and API Gateway Latency"
                icon={<Activity className="text-emerald-500" size={20} />}
            />
            <ServiceHealth />
        </div>
    );
}
