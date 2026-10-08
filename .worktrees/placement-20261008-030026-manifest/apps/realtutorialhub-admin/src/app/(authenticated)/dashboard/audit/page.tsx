import { ZSkeleton } from '@quiz/ui';
import { Activity } from 'lucide-react';
import dynamic from 'next/dynamic';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
const SystemAuditTerminal = dynamic(() => import('@/components/dashboard/SystemAuditTerminal').then(mod => ({ default: mod.SystemAuditTerminal })), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });

export default function AuditPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="System Audit Trail"
                description="Real-time stream of administrative actions and system events."
                icon={<Activity className="text-emerald-500" size={20} />}
            />

            <div className="p-2">
                <SystemAuditTerminal />
            </div>
        </div>
    );
}
