import { ZSkeleton } from '@quiz/ui';
import { Radio } from 'lucide-react';
import dynamic from 'next/dynamic';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
const LiveSessionsList = dynamic(() => import('@/components/dashboard/LiveSessionsList').then(mod => ({ default: mod.LiveSessionsList })), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });

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
