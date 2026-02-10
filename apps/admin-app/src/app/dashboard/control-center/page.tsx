'use client';

import { ControlCenterDeck } from "@/components/dashboard/ControlCenterDeck";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

export default function ControlCenterPage() {
    return (
        <div className="max-w-[1600px] mx-auto">
            <DashboardPageHeader
                title="Control Center"
                subtitle="Mission Vital Statistics & Global Health Monitoring"
            />
            <ControlCenterDeck />
        </div>
    );
}
