'use client';

import { ServiceHealth } from "@/components/dashboard/ServiceHealth";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Activity } from "lucide-react";

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
