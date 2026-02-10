'use client';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { LiveSessionsList } from '@/components/dashboard/LiveSessionsList';
import { Radio } from 'lucide-react';

export default function LiveSessionsPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="Live Operations"
                description="Monitor active candidate sessions and real-time exam progress."
                icon={<Radio className="text-rose-500 animate-pulse" size={20} />}
            />

            <div className="p-2">
                <LiveSessionsList />
            </div>
        </div>
    );
}
