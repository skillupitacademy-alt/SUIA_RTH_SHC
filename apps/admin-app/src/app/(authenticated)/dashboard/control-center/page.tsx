'use client';

import { LayoutDashboard } from "lucide-react";

import { ControlCenterDeck } from "@/components/dashboard/ControlCenterDeck";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

export default function ControlCenterPage() {
    return (
        <div className="max-w-[1600px] mx-auto">
            <DashboardPageHeader
                title="Control Center"
                description="Mission Vital Statistics & Global Health Monitoring"
                icon={<LayoutDashboard className="text-[#FF4B91]" size={20} />}
            />
            <ControlCenterDeck />
        </div>
    );
}
