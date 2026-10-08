import { ZSkeleton } from '@quiz/ui';
import { ShieldAlert } from 'lucide-react';
import dynamic from 'next/dynamic';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
const SecurityHealthPanel = dynamic(() => import('@/components/dashboard/SecurityHealthPanel').then(mod => ({ default: mod.SecurityHealthPanel })), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });

export default function SecurityPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="Security Protocol"
                description="Monitor system threats, authentication attempts, and firewall status."
                icon={<ShieldAlert className="text-rose-500" size={20} />}
            />

            <div className="p-2">
                <SecurityHealthPanel />
            </div>
        </div>
    );
}
