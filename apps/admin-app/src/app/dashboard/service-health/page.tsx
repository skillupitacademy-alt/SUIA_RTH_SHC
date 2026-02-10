'use client';

import { ServiceHealth } from "@/components/dashboard/ServiceHealth";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

export default function ServiceHealthPage() {
    return (
        <div className="max-w-[1600px] mx-auto">
            <DashboardPageHeader
                title="Service Health"
                subtitle="Infrastructure Status • Database, Cache, and API Gateway Latency"
            />
            <ServiceHealth />
        </div>
    );
}
