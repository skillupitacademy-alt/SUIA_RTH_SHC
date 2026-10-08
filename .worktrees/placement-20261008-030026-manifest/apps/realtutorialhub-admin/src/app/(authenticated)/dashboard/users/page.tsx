'use client';

import { Users } from 'lucide-react';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { UserAnalyticsPanel } from '@/components/dashboard/UserAnalyticsPanel';

export default function UserAnalyticsPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="User Intelligence"
                description="Analyze user growth, verification trends, and demographic distribution."
                icon={<Users className="text-blue-500" size={20} />}
            />

            <div className="p-2">
                <UserAnalyticsPanel />
            </div>
        </div>
    );
}
