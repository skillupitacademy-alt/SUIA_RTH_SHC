'use client';

import { ShieldCheck } from 'lucide-react';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { RBACGovernancePanel } from '@/components/dashboard/RBACGovernancePanel';

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
