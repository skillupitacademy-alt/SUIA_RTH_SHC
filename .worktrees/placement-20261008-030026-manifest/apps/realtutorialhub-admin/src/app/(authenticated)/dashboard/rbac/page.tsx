import { ZSkeleton } from '@quiz/ui';
import { ShieldCheck } from 'lucide-react';
import dynamic from 'next/dynamic';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
const RBACGovernancePanel = dynamic(() => import('@/components/dashboard/RBACGovernancePanel').then(mod => ({ default: mod.RBACGovernancePanel })), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });

export default function RBACPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="RBAC Governance"
                description="Manage role distribution and access control policies."
                icon={<ShieldCheck className="text-indigo-500" size={20} />}
            />

            <div className="p-2">
                <RBACGovernancePanel />
            </div>
        </div>
    );
}
